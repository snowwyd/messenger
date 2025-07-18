import styles from './Button.module.css';

export default function Button({ onClick, placeholder, className }) {
    return (
        <button className={`${styles.button} ${className}`} onClick={onClick}>
            {placeholder}
        </button>
    );
}
