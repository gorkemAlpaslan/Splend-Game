import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, limit, addDoc, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/GlobalChat.module.sass";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Timestamp | null;
  lang: "tr" | "en";
}

const detectLanguage = (text: string): "tr" | "en" => {
  const turkishChars = /[ğüşöçİıĞÜŞÖÇ]/;
  const commonTurkishWords = /\b(selam|merhaba|nasılsın|iyi|kötü|oyun|odası|evet|hayır|satranç|amiral|battı|teşekkürler|güzel|hoşgeldin|kullanıcı|bağlandı)\b/i;
  if (turkishChars.test(text) || commonTurkishWords.test(text)) {
    return "tr";
  }
  return "en";
};

const filterProfanity = (text: string): string => {
  const badWords = [
    "fuck", "shit", "asshole", "bitch", "cunt", "bastard", "dick", "pussy", "faggot",
    "amk", "aq", "sik", "piç", "siktir", "orospu", "pezevenk", "göt", "yarrak", "dalyarak", "kahpe", "amına"
  ];
  let filtered = text;
  badWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\w*\\b`, "gi");
    filtered = filtered.replace(regex, (match) => "*".repeat(match.length));
  });
  return filtered;
};

export const GlobalChat: React.FC = () => {
  const { user, isVisitor } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "en" | "tr">("all");
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch last 50 messages
    const chatRef = collection(db, "global_chats");
    const q = query(chatRef, orderBy("createdAt", "asc"), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    // Scroll to bottom when messages update or panel opens
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const displayName = user
      ? user.displayName || user.email?.split("@")[0] || "Cyber Player"
      : isVisitor
      ? "Guest Player"
      : "Anonymous";

    const userId = user ? user.uid : "guest_" + Math.random().toString(36).substr(2, 9);
    const cleanedText = filterProfanity(inputText.trim());
    const lang = detectLanguage(cleanedText);

    setInputText("");

    try {
      await addDoc(collection(db, "global_chats"), {
        userId,
        userName: displayName,
        text: cleanedText,
        createdAt: serverTimestamp(),
        lang,
      });
    } catch (err) {
      console.error("Error sending chat message:", err);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (activeTab === "all") return true;
    return msg.lang === activeTab;
  });

  const getDisplayName = (msg: ChatMessage) => {
    return msg.userName || "Player";
  };

  const getFormattedTime = (msg: ChatMessage) => {
    if (!msg.createdAt) return "Sending...";
    const date = msg.createdAt.toDate();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isSelf = (msg: ChatMessage) => {
    if (user && msg.userId === user.uid) return true;
    if (!user && msg.userId.startsWith("guest_") && msg.userName === "Guest Player") {
      // Approximate guest ownership mapping for local state styling
      return true;
    }
    return false;
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button className={styles.chatToggleBtn} onClick={() => setIsOpen(!isOpen)} id="btn-toggle-chat">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M10 3h4a8 8 0 0 1 0 16v3.5c-2-1.5-4-3.5-4-3.5H6a8 8 0 0 1 4-16z"/>
        </svg>
        COMM LINK {isOpen ? "ONLINE" : ""}
      </button>

      {/* Sliding Drawer Panel */}
      <div
        className={styles.chatPanel}
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
        id="global-chat-panel"
      >
        <div className={styles.panelHeader}>
          <span className={styles.title}>COMMUNICATIONS FREQUENCY</span>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)} id="btn-close-chat">
            &times;
          </button>
        </div>

        {/* Language Tabs */}
        <div className={styles.tabs} id="chat-tabs">
          <button
            className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("all")}
            id="tab-chat-all"
          >
            ALL SECTORS
          </button>
          <button
            className={`${styles.tab} ${activeTab === "en" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("en")}
            id="tab-chat-en"
          >
            ENGLISH (EN)
          </button>
          <button
            className={`${styles.tab} ${activeTab === "tr" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("tr")}
            id="tab-chat-tr"
          >
            TÜRKÇE (TR)
          </button>
        </div>

        {/* Scrollable messages container */}
        <div className={styles.messageList} id="chat-message-list">
          {filteredMessages.length === 0 ? (
            <div className={styles.noMessages} id="chat-empty">
              NO CONDUIT LOGS ON THIS FREQUENCY.
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.msgBubble} ${isSelf(msg) ? styles.msgSelf : styles.msgOther}`}
              >
                <div className={styles.msgMeta}>
                  <span className={styles.userName}>{getDisplayName(msg)}</span>
                  <span className={styles.time}>{getFormattedTime(msg)}</span>
                  <span className={styles.langBadge}>{msg.lang.toUpperCase()}</span>
                </div>
                <div className={styles.msgText}>{msg.text}</div>
              </div>
            ))
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Message Input form */}
        <form className={styles.inputArea} onSubmit={handleSendMessage} id="chat-input-form">
          <input
            type="text"
            className={styles.input}
            placeholder="Type transmission..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={180}
            id="chat-text-input"
          />
          <button type="submit" className={styles.sendBtn} disabled={!inputText.trim()} id="btn-chat-send">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634L21.075.756c.513-.171.743.088.583.585L16.292 20.306c-.16.518-.456.518-.616 0L12.35 12.348l-8.082-3.32z"/>
            </svg>
          </button>
        </form>
      </div>
    </>
  );
};
export default GlobalChat;
