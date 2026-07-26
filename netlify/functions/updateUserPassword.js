const admin = require("firebase-admin");

// Initialize once per cold start using a service account stored as a
// Netlify environment variable (base64-encoded JSON), NOT committed to
// GitHub. This service account only needs "Firebase Authentication Admin"
// + "Cloud Datastore User" roles — nothing more.
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.ADMIN_PASSWORD_SERVICE_KEY_B64, "base64").toString("utf-8")
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { targetUserId, newPassword } = JSON.parse(event.body || "{}");
    const authHeader = event.headers.authorization || event.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Missing admin credentials" }) };
    }
    if (!targetUserId || !newPassword || newPassword.length < 6) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "targetUserId and a password (6+ chars) are required" }) };
    }

    // Verify the caller is genuinely signed in AND is an admin — this is
    // the entire security boundary of this function. Without this check,
    // anyone who found this URL could change any user's password.
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const callerDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();
    if (!callerDoc.exists || callerDoc.data().isAdmin !== true) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: "Only admins can change other users' passwords" }) };
    }

    await admin.auth().updateUser(targetUserId, { password: newPassword });

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Password update error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || "Failed to update password" }) };
  }
};
