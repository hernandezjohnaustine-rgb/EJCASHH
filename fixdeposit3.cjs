const fs = require("fs");
let content = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8");
content = content.replace(
    'import { Users, Wallet, CheckCircle2, XCircle, TrendingUp, ArrowLeft, RefreshCw, Shield, Ban, User, Hash, ChevronDown, ChevronUp, ShoppingBag, Package, Plus, Trash2, Edit3, X, Lock, Unlock } from "lucide-react";',
    'import { Users, Wallet, CheckCircle2, XCircle, TrendingUp, ArrowLeft, RefreshCw, Shield, Ban, User, Hash, ChevronDown, ChevronUp, ShoppingBag, Package, Plus, Trash2, Edit3, X, Lock, Unlock, ZoomIn } from "lucide-react";'
);
fs.writeFileSync("src/screens/AdminScreen.tsx", content, "utf8");
console.log("Done!");
