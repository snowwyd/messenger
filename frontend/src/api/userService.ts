import { grpc } from '@/api/grpc';
import type { LoginData } from '@/types/LoginData';
import type { RegisterData } from '@/types/RegisterData';

export const userService = {
    login: async function (email: string, password: string) {
        const input: LoginData = {
            email: email,
            password: password,
        };
        const call = await grpc.userClient.login(input);
        return call.response;
    },
    register: async function (username: string, email: string, password: string) {
        const input: RegisterData = {
            username: username,
            email: email,
            password: password,
        };
        const call = await grpc.userClient.register(input);
        return call.response;
    },
    getUsernames: async function (userIds: string[]) {
        const input = {
            userIds: userIds,
        };
        const call = await grpc.userClient.getUsernames(input);
        return call.response.usernames;
    },
    getUserIds: async function (usernames: string[]) {
        const input = {
            usernames: usernames,
        };
        const call = await grpc.userClient.getUserIDs(input);
        return call.response.userIds;
    },
};
