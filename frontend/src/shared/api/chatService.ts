import { grpc } from '@/shared/api/grpc';
import { ChatPreview, type GetChatInfoResponse } from '@/proto/gen/chat';
import type { ChatType } from '@/shared/types/ChatType';
import type { CreateChatData } from '@/shared/types/CreateChatData';
import type { ChannelType } from '@/shared/types/ChannelType';
import type { CreateChannelData } from '@/shared/types/CreateChannelData';
import type { SendMessageData } from '@/shared/types/SendMessageData';

import { userService } from './userService';

export const chatService = {
    getUserChats: async function (token: string, type: ChatType) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const input = {
            type: type,
        };
        const call = await grpc.chatClient.getUserChats(input, rpcOptions);
        const chats = call.response.chats;

        const results = await Promise.allSettled(chats.map((chat) => this.getChatInfo(token, chat.chatId)));
        const data: (ChatPreview & { defaultChannelId: string })[] = results
            .filter((result) => result.status === 'fulfilled')
            .map((result) => ({
                ...chats.filter((chat) => chat.chatId === result.value.chatId)[0],
                defaultChannelId: result.value.channels?.[0]?.channelId,
            }));

        if (type === 'private') {
            const usernames = await userService.getUsernames(data.map((item) => item.name));
            for (const chat of data) {
                chat.name = usernames[chat.name];
            }
        }

        return data;
    },
    getChatInfo: async function (token: string, chatId: string) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const chatInput = {
            chatId: chatId,
        };
        const chatCall = await grpc.chatClient.getChatInfo(chatInput, rpcOptions);
        const usernames = await userService.getUsernames(chatCall.response.memberIds);
        const chatInfo: GetChatInfoResponse & { usernames: Record<string, string> } = {
            ...chatCall.response,
            usernames: usernames,
        };
        return chatInfo;
    },
    getMessages: async function (token: string, channelId: string, limit: number, offset: number) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const input = {
            channelId: channelId,
            limit: limit,
            offset: offset,
        };
        const call = await grpc.chatClient.getMessages(input, rpcOptions);
        return call.response.messages.reverse();
    },
    createChat: async function (token: string, type: ChatType, name: string, userIds: string[]) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const input: CreateChatData = {
            type: type,
            name: name,
            userIds: userIds,
        };
        const call = await grpc.chatClient.createChat(input, rpcOptions);
        return call.response;
    },
    createChannel: async function (token: string, chatId: string, name: string, type: ChannelType) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const input: CreateChannelData = {
            chatId: chatId,
            name: name,
            type: type,
        };
        const call = await grpc.chatClient.createChannel(input, rpcOptions);
        return call.response;
    },
    sendMessage: async function (token: string, channelId: string, text: string) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const input: SendMessageData = {
            channelId: channelId,
            text: text,
        };
        const call = await grpc.chatClient.sendMessage(input, rpcOptions);
        return call.response;
    },
    messageStream: async function* (token: string, controllerKey: string, channelId: string) {
        const rpcOptions = grpc.getStreamingOptions(token, controllerKey);
        const input = {
            channelId: channelId,
        };
        const call = grpc.chatClient.chatStream(input, rpcOptions);
        for await (const response of call.responses) {
            if (response.payload.oneofKind === 'newMessage') {
                yield response.payload.newMessage;
            }
        }
    },
};
