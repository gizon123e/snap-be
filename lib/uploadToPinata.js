require("dotenv").config();
const { PinataSDK } = require("pinata");

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
});

async function uploadToPinata(file, series_name) {
  try {
    const fileBlob = new File([file.buffer], series_name, {
      type: file.mimetype,
    });
    const result = await pinata.upload.public.file(fileBlob);
    return JSON.stringify(result);
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

module.exports = uploadToPinata;
