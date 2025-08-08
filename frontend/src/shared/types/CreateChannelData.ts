import { ChannelType } from '@/shared/types/ChannelType';

export interface CreateChannelData {
    chatId: string;
    name: string;
    type: ChannelType;
}
