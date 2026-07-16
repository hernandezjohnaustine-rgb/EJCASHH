with open("src/screens/AdminScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_tx = '''{activeTab === "transactions" && (
              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black px-1">{transactions.length} Total Transactions</p>
                {transactions.slice(0, 50).map((t) => {
                  const ts = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
                  return (
                    <div key={t.id} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{t.title}</p>
                        <p className="text-[10px] text-brand-text/40">{t.category} \xc2\xb7 {ts.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        <p className="text-[9px] text-brand-text/20 font-mono">{t.referenceNo}</p>
                      </div>
                      <p className={`text-sm font-black ${t.type === "in" ? "text-brand-primary" : "text-brand-text"}`}>
                        {t.type === "in" ? "+" : "-"}\xe2\x82\xb1{(t.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}'''

new_tx = """{activeTab === "transactions" && (() => {
              const filteredTx = transactions.filter(t => {
                const matchSearch = !txSearch || 
                  t.title?.toLowerCase().includes(txSearch.toLowerCase()) ||
                  t.referenceNo?.toLowerCase().includes(txSearch.toLowerCase()) ||
                  t.userId?.toLowerCase().includes(txSearch.toLowerCase()) ||
                  t.category?.toLowerCase().includes(txSearch.toLowerCase());
                const matchType = txTypeFilter === "all" || t.category?.toLowerCase() === txTypeFilter.toLowerCase() || t.type === txTypeFilter;
                const matchStatus = txStatusFilter === "all" || t.status?.toLowerCase() === txStatusFilter.toLowerCase();
                return matchSearch && matchType && matchStatus;
              });
              return (
                <div className="flex flex-col gap-3">
                  {/* Search & Filters */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={txSearch}
                      onChange={e => setTxSearch(e.target.value)}
                      className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-2.5 px-4 text-sm text-brand-text focus:outline-none focus:border-brand-primary/50"
                      placeholder="Search by name, ID, reference..."
                    />
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {["all", "in", "out", "Commission", "Transfer", "Cash In", "Withdrawal", "Activation", "Trading"].map(f => (
                        <button key={f} onClick={() => setTxTypeFilter(f)}
                          className={"shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all " + (txTypeFilter === f ? "bg-brand-primary text-brand-black" : "bg-brand-card/20 border border-brand-border text-brand-text/60")}>
                          {f === "all" ? "All Types" : f}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {["all", "Completed", "Pending", "Failed"].map(s => (
                        <button key={s} onClick={() => setTxStatusFilter(s)}
                          className={"shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all " + (txStatusFilter === s ? "bg-brand-primary text-brand-black" : "bg-brand-card/20 border border-brand-border text-brand-text/60")}>
                          {s === "all" ? "All Status" : s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black px-1">{filteredTx.length} Transactions</p>
                  {filteredTx.length === 0 ? (
                    <p className="text-center text-brand-text/40 py-8 font-bold">No transactions found</p>
                  ) : filteredTx.map((t) => {
                    const ts = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp || Date.now());
                    return (
                      <div key={t.id} onClick={() => setSelectedTx(t)} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 cursor-pointer hover:border-brand-primary/30 transition-all">
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
                    <span className={"text-xs font-black px-3 py-1.5 rounded-full " + (selectedTx.status === "Completed" ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30")}>
                      {selectedTx.status || "COMPLETED"}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className={"text-4xl font-black " + (selectedTx.type === "in" ? "text-brand-primary" : "text-red-400")}>
                      {selectedTx.type === "in" ? "+" : "-"}&#8369;{(selectedTx.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-brand-card/10 border border-brand-border rounded-2xl p-4 flex flex-col gap-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-text/40">Transaction Info</p>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Title</span><span className="text-[10px] font-black text-brand-text text-right max-w-[60%]">{selectedTx.title}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Type</span><span className="text-[10px] font-black text-brand-text">{selectedTx.category || "General"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Reference No</span><span className="text-[10px] font-mono font-black text-brand-text">{selectedTx.referenceNo || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Payment Method</span><span className="text-[10px] font-black text-brand-text">{selectedTx.paymentMethod || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Date & Time</span><span className="text-[10px] font-black text-brand-text">{selectedTx.timestamp?.toDate ? selectedTx.timestamp.toDate().toLocaleString() : "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">User ID</span><span className="text-[9px] font-mono text-brand-text/60">{selectedTx.userId}</span></div>
                  </div>
                </div>
              </div>
            )}"""

content = content.replace(old_tx, new_tx)
with open("src/screens/AdminScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
