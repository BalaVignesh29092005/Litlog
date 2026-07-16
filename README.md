# Litlog

Litlog is a lightweight, local blog platform built with Node.js, Express, and EJS templating. It provides a clean space to create, browse, and manage blog posts, with all data held in memory for the duration of a single session — no database setup required.

> **Note:** Litlog is a session-based application. All content is stored in memory and will be lost when the server restarts.

---

## Features

| Route | Description |
|---|---|
| `/` (Home) | View featured blog previews |
| `/create` | Submit new blog posts |
| `/myblog` | View, edit, or delete your personal blogs |
| `/explore` | Discover blogs at random or filtered by category |
| `/view` | Read the full content of a selected blog |
| `/about` | Learn more about the platform |

Additional capabilities:
- **Category filtering** — Browse blogs by topic, including Business, Technology, Sports, and more

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Templating:** EJS
- **Styling:** Custom CSS (`/public`)
- **Utilities:** `body-parser`, `path`, `he` (for HTML entity decoding)

---

## Getting Started

**1. Clone the repository**
```bash
git clone https://github.com/BalaVignesh29092005/Litlog.git
cd Litlog
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the server**
```bash
node app.js
```

**4. Open in your browser**
```
http://localhost:3000
```

---

## Demo Content

Litlog ships with sample blog posts across a range of categories to help you explore the platform right away:

- ⚽ Sports
- 🌱 Environment
- 🧠 Psychology
- 🤖 Technology
- 🏢 Business
- 🎓 Education
- 🪄 Minimalism

---

## Limitations

- **No persistent storage** — all data is held in memory
- **No authentication** — all visitors share the same blog list within a session
- **Session-scoped only** — content resets whenever the server restarts

---

## License

MIT License © 2025 Bala Vignesh
