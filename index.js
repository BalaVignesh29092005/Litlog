import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import session from "express-session";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

function limitChars(text, maxChars) {
  return text.length <= maxChars ? text : text.slice(0, maxChars) + "...";
}

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

app.get("/", async (req, res) => {
  try {
    res.render("index.ejs", { user: req.session.user || {} });
  } catch (err) {
    res.status(500).send("Error loading page.");
  }
});

app.get("/explore", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM booknotes WHERE access_type = 'public' ORDER BY id ASC"
    );

    const notes = result.rows.map((note) => {
      const dateObj = new Date(note.dor);
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      const introText = (note.intro || "").replace(/\\n/g, " ");
      const limitedIntro = limitChars(introText, 320);
      const formattedNote = (note.note || "").replace(/\\n/g, "<br>");
      return {
        ...note,
        dor: formattedDate,
        intro: limitedIntro,
        note: formattedNote,
      };
    });

    res.render("explore.ejs", {
      explorenotes: notes,
      user: req.session.user || {},
    });
  } catch (err) {
    res.status(500).send("Error loading notes.");
  }
});

app.get("/book/:id", async (req, res) => {
  try {
    const bookId = req.params.id;
    const result = await db.query("SELECT * FROM booknotes WHERE id = $1", [
      bookId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).send("Book not found");
    }

    const rawNote = result.rows[0];
    const dateObj = new Date(rawNote.dor);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    const note = {
      ...rawNote,
      dor: formattedDate,
      intro: (rawNote.intro || "").replace(/\\n/g, "<br>"),
      note: (rawNote.note || "").replace(/\\n/g, "<br>"),
    };

    res.render("note.ejs", {
      notes: note,
      user: req.session.user || {},
    });
  } catch (err) {
    res.status(500).send("Internal server error");
  }
});

app.get("/about", (req, res) => {
  res.render("about.ejs", { user: req.session.user || {} });
});

app.get("/signup1", (req, res) => {
  res.render("signup-step1.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/signup2", (req, res) => {
  res.render("signup-step2.ejs");
});

app.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/");
});

app.get("/mylibrary", async (req, res) => {
  if (req.session.user) {
    const result = await db.query(
      "SELECT * FROM booknotes WHERE username = $1 ORDER BY id ASC",
      [req.session.user.username]
    );
    const notes = result.rows.map((note) => {
      const dateObj = new Date(note.dor);
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      const introText = (note.intro || "").replace(/\\n/g, " ");
      const limitedIntro = limitChars(introText, 320);
      const formattedNote = (note.note || "").replace(/\\n/g, "<br>");
      return {
        ...note,
        dor: formattedDate,
        intro: limitedIntro,
        note: formattedNote,
      };
    });
    res.render("mylibrary.ejs", { mynotes: notes, user: req.session.user });
  } else {
    res.render("mylibrary.ejs", { mynotes: null, user: req.session.user || {} });
  }
});

app.get("/create", (req, res) => {
  res.render("create.ejs", { user: req.session.user || {} });
});

app.get("/edit/:id", async (req, res) => {
  const bookId = req.params.id;
  const result = await db.query("SELECT * FROM booknotes WHERE id = $1", [bookId]);
  if (result.rows.length === 0) return res.status(404).send("Book not found");

  const rawNote = result.rows[0];
  const dateObj = new Date(rawNote.dor);
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  const formattedDate = `${year}-${month}-${day}`;

  const note = {
    ...rawNote,
    dor: formattedDate,
    intro: (rawNote.intro || "").replace(/\\n/g, "<br>"),
    note: (rawNote.note || "").replace(/\\n/g, "<br>"),
  };

  res.render("create.ejs", { user: req.session.user || {}, note });
});

app.get("/myprofile", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM booknotes WHERE username = $1 ORDER BY id ASC",
    [req.session.user.username]
  );
  const mynotes = result.rows;
  res.render("myprofile.ejs", {
    notes: mynotes || {},
    user: req.session.user || {},
  });
});

app.post("/signup1", (req, res) => {
  req.session.signupData = {
    name: req.body.name,
    age: req.body.age,
    dob: req.body.dob,
    sex: req.body.sex,
  };
  res.redirect("/signup2");
});

app.post("/signup2", async (req, res) => {
  const signupData = req.session.signupData || {};
  const result = await db.query("SELECT * FROM users WHERE username=$1", [
    req.body.username,
  ]);
  if (req.body.password !== req.body.confirmPassword) {
    res.render("signup-step2.ejs", { error: "The Password do not match" });
  } else if (result.rows.length) {
    res.render("signup-step2.ejs", { error: "Username already exists" });
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    signupData.username = req.body.username;
    signupData.password = hashedPassword;
    await db.query(
      "INSERT INTO users (name, age, sex, dob, username, password) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        signupData.name,
        signupData.age,
        signupData.sex,
        signupData.dob,
        signupData.username,
        signupData.password,
      ]
    );
    req.session.signupData = null;
    res.redirect("/login");
  }
});

app.post("/login", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE username=$1", [
      req.body.username,
    ]);
    if (result.rows.length === 0) {
      res.render("login.ejs", { error: "Username does not exist" });
    } else {
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        result.rows[0].password
      );
      if (!passwordMatch) {
        res.render("login.ejs", { error: "Password is incorrect" });
      } else {
        req.session.user = result.rows[0];
        res.redirect("/");
      }
    }
  } catch (err) {
    res.status(500).send("Internal server error");
  }
});

app.post("/create", async (req, res) => {
  const { isbn, title, author, rating, dor, intro, note, booklink, access_type } = req.body;
  const username = req.session.user.username;
  try {
    await db.query(
      `INSERT INTO booknotes (isbn, title, author, rating, dor, intro, note, booklink, access_type, username)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [isbn, title, author, rating, dor, intro, note, booklink, access_type, username]
    );
    res.redirect("/mylibrary");
  } catch (err) {
    res.status(500).send("Database error");
  }
});

app.post("/edit/:id", async (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  const { isbn, title, author, rating, dor, intro, note, booklink, access_type } = req.body;
  try {
    await db.query(
      `UPDATE booknotes SET isbn=$1, title=$2, author=$3, rating=$4, dor=$5,
       intro=$6, note=$7, booklink=$8, access_type=$9 WHERE id=$10`,
      [isbn, title, author, rating, dor, intro, note, booklink, access_type, noteId]
    );
    res.redirect("/mylibrary");
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
});

app.post("/delete/:id", async (req, res) => {
  const id = req.params.id;
  await db.query("DELETE FROM booknotes WHERE id=$1", [id]);
  res.redirect("/mylibrary");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
