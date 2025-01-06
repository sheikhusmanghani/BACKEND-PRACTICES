const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const express = require("express");
const UserModel = require("./models/userModel");
const jwt = require("jsonwebtoken");
const { ProtectedRoute, isUserExist } = require("./middlewares");
const postModel = require("./models/postModel");
const path = require("path");
const PORT = 8000;
const app = express();

// // Middlewares
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//  Route For signup
app.get("/", (req, res) => {
  if (!req.cookies.token) {
    res.render("signup.ejs");
  }
});

// Signup

app.post("/signup", isUserExist, async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send({ error: "All fields are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await UserModel.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ email }, "mySecretKey");
    res.cookie("token", token);

    // console.log("User Created:", result);
    res.redirect("/profile");
  } catch (err) {
    console.log("Error ==> :", err.message);
    res.status(500).send({ error: err.message });
  }
});

// Logout

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// Route for Login

app.get("/login", (req, res) => {
  if (!req.cookies.token) {
    res.render("login.ejs");
  }
});

// Login

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign({ email }, "mySecretKey");
        res.cookie("token", token);

        res.redirect("/profile");
      } else {
        res.send("Something is wrong");
      }
    });
  } catch (error) {
    console.error(error.message);
  }
});

// Route for showing post.ejs

app.get("/profile", ProtectedRoute, async (req, res) => {
  let user = await UserModel.findOne({ email: req.user.email }).populate(
    "posts"
  );

  const sortedPosts = user.posts.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Public posts by other users
  const publicPosts = await postModel
    .find({ isPublic: true, createdBy: { $ne: user._id } })
    .sort({ createdAt: -1 })
    .populate("createdBy");

  res.render("post.ejs", { user, sortedPosts, publicPosts });
});

// route for posting

app.post("/post", ProtectedRoute, async (req, res) => {
  const user = await UserModel.findOne({ email: req.user.email });
  const { postData, isPublic } = req.body;

  // console.log(isPublic);
  if (!postData) return res.send("please write something !");

  const newPost = await postModel.create({
    createdBy: user._id,
    postData: postData,
    isPublic: isPublic === "true",
  });

  user.posts.push(newPost._id);
  await user.save();

  res.redirect("/profile");
});

// route for like

app.get("/like/:id", ProtectedRoute, async (req, res) => {
  const user = await UserModel.findOne({ email: req.user.email }); // get user data
  let post = await postModel.findOne({ _id: req.params.id }); // get post data
  // .populate("user"); // is me error hy

  if (post.likes.indexOf(user._id) === -1) {
    post.likes.push(user._id);
  } else {
    post.likes.splice(post.likes.indexOf(user._id), 1);
  }

  await post.save();

  res.redirect("/profile");
});

// route for edit page showing

app.get("/edit/:id", ProtectedRoute, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }); // get post data

  res.render("edit.ejs", { post });
});

// when update btn is clicked

app.post("/update/:id", ProtectedRoute, async (req, res) => {
  let post = await postModel.findOneAndUpdate(
    { _id: req.params.id },
    { postData: req.body.postData }
  ); // get post data
  // console.log(req.params.id)
  res.redirect("/profile");
});

// delelte post Api

app.get("/post_delete/:id", ProtectedRoute, async (req, res) => {
  try {
    const post = await postModel.findOneAndDelete({ _id: req.params.id }); // ye sirf posts se delete kr rha hy
    const user = await UserModel.findOne({ email: req.user.email });
    user.posts = user.posts.filter(
      (postId) => postId.toString() !== req.params.id.toString()
    );
    await user.save();

    res.redirect("/profile");
  } catch (error) {
    console.log(error);
  }
});

// Server
app.listen(PORT, () => {
  console.log(`Your app listening on port ${PORT}`);
});
