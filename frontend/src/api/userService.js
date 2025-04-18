import { grpc } from "@/api/grpc";

export const userService = {
    login: async function (email, password) {
        const call = await grpc.userClient.login({ email, password });
        return call.response;
    },
    register: async function (username, email, password) {
        const call = await grpc.userClient.register({ username, email, password });
        return call.response;
    },
    getUsernames: async function (userIds) {
        const input = { userIds: userIds }
        const call = await grpc.userClient.getUsernames(input);
        return call.response.usernames;
    },
    getUserIds: async function (usernames) {
        const input = { usernames: usernames }
        const call = await grpc.userClient.getUserIDs(input);
        return call.response.userIds;
    }
}