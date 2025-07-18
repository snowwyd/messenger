import styles from './Modal.module.css';

export default function Modal({ className, modalHeader, children }) {
    return (
        <div className={`${styles.modal} ${className}`}>
            <div className={styles.modalHeader}>{modalHeader}</div>
            {children}
        </div>
    );
}
