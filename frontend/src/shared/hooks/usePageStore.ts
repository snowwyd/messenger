import { useDispatch, useSelector } from 'react-redux';
import type { State } from '@/shared/types/State';
import { direct, groups, setChannelId, setChatId } from '@/store/slices/pageSlice';

export function usePageStore() {
    const pageState = useSelector((state: State) => state.page);
    const dispatch = useDispatch();

    return {
        ...pageState,
        direct: () => dispatch(direct()),
        groups: () => dispatch(groups()),
        setChatId: (chatId: string) => dispatch(setChatId(chatId)),
        setChannelId: (channelId: string) => dispatch(setChannelId(channelId)),
    };
}
