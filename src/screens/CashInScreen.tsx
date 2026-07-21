import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Copy, CheckCircle2, Upload, X, Clock } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { addDoc, collection, Timestamp, getDocs } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export default function CashInScreen({ onBack }: any) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"amount" | "details" | "upload" | "success">("amount");
  const [referenceNo, setReferenceNo] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [gcashAccounts, setGcashAccounts] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const presetAmounts = ["100", "500", "1000", "5000"];
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const loadGcashSettings = async () => {
      try {
        const snap = await getDocs(collection(db, "gcashSettings"));
        const accounts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => a.order - b.order);
        setGcashAccounts(accounts.length > 0 ? accounts : [
          { id: null, accountName: "J***y P.", accountNumber: "0915 520 9950", qrCode: "/gcash-qr1.png" },
          { id: null, accountName: "J***y P.", accountNumber: "0994 478 0740", qrCode: "/gcash-qr2.png" },
        ]);
      } catch (err) {
        setGcashAccounts([
          { id: null, accountName: "J***y P.", accountNumber: "0915 520 9950", qrCode: "/gcash-qr1.png" },
          { id: null, accountName: "J***y P.", accountNumber: "0994 478 0740", qrCode: "/gcash-qr2.png" },
        ]);
      } finally {
        setLoadingAccounts(false);
      }
    };
    loadGcashSettings();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!userId) return;
    if (!referenceNo.trim()) { alert("Please enter your GCash reference number."); return; }
    setIsSubmitting(true);
    try {
      const selectedAccount = gcashAccounts[selectedIdx];
      await addDoc(collection(db, "depositRequests"), {
        userId,
        userName: auth.currentUser?.displayName || "Unknown",
        userEmail: auth.currentUser?.email || "",
        amount: parseFloat(amount),
        method: "GCash",
        referenceNo: referenceNo.trim(),
        screenshot: screenshot || null,
        // Which specific GCash account/QR this deposit was paid to — needed
        // so a Deposit Admin assigned to that account can find and approve it.
        gcashAccountId: selectedAccount?.id || null,
        status: "pending",
        createdAt: Timestamp.now(),
      });
      await addDoc(collection(db, "users", userId, "notifications"), {
        title: "Deposit Request Submitted",
        message: "Your GCash deposit of \u20B1" + parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 }) + " is under review.",
        type: "deposit", read: false, createdAt: Timestamp.now(),
      });
      setStep("success");
    } catch (err) {
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const acc = gcashAccounts[selectedIdx];

  return (
    <div className="min-h-screen bg-brand-black flex flex-col overflow-y-auto pb-32">
      <header className="flex items-center gap-4 px-6 py-4 sticky top-0 z-40 bg-brand-black/90 backdrop-blur-xl border-b border-brand-border/10">
        <button
          onClick={step === "amount" ? onBack : () => setStep(step === "upload" ? "details" : step === "details" ? "amount" : "amount")}
          className="w-10 h-10 rounded-full bg-brand-card/20 border border-brand-border flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-display font-black tracking-tight">GCash Deposit</h1>
          <p className="text-[10px] text-brand-text/40 font-black uppercase tracking-widest">
            {step === "amount" ? "Step 1 of 3" : step === "details" ? "Step 2 of 3" : step === "upload" ? "Step 3 of 3" : "Complete"}
          </p>
        </div>
      </header>

      <div className="flex gap-1 px-6 py-2">
        {["amount", "details", "upload"].map((s, i) => (
          <div key={s} className={"h-1 flex-1 rounded-full transition-all " + (["amount","details","upload","success"].indexOf(step) >= i ? "bg-brand-primary" : "bg-brand-border")} />
        ))}
      </div>

      <AnimatePresence mode="wait">

        {step === "amount" && (
          <motion.div key="amount" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6 pt-6 flex flex-col gap-6">
            <GlassCard className="!p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-4">Enter Deposit Amount</p>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-black text-brand-primary">₱</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-4xl font-black text-brand-text focus:outline-none" placeholder="0.00" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {presetAmounts.map(a => (
                  <button key={a} onClick={() => setAmount(a)}
                    className={"py-2 rounded-xl text-xs font-black border transition-all " + (amount === a ? "bg-brand-primary text-brand-black border-brand-primary" : "bg-brand-card/20 border-brand-border text-brand-text/60")}>
                    ₱{a}
                  </button>
                ))}
              </div>
            </GlassCard>
            <GlassCard className="!p-4 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center font-black text-white text-lg">G</div>
                <div>
                  <p className="text-sm font-black text-brand-text">GCash</p>
                  <p className="text-[10px] text-brand-text/40">No service fee • Processed within 24 hours</p>
                </div>
              </div>
            </GlassCard>
            <button onClick={() => { if (!amount || parseFloat(amount) < 50) { alert("Minimum deposit is ₱50."); return; } setStep("details"); }}
              className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all">
              Continue → ₱{parseFloat(amount || "0").toLocaleString()}
            </button>
          </motion.div>
        )}

        {step === "details" && (
          <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="px-6 pt-6 flex flex-col gap-6">
            <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/30">
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-1">Amount to Send</p>
              <p className="text-2xl font-black text-brand-primary">₱{parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-red-400 mt-1 font-black">⚠️ Send the EXACT amount above</p>
            </div>

            {loadingAccounts ? (
              <p className="text-center text-brand-text/40 font-bold py-4">Loading GCash details...</p>
            ) : (
              <>
                {/* Pick ONE account to pay to — the choice is recorded on the
                    deposit request, so the right Deposit Admin can find it. */}
                {gcashAccounts.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {gcashAccounts.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedIdx(idx)}
                        className={"shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all " + (selectedIdx === idx ? "bg-brand-primary text-brand-black border-brand-primary" : "bg-brand-card/20 border-brand-border text-brand-text/60")}
                      >
                        Account {idx + 1}
                      </button>
                    ))}
                  </div>
                )}

                {acc && (
                  <GlassCard className="!p-5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-4">GCash Account {selectedIdx + 1}</p>

                    {/* QR Code */}
                    <div className="flex flex-col items-center mb-5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-brand-text/40 mb-3">📷 Scan QR Code to Pay</p>
                      <div className="w-48 h-48 bg-white rounded-2xl p-3 flex items-center justify-center shadow-lg">
                        {acc.qrCode ? (
                          <img src={acc.qrCode} alt="GCash QR Code" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            <div className="w-16 h-16 bg-gray-200 rounded-xl" />
                            <p className="text-[9px] text-gray-400 font-bold text-center">QR Code not set</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Account Details */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-brand-card/20 border border-brand-border">
                        <div>
                          <p className="text-[9px] text-brand-text/40 uppercase tracking-widest">Account Name</p>
                          <p className="text-sm font-black text-brand-text">{acc.accountName}</p>
                        </div>
                        <button onClick={() => handleCopy(acc.accountName, "name" + selectedIdx)} className="flex items-center gap-1 text-brand-primary shrink-0">
                          <Copy className="w-4 h-4" />
                          {copied === "name" + selectedIdx && <span className="text-[9px] font-black">Copied!</span>}
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-brand-card/20 border border-brand-border">
                        <div>
                          <p className="text-[9px] text-brand-text/40 uppercase tracking-widest">GCash Number</p>
                          <p className="text-sm font-black text-brand-text">{acc.accountNumber}</p>
                        </div>
                        <button onClick={() => handleCopy(acc.accountNumber, "num" + selectedIdx)} className="flex items-center gap-1 text-brand-primary shrink-0">
                          <Copy className="w-4 h-4" />
                          {copied === "num" + selectedIdx && <span className="text-[9px] font-black">Copied!</span>}
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </>
            )}

            <GlassCard className="!p-4 bg-yellow-500/5 border-yellow-500/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-3">How to Pay via GCash</p>
              <ol className="flex flex-col gap-2">
                {["Open GCash app", "Scan QR Code OR tap Send Money → Enter number above", "Enter amount: ₱" + parseFloat(amount).toLocaleString(), "Confirm payment and save the receipt"].map((ins, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400 text-yellow-400 text-[9px] font-black flex items-center justify-center shrink-0">{i+1}</span>
                    <p className="text-xs text-brand-text/70">{ins}</p>
                  </li>
                ))}
              </ol>
            </GlassCard>

            <button onClick={() => setStep("upload")}
              className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all">
              I've Sent the Payment →
            </button>
          </motion.div>
        )}

        {step === "upload" && (
          <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="px-6 pt-6 flex flex-col gap-6">
            <GlassCard className="!p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-4">Proof of Payment</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-2 block">GCash Reference Number <span className="text-red-400">*</span></label>
                  <input type="text" value={referenceNo} onChange={e => setReferenceNo(e.target.value)}
                    className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 px-5 text-brand-text focus:outline-none focus:border-brand-primary/50 font-mono"
                    placeholder="e.g. 1234567890" />
                  <p className="text-[9px] text-brand-text/30 mt-1 px-1">Found in your GCash transaction receipt</p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-2 block">Screenshot of Receipt <span className="text-brand-text/20">(Recommended)</span></label>
                  {screenshot ? (
                    <div className="relative">
                      <img src={screenshot} alt="Receipt" className="w-full rounded-2xl object-cover max-h-64" />
                      <button onClick={() => setScreenshot(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full py-10 border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand-primary/50 transition-all">
                      <Upload className="w-8 h-8 text-brand-text/20" />
                      <p className="text-xs text-brand-text/40 font-black">Tap to upload GCash receipt</p>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </GlassCard>
            <GlassCard className="!p-4 bg-brand-card/5">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-brand-text">Processing Time: 1–24 hours</p>
                  <p className="text-[10px] text-brand-text/40 mt-0.5">Admin will review and credit ₱{parseFloat(amount).toLocaleString()} to your wallet.</p>
                </div>
              </div>
            </GlassCard>
            <button onClick={handleSubmit} disabled={isSubmitting || !referenceNo.trim()}
              className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50">
              {isSubmitting ? "Submitting..." : "Submit Deposit Request"}
            </button>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-brand-primary/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-brand-primary" />
            </motion.div>
            <h2 className="text-2xl font-black text-brand-text mb-2">Request Submitted!</h2>
            <p className="text-brand-text/40 mb-2">Deposit amount</p>
            <p className="text-4xl font-black text-brand-primary mb-2">₱{parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-brand-text/40 font-black uppercase tracking-widest mb-6">via GCash</p>
            <p className="text-sm text-brand-text/40 mb-8 max-w-xs">Your request is being reviewed. You will receive a notification once approved.</p>
            <button onClick={onBack} className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl">
              Back to Home
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
