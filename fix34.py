content = open('src/screens/AdminScreen.tsx', 'r', encoding='utf-8').read()

# Add settings to AdminTab type
content = content.replace(
    'type AdminTab = "users" | "withdrawals" | "transactions" | "products" | "orders";',
    'type AdminTab = "users" | "withdrawals" | "transactions" | "products" | "orders" | "settings";'
)

# Add tradingEnabled state
content = content.replace(
    '  const [showProductForm, setShowProductForm] = useState(false);',
    '  const [showProductForm, setShowProductForm] = useState(false);\n  const [tradingEnabled, setTradingEnabled] = useState(false);\n  const [savingSettings, setSavingSettings] = useState(false);'
)

# Add handleToggleTrading function after handleUnlockAllReferralLinks
content = content.replace(
    '  const handleApprove = async',
    '''  const handleToggleTrading = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "trading"), { enabled: !tradingEnabled }, { merge: true });
      setTradingEnabled(!tradingEnabled);
      alert((!tradingEnabled ? "Trading Bot ENABLED" : "Trading Bot DISABLED") + " successfully!");
    } catch {
      alert("Failed to update trading status");
    } finally {
      setSavingSettings(false);
    }
  };
  const handleApprove = async'''
)

# Add settings to tabs array
content = content.replace(
    '{ id: "orders", label: "Orders" }',
    '{ id: "orders", label: "Orders" },\n          { id: "settings", label: "Settings" }'
)

# Add settings tab content before closing of tab contents
content = content.replace(
    '            {activeTab === "orders" &&',
    '''            {activeTab === "settings" && (
              <div className="flex flex-col gap-4">
                <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black px-1">App Settings</p>
                <div className="bg-brand-card/5 border border-brand-border rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-brand-text">Trading Bot</p>
                      <p className="text-[10px] text-brand-text/40">Enable or disable Trading Bot for all users</p>
                    </div>
                    <button
                      onClick={handleToggleTrading}
                      disabled={savingSettings}
                      className={px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 }
                    >
                      {savingSettings ? "Saving..." : tradingEnabled ? "ENABLED" : "DISABLED"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "orders" &&'''
)

open('src/screens/AdminScreen.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
