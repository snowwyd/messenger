import clsx from 'clsx';

import styles from './Modal.module.css';

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    modalHeader?: string;
    children?: React.ReactNode;
}

export default function Modal({ className, modalHeader, children, ...rest }: ModalProps) {
    return (
        <div className={clsx(styles.modal, className)} {...rest}>
            {modalHeader && <div className={styles.modalHeader}>{modalHeader}</div>}
            {children}
        </div>
    );
}
