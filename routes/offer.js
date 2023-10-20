const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/convertToBase64");
const isAuthenticated = require("../middlewares/isAuthenticated");

const Offer = require("../models/Offer");

// ROUTE POUR PUBLIER UNE OFFRE
router.post(
  "/offer/publish",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      // console.log(req.headers.authorization);
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      if (description.length > 500) {
        return res
          .status(400)
          .json({ message: "Description should not exceed 500 car" });
      }
      if (title.length > 50) {
        return res
          .status(400)
          .json({ message: "Title should not exceed 500 car" });
      }
      if (price > 100000) {
        return res
          .status(400)
          .json({ message: "Price should not exceed 100000€" });
      }
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ÉTAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        owner: req.user,
        product_image: "",
      });
      const resultImage = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture),
        { folder: "/vinted/offers/" + newOffer.id }
      );
      newOffer.product_image = resultImage;
      await newOffer.save();
      res.status(201).json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ROUTE POUR MODIFIER UNE OFFRE
router.put("/offer/edit/:id", async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.body;
    const offerToEdit = await Offer.findByID(req.params.id);
    console.log(offerToEdit);
    offerToEdit.product_name = title;
    offerToEdit.product_description = description;
    offerToEdit.product_price = price;
    offerToEdit.product_details = [
      { MARQUE: brand },
      { TAILLE: size },
      { ÉTAT: condition },
      { COULEUR: color },
      { EMPLACEMENT: city },
    ];
    console.log(offerToEdit);
    await offerToEdit.save();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ROUTE POUR SUPPRIMER UNE ANNONCE
router.delete("/offer/delete/:id", async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.status(500).json({ message: "Offer deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ROUTE POUR AFFICHER LES ANNONCES
router.get("/offers", async (req, res) => {
  try {
    // console.log(req.query);

    // Number of items per page
    const pageItems = 3;
    // Sorting order of products
    let sortingOrder = "";
    if (req.query.sort) {
      sortingOrder = req.query.sort.slice(6);
    }
    // Price limits
    let maxPrice = 10000;
    if (req.query.priceMax) {
      maxPrice = req.query.priceMax;
    }
    let minPrice = 0;
    if (req.query.priceMin) {
      minPrice = req.query.priceMin;
    }

    const offers = await Offer.find({
      product_name: new RegExp(req.query.title, "i"),
      product_price: { $gte: minPrice, $lte: maxPrice },
    })
      .sort(sortingOrder)
      .skip((req.query.page - 1) * (pageItems - 1))
      .limit(pageItems);
    // .select("product_price product_name");

    const countOffers = await Offer.countDocuments({
      product_name: new RegExp(req.query.title, "i"),
      product_price: { $gte: minPrice, $lte: maxPrice },
    });
    res.status(200).json({ count: countOffers, offers: offers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ROUTE POUR RECUPERER LES DETAILS D'UNE ANNONCE
router.get("/offer/:id", async (req, res) => {
  try {
    console.log(req.params.id);
    const searchedOffer = await Offer.findOne({ _id: req.params.id });
    res.status(200).json(searchedOffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
