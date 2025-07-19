import { grpc } from '@/api/grpc';

export const userService = {
    login: async function (email, password) {
        const input = {
            email: email,
            password: password,
        };
        const call = await grpc.userClient.login(input);
        return call.response;
    },
    register: async function (username, email, password) {
        const input = {
            username: username,
            email: email,
            password: password,
        };
        const call = await grpc.userClient.register(input);
        return call.response;
    },
    getUsernames: async function (userIds) {
        const input = {
            userIds: userIds,
        };
        const call = await grpc.userClient.getUsernames(input);
        return call.response.usernames;
    },
    getUserIds: async function (usernames) {
        const input = {
            usernames: usernames,
        };
        const call = await grpc.userClient.getUserIDs(input);
        return call.response.userIds;
    },
};
