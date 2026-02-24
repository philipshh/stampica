import React from 'react';
import { DitherOptions } from '../../lib/dither';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { MATERIAL_ICONS_LIST } from '../../lib/materialIcons';

interface DesignControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
    onMovieSelect: (movie: { title: string; director: string; year: string; plot: string; posterUrl: string; actors?: string }) => void;
}

export const DesignControls: React.FC<DesignControlsProps> = ({ options, onOptionsChange, onMovieSelect }) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const searchMovies = async () => {
        if (!options.omdbApiKey) {
            setError('Please enter an OMDb API key');
            return;
        }
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`https://www.omdbapi.com/?apikey=${options.omdbApiKey}&s=${encodeURIComponent(searchQuery)}&type=movie`);
            const data = await response.json();
            if (data.Response === 'True') {
                setSearchResults(data.Search);
            } else {
                setError(data.Error);
                setSearchResults([]);
            }
        } catch (err) {
            setError('Failed to fetch movies');
        } finally {
            setIsLoading(false);
        }
    };

    const selectMovie = async (imdbID: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://www.omdbapi.com/?apikey=${options.omdbApiKey}&i=${imdbID}&plot=short`);
            const data = await response.json();
            if (data.Response === 'True') {
                onMovieSelect({
                    title: data.Title,
                    director: data.Director,
                    year: data.Year,
                    plot: data.Plot,
                    posterUrl: data.Poster,
                    actors: data.Actors
                });
                setSearchResults([]);
                setSearchQuery('');
            }
        } catch (err) {
            setError('Failed to fetch movie details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSurpriseMe = () => {
        const curatedMovies = [
            'tt0111161', 'tt0068646', 'tt0468569', 'tt0071562', 'tt0050083',
            'tt0108052', 'tt0167260', 'tt0110912', 'tt0167261', 'tt0060196',
            'tt0137523', 'tt0120737', 'tt0109830', 'tt1375666', 'tt0076759',
            'tt0080684', 'tt0099685', 'tt0133093', 'tt0073486', 'tt0047478',
        ];
        const randomId = curatedMovies[Math.floor(Math.random() * curatedMovies.length)];
        selectMovie(randomId);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
            {/* Design Mode Selector */}
            <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 tracking-wider">Design Mode</label>
                <div className="grid grid-cols-2 gap-1">
                    <button
                        onClick={() => onOptionsChange({ ...options, designMode: 'poster' })}
                        className={`py-2 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.designMode === 'poster' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                    >
                        Poster
                    </button>
                    <button
                        onClick={() => onOptionsChange({ ...options, designMode: 'tshirt' })}
                        className={`py-2 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.designMode === 'tshirt' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                    >
                        T-Shirt
                    </button>
                </div>
            </div>

            {options.designMode === 'poster' && (
                <>
                    {/* Movie Search Section */}
                    <div className="p-3 bg-neutral-900/50 rounded-lg border border-neutral-800 space-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider flex justify-between">
                                <span>OMDb Key</span>
                                <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors">Get ↗</a>
                            </label>
                            <input
                                type="password"
                                value={options.omdbApiKey || ''}
                                onChange={(e) => onOptionsChange({ ...options, omdbApiKey: e.target.value })}
                                placeholder="Key"
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-1.5 text-xs focus:outline-none focus:border-neutral-600 rounded"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider">Search Movie</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchMovies()}
                                    placeholder="Movie title..."
                                    className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-2 py-1.5 text-xs focus:outline-none focus:border-neutral-600 rounded"
                                />
                                <button
                                    onClick={searchMovies}
                                    disabled={isLoading}
                                    className="px-3 py-1.5 bg-white text-black text-xs font-medium rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                                >
                                    {isLoading ? '...' : 'Search'}
                                </button>
                            </div>
                            <button
                                onClick={handleSurpriseMe}
                                disabled={isLoading}
                                className="w-full mt-2 px-3 py-1.5 bg-neutral-800 text-neutral-300 text-xs font-medium rounded hover:bg-neutral-700 hover:text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <span>🎲</span> Surprise Me
                            </button>
                        </div>

                        {error && <div className="text-[10px] text-red-400">{error}</div>}

                        {searchResults.length > 0 && (
                            <div className="max-h-40 overflow-y-auto custom-scrollbar border border-neutral-800 rounded bg-neutral-900">
                                {searchResults.map((movie) => (
                                    <button
                                        key={movie.imdbID}
                                        onClick={() => selectMovie(movie.imdbID)}
                                        className="w-full text-left px-2 py-1.5 text-xs hover:bg-neutral-800 transition-colors flex justify-between items-center group"
                                    >
                                        <span className="truncate pr-2 text-neutral-300 group-hover:text-white">{movie.Title}</span>
                                        <span className="text-neutral-500 text-[10px] flex-shrink-0">{movie.Year}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-neutral-800 my-4" />

                    {/* Text Fields */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider">Director</label>
                            <input
                                type="text"
                                value={options.poster.director}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, director: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider flex justify-between items-center">
                                <span>Title</span>
                                <div className="flex gap-1">
                                    {(['left', 'center', 'right'] as const).map((align) => (
                                        <button
                                            key={align}
                                            onClick={() => onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, titleAlignment: align }
                                            })}
                                            className={`p-1 rounded hover:bg-neutral-800 transition-colors ${options.poster.titleAlignment === align ? 'text-white bg-neutral-800' : 'text-neutral-500'}`}
                                            title={`Align ${align}`}
                                        >
                                            {align === 'left' && <AlignLeft className="w-3 h-3" />}
                                            {align === 'center' && <AlignCenter className="w-3 h-3" />}
                                            {align === 'right' && <AlignRight className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            </label>
                            <input
                                type="text"
                                value={options.poster.title}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, title: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider">Subtitle</label>
                            <input
                                type="text"
                                value={options.poster.subtitle}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, subtitle: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider">Year</label>
                            <input
                                type="text"
                                value={options.poster.year}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, year: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] text-neutral-400 tracking-wider">Description</label>
                            <textarea
                                value={options.poster.description[0] || ''}
                                onChange={(e) => {
                                    const newDesc = [e.target.value];
                                    onOptionsChange({
                                        ...options,
                                        poster: { ...options.poster, description: newDesc, descriptionColumns: 1 }
                                    });
                                }}
                                rows={3}
                                placeholder="Description..."
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600 resize-none"
                            />
                        </div>

                        {/* List Content */}
                        <div className="space-y-2 pt-2 border-t border-neutral-800">
                            <label className="text-[10px] text-neutral-400 tracking-wider flex justify-between items-center">
                                <span>List Content</span>
                                <div className="flex gap-2 items-center">
                                    {/* Columns Selector */}
                                    <div className="flex items-center gap-1 bg-neutral-900 rounded border border-neutral-800 px-1 h-6">
                                        <span className="text-[8px] text-neutral-500 uppercase">Cols</span>
                                        <select
                                            value={options.poster.listSection.columns || 1}
                                            onChange={(e) => onOptionsChange({
                                                ...options,
                                                poster: {
                                                    ...options.poster,
                                                    listSection: { ...options.poster.listSection, columns: Number(e.target.value) as 1 | 2 | 3 | 4 }
                                                }
                                            })}
                                            className="bg-transparent text-white text-[10px] focus:outline-none appearance-none cursor-pointer w-4 text-center"
                                        >
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                            <option value={4}>4</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-1">
                                        {(['left', 'center', 'right'] as const).map((align) => (
                                            <button
                                                key={align}
                                                onClick={() => onOptionsChange({
                                                    ...options,
                                                    poster: {
                                                        ...options.poster,
                                                        listSection: { ...options.poster.listSection, alignment: align }
                                                    }
                                                })}
                                                className={`p-1 rounded hover:bg-neutral-800 transition-colors ${options.poster.listSection.alignment === align ? 'text-white bg-neutral-800' : 'text-neutral-500'}`}
                                                title={`Align ${align}`}
                                            >
                                                {align === 'left' && <AlignLeft className="w-3 h-3" />}
                                                {align === 'center' && <AlignCenter className="w-3 h-3" />}
                                                {align === 'right' && <AlignRight className="w-3 h-3" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </label>
                            <textarea
                                value={options.poster.listSection.content.join('\n')}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: {
                                        ...options.poster,
                                        listSection: {
                                            ...options.poster.listSection,
                                            content: e.target.value.split('\n')
                                        }
                                    }
                                })}
                                rows={5}
                                placeholder="Enter items (one per line)..."
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600 resize-none font-mono"
                            />
                        </div>
                    </div>
                    {/* Icon Section */}
                    <div className="space-y-4 pt-4 border-t border-neutral-800">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] text-neutral-400 tracking-wider font-bold">Icon Section</label>
                        </div>

                        {/* Icon Size */}
                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider block">Icon Size</label>
                            <div className="flex gap-1 items-center">
                                {[24, 32, 48, 64].map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => onOptionsChange({
                                            ...options,
                                            poster: {
                                                ...options.poster,
                                                iconSection: { ...options.poster.iconSection, iconSize: size }
                                            }
                                        })}
                                        className={`flex-1 py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.poster.iconSection.iconSize === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                    >
                                        {size}
                                    </button>
                                ))}
                                <input
                                    type="number"
                                    value={options.poster.iconSection.iconSize}
                                    onChange={(e) => onOptionsChange({
                                        ...options,
                                        poster: {
                                            ...options.poster,
                                            iconSection: { ...options.poster.iconSection, iconSize: parseInt(e.target.value) || 24 }
                                        }
                                    })}
                                    className="w-12 py-1 bg-neutral-900 border border-neutral-800 text-white text-[10px] text-center focus:outline-none focus:border-neutral-600 rounded"
                                />
                            </div>
                        </div>

                        {/* Icon Alignment */}
                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider block">Alignment</label>
                            <div className="grid grid-cols-3 gap-1">
                                {(['left', 'center', 'right'] as const).map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => onOptionsChange({
                                            ...options,
                                            poster: {
                                                ...options.poster,
                                                iconSection: { ...options.poster.iconSection, alignment: align }
                                            }
                                        })}
                                        className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.iconSection.alignment === align ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                    >
                                        {align}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Icon Items */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-neutral-400 tracking-wider block">Items (Icon + Text)</label>
                            <datalist id="material-icons-list">
                                {MATERIAL_ICONS_LIST.map(icon => (
                                    <option key={icon} value={icon} />
                                ))}
                            </datalist>
                            {options.poster.iconSection.items.map((item, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="w-1/3 relative">
                                        <input
                                            list="material-icons-list"
                                            type="text"
                                            value={item.icon}
                                            onChange={(e) => {
                                                const newItems = [...options.poster.iconSection.items];
                                                newItems[index] = { ...item, icon: e.target.value };
                                                onOptionsChange({
                                                    ...options,
                                                    poster: {
                                                        ...options.poster,
                                                        iconSection: { ...options.poster.iconSection, items: newItems }
                                                    }
                                                });
                                            }}
                                            className="w-full bg-neutral-900 border border-neutral-800 text-white py-1.5 px-2 text-[10px] focus:outline-none focus:border-neutral-600 rounded"
                                            placeholder="icon_name"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={item.text}
                                        onChange={(e) => {
                                            const newItems = [...options.poster.iconSection.items];
                                            newItems[index] = { ...item, text: e.target.value };
                                            onOptionsChange({
                                                ...options,
                                                poster: {
                                                    ...options.poster,
                                                    iconSection: { ...options.poster.iconSection, items: newItems }
                                                }
                                            });
                                        }}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-2 py-1.5 text-[10px] focus:outline-none focus:border-neutral-600 rounded"
                                        placeholder="Text"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
