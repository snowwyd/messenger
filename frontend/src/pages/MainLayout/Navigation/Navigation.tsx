import { NavLink, useMatch } from 'react-router-dom';
import clsx from 'clsx';

import CreateChat from './CreateChat/CreateChat';

import styles from './Navigation.module.css';

export default function Navigation() {
    const isDirect = useMatch('/direct/*');
    const isGroups = useMatch('/groups/*');

    return (
        <div>
            <nav className={styles.categories}>
                <NavLink
                    className={({ isActive }) => clsx(styles.categoryButton, isActive && styles.activeLink)}
                    to="/direct"
                    draggable="false"
                >
                    <div className={clsx(styles.categoryIcon, styles.direct)}></div>
                </NavLink>
                <NavLink
                    className={({ isActive }) => clsx(styles.categoryButton, isActive && styles.activeLink)}
                    to="/groups"
                    draggable="false"
                >
                    <div className={clsx(styles.categoryIcon, styles.groups)}></div>
                </NavLink>
            </nav>
            {isDirect && (
                <div className={styles.categoryBanner}>
                    <h3 className={styles.categoryName}>Direct Messages</h3>
                    <CreateChat type={'private'} />
                </div>
            )}
            {isGroups && (
                <div className={styles.categoryBanner}>
                    <h3 className={styles.categoryName}>Groups</h3>
                    <CreateChat type={'group'} />
                </div>
            )}
        </div>
    );
}
