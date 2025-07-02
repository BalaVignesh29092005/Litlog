import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { loadImage } from "canvas";
import dotenv from "dotenv";
import session from "express-session";

const app = express();
const port = 3000;
dotenv.config();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
function limitChars(text, maxChars) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "...";
}

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

let notes = [];
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "notes",
  password: process.env.db_password,
  port: 5432,
});
db.connect();

app.get("/", async (req, res) => {
  try {
    res.render("index.ejs", { user: req.session.user || {} });
  } catch (err) {
    console.error("Image load error:", err);
    res.status(500).send("Error loading image.");
  }
});
app.get("/explore", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM booknotes ORDER BY id ASC");
    let notes = result.rows.map((note) => {
      const dateObj = new Date(note.dor);
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      const introWithNewlines = note.intro.replace(/\\n/g, " ");
      const limitedIntro = limitChars(introWithNewlines, 320);
      return {
        ...note,
        dor: formattedDate,
        intro: limitedIntro,
        note: note.note.replace(/\\n/g, "<br>"),
      };
    });
    res.render("explore.ejs", {
      explorenotes: notes,
      user: req.session.user || {},
    });
  } catch (err) {
    console.error("Image load error:", err);
    res.status(500).send("Error loading image.");
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
      intro: rawNote.intro.replace(/\\n/g, "<br>"),
      note: rawNote.note.replace(/\\n/g, "<br>"),
    };

    res.render("note.ejs", {
      notes: note,
      user: req.session.user || {},
    });
  } catch (err) {
    console.error("Error fetching book by ID:", err);
    res.status(500).send("Internal server error");
  }
});
app.get("/about", (req, res) => {
  res.render("about.ejs", { user: req.session.user || {} });
});
app.get("/signup1", (req, res) => {
  try {
    res.render("signup-step1.ejs");
  } catch (err) {
    console.error("Error fetching book by ID:", err);
    res.status(500).send("Internal server error");
  }
});
app.get("/login", (req, res) => {
  try {
    res.render("login.ejs");
  } catch (err) {
    console.error("Error fetching book by ID:", err);
    res.status(500).send("Internal server error");
  }
});
app.get("/signup2", (req, res) => {
  res.render("signup-step2.ejs");
});
app.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/");
});
app.get("/mylibrary", async (req, res) => {
  if (typeof req.session.user !== "undefined" && req.session.user !==null) {

    const result = await db.query(
      "SELECT * FROM booknotes WHERE username = $1 ORDER BY id ASC",
      [req.session.user.username || {}]
    );
    const mynote = result.rows || {};
    res.render("mylibrary.ejs", { mynotes: mynote ,user: req.session.user || {},});
  }
  else{
  res.render("mylibrary.ejs", { mynotes:  null,user: req.session.user || {},});
  }
});

app.post("/signup2", async (req, res) => {
  const signupData = req.session.signupData || {};
  const result = await db.query("select * from users where username=$1", [
    req.body.username,
  ]);
  if (req.body.password !== req.body.confirmPassword) {
    res.render("signup-step2.ejs", { error: "The Password do not match" });
  } else if (result.rows.length) {
    res.render("signup-step2.ejs", { error: "Username is already exists" });
  } else {
    signupData.username = req.body.username;
    signupData.password = req.body.password;
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

app.post("/signup1", (req, res) => {
  req.session.signupData = {
    name: req.body.name,
    age: req.body.age,
    dob: req.body.dob,
    sex: req.body.sex,
  };
  res.redirect("/signup2");
});

app.post("/login", async (req, res) => {
  try {
    const result = await db.query("select * from users where username=$1", [
      req.body.username,
    ]);
    if (result.rows.length === 0) {
      res.render("login.ejs", { error: "Username does not exists" });
    } else if (req.body.password !== result.rows[0].password) {
      res.render("login.ejs", { error: "Password is incorrect" });
    } else {
      req.session.user = result.rows[0];
      res.redirect("/");
    }
  } catch (err) {
    console.error("Error fetching book by ID:", err);
    res.status(500).send("Internal server error");
  }
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
