import clsx from 'clsx';

import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
    icon?: string;
}

export default function Input({ className, icon, ...rest }: InputProps) {
    return (
        <label className={clsx(styles.inputContainer, className)}>
            {icon && <div className={styles.icon} style={{ maskImage: `url('${icon}')` }}></div>}
            <input className={styles.input} {...rest} />
        </label>
    );
}
