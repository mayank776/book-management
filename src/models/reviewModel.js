const mongoose = require("mongoose");

const objectId = mongoose.Types.ObjectId;

const reviewSchema = new mongoose.Schema(
  {
    bookId: { type: objectId, required: "bookId is required", refs: "Book" },
    reviewedBy: {
      type: String,
      required: "reviewedBy is required",
      default: "Guest",
    },
    reviewedAt: { type: Date, required: "date is required" },
    rating: { type: Number, min: 1, max: 5, required: "rating is required" },
    review: { type: String },
    deletedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema, "reviews");
