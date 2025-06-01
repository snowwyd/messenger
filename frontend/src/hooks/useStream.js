import { store, authActions } from '@/store/store';
import { grpc } from '@/api/grpc';

export function useStream(streamOptions) {
    const stream = {
        stream: async function (data) {
            try {
                const responses = streamOptions.streamFn(data, streamOptions.streamKey);
                for await (const response of responses) {
                    streamOptions.onResponse(response);
                }
            } catch (error) {
                streamOptions.onError(error);
                if (error.message === 'invalid token signature') {
                    store.dispatch(authActions.deauthorize());
                } else if (error.message === 'stream timeout') {
                    this.stream(data);
                }
            }
        },
        abortStream: () => grpc.abortStream(streamOptions.streamKey),
    };

    return stream;
}
