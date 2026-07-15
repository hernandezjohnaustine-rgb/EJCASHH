const fs = require("fs");
const lines = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8").split("\n");

// Add deposits state after orders state
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const [orders, setOrders] = useState<any[]>([]);")) {
        lines.splice(i + 1, 0, "  const [deposits, setDeposits] = useState<any[]>([]);");
        console.log("Added deposits state at line", i + 2);
        break;
    }
}

// Add deposits fetch in fetchData
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("setStats(prev => ({ ...prev, totalUsers:")) {
        lines.splice(i + 1, 0, 
            "      try { const depSnap = await getDocs(collection(db, \"depositRequests\")); setDeposits(depSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))); } catch(e) { console.error(e); }"
        );
        console.log("Added deposits fetch at line", i + 2);
        break;
    }
}

fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
