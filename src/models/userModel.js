const mongoose = require("mongoose");

const { systemConfig } = require("../configs");

const { validator } = require("../utils");

const userSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: "title is required",
      enum: systemConfig.titleEnumArray,
      trim: true,
    },
    name: {
      type: String,
      required: "name is required",
      trim: true,
    },
    phone: {
      type: String,
      required: "phone is required",
      trim: true,
      unique: true
    },
    email: {
      type: String,
      required: "email is required",
      unique: true,
      trim: true,
      validate: {
        validator: validator.validateEmail,
        message: "Please fill a valid email address",
        isAsync: false,
      },
      match: [validator.emailRegex, "Please fill a valid email address"],
    },
    password: {
      type: String,
      required: "password is required",
      trim: true,
      minLength: 8,
      maxLength: 15,
    },
    address: {
      street: { type: String },
      city: { type: String },
      pincode: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema, "users");
