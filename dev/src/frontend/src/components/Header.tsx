import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";

const Header: React.FC = () => {
    return (
        <header className="header">
            <h1>Quartissimo</h1>
            <nav>
                <ul className="nav-list">
                    <li><Link to="/">Accueil</Link></li>
                    {}
                </ul>
            </nav>
        </header>
    );
};

export default Header;
