import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { chatService } from '@/shared/api/chatService';
import type { SendMessageData } from '@/shared/types/SendMessageData';
import TextInput from '@/shared/widgets/TextInput/TextInput';

interface SendMessageProps {
    channelId: string;
    channelName: string;
}

export default function SendMessage({ channelId, channelName }: SendMessageProps) {
    const { token } = useAuthStore();

    const sendMessageMutation = useMutation({
        mutationFn: (message: SendMessageData) => chatService.sendMessage(token!, message.channelId, message.text),
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
