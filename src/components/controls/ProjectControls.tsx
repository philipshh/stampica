import React, { useState, useEffect } from 'react';
import { DitherOptions } from '../../lib/dither';
import {
    PosterProject,
    getAllProjects,
    saveProject,
    deleteProject,
    exportProjectBackup,
    importProjectBackup,
    saveAsset,
    getAsset,
    compressImage
} from '../../lib/storage';
import { Save, FolderOpen, Trash2, Clock, Download, Upload } from 'lucide-react';

interface ProjectControlsProps {
    options: DitherOptions;
    imageFile: File | null;
    onProjectLoad: (project: PosterProject) => void;
}

// Sub-component to handle thumbnail loading
const ProjectCard: React.FC<{
    project: PosterProject,
    onLoad: (p: PosterProject) => void,
    onDelete: (id: string, e: React.MouseEvent) => void
}> = ({ project, onLoad, onDelete }) => {
    const [thumbUrl, setThumbUrl] = useState<string | null>(null);

    useEffect(() => {
        let url: string | null = null;
        if (project.assetId) {
            getAsset(project.assetId).then(asset => {
                if (asset?.thumbnailBlob) {
                    url = URL.createObjectURL(asset.thumbnailBlob);
                    setThumbUrl(url);
                } else if (asset?.blob) {
                    url = URL.createObjectURL(asset.blob);
                    setThumbUrl(url);
                }
            });
        }
        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [project.assetId]);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <button
            onClick={() => onLoad(project)}
            className="group w-full bg-neutral-900/50 border border-neutral-800 hover:border-neutral-600 p-3 rounded-lg text-left transition-all hover:bg-neutral-900 flex gap-3 items-center"
        >
            <div className="w-12 h-16 bg-neutral-800 rounded overflow-hidden flex-shrink-0 border border-neutral-800 flex items-center justify-center">
                {thumbUrl ? (
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <FolderOpen className="w-4 h-4 text-neutral-600" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate group-hover:text-white transition-colors">
                    {project.name}
                </div>
                <div className="flex items-center gap-1 mt-1 text-neutral-500 text-[9px] uppercase tracking-tighter">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(project.timestamp)}
                </div>
                <div className="mt-1 text-[8px] text-neutral-600 uppercase truncate">
                    {project.options.poster.title || 'Untitled'}
                </div>
            </div>

            <button
                onClick={(e) => onDelete(project.id, e)}
                className="p-2 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </button>
    );
};

export const ProjectControls: React.FC<ProjectControlsProps> = ({
    options,
    imageFile,
    onProjectLoad
}) => {
    const [projects, setProjects] = useState<PosterProject[]>([]);
    const [projectName, setProjectName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const loadProjects = async () => {
        try {
            const allProjects = await getAllProjects();
            setProjects(allProjects.sort((a, b) => b.timestamp - a.timestamp));
        } catch (err) {
            console.error('Failed to load projects:', err);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const handleSaveProject = async () => {
        const name = projectName.trim() || `Project ${new Date().toLocaleDateString()}`;
        setIsLoading(true);

        try {
            const assetIds: string[] = [];
            const currentOptions = JSON.parse(JSON.stringify(options)) as DitherOptions;

            if (options.imageMode === 'single' && imageFile) {
                const id = crypto.randomUUID();
                const photoBlob = await compressImage(imageFile, { maxWidth: 2400, quality: 0.85 });
                const thumbBlob = await compressImage(imageFile, { maxWidth: 300, quality: 0.6 });

                await saveAsset({
                    id,
                    blob: photoBlob,
                    thumbnailBlob: thumbBlob,
                    timestamp: Date.now()
                });

                assetIds.push(id);
                // In single mode, we set a top-level assetId in options for easier access
                (currentOptions as any).assetId = id;
            } else if (options.imageMode === 'grid') {
                // Save assets for each grid slot that has a file
                for (let i = 0; i < currentOptions.grid.images.length; i++) {
                    const slot = currentOptions.grid.images[i];
                    const originalSlot = options.grid.images[i];

                    if (originalSlot.file) {
                        const id = crypto.randomUUID();
                        const photoBlob = await compressImage(originalSlot.file, { maxWidth: 2000, quality: 0.8 });
                        const thumbBlob = await compressImage(originalSlot.file, { maxWidth: 300, quality: 0.6 });

                        await saveAsset({
                            id,
                            blob: photoBlob,
                            thumbnailBlob: thumbBlob,
                            timestamp: Date.now()
                        });

                        // Inject assetId into the slot so we can load it back
                        (slot as any).assetId = id;
                        assetIds.push(id);
                    }
                }
            }

            const newProject: PosterProject = {
                id: Date.now().toString(),
                name,
                options: currentOptions,
                assetId: assetIds[0], // Backwards compat/Thumbnail
                assetIds: assetIds,
                timestamp: Date.now()
            };

            await saveProject(newProject);
            setProjectName('');
            await loadProjects();
        } catch (err) {
            console.error('Failed to save project:', err);
            alert('Failed to save project');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            await deleteProject(id);
            await loadProjects();
        } catch (err) {
            console.error('Failed to delete project:', err);
        }
    };

    const handleBackup = async () => {
        setIsLoading(true);
        try {
            const zipBlob = await exportProjectBackup();
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `poster-backup-${new Date().toISOString().split('T')[0]}.zip`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Backup failed:', err);
            alert('Backup failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            setIsLoading(true);
            try {
                await importProjectBackup(file);
                await loadProjects();
                alert('Projects restored successfully from ZIP!');
            } catch (err) {
                console.error('Restore failed:', err);
                alert('Restore failed: Invalid ZIP backup');
            } finally {
                setIsLoading(false);
            }
        };
        input.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
            {/* Save Section */}
            <div className="space-y-2">
                <label className="text-[10px] text-neutral-400 tracking-wider font-bold uppercase">Save Current Design</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Project name..."
                        className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600 rounded"
                    />
                    <button
                        onClick={handleSaveProject}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white text-black text-[10px] font-bold uppercase rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        <Save className="w-3 h-3" />
                        {isLoading ? '...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Backup/Restore Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                    onClick={handleBackup}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 py-2 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all rounded text-[9px] uppercase font-bold disabled:opacity-50"
                >
                    <Download className="w-3 h-3" />
                    Export ZIP
                </button>
                <button
                    onClick={handleRestore}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 py-2 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all rounded text-[9px] uppercase font-bold disabled:opacity-50"
                >
                    <Upload className="w-3 h-3" />
                    Import ZIP
                </button>
            </div>

            {/* Project List */}
            <div className="space-y-4 pt-4 border-t border-neutral-800">
                <label className="text-[10px] text-neutral-400 tracking-wider font-bold uppercase">Saved Projects ({projects.length})</label>

                {projects.length === 0 ? (
                    <div className="text-center py-8 text-neutral-600 space-y-2">
                        <FolderOpen className="w-8 h-8 mx-auto opacity-20" />
                        <p className="text-[10px] uppercase tracking-widest">No saved projects yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                        {projects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onLoad={onProjectLoad}
                                onDelete={handleDeleteProject}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-neutral-900/30 rounded-lg border border-neutral-800/50">
                <p className="text-[9px] text-neutral-500 leading-relaxed uppercase tracking-widest text-center">
                    ZIP Backups contain compressed WebP assets and JSON templates.
                </p>
            </div>
        </div>
    );
};
