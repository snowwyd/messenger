import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";

import { chatService } from "@/api/chatService";

import styles from './CreateChannel.module.css';

export default function CreateChannel() {
    const [channelName, setChannelName] = useState("");
    const { chatId } = useParams();
    const token = useSelector(state => state.auth.token);

    const createChannelModal = useRef(null);

    const openModal = () => createChannelModal.current.style.display = "flex";
    const closeModal = () => createChannelModal.current.style.display = "none";

    const createChannelMutation = useMutation({
        mutationFn: channel => chatService.createChannel(token, channel.chatId, channel.name, channel.type),
        onSuccess: data => setChannelName("")
    })

    async function createChannel() {
        const channel = {
            chatId: chatId,
            name: channelName,
            type: "text"
        }

        createChannelMutation.mutate(channel);
    }

    return (
        <>
            <div ref={createChannelModal} className={styles.createChannelModal}>
                <div className={styles.modalContent}>
                    <input value={channelName} onChange={(event) => setChannelName(event.target.value)} className={styles.createChannelName} placeholder="channel name" type="text" />
                    <input onClick={createChannel} type="submit" value="create channel" />
                    <div onClick={closeModal} className={styles.closeModal}></div>
                </div>
            </div>
            <div onClick={openModal} className={styles.createChannel}></div>
        </>
    )
}