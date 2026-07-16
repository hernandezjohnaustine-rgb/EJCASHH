with open("src/screens/AdminScreen.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find transactions tab start and end
start = -1
end = -1
for i, line in enumerate(lines):
    if 'activeTab === "transactions"' in line and start == -1:
        start = i
    if start > -1 and 'activeTab === "products"' in line:
        end = i
        break

print("Transactions tab from line", start+1, "to", end)

new_content = '''            {activeTab === "transactions" && (() => {
              const filteredTx = transactions.filter((t: any) => {
                const txUser = users.find((u: any) => u.id === t.userId);
                const uName = (txUser?.displayName || txUser?.username || "").toLowerCase();
                const matchSearch = !txSearch ||
                  (t.title || "").toLowerCase().includes(txSearch.toLowerCase()) ||
                  (t.referenceNo || "").toLowerCase().includes(txSearch.toLowerCase()) ||
                  (t.userId || "").toLowerCase().includes(txSearch.toLowerCase()) ||
                  uName.includes(txSearch.toLowerCase());
                const matchType = txTypeFilter === "all" || (t.category || "").toLowerCase() === txTypeFilter.toLowerCase() || t.type === txTypeFilter;
                const matchStatus = txStatusFilter === "all" || (t.status || "").toLowerCase() === txStatusFilter.toLowerCase();
                return matchSearch && matchType && matchStatus;
              });
              return (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <input type="text" value={txSearch} onChange={e => setTxSearch(e.target.value)}
                      className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-2.5 px-4 text-sm text-brand-text focus:outline-none focus:border-brand-primary/50"
                      placeholder="Search by name, title, reference..." />
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth: "none"}}>
                      {["all", "in", "out", "Commission", "Transfer", "Cash In", "Withdrawal", "Activation", "Trading", "Bonus"].map(f => (
                        <button key={f} onClick={() => setTxTypeFilter(f)}
                          className={"shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all " + (txTypeFilter === f ? "bg-brand-primary text-brand-black" : "bg-brand-card/20 border border-brand-border text-brand-text/60")}>
                          {f === "all" ? "All" : f}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth: "none"}}>
                      {["all", "Completed", "Pending", "Failed"].map(s => (
                        <button key={s} onClick={() => setTxStatusFilter(s)}
                          className={"shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all " + (txStatusFilter === s ? "bg-brand-primary text-brand-black" : "bg-brand-card/20 border border-brand-border text-brand-text/60")}>
                          {s === "all" ? "All Status" : s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-brand-text/40 font-black px-1">{filteredTx.length} of {transactions.length} Transactions</p>
                  {filteredTx.length === 0 ? (
                    <p className="text-center text-brand-text/40 py-8 font-bold">No transactions found</p>
                  ) : filteredTx.map((t: any) => {
                    const ts = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp || Date.now());
                    const txUser = users.find((u: any) => u.id === t.userId);
                    const uName = txUser?.displayName || txUser?.username || t.userId?.substring(0, 8) + "...";
                    return (
                      <div key={t.id} onClick={() => setSelectedTx(t)} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 cursor-pointer hover:border-brand-primary/30 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className={"text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase " + (t.type === "in" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                {t.type === "in" ? "IN" : "OUT"}
                              </span>
                              <span className="text-[8px] font-black text-brand-text/30 uppercase">{t.category || "General"}</span>
                              <span className={"text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase " + (t.status === "Completed" ? "bg-brand-primary/20 text-brand-primary" : "bg-yellow-500/20 text-yellow-400")}>
                                {t.status || "Completed"}
                              </span>
                            </div>
                            <p className="text-sm font-black text-brand-text truncate">{t.title}</p>
                            <p className="text-[9px] text-blue-400 font-black mt-0.5">{uName}</p>
                            <p className="text-[9px] text-brand-text/30 font-mono mt-0.5">{t.referenceNo}</p>
                            <p className="text-[9px] text-brand-text/30">{ts.toLocaleString()}</p>
                          </div>
                          <p className={"text-base font-black shrink-0 " + (t.type === "in" ? "text-brand-primary" : "text-red-400")}>
                            {t.type === "in" ? "+" : "-"}&#8369;{(t.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {selectedTx && (
              <div className="fixed inset-0 z-[300] bg-brand-black/95 backdrop-blur-xl flex flex-col overflow-y-auto">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-brand-border sticky top-0 bg-brand-black z-10">
                  <button onClick={() => setSelectedTx(null)} className="w-10 h-10 rounded-full bg-brand-card/20 border border-brand-border flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-base font-black text-brand-text">Transaction Details</h3>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex justify-center gap-2">
                    <span className={"text-xs font-black px-3 py-1.5 rounded-full " + (selectedTx.type === "in" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30")}>
                      {selectedTx.type === "in" ? "INCOMING" : "OUTGOING"}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className={"text-4xl font-black " + (selectedTx.type === "in" ? "text-brand-primary" : "text-red-400")}>
                      {selectedTx.type === "in" ? "+" : "-"}&#8369;{(selectedTx.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-brand-card/10 border border-brand-border rounded-2xl p-4 flex flex-col gap-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-text/40">Transaction Info</p>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">User</span><span className="text-[10px] font-black text-brand-text">{users.find((u: any) => u.id === selectedTx.userId)?.displayName || "Unknown"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Title</span><span className="text-[10px] font-black text-brand-text text-right max-w-[60%]">{selectedTx.title}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Type</span><span className="text-[10px] font-black text-brand-text">{selectedTx.category || "General"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Reference</span><span className="text-[10px] font-mono font-black text-brand-text">{selectedTx.referenceNo || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Method</span><span className="text-[10px] font-black text-brand-text">{selectedTx.paymentMethod || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Status</span><span className="text-[10px] font-black text-brand-primary">{selectedTx.status || "Completed"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Date</span><span className="text-[10px] font-black text-brand-text">{selectedTx.timestamp?.toDate ? selectedTx.timestamp.toDate().toLocaleString() : "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">User ID</span><span className="text-[9px] font-mono text-brand-text/60 truncate max-w-[60%]">{selectedTx.userId}</span></div>
                  </div>
                </div>
              </div>
            )}
'''

lines[start:end] = [new_content]
with open("src/screens/AdminScreen.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done! Replaced transactions tab")
