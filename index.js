import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { loadImage } from "canvas";
import dotenv from 'dotenv';
import session from 'express-session';




const app = express();
const port = 3000;
dotenv.config();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
function limitChars(text, maxChars) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "...";
}

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));


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
    res.render("index.ejs");
  } catch (err) {
    console.error("Image load error:", err);
    res.status(500).send("Error loading image.");
  }
});
app.get("/explore", async (req, res) => {
  try {
    const img = await loadImage(
      "https://covers.openlibrary.org/b/isbn/0806541229-M.jpg"
    );
    const w = img.width;
    const h = img.height;
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
    res.render("explore.ejs", { explorenotes: notes });
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
    });
  } catch (err) {
    console.error("Error fetching book by ID:", err);
    res.status(500).send("Internal server error");
  }
});
app.get("/about", (req, res) => {
  res.render("about.ejs");
});
app.get('/signup1',(req,res)=>{
  try{
    res.render('signup-step1.ejs');
  }
  catch(err){
    console.error("Error fetching book by ID:", err);
    res.status(500).send("Internal server error");
  }
});
app.get('/login',(req,res)=>{
  try{
    res.render('login.ejs');
  }
  catch(err){
    console.error("Error fetching book by ID:", err);
    res.status(500).send("Internal server error");
  }
});
app.get('/signup2', (req, res) => {
  res.render('signup-step2.ejs');
});
app.post('/signup2', (req, res) => {
  const signupData = req.session.signupData || {};
  if(req.body.password===req.body.confirmPassword){
  signupData.username = req.body.username;
  signupData.password = req.body.password;
  signupData.confirmPassword = req.body.confirmPassword;
  req.session.signupData = null;
  res.send("Signup complete! Data: " + JSON.stringify(signupData));
  }
  else{
  res.redirect('/signup2');
  }
});

app.post('/signup1',(req,res)=>{
  req.session.signupData={
    name: req.body.name,
    age: req.body.age,
    dob: req.body.dob,
    sex: req.body.sex,
  };
  res.redirect('/signup2');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
