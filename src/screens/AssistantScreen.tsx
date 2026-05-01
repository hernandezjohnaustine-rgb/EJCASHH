import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User, ChevronLeft, Sparkles, Loader2 } from "lucide-react";
import { askAssistant } from "../services/geminiService";
import ReactMarkdown from "react-markdown";

export default function AssistantScreen({ onBack }: any) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your **EJCASHH Smart Assistant**. How can I help you grow your digital business today?' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const response = await askAssistant(userMsg);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col pt-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-brand-primary/10 blur-[100px] pointer-events-none"></div>

      <header className="px-6 flex items-center justify-between mb-8 relative z-10">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
           <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
              <h1 className="text-xl font-display font-black tracking-tight">AI Assistant</h1>
           </div>
           <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Powered by Gemini</span>
        </div>
        <div className="w-10" />
      </header>

      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto px-6 space-y-6 pb-32 relative z-10"
      >
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-white/10' : 'bg-brand-primary/20 border border-brand-primary/30'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-brand-primary" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand-primary text-brand-black font-medium' : 'bg-white/5 text-white/80 border border-white/5 prose prose-invert'}`}>
                 <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center">
                   <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                   <div className="flex gap-1">
                      <div className="w-1 h-1 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1 h-1 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1 h-1 bg-brand-primary rounded-full animate-bounce"></div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 md:max-w-lg md:left-1/2 md:-translate-x-1/2 z-20">
         <div className="relative group">
            <div className="absolute -inset-1 bg-brand-primary/20 rounded-[24px] blur-md group-focus-within:bg-brand-primary/40 transition-all"></div>
            <div className="relative glass-card !p-2 flex items-center border-white/10 pr-4">
               <input 
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 placeholder="Type a message..."
                 className="flex-grow bg-transparent border-none focus:ring-0 text-sm py-3 px-4 placeholder-white/20"
               />
               <button 
                 onClick={handleSend}
                 disabled={!input.trim() || isLoading}
                 className="w-10 h-10 rounded-xl bg-brand-primary text-brand-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
               >
                 <Send className="w-5 h-5" />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
