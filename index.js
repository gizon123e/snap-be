require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const brandRoutes = require("./routes/brandRoutes");
const seriesRoutes = require("./routes/seriesRoutes");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/brands", brandRoutes);
app.use("/api/series", seriesRoutes);

// Connect DB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ DB connection error:", err));
