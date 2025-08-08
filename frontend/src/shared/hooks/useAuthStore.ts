import { useDispatch, useSelector } from 'react-redux';
import type { State } from '@/shared/types/State';
import { authorize, deauthorize } from '@/store/slices/authSlice';

export function useAuthStore() {
    const authState = useSelector((state: State) => state.auth);
    const dispatch = useDispatch();

    return {
        ...authState,
        authorize: (token: string) => dispatch(authorize(token)),
        deauthorize: () => dispatch(deauthorize()),
    };
}
