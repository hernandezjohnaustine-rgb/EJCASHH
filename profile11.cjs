const fs = require("fs");
let content = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8");

const helpState = `  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [helpMessages, setHelpMessages] = useState<{role: string, content: string}[]>([
    { role: "assistant", content: "Hi! I am the EJCASHH AI Assistant. How can I help you today? I can answer questions about packages, commissions, withdrawals, referrals, and more!" }
  ]);
  const [helpInput, setHelpInput] = useState("");
  const [helpLoading, setHelpLoading] = useState(false);

  const handleSendHelp = async () => {
    if (!helpInput.trim() || helpLoading) return;
    const userMsg = helpInput.trim();
    setHelpInput("");
    setHelpMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setHelpLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: "You are the EJCASHH AI Support Assistant. EJCASHH is a fintech MLM platform in the Philippines. Help users with: Package 1 (₱360 Subscription - L1 gets ₱100, L2-L10 gets ₱3 each), Package 2 (₱3,600 Livelihood Program - L1 gets ₱1,000, L2-L10 gets ₱30 each), Combined Package (₱3,960), referral system, commissions, Credits wallet (locked L2-L10 earnings), Main Balance (withdrawable), certificate milestones, trading bot, marketplace, withdrawals, and account settings. Be helpful, friendly and concise. If you cannot resolve an issue, tell the user to contact admin support.",
          messages: helpMessages.concat({ role: "user", content: userMsg }).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "Sorry, I could not process your request. Please try again.";
      setHelpMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setHelpMessages(prev => [...prev, { role: "assistant", content: "Sorry, I am having trouble connecting. Please try again later or contact admin support." }]);
    } finally {
      setHelpLoading(false); }
  };
`;

content = content.replace("  const menuItems = [", helpState + "  const menuItems = [");

content = content.replace(
    '{ icon: HelpCircle, label: "Help Center", sub: "FAQs & Live Chat" }',
    '{ icon: HelpCircle, label: "Help Center", sub: "AI Assistant & Support", onClick: () => setShowHelpCenter(true) }'
);

fs.writeFileSync("src/screens/ProfileScreen.tsx", content, "utf8");
console.log("Done!");
