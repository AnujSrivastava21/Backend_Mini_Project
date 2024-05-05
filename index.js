const express = require("express");
const port = 3000;
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");

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

app.get("/profile", isLoggedIn, async(req, res) => {
  let user = await userModel.findOne({email:req.user.email}).populate('post')
  
  res.render('profile' , {user});
});

app.post("/post", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.user.email });
    let { postContent } = req.body; // Assuming the textarea name is postContent
    let post = await postModel.create({
      user: user._id,
      content: postContent // Use the content from the request body
    });
    user.post.push(post._id); // Assuming the user schema has a posts field
    await user.save();
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
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
    res.status(200).redirect('/profile');
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
      res.redirect('/login')
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
