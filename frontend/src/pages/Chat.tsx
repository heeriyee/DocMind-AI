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
  // Get selected document from URL
  const params = new URLSearchParams(
    window.location.search
  );

  const documentName =
    params.get("document") || "";

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
    if (!question.trim() || loading) {
      return;
    }

    const userQuestion = question.trim();

    // Show user's question immediately
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: userQuestion,
      },
    ]);

    // Clear input
    setQuestion("");

    // Start loading
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8001/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            question: userQuestion,
            filename: documentName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Something went wrong."
        );
      }

      // ==========================================
      // UPDATE QUESTIONS ASKED
      // Only count successful questions
      // ==========================================

      const currentCount = Number(
        localStorage.getItem(
          "docmind_questions"
        ) || "0"
      );

      localStorage.setItem(
        "docmind_questions",
        String(currentCount + 1)
      );

      // ==========================================
      // SHOW AI ANSWER
      // ==========================================

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",

          text:
            data.answer ||
            "I couldn't generate an answer.",

          sources: data.sources || [],
        },
      ]);

    } catch (error) {
      console.error(
        "Chat error:",
        error
      );

      // Show error inside chat
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text:
            "Sorry, I couldn't process your question. Please try again.",
        },
      ]);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="chat-header">

        <div className="chat-title">
          <span className="chat-ai-icon">
            ✦
          </span>

          <div>
            <h1>DocMind AI Chat</h1>

            {documentName && (
              <p>
                Document:{" "}
                <strong>
                  {documentName}
                </strong>
              </p>
            )}
          </div>
        </div>

      </div>


      {/* =====================================
          CHAT WINDOW
      ===================================== */}

      <div className="chat-window">

        {messages.map(
          (message, index) => (

            <div
              key={index}
              className={
                message.type === "user"
                  ? "user-message"
                  : "bot-message"
              }
            >

              {/* Message */}

              {message.type === "bot" ? (
                <ReactMarkdown>
                  {message.text}
                </ReactMarkdown>
              ) : (
                <p>{message.text}</p>
              )}


              {/* Sources */}

              {message.type === "bot" &&
                message.sources &&
                message.sources.length > 0 && (

                  <div className="sources">

                    <strong>
                      Sources
                    </strong>

                    <ul>

                      {message.sources.map(
                        (
                          source,
                          sourceIndex
                        ) => (

                          <li
                            key={
                              sourceIndex
                            }
                          >
                            {source.filename}
                            {" — "}
                            Chunk{" "}
                            {source.chunk}
                          </li>

                        )
                      )}

                    </ul>

                  </div>

                )}

            </div>

          )
        )}


        {/* =================================
            LOADING
        ================================= */}

        {loading && (

          <div className="bot-message thinking-message">

            <span>
              Thinking
            </span>

            <span className="thinking-dots">
              ...
            </span>

          </div>

        )}

      </div>


      {/* =====================================
          INPUT
      ===================================== */}

      <div className="chat-input">

        <input
          type="text"
          placeholder={
            documentName
              ? "Ask about this document..."
              : "Ask something..."
          }

          value={question}

          onChange={(e) =>
            setQuestion(
              e.target.value
            )
          }

          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey
            ) {
              e.preventDefault();
              sendMessage();
            }
          }}

          disabled={loading}
        />

        <button
          onClick={sendMessage}
          disabled={
            loading ||
            !question.trim()
          }
        >
          {loading
            ? "..."
            : "Send →"}
        </button>

      </div>

    </div>
  );
}

export default Chat;