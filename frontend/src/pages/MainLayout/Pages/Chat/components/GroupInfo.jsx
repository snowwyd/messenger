import styles from './GroupInfo.module.css';

export default function GroupInfo({ memberIds, usernames }) {
    return (
        <>
            <div className={styles.blockHeader}>Member List</div>
            <div className={styles.memberList}>
                {memberIds.map((memberId) => (
                    <div className={styles.member} key={memberId}>
                        <div className={styles.memberInfo}>
                            <div className={styles.avatar}></div>
                            <div className={styles.name}>{usernames[memberId]}</div>
                        </div>
                        <div className={styles.messageButton}>Message</div>
                    </div>
                ))}
            </div>
        </>
    );
}
