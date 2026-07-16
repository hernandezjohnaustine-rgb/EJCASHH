with open("src/screens/AdminScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add transaction states after existing states
content = content.replace(
    "  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);",
    """  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all");
  const [txStatusFilter, setTxStatusFilter] = useState("all");"""
)

# Add user lookup cache for transactions
content = content.replace(
    "  const [savingGcash, setSavingGcash] = useState(false);",
    """  const [savingGcash, setSavingGcash] = useState(false);
  const [userCache, setUserCache] = useState<Record<string, any>>({});"""
)

with open("src/screens/AdminScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Step 1 done!")
