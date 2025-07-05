const express = require("express");
const router = express.Router();
const multer = require("multer");
const Brand = require("../models/Brand");
const uploadToPinata = require("../lib/uploadToPinata");

const upload = multer({ storage: multer.memoryStorage() });

// POST /brands
router.post("/", upload.single("logo"), async (req, res) => {
  try {
    const { wallet, brand_name, deskripsi } = req.body;
    const logoUrl = await uploadToPinata(req.file, brand_name);
    const brandExists = await validateBrand(wallet);

    if (brandExists) {
      return res.status(400).json({ error: "Wallet already used" });
    }

    const brand = await Brand.create({
      wallet,
      brand_name,
      logo: `https://gateway.pinata.cloud/ipfs/${JSON.parse(logoUrl).cid}`,
      deskripsi,
    });

    res.status(201).json({ message: "Berhasil membuat brand", data: brand });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const brands = await Brand.find({}).lean();
    res.status(200).json({
      message: "Berhasil mendapatkan data",
      data: brands,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:wallet", async (req, res) => {
  try {
    const brand = await Brand.findOne({ wallet: req.params.wallet });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    // Tambahkan base URL ke logo jika ada
    const host = `${req.protocol}://${req.get("host")}`;
    const logoFullUrl = brand.logo ? `${host}${brand.logo}` : null;

    res.json({
      message: "Berhasil mendapatkan data",
      data: {
        ...brand.toObject(),
        logo: logoFullUrl,
        uri: mappingBrandUri(brand),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function validateBrand(wallet) {
  try {
    const brand = await Brand.exists({ wallet });
    if (!brand) return false;
    return true;
  } catch (err) {
    return false;
  }
}
function mappingBrandUri(brand) {
  const cid = brand.logo?.includes("pinata.cloud/ipfs/")
    ? brand.logo.split("pinata.cloud/ipfs/")[1]
    : brand.logo?.startsWith("ipfs://")
    ? brand.logo.replace("ipfs://", "")
    : brand.logo;

  return {
    name: brand.brand_name,
    description: brand.deskripsi,
    image: `ipfs://${cid}`,
    attributes: [
      {
        trait_type: "verified",
        value: "yes",
      },
    ],
  };
}

module.exports = router;
