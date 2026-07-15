import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Landmark, Banknote, Copy, CheckCircle2, Upload, X, Clock } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { doc, addDoc, collection, Timestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

const PAYMENT_METHODS = [
  {
    id: "gcash",
    name: "GCash",
    color: "#1B6FEB",
    icon: "G",
    accountName: "EJCASHH Digital",
    accountNumber: "09XX-XXX-XXXX",
    fee: "Free",
  },
  {
    id: "maya",
    name: "Maya",
    color: "#00B16A",
    icon: "M",
    accountName: "EJCASHH Digital",
    accountNumber: "09XX-XXX-XXXX",
    fee: "Free",
  },
  {
    id: "bdo",
    name: "BDO",
    color: "#003087",
    icon: "B",
    accountName: "EJCASHH Digital Marketing",
    accountNumber: "XXXX-XXXX-XXXX",
    fee: "Free",
  },
  {
    id: "bpi",
    name: "BPI",
    color: "#B22222",
    icon: "B",
    accountName: "EJCASHH Digital Marketing",
    accountNumber: "XXXX-XXXX-XXXX",
    fee: "Free",
  },
  {
    id: "bank",
    name: "Bank Transfer",
    color: "#F59E0B",
    icon: "T",
    accountName: "EJCASHH Digital Marketing",
    accountNumber: "XXXX-XXXX-XXXX",
    fee: "Free",
  },
];

export default function CashInScreen({ onBack, onConfirm }: any) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [step, setStep] = useState<"method" | "details" | "upload" | "success">("method");
  const [referenceNo, setReferenceNo] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const presetAmounts = ["100", "500", "1000", "5000"];
  const userId = auth.currentUser?.uid;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!userId) return;
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (!referenceNo) {
      alert("Please enter your reference number.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "depositRequests"), {
        userId,
        amount: parseFloat(amount),
        method: method.name,
        methodId: method.id,
        referenceNo,
        screenshot: screenshot || null,
        status: "pending",
        createdAt: Timestamp.now(),
        userName: auth.currentUser?.displayName || "Unknown",
        userEmail: auth.currentUser?.email || "",
      });

      // Send notification to user
      await addDoc(collection(db, "users", userId, "notifications"), {
        title: "Deposit Request Submitted",
        message: "Your deposit of ₱" + parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 }) + " via " + method.name + " is being reviewed.",
        type: "deposit",
        read: false,
        createdAt: Timestamp.now(),
      });

      setStep("success");
    } catch (err) {
      alert("Failed to submit deposit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col overflow-y-auto pb-32">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 sticky top-0 z-40 bg-brand-black/90 backdrop-blur-xl border-b border-brand-border/10">
        <button onClick={step === "method" ? onBack : () => setStep(step === "upload" ? "details" : "method")} className="w-10 h-10 rounded-full bg-brand-card/20 border border-brand-border flex items-center justify-center">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-black tracking-tight">Cash In</h1>
      </header>

      <AnimatePresence mode="wait">

        {/* Step 1 — Select Method & Amount */}
        {step === "method" && (
          <motion.div key="method" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6 pt-6 flex flex-col gap-6">
            {/* Amount */}
            <GlassCard className="!p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-4">Enter Amount</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-black text-brand-primary">₱</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-4xl font-black text-brand-text focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {presetAmounts.map(a => (
                  <button key={a} onClick={() => setAmount(a)} className={`py-2 rounded-xl text-xs font-black border transition-all ${amount === a ? "bg-brand-primary text-brand-black border-brand-primary" : "bg-brand-card/20 border-brand-border text-brand-text/60"}`}>
                    +{a}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Payment Methods */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-3">Select Method</p>
              <div className="flex flex-col gap-3">
                {PAYMENT_METHODS.map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setMethod(pm)}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${method.id === pm.id ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-brand-card/5"}`}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white" style={{ backgroundColor: pm.color }}>
                      {pm.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-black text-brand-text">{pm.name}</p>
                      <p className="text-[10px] text-brand-text/40">Fee: {pm.fee}</p>
                    </div>
                    {method.id === pm.id && <CheckCircle2 className="w-5 h-5 text-brand-primary" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (!amount || parseFloat(amount) <= 0) { alert("Please enter an amount."); return; }
                setStep("details");
              }}
              className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
            >
              Continue → ₱{parseFloat(amount || "0").toLocaleString()}
            </button>
          </motion.div>
        )}

        {/* Step 2 — Payment Details */}
        {step === "details" && (
          <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="px-6 pt-6 flex flex-col gap-6">
            <GlassCard className="!p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white" style={{ backgroundColor: method.color }}>
                  {method.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">Send Payment Via</p>
                  <h2 className="text-xl font-black text-brand-text">{method.name}</h2>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-brand-card/20 border border-brand-border">
                  <p className="text-[9px] font-black uppercase tracking-widest text-brand-text/40 mb-1">Account Name</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-brand-text">{method.accountName}</p>
                    <button onClick={() => handleCopy(method.accountName)} className="text-brand-primary">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-brand-card/20 border border-brand-border">
                  <p className="text-[9px] font-black uppercase tracking-widest text-brand-text/40 mb-1">Account Number</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-brand-text">{method.accountNumber}</p>
                    <button onClick={() => handleCopy(method.accountNumber)} className="text-brand-primary">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-1">Amount to Send</p>
                  <p className="text-2xl font-black text-brand-primary">₱{parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {copied && <p className="text-center text-brand-primary text-xs font-black mt-2">Copied! ✓</p>}
            </GlassCard>

            <GlassCard className="!p-4 bg-yellow-500/5 border-yellow-500/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-2">Instructions</p>
              <ol className="flex flex-col gap-2">
                {["Open your " + method.name + " app", "Send ₱" + parseFloat(amount).toLocaleString() + " to the account above", "Take a screenshot of the successful transfer", "Come back and upload your proof of payment"].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-yellow-400 text-brand-black text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                    <p className="text-xs text-brand-text/70">{step}</p>
                  </li>
                ))}
              </ol>
            </GlassCard>

            <button
              onClick={() => setStep("upload")}
              className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
            >
              I've Sent the Payment →
            </button>
          </motion.div>
        )}

        {/* Step 3 — Upload Proof */}
        {step === "upload" && (
          <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="px-6 pt-6 flex flex-col gap-6">
            <GlassCard className="!p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-4">Upload Proof of Payment</p>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-2 block">Reference / Transaction Number</label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={e => setReferenceNo(e.target.value)}
                    className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 px-5 text-brand-text focus:outline-none focus:border-brand-primary/50"
                    placeholder="Enter reference number"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-2 block">Screenshot (Optional)</label>
                  {screenshot ? (
                    <div className="relative">
                      <img src={screenshot} alt="Screenshot" className="w-full rounded-2xl object-cover max-h-48" />
                      <button onClick={() => { setScreenshot(null); setScreenshotFile(null); }} className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full py-8 border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary/50 transition-all">
                      <Upload className="w-8 h-8 text-brand-text/20" />
                      <p className="text-xs text-brand-text/40 font-black">Tap to upload screenshot</p>
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
                  <p className="text-xs font-black text-brand-text">Processing Time</p>
                  <p className="text-[10px] text-brand-text/40">Your deposit will be reviewed and credited within 1-24 hours after submission.</p>
                </div>
              </div>
            </GlassCard>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !referenceNo}
              className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Deposit Request"}
            </button>
          </motion.div>
        )}

        {/* Step 4 — Success */}
        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="w-24 h-24 rounded-full bg-brand-primary/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-brand-primary" />
            </div>
            <h2 className="text-2xl font-black text-brand-text mb-2">Request Submitted!</h2>
            <p className="text-brand-text/40 mb-2">Your deposit of</p>
            <p className="text-3xl font-black text-brand-primary mb-4">₱{parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            <p className="text-sm text-brand-text/40 mb-8">is being reviewed. You will receive a notification once your deposit is approved and credited to your wallet.</p>
            <div className="flex flex-col gap-3 w-full">
              <button onClick={onBack} className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl">
                Back to Home
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
