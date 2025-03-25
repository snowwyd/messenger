import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppProvider from "./AppContext.jsx";

const queryClient = new QueryClient();

import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById('app')).render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <AppProvider>
                <App />
            </AppProvider>
        </BrowserRouter>
    </QueryClientProvider>
);