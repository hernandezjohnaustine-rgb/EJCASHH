with open("src/screens/AdminScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add user lookup to transactions display
old_tx_card = '''                    <div key={t.id} onClick={() => setSelectedTx(t)} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 cursor-pointer hover:border-brand-primary/30 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={"text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase " + (t.type === "in" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                {t.type === "in" ? "IN" : "OUT"}
                              </span>
                              <span className="text-[8px] font-black text-brand-text/30 uppercase">{t.category || "General"}</span>
                              <span className={"text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase " + (t.status === "Completed" ? "bg-brand-primary/20 text-brand-primary" : "bg-yellow-500/20 text-yellow-400")}>
                                {t.status || "Completed"}
                              </span>
                            </div>
                            <p className="text-sm font-black text-brand-text truncate">{t.title}</p>
                            <p className="text-[9px] text-brand-text/30 font-mono mt-0.5">{t.referenceNo}</p>
                            <p className="text-[9px] text-brand-text/30 mt-0.5">{ts.toLocaleString()}</p>
                          </div>
                          <p className={"text-base font-black shrink-0 " + (t.type === "in" ? "text-brand-primary" : "text-red-400")}>
                            {t.type === "in" ? "+" : "-"}&#8369;{(t.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>'''

new_tx_card = '''                    <div key={t.id} onClick={() => setSelectedTx(t)} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 cursor-pointer hover:border-brand-primary/30 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={"text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase " + (t.type === "in" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                {t.type === "in" ? "IN" : "OUT"}
                              </span>
                              <span className="text-[8px] font-black text-brand-text/30 uppercase">{t.category || "General"}</span>
                              <span className={"text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase " + (t.status === "Completed" ? "bg-brand-primary/20 text-brand-primary" : "bg-yellow-500/20 text-yellow-400")}>
                                {t.status || "Completed"}
                              </span>
                            </div>
                            <p className="text-sm font-black text-brand-text truncate">{t.title}</p>
                            {/* Show user info */}
                            {t.userId && (
                              <p className="text-[9px] text-brand-primary/60 font-black mt-0.5">
                                User: {users.find((u: any) => u.id === t.userId)?.displayName || users.find((u: any) => u.id === t.userId)?.username || t.userId.substring(0, 8) + "..."}
                              </p>
                            )}
                            <p className="text-[9px] text-brand-text/30 font-mono mt-0.5">{t.referenceNo}</p>
                            <p className="text-[9px] text-brand-text/30 mt-0.5">{ts.toLocaleString()}</p>
                          </div>
                          <p className={"text-base font-black shrink-0 " + (t.type === "in" ? "text-brand-primary" : "text-red-400")}>
                            {t.type === "in" ? "+" : "-"}&#8369;{(t.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>'''

content = content.replace(old_tx_card, new_tx_card)

# Also update search filter to include user name
old_search = '''const filteredTx = transactions.filter(t => {
                const matchSearch = !txSearch || 
                  t.title?.toLowerCase().includes(txSearch.toLowerCase()) ||
                  t.referenceNo?.toLowerCase().includes(txSearch.toLowerCase()) ||
                  t.userId?.toLowerCase().includes(txSearch.toLowerCase()) ||
                  t.category?.toLowerCase().includes(txSearch.toLowerCase());'''

new_search = '''const filteredTx = transactions.filter(t => {
                const txUser = users.find((u: any) => u.id === t.userId);
                const userName = txUser?.displayName?.toLowerCase() || txUser?.username?.toLowerCase() || "";
                const matchSearch = !txSearch || 
                  t.title?.toLowerCase().includes(txSearch.toLowerCase()) ||
                  t.referenceNo?.toLowerCase().includes(txSearch.toLowerCase()) ||
                  t.userId?.toLowerCase().includes(txSearch.toLowerCase()) ||
                  t.category?.toLowerCase().includes(txSearch.toLowerCase()) ||
                  userName.includes(txSearch.toLowerCase());'''

content = content.replace(old_search, new_search)

# Also update selectedTx detail view to show user name
old_detail = '''                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">User ID</span><span className="text-[9px] font-mono text-brand-text/60">{selectedTx.userId}</span></div>'''

new_detail = '''                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">User</span><span className="text-[10px] font-black text-brand-text">{users.find((u: any) => u.id === selectedTx.userId)?.displayName || "Unknown"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">User ID</span><span className="text-[9px] font-mono text-brand-text/60">{selectedTx.userId}</span></div>'''

content = content.replace(old_detail, new_detail)

with open("src/screens/AdminScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
