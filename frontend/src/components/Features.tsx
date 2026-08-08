import {
  FaFilePdf,
  FaRobot,
  FaSearch,
  FaLock,
} from "react-icons/fa";

import "../styles/Features.css";

function Features() {
  return (
    <section className="features">

      <div className="features-heading">

        <span>POWERFUL FEATURES</span>

        <h2>
          Everything you need to
          <br />
          understand your documents.
        </h2>

        <p>
          DocMind AI combines document retrieval,
          semantic search and generative AI into one
          intelligent workspace.
        </p>

      </div>

      <div className="feature-grid">

        <div className="feature-card">
          <FaFilePdf className="feature-icon" />

          <h3>PDF Analysis</h3>

          <p>
            Upload your PDF documents and automatically
            process their content for intelligent analysis.
          </p>
        </div>

        <div className="feature-card">
          <FaRobot className="feature-icon" />

          <h3>AI Chat</h3>

          <p>
            Ask questions naturally and receive
            context-aware answers from your documents.
          </p>
        </div>

        <div className="feature-card">
          <FaSearch className="feature-icon" />

          <h3>Semantic Search</h3>

          <p>
            Find relevant information based on meaning,
            not just simple keyword matching.
          </p>
        </div>

        <div className="feature-card">
          <FaLock className="feature-icon" />

          <h3>Grounded Answers</h3>

          <p>
            Responses are generated from retrieved
            document context to reduce hallucinations.
          </p>
        </div>

      </div>

    </section>
  );
}

export default Features;