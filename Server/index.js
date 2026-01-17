import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

/* ===============================
   FIREBASE ADMIN INITIALIZATION
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      "https://rsvp-e-invite-738aa.web.app",
      "https://rsvp-e-invite-738aa.firebaseapp.com",
    ],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

/* ===============================
   TEST ROUTE
================================ */
app.get("/api", (_, res) => {
  res.json({ message: "Server running!" });
});

/* ===============================
   GET GUEST LIST
================================ */
app.get("/api/guestlist", async (_, res) => {
  try {
    const snapshot = await db.collection("GuestList").get();
    const guests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(guests);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===============================
   ✅ UPDATE ATTENDANCE (FIX)
================================ */
// UPDATE attending status (FULLNAME BASED)
app.patch("/api/guestlist/attending", async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
