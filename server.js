const express = require("express");
const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

app.get("/", (req, res) => res.json({ status: "ok", message: "Outreach backend running" }));

app.post("/send", async (req, res) => {
  try {
    const { to, subject, body, fromEmail, fromName } = req.body;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) return res.status(500).json({ error: "RESEND_API_KEY not set in Railway Variables" });
    if (!to || !subject || !body || !fromEmail) return res.status(400).json({ error: "Missing required fields" });

    const from = fromName ? fromName + " <" + fromEmail + ">" : fromEmail;
    const html = body.split("\n").map(l => l.trim()
      ? "<p style='margin:0 0 14px;font-family:sans-serif;font-size:15px;line-height:1.6;color:#222'>" + l + "</p>"
      : "<br>").join("");

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text: body })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message || data.name || "Resend error" });
    return res.json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Backend running on port " + PORT));
