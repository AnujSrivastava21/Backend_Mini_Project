const express = require("express");
const port = 3000;
const app = express();
const userModel = require("./models/user");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");

// Set up view engine
app.set("view engine", "ejs");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/profile", isLoggedIn, (req, res) => {
  res.render('login');
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/register", async (req, res) => {
  try {
    const { username, password, name, age, email } = req.body;
    let user = await userModel.findOne({ email });
    if (user) {
      return res.status(400).send("User Already Exists");
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    user = await userModel.create({
      username,
      age,
      email,
      name,
      password: hash
    });
    const token = jwt.sign({ user }, 'protect');
    res.cookie('token', token);
    res.status(200).send('Registered Successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/login", async (req, res) => {
  try {
    const { password, email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send("User not Found");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send("Invalid Password");
    }
    const token = jwt.sign({ user }, 'protect');
    res.cookie('token', token);
    res.status(200).send('Logged In Successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

function isLoggedIn(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send("You must be logged in");
    }
    const decoded = jwt.verify(token, 'protect');
    req.user = decoded.user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).send("Invalid Token");
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
