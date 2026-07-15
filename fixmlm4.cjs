const fs = require("fs");
const lines = fs.readFileSync("src/screens/ReferralDashboard.tsx", "utf8").split("\n");

// Add activePackageTab state
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const [isQrModalOpen, setIsQrModalOpen]")) {
        lines.splice(i, 0, '  const [activePackageTab, setActivePackageTab] = useState<"p1" | "p2">("p1");');
        console.log("Added state at line", i+1);
        break;
    }
}

// Update the MLM Reward Structure header to include tabs
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("MLM Reward Structure")) {
        // Find the section header and add tabs after it
        lines.splice(i + 2, 0,
            '         <div className="flex gap-2 mb-3">',
            '           <button onClick={() => setActivePackageTab("p1")} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePackageTab === "p1" ? "bg-brand-primary text-brand-black" : "bg-brand-card/20 border border-brand-border text-brand-text/60"}`}>Package 1</button>',
            '           <button onClick={() => setActivePackageTab("p2")} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePackageTab === "p2" ? "bg-yellow-400 text-brand-black" : "bg-brand-card/20 border border-brand-border text-brand-text/60"}`}>Package 2</button>',
            '         </div>'
        );
        console.log("Added tabs at line", i+1);
        break;
    }
}

// Update MLM_LEVELS.map to use activePackageTab
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("{MLM_LEVELS.map((lvl) => (")) {
        lines[i] = '            {(activePackageTab === "p1" ? MLM_LEVELS : MLM_LEVELS_P2).map((lvl) => (';
        console.log("Updated map at line", i+1);
        break;
    }
}

// Update subtitle to show correct package
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("From ₱360 • Package 1")) {
        lines[i] = '                       <p className="text-[9px] text-brand-text/20 uppercase tracking-widest">{activePackageTab === "p1" ? "From ₱360 • Package 1" : "From ₱3,600 • Package 2"}</p>';
        console.log("Updated subtitle at line", i+1);
        break;
    }
}

fs.writeFileSync("src/screens/ReferralDashboard.tsx", lines.join("\n"), "utf8");
console.log("Done!");
