import { grpc } from '@/shared/api/grpc';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

interface StreamOptions<D, T> {
    streamKey: string;
    streamFn: (data: D, key: string) => AsyncGenerator<T>;
    onResponse: (data: T) => void;
    onError: (error: Error) => void;
}

export function useStream<D, T>(streamOptions: StreamOptions<D, T>) {
    const { deauthorize } = useAuthStore();

    const stream = {
        stream: async function (data: D) {
            try {
                const responses = streamOptions.streamFn(data, streamOptions.streamKey);
                for await (const response of responses) {
                    streamOptions.onResponse(response);
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    streamOptions.onError(error);

                    switch (error.message) {
                        case 'invalid token signature':
                            deauthorize();
                            break;
                        case 'stream timeout':
                        case 'network error':
                            this.stream(data);
                            break;
                    }
                } else {
                    console.log(error);
                }
            }
        },
        abortStream: () => grpc.abortStream(streamOptions.streamKey),
    };

    return stream;
}
