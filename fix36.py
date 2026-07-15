content = open('src/screens/AdminScreen.tsx', 'r', encoding='utf-8').read()
# Find and replace the corrupted settings section
import re
old = r'\{activeTab === "settings" && \(.*?\)\}'
new = '''{activeTab === "settings" && (
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
            )}'''
content = re.sub(old, new, content, flags=re.DOTALL)
open('src/screens/AdminScreen.tsx', 'w', encoding='utf-8').write(content)
print('AdminScreen.tsx fixed!')
