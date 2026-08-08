import "../styles/Navbar.css";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">

      <Link to="/" className="navbar-logo">
        <span className="logo-symbol">✦</span>
        DocMind AI
      </Link>

      <div className="nav-links">

        <Link to="/">Home</Link>

        <Link to="/upload">Upload</Link>

        <Link to="/chat">AI Chat</Link>

        <Link to="/dashboard">Dashboard</Link>

        <Link
          to="/login"
          className="login-nav-button"
        >
          Login
        </Link>

      </div>

    </nav>
  );
}

export default Navbar;