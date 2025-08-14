import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { FaBars, FaTimes } from "react-icons/fa";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const token = localStorage.getItem("token");

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">CourseHub</Link>
            </div>

            {/* Hamburger Menu Button */}
            <button
                className="hamburger"
                onClick={() => setMenuOpen((prev) => !prev)}
            >
                {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>

            {/* Navigation Links */}
            <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
                <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
                <Link to="/add-course" onClick={() => setMenuOpen(false)}>Add Course</Link>
                {token ? (
                    <button onClick={() => { handleLogout(); setMenuOpen(false); }}>Logout</button>
                ) : (
                    <>
                        <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
                        <Link to="/register" onClick={() => setMenuOpen(false)}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
