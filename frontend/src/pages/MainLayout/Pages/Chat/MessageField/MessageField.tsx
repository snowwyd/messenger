import { useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { chatService } from '@/api/chatService';
import type { State } from '@/types/State';
import type { SendMessageData } from '@/types/SendMessageData';
import TextInput from '@/shared/components/TextInput/TextInput';

interface MessageFieldProps {
    channelId: string;
    channelName: string;
}

export default function MessageField({ channelId, channelName }: MessageFieldProps) {
    const token = useSelector((state: State) => state.auth.token) ?? '';

    const sendMessageMutation = useMutation({
        mutationFn: (message: SendMessageData) => chatService.sendMessage(token, message.channelId, message.text),
    });

    function sendMessage(text: string) {
        const message: SendMessageData = {
            channelId: channelId,
            text: text,
        };

        sendMessageMutation.mutate(message);
    }

    return <TextInput onSend={sendMessage} placeholder={`Message @${channelName.toLowerCase()}`} />;
}
