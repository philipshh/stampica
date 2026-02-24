import React from 'react';
import { DitherOptions } from '../../lib/dither';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { IconPicker } from './IconPicker';
import { GridControls } from './GridControls';

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
            const response = await fetch(`https://www.omdbapi.com/?apikey=${options.omdbApiKey}&s=${encodeURIComponent(searchQuery)}`);
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
                // TV shows often don't have a "Director". Fallback to Writer or first Actor.
                let director = data.Director;
                if (!director || director === 'N/A') {
                    director = data.Writer && data.Writer !== 'N/A' ? data.Writer : (data.Actors ? data.Actors.split(',')[0] : 'N/A');
                }

                onMovieSelect({
                    title: data.Title,
                    director: director,
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

    const handleEngineChange = (engine: 'classic' | 'dg') => {
        const dgSupported = ['atkinson', 'floyd', 'stucki', 'threshold'];
        const classicSupported = ['none', 'atkinson', 'threshold'];
        let algo = options.algorithm;
        if (engine === 'dg' && !dgSupported.includes(algo)) {
            algo = 'atkinson' as any;
        } else if (engine === 'classic' && !classicSupported.includes(algo)) {
            algo = 'atkinson' as any;
        }
        onOptionsChange({ ...options, engine, algorithm: algo as any });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
            {/* Engine Selector - High Level Setting */}
            <div className="space-y-2">
                <label className="text-[10px] text-neutral-400 tracking-wider uppercase">Engine</label>
                <div className="grid grid-cols-2 gap-1">
                    <button
                        onClick={() => handleEngineChange('classic')}
                        className={`py-2 text-[10px] border transition-all uppercase ${(!options.engine || options.engine === 'classic')
                            ? 'bg-white text-black border-white font-bold'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600'
                            }`}
                    >
                        Classic
                    </button>
                    <button
                        onClick={() => handleEngineChange('dg')}
                        className={`py-2 text-[10px] border transition-all uppercase ${options.engine === 'dg'
                            ? 'bg-white text-black border-white font-bold'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600'
                            }`}
                    >
                        DitherGarden
                    </button>
                </div>
            </div>

            {/* Image Mode Selector */}
            <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 tracking-wider">Image Mode</label>
                <div className="grid grid-cols-2 gap-1">
                    <button
                        onClick={() => onOptionsChange({ ...options, imageMode: 'single' })}
                        className={`py-2 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.imageMode === 'single' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500'}`}
                    >
                        Single Image
                    </button>
                    <button
                        onClick={() => onOptionsChange({ ...options, imageMode: 'grid' })}
                        className={`py-2 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.imageMode === 'grid' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500'}`}
                    >
                        Multi-Image Grid
                    </button>
                </div>
            </div>

            {options.imageMode === 'grid' && (
                <GridControls options={options} onOptionsChange={onOptionsChange} />
            )}

            {/* Design Mode Selector */}
            <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 tracking-wider uppercase">Design Mode</label>
                <div className="grid grid-cols-2 gap-1">
                    <button
                        onClick={() => onOptionsChange({
                            ...options,
                            designMode: 'poster',
                            poster: {
                                ...options.poster,
                                showHeader: true,
                                showTitle: true,
                                showFooter: true,
                                listSection: { ...options.poster.listSection, enabled: false },
                                iconSection: { ...options.poster.iconSection, enabled: false },
                                imagePadding: 'same-as-poster'
                            }
                        })}
                        className={`py-2 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.designMode === 'poster' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500'}`}
                    >
                        Poster
                    </button>
                    <button
                        onClick={() => onOptionsChange({
                            ...options,
                            designMode: 'tshirt',
                            poster: {
                                ...options.poster,
                                showHeader: false,
                                showTitle: false,
                                showFooter: false,
                                listSection: { ...options.poster.listSection, enabled: false },
                                iconSection: { ...options.poster.iconSection, enabled: false },
                                imagePadding: 'none'
                            }
                        })}
                        className={`py-2 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.designMode === 'tshirt' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500'}`}
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
                            <label className="text-[10px] text-neutral-400 tracking-wider">Search Movie & TV shows</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchMovies()}
                                    placeholder="Movie or TV show title..."
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
                            <div className="mt-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-neutral-500">Title Size</label>
                                    <div className="flex gap-1 items-center">
                                        {[24, 32, 40, 48, 56, 64].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => onOptionsChange({
                                                    ...options,
                                                    poster: { ...options.poster, titleFontSize: size }
                                                })}
                                                className={`flex-1 py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.poster.titleFontSize === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                        <input
                                            type="number"
                                            value={options.poster.titleFontSize}
                                            onChange={(e) => onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, titleFontSize: parseInt(e.target.value) || 48 }
                                            })}
                                            className="w-12 py-1 bg-neutral-900 border border-neutral-800 text-white text-[10px] text-center focus:outline-none focus:border-neutral-600 rounded"
                                        />
                                    </div>
                                </div>
                            </div>
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
                            <div className="mt-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-neutral-500">Subtitle Size</label>
                                    <div className="flex gap-1 items-center">
                                        {[8, 16, 24, 32, 40, 48].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => onOptionsChange({
                                                    ...options,
                                                    poster: { ...options.poster, subtitleFontSize: size }
                                                })}
                                                className={`flex-1 py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.poster.subtitleFontSize === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                        <input
                                            type="number"
                                            value={options.poster.subtitleFontSize}
                                            onChange={(e) => onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, subtitleFontSize: parseInt(e.target.value) || 16 }
                                            })}
                                            className="w-12 py-1 bg-neutral-900 border border-neutral-800 text-white text-[10px] text-center focus:outline-none focus:border-neutral-600 rounded"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1 mt-2">
                                    <label className="text-[10px] text-neutral-500">Gap to Title</label>
                                    <div className="flex gap-1 items-center">
                                        {[0, 8, 16, 24].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => onOptionsChange({
                                                    ...options,
                                                    poster: { ...options.poster, subtitleMargin: size }
                                                })}
                                                className={`flex-1 py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.poster.subtitleMargin === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                        <input
                                            type="number"
                                            value={options.poster.subtitleMargin}
                                            onChange={(e) => onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, subtitleMargin: parseInt(e.target.value) || 0 }
                                            })}
                                            className="w-12 py-1 bg-neutral-900 border border-neutral-800 text-white text-[10px] text-center focus:outline-none focus:border-neutral-600 rounded"
                                        />
                                    </div>
                                </div>
                            </div>
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

                        {/* Image Settings */}
                        <div className="space-y-4 pt-4 border-t border-neutral-800">
                            <label className="text-[10px] text-neutral-400 tracking-wider font-bold">Image Settings</label>

                            <div className="space-y-1">
                                <label className="text-[10px] text-neutral-400 tracking-wider block">Scale</label>
                                <div className="grid grid-cols-3 gap-1">
                                    {(['fit', 'fill', 'original'] as const).map((scale) => (
                                        <button
                                            key={scale}
                                            onClick={() => onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, imageScale: scale }
                                            })}
                                            className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.imageScale === scale ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                        >
                                            {scale}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-neutral-400 tracking-wider block">Align X</label>
                                    <div className="grid grid-cols-3 gap-1">
                                        {(['left', 'center', 'right'] as const).map((align) => (
                                            <button
                                                key={align}
                                                onClick={() => onOptionsChange({
                                                    ...options,
                                                    poster: { ...options.poster, imageAlignX: align }
                                                })}
                                                className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.imageAlignX === align ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                            >
                                                {align.charAt(0)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-neutral-400 tracking-wider block">Align Y</label>
                                    <div className="grid grid-cols-3 gap-1">
                                        {(['top', 'center', 'bottom'] as const).map((align) => (
                                            <button
                                                key={align}
                                                onClick={() => onOptionsChange({
                                                    ...options,
                                                    poster: { ...options.poster, imageAlignY: align }
                                                })}
                                                className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.imageAlignY === align ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                            >
                                                {align.charAt(0)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
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
                            {options.poster.iconSection.items.map((item, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="w-1/3 relative">
                                        <IconPicker
                                            value={item.icon}
                                            onChange={(newIcon) => {
                                                const newItems = [...options.poster.iconSection.items];
                                                newItems[index] = { ...item, icon: newIcon };
                                                onOptionsChange({
                                                    ...options,
                                                    poster: {
                                                        ...options.poster,
                                                        iconSection: { ...options.poster.iconSection, items: newItems }
                                                    }
                                                });
                                            }}
                                            iconColor={options.poster.iconSection.iconColor}
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
