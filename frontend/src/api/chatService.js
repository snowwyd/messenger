import { grpc } from "@/api/grpc";
import { userService } from "./userService";

export const chatService = {
    getUserChats: async function (token, type) {
        const rpcOptions = grpc.getUnaryOptions(token);
        const input = { type: type };
        const call = await grpc.chatClient.getUserChats(input, rpcOptions);
        const chats = call.response.chats;

        if (type === "private") {
            const usernames = await userService.getUsernames(chats.map(item => item.name));
            for (let i = 0; i < chats.length; i++) chats[i].name = usernames[chats[i].name];
        }

        return chats;
    }
}