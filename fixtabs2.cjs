const fs = require("fs");
const lines = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8").split("\n");

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('className="flex gap-1.5"')) {
        lines[i] = '        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">';
        console.log("Fixed tabs container at line", i + 1);
    }
    if (lines[i].includes("flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1")) {
        lines[i] = lines[i].replace("flex-1 py-2", "shrink-0 px-3 py-2");
        console.log("Fixed tab button at line", i + 1);
    }
}

fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
