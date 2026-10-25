
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "../styles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [error, setError] = useState("");

  const [questionsAsked] = useState(() =>
    Number(localStorage.getItem("docmind_questions") || "0")
  );

  const userEmail =
    localStorage.getItem("docmind_user_email") || "User";

  const filteredDocuments = useMemo(
    () =>
      documents.filter((document) =>
        document.toLowerCase().includes(search.toLowerCase())
      ),
    [documents, search]
  );

  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/documents");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load documents.");
      }

      const list: string[] = data.documents || [];
      setDocuments(list);

      setSelectedDocument((current) =>
        list.includes(current) ? current : ""
      );
    } catch (err) {
      console.error("Could not fetch documents:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the backend."
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    void fetchDocuments();
  }, []);

  const summarizeDocument = async (document = selectedDocument) => {
    if (!document || loading) return;

    setSelectedDocument(document);
    setLoading(true);
    setSummary("");
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: document }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate summary.");
      }

      setSummary(data.summary || "No summary was returned.");
    } catch (err) {
      console.error("Summary error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate the summary. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const openChat = (document: string) => {
    navigate(`/chat?document=${encodeURIComponent(document)}`);
  };

  const logout = () => {
    localStorage.removeItem("docmind_logged_in");
    localStorage.removeItem("docmind_user_email");
    navigate("/login");
  };

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="brand-mark" aria-hidden="true">
            <span>✦</span>
          </div>
          <div>
            <p className="eyebrow">YOUR AI WORKSPACE</p>
            <h1>DocMind AI</h1>
          </div>
        </div>

        <div className="dashboard-user">
          <div className="user-details">
            <span className="user-label">Signed in as</span>
            <strong title={userEmail}>{userEmail}</strong>
          </div>
          <button className="logout-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <section className="dashboard-welcome">
        <div>
          <p className="eyebrow">YOUR DOCUMENTS, MADE SIMPLER</p>
          <h2>Welcome back 👋</h2>
          <p className="welcome-description">
            Upload, explore, and understand your documents with AI.
          </p>
        </div>

        <button
          className="primary-button upload-button"
          onClick={() => navigate("/upload")}
        >
          <span aria-hidden="true">＋</span> Upload PDF
        </button>
      </section>

      <section className="dashboard-stats" aria-label="Workspace statistics">
        <article className="stat-card">
          <div className="stat-icon stat-icon-purple" aria-hidden="true">
            <span>▤</span>
          </div>
          <div>
            <p>Total documents</p>
            <h3>{documents.length}</h3>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon stat-icon-teal" aria-hidden="true">
            <span>↗</span>
          </div>
          <div>
            <p>Questions asked</p>
            <h3>{questionsAsked}</h3>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon stat-icon-green" aria-hidden="true">
            <span>✓</span>
          </div>
          <div>
            <p>Workspace status</p>
            <h3 className="status-value">
              <span className="status-dot" /> Ready
            </h3>
          </div>
        </article>
      </section>

      {error && (
        <div className="dashboard-alert" role="alert">
          <span>{error}</span>
          <button onClick={() => void fetchDocuments()}>
            Retry
          </button>
        </div>
      )}

      <section className="documents-section">
        <div className="section-heading">
          <div>
            <h2>Your documents</h2>
            <p>Choose a PDF to chat with it or generate a summary.</p>
          </div>
          <span className="document-count">
            {documents.length} {documents.length === 1 ? "file" : "files"}
          </span>
        </div>

        <div className="document-toolbar">
          <label className="document-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search your documents..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search documents"
            />
          </label>

          <button
            className="secondary-button refresh-button"
            onClick={() => void fetchDocuments()}
            disabled={loadingDocuments}
          >
            {loadingDocuments ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {loadingDocuments ? (
          <div className="dashboard-empty-state">
            <p>Loading your documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="empty-icon" aria-hidden="true">▤</div>
            <h3>Your workspace is ready</h3>
            <p>Upload your first PDF to start asking questions and exploring summaries.</p>
            <button
              className="primary-button"
              onClick={() => navigate("/upload")}
            >
              Upload your first PDF
            </button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="dashboard-empty-state">
            <h3>No matching documents</h3>
            <p>Try a different search term.</p>
            <button
              className="secondary-button"
              onClick={() => setSearch("")}
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="document-list">
            {filteredDocuments.map((document) => {
              const selected = selectedDocument === document;

              return (
                <article
                  key={document}
                  className={`document-card${selected ? " selected" : ""}`}
                >
                  <button
                    className="document-select"
                    onClick={() => {
                      setSelectedDocument(document);
                      setSummary("");
                    }}
                    aria-pressed={selected}
                    title={`Select ${document}`}
                  >
                    <span className="pdf-icon" aria-hidden="true">
                      PDF
                    </span>
                    <span className="document-info">
                      <strong title={document}>{document}</strong>
                      <span>
                        {selected ? "Selected document" : "PDF document"}
                      </span>
                    </span>
                    {selected && (
                      <span className="selected-indicator" aria-label="Selected">
                        ✓
                      </span>
                    )}
                  </button>

                  <div className="document-actions">
                    <button
                      className="secondary-button"
                      onClick={() => void summarizeDocument(document)}
                      disabled={loading}
                    >
                      Summarize
                    </button>
                    <button
                      className="primary-button"
                      onClick={() => openChat(document)}
                    >
                      Chat with PDF <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {(summary || loading) && (
        <section className="summary-section">
          <div className="summary-heading">
            <div>
              <p className="eyebrow">AI-POWERED INSIGHTS</p>
              <h2>Document summary</h2>
              <p className="summary-document-name">
                {selectedDocument}
              </p>
            </div>
            {summary && (
              <button
                className="secondary-button"
                onClick={() => setSummary("")}
              >
                Close
              </button>
            )}
          </div>

          {loading ? (
            <div className="summary-loading" role="status">
              <span className="loading-spinner" />
              <div>
                <strong>Generating your summary</strong>
                <p>This may take a little while. Please keep this page open.</p>
              </div>
            </div>
          ) : (
            <div className="summary-result">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default Dashboard;
