import { useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { chatService } from '@/api/chatService';

import TextInput from '@/components/TextInput/TextInput';

export default function MessageField({ channelId, channel }) {
    const token = useSelector((state) => state.auth.token);

    const sendMessageMutation = useMutation({
        mutationFn: (message) => chatService.sendMessage(token, message.channelId, message.text),
    });

    async function sendMessage(text) {
        const message = {
            channelId: channelId,
            text: text,
        };

        sendMessageMutation.mutate(message);
    }

    return channel && <TextInput onSend={sendMessage} placeholder={`Message @${channel.name.toLowerCase()}`} />;
}
