const fs = require("fs");
const lines = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8").split("\n");

// Add confirmAction state
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const [processingDeposit, setProcessingDeposit]")) {
        lines.splice(i + 1, 0, "  const [confirmAction, setConfirmAction] = useState<{type: string, deposit: any} | null>(null);");
        break;
    }
}

// Fix handleApproveDeposit - remove confirm() dialog
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const handleApproveDeposit = async (d: any) => {")) {
        lines[i+1] = '    setProcessingDeposit(true);';
        break;
    }
}

// Fix handleRejectDeposit - remove confirm() dialog  
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const handleRejectDeposit = async (d: any) => {")) {
        lines[i+1] = '    setProcessingDeposit(true);';
        break;
    }
}

fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
