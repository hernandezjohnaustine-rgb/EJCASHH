with open("src/screens/AdminScreen.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find end of orders tab
in_orders = False
orders_end = -1
depth = 0
for i, line in enumerate(lines):
    if 'activeTab === "orders"' in line:
        in_orders = True
    if in_orders:
        depth += line.count("{") - line.count("}")
        if depth == 0 and i > 540:
            orders_end = i
            break

print("Orders tab ends at line", orders_end + 1)

new_tabs = '''
            {activeTab === "deposits" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black">{deposits.length} Deposit Requests</p>
                  <div className="flex gap-2">
                    <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg font-black">{deposits.filter((d) => d.status === "pending").length} Pending</span>
                  </div>
                </div>
                {deposits.length === 0 ? (
                  <p className="text-center text-brand-text/40 py-12 font-bold">No deposit requests yet</p>
                ) : deposits.map((d) => (
                  <div key={d.id} onClick={() => { setSelectedDeposit(d); setAdminNote(""); }} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 cursor-pointer hover:border-brand-primary/30 transition-all">
                    <div className="flex items-start gap-3">
                      {d.screenshot && <img src={d.screenshot} alt="Receipt" className="w-16 h-16 rounded-xl object-cover shrink-0" />}
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-black text-brand-text">{d.userName}</p>
                          <span className={"text-[9px] font-black px-2 py-0.5 rounded-full " + (d.status === "approved" ? "bg-green-500/20 text-green-400" : d.status === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400")}>
                            {(d.status || "pending").toUpperCase()}
                          </span>
                        </div>
                        <p className="text-lg font-black text-brand-primary">&#8369;{(d.amount || 0).toLocaleString()}</p>
                        <p className="text-[9px] text-brand-text/30">{d.createdAt?.toDate?.()?.toLocaleString() || "Recently"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedDeposit && (
              <div className="fixed inset-0 z-[300] bg-brand-black/95 backdrop-blur-xl flex flex-col overflow-y-auto">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-brand-border sticky top-0 bg-brand-black z-10">
                  <button onClick={() => { setSelectedDeposit(null); setZoomImage(false); }} className="w-10 h-10 rounded-full bg-brand-card/20 border border-brand-border flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-base font-black text-brand-text">Deposit Details</h3>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="bg-brand-card/10 border border-brand-border rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Name</span><span className="text-sm font-black text-brand-text">{selectedDeposit.userName}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Email</span><span className="text-[10px] text-brand-text">{selectedDeposit.userEmail}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Amount</span><span className="text-base font-black text-brand-primary">&#8369;{(selectedDeposit.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Reference</span><span className="text-[10px] font-mono text-brand-text">{selectedDeposit.referenceNo}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Date</span><span className="text-[10px] text-brand-text">{selectedDeposit.createdAt?.toDate?.()?.toLocaleString() || "N/A"}</span></div>
                  </div>
                  {selectedDeposit.screenshot && (
                    <div className="bg-brand-card/10 border border-brand-border rounded-2xl p-4">
                      <div className="flex justify-between mb-2">
                        <p className="text-[9px] font-black uppercase text-brand-text/40">Proof of Payment</p>
                        <button onClick={() => setZoomImage(!zoomImage)} className="text-[9px] font-black text-brand-primary border border-brand-primary/30 px-2 py-1 rounded-lg">{zoomImage ? "Zoom Out" : "Zoom In"}</button>
                      </div>
                      <img src={selectedDeposit.screenshot} alt="Proof" className={"w-full rounded-xl object-contain " + (zoomImage ? "max-h-none" : "max-h-64")} />
                    </div>
                  )}
                  {selectedDeposit.status === "pending" && (
                    <div>
                      <label className="text-[9px] font-black uppercase text-brand-text/40 mb-2 block">Admin Note</label>
                      <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2} className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-3 px-4 text-brand-text text-sm focus:outline-none resize-none" placeholder="Optional note..." />
                    </div>
                  )}
                  {selectedDeposit.status === "pending" ? (
                    <div className="flex gap-3 pb-8">
                      <button onClick={() => handleRejectDeposit(selectedDeposit)} disabled={processingDeposit} className="flex-1 py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-black uppercase text-sm rounded-2xl disabled:opacity-50">
                        {processingDeposit ? "Processing..." : "Reject"}
                      </button>
                      <button onClick={() => handleApproveDeposit(selectedDeposit)} disabled={processingDeposit} className="flex-1 py-4 bg-green-500 text-white font-black uppercase text-sm rounded-2xl disabled:opacity-50">
                        {processingDeposit ? "Processing..." : "Approve"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-brand-text/40 pb-8">This request has been {selectedDeposit.status}.</p>
                  )}
                </div>
              </div>
            )}
            {activeTab === "gcash" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black">GCash Accounts</p>
                  <button onClick={() => setShowGcashForm(!showGcashForm)} className="text-[9px] font-black text-brand-primary border border-brand-primary/30 px-3 py-1.5 rounded-xl">+ Add</button>
                </div>
                {showGcashForm && (
                  <div className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 flex flex-col gap-3">
                    <input type="text" value={gcashForm.accountName} onChange={e => setGcashForm(p => ({ ...p, accountName: e.target.value }))} className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-brand-text text-sm focus:outline-none" placeholder="Account Name" />
                    <input type="text" value={gcashForm.accountNumber} onChange={e => setGcashForm(p => ({ ...p, accountNumber: e.target.value }))} className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-brand-text text-sm focus:outline-none" placeholder="GCash Number" />
                    <input type="text" value={gcashForm.qrCode} onChange={e => setGcashForm(p => ({ ...p, qrCode: e.target.value }))} className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-brand-text text-sm focus:outline-none" placeholder="QR Code URL (/gcash-qr1.png)" />
                    <div className="flex gap-2">
                      <button onClick={() => setShowGcashForm(false)} className="flex-1 py-2 border border-brand-border rounded-xl text-brand-text/60 text-xs font-black uppercase">Cancel</button>
                      <button onClick={handleSaveGcash} disabled={savingGcash} className="flex-1 py-2 bg-brand-primary text-brand-black text-xs font-black uppercase rounded-xl">{savingGcash ? "Saving..." : "Save"}</button>
                    </div>
                  </div>
                )}
                {gcashAccounts.length === 0 ? (
                  <p className="text-center text-brand-text/40 py-8 font-bold">No GCash accounts yet. Click + Add above.</p>
                ) : gcashAccounts.map(acc => (
                  <div key={acc.id} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {acc.qrCode && <img src={acc.qrCode} alt="QR" className="w-12 h-12 rounded-xl bg-white p-1 object-contain" />}
                      <div>
                        <p className="text-sm font-black text-brand-text">{acc.accountName}</p>
                        <p className="text-[10px] text-brand-text/40">{acc.accountNumber}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteGcash(acc.id)} className="text-red-400 text-[9px] font-black border border-red-400/30 px-2 py-1 rounded-lg">Remove</button>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "settings" && (
              <div className="flex flex-col gap-4">
                <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black px-1">App Settings</p>
                <div className="bg-brand-card/5 border border-brand-border rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-brand-text">Trading Bot</p>
                    <p className="text-[10px] text-brand-text/40">Enable or disable Trading Bot for all users</p>
                  </div>
                  <button onClick={handleToggleTrading} disabled={savingSettings} className={tradingEnabled ? "bg-brand-primary text-brand-black px-4 py-2 rounded-xl text-xs font-black uppercase" : "bg-brand-card/20 border border-brand-border text-brand-text/60 px-4 py-2 rounded-xl text-xs font-black uppercase"}>
                    {savingSettings ? "Saving..." : tradingEnabled ? "ENABLED" : "DISABLED"}
                  </button>
                </div>
              </div>
            )}
'''

lines.insert(orders_end + 1, new_tabs)
with open("src/screens/AdminScreen.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done!")
