import { MutationCache, QueryCache, QueryClient, QueryClientProvider as Provider } from '@tanstack/react-query';

import { store } from '@/store/store';
import { deauthorize } from '@/store/slices/authSlice';

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error) => {
            console.log('query error: ' + error.message);

            if (error.message === 'invalid token signature') {
                store.dispatch(deauthorize());
            }
        },
    }),
    mutationCache: new MutationCache({
        onError: (error) => {
            console.log('mutation error: ' + error.message);

            if (error.message === 'invalid token signature') {
                store.dispatch(deauthorize());
            }
        },
    }),
});

interface QueryClientProviderProps {
    children: React.ReactNode;
}

export default function QueryClientProvider({ children }: QueryClientProviderProps) {
    return <Provider client={queryClient}>{children}</Provider>;
}
