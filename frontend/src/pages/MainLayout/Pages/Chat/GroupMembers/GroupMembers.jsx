import styles from './GroupMembers.module.css';
import Button from '@/shared/ui/Button/Button.jsx';

export default function GroupMembers({ memberIds, usernames }) {
    return (
        <>
            <div className={styles.blockHeader}>
                <div className={styles.memberCount}>
                    <div className={styles.icon}></div>
                    <div className={styles.text}>{memberIds.length} members</div>
                </div>
                <div className={styles.add}>
                    <div className={styles.icon}></div>
                </div>
            </div>
            <div className={styles.memberList}>
                {memberIds.map((memberId) => (
                    <div className={styles.member} key={memberId}>
                        <div className={styles.memberInfo}>
                            <div className={styles.avatar}></div>
                            <div className={styles.name}>{usernames[memberId]}</div>
                        </div>
                        <Button placeholder="Message" className={styles.messageButton} />
                    </div>
                ))}
            </div>
        </>
    );
}
