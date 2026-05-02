import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // PayMongo Proxy Routes
  const PAYMONGO_BASE_URL = "https://api.paymongo.com/v1";
  
  // Use PAYMONGO_SECRET_KEY (server-side)
  const getPaymongoHeaders = () => {
    const key = process.env.PAYMONGO_SECRET_KEY || process.env.VITE_PAYMONGO_SECRET_KEY;
    if (!key) {
      console.error("PAYMONGO_SECRET_KEY is missing");
    }
    return {
      "Content-Type": "application/json",
      "Authorization": "Basic " + Buffer.from(key + ":").toString("base64"),
    };
  };

  app.post("/api/paymongo/links", async (req, res) => {
    try {
      const response = await fetch(`${PAYMONGO_BASE_URL}/links`, {
        method: "POST",
        headers: getPaymongoHeaders(),
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ errors: [{ detail: error.message }] });
    }
  });

  app.get("/api/paymongo/links/:id", async (req, res) => {
    try {
      const response = await fetch(`${PAYMONGO_BASE_URL}/links/${req.params.id}`, {
        headers: getPaymongoHeaders(),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ errors: [{ detail: error.message }] });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
