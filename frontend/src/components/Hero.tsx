import { Link } from "react-router-dom";
import "../styles/Hero.css";

function Hero() {
  return (
    <section className="hero">

      <div className="hero-content">

        <div className="hero-badge">
          ✦ AI-POWERED DOCUMENT INTELLIGENCE
        </div>

        <h1>
          Your Intelligent
          <br />
          <span>Document Assistant</span>
        </h1>

        <p>
          Upload your PDFs, ask questions in natural language,
          summarize complex documents, and get accurate
          AI-powered answers grounded in your files.
        </p>

        <div className="hero-buttons">

          <Link
            to="/upload"
            className="primary-btn"
          >
            Upload PDF →
          </Link>

          <Link
            to="/dashboard"
            className="secondary-btn"
          >
            Open Dashboard
          </Link>

        </div>

        <div className="hero-stats">

          <div>
            <strong>RAG</strong>
            <span>Smart Retrieval</span>
          </div>

          <div>
            <strong>AI</strong>
            <span>Gemini Powered</span>
          </div>

          <div>
            <strong>PDF</strong>
            <span>Document Analysis</span>
          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;