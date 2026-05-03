import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { ArrowLeft, Landmark, CheckCircle2, User, Hash, Loader2 } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const methods = [
  { id: "gcash", label: "GCash", icon: "G", color: "bg-blue-500" },
  { id: "maya", label: "Maya", icon: "M", color: "bg-green-500" },
  { id: "bank", label: "Bank Transfer", icon: Landmark, color: "bg-brand-primary" },
  { id: "crypto", label: "Crypto Wallet", icon: "₿", color: "bg-orange-500" },
];

export default function WithdrawScreen({
  onBack,
  balance,
  onConfirm,
}: {
  onBack: () => void;
  balance: number;
  onConfirm: (amount: number) => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMethodObj = methods.find((m) => m.id === selectedMethod);

  const handleConfirm = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    if (amt > balance) {
      setError("Insufficient balance.");
      return;
    }
    if (!accountName.trim() || !accountNumber.trim()) {
      setError("Please fill in all account details.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const userId = auth.currentUser?.uid;

      // Save withdrawal request to Firestore for admin approval
      await addDoc(collection(db, "withdrawalRequests"), {
        userId,
        amount: amt,
        method: selectedMethod,
        methodLabel: selectedMethodObj?.label,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        status: "pending",
        createdAt: Timestamp.now(),
      });

      // Deduct from balance immediately
      onConfirm(amt);
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to submit withdrawal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4 — Success
  if (step === 4) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-black p-6 text-brand-text">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-24 h-24 rounded-[40px] bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-8"
        >
          <CheckCircle2 className="w-12 h-12 text-brand-primary" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-2xl font-display font-bold mb-2">Request Submitted</h2>
          <p className="text-sm text-brand-text/40 text-center mb-2 max-w-[280px]">
            Your withdrawal of{" "}
            <span className="text-brand-primary font-bold">
              ₱{parseFloat(amount).toLocaleString()}
            </span>{" "}
            via {selectedMethodObj?.label} is pending admin approval.
          </p>
          <p className="text-xs text-brand-text/20 mb-12">
            Funds will be sent to {accountName} ({accountNumber})
          </p>
          <button onClick={onBack} className="btn-primary w-full max-w-[200px]">
            Back to Hub
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex flex-col p-6 pt-12 overflow-y-auto pb-32">
      <header className="flex items-center justify-between mb-8">
        <button
          onClick={step > 1 ? () => setStep(step - 1) : onBack}
          className="p-2 hover:bg-brand-card/10 rounded-2xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-display font-bold tracking-tight uppercase">
          Withdraw Funds
        </h2>
        <div className="w-10" />
      </header>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 rounded-full transition-all duration-300 ${
              s <= step ? "bg-brand-primary w-8" : "bg-brand-border w-4"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1 — Select Method */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div className="text-center px-4">
              <p className="text-xs text-brand-text/40 uppercase tracking-widest font-bold mb-1">
                Available for Withdrawal
              </p>
              <h3 className="text-3xl font-display font-black text-brand-primary italic">
                ₱{balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </h3>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/30 ml-2">
                Select Method
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`glass-card !p-5 flex items-center justify-between transition-all ${
                      selectedMethod === m.id
                        ? "border-brand-primary/40 bg-brand-primary/5"
                        : "border-brand-border bg-brand-card/5 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center font-black text-white italic`}
                      >
                        {typeof m.icon === "string" ? (
                          m.icon
                        ) : (
                          <m.icon className="w-6 h-6" />
                        )}
                      </div>
                      <h5 className="font-bold">{m.label}</h5>
                    </div>
                    {selectedMethod === m.id && (
                      <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!selectedMethod}
              onClick={() => setStep(2)}
              className="btn-primary w-full mt-4 disabled:opacity-50"
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* Step 2 — Account Details */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div className="text-center">
              <p className="text-xs text-brand-text/40 uppercase tracking-widest font-bold mb-1">
                {selectedMethodObj?.label} Account Details
              </p>
              <p className="text-xs text-brand-text/20">
                Where should we send your money?
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              {/* Account Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-brand-text/30 ml-2">
                  Account Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/30" />
                  <input
                    type="text"
                    placeholder="Juan Dela Cruz"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full bg-brand-card/5 border border-brand-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-brand-text/20"
                  />
                </div>
              </div>

              {/* Account Number */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-brand-text/30 ml-2">
                  {selectedMethod === "bank" ? "Account Number" : selectedMethod === "crypto" ? "Wallet Address" : "Mobile Number"}
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/30" />
                  <input
                    type={selectedMethod === "crypto" ? "text" : "tel"}
                    placeholder={
                      selectedMethod === "bank"
                        ? "0000-0000-0000"
                        : selectedMethod === "crypto"
                        ? "0x..."
                        : "09XX XXX XXXX"
                    }
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-brand-card/5 border border-brand-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-brand-text/20"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={!accountName.trim() || !accountNumber.trim()}
              onClick={() => setStep(3)}
              className="btn-primary w-full mt-4 disabled:opacity-50"
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* Step 3 — Enter Amount */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-8"
          >
            <div className="text-center">
              <p className="text-xs text-brand-text/40 uppercase tracking-widest font-bold mb-1">
                Enter Amount
              </p>
              <p className="text-xs text-brand-text/20">
                Sending to {accountName} · {accountNumber}
              </p>
            </div>

            <div className="relative mt-4">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-display font-bold text-brand-text/20">
                ₱
              </span>
              <input
                autoFocus
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-brand-card/5 border border-brand-border rounded-[32px] py-10 px-12 text-5xl font-display font-black text-center focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-brand-text/5"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {["1,000", "5,000", "10,000", "All"].map((val) => (
                <button
                  key={val}
                  onClick={() =>
                    setAmount(
                      val === "All" ? balance.toString() : val.replace(",", "")
                    )
                  }
                  className="bg-brand-card/5 hover:bg-brand-card/10 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-brand-border"
                >
                  {val === "All" ? "All" : `₱${val}`}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 px-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-text/40">Method</span>
                <span className="font-bold">{selectedMethodObj?.label}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-text/40">Withdrawal Fee</span>
                <span className="font-bold">₱15.00</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-brand-border pt-3">
                <span className="text-brand-text/40">Net Amount</span>
                <span className="font-bold text-brand-primary text-base">
                  ₱{amount ? Math.max(0, parseFloat(amount) - 15).toLocaleString() : "0.00"}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="text-xs text-red-400 font-bold text-center">{error}</p>
              </div>
            )}

            <button
              disabled={!amount || parseFloat(amount) > balance || parseFloat(amount) <= 0 || isSubmitting}
              onClick={handleConfirm}
              className="btn-primary w-full disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Confirm Withdrawal"
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
