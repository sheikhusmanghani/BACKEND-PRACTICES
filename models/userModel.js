const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/AuthTestApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB ok hy");
  })
  .catch((e) => {
    console.log("DB me error hy " + e.message);
  });

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
});

const UserModel = mongoose.model("user", userSchema);

module.exports = UserModel;
