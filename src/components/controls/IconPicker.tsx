import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Search, X, Loader2 } from 'lucide-react';

interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
    iconColor?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, iconColor = 'currentColor' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initial popular icons or recent search
    const popularIcons = useMemo(() => [
        'material-symbols:home-outline', 'material-symbols:search', 'material-symbols:settings-outline',
        'material-symbols:favorite-outline', 'material-symbols:menu', 'material-symbols:close',
        'lucide:activity', 'lucide:heart', 'lucide:star', 'lucide:bolt', 'lucide:music', 'lucide:camera',
        'ph:heart-bold', 'ph:star-bold', 'ph:smiley-bold', 'ph:pencil-circle-bold',
        'tabler:brand-github', 'tabler:brand-twitter', 'tabler:brand-instagram'
    ], []);

    const performSearch = useCallback(async (query: string) => {
        if (!query) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        try {
            // Iconify Search API - hits 200,000+ icons from every set
            const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=60`);
            const data = await response.json();
            if (data && data.icons) {
                setSearchResults(data.icons);
            }
        } catch (error) {
            console.error('Iconify search failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search) performSearch(search);
        }, 400);
        return () => clearTimeout(timer);
    }, [search, performSearch]);

    const displayIcons = search ? searchResults : popularIcons;

    return (
        <div className="relative w-full">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white py-1.5 px-2 text-[10px] focus:outline-none focus:border-neutral-600 rounded flex items-center gap-2 cursor-pointer hover:border-neutral-700 transition-colors"
            >
                <div className="flex items-center justify-center w-5 h-5" style={{ color: iconColor }}>
                    {value ? <Icon icon={value} className="text-base" /> : <Icon icon="material-symbols:help-outline" className="text-base" />}
                </div>
                <span className="truncate flex-1 uppercase tracking-widest text-[9px] opacity-70">
                    {value ? value.split(':').pop()?.replace(/-/g, ' ') : 'Select icon...'}
                </span>
                <span className="text-neutral-500 text-[8px]">▼</span>
            </div>

            {isOpen && (
                <div className="absolute z-50 top-full mt-1 left-0 w-[300px] bg-black border border-neutral-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-neutral-800 flex items-center gap-2 bg-neutral-900/50">
                        {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 text-neutral-500 animate-spin" />
                        ) : (
                            <Search className="w-3.5 h-3.5 text-neutral-500" />
                        )}
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search 200,000+ icons..."
                            className="flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-neutral-600"
                            onClick={(e) => e.stopPropagation()}
                        />
                        {search && (
                            <button onClick={() => setSearch('')}>
                                <X className="w-3.5 h-3.5 text-neutral-500 hover:text-white" />
                            </button>
                        )}
                    </div>

                    <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                        {!search && (
                            <div className="px-1 py-1 text-[8px] uppercase tracking-widest text-neutral-500 font-bold mb-2">Suggestions</div>
                        )}
                        <div className="grid grid-cols-6 gap-1">
                            {displayIcons.map((icon) => (
                                <button
                                    key={icon}
                                    onClick={() => {
                                        onChange(icon);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`p-2 rounded hover:bg-neutral-800 transition-all flex items-center justify-center group ${value === icon ? 'bg-neutral-800 ring-1 ring-neutral-500' : ''}`}
                                    title={icon}
                                >
                                    <div className="group-hover:scale-125 transition-transform duration-200">
                                        <Icon icon={icon} className="text-xl" />
                                    </div>
                                </button>
                            ))}
                        </div>
                        {search && !isLoading && searchResults.length === 0 && (
                            <div className="p-8 text-center text-[10px] text-neutral-500 italic">
                                No icons found in the universe...
                            </div>
                        )}
                    </div>
                    <div className="p-2 border-t border-neutral-900 bg-neutral-900/30 text-center">
                        <span className="text-[7px] uppercase tracking-widest text-neutral-600">Accessing Iconify Global Database</span>
                    </div>
                </div>
            )}

            {/* Backdrop to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};
