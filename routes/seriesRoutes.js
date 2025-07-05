const express = require("express");
const router = express.Router();
const multer = require("multer");
const { nanoid } = require("nanoid");
const Series = require("../models/Series");
const uploadToPinata = require("../lib/uploadToPinata");
const Brand = require("../models/Brand");

const upload = multer({ storage: multer.memoryStorage() });

function generateVerifyCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { series_name, max_supply, prod_batch, wallet, description } =
      req.body;
    const brand = await validateBrand(wallet);

    if (!brand) {
      return res.status(400).json({ error: "Wallet not registered yet!" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const uri = await uploadToPinata(req.file, series_name);

    const id = nanoid(10);
    const seriesArray = [];

    for (let i = 0; i < parseInt(max_supply); i++) {
      seriesArray.push(
        new Series({
          uri,
          series_name,
          id,
          prod_batch,
          wallet,
          verify_code: generateVerifyCode(),
          description,
        })
      );
    }

    await Series.insertMany(seriesArray);
    res.status(201).json({
      message: "Series created",
      data: {
        seriesId: id,
        max_supply,
        wallet,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/museum", async (req, res) => {
  try {
    const series = await Series.find({}).lean();

    const data = await Promise.all(
      series.map(async (s) => {
        const brand = await Brand.findOne({ wallet: s.wallet }).lean();
        return {
          ...s,
          uri: mappingUri(s, brand?.brand_name || ""),
        };
      })
    );

    // Ambil 1 item unik per seriesId (id)
    const uniqueSeries = Object.values(
      data.reduce((acc, item) => {
        if (!acc[item.id]) {
          acc[item.id] = item; // Simpan yang pertama ditemukan
        }
        return acc;
      }, {})
    );

    res.status(200).json({
      message: "Berhasil mendapatkan data unik per seriesId",
      data: uniqueSeries,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/wallet-collection/:wallet", async (req, res) => {
  try {
    const { wallet } = req.params;
    const series = await Series.find({ collector: wallet }).lean();
    res.status(200).json({
      messsage: "Berhasil mendapatkan data",
      data: series.map((s) => ({
        ...s,
        uri: JSON.parse(s.uri),
      })),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/claim-list", async (req, res) => {
  try {
    const { wallet, seriesId } = req.query;

    const filter = { collector: null };

    if (wallet) filter.wallet = wallet;
    if (seriesId) filter.id = seriesId;

    const series = await Series.find(filter).lean();

    const finalData = await Promise.all(
      series.map(async (s) => {
        const brand = await Brand.findOne({ wallet: s.wallet }).lean();
        const uri = mappingUri(s, brand.brand_name);
        return {
          ...s,
          uri,
        };
      })
    );
    res.status(200).json({
      messsage: "Berhasil mendapatkan data",
      data: finalData,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const series = await Series.findOne({ verify_code: code }).lean();
    if (!series) return res.status(404).json({ error: "Series not found" });
    const brand = await Brand.findOne({ wallet: series.wallet }).lean();
    if (!brand) return res.status(404).json({ error: "Brand not found" });
    const uri = mappingUri(series, brand.brand_name);
    res.status(200).json({
      messsage: "Berhasil mendapatkan data",
      data: {
        ...series,
        uri,
        logo: brand.logo,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/mint", async (req, res) => {
  try {
    const { code, collector } = req.body;
    const series = await Series.findOne({
      verify_code: code,
      collector: null,
    }).lean();
    if (!series) return res.status(404).json({ error: "Series not found" });
    const brand = await Brand.findOne({ wallet: series.wallet }).lean();
    if (!brand) return res.status(404).json({ error: "Brand not found" });
    series.collector = collector;
    await series.save();
    const uri = mappingUri(series, brand.brand_name);
    res.status(200).json({
      message: "Series minted",
      data: {
        collector: series.collector,
        seriesId: series.id,
        uri,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

async function validateBrand(wallet) {
  try {
    const brand = await Brand.exists({ wallet });
    return !!brand;
  } catch (err) {
    return false;
  }
}

function mappingUri(data, brandName) {
  const uri = JSON.parse(data.uri);
  return {
    name: brandName,
    description: data.description,
    image: `ipfs://${uri.cid}`,
    attributes: [
      {
        trait_type: "verified",
        value: "yes",
      },
    ],
  };
}

module.exports = router;
