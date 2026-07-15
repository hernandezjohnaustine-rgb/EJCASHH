const fs = require('fs');
const content = fs.readFileSync('src/screens/AdminScreen.tsx', 'utf8');
const fixed = content.replace(
  'className={px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 }',
  'className={tradingEnabled ? "bg-brand-primary text-brand-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest" : "bg-brand-card/20 border border-brand-border text-brand-text/60 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"}'
);
fs.writeFileSync('src/screens/AdminScreen.tsx', fixed, 'utf8');
console.log('Done!');
