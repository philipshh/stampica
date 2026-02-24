
import JSZip from 'jszip';

export interface PosterProject {
    id: string;
    name: string;
    options: any; // DitherOptions
    assetId?: string; // Legacy: Single image asset
    assetIds?: string[]; // Multiple image assets
    timestamp: number;
}

export interface ImageAsset {
    id: string;
    blob: Blob;
    thumbnailBlob?: Blob;
    timestamp: number;
}

const DB_NAME = 'PostersVSDatabase';
const STORE_PROJECTS = 'projects';
const STORE_ASSETS = 'assets';
const DB_VERSION = 2; // Incremented for folder structure change

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
                db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_ASSETS)) {
                db.createObjectStore(STORE_ASSETS, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

// --- Project Operations ---

export const saveProject = async (project: PosterProject): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PROJECTS, 'readwrite');
        const store = transaction.objectStore(STORE_PROJECTS);
        const request = store.put(project);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getAllProjects = async (): Promise<PosterProject[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PROJECTS, 'readonly');
        const store = transaction.objectStore(STORE_PROJECTS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteProject = async (id: string): Promise<void> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_PROJECTS, STORE_ASSETS], 'readwrite');

        // Delete project
        transaction.objectStore(STORE_PROJECTS).delete(id);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getProject = async (id: string): Promise<PosterProject | undefined> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PROJECTS, 'readonly');
        const store = transaction.objectStore(STORE_PROJECTS);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// --- Asset Operations ---

export const saveAsset = async (asset: ImageAsset): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_ASSETS, 'readwrite');
        const store = transaction.objectStore(STORE_ASSETS);
        const request = store.put(asset);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getAsset = async (id: string): Promise<ImageAsset | undefined> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_ASSETS, 'readonly');
        const store = transaction.objectStore(STORE_ASSETS);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// --- Image Processing Utilities ---

export const compressImage = async (file: File | Blob, options: { maxWidth?: number, quality?: number, type?: string } = {}): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;

            if (options.maxWidth && width > options.maxWidth) {
                const ratio = options.maxWidth / width;
                width = options.maxWidth;
                height = height * ratio;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No canvas context');

            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => blob ? resolve(blob) : reject('Compression failed'),
                options.type || 'image/webp',
                options.quality || 0.8
            );
        };
        img.onerror = () => reject('Image load failed');
        img.src = url;
    });
};

// --- Backup Operations ---

export const exportProjectBackup = async (): Promise<Blob> => {
    const zip = new JSZip();
    const projects = await getAllProjects();
    const manifest = {
        app: "PosterCreator",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        format: "zip-assets-v1"
    };

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // Clean templates for export (ensure no base64 snuck in)
    const exportTemplates = projects.map(p => ({
        ...p,
        imageDataUrl: undefined // Ensure legacy data is removed
    }));
    zip.file('templates.json', JSON.stringify(exportTemplates, null, 2));

    const photosDir = zip.folder('photos');
    const thumbsDir = zip.folder('thumbnails');

    const allAssetIds = new Set<string>();
    projects.forEach(p => {
        if (p.assetId) allAssetIds.add(p.assetId);
        if (p.assetIds) p.assetIds.forEach(id => allAssetIds.add(id));
    });

    const assetIds = Array.from(allAssetIds);

    for (const id of assetIds) {
        const asset = await getAsset(id);
        if (asset) {
            if (asset.blob) {
                photosDir?.file(`${id}.webp`, asset.blob);
            }
            if (asset.thumbnailBlob) {
                thumbsDir?.file(`${id}.webp`, asset.thumbnailBlob);
            }
        }
    }

    return await zip.generateAsync({ type: 'blob' });
};

export const importProjectBackup = async (zipBlob: Blob): Promise<void> => {
    const zip = await JSZip.loadAsync(zipBlob);

    const manifestStr = await zip.file('manifest.json')?.async('string');
    if (!manifestStr) throw new Error('Invalid backup: manifest.json missing');

    const templatesStr = await zip.file('templates.json')?.async('string');
    if (!templatesStr) throw new Error('Invalid backup: templates.json missing');

    const templates = JSON.parse(templatesStr) as PosterProject[];

    // Import assets
    const photosDir = zip.folder('photos');
    const thumbsDir = zip.folder('thumbnails');

    const assetIds = Array.from(new Set(templates.map(p => p.assetId).filter(Boolean))) as string[];

    for (const id of assetIds) {
        const photoFile = photosDir?.file(`${id}.webp`);
        const thumbFile = thumbsDir?.file(`${id}.webp`);

        if (photoFile) {
            const photoBlob = await photoFile.async('blob');
            const thumbBlob = thumbFile ? await thumbFile.async('blob') : undefined;

            await saveAsset({
                id,
                blob: photoBlob,
                thumbnailBlob: thumbBlob,
                timestamp: Date.now()
            });
        }
    }

    // Import projects
    for (const project of templates) {
        await saveProject(project);
    }
};
