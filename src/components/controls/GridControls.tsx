import React from 'react';
import { DitherOptions, Slot } from '../../lib/dither';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, X, GripVertical, Plus, Minus } from 'lucide-react';

interface GridControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
}

interface SortableItemProps {
    slot: Slot;
    isSelected: boolean;
    onUpload: (id: string, file: File) => void;
    onRemove: (id: string) => void;
    onSelect: (id: string) => void;
}

const SortableSlot: React.FC<SortableItemProps> = ({ slot, isSelected, onUpload, onRemove, onSelect }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: slot.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(slot.id, file);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => onSelect(slot.id)}
            className={`relative group bg-neutral-900 border-2 ${isDragging ? 'border-white' : isSelected ? 'border-blue-500' : 'border-neutral-800'} rounded overflow-hidden aspect-square flex flex-col items-center justify-center cursor-pointer`}
        >
            <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" {...attributes} {...listeners}>
                <GripVertical className="w-4 h-4 text-neutral-400" />
            </div>

            {slot.src ? (
                <>
                    <img src={slot.src} alt="" className="w-full h-full object-cover" />
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(slot.id); }}
                        className="absolute top-1 right-1 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                    >
                        <X className="w-3 h-3 text-white" />
                    </button>
                </>
            ) : (
                <div className="p-2 text-center pointer-events-none">
                    <label className="flex flex-col items-center gap-1">
                        <Upload className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                        <span className="text-[8px] uppercase text-neutral-500">Upload</span>
                        {/* Hidden input needs to be accessible but not triggered by the label if we want manual control, but label works fine */}
                    </label>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-[8px] text-center text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Slot {slot.id}
            </div>
        </div>
    );
};

export const GridControls: React.FC<GridControlsProps> = ({ options, onOptionsChange }) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = options.grid.images.findIndex((s) => s.id === active.id);
            const newIndex = options.grid.images.findIndex((s) => s.id === over.id);

            const newImages = arrayMove(options.grid.images, oldIndex, newIndex);
            onOptionsChange({
                ...options,
                grid: { ...options.grid, images: newImages }
            });
        }
    };

    const handleUpload = (id: string, file: File) => {
        const newImages = options.grid.images.map(s => {
            if (s.id === id) {
                return { ...s, file, src: URL.createObjectURL(file) };
            }
            return s;
        });
        onOptionsChange({
            ...options,
            grid: { ...options.grid, images: newImages }
        });
    };

    const handleRemove = (id: string) => {
        const newImages = options.grid.images.map(s => {
            if (s.id === id) {
                const { file, src, processedImageData, ...rest } = s;
                if (src) URL.revokeObjectURL(src);
                return { ...rest };
            }
            return s;
        });
        onOptionsChange({
            ...options,
            grid: { ...options.grid, images: newImages }
        });
    };

    const setLayout = (rows: number, cols: number) => {
        const newCount = rows * cols;
        let newImages = [...options.grid.images];

        if (newCount > newImages.length) {
            // Add slots
            for (let i = newImages.length; i < newCount; i++) {
                newImages.push({ id: (i + 1).toString() });
            }
        } else if (newCount < newImages.length) {
            // Remove slots (careful with data)
            newImages = newImages.slice(0, newCount);
        }

        onOptionsChange({
            ...options,
            grid: {
                ...options.grid,
                layout: { rows, cols, id: `${rows}x${cols}` },
                images: newImages
            }
        });
    };

    const handleSelect = (id: string) => {
        onOptionsChange({
            ...options,
            grid: { ...options.grid, selectedSlotId: id }
        });
    };

    const updateSlot = (id: string, updates: Partial<Slot>) => {
        const newImages = options.grid.images.map(s => {
            if (s.id === id) {
                return { ...s, ...updates };
            }
            return s;
        });
        onOptionsChange({
            ...options,
            grid: { ...options.grid, images: newImages }
        });
    };

    const selectedSlot = options.grid.images.find(s => s.id === options.grid.selectedSlotId);

    return (
        <div className="space-y-4 pt-4 border-t border-neutral-800">
            <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 tracking-wider">Grid Layout</label>
                <div className="grid grid-cols-2 gap-3">
                    {/* Columns Counter */}
                    <div className="space-y-1">
                        <label className="text-[9px] text-neutral-500 uppercase tracking-widest">Cols</label>
                        <div className="flex items-center bg-neutral-900 rounded border border-neutral-800 p-1">
                            <button
                                onClick={() => setLayout(options.grid.layout.rows, Math.max(1, options.grid.layout.cols - 1))}
                                className="p-1 hover:text-white text-neutral-500 transition-colors"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <input
                                type="number"
                                value={options.grid.layout.cols}
                                onChange={(e) => setLayout(options.grid.layout.rows, Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-transparent text-center text-[11px] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                                onClick={() => setLayout(options.grid.layout.rows, options.grid.layout.cols + 1)}
                                className="p-1 hover:text-white text-neutral-500 transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Rows Counter */}
                    <div className="space-y-1">
                        <label className="text-[9px] text-neutral-500 uppercase tracking-widest">Rows</label>
                        <div className="flex items-center bg-neutral-900 rounded border border-neutral-800 p-1">
                            <button
                                onClick={() => setLayout(Math.max(1, options.grid.layout.rows - 1), options.grid.layout.cols)}
                                className="p-1 hover:text-white text-neutral-500 transition-colors"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <input
                                type="number"
                                value={options.grid.layout.rows}
                                onChange={(e) => setLayout(Math.max(1, parseInt(e.target.value) || 1), options.grid.layout.cols)}
                                className="w-full bg-transparent text-center text-[11px] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                                onClick={() => setLayout(options.grid.layout.rows + 1, options.grid.layout.cols)}
                                className="p-1 hover:text-white text-neutral-500 transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] text-neutral-400 tracking-wider">Slots</label>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={options.grid.images.map(s => s.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-4 gap-1">
                            {options.grid.images.map((slot) => (
                                <SortableSlot
                                    key={slot.id}
                                    slot={slot}
                                    isSelected={options.grid.selectedSlotId === slot.id}
                                    onUpload={handleUpload}
                                    onRemove={handleRemove}
                                    onSelect={handleSelect}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {selectedSlot && (
                <div className="space-y-3 pt-3 border-t border-neutral-800 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">Slot {selectedSlot.id} Settings</label>
                        <button onClick={() => handleSelect('')} className="text-neutral-500 hover:text-white">
                            <X className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase tracking-widest">Scale</label>
                            <div className="flex bg-neutral-900 rounded p-0.5">
                                {(['fill', 'contain'] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => updateSlot(selectedSlot.id, { scale: s })}
                                        className={`flex-1 py-1 text-[9px] uppercase transition-colors rounded ${selectedSlot.scale === s || (!selectedSlot.scale && s === 'fill') ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase tracking-widest">Align X</label>
                            <div className="flex bg-neutral-900 rounded p-0.5">
                                {(['left', 'center', 'right'] as const).map((a) => (
                                    <button
                                        key={a}
                                        onClick={() => updateSlot(selectedSlot.id, { alignX: a })}
                                        className={`flex-1 py-1 text-[9px] uppercase transition-colors rounded ${selectedSlot.alignX === a || (!selectedSlot.alignX && a === 'center') ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                                    >
                                        {a[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase tracking-widest">Align Y</label>
                            <div className="flex bg-neutral-900 rounded p-0.5">
                                {(['top', 'center', 'bottom'] as const).map((a) => (
                                    <button
                                        key={a}
                                        onClick={() => updateSlot(selectedSlot.id, { alignY: a })}
                                        className={`flex-1 py-1 text-[9px] uppercase transition-colors rounded ${selectedSlot.alignY === a || (!selectedSlot.alignY && a === 'center') ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                                    >
                                        {a[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
