import { NavLink, useMatch } from "react-router-dom";

import CreateChat from "../CreateChat/CreateChat";

import './Categories.css';

export default function Categories() {
    const isDirect = useMatch('/chats/*');
    const isGroups = useMatch('/groups/*');

    return (
        <>
            <nav className="categories">
                <NavLink className="category-button direct" to="/chats"></NavLink>
                <NavLink className="category-button groups" to="/groups"></NavLink>
            </nav>
            <div className={`category-name ${isGroups ? "groups-category" : ""}`}>
                {isDirect && <><div>direct messages</div></>}
                {isGroups && <>groups</>}
            </div>
        </>
    )
}