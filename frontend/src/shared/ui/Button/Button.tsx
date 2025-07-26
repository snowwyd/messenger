import clsx from 'clsx';

import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    children?: React.ReactNode;
}

export default function Button({ className, children, ...rest }: ButtonProps) {
    return (
        <button className={clsx(styles.button, className)} {...rest}>
            {children}
        </button>
    );
}
