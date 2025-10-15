import { useState, useEffect, useRef } from "react";
import { sendChat, getHistory, deleteHistory } from "./api";
import "./Chat.css";

const sessionId = "abc123";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  const fetchHistory = async () => {
    const res = await getHistory(sessionId);
    setMessages(res.history || []);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);
    const userMessage = input;
    setInput("");
    setBotTyping(true);

    const res = await sendChat(sessionId, userMessage);
    const botResponse = res.answer || "I'm not sure how to respond to that.";

    let displayedText = "";
    const words = botResponse.split(" ");
    let i = 0;

    const typingInterval = setInterval(() => {
      displayedText += (i === 0 ? "" : " ") + words[i];
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === "bot") {
          newMessages[newMessages.length - 1].text = displayedText;
        } else {
          newMessages.push({ role: "bot", text: displayedText });
        }
        return newMessages;
      });

      i++;
      if (i >= words.length) {
        clearInterval(typingInterval);
        setBotTyping(false);
      }
    }, 80);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleReset = async () => {
    const confirmReset = window.confirm("Are you sure you want to reset the chat?");
    if (!confirmReset) return;

    await deleteHistory(sessionId);
    setMessages([]);
    setInput("");
    setBotTyping(false);
  };

  // ✅ Helper function to format text into nice readable HTML
  const formatMessage = (text) => {
    if (!text) return "";

    let formatted = text
      .replace(/\n/g, "<br/>") // line breaks
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **bold**
      .replace(/^- (.*$)/gm, "• $1") // bullet points
      .replace(/`(.*?)`/g, "<code>$1</code>"); // inline code

    return formatted;
  };

  return (
    <div className="container">
      <h1 className="chat-title">Voosh Chat</h1>
      <p className="chat-subtitle">A Retrieval-Augmented Generation (RAG) Chatbot</p>

      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.role}`}
            dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
          />
        ))}

        {botTyping && (
          <div className="message bot typing">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask me anything..."
        />
        <button className="send" onClick={handleSend}>
          Send
        </button>
        <button className="reset" onClick={handleReset}>
          Reset Chat
        </button>
      </div>
    </div>
  );
}
