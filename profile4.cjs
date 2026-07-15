const fs = require("fs");
const lines = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8").split("\n");

let lastIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "</>") {
        lastIdx = i;
        break;
    }
}

const modal = `
      {/* Security & Privacy Modal */}
      {showSecurity && (
        <div className="fixed inset-0 z-[200] bg-brand-black/90 backdrop-blur-xl flex items-end">
          <div className="w-full bg-brand-navy rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-brand-text">Security & Privacy</h3>
              <button onClick={() => { setShowSecurity(false); setPasswordError(""); }} className="text-brand-text/40 text-2xl">✕</button>
            </div>
            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-black text-center">
                ✅ Password changed successfully!
              </div>
            )}
            {passwordError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-black text-center">
                {passwordError}
              </div>
            )}
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-4">Change Password</p>
            <div className="flex flex-col gap-4">
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 px-5 text-brand-text focus:outline-none focus:border-brand-primary/50"
                placeholder="Current password"
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 px-5 text-brand-text focus:outline-none focus:border-brand-primary/50"
                placeholder="New password"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 px-5 text-brand-text focus:outline-none focus:border-brand-primary/50"
                placeholder="Confirm new password"
              />
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50"
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}`;

lines.splice(lastIdx, 0, modal);
fs.writeFileSync("src/screens/ProfileScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
