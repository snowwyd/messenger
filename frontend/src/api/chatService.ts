import { grpc } from '@/api/grpc';
import type { GetChatInfoResponse } from '@/proto/gen/chat';
import type { ChatType } from '@/types/ChatType';
import type { CreateChatData } from '@/types/CreateChatData';
import type { ChannelType } from '@/types/ChannelType';
import type { CreateChannelData } from '@/types/CreateChannelData';
import type { SendMessageData } from '@/types/SendMessageData';

import { userService } from './userService';

export const chatService = {
    getUserChats: async function (token: string, type: ChatType) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const input = {
            type: type,
        };
        const call = await grpc.chatClient.getUserChats(input, rpcOptions);
        const chats = call.response.chats;

        if (type === 'private') {
            const usernames = await userService.getUsernames(chats.map((item) => item.name));
            for (const chat of chats) {
                chat.name = usernames[chat.name];
            }
        }

        return chats;
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
