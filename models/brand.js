const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema(
  {
    wallet: { type: String, unique: true, required: true },
    brand_name: { type: String, required: true },
    logo: String,
    deskripsi: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Brand", BrandSchema);
