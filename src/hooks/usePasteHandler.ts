import { useEffect, useRef } from 'react';

export function usePasteHandler(
    imageMode: string,
    onSingleFile: (file: File) => void,
    onGridFile: (file: File) => void
) {
    const onSingleRef = useRef(onSingleFile);
    const onGridRef = useRef(onGridFile);
    onSingleRef.current = onSingleFile;
    onGridRef.current = onGridFile;

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) {
                        if (imageMode === 'single') onSingleRef.current(file);
                        else onGridRef.current(file);
                    }
                    break;
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [imageMode]);
}
