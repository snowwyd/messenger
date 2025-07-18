import styles from './Input.module.css';

export default function Input({ className, placeholder, value, onChange, onKeyDown, icon }) {
    return (
        <div className={`${styles.inputContainer} ${className}`}>
            <div className={styles.icon} style={{ maskImage: `url('${icon}')` }}></div>
            <input
                value={value}
                onChange={onChange}
                className={styles.input}
                placeholder={placeholder}
                onKeyDown={onKeyDown}
            />
        </div>
    );
}
