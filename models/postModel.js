const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  postData: {
    type: String,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],

  isPublic: {
    type: Boolean,
    default: false,
  },
});

const postModel = mongoose.model("post", postSchema);

module.exports = postModel;
