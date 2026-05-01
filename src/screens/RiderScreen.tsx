import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bike, Package, MapPin, Search, ChevronLeft, Star, Clock, ShieldCheck } from "lucide-react";
import GlassCard from "../components/GlassCard";

const RIDER_SERVICES = [
  { id: 'ride', title: 'Rider Go', desc: 'Fast motorcycle ride', icon: <Bike className="w-5 h-5" />, price: '₱45.00' },
  { id: 'delivery', title: 'Express Delivery', desc: 'Instant item delivery', icon: <Package className="w-5 h-5" />, price: '₱55.00' },
];

const NEARBY_RIDERS = [
  { id: 1, name: 'Juan D.', rating: 4.9, trips: 1240, model: 'Honda Click' },
  { id: 2, name: 'Maria C.', rating: 4.8, trips: 920, model: 'Yamaha Mio' },
];

export default function RiderScreen({ onBack, onConfirm }: any) {
  const [activeService, setActiveService] = useState(RIDER_SERVICES[0]);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex flex-col p-6 pt-12 overflow-y-auto pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-brand-card/5 flex items-center justify-center border border-brand-border">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-black tracking-tight">Rider Services</h1>
        <div className="w-10" />
      </header>

      <section className="mb-8">
        <div className="glass-card !p-6 border-brand-border space-y-4">
           <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
              <input 
                type="text" 
                placeholder="Pickup Location" 
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full bg-brand-card/5 border border-brand-border rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary/50"
              />
           </div>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
              <input 
                type="text" 
                placeholder="Where to?" 
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                className="w-full bg-brand-card/5 border border-brand-border rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary/50"
              />
           </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/40 mb-4 ml-2">Choose Service</h3>
        <div className="grid grid-cols-2 gap-4">
          {RIDER_SERVICES.map((service) => (
            <button
              key={service.id}
              onClick={() => setActiveService(service)}
              className={`glass-card !p-5 text-left border-2 transition-all ${
                activeService.id === service.id ? "border-brand-primary bg-brand-primary/5" : "border-transparent bg-brand-card/5"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${activeService.id === service.id ? 'bg-brand-primary text-brand-black' : 'bg-brand-card/10 text-brand-text/60'}`}>
                {service.icon}
              </div>
              <h4 className="text-sm font-bold">{service.title}</h4>
              <p className="text-[10px] text-brand-text/40 font-medium">{service.desc}</p>
              <p className="text-sm font-black text-brand-primary mt-2">Starts at {service.price}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/40 mb-4 ml-2">Available Riders Nearby</h3>
        <div className="flex flex-col gap-3">
          {NEARBY_RIDERS.map((rider) => (
            <GlassCard key={rider.id} className="!p-4 flex items-center justify-between border-brand-border">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-brand-card/5 p-1 border border-brand-border">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.name}`} className="w-full h-full object-cover rounded-xl" alt={rider.name} referrerPolicy="no-referrer" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold">{rider.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-primary">
                          <Star className="w-2.5 h-2.5 fill-current" /> {rider.rating}
                       </span>
                       <span className="text-[10px] text-brand-text/20 font-black">•</span>
                       <span className="text-[10px] text-brand-text/40 font-bold uppercase tracking-widest">{rider.model}</span>
                    </div>
                 </div>
              </div>
              <div className="text-right">
                 <div className="flex items-center gap-1 text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> 2 MINS
                 </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mt-auto">
         <div className="flex items-center justify-center gap-2 mb-6">
            <ShieldCheck className="w-4 h-4 text-brand-primary/40" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-text/20">All trips are insured by EJ-Insure</span>
         </div>
         <button 
           onClick={() => onConfirm(55, activeService.title)}
           disabled={!pickup || !dropoff}
           className="btn-primary w-full h-16 text-lg tracking-tight disabled:opacity-50"
         >
           Book {activeService.title}
         </button>
      </section>
    </div>
  );
}
