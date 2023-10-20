const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/convertToBase64");

const uid2 = require("uid2"); // Package qui sert à créer des string aléatoires
const SHA256 = require("crypto-js/sha256"); // Sert à encripter une string
const encBase64 = require("crypto-js/enc-base64"); // Sert à transformer l'encryptage en string

const User = require("../models/User");

// SIGNUP POST /user/signup
router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    // Vérifier que l'email n'existe pas déjà en BDD
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ message: "This email is already used" });
    }
    //Vérifier qu'on a bien un username
    if (!req.body.username) {
      return res.status(400).json({ message: "Username is mandatory" });
    }

    // On génère un salt
    const userSalt = uid2(16);
    // On génère un hash
    const userHash = SHA256(req.body.password + userSalt).toString(encBase64);
    // On génère un token
    const userToken = uid2(64);

    // Je stocke la clé avatar de req.body dans une variable avatar
    const avatar = req.files.avatar;
    // Je convertis l'image en qqch de convertible sur cloudinary
    const readableAvatar = convertToBase64(avatar);
    // J'envoie l'image sur cloudinary et je récupère la réponse
    const resultAvatar = await cloudinary.uploader.upload(readableAvatar);

    // on crée le nouveau user
    const newUser = new User({
      email: req.body.email,
      account: { username: req.body.username, avatar: resultAvatar },
      newsletter: req.body.newsletter,
      token: userToken,
      hash: userHash,
      salt: userSalt,
    });

    // je sauvegarde mon user
    await newUser.save();
    // je réponds
    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
        avatar: newUser.account.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN POST /user/login
router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    console.log(user);
    if (!user) {
      return res.status(400).json({ message: "This email is not used" });
    }
    const hashToVerify = SHA256(req.body.password + user.salt).toString(
      encBase64
    );
    console.log(hashToVerify);
    if (user.hash === hashToVerify) {
      return res.status(200).json({
        _id: user._id,
        token: user.token,
        account: {
          username: user.account.username,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
