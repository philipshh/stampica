import { useEffect, useRef } from 'react';
import { toastError } from '../lib/toast';
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
                toastError(`Dither engine error: ${e.data.error}`);
                return;
            }

            // Results are delivered to whoever posted the job (matched by jobId)
        };

        return () => { workerRef.current?.terminate(); };
    }, []);

    return workerRef;
}
