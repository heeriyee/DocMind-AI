import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Upload.css";

function Upload() {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const uploadFile = async () => {
    if (!file) {
      setMessage("Please select a PDF first.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setMessage("Please select a PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setMessage("Uploading and processing your PDF...");

      const response = await fetch(
        "http://127.0.0.1:8001/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            data.message ||
            "Upload failed."
        );
        return;
      }

      setMessage(
        `Upload successful! ${data.chunks} chunks created.`
      );

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);

    } catch (error) {
      console.error("Upload error:", error);

      setMessage(
        "Could not connect to the backend. Make sure the server is running."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">

      <div className="upload-card">

        {/* Header */}
        <div className="upload-icon">
          📄
        </div>

        <h1>Upload Your PDF</h1>

        <p className="upload-subtitle">
          Give DocMind AI a document and let it
          understand the content for you.
        </p>

        {/* File selector */}
        <label
          className={`file-drop-zone ${
            file ? "file-selected" : ""
          }`}
        >

          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              if (
                e.target.files &&
                e.target.files.length > 0
              ) {
                setFile(e.target.files[0]);
                setMessage("");
              }
            }}
            disabled={uploading}
          />

          <div className="file-icon">
            {file ? "✓" : "↑"}
          </div>

          {file ? (
            <>
              <strong>{file.name}</strong>
              <span>PDF selected successfully</span>
            </>
          ) : (
            <>
              <strong>Choose a PDF document</strong>
              <span>
                Click here to browse your files
              </span>
            </>
          )}

        </label>

        {/* File information */}
        {file && (
          <div className="selected-file">
            <span>📄</span>

            <div>
              <strong>{file.name}</strong>

              <small>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </small>
            </div>
          </div>
        )}

        {/* Upload button */}
        <button
          className="upload-button"
          onClick={uploadFile}
          disabled={uploading || !file}
        >
          {uploading
            ? "Processing Document..."
            : "Upload & Analyze PDF"}
        </button>

        {/* Status */}
        {message && (
          <div
            className={`upload-message ${
              message.toLowerCase().includes("successful")
                ? "success"
                : ""
            }`}
          >
            {message}
          </div>
        )}

        {/* Info */}
        <div className="upload-info">
          <span>🔒</span>
          <p>
            Your document will be processed using
            DocMind AI's document analysis pipeline.
          </p>
        </div>

        {/* Dashboard link */}
        <button
          className="back-button"
          onClick={() => navigate("/dashboard")}
          disabled={uploading}
        >
          ← Back to Dashboard
        </button>

      </div>

    </div>
  );
}

export default Upload;