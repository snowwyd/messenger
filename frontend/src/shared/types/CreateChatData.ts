import { ChatType } from '@/shared/types/ChatType';

export interface CreateChatData {
    type: ChatType;
    name: string;
    userIds: string[];
}
