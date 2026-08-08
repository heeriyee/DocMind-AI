import { Link } from "react-router-dom";
import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-main">

        <div className="footer-brand">

          <h2>
            <span>✦</span> DocMind AI
          </h2>

          <p>
            Intelligent document analysis powered by
            Retrieval-Augmented Generation.
          </p>

        </div>

        <div className="footer-links">

          <h3>Navigate</h3>

          <Link to="/">Home</Link>
          <Link to="/upload">Upload</Link>
          <Link to="/chat">AI Chat</Link>
          <Link to="/dashboard">Dashboard</Link>

        </div>

        <div className="footer-links">

          <h3>Technology</h3>

          <span>RAG</span>
          <span>ChromaDB</span>
          <span>Gemini AI</span>
          <span>FastAPI</span>

        </div>

      </div>

      <div className="footer-bottom">
        <span>
          © 2026 DocMind AI
        </span>

        <span>
          Intelligent Document Question Answering
        </span>
      </div>

    </footer>
  );
}

export default Footer;