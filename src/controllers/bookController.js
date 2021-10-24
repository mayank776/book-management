const { bookModel, userModel, reviewModel } = require("../models");

const fs = require("fs");

const aws = require("aws-sdk");

const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;

const { validator, awsS3 } = require("../utils");

const createBook = async function (req, res) {
  try {
    const requestBody = req.body;
    const userIdFromToken = req.userId;
    const files = req.files;

    // VALIDATING THE REQUEST BODY

    if (!validator.isValidRequestBody(requestBody)) {
      res.status(400).send({ status: false, msg: "request body is required" });
      return;
    }

    const { title, excerpt, userId, ISBN, category, subcategory, releasedAt } =
      requestBody;

    if (!validator.isValid(title)) {
      res
        .status(400)
        .send({ status: false, message: "Book Title is required" });
      return;
    }

    // UNIQUE TITLE

    let isTitleAlreadyUsed = await bookModel.findOne({ title });

    if (isTitleAlreadyUsed) {
      res.status(400).send({
        status: false,
        message: `${title} title is already present`,
      });
      return;
    }

    //

    if (!validator.isValid(excerpt)) {
      res
        .status(400)
        .send({ status: false, message: "book excerpt is required" });
      return;
    }

    if (!validator.isValid(userId)) {
      res.status(400).send({ status: false, message: "userId is required" });
      return;
    }

    if (!validator.isValidObjectId(userId)) {
      res
        .status(400)
        .send({ status: false, message: `${userId} is not a valid user id` });
      return;
    }

    if (!validator.isValidObjectId(userIdFromToken)) {
      res.status(400).send({
        status: false,
        message: `${userIdFromToken} is not a valid token id`,
      });
      return;
    }

    if (!validator.isValid(ISBN)) {
      res.status(400).send({ status: false, message: "ISBN is required" });
      return;
    }

    //UNIQUE ISBN

    let isIsbnAlreadyUsed = await bookModel.findOne({ ISBN });

    if (isIsbnAlreadyUsed) {
      res.status(400).send({
        status: false,
        message: `${ISBN} is already present`,
      });
      return;
    }

    //

    if (!validator.isValid(category)) {
      res
        .status(400)
        .send({ status: false, message: "Book category is required" });
      return;
    }

    if (!validator.isValid(subcategory)) {
      res
        .status(400)
        .send({ status: false, message: "Subcategory is required" });
      return;
    }

    if (!validator.isValid(releasedAt)) {
      res
        .status(400)
        .send({ status: false, message: "Released Date is required" });
      return;
    }

    if (!validator.validateDate(releasedAt)) {
      res
        .status(400)
        .send({ status: false, message: "Invalid Released Date " });
      return;
    }

    // creating a multipart file

    // let files = req.files;
    // if (!validator.isValid(files)) {
    //   res
    //     .status(400)
    //     .send({ status: false, message: "Please provide book cover" });
    //   return;
    // }
    // var fileName = files[0].originalname;
    // let bookCover = `./src/assets/${fileName}`;
    // let fileData = files[0].buffer;
    // fs.writeFile(bookCover, fileData, function (error, data) {
    //   if (error) {
    //     console.log({ msg: error.message });
    //   }
    // });

    // UPLOADING FILE TO CLOUD USING AWS-S3
    if (!validator.isValid(files)) {
      res
        .status(400)
        .send({ status: false, message: "Please provide a valid book cover" });
      return;
    }

    const bookCover = await awsS3.uploadFile(files[0]);

    let isBookCoverAlreadyPresent = await bookModel.findOne({ bookCover });

    if (isBookCoverAlreadyPresent) {
      res.status(400).send({
        status: false,
        message: `${bookCover} is already present`,
      });
      return;
    }

    console.log(bookCover);

    if (!bookCover) {
      res.status(400).send({ status: false, msg: "No file to write" });
      return;
    }

    // CREATING THE NEW BOOK

    const bookData = {
      title,
      bookCover,
      excerpt,
      userId,
      ISBN,
      category,
      subcategory,
      releasedAt,
    };

    // AUTHORISING THE USER

    const user = await userModel.findOne({
      _id: userId,
    });

    if (!user) {
      res.status(404).send({ status: false, message: `user not found` });
      return;
    }

    if (user._id.toString() !== userIdFromToken) {
      res.status(401).send({
        status: false,
        message: `Unauthorized access! user info doesn't match`,
      });
      return;
    }

    // CREATING BOOK

    const newBook = await bookModel.create(bookData);

    res.status(201).send({ status: true, data: newBook });
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

// GET ALL THE BOOKS

const getBooks = async function (req, res) {
  try {
    const filterQuery = { isDeleted: false, deletedAt: null };
    const queryParams = req.query;

    // VALIDATING THE QUERY PARAMS

    if (validator.isValidRequestBody(queryParams)) {
      const { userId, category, subcategory } = queryParams;

      if (validator.isValid(userId) && validator.isValidObjectId(userId)) {
        filterQuery["userId"] = userId;
      }
      //   } else {
      //     res.status(400).send({ status: false, message: "Not a userId" });
      //     return;
      //   }

      if (validator.isValid(category)) {
        filterQuery["category"] = category.trim();
      }

      if (validator.isValid(subcategory)) {
        filterQuery["subcategory"] = subcategory.trim();
      }
    }

    // FINDING THE BOOKS
    const books = await bookModel
      .find(filterQuery, {
        isDeleted: 0,
        deletedAt: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
        userId: 0,
        subcategory: 0,
      })
      .sort({ title: 1 });

    if (Array.isArray(books) && books.length === 0) {
      res.status(404).send({ status: false, message: "No books found" });
      return;
    }
    res.status(200).send({ status: true, message: "Book list", data: books });
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

// GET BOOKS BY ID

const getBooksById = async function (req, res) {
  try {
    let bookId = req.params.bookId;

    if (!validator.isValidObjectId(bookId)) {
      res
        .status(400)
        .send({ status: false, message: `${bookId} is not a valid book id` });
      return;
    }

    const book = await bookModel.findOne({
      _id: bookId,
      isDeleted: false,
      deletedAt: null,
    });

    if (!book) {
      res.status(404).send({ status: false, message: `Book not found` });
      return;
    }

    const reviews = await reviewModel.find(
      {
        bookId: bookId,
        isDeleted: false,
        deletedAt: null,
      },
      { createdAt: 0, updatedAt: 0, __v: 0 }
    );

    let details = { ...book["_doc"], reviewsData: reviews };

    res.status(200).send({
      status: true,
      message: "Success",
      data: details,
    });

    // when fs is used in place of AWS-S3

    // res.status(200).send({
    //   status: true,
    //   message: "Success",
    //   data: details,
    //   downloadUrl: `https://github.com/sabihak89/titaniumaplus/raw/mayank/W7D5/${book.bookCover.slice(
    //     2
    //   )}`,
    // });
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

const updateBooks = async function (req, res) {
  try {
    let requestBody = req.body;
    let bookId = req.params.bookId;
    let userIdFromToken = req.userId;

    if (!validator.isValidObjectId(bookId)) {
      res
        .status(400)
        .send({ status: false, msg: "please enter a valid book id" });
      return;
    }

    if (!validator.isValidObjectId(userIdFromToken)) {
      res.status(400).send({
        status: false,
        message: `${userIdFromToken} is not a valid token id`,
      });
      return;
    }

    // AUTHORIZATION

    const book = await bookModel.findOne({
      isDeleted: false,
      _id: bookId,
      deletedAt: null,
    });

    if (!book) {
      res.status(404).send({ status: false, message: `Book not found` });
      return;
    }

    if (book.userId.toString() !== userIdFromToken) {
      res.status(401).send({
        status: false,
        message: `Unauthorized access! Owner info doesn't match`,
      });
      return;
    }

    if (!validator.isValidRequestBody(requestBody)) {
      res.status(200).send({
        status: true,
        message: "No paramateres passed. book unmodified",
        data: book,
      });
      return;
    }

    const { title, excerpt, releasedAt, ISBN } = requestBody;

    const updateBook = {};

    if (validator.isValid(title)) {
      if (!Object.prototype.hasOwnProperty.call(updateBook, "$set"))
        updateBook["$set"] = {};

      updateBook["$set"]["title"] = title;

      let isTitleAlreadyPresent = await bookModel.aggregate([
        { $match: { title: title } },
      ]);

      if (isTitleAlreadyPresent > 1) {
        res.status(400).send({
          status: false,
          message: `${title} is already present`,
        });
        return;
      }
    }

    if (validator.isValid(excerpt)) {
      if (!Object.prototype.hasOwnProperty.call(updateBook, "$set"))
        updateBook["$set"] = {};

      updateBook["$set"]["excerpt"] = excerpt;
    }

    if (validator.isValid(ISBN)) {
      if (!Object.prototype.hasOwnProperty.call(updateBook, "$set"))
        updateBook["$set"] = {};

      updateBook["$set"]["ISBN"] = ISBN;

      let isIsbnAlreadyPresent = await bookModel.aggregate([
        { $match: { ISBN: ISBN } },
      ]);

      if (isIsbnAlreadyPresent > 1) {
        res.status(400).send({
          status: false,
          message: `${ISBN} is already present`,
        });
        return;
      }
    }

    if (validator.isValid(releasedAt)) {
      if (!validator.validateDate(releasedAt)) {
        res
          .status(400)
          .send({ status: false, message: "Invalid Released Date " });
        return;
      }

      if (!Object.prototype.hasOwnProperty.call(updateBook, "$set"))
        updateBook["$set"] = {};

      updateBook["$set"]["releasedAt"] = releasedAt;
    }

    const updatedBook = await bookModel.findOneAndUpdate(
      { _id: bookId },
      updateBook,
      { new: true }
    );

    res.status(200).send({
      status: true,
      message: "book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

// DELETE BOOKS

const deleteBooks = async function (req, res) {
  try {
    let bookId = req.params.bookId;
    let userIdFromToken = req.userId;

    if (!validator.isValidObjectId(bookId)) {
      res
        .status(400)
        .send({ status: false, msg: "please enter a valid book id" });
      return;
    }

    if (!validator.isValidObjectId(userIdFromToken)) {
      res.status(400).send({
        status: false,
        message: `${userIdFromToken} is not a valid token id`,
      });
      return;
    }

    const book = await bookModel.findOne({
      _id: bookId,
      isDeleted: false,
      deletedAt: null,
    });

    if (!book) {
      res.status(404).send({ status: false, message: `book not found` });
    }

    if (book.userId.toString() !== userIdFromToken) {
      res.status(401).send({
        status: false,
        message: `Unauthorized access! Owner info doesn't match`,
      });
    }

    await bookModel.findOneAndUpdate(
      { _id: bookId },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    res
      .status(200)
      .send({ status: true, message: `book deleted successfully` });
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

module.exports = {
  createBook,
  getBooks,
  getBooksById,
  updateBooks,
  deleteBooks,
};
