const mongoose = require("mongoose");

const SeriesSchema = new mongoose.Schema(
  {
    uri: String,
    series_name: { type: String, required: true },
    id: { type: Number, required: true },
    prod_batch: String,
    wallet: { type: String, required: true, ref: "Brand" },
    verify_code: { type: String, required: true, unique: true },
    collector: { type: String, default: null },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Series", SeriesSchema);
