import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default function BargainChat({ product, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize model with system instruction
  const [chat] = useState(() => {
    const customModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are a helpful bargain assistant for an agricultural marketplace app called eGanthe. 
A buyer wants to negotiate the price of the following product with the farmer:

Product Name: ${product?.name}
Price: ₹${product?.price} per kg
Available Quantity: ${product?.quantity} kg
Seller: ${product?.farmerName}
Location: ${product?.farmerLocation}
Category: ${product?.category}
Description: ${product?.description}

Help the buyer negotiate politely. Suggest reasonable counter-offers, bulk discounts, and help them get the best deal. Keep responses short and friendly.`
    });

    return customModel.startChat({
      history: []
    });
  });

  const sendMessage = async (text) => {
    const userText = text || input;
    if (!userText.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const result = await chat.sendMessage(userText);
      const botText = result.response.text();
      setMessages((prev) => [...prev, { role: "model", text: botText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Can you reduce the price?",
    "Best price for 10kg?",
    "Any bulk discount?",
  ];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <span>💬 Bargain with Farmer</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Product Info Strip */}
        <div style={styles.productStrip}>
          🛒 <strong>{product.name}</strong> — ₹{product.price}/kg &nbsp;|&nbsp; {product.quantity}kg available
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {/* Welcome message */}
          <div style={{ ...styles.bubble, alignSelf: "flex-start", background: "#e8f5e9", color: "#1b5e20" }}>
            Hi! 👋 I'm here to help you bargain for <strong>{product.name}</strong> at ₹{product.price}/kg. What would you like to negotiate?
          </div>

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.bubble,
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                background: msg.role === "user" ? "#2d6a4f" : "#e8f5e9",
                color: msg.role === "user" ? "#fff" : "#1b5e20",
              }}
            >
              {msg.text}
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.bubble, alignSelf: "flex-start", background: "#e8f5e9", color: "#999" }}>
              Typing...
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        {messages.length === 0 && (
          <div style={styles.suggestions}>
            {suggestions.map((s, i) => (
              <button key={i} style={styles.chip} onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your offer..."
          />
          <button style={styles.sendBtn} onClick={() => sendMessage()} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", borderRadius: "16px", width: "600px", height: "80vh", maxHeight: "800px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" },
  header: { background: "#2d6a4f", color: "#fff", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", fontSize: "15px" },
  closeBtn: { background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer" },
  productStrip: { background: "#f1f8f4", padding: "8px 16px", fontSize: "13px", color: "#2d6a4f", borderBottom: "1px solid #d0e8d8" },
  messages: { flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" },
  bubble: { maxWidth: "80%", padding: "10px 14px", borderRadius: "14px", fontSize: "14px", lineHeight: "1.5", whiteSpace: "pre-wrap" },
  suggestions: { display: "flex", flexWrap: "wrap", gap: "8px", padding: "0 14px 10px" },
  chip: { background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: "20px", padding: "6px 12px", fontSize: "12px", color: "#2d6a4f", cursor: "pointer" },
  inputRow: { display: "flex", padding: "12px", borderTop: "1px solid #eee", gap: "8px" },
  input: { flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px", outline: "none" },
  sendBtn: { padding: "10px 16px", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
};
