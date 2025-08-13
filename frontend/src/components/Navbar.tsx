import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
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
            <div className="navbar-links">
                <Link to="/">Home</Link>
                <Link to="/add-course">Add Course</Link>
                {token ? (
                    <button onClick={handleLogout}>Logout</button>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
