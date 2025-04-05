import { createContext, useContext } from "react"
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { AuthClient } from "./proto/gen/msgauth.client";
import { ConversationClient } from "./proto/gen/msgchat.client";

const GrpcContext = createContext();

export const useGrpc = () => useContext(GrpcContext);

export default function GrpcProvider({ children }) {
    const transport = new GrpcWebFetchTransport({ baseUrl: "http://localhost:808" });
    const authClient = new AuthClient(transport);
    const conversationClient = new ConversationClient(transport);
    const abortController = new AbortController();

    const grpc = {
        auth: authClient,
        chat: conversationClient,
        setAuthorizationHeader: function (token) {
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
        getStreamingOptions: function (token) {
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
                abort: abortController.signal
            }
            return rpcOptions;
        },
        abortController: abortController
    }

    return (
        <GrpcContext.Provider value={grpc}>
            {children}
        </GrpcContext.Provider>
    )
}