import clsx from 'clsx';

import styles from './Button.module.css';

export default function Button({ className, onClick, type, disabled, children }) {
    return (
        <button className={clsx(styles.button, className)} onClick={onClick} type={type} disabled={disabled}>
            {children}
        </button>
    );
}
