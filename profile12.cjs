const fs = require("fs");
const lines = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8").split("\n");

let lastIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "</>") { lastIdx = i; break; }
}

const modal = `
      {/* Help Center Modal */}
      {showHelpCenter && (
        <div className="fixed inset-0 z-[200] bg-brand-black flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
            <div>
              <h3 className="text-lg font-black text-brand-text">Help Center</h3>
              <p className="text-[10px] text-brand-primary font-black">AI Assistant</p>
            </div>
            <button onClick={() => setShowHelpCenter(false)} className="text-brand-text/40 text-2xl">x</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {helpMessages.map((msg, i) => (
              <div key={i} className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={"max-w-[85%] rounded-2xl px-4 py-3 " + (msg.role === "user" ? "bg-brand-primary text-brand-black" : "bg-brand-card/20 border border-brand-border text-brand-text")}>
                  {msg.role === "assistant" && (
                    <p className="text-[9px] font-black text-brand-primary mb-1 uppercase tracking-widest">EJCASHH AI</p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {helpLoading && (
              <div className="flex justify-start">
                <div className="bg-brand-card/20 border border-brand-border rounded-2xl px-4 py-3">
                  <p className="text-[9px] font-black text-brand-primary mb-1 uppercase tracking-widest">EJCASHH AI</p>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="px-4 py-4 border-t border-brand-border">
            <div className="flex gap-3">
              <input
                type="text"
                value={helpInput}
                onChange={e => setHelpInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendHelp()}
                className="flex-1 bg-brand-card/20 border border-brand-border rounded-2xl py-3 px-4 text-brand-text focus:outline-none focus:border-brand-primary/50 text-sm"
                placeholder="Ask anything about EJCASHH..."
                disabled={helpLoading}
              />
              <button
                onClick={handleSendHelp}
                disabled={helpLoading || !helpInput.trim()}
                className="px-5 py-3 bg-brand-primary text-brand-black font-black rounded-2xl active:scale-95 transition-all disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}`;

lines.splice(lastIdx, 0, modal);
fs.writeFileSync("src/screens/ProfileScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
