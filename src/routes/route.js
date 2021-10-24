const express = require("express");

const router = express.Router();

const { userController, bookController, reviewController } = require("../controllers");
const { userAuth } = require("../middlewares");

// USER API'S
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

// BOOK API'S
router.post("/books", userAuth, bookController.createBook);
router.get("/books", userAuth, bookController.getBooks);
router.get("/books/:bookId", userAuth, bookController.getBooksById);
router.put("/books/:bookId", userAuth, bookController.updateBooks);
router.delete("/books/:bookId", userAuth, bookController.deleteBooks)

// REVIEW API'S
router.post("/books/:bookId/review",  reviewController.addReview)
router.put("/books/:bookId/review/:reviewId",  reviewController.updateReview)
router.delete("/books/:bookId/review/:reviewId",  reviewController.deleteReview)


module.exports = router;
