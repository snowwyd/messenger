import { NavLink, useMatch } from "react-router-dom";

import CreateChat from "../CreateChat/CreateChat";

import styles from './Categories.module.css';

export default function Categories() {
    const isDirect = useMatch('/direct/*');
    const isGroups = useMatch('/groups/*');

    return (
        <>
            <nav className={styles.categories}>
                <NavLink className={({ isActive }) => `${styles.categoryButton} ${styles.direct} ${isActive ? styles.activeLink : ''}`} to="/direct"></NavLink>
                <NavLink className={({ isActive }) => `${styles.categoryButton} ${styles.groups} ${isActive ? styles.activeLink : ''}`} to="/groups"></NavLink>
            </nav>
            <div className={`${styles.categoryName} ${isGroups ? styles.groupsCategory : ""}`}>
                {isDirect && (
                    <>
                        <div>direct messages</div>
                        <CreateChat type={"private"}/>
                    </>
                )}
                {isGroups && (
                    <>
                        <div>groups</div>
                        <CreateChat type={"group"}/>
                    </>
                )}
            </div>
        </>
    )
}