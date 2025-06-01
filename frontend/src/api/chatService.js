import { grpc } from '@/api/grpc';
import { userService } from './userService';

export const chatService = {
    getUserChats: async function (token, type) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const input = { type: type };
        const call = await grpc.chatClient.getUserChats(input, rpcOptions);
        const chats = call.response.chats;

        if (type === 'private') {
            const usernames = await userService.getUsernames(chats.map((item) => item.name));
            for (let i = 0; i < chats.length; i++) chats[i].name = usernames[chats[i].name];
        }

        return chats;
    },
    getChatInfo: async function (token, chatId) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const chatInput = { chatId: chatId };
        const chatCall = await grpc.chatClient.getChatInfo(chatInput, rpcOptions);
        const usernames = await userService.getUsernames(chatCall.response.memberIds);
        chatCall.response.usernames = usernames;
        return chatCall.response;
    },
    getMessages: async function (token, channelId, limit, offset) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const input = {
            channelId: channelId,
            limit: limit,
            offset: offset,
        };
        const call = await grpc.chatClient.getMessages(input, rpcOptions);
        return call.response.messages.reverse();
    },
    createChat: async function (token, type, userIds, name) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const input = {
            type: type,
            userIds: userIds,
            name: name,
        };
        const call = await grpc.chatClient.createChat(input, rpcOptions);
        return call.response;
    },
    createChannel: async function (token, chatId, name, type) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const input = {
            type: type,
            chatId: chatId,
            name: name,
        };
        const call = await grpc.chatClient.createChannel(input, rpcOptions);
        return call.response;
    },
    sendMessage: async function (token, channelId, text) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const input = {
            channelId: channelId,
            text: text,
        };
        const call = await grpc.chatClient.sendMessage(input, rpcOptions);
        return call.response;
    },
    messageStream: async function* (token, controllerKey, channelId) {
        const rpcOptions = grpc.getStreamingOptions(token, controllerKey);
        const input = { channelId: channelId };
        const call = grpc.chatClient.chatStream(input, rpcOptions);
        for await (const response of call.responses) {
            yield response.payload.newMessage;
        }
    },
};
