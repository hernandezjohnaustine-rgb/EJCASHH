import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Search, ChevronLeft, Filter, Star, ShoppingCart, Heart, X, MapPin, CheckCircle, Wallet, CreditCard } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { collection, addDoc, getDocs, doc, getDoc, Timestamp, setDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

const COMMISSION_RATES: Record<number, number> = {
  1: 0.10, 2: 0.05, 3: 0.03, 4: 0.02,
  5: 0.01, 6: 0.01, 7: 0.01, 8: 0.01, 9: 0.01, 10: 0.01,
};

async function distributeMarketplaceCommission(buyerId: string, productPrice: number) {
  let currentUid = buyerId;
  for (let level = 1; level <= 10; level++) {
    const userDoc = await getDoc(doc(db, "users", currentUid));
    if (!userDoc.exists()) break;
    const userData = userDoc.data();
    const sponsorId = userData.sponsorId;
    if (!sponsorId) break;
    const commission = productPrice * COMMISSION_RATES[level];
    const sponsorDoc = await getDoc(doc(db, "users", sponsorId));
    if (!sponsorDoc.exists()) break;
    const sponsorData = sponsorDoc.data();
    await setDoc(doc(db, "users", sponsorId), {
      balance: (sponsorData.balance || 0) + commission,
      earningsWallet: (sponsorData.earningsWallet || 0) + commission,
      stats: { ...sponsorData.stats, totalEarnings: (sponsorData.stats?.totalEarnings || 0) + commission }
    }, { merge: true });
    await addDoc(collection(db, "transactions"), {
      userId: sponsorId,
      type: "in",
      title: `Marketplace Commission (Level ${level})`,
      amount: commission,
      category: "Commission",
      status: "Completed",
      referenceNo: "EJ-MKT-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      paymentMethod: "MLM Commission",
      timestamp: Timestamp.now(),
    });
    currentUid = sponsorId;
  }
}

async function getProducts() {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function createOrder(order: any) {
  return await addDoc(collection(db, "orders"), {
    ...order,
    status: "Pending",
    createdAt: Timestamp.now(),
  });
}

const CATEGORIES = ['All', 'Beauty', 'Merch', 'Electronics', 'Home'];

const FALLBACK_PRODUCTS = [
  { id: '1', title: 'Premium Beauty Soap', price: 360, rating: 5.0, reviews: 124, image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&q=80&w=200', category: 'Beauty', description: 'Premium quality beauty soap for smooth skin.', stock: 50 },
  { id: '2', title: 'Organic Serum', price: 850, rating: 4.8, reviews: 89, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200', category: 'Beauty', description: 'Organic serum for glowing skin.', stock: 30 },
  { id: '3', title: 'EJCASHH Merch T-Shirt', price: 499, rating: 4.9, reviews: 210, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=200', category: 'Merch', description: 'Official EJCASHH merchandise.', stock: 100 },
  { id: '4', title: 'Solar Power Bank', price: 1200, rating: 4.7, reviews: 45, image: 'https://images.unsplash.com/photo-1619134769032-e9d758303449?auto=format&fit=crop&q=80&w=200', category: 'Electronics', description: 'Solar powered portable charger.', stock: 20 },
];

export default function MarketplaceScreen({ onBack, onConfirm, balance, userProfile }: any) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState<any[]>(FALLBACK_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "gcash">("wallet");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    getProducts().then(p => { if (p.length > 0) setProducts(p); }).catch(() => {});
  }, []);

  const filtered = products.filter(p => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const toggleWishlist = (id: string) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handlePlaceOrder = async () => {
    if (!address || !phone) { alert("Please fill in delivery address and phone number."); return; }
    if (paymentMethod === "wallet" && balance < cartTotal) { alert("Insufficient wallet balance."); return; }
    setIsProcessing(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      for (const item of cart) {
        await createOrder({
          buyerId: user.uid,
          buyerName: userProfile?.displayName || "Member",
          productId: item.id,
          productTitle: item.title,
          productImage: item.image,
          quantity: item.qty,
          price: item.price,
          total: item.price * item.qty,
          paymentMethod,
          deliveryAddress: address,
          phone,
          status: "Pending",
        });
        await distributeMarketplaceCommission(user.uid, item.price * item.qty);
        if (paymentMethod === "wallet") onConfirm(item.price * item.qty, item.title);
      }
      setCart([]);
      setShowCart(false);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (err) {
      alert("Order failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col overflow-y-auto pb-32">
      <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-40 bg-brand-black/90 backdrop-blur-xl border-b border-brand-border/10">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-brand-card/20 border border-brand-border flex items-center justify-center">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-black tracking-tight">Marketplace</h1>
        <button onClick={() => setShowCart(true)} className="w-10 h-10 rounded-full bg-brand-card/20 border border-brand-border flex items-center justify-center relative">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-primary text-brand-black text-[10px] font-black flex items-center justify-center rounded-full">{cartCount}</div>
          )}
        </button>
      </header>

      <div className="px-6 pt-6">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-brand-primary/50 text-brand-text" />
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 mb-6">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-5 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${activeCategory === cat ? 'bg-brand-primary text-brand-black' : 'bg-brand-card/20 border border-brand-border text-brand-text/60'}`}>
              {cat}
            </button>
          ))}
        </div>

        <GlassCard className="!p-4 mb-6 bg-brand-primary/5 border-brand-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-xs font-black text-brand-primary uppercase tracking-widest">Earn MLM Commission</p>
              <p className="text-[10px] text-brand-text/40">Up to 10 levels • Level 1 earns 10%</p>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-4">
          {filtered.map(prod => (
            <GlassCard key={prod.id} className="!p-0 overflow-hidden flex flex-col group cursor-pointer">
              <div className="relative aspect-square overflow-hidden bg-brand-card/20" onClick={() => setSelectedProduct(prod)}>
                <img src={prod.image} alt={prod.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                <button onClick={e => { e.stopPropagation(); toggleWishlist(prod.id); }}
                  className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-brand-black/50 backdrop-blur-md flex items-center justify-center transition-colors ${wishlist.includes(prod.id) ? 'text-red-500' : 'text-brand-text/60'}`}>
                  <Heart className={`w-4 h-4 ${wishlist.includes(prod.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div className="p-3 flex flex-col flex-grow" onClick={() => setSelectedProduct(prod)}>
                <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-1">{prod.category}</p>
                <h4 className="text-xs font-bold line-clamp-2 mb-2 flex-grow text-brand-text">{prod.title}</h4>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-[10px] font-bold text-brand-text">{prod.rating}</span>
                  <span className="text-[10px] text-brand-text/40">({prod.reviews})</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-base font-display font-black text-brand-text">₱{prod.price}</p>
                  <button onClick={e => { e.stopPropagation(); addToCart(prod); }}
                    className="w-8 h-8 rounded-lg bg-brand-primary text-brand-black flex items-center justify-center active:scale-95 transition-all">
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-brand-black/90 backdrop-blur-md flex items-end">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="w-full bg-brand-navy rounded-t-3xl overflow-y-auto max-h-[90vh]">
              <div className="relative h-64">
                <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-brand-black/50 flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">{selectedProduct.category}</p>
                <h2 className="text-xl font-black mb-2 text-brand-text">{selectedProduct.title}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-bold text-brand-text">{selectedProduct.rating}</span>
                  <span className="text-brand-text/40">({selectedProduct.reviews} reviews)</span>
                </div>
                <p className="text-brand-text/60 text-sm mb-4">{selectedProduct.description || "Quality product from EJCASHH Marketplace."}</p>
                <GlassCard className="!p-4 mb-4 bg-brand-primary/5 border-brand-primary/20">
                  <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2">MLM Commission Preview</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[1,2,3,4,5].map(level => (
                      <div key={level} className="flex justify-between text-[10px]">
                        <span className="text-brand-text/40">Level {level}</span>
                        <span className="font-black text-brand-primary">₱{(selectedProduct.price * COMMISSION_RATES[level]).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-black text-brand-text/60 uppercase tracking-widest">Qty</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-brand-card/20 border border-brand-border flex items-center justify-center font-black text-brand-text">-</button>
                    <span className="font-black text-brand-text w-6 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg bg-brand-card/20 border border-brand-border flex items-center justify-center font-black text-brand-text">+</button>
                  </div>
                  <span className="ml-auto text-2xl font-black text-brand-primary">₱{(selectedProduct.price * quantity).toLocaleString()}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { addToCart({ ...selectedProduct, qty: quantity }); setSelectedProduct(null); setQuantity(1); }}
                    className="flex-1 py-4 rounded-2xl border border-brand-primary text-brand-primary font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
                    Add to Cart
                  </button>
                  <button onClick={() => { addToCart({ ...selectedProduct, qty: quantity }); setSelectedProduct(null); setQuantity(1); setShowCart(true); }}
                    className="flex-1 py-4 rounded-2xl bg-brand-primary text-brand-black font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
                    Buy Now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-brand-black/90 backdrop-blur-md flex items-end">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="w-full bg-brand-navy rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-brand-text">🛒 Cart ({cartCount})</h3>
                <button onClick={() => setShowCart(false)}><X className="w-6 h-6 text-brand-text/40" /></button>
              </div>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-brand-text/20 mx-auto mb-4" />
                  <p className="text-brand-text/40 font-bold">Your cart is empty</p>
                </div>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 mb-4 p-3 rounded-2xl bg-brand-card/20 border border-brand-border">
                      <img src={item.image} alt={item.title} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-brand-text">{item.title}</p>
                        <p className="text-brand-primary font-black">₱{(item.price * item.qty).toLocaleString()}</p>
                        <p className="text-[10px] text-brand-text/40">Qty: {item.qty}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500"><X className="w-5 h-5" /></button>
                    </div>
                  ))}
                  <div className="mt-6 mb-4">
                    <p className="text-xs font-black uppercase tracking-widest text-brand-text/40 mb-3">Delivery Information</p>
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                        <input type="text" placeholder="Complete delivery address" value={address} onChange={e => setAddress(e.target.value)}
                          className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary/50 text-brand-text" />
                      </div>
                      <input type="text" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)}
                        className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-4 px-4 text-sm focus:outline-none focus:border-brand-primary/50 text-brand-text" />
                    </div>
                  </div>
                  <div className="mb-6">
                    <p className="text-xs font-black uppercase tracking-widest text-brand-text/40 mb-3">Payment Method</p>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => setPaymentMethod("wallet")}
                        className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${paymentMethod === "wallet" ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-card/20'}`}>
                        <Wallet className="w-5 h-5 text-brand-primary" />
                        <div className="text-left">
                          <p className="text-sm font-bold text-brand-text">Main Wallet</p>
                          <p className={`text-xs font-bold ${balance >= cartTotal ? 'text-brand-primary' : 'text-red-500'}`}>
                            Balance: ₱{balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </button>
                      <button onClick={() => setPaymentMethod("gcash")}
                        className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${paymentMethod === "gcash" ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-card/20'}`}>
                        <CreditCard className="w-5 h-5 text-blue-400" />
                        <div className="text-left">
                          <p className="text-sm font-bold text-brand-text">GCash / Maya</p>
                          <p className="text-xs text-brand-text/40">Pay via PayMongo</p>
                        </div>
                      </button>
                    </div>
                  </div>
                  <GlassCard className="!p-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-brand-text/60">Subtotal</span>
                      <span className="font-bold text-brand-text">₱{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-brand-text/60">Shipping</span>
                      <span className="font-bold text-brand-primary">FREE</span>
                    </div>
                    <div className="border-t border-brand-border my-3" />
                    <div className="flex justify-between">
                      <span className="font-black text-brand-text">Total</span>
                      <span className="text-xl font-black text-brand-primary">₱{cartTotal.toLocaleString()}</span>
                    </div>
                  </GlassCard>
                  <button onClick={handlePlaceOrder} disabled={isProcessing}
                    className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-70">
                    {isProcessing ? "Processing..." : `Place Order • ₱${cartTotal.toLocaleString()}`}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {orderSuccess && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] bg-brand-black flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-brand-primary/20 flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-brand-primary" />
            </div>
            <h2 className="text-3xl font-black text-brand-text mb-2">Order Placed!</h2>
            <p className="text-brand-text/60 mb-2">Your order is being processed.</p>
            <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest">MLM Commissions Distributed ✅</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
