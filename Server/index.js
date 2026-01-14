import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
const PORT = process.env.PORT || 5000;

/* ===============================
   FIREBASE ADMIN INITIALIZATION
================================ */

// FOR PRODUCTION (Render / Cloud)
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    ),
  });
} else {
  // FOR LOCAL DEVELOPMENT
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

/* ===============================
   MIDDLEWARE
================================ */

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite local
      "http://localhost:3000", // CRA local
      "https://rsvp-e-invite-738aa.web.app",
      "https://rsvp-e-invite-738aa.firebaseapp.com",
      // add custom domain later
    ],
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })
);

/* ===============================
   TEST ROUTE
================================ */
app.get("/api", (_, res) => {
  res.json({ message: "Server running!" });
});

/* ===============================
   RSVP ROUTES
================================ */

app.post("/api/rsvps", async (req, res) => {
  const { name, email, attending, message } = req.body;

  if (!name || !email) {
    return res
      .status(400)
      .json({ success: false, error: "Name and email required" });
  }

  try {
    const docRef = await db.collection("rsvps").add({
      name,
      email,
      attending,
      message: message || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ success: true, id: docRef.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/rsvps", async (_, res) => {
  try {
    const snapshot = await db.collection("rsvps").get();
    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===============================
   GUESTLIST ROUTES
================================ */

// GET all guests
app.get("/api/guestlist", async (_, res) => {
  try {
    const snapshot = await db.collection("GuestList").get();
    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET guests by family ID
app.get("/api/guestlist/family/:id", async (req, res) => {
  try {
    const snapshot = await db
      .collection("GuestList")
      .where("id", "==", req.params.id)
      .get();

    if (snapshot.empty) {
      return res
        .status(404)
        .json({ success: false, error: "No guests found" });
    }

    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SEARCH guests
app.get("/api/guestlist/search", async (req, res) => {
  const { familyId, name } = req.query;

  try {
    let query = db.collection("GuestList");
    if (familyId) query = query.where("id", "==", familyId);

    const snapshot = await query.get();
    if (snapshot.empty) {
      return res
        .status(404)
        .json({ success: false, error: "No guests found" });
    }

    let guests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (name) {
      const lowerName = name.toLowerCase();
      guests = guests.filter((g) =>
        g.FullName_lowercase
          ? g.FullName_lowercase.includes(lowerName)
          : g.FullName.toLowerCase().includes(lowerName)
      );
    }

    if (guests.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "No guests found" });
    }

    res.json(guests);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADD guest
app.post("/api/guestlist", async (req, res) => {
  const { FamilyIDs, FullName, Attend } = req.body;

  if (!FamilyIDs || !FullName) {
    return res
      .status(400)
      .json({ success: false, error: "FamilyIDs and FullName required" });
  }

  try {
    const existing = await db
      .collection("GuestList")
      .where("FullName_lowercase", "==", FullName.toLowerCase())
      .get();

    if (!existing.empty) {
      return res
        .status(400)
        .json({ success: false, error: "FullName already exists" });
    }

    const docRef = await db.collection("GuestList").add({
      FamilyIDs,
      FullName,
      FullName_lowercase: FullName.toLowerCase(),
      Attend: Attend || false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ id: docRef.id, FamilyIDs, FullName });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE guest
app.delete("/api/guestlist/:id", async (req, res) => {
  try {
    const docRef = db.collection("GuestList").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, error: "Guest not found" });
    }

    await docRef.delete();
    res.json({ success: true, message: "Guest deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE attending
app.patch("/api/guestlist/attend", async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates)) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid payload" });
  }

  try {
    const batch = db.batch();

    for (const { FullName, attending } of updates) {
      if (!FullName || attending === undefined) continue;

      const snapshot = await db
        .collection("GuestList")
        .where("FullName", "==", FullName)
        .get();

      snapshot.forEach((doc) => {
        batch.update(doc.ref, { attending });
      });
    }

    await batch.commit();
    res.json({ success: true, message: "Attending updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===============================
   START SERVER
================================ */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
