const fs = require("fs");
const lines = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8").split("\n");

let lastIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "</>") { lastIdx = i; break; }
}

const modal = `
      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-[200] bg-brand-black/90 backdrop-blur-xl flex items-end">
          <div className="w-full bg-brand-navy rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-brand-text">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-brand-text/40 text-2xl">x</button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { key: "pushNotifications", label: "Push Notifications", sub: "Receive all app notifications" },
                { key: "transactionAlerts", label: "Transaction Alerts", sub: "Get notified for every transaction" },
                { key: "commissionAlerts", label: "Commission & Rewards", sub: "Earn notifications and bonuses" },
                { key: "promotionalAlerts", label: "Promotional Alerts", sub: "Deals, offers and announcements" },
                { key: "systemUpdates", label: "System Updates", sub: "App updates and maintenance" },
              ].map(setting => (
                <div key={setting.key} className="flex items-center justify-between bg-brand-card/10 border border-brand-border rounded-2xl p-4">
                  <div>
                    <p className="text-sm font-black text-brand-text">{setting.label}</p>
                    <p className="text-[10px] text-brand-text/40">{setting.sub}</p>
                  </div>
                  <button
                    onClick={() => setNotifSettings(prev => ({ ...prev, [setting.key]: !prev[setting.key as keyof typeof prev] }))}
                    className={"w-12 h-6 rounded-full relative flex items-center px-1 transition-colors " + (notifSettings[setting.key as keyof typeof notifSettings] ? "bg-brand-primary" : "bg-brand-text/20")}
                  >
                    <div className={"w-4 h-4 bg-white rounded-full shadow-sm transition-transform " + (notifSettings[setting.key as keyof typeof notifSettings] ? "translate-x-6" : "translate-x-0")} />
                  </button>
                </div>
              ))}
              <button
                onClick={handleSaveNotifSettings}
                disabled={savingNotif}
                className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all mt-2"
              >
                {savingNotif ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}`;

lines.splice(lastIdx, 0, modal);
fs.writeFileSync("src/screens/ProfileScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
