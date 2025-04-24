import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { AuthClient } from "@/proto/gen/user.client";
import { ConversationClient } from "@/proto/gen/chat.client";

const transport = new GrpcWebFetchTransport({ baseUrl: import.meta.env.VITE_BASE_URL });
const userClient = new AuthClient(transport);
const chatClient = new ConversationClient(transport);
const abortControllers = new Map();

export const grpc = {
    userClient: userClient,
    chatClient: chatClient,
    getUnaryOptions: function (token) {
        const rpcOptions = {
            interceptors: [
                {
                    interceptUnary(next, method, input, options) {
                        if (!options.meta) options.meta = {};
                        options.meta['Authorization'] = `Bearer ${token}`;
                        return next(method, input, options);
                    }
                }
            ]
        }
        return rpcOptions;
    },
    getStreamingOptions: function (token, key) {
        const controller = new AbortController();
        abortControllers.set(key, controller);

        const rpcOptions = {
            interceptors: [
                {
                    interceptServerStreaming(next, method, input, options) {
                        if (!options.meta) options.meta = {};
                        options.meta['Authorization'] = `Bearer ${token}`;
                        return next(method, input, options);
                    }
                }
            ],
            abort: controller.signal
        }
        return rpcOptions;
    },
    abortStream: function (key) {
        const controller = abortControllers.get(key);
        if (controller) {
            controller.abort();
            abortControllers.delete(key);
        }
    }
}