import { NavLink, useMatch } from 'react-router-dom';

import CreateChat from './CreateChat';

import styles from './Categories.module.css';

export default function Categories() {
    const isDirect = useMatch('/direct/*');
    const isGroups = useMatch('/groups/*');

    function setDirectLinkClasses({ isActive }) {
        return [styles.categoryButton, styles.direct, isActive && styles.activeLink].filter(Boolean).join(' ');
    }

    function setGroupsLinkClasses({ isActive }) {
        return [styles.categoryButton, styles.groups, isActive && styles.activeLink].filter(Boolean).join(' ');
    }

    return (
        <>
            <nav className={styles.categories}>
                <NavLink className={setDirectLinkClasses} to="/direct">
                    <div className={styles.categoryIcon}></div>
                </NavLink>
                <NavLink className={setGroupsLinkClasses} to="/groups">
                    <div className={styles.categoryIcon}></div>
                </NavLink>
            </nav>
            {isDirect && (
                <div className={`${styles.categoryBanner} ${styles.directCategory}`}>
                    <h3 className={styles.categoryName}>Direct</h3>
                    <CreateChat type={'private'} />
                </div>
            )}
            {isGroups && (
                <div className={`${styles.categoryBanner} ${styles.groupsCategory}`}>
                    <h3 className={styles.categoryName}>Groups</h3>
                    <CreateChat type={'group'} />
                </div>
            )}
        </>
    );
}
