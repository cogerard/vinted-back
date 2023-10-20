require("dotenv").config(); // Permet d'activer les variables d'environnement qui se trouvent dans le fichier `.env`

mongoose.connect(process.env.MONGODB_URI);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2; // On n'oublie pas le `.v2` à la fin

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/vinted");

// Je me connecte à mon compte cloudinary avec les identifiants présents sur mon compte
cloudinary.config({
  cloud_name: "dr3jpgy41",
  api_key: "765622985783434",
  api_secret: "X8kv4QCLa0P-MscF11jYewqL-n4",
  secure: true,
});

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
