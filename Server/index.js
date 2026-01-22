import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

/* ===============================
   CRYPTO CONFIG
================================ */
const SECRET = process.env.PAYLOAD_SECRET || "fallback-secret";

const encryptPayload = (data) =>
  CryptoJS.AES.encrypt(JSON.stringify(data), SECRET).toString();

const decryptPayload = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) throw new Error("Invalid encrypted payload");
  return JSON.parse(decrypted);
};

/* ===============================
   FIREBASE ADMIN INITIALIZATION
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    ),
  });
  console.log("✅ Firebase Admin initialized (PRODUCTION)");
} else {
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
   MIDDLEWARE
================================ */
app.use(express.json({ limit: "1mb" }));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "http://wedding-website1.onrender.com",
      "https://albertandsamanthawedding.site",
      "https://www.albertandsamanthawedding.site",
      "https://rsvp-e-invite-738aa.web.app",
      "https://rsvp-e-invite-738aa.firebaseapp.com",
    ],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true,
  })
);

/* ===============================
   TEST ROUTE
================================ */
app.get("/api", (_, res) => {
  res.json({
    payload: encryptPayload({ message: "Server running!" }),
  });
});

/* ===============================
   🔐 GET GUEST LIST (ENCRYPTED RESPONSE)
================================ */
app.get("/api/guestlist", async (_, res) => {
  try {
    const snapshot = await db.collection("GuestList").get();
    const guests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const guest = encryptPayload(guests)
    
    res.json({
      payload: guest,
    });
  } catch (err) {
    res.status(500).json({
      payload: encryptPayload({ error: "Internal server error" }),
    });
  }
});

/* ===============================
   🔐 UPDATE ATTENDANCE (ENCRYPTED REQUEST & RESPONSE)
================================ */
app.patch("/api/guestlist/attending", async (req, res) => {
  let updates;

  try {
    updates = decryptPayload(req.body.payload).updates;
  } catch {
    return res.status(400).json({
      payload: encryptPayload({ error: "Invalid encrypted payload" }),
    });
  }

  if (!Array.isArray(updates)) {
    return res.status(400).json({
      payload: encryptPayload({ error: "Invalid updates array" }),
    });
  }

  try {
    const batch = db.batch();

    for (const { FullName, attending } of updates) {
      const snapshot = await db
        .collection("GuestList")
        .where("FullName", "==", FullName)
        .get();

      snapshot.forEach((doc) => {
        batch.update(doc.ref, { attending: Boolean(attending) });
      });
    }

    await batch.commit();

    res.json({
      payload: encryptPayload({ success: true }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      payload: encryptPayload({ error: "Update failed" }),
    });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
