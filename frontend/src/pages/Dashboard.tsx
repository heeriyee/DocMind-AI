import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const [questionsAsked] = useState(() => {
    return Number(
      localStorage.getItem("docmind_questions") || "0"
    );
  });

  const userEmail =
    localStorage.getItem("docmind_user_email") || "User";

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8001/documents"
      );

      const data = await response.json();

      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Could not fetch documents:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Generate summary
  const summarizeDocument = async () => {
    if (!selectedDocument) {
      alert("Select a document first!");
      return;
    }

    setLoading(true);
    setSummary("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8001/summary",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: selectedDocument,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to generate summary"
        );
      }

      setSummary(data.summary);
    } catch (error) {
      console.error("Summary error:", error);

      setSummary(
        "Could not generate the document summary."
      );
    } finally {
      setLoading(false);
    }
  };

  // Open chat for selected document
  const openChat = (document: string) => {
    navigate(
      `/chat?document=${encodeURIComponent(document)}`
    );
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("docmind_logged_in");
    localStorage.removeItem("docmind_user_email");

    navigate("/login");
  };

  return (
    <div className="dashboard">

      {/* Header */}
      <div className="dashboard-header">

        <div>
          <h1>DocMind AI Dashboard</h1>

          <p>
            Welcome back, <strong>{userEmail}</strong>
          </p>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>

      </div>

      {/* Statistics */}
      <div className="cards">

        <div className="dashboard-card">
          <h2>{documents.length}</h2>
          <p>PDFs Uploaded</p>
        </div>

        <div className="dashboard-card">
          <h2>{questionsAsked}</h2>
          <p>Questions Asked</p>
        </div>

        <div className="dashboard-card">
          <h2>Active</h2>
          <p>RAG AI Status</p>
        </div>

      </div>

      {/* Upload */}
      <div className="dashboard-actions">

        <button
          onClick={() => navigate("/upload")}
        >
          + Upload New PDF
        </button>

      </div>

      {/* Documents */}
      <div className="documents-section">

        <h2>Your Documents</h2>

        {documents.length === 0 ? (

          <div className="empty-state">

            <p>No documents uploaded yet.</p>

            <button
              onClick={() => navigate("/upload")}
            >
              Upload Your First PDF
            </button>

          </div>

        ) : (

          <div className="document-list">

            {documents.map((document) => (

              <div
                key={document}
                className={`document-card ${
                  selectedDocument === document
                    ? "selected"
                    : ""
                }`}
              >

                <div
                  className="document-name"
                  onClick={() =>
                    setSelectedDocument(document)
                  }
                >
                  📄 {document}
                </div>

                <div className="document-actions">

                  <button
                    onClick={() =>
                      setSelectedDocument(document)
                    }
                  >
                    📝 Summarize
                  </button>

                  <button
                    onClick={() =>
                      openChat(document)
                    }
                  >
                    💬 Chat
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* Summary */}
      <div className="summary-section">

        <h2>Document Summary</h2>

        <p>
          Selected document:{" "}
          <strong>
            {selectedDocument || "None"}
          </strong>
        </p>

        <button
          onClick={summarizeDocument}
          disabled={
            loading || !selectedDocument
          }
        >
          {loading
            ? "Generating Summary..."
            : "Summarize Document"}
        </button>

        {summary && (

          <div className="summary-result">

            <h2>AI Summary</h2>

            <p>{summary}</p>

          </div>

        )}

      </div>

    </div>
  );
}

export default Dashboard;