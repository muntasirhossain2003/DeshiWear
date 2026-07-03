import { useEffect, useRef, useState } from "react";
import { HiOutlineChatBubbleLeftRight, HiOutlinePaperAirplane, HiXMark } from "react-icons/hi2";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const WELCOME = {
  role: "assistant",
  content:
    "আসসালামু আলাইকুম! আমি Deshi Sohayok — DeshiWear-এর AI shopping assistant। পাঞ্জাবি, শাড়ি, কুর্তি খুঁজছেন? দাম, সাইজ, ডেলিভারি — যা জানতে চান জিজ্ঞাসা করুন!",
};

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastProducts, setLastProducts] = useState([]);
  const scrollRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);
    setLastProducts([]);

    try {
      const { data } = await api.post("/api/chat", {
        messages: nextMessages.filter((m) => m !== WELCOME || nextMessages[0] !== WELCOME).slice(-10),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setLastProducts(data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || "AI assistant is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close chat" : "Open shopping assistant chat"}
        className="fixed bottom-5 right-5 z-50 bg-deshi-green hover:bg-deshi-green-dark text-white rounded-full p-4 shadow-lg transition-all hover:scale-105"
      >
        {open ? <HiXMark className="h-6 w-6" /> : <HiOutlineChatBubbleLeftRight className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm h-[32rem] bg-white rounded-2xl shadow-2xl border border-sand flex flex-col overflow-hidden animate-fade-up">
          <div className="bg-deshi-green text-white px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-display font-bold">
              DS
            </div>
            <div>
              <p className="font-display font-semibold leading-none">Deshi Sohayok</p>
              <p className="text-xs text-white/70 mt-1">AI Shopping Assistant</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-3 bg-ivory">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-ink text-white rounded-br-sm"
                      : "bg-white border border-sand text-ink rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-sand rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-ink-soft/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-ink-soft/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-ink-soft/50 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            {error && <p className="text-xs text-deshi-red text-center py-2">{error}</p>}
            {lastProducts.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {lastProducts.map((p) => (
                  <Link
                    key={p._id}
                    to={`/product/${p._id}`}
                    onClick={() => setOpen(false)}
                    className="text-xs bg-deshi-green/10 text-deshi-green px-3 py-1.5 rounded-full font-medium hover:bg-deshi-green/20 transition-colors line-clamp-1"
                  >
                    {p.name} →
                  </Link>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="border-t border-sand p-3 flex gap-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={user ? "লিখুন / Type a message…" : "Ask about products, sizes, delivery…"}
              disabled={loading}
              className="flex-grow border border-sand rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deshi-green bg-ivory disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="bg-deshi-green text-white rounded-full p-2.5 hover:bg-deshi-green-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <HiOutlinePaperAirplane className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
