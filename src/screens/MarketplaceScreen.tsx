import { useState } from "react";
import { motion } from "motion/react";
import { ShoppingBag, Search, ChevronLeft, Filter, Star, ShoppingCart, Heart } from "lucide-react";
import GlassCard from "../components/GlassCard";

const PRODUCTS = [
  { id: 1, title: 'Premium Beauty Soap', price: 360, rating: 5.0, reviews: 124, image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&q=80&w=200', category: 'Health & Beauty' },
  { id: 2, title: 'Organic Serum', price: 850, rating: 4.8, reviews: 89, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200', category: 'Health & Beauty' },
  { id: 3, title: 'EJCASHH Merch T-Shirt', price: 499, rating: 4.9, reviews: 210, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=200', category: 'Merchandise' },
  { id: 4, title: 'Solar Power Bank', price: 1200, rating: 4.7, reviews: 45, image: 'https://images.unsplash.com/photo-1619134769032-e9d758303449?auto=format&fit=crop&q=80&w=200', category: 'Electronics' },
];

export default function MarketplaceScreen({ onBack, onConfirm }: any) {
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-brand-black flex flex-col p-6 pt-12 overflow-y-auto pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-black tracking-tight">Marketplace</h1>
        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 relative">
          <ShoppingCart className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-brand-black text-[10px] font-black flex items-center justify-center rounded-full">2</div>
        </button>
      </header>

      <section className="mb-8">
         <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-brand-primary/50"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary">
               <Filter className="w-4 h-4" />
            </button>
         </div>
      </section>

      <section className="mb-8">
         <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Categories</h3>
            <button className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">See All</button>
         </div>
         <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Beauty', 'Merch', 'Electronics', 'Home'].map((cat, i) => (
              <button 
                key={cat}
                className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${i === 0 ? 'bg-brand-primary text-brand-black' : 'bg-white/5 text-white/40 border border-white/10'}`}
              >
                {cat}
              </button>
            ))}
         </div>
      </section>

      <section>
         <div className="grid grid-cols-2 gap-4">
            {PRODUCTS.map((prod) => (
              <GlassCard key={prod.id} className="!p-0 border-white/5 overflow-hidden flex flex-col h-full group">
                 <div className="relative aspect-square overflow-hidden bg-white/5">
                    <img 
                      src={prod.image} 
                      alt={prod.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                    <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-brand-black/50 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-red-500 transition-colors">
                       <Heart className="w-4 h-4" />
                    </button>
                 </div>
                 <div className="p-4 flex flex-col flex-grow">
                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1">{prod.category}</p>
                    <h4 className="text-sm font-bold line-clamp-2 mb-2 flex-grow">{prod.title}</h4>
                    <div className="flex items-center gap-1 mb-3">
                       <Star className="w-3 h-3 text-brand-primary fill-current" />
                       <span className="text-[10px] font-bold">{prod.rating}</span>
                       <span className="text-[10px] text-white/20 font-medium ml-1">({prod.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                       <p className="text-lg font-display font-black tracking-tighter">₱{prod.price}</p>
                       <button 
                         onClick={() => onConfirm(prod.price, prod.title)}
                         className="w-8 h-8 rounded-lg bg-brand-primary text-brand-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                       >
                         <ShoppingBag className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              </GlassCard>
            ))}
         </div>
      </section>
    </div>
  );
}
