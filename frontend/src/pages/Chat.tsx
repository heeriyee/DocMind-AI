
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "../styles/Chat.css";

interface Message {
  type: "user" | "bot";
  text: string;
  sources?: {
    filename: string;
    chunk: number;
  }[];
}

function Chat() {
  const params = new URLSearchParams(window.location.search);
  const documentName = params.get("document") || "";

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      text: documentName
        ? `Hello! Ask me anything about ${documentName}.`
        : "Hello! Upload a PDF and ask me anything.",
    },
  ]);

  const sendMessage = async () => {
    if (!question.trim() || loading) return;

    const userQuestion = question.trim();

    setMessages((prev) => [
      ...prev,
      { type: "user", text: userQuestion },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://docmind-ai-nk0e.onrender.com/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: userQuestion,
            filename: documentName || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : `Request failed with status ${response.status}`
        );
      }

      const currentCount = Number(
        localStorage.getItem("docmind_questions") || "0"
      );

      localStorage.setItem(
        "docmind_questions",
        String(currentCount + 1)
      );

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: data.answer || "I couldn't generate an answer.",
          sources: data.sources || [],
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred.";

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: `Sorry, I couldn't process your question.\n\n**Error:** ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-ai-icon">✦</span>

          <div>
            <h1>DocMind AI Chat</h1>

            {documentName && (
              <p>
                Document: <strong>{documentName}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="chat-window">
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.type === "user"
                ? "user-message"
                : "bot-message"
            }
          >
            {message.type === "bot" ? (
              <ReactMarkdown>{message.text}</ReactMarkdown>
            ) : (
              <p>{message.text}</p>
            )}

            {message.type === "bot" &&
              message.sources &&
              message.sources.length > 0 && (
                <div className="sources">
                  <strong>Sources</strong>
                  <ul>
                    {message.sources.map((source, sourceIndex) => (
                      <li key={sourceIndex}>
                        {source.filename} — Chunk {source.chunk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        ))}

        {loading && (
          <div className="bot-message thinking-message">
            <span>Thinking</span>
            <span className="thinking-dots">...</span>
          </div>
        )}
      </div>

      <form
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage();
        }}
      >
        <input
          type="text"
          placeholder={
            documentName
              ? "Ask about this document..."
              : "Ask something..."
          }
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading || !question.trim()}
        >
          {loading ? "Thinking..." : "Send →"}
        </button>
      </form>
    </div>
  );
}

export default Chat;
