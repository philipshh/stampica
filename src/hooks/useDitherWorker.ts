import { useEffect, useRef } from 'react';
import { WorkerResponse, WorkerErrorResponse } from '../lib/dither';
import Worker from '../lib/worker?worker';

type WorkerMessage = WorkerResponse | WorkerErrorResponse;

export function useDitherWorker(onResult: (imageData: ImageData) => void) {
    const workerRef = useRef<InstanceType<typeof Worker>>();
    const onResultRef = useRef(onResult);
    onResultRef.current = onResult;

    useEffect(() => {
        workerRef.current = new Worker();

        workerRef.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
            if ('error' in e.data) {
                console.error('Worker error:', e.data.error);
                try { alert(`Dither engine error: ${e.data.error}`); } catch { /* ignore */ }
                return;
            }

            if (e.data?.imageData) {
                onResultRef.current(e.data.imageData);

                if (import.meta.env.MODE !== 'production') {
                    const d = e.data.imageData.data;
                    let count = 0;
                    for (let i = 3; i < d.length; i += 4) if (d[i] === 0) count++;
                    console.log('[SANITY] transparent pixels:', count);
                }
            }
        };

        return () => { workerRef.current?.terminate(); };
    }, []);

    return workerRef;
}
