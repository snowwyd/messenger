import { store, authActions } from '@/store/store';
import { grpc } from '@/api/grpc';

interface StreamOptions<D, T> {
    streamKey: string;
    streamFn: (data: D, key: string) => AsyncGenerator<T>;
    onResponse: (data: T) => void;
    onError: (error: Error) => void;
}

export function createStreamHandler<D, T>(streamOptions: StreamOptions<D, T>) {
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
                            store.dispatch(authActions.deauthorize());
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
