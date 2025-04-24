import styles from './Search.module.css';

export default function Search() {
    return (
        <div className={styles.search}>
            <input type="text" placeholder='search'/>
        </div>
    )
}