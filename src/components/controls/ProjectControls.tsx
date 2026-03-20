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
    isAdmin?: boolean;
}

import { SectionCard } from './SectionCard';

const ProjectCard: React.FC<{
    project: PosterProject;
    onLoad: (p: PosterProject) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}> = ({ project, onLoad, onDelete }) => {
    const [thumbUrl, setThumbUrl] = useState<string | null>(null);

    useEffect(() => {
        let url: string | null = null;
        if (project.assetId) {
            getAsset(project.assetId).then(asset => {
                if (asset?.thumbnailBlob) { url = URL.createObjectURL(asset.thumbnailBlob); setThumbUrl(url); }
                else if (asset?.blob) { url = URL.createObjectURL(asset.blob); setThumbUrl(url); }
            });
        }
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [project.assetId]);

    return (
        <button onClick={() => onLoad(project)}
            className="group w-full bg-neutral-800 border border-neutral-700 hover:border-neutral-500 p-3 rounded-xl text-left transition-all flex gap-3 items-center">
            <div className="w-10 h-14 bg-neutral-700 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {thumbUrl
                    ? <img src={thumbUrl} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                    : <FolderOpen className="w-4 h-4 text-neutral-500" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-neutral-200 truncate">{project.name}</div>
                <div className="flex items-center gap-1 mt-1 text-neutral-500 text-[9px]">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(project.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="mt-0.5 text-[9px] text-neutral-600 truncate">{project.options.poster.title || 'Untitled'}</div>
            </div>
            <button onClick={e => onDelete(project.id, e)} className="p-1.5 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </button>
    );
};

export const ProjectControls: React.FC<ProjectControlsProps> = ({ options, imageFile, onProjectLoad, isAdmin = false }) => {
    const [projects, setProjects] = useState<PosterProject[]>([]);
    const [projectName, setProjectName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const loadProjects = async () => {
        try {
            const all = await getAllProjects();
            setProjects(all.sort((a, b) => b.timestamp - a.timestamp));
        } catch (err) {
            console.error('Failed to load projects:', err);
        }
    };

    useEffect(() => { loadProjects(); }, []);

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
                await saveAsset({ id, blob: photoBlob, thumbnailBlob: thumbBlob, timestamp: Date.now() });
                assetIds.push(id);
                (currentOptions as any).assetId = id;
            } else if (options.imageMode === 'grid') {
                for (let i = 0; i < currentOptions.grid.images.length; i++) {
                    const slot = currentOptions.grid.images[i];
                    const originalSlot = options.grid.images[i];
                    if (originalSlot.file) {
                        const id = crypto.randomUUID();
                        const photoBlob = await compressImage(originalSlot.file, { maxWidth: 2000, quality: 0.8 });
                        const thumbBlob = await compressImage(originalSlot.file, { maxWidth: 300, quality: 0.6 });
                        await saveAsset({ id, blob: photoBlob, thumbnailBlob: thumbBlob, timestamp: Date.now() });
                        (slot as any).assetId = id;
                        assetIds.push(id);
                    }
                }
            }

            await saveProject({ id: Date.now().toString(), name, options: currentOptions, assetId: assetIds[0], assetIds, timestamp: Date.now() });
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
        if (!confirm('Delete this project?')) return;
        try { await deleteProject(id); await loadProjects(); }
        catch (err) { console.error('Failed to delete project:', err); }
    };

    const handleBackup = async () => {
        setIsLoading(true);
        try {
            const zipBlob = await exportProjectBackup();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(zipBlob);
            a.download = `poster-backup-${new Date().toISOString().split('T')[0]}.zip`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (err) { alert('Backup failed'); }
        finally { setIsLoading(false); }
    };

    const handleRestore = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.onchange = async e => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            setIsLoading(true);
            try { await importProjectBackup(file); await loadProjects(); alert('Projects restored!'); }
            catch { alert('Restore failed: Invalid ZIP backup'); }
            finally { setIsLoading(false); }
        };
        input.click();
    };

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
            <SectionCard title="Save design" spacing="sm">
                <div className="flex gap-2">
                    <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
                        placeholder="Project name..."
                        className="flex-1 bg-neutral-800 border border-neutral-700 text-white px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-neutral-500 transition-colors" />
                    <button onClick={handleSaveProject} disabled={isLoading}
                        className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                        <Save className="w-3 h-3" />
                        {isLoading ? '…' : 'Save'}
                    </button>
                </div>
            </SectionCard>

            {isAdmin && <SectionCard title="Backup" spacing="sm">
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleBackup} disabled={isLoading}
                        className="flex items-center justify-center gap-2 py-2.5 bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-all rounded-lg text-xs disabled:opacity-50">
                        <Download className="w-3.5 h-3.5" /> Export ZIP
                    </button>
                    <button onClick={handleRestore} disabled={isLoading}
                        className="flex items-center justify-center gap-2 py-2.5 bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-all rounded-lg text-xs disabled:opacity-50">
                        <Upload className="w-3.5 h-3.5" /> Import ZIP
                    </button>
                </div>
            </SectionCard>}

            <SectionCard title={`Saved projects${projects.length > 0 ? ` (${projects.length})` : ''}`} spacing="sm">
                {projects.length === 0 ? (
                    <div className="text-center py-6 text-neutral-600 space-y-2">
                        <FolderOpen className="w-7 h-7 mx-auto opacity-30" />
                        <p className="text-xs text-neutral-600">No saved projects yet</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar -mx-1 px-1">
                        {projects.map(project => (
                            <ProjectCard key={project.id} project={project} onLoad={onProjectLoad} onDelete={handleDeleteProject} />
                        ))}
                    </div>
                )}
            </SectionCard>
        </div>
    );
};
