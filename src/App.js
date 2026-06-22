import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const SYSTEM_PROMPT = `You are Juri, a friendly and professional AI assistant 
  helping the HR team at meinestadt.de. You answer questions about HR policies, 
  benefits, vacation, leave requests, onboarding, and internal processes in a warm, 
  clear, and concise way. Always acknowledge the employee's question first, then 
  answer clearly, and end with an offer to help further. 
  Respond in German by default unless the user writes in English.`;

  const speakResponse = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const germanVoice = voices.find((v) => v.lang === "de-DE");
    if (germanVoice) utterance.voice = germanVoice;
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", parts: [{ text: input }] };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(
        process.env.REACT_APP_GEMINI_KEY
      );

      const model = genAI.getGenerativeModel({
        model: "gemini-pro",
        systemInstruction: SYSTEM_PROMPT,
      });

      const chat = model.startChat({
        history: updatedMessages.slice(0, -1).map((msg) => ({
          role: msg.role,
          parts: msg.parts,
        })),
      });

      const result = await chat.sendMessage(input);
      const replyText = result.response.text();

      const assistantMessage = {
        role: "model",
        parts: [{ text: replyText }],
      };

      setMessages([...updatedMessages, assistantMessage]);
      speakResponse(replyText);
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...updatedMessages,
        {
          role: "model",
          parts: [{ text: "Sorry, something went wrong. Please try again." }],
        },
      ]);
    }
    setLoading(false);
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser. Use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
    };
    recognition.start();
  };

  return (
    <div style={{
      maxWidth: "650px", margin: "40px auto",
      fontFamily: "Arial, sans-serif", padding: "0 16px"
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        borderRadius: "12px", padding: "20px",
        marginBottom: "16px", textAlign: "center"
      }}>
        <h1 style={{ color: "white", margin: 0, fontSize: "24px" }}>
          Juri
        </h1>
        <p style={{ color: "#aaa", margin: "4px 0 0", fontSize: "13px" }}>
          HR AI Assistant | meinestadt.de
        </p>
        {isSpeaking && (
          <p style={{ color: "#4CAF50", margin: "8px 0 0", fontSize: "12px" }}>
            Juri is speaking...
          </p>
        )}
      </div>

      <div style={{
        border: "1px solid #ddd", borderRadius: "12px",
        padding: "16px", height: "400px", overflowY: "auto",
        marginBottom: "12px", backgroundColor: "#f9f9f9"
      }}>
        {messages.length === 0 && (
          <p style={{ color: "#aaa", textAlign: "center", marginTop: "160px" }}>
            Hallo! Ich bin Juri. Wie kann ich dir helfen?
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            textAlign: msg.role === "user" ? "right" : "left",
            margin: "8px 0"
          }}>
            <span style={{
              background: msg.role === "user" ? "#1a1a2e" : "#e0e0e0",
              color: msg.role === "user" ? "white" : "black",
              padding: "10px 14px", borderRadius: "18px",
              display: "inline-block", maxWidth: "80%",
              fontSize: "14px", lineHeight: "1.4"
            }}>
              {msg.parts[0].text}
            </span>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: "left", margin: "8px 0" }}>
            <span style={{
              background: "#e0e0e0", padding: "10px 14px",
              borderRadius: "18px", display: "inline-block",
              fontSize: "14px", color: "#888"
            }}>
              Juri thinks...
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask Juri something... (or use the mic)"
          style={{
            flex: 1, padding: "12px", borderRadius: "8px",
            border: "1px solid #ddd", fontSize: "14px", outline: "none"
          }}
        />
        <button
          onClick={startListening}
          title="Speak your question"
          style={{
            padding: "12px 16px", backgroundColor: "#28a745",
            color: "white", border: "none", borderRadius: "8px",
            cursor: "pointer", fontSize: "18px"
          }}
        >
          🎤
        </button>
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: "12px 20px", backgroundColor: "#1a1a2e",
            color: "white", border: "none", borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px", opacity: loading ? 0.7 : 1
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;