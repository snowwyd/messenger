import { createContext, useEffect, useState } from "react";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { AuthClient } from "./proto/gen/msgauth.client";
import { ConversationClient } from "./proto/gen/msgchat.client";
import { useLocation } from "react-router-dom";

export const AppContext = createContext();

export default function AppProvider({ children }) {
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
        }
    }

    const location = useLocation();
    const [currentCategory, setCurrentCategory] = useState("");
    useEffect(() => {
        setCurrentCategory(location.pathname.split('/')[1]);
    }, [location.pathname]);

    const [isAuthorized, setIsAuthorized] = useState(localStorage.getItem('token') ? true : false);

    const app = {
        grpc: grpc,
        categoryState: {currentCategory, setCurrentCategory},
        isAuthorizedState: {isAuthorized, setIsAuthorized},
        abortController: abortController
    }

    return (
        <AppContext.Provider value={app}>
            {children}
        </AppContext.Provider>
    )
}