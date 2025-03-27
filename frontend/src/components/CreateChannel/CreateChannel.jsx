import { useContext, useRef, useState } from "react";

import { AppContext } from "../../AppContext";
import styles from './CreateChannel.module.css';
import { useParams } from "react-router-dom";

export default function CreateChannel() {
    const { grpc } = useContext(AppContext);
    const [channelName, setChannelName] = useState("");
    const { chatId } = useParams();

    const createChannelModal = useRef(null);

    const openModal = () => createChannelModal.current.style.display = "flex";
    const closeModal = () => createChannelModal.current.style.display = "none";

    async function createChannel() {
        const input = {
            chatId: chatId,
            name: channelName,
            type: "text"
        }

        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));

        try {
            await grpc.chat.createChannel(input, rpcOptions);
            setChannelName("");
        } catch (error) {
            console.log(error);
        }
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