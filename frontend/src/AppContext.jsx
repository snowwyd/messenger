import { createContext } from "react";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { AuthClient } from "./proto/generated/msgauth.client";
import { ConversationClient } from "./proto/generated/msgchat.client";

export const AppContext = createContext();

export default function AppProvider({ children }) {
    const transport = new GrpcWebFetchTransport({ baseUrl: "http://localhost:808" });
    const authClient = new AuthClient(transport);
    const conversationClient = new ConversationClient(transport);

    const grpc = {
        auth: authClient,
        chat: conversationClient,
        setAuthorizationHeader: function(token) {
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
        }
    }

    return (
        <AppContext.Provider value={grpc}>
            { children }
        </AppContext.Provider>
    )
}