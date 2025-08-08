import clsx from 'clsx';

import styles from './ChatFiles.module.css';

export default function GroupMembers() {
    return (
        <div>
            <div className={clsx(styles.block, styles.photos)}>
                <div className={styles.icon}></div>
                <div className={styles.text}>340 photos</div>
            </div>
            <div className={clsx(styles.block, styles.videos)}>
                <div className={styles.icon}></div>
                <div className={styles.text}>44 videos</div>
            </div>
            <div className={clsx(styles.block, styles.audio)}>
                <div className={styles.icon}></div>
                <div className={styles.text}>10 audio files</div>
            </div>
            <div className={clsx(styles.block, styles.links)}>
                <div className={styles.icon}></div>
                <div className={styles.text}>123 links</div>
            </div>
            <div className={clsx(styles.block, styles.gifs)}>
                <div className={styles.icon}></div>
                <div className={styles.text}>139 gifs</div>
            </div>
            <div className={clsx(styles.block, styles.files)}>
                <div className={styles.icon}></div>
                <div className={styles.text}>10 files</div>
            </div>
        </div>
    );
}
