const fs = require("fs");
let content = fs.readFileSync("src/screens/CashInScreen.tsx", "utf8");

content = content.replace(
`// TODO: Update with your actual GCash details
 const GCASH_ACCOUNTS = [
  {
    accountName: "J***y P.",
    accountNumber: "0915 520 9950",
    qrCode: "/gcash-qr1.png",
  },
  {
    accountName: "J***y P.",
    accountNumber: "0994 478 0740",
    qrCode: "/gcash-qr2.png",
  },
];`
);

// Update the details step to show both accounts with QR codes
content = content.replace(
`              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center font-black text-white text-2xl">G</div>
                <div>
                  <h2 className="text-lg font-black text-brand-text">Send via GCash</h2>
                  <p className="text-[10px] text-brand-text/40">Send exactly ₱{parseFloat(amount).toLocaleString()} to:</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-2xl bg-brand-card/20 border border-brand-border">
                  <p className="text-[9px] font-black uppercase tracking-widest text-brand-text/40 mb-1">Account Name</p>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-black text-brand-text">{GCASH_DETAILS.accountName}</p>
                    <button onClick={() => handleCopy(GCASH_DETAILS.accountName, "name")} className="flex items-center gap-1 text-brand-primary">
                      <Copy className="w-4 h-4" />
                      {copied === "name" && <span className="text-[10px] font-black">Copied!</span>}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-card/20 border border-brand-border">
                  <p className="text-[9px] font-black uppercase tracking-widest text-brand-text/40 mb-1">GCash Number</p>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-black text-brand-text">{GCASH_DETAILS.accountNumber}</p>
                    <button onClick={() => handleCopy(GCASH_DETAILS.accountNumber, "number")} className="flex items-center gap-1 text-brand-primary">
                      <Copy className="w-4 h-4" />
                      {copied === "number" && <span className="text-[10px] font-black">Copied!</span>}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/30">
                  <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-1">Amount to Send</p>
                  <p className="text-2xl font-black text-brand-primary">₱{parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-brand-text/40 mt-1">⚠️ Send the exact amount shown above</p>
                </div>
              </div>`,
`              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center font-black text-white text-2xl">G</div>
                <div>
                  <h2 className="text-lg font-black text-brand-text">Send via GCash</h2>
                  <p className="text-[10px] text-brand-text/40">Send exactly ₱{parseFloat(amount).toLocaleString()} to any account below:</p>
                </div>
              </div>

              {/* Amount */}
              <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 mb-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-1">Amount to Send</p>
                <p className="text-2xl font-black text-brand-primary">₱{parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-brand-text/40 mt-1">⚠️ Send the exact amount shown above</p>
              </div>

              {/* GCash Accounts */}
              {GCASH_ACCOUNTS.map((acc, idx) => (
                <div key={idx} className="mb-4 p-4 rounded-2xl bg-brand-card/20 border border-brand-border">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-3">GCash Account {idx + 1}</p>
                  
                  {/* QR Code */}
                  <div className="flex flex-col items-center mb-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-text/40 mb-2">📷 Scan to Pay</p>
                    <div className="w-40 h-40 bg-white rounded-2xl p-2 flex items-center justify-center">
                      <img src={acc.qrCode} alt="GCash QR" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-brand-text/40 uppercase tracking-widest">Account Name</p>
                        <p className="text-sm font-black text-brand-text">{acc.accountName}</p>
                      </div>
                      <button onClick={() => handleCopy(acc.accountName, "name" + idx)} className="flex items-center gap-1 text-brand-primary">
                        <Copy className="w-4 h-4" />
                        {copied === "name" + idx && <span className="text-[10px] font-black">Copied!</span>}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-brand-text/40 uppercase tracking-widest">GCash Number</p>
                        <p className="text-sm font-black text-brand-text">{acc.accountNumber}</p>
                      </div>
                      <button onClick={() => handleCopy(acc.accountNumber, "num" + idx)} className="flex items-center gap-1 text-brand-primary">
                        <Copy className="w-4 h-4" />
                        {copied === "num" + idx && <span className="text-[10px] font-black">Copied!</span>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}`
);

fs.writeFileSync("src/screens/CashInScreen.tsx", content, "utf8");
console.log("Done!");
