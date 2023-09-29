"use strict";

const express = require("express");

const router = express.Router();

const multiparty = require("connect-multiparty");
const md_upload = multiparty({ uploadDir: "./upload/images" });

const controllers = require("../controllers/controllers");

router.get("/test", controllers.test);
router.post("/book", controllers.saveBook);
router.get("/book/:id?", controllers.getBooks);
router.put("/book/:id", controllers.updateBook);
router.delete("/book/:id", controllers.deleteBook);
router.post("/image/:id", md_upload, controllers.uploadImage);
router.get("/image/:image", controllers.getImage);

module.exports = router;
