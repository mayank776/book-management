const { bookModel, reviewModel } = require("../models");

const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;

const { validator } = require("../utils");

const addReview = async function (req, res) {
  try {
    // STORING PARAMS AND BODY
    let requestBody = req.body;
    let paramBookId = req.params.bookId;

    // PARAM BOOK ID IS VALID OBJECT ID
    if (!validator.isValidObjectId(paramBookId)) {
      res.status(400).send({
        status: false,
        msg: "Please provide correct book id details",
      });
      return;
    }

    // WHETHER THE BOOK IS PRESENT OR NOT AND THE SAME AS WE PUT IN THE BODY
    const book = await bookModel.findOne({
      _id: paramBookId,
      isDeleted: false,
    });

    if (!book) {
      res
        .status(404)
        .send({ status: false, message: `book or ID does not exist` });
      return;
    }

    // WHETHER THE BODY IS PRESENT OR NOT
    if (!validator.isValidRequestBody(requestBody)) {
      res.status(200).send({
        status: true,
        message: "No paramateres passed. review unmodified",
        data: review,
      });
      return;
    }

    // OBJECT DESTRUCTURING
    const { bookId, reviewedBy, rating, review } = requestBody;

    // WHETHER ALL THE REQUIRED ENTITIES ARE PRESENT OR NOT
    if (!validator.isValid(bookId)) {
      res.status(400).send({ status: false, message: "Please provide bookId" });
      return;
    }

    if (!validator.isValidObjectId(bookId)) {
      res.status(400).send({
        status: false,
        message: ` ${bookId} is invalid. Please provide valid bookId`,
      });
      return;
    }

    if (!(bookId == paramBookId)) {
      res.status(400).send({
        status: false,
        message: ` ${bookId} is not the same as the bookId in params`,
      });
      return;
    }

    if (!validator.isValid(review)) {
      res.status(400).send({ status: false, message: "Please provide review" });
      return;
    }

    if (!validator.isValid(rating)) {
      res.status(400).send({ status: false, message: "Rating is required" });
      return;
    }

    if (!validator.isValidRating(rating)) {
      res.status(400).send({
        status: false,
        message: "Invalid Rating. Rating should be between 1 to 5.",
      });
      return;
    }

    const reviewData = {
      reviewedBy,
      bookId,
      reviewedAt: new Date(),
      rating,
      review,
    };

    // CREATING NEW REVIEW
    const newReview = await reviewModel.create(reviewData);

    // UPDATING REVIEW COUNT
    await bookModel.findOneAndUpdate(
      { isDeleted: false, _id: bookId, deletedAt: null },
      {
        $inc: { reviews: 1 },
      },
      { new: true }
    );

    res.status(201).send({
      status: true,
      message: "New Review/Rating Added",
      data: newReview,
    });
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

const updateReview = async function (req, res) {
  try {
    // STORING PARAMS AND BODY
    const bookId = req.params.bookId;
    const reviewId = req.params.reviewId;
    const requestBody = req.body;

    // WHETHER BOTH PARAMS ID ARE VALID OR NOT
    if (!validator.isValidObjectId(bookId)) {
      res.status(400).send({
        status: false,
        message: `${bookId} is not a valid review id`,
      });
      return;
    }

    if (!validator.isValidObjectId(reviewId)) {
      res.status(400).send({
        status: false,
        message: `${reviewId} is not a valid review id`,
      });
      return;
    }

    // WHETHER THE BOOK IS PRESENT OR NOT AND THE SAME AS WE PUT IN THE BODY
    const getBook = await bookModel.findOne({
      _id: bookId,
      isDeleted: false,
      deletedAt: null,
    });

    if (!getBook) {
      res
        .status(404)
        .send({ status: false, message: `book or ID does not exist` });
      return;
    }

    // FOR REVIEWS AS WELL
    const getReview = await reviewModel.findOne({
      _id: reviewId,
      isDeleted: false,
      deletedAt: null,
    });

    if (!getReview) {
      res
        .status(404)
        .send({ status: false, message: `review or ID does not exist` });
      return;
    }

    // WHETHER THE BODY IS PRESENT OR NOT
    if (!validator.isValidRequestBody(requestBody)) {
      res.status(200).send({
        status: true,
        message: "No paramateres passed. review unmodified",
        data: review,
      });
      return;
    }

    // OBJECT DESTRUCTURING
    const { review, rating, reviewedBy } = requestBody;

    const updateReview = {};

    // UPDATING REVIEWS
    if (validator.isValid(review)) {
      if (!Object.prototype.hasOwnProperty.call(updateReview, "$set"))
        updateReview["$set"] = {};

      updateReview["$set"]["review"] = review;
    }

    if (validator.isValid(rating)) {
      if (!validator.isValidRating(rating)) {
        res.status(400).send({
          status: false,
          message: "Invalid Rating. Rating should be between 1 to 5.",
        });
        return;
      }

      if (!Object.prototype.hasOwnProperty.call(updateReview, "$set"))
        updateReview["$set"] = {};

      updateReview["$set"]["rating"] = rating;
    }

    if (validator.isValid(reviewedBy)) {
      if (!Object.prototype.hasOwnProperty.call(updateReview, "$set"))
        updateReview["$set"] = {};

      updateReview["$set"]["reviewedBy"] = reviewedBy;
    }

    // QUESTION: what if book was deleted??

    const updatedReview = await reviewModel.findOneAndUpdate(
      { _id: reviewId, bookId: bookId, isDeleted: false, deletedAt: null },
      updateReview,
      { new: true }
    );

    res.status(200).send({
      status: true,
      message: "review updated successfully",
      data: updatedReview,
    });
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

const deleteReview = async function (req, res) {
  try {
    // QUESTION:  what if params are not there??
    // global error middleware

    const bookId = req.params.bookId;
    const reviewId = req.params.reviewId;

    if (!validator.isValidObjectId(bookId)) {
      res
        .status(400)
        .send({ status: false, message: `${bookId} is not a valid book id` });
      return;
    }

    if (!validator.isValidObjectId(reviewId)) {
      res.status(400).send({
        status: false,
        message: `${reviewId} is not a valid review id`,
      });
      return;
    }

    const book = await bookModel.findOne({
      isDeleted: false,
      _id: bookId,
      deletedAt: null,
    });

    if (!book) {
      res.status(404).send({
        status: false,
        message: "book not found",
      });
      return;
    }

    const review = await reviewModel.findOneAndUpdate(
      {
        _id: reviewId,
        bookId: bookId,
        isDeleted: false,
        deletedAt: null,
      },
      {
        $set: { isDeleted: true, deletedAt: new Date() },
      },
      { new: true }
    );

    if (!review) {
      res.status(404).send({
        status: false,
        message: "review not found",
      });
      return;
    }

    await bookModel.findOneAndUpdate(
      { isDeleted: false, _id: bookId },
      {
        $inc: { reviews: -1 },
      },
      { new: true }
    );

    res.status(200).send({
      status: true,
      message: `Review deleted successfully`,
      data: review,
    });
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

module.exports = {
  addReview,
  updateReview,
  deleteReview,
};
