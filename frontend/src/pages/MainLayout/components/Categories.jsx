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
                <NavLink className={setDirectLinkClasses} to="/direct"></NavLink>
                <NavLink className={setGroupsLinkClasses} to="/groups"></NavLink>
            </nav>
            <div className={`${styles.categoryName} ${isGroups ? styles.groupsCategory : ''}`}>
                {isDirect && (
                    <>
                        <div>direct messages</div>
                        <CreateChat type={'private'} />
                    </>
                )}
                {isGroups && (
                    <>
                        <div>groups</div>
                        <CreateChat type={'group'} />
                    </>
                )}
            </div>
        </>
    );
}
