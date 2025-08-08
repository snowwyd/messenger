import QueryClientProvider from './providers/QueryClientProvider';
import RouterProvider from './providers/RouterProvider';
import StoreProvider from './providers/StoreProvider';
import AppRouter from './routing/AppRouter';

import './styles/globals.css';
import './styles/variables.css';

export default function App() {
    return (
        <StoreProvider>
            <QueryClientProvider>
                <RouterProvider>
                    <AppRouter />
                </RouterProvider>
            </QueryClientProvider>
        </StoreProvider>
    );
}
