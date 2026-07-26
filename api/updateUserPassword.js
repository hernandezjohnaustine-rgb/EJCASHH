const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.ADMIN_PASSWORD_SERVICE_KEY_B64, "base64").toString("utf-8")
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { targetUserId, newPassword } = req.body || {};
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing admin credentials" });
    }
    if (!targetUserId || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "targetUserId and a password (6+ chars) are required" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const callerDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();
    if (!callerDoc.exists || callerDoc.data().isAdmin !== true) {
      return res.status(403).json({ error: "Only admins can change other users' passwords" });
    }

    await admin.auth().updateUser(targetUserId, { password: newPassword });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Password update error:", err);
    return res.status(500).json({ error: err.message || "Failed to update password" });
  }
};
