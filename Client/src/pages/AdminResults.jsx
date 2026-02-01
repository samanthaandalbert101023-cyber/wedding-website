import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./AdminResults.css";
import jsPDF from "jspdf";

const BASE_URL =
  import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://wedding-website1.onrender.com";

const ADMIN_KEY = import.meta.env.VITE_ADMIN_DASHBOARD_KEY;

const AdminResults = () => {
  const [searchParams] = useSearchParams();
  const urlKey = searchParams.get("key"); // 🔐 key from URL

  const [data, setData] = useState(null);
  const [pdfBtnName, setPdfBtnName] = useState("Total Guest");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // filters
  const [filter, setFilter] = useState("all"); // all | yes | no
  const [search, setSearch] = useState("");

  /* ======================
     🔐 URL KEY VALIDATION
  ====================== */
  if (!urlKey || urlKey !== ADMIN_KEY) {
    return (
      <div className="admin-error" style={{ marginTop: "80px" }}>
        🚫 Unauthorized Access
      </div>
    );
  }

  /* ======================
     FETCH DATA
  ====================== */
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/admin/guest-summary?key=${urlKey}`
        );

        if (!res.ok) throw new Error("Unauthorized");

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError("Failed to load admin results");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [urlKey]);

  if (loading) return <p className="admin-loading">Loading RSVP results…</p>;
  if (error) return <p className="admin-error">{error}</p>;

  /* ======================
     FILTER + SEARCH
  ====================== */
  const getTimestampCanada = () => {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);

  const get = type => parts.find(p => p.type === type)?.value;

  const month = get("month").toUpperCase();
  const day = get("day");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  return `${month}-${day}-${year}T${hour}-${minute}-${second}`;
};

  const filteredGuests = data.guests.filter(g => {
    if (filter === "yes" && !g.attending) return false;
    if (filter === "no" && g.attending) return false;

    if (search.trim()) {
      const name = (g.FullName || "").toLowerCase();
      return name.includes(search.toLowerCase());
    }

    return true;
  });

  const exportToPDF = () => {
  if (!filteredGuests.length) return;
  const doc = new jsPDF();
  const title =
    filter === "yes"
      ? "ATTENDING GUESTS"
      : filter === "no"
      ? "NOT ATTENDING GUESTS"
      : "ALL GUESTS";

  const timeStamp = getTimestampCanada();

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  doc.setFontSize(12);

  // Prepare sorted names
  const names = filteredGuests
    .map(g => (g.FullName || "").toUpperCase())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  let y = 30;

  names.forEach((name, index) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }

    doc.text(`${index + 1}. ${name}`, 14, y);
    y += 8;
  });

  doc.save(`${title.replace(/\s+/g, "_")}_${timeStamp}.pdf`);
};


  return (
    <div className="admin-container">
      <h1>📊 RSVP Results</h1>

      {/* STATS */}
      <div className="stats">
        <div
          className={`stat-card ${filter === "all" ? "active" : ""}`}
          onClick={() => {
            setFilter("all")
            setPdfBtnName("TOTAL GUESTS")
        }}
        >
          <h3>Total Guests</h3>
          <p>{data.totalGuests}</p>
        </div>

        <div
          className={`stat-card yes ${filter === "yes" ? "active" : ""}`}
          onClick={() => {
            setFilter("yes")
            setPdfBtnName("ATTENDING")
        }}
        >
          <h3>Attending</h3>
          <p>{data.attendingYes}</p>
        </div>

        <div
          className={`stat-card no ${filter === "no" ? "active" : ""}`}
          onClick={() => {
            setFilter("no")
            setPdfBtnName("NOT ATTENDING")
        }}
        >
          <h3>Not Attending</h3>
          <p>{data.attendingNo}</p>
        </div>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        className="search-input"
        placeholder="Search guest name…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
        <button className="export-btn" onClick={exportToPDF}>
           📄  Export {pdfBtnName} PDF
        </button>


      {/* TABLE */}
      <table className="guest-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
        {filteredGuests.map((g, i) => (
            <tr key={i}>
            <td data-label="Name">{g.FullName || "—"}</td>
            <td data-label="Status" className="status-text">
                {g.attending ? "Attending" : "Not Attending"}
            </td>
            </tr>
        ))}
        </tbody>
      </table>

      {filteredGuests.length === 0 && (
        <p className="empty">No matching guests found.</p>
      )}
    </div>
  );
};

export default AdminResults;
