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
const upload = multer({ dest: "uploads/" });

app.post("/offer", (req, res) => {
  const { name, value_props, ideal_use_cases } = req.body;
  product = { name, value_props, ideal_use_cases };
  res.json({ message: "Product information received", product });
});

app.post("/leads/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }
  csvData = []; // Reset previous data
  fs.createReadStream(file.path)
    .pipe(csv())
    .on("data", (data) => {
      // Ensure each field is present and store by field names
      const formatted = {
        name: data.name || "",
        role: data.role || "",
        company: data.company || "",
        industry: data.industry || "",
        location: data.location || "",
        linkedin_bio: data.linkedin_bio || "",
      };
      csvData.push(formatted);
    })
    .on("end", () => {
      console.log("CSV file successfully processed");
      res.json({ message: "CSV file processed successfully", data: csvData });
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
