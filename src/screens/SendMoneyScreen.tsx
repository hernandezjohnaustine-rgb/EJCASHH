import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, Search, User, ChevronRight, Phone, Star, Landmark, ScanLine, PlusCircle } from "lucide-react";
import GlassCard from "../components/GlassCard";

const contacts = [
  { id: 1, name: "Maria Garcia", initial: "MG", phone: "0917 ••• 4521", saved: true },
  { id: 2, name: "Robert Chen", initial: "RC", phone: "0918 ••• 8812", saved: true },
  { id: 3, name: "John Doe", initial: "JD", phone: "0919 ••• 1234", saved: false },
  { id: 4, name: "Sarah Smith", initial: "SS", phone: "0920 ••• 5678", saved: true },
];

export default function SendMoneyScreen({ onBack, onConfirm, balance }: { 
  onBack: () => void, 
  onConfirm: (amount: number, recipient: string) => void,
  balance: number
}) {
  const [recipient, setRecipient] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const handleSend = () => {
    const amt = parseFloat(amount);
    if (amt > 0 && recipient) {
      onConfirm(amt, recipient);
    }
  };

  if (recipient) {
    const selected = contacts.find(c => c.name === recipient) || { name: recipient, initial: recipient[0], phone: "New Contact" };
    
    return (
      <div className="flex flex-col gap-8 h-full bg-brand-black p-6 pt-12 overflow-y-auto">
        <header className="flex items-center justify-between">
          <button onClick={() => setRecipient(null)} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-display font-bold">Transfer Details</h2>
          <div className="w-10"></div>
        </header>

        <section className="flex flex-col items-center gap-4 py-8">
          <div className="w-20 h-20 rounded-[28px] bg-brand-primary flex items-center justify-center text-2xl font-bold border-4 border-white/5 shadow-2xl text-brand-black">
            {selected.initial}
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold">{selected.name}</h3>
            <p className="text-sm text-white/40">{selected.phone}</p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="relative">
             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-display font-bold text-white/20">₱</span>
             <input
               autoFocus
               type="number"
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               placeholder="0.00"
               className="w-full bg-white/5 border border-white/10 rounded-[32px] py-10 px-12 text-5xl font-display font-black text-center focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-white/5"
             />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {["100", "500", "1,000", "5,000"].map(val => (
                <button 
                  key={val}
                  onClick={() => setAmount(val.replace(',', ''))}
                  className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-white/5"
                >
                  ₱{val}
                </button>
            ))}
          </div>
        </section>

        <section className="mt-4">
           <GlassCard className="!p-4 bg-brand-navy/40">
              <div className="flex justify-between items-center">
                 <span className="text-xs text-white/40 font-medium">Available Balance</span>
                 <span className="text-xs font-bold text-brand-primary">₱{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
           </GlassCard>
        </section>

        <div className="mt-auto pb-4">
          <button 
            onClick={handleSend}
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
            className={`w-full h-16 rounded-2xl text-lg font-bold transition-all shadow-[0_0_30px_rgba(250,204,21,0.4)] ${
              (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance) ? 'bg-white/5 text-white/20' : 'bg-brand-primary text-brand-black'
            }`}
          >
            {parseFloat(amount) > balance ? "Insufficient Balance" : "Send Money"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col gap-8 h-full bg-brand-black p-6 pt-12 overflow-y-auto"
    >
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-display font-bold tracking-tight uppercase">Send Money</h2>
        <div className="w-10"></div>
      </header>

      {/* Search & New */}
      <section className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input 
            type="text" 
            placeholder="Search name, phone or email"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-primary/30 transition-all text-sm font-medium"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost !py-3">
            <ScanLine className="w-5 h-5 text-brand-primary" />
            <span className="text-xs">Scan QR</span>
          </button>
          <button className="btn-ghost !py-3">
            <Landmark className="w-5 h-5 text-brand-primary" />
            <span className="text-xs">To Bank</span>
          </button>
        </div>
      </section>

      {/* Recents */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Recent Recipients</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6">
          {contacts.map(contact => (
            <button 
              key={contact.id} 
              onClick={() => setRecipient(contact.name)}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-lg font-bold group-hover:bg-brand-primary/20 group-hover:border-brand-primary/30 transition-all">
                {contact.initial}
              </div>
              <span className="text-[10px] font-bold text-white/60 tracking-wider">{contact.name.split(' ')[0]}</span>
            </button>
          ))}
          <button className="flex flex-col items-center gap-2 shrink-0">
             <div className="w-16 h-16 rounded-[24px] border-2 border-dashed border-white/10 flex items-center justify-center">
                <PlusCircle className="w-6 h-6 text-white/20" />
             </div>
             <span className="text-[10px] font-bold text-white/20 tracking-wider">New</span>
          </button>
        </div>
      </section>

      {/* All Contacts */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Quick Contacts</h3>
        <div className="flex flex-col gap-3">
           {contacts.map(contact => (
             <button 
              key={contact.id} 
              onClick={() => setRecipient(contact.name)}
              className="glass-card !p-4 flex items-center justify-between group hover:bg-white/10 transition-colors"
             >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs">
                    {contact.initial}
                   </div>
                   <div className="text-left">
                      <h4 className="text-sm font-bold">{contact.name}</h4>
                      <p className="text-[10px] text-white/40 tracking-wider">{contact.phone}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   {contact.saved && <Star className="w-4 h-4 text-brand-primary fill-brand-primary/20" />}
                   <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                </div>
             </button>
           ))}
        </div>
      </section>
    </motion.div>
  );
}
