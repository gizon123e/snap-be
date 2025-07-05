require("dotenv").config();
const { PinataSDK } = require("pinata");
const { Blob } = require("buffer"); // Node.js 18+ built-in

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
});

async function uploadToPinata(file, series_name) {
  try {
    // Buat Blob dari buffer
    const fileBlob = new Blob([file.buffer], { type: file.mimetype });

    // Tambahkan properti name ke blob
    Object.defineProperty(fileBlob, "name", {
      value: series_name,
      writable: false,
    });

    const result = await pinata.upload.public.file(fileBlob);
    return JSON.stringify(result);
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

module.exports = uploadToPinata;
