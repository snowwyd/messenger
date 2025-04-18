import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from "react-redux";
import { store } from "./store";
import GrpcProvider from "./GrpcContext.jsx";
import App from "./App.jsx";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('app')).render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <GrpcProvider>
                <Provider store={store}>
                    <App />
                </Provider>
            </GrpcProvider>
        </BrowserRouter>
    </QueryClientProvider>
);