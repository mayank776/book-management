const { userModel } = require("../models");

const { validator } = require("../utils");

const { systemConfig } = require("../configs");

const { jwt } = require("../utils");

// REGISTER API

const registerUser = async function (req, res) {
  try {
    let requestBody = req.body;
    if (!validator.isValidRequestBody(requestBody)) {
      res.status(400).send({ status: false, msg: "request body is required" });
      return;
    }

    const { title, name, phone, email, password, address } = requestBody;

    if (!validator.isValid(title)) {
      res.status(400).send({ status: false, msg: "title is required" });
      return;
    }

    if (!validator.isValidTitle(title)) {
      res.status(400).send({
        status: false,
        msg: `${systemConfig.titleEnumArray.join(",")} is required`,
      });
      return;
    }

    if (!validator.isValid(name)) {
      res.status(400).send({ status: false, msg: "name is required" });
      return;
    }

    if (!validator.isValid(phone)) {
      res.status(400).send({ status: false, msg: "phone is required" });
      return;
    }

    if (!validator.isValid(email)) {
      res.status(400).send({ status: false, msg: "email is required" });
      return;
    }

    if (!validator.validateEmail(email)) {
      res.status(400).send({ status: false, msg: "email is not valid" });
      return;
    }

    const isEmailAlreadyUsed = await userModel.findOne({ email });

    if (isEmailAlreadyUsed) {
      res.status(400).send({
        status: false,
        message: `${email} email address is already registered`,
      });
      return;
    }

    const isPhoneAlreadyUsed = await userModel.findOne({ phone });

    if (isPhoneAlreadyUsed) {
      res.status(400).send({
        status: false,
        message: `${phone} phone is already registered`,
      });
      return;
    }

    if (!validator.isValid(password)) {
      res.status(400).send({ status: false, msg: "password is required" });
      return;
    }

    if (!validator.isValidLength(password)) {
      res.status(400).send({
        status: false,
        msg: "password length should be between 8 to 15",
      });
      return;
    }

    const newUser = { title, name, phone, email, password, address };
    const createUser = await userModel.create(newUser);
    res.status(201).send({ status: true, data: createUser });
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

// LOGIN API

const loginUser = async function (req, res) {
  try {

    // VALIDATING REQUEST BODY

    let requestBody = req.body;
    if (!validator.isValidRequestBody(requestBody)) {
      res
        .status(400)
        .send({ status: false, msg: "enter a valid request body" });
      return;
    }

    const { email, password } = requestBody;

    if (!validator.isValid(email)) {
      res.status(400).send({ status: false, msg: "enter an email" });
      return;
    }

    if (!validator.validateEmail(email)) {
      res.status(400).send({ status: false, msg: "enter an valid email" });
      return;
    }

    if (!validator.isValid(password)) {
      res.status(400).send({ status: false, msg: "enter a password" });
      return;
    }

    const user = await userModel.findOne({ email, password });

    // CREATING TOKEN

    if (!user) {
      res.status(401).send({ status: false, msg: "email not registered" });
      return;
    }

    const token = await jwt.createToken({ userId : user._id });

    res.header("x-api-key", token);

    res
      .status(201)
      .send({ status: true, msg: "successful login", token : { token } });
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};



module.exports = {
  registerUser,
  loginUser,
};
