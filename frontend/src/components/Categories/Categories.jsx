import { NavLink, useMatch } from "react-router-dom";

import './Categories.css';

export default function Categories() {
    const isDirect = useMatch('/chats/*');
    const isGroups = useMatch('/groups/*');

    return (
        <>
            <nav className="categories">
                <NavLink className="category-button" to="/chats"><div className="radius"></div></NavLink>
                <NavLink className="category-button" to="/groups"><div className="radius"></div></NavLink>
            </nav>
            <div className="category">
                {isDirect && <>direct messages</>}
                {isGroups && <>groups</>}
            </div>
        </>
    )
}