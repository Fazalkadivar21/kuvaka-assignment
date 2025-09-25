const express = require("express");
const csv = require("csv-parser");
const fs = require("fs");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");
const { Parser } = require("json2csv");
const app = express();
const PORT = process.env.PORT || 3000;

let product = {};
let csvData = [];
let results = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/offer", (req, res) => {
  const { name, value_props, ideal_use_cases } = req.body;
  product = { name, value_props, ideal_use_cases };
  res.json({ message: "Product information received", product });
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
