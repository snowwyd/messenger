import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';

import { store, authActions } from '@/store/store';
import App from '@/App';

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error) => {
            console.log('query error: ' + error.message);

            if (error.message === 'invalid token signature') {
                store.dispatch(authActions.deauthorize());
            }
        },
    }),
    mutationCache: new MutationCache({
        onError: (error) => {
            console.log('mutation error: ' + error.message);

            if (error.message === 'invalid token signature') {
                store.dispatch(authActions.deauthorize());
            }
        },
    }),
});

createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Provider store={store}>
                    <App />
                </Provider>
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>
);
