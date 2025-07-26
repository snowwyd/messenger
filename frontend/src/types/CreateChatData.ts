import { ChatType } from '@/types/ChatType';

export interface CreateChatData {
    type: ChatType;
    name: string;
    userIds: string[];
}
