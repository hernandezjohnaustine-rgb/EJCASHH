import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, Filter, Search, Calendar, Download } from "lucide-react";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import TransactionDetailModal from "../components/TransactionDetailModal";
import { Transaction } from "../types";

const transactions: Transaction[] = [
  { id: 1, type: "out", title: "Starbucks Coffee", date: "Today, 10:45 AM", amount: "-₱185.00", category: "Food & Drinks", status: "Completed" },
  { id: 2, type: "in", title: "Monthly Salary", date: "Yesterday, 06:00 PM", amount: "+₱42,500.00", category: "Work", status: "Completed" },
  { id: 3, type: "out", title: "Meralco Bill", date: "April 25, 02:30 PM", amount: "-₱3,420.50", category: "Bills", status: "Completed" },
  { id: 4, type: "out", title: "Netflix Subscription", date: "April 24, 09:00 AM", amount: "-₱549.00", category: "Entertainment", status: "Completed" },
  { id: 5, type: "out", title: "7-Eleven Store", date: "April 23, 11:15 PM", amount: "-₱120.00", category: "Shopping", status: "Completed" },
  { id: 6, type: "in", title: "Gcash Cash-In", date: "April 22, 09:00 AM", amount: "+₱5,000.00", category: "Cash In", status: "Completed" },
  { id: 7, type: "out", title: "Steam Wallet", date: "April 21, 04:20 PM", amount: "-₱1,000.00", category: "Games", status: "Completed" },
];

export default function TransactionHistoryScreen({ onBack }: { onBack: () => void }) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  return (
    <div className="flex flex-col gap-6 h-full bg-brand-black p-6 pt-12 overflow-y-auto pb-32">
      <header className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-display font-bold tracking-tight uppercase">History</h2>
        <button className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
          <Download className="w-5 h-5 text-brand-neon" />
        </button>
      </header>

      {/* Stats Summary */}
      <section className="grid grid-cols-2 gap-4">
         <div className="glass-card !p-4 bg-brand-blue/10 border-brand-blue/20">
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Income</span>
            <p className="text-lg font-display font-bold text-brand-neon mt-1">₱47,500.00</p>
         </div>
         <div className="glass-card !p-4 bg-red-500/10 border-red-500/20">
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Outcome</span>
            <p className="text-lg font-display font-bold text-red-500 mt-1">₱5,414.50</p>
         </div>
      </section>

      {/* Filter & Search */}
      <section className="flex items-center gap-3">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search history..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none"
            />
         </div>
         <button className="glass-card !p-3 !rounded-2xl flex items-center justify-center">
            <Filter className="w-4 h-4 text-white/60" />
         </button>
      </section>

      {/* List */}
      <section className="flex flex-col gap-4">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Past 30 Days</h3>
            <div className="flex items-center gap-1 text-[10px] text-brand-neon font-bold">
               <Calendar className="w-3 h-3" />
               <span>April 2026</span>
            </div>
         </div>

          <div className="flex flex-col gap-3">
            {transactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedTx(tx)}
                className="glass-card !p-4 flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer"
              >
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'in' ? 'bg-brand-neon/10' : 'bg-white/5'}`}>
                        {tx.type === 'in' ? <ArrowDownLeft className="w-5 h-5 text-brand-neon" /> : <ArrowUpRight className="w-5 h-5 text-white/60" />}
                     </div>
                     <div className="text-left">
                        <h4 className="text-sm font-bold tracking-tight">{tx.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[9px] text-white/30 font-medium tracking-wider">{tx.date}</span>
                           <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                           <span className="text-[9px] text-white/40 uppercase tracking-widest font-black leading-none">{tx.category}</span>
                        </div>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className={`text-sm font-display font-bold ${tx.type === 'in' ? 'text-brand-neon' : 'text-white'}`}>
                        {tx.amount}
                     </p>
                  </div>
              </motion.div>
            ))}
         </div>
      </section>

      <TransactionDetailModal 
        transaction={selectedTx} 
        onClose={() => setSelectedTx(null)} 
      />
    </div>
  );
}
