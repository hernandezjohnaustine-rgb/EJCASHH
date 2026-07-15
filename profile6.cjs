const fs = require("fs");
const lines = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8").split("\n");

let lastIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "</>") { lastIdx = i; break; }
}

const modal = `
      {/* Payment Methods Modal */}
      {showPaymentMethods && (
        <div className="fixed inset-0 z-[200] bg-brand-black/90 backdrop-blur-xl flex items-end">
          <div className="w-full bg-brand-navy rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-brand-text">Payment Methods</h3>
              <button onClick={() => setShowPaymentMethods(false)} className="text-brand-text/40 text-2xl">x</button>
            </div>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-brand-text/40 font-bold mb-4">No payment methods added yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mb-4">
                {paymentMethods.map(pm => (
                  <div key={pm.id} className="bg-brand-card/10 border border-brand-border rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-brand-text">{pm.name}</p>
                          {pm.isDefault && <span className="text-[9px] bg-brand-primary text-brand-black px-2 py-0.5 rounded-full font-black">DEFAULT</span>}
                        </div>
                        <p className="text-[10px] text-brand-text/40">{pm.type.toUpperCase()} • {pm.number}</p>
                        {pm.bank && <p className="text-[10px] text-brand-text/40">{pm.bank}</p>}
                      </div>
                      <div className="flex gap-2">
                        {!pm.isDefault && (
                          <button onClick={() => handleSetDefault(pm.id)} className="text-[9px] font-black text-brand-primary border border-brand-primary/30 px-2 py-1 rounded-lg">
                            Set Default
                          </button>
                        )}
                        <button onClick={() => handleDeletePayment(pm.id)} className="text-[9px] font-black text-red-400 border border-red-400/30 px-2 py-1 rounded-lg">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!showAddPayment ? (
              <button
                onClick={() => setShowAddPayment(true)}
                className="w-full py-4 border-2 border-dashed border-brand-border rounded-2xl text-brand-text/40 font-black uppercase tracking-widest text-xs"
              >
                + Add Payment Method
              </button>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">Add New Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  {["gcash", "maya", "bank"].map(t => (
                    <button
                      key={t}
                      onClick={() => setPaymentType(t)}
                      className={"py-2 rounded-xl text-[10px] font-black uppercase " + (paymentType === t ? "bg-brand-primary text-brand-black" : "bg-brand-card/20 border border-brand-border text-brand-text/60")}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={paymentName}
                  onChange={e => setPaymentName(e.target.value)}
                  className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 px-5 text-brand-text focus:outline-none focus:border-brand-primary/50"
                  placeholder="Account name (optional)"
                />
                <input
                  type="text"
                  value={paymentNumber}
                  onChange={e => setPaymentNumber(e.target.value)}
                  className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 px-5 text-brand-text focus:outline-none focus:border-brand-primary/50"
                  placeholder={paymentType === "bank" ? "Account number" : "Mobile number"}
                />
                {paymentType === "bank" && (
                  <input
                    type="text"
                    value={paymentBank}
                    onChange={e => setPaymentBank(e.target.value)}
                    className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 px-5 text-brand-text focus:outline-none focus:border-brand-primary/50"
                    placeholder="Bank name (e.g. BDO, BPI, Metrobank)"
                  />
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddPayment(false)}
                    className="flex-1 py-4 border border-brand-border rounded-2xl text-brand-text/60 font-black uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPayment}
                    disabled={savingPayment}
                    className="flex-1 py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest text-xs rounded-2xl active:scale-95"
                  >
                    {savingPayment ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}`;

lines.splice(lastIdx, 0, modal);
fs.writeFileSync("src/screens/ProfileScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
