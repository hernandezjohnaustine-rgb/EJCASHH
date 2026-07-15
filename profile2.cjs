const fs = require("fs");
const lines = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8").split("\n");

// Find the last </> closing tag
let lastIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "</>") {
        lastIdx = i;
        break;
    }
}

const modal = `
      {/* Personal Information Modal */}
      {showPersonalInfo && (
        <div className="fixed inset-0 z-[200] bg-brand-black/90 backdrop-blur-xl flex items-end">
          <div className="w-full bg-brand-navy rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-brand-text">Personal Information</h3>
              <button onClick={() => setShowPersonalInfo(false)} className="text-brand-text/40 text-2xl">✕</button>
            </div>
            {infoSuccess && (
              <div className="mb-4 p-3 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-black text-center">
                ✅ Saved successfully!
              </div>
            )}
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 px-5 text-brand-text focus:outline-none focus:border-brand-primary/50"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-2 block">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 px-5 text-brand-text focus:outline-none focus:border-brand-primary/50"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-2 block">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-brand-card/10 border border-brand-border/50 rounded-2xl py-4 px-5 text-brand-text/40 cursor-not-allowed"
                  placeholder="Email cannot be changed"
                />
                <p className="text-[9px] text-brand-text/30 mt-1 px-1">Email address cannot be changed for security reasons.</p>
              </div>
              <button
                onClick={handleSavePersonalInfo}
                disabled={savingInfo}
                className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50 mt-2"
              >
                {savingInfo ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}`;

lines.splice(lastIdx, 0, modal);
fs.writeFileSync("src/screens/ProfileScreen.tsx", lines.join("\n"), "utf8");
console.log("Done! Modal added before line", lastIdx + 1);
