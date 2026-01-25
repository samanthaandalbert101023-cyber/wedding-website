import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import "dotenv/config";


const app = express();
const PORT = process.env.PORT || 5000;

/* ===============================
   PATH FIX
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===============================
   FIREBASE ADMIN INITIALIZATION
================================ */
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  // PRODUCTION (Render)
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    ),
  });
  console.log("✅ Firebase Admin initialized (PRODUCTION)");
} else {
  // LOCAL
  const serviceAccountPath = path.join(__dirname, "firebase-admin.json");

  if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ firebase-admin.json missing");
    process.exit(1);
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin initialized (LOCAL)");
}

const db = admin.firestore();

/* ===============================
   CRYPTO SETUP
================================ */
const ALGORITHM = "aes-256-gcm";

if (!process.env.PAYLOAD_SECRET) {
  console.error("❌ PAYLOAD_SECRET missing");
  process.exit(1);
}
console.log("BACKEND KEY LEN:", process.env.PAYLOAD_SECRET?.length);

const SECRET_KEY = Buffer.from(process.env.PAYLOAD_SECRET, "hex");

/* ===============================
   CRYPTO HELPERS
================================ */
function encrypt(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: encrypted.toString("hex"),
  };
}

function decrypt(payload) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    SECRET_KEY,
    Buffer.from(payload.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(payload.tag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, "hex")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://wedding-website1.onrender.com",
      "https://albertandsamanthawedding.site",
      "https://www.albertandsamanthawedding.site",
      "https://rsvp-e-invite-738aa.web.app",
      "https://rsvp-e-invite-738aa.firebaseapp.com",
    ],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    credentials: true,
  })
);

/* ===============================
   HEALTH CHECK
================================ */
app.get("/api", (_, res) => {
  res.json({ message: "Server running!" });
});

/* ===============================
   GET GUEST LIST (ENCRYPTED)
================================ */
app.get("/api/guestlist", async (_, res) => {
  try {
    const snapshot = await db.collection("GuestList").get();

    const guests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      encrypted: true,
      payload: encrypt(guests),
    });
  } catch (err) {
    console.error("❌ Guestlist error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===============================
   UPDATE ATTENDANCE (DECRYPTED)
================================ */
app.patch("/api/guestlist/attending", async (req, res) => {
  try {
    const { encrypted, payload } = req.body;

    if (!encrypted || !payload) {
      return res.status(400).json({ error: "Encrypted payload required" });
    }

    const updates = decrypt(payload);

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const batch = db.batch();

    for (const { FullName, attending } of updates) {
      const snapshot = await db
        .collection("GuestList")
        .where("FullName", "==", FullName)
        .get();

      snapshot.forEach(doc => {
        batch.update(doc.ref, { attending: Boolean(attending) });
      });
    }

    await batch.commit();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Decryption / Update error:", err);
    res.status(400).json({ error: "Invalid encrypted payload" });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
