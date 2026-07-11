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
            }
        };

        return () => { workerRef.current?.terminate(); };
    }, []);

    return workerRef;
}
