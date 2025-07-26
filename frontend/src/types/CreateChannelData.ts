import { ChannelType } from '@/types/ChannelType';

export interface CreateChannelData {
    chatId: string;
    name: string;
    type: ChannelType;
}
