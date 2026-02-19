const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => res.send("Outreach backend running ✓"));

// Send email via Resend
app.post("/send", async (req, res) => {
  const { to, subject, body, fromEmail, fromName } = req.body;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "RESEND_API_KEY not set in environment variables" });
  if (!to || !subject || !body) return res.status(400).json({ error: "Missing to, subject, or body" });
  if (!fromEmail) return res.status(400).json({ error: "Missing fromEmail" });

  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  // Convert plain text to HTML
  const html = body
    .split("\n")
    .map(line => line ? `<p style="margin:0 0 14px;font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">${line}</p>` : "<br>")
    .join("");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, text: body }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || data.name || "Resend error" });
    }

    res.json({ success: true, id: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
