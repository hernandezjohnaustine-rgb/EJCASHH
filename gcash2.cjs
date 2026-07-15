const fs = require("fs");
let content = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8");

// Add gcash state
content = content.replace(
    "  const [savingSettings, setSavingSettings] = useState(false);",
    `  const [savingSettings, setSavingSettings] = useState(false);
  const [gcashAccounts, setGcashAccounts] = useState<any[]>([]);
  const [showGcashForm, setShowGcashForm] = useState(false);
  const [gcashForm, setGcashForm] = useState({ accountName: "", accountNumber: "", qrCode: "", order: 1 });
  const [savingGcash, setSavingGcash] = useState(false);

  const loadGcashAccounts = async () => {
    try {
      const snap = await getDocs(collection(db, "gcashSettings"));
      setGcashAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.order - b.order));
    } catch (err) { console.error(err); }
  };

  const handleSaveGcash = async () => {
    setSavingGcash(true);
    try {
      await addDoc(collection(db, "gcashSettings"), { ...gcashForm, createdAt: Timestamp.now() });
      setGcashForm({ accountName: "", accountNumber: "", qrCode: "", order: 1 });
      setShowGcashForm(false);
      await loadGcashAccounts();
      alert("GCash account added!");
    } catch { alert("Failed to save."); }
    finally { setSavingGcash(false); }
  };

  const handleDeleteGcash = async (id: string) => {
    if (!confirm("Remove this GCash account?")) return;
    try {
      await deleteDoc(doc(db, "gcashSettings", id));
      await loadGcashAccounts();
    } catch { alert("Failed to delete."); }
  };`
);

// Add gcash tab
content = content.replace(
    '{ id: "settings", label: "Settings", icon: Shield }',
    '{ id: "gcash", label: "GCash", icon: Wallet },\n          { id: "settings", label: "Settings", icon: Shield }'
);

// Add gcash tab content
content = content.replace(
    '{activeTab === "deposits" && (',
    `{activeTab === "gcash" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black">GCash Accounts</p>
                  <button onClick={() => { loadGcashAccounts(); setShowGcashForm(!showGcashForm); }} className="text-[9px] font-black text-brand-primary border border-brand-primary/30 px-3 py-1.5 rounded-xl">
                    + Add Account
                  </button>
                </div>
                {showGcashForm && (
                  <div className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 flex flex-col gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">New GCash Account</p>
                    <input type="text" value={gcashForm.accountName} onChange={e => setGcashForm(prev => ({ ...prev, accountName: e.target.value }))}
                      className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-brand-text text-sm focus:outline-none"
                      placeholder="Account Name" />
                    <input type="text" value={gcashForm.accountNumber} onChange={e => setGcashForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-brand-text text-sm focus:outline-none"
                      placeholder="GCash Number (e.g. 0915 520 9950)" />
                    <input type="text" value={gcashForm.qrCode} onChange={e => setGcashForm(prev => ({ ...prev, qrCode: e.target.value }))}
                      className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-brand-text text-sm focus:outline-none"
                      placeholder="QR Code URL (e.g. /gcash-qr1.png)" />
                    <input type="number" value={gcashForm.order} onChange={e => setGcashForm(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                      className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-brand-text text-sm focus:outline-none"
                      placeholder="Display Order (1, 2, 3...)" />
                    <div className="flex gap-2">
                      <button onClick={() => setShowGcashForm(false)} className="flex-1 py-2 border border-brand-border rounded-xl text-brand-text/60 text-xs font-black uppercase">Cancel</button>
                      <button onClick={handleSaveGcash} disabled={savingGcash} className="flex-1 py-2 bg-brand-primary text-brand-black text-xs font-black uppercase rounded-xl">
                        {savingGcash ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
                {gcashAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-brand-text/40 font-bold mb-2">No GCash accounts configured</p>
                    <p className="text-[10px] text-brand-text/20">Click + Add Account to add your GCash details</p>
                  </div>
                ) : (
                  gcashAccounts.map(acc => (
                    <div key={acc.id} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {acc.qrCode && <img src={acc.qrCode} alt="QR" className="w-12 h-12 rounded-xl bg-white p-1 object-contain" />}
                          <div>
                            <p className="text-sm font-black text-brand-text">{acc.accountName}</p>
                            <p className="text-[10px] text-brand-text/40">{acc.accountNumber}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteGcash(acc.id)} className="text-red-400 text-[9px] font-black border border-red-400/30 px-2 py-1 rounded-lg">Remove</button>
                      </div>
                    </div>
                  ))
                )}
                <div className="mt-2 p-3 rounded-2xl bg-brand-card/5 border border-brand-border">
                  <p className="text-[10px] font-black text-brand-text/40 uppercase tracking-widest mb-1">QR Code Setup</p>
                  <p className="text-[10px] text-brand-text/30">Upload QR images to GitHub public folder (e.g. gcash-qr1.png) then enter the path /gcash-qr1.png above.</p>
                </div>
              </div>
            )}
            {activeTab === "deposits" && (`
);

fs.writeFileSync("src/screens/AdminScreen.tsx", content, "utf8");
console.log("Done!");
