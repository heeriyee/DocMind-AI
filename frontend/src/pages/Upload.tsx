
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Upload.css";

function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isError, setIsError] = useState(false);

  const selectFile = (selectedFile?: File) => {
    if (!selectedFile) return;

    if (
      !selectedFile.name.toLowerCase().endsWith(".pdf") ||
      (selectedFile.type &&
        selectedFile.type !== "application/pdf")
    ) {
      setFile(null);
      setIsError(true);
      setMessage("Please select a valid PDF file.");
      return;
    }

    setFile(selectedFile);
    setMessage("");
    setIsError(false);
  };

  const uploadFile = async () => {
    if (!file) {
      setIsError(true);
      setMessage("Please select a PDF first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setMessage("Uploading and processing your PDF...");
      setIsError(false);

      const response = await fetch(
        "http://127.0.0.1:8000/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(
          data.detail || data.message || "Upload failed."
        );
        return;
      }

      setMessage(
        `Upload successful! ${data.chunks} chunks created.`
      );

      window.setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (error) {
      console.error("Upload error:", error);
      setIsError(true);
      setMessage(
        "Could not connect to the backend. Make sure the server is running."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="upload-page">
      <section className="upload-card">
        <div className="upload-heading">
          <div className="upload-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="27"
              height="27"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M8 13h8M8 17h8" />
            </svg>
          </div>

          <span className="upload-eyebrow">
            DOCUMENT WORKSPACE
          </span>

          <h1>Upload your PDF</h1>

          <p className="upload-subtitle">
            Turn your documents into knowledge. Upload a PDF
            to summarize its content and ask questions with
            DocMind AI.
          </p>
        </div>

        <label
          className={`file-drop-zone ${
            file ? "file-selected" : ""
          } ${isDragging ? "drag-active" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            if (!uploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);

            if (!uploading) {
              selectFile(event.dataTransfer.files[0]);
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            aria-label="Choose a PDF document"
            onChange={(event) => {
              selectFile(event.target.files?.[0]);
              event.target.value = "";
            }}
            disabled={uploading}
          />

          <div className="file-icon" aria-hidden="true">
            {file ? (
              <svg
                viewBox="0 0 24 24"
                width="25"
                height="25"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="27"
                height="27"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 16V4m-5 5 5-5 5 5" />
                <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
              </svg>
            )}
          </div>

          {file ? (
            <>
              <strong>PDF ready to upload</strong>
              <span>Choose another file or continue below</span>
            </>
          ) : (
            <>
              <strong>Drop your PDF here</strong>
              <span>
                or{" "}
                <span className="browse-link">
                  browse files
                </span>{" "}
                from your computer
              </span>
            </>
          )}

          <small>PDF documents only</small>
        </label>

        {file && (
          <div className="selected-file">
            <div className="selected-file-icon">PDF</div>

            <div className="selected-file-details">
              <strong title={file.name}>{file.name}</strong>
              <small>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </small>
            </div>

            <button
              type="button"
              className="remove-file-button"
              aria-label="Remove selected file"
              onClick={() => {
                setFile(null);
                setMessage("");
                setIsError(false);
              }}
              disabled={uploading}
            >
              ×
            </button>
          </div>
        )}

        <button
          type="button"
          className="upload-button"
          onClick={uploadFile}
          disabled={uploading || !file}
        >
          {uploading ? (
            <>
              <span className="upload-spinner" />
              Processing document...
            </>
          ) : (
            <>
              Upload &amp; Analyze PDF
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>

        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`upload-message ${
              isError
                ? "error"
                : message.toLowerCase().includes("successful")
                  ? "success"
                  : "processing"
            }`}
          >
            {message}
          </div>
        )}

        <div className="upload-info">
          <span className="upload-info-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="19"
              height="19"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>

          <p>
            Your document is processed by DocMind AI so you
            can explore its contents through summaries and
            questions.
          </p>
        </div>

        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/dashboard")}
          disabled={uploading}
        >
          <span aria-hidden="true">←</span>
          Back to Dashboard
        </button>
      </section>
    </main>
  );
}

export default Upload;
