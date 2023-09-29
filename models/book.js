const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BookSchema = Schema({
  title: String,
  author: String,
  pages: Number,
  readed: Number,
  image: String,
});

module.exports = mongoose.model("Book", BookSchema);
