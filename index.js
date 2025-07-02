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
    const result = await db.query(
  "SELECT * FROM booknotes WHERE access_type = 'public' ORDER BY id ASC"
);

    let notes = result.rows.map((note) => {
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
      intro: (rawNote.intro || "").replace(/\\n/g, "<br>"),
      note: (rawNote.note|| "").replace(/\\n/g, "<br>"),
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
  if (typeof req.session.user !== "undefined" && req.session.user !== null) {
    const result = await db.query(
      "SELECT * FROM booknotes WHERE username = $1 ORDER BY id ASC",
      [req.session.user.username || {}]
    );
    let notes = result.rows.map((note) => {
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

    res.render("mylibrary.ejs", {
      mynotes: notes,
      user: req.session.user || {},
    });
  } else {
    res.render("mylibrary.ejs", {
      mynotes: null,
      user: req.session.user || {},
    });
  }
});
app.get("/create", (req, res) => {
  res.render("create.ejs", { user: req.session.user || {} });
});
app.get('/edit/:id', async (req, res) => {
  const bookId = req.params.id;
  const result = await db.query("SELECT * FROM booknotes WHERE id = $1", [bookId]);

  if (result.rows.length === 0) {
    return res.status(404).send("Book not found");
  }

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

app.get('/myprofile',async (req,res)=>{
  const result = await db.query(
      "SELECT * FROM booknotes WHERE username = $1 ORDER BY id ASC",
      [req.session.user.username || {}]
    );
  const mynotes=result.rows;
  res.render('myprofile.ejs',{notes:mynotes||{},
      user: req.session.user || {},})
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
app.post("/create", async (req, res) => {
  const isbn = req.body.isbn;
  const title = req.body.title;
  const author = req.body.author;
  const rating = req.body.rating;
  const dor = req.body.dor;
  const summary = req.body.intro;
  const note = req.body.note;
  const link = req.body.booklink;
  const access = req.body.access_type; 
  const username = req.session.user.username;
  try{
  await db.query(`
  INSERT INTO booknotes (isbn, title, author, rating, dor, intro, note, booklink, access_type, username)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
`, [
    isbn,
    title,
    author,
    rating,
    dor,
    summary,
    note,
    link,
    access,
    username,
  ]);
    res.redirect("/mylibrary");
  }
  catch(err){
      console.error("Error inserting note:", err);
      res.status(500).send("Database error");
  }

});

app.post('/edit/:id', async (req, res) => {
  try {
    const noteId = parseInt(req.params.id, 10);

    const {
      isbn,
      title,
      author,
      rating,
      dor,
      intro,
      note,
      booklink,
      access_type,
    } = req.body;

    const updateQuery = `
      UPDATE booknotes
      SET isbn = $1,
          title = $2,
          author = $3,
          rating = $4,
          dor = $5,
          intro = $6,
          note = $7,
          booklink = $8,
          access_type = $9
      WHERE id = $10
    `;

    const values = [
      isbn,
      title,
      author,
      rating,
      dor,
      intro,
      note,
      booklink,
      access_type,
      noteId,
    ];

    await db.query(updateQuery, values);
    res.redirect('/mylibrary');
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/delete/:id',async(req,res)=>{
  const id=req.params.id;
  await db.query("delete from booknotes where id=$1",[id]);
  res.redirect('/mylibrary');
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
