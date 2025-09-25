const express = require("express");
const csv = require("csv-parser");
const fs = require("fs");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");
const { Parser } = require("json2csv");
const dotendv = require("dotenv");
dotendv.config();

const app = express();
const PORT = process.env.PORT || 3000;

let product = {};
let csvData = [];
let results = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const upload = multer({ dest: "uploads/" });

const ai = new GoogleGenAI({});

const generateAIResponse = async (prompt) => {
    const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    });
    return response;
}

app.post("/offers", (req, res) => {
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

app.post("/score", (req, res) => {
  if (csvData.length === 0 || Object.keys(product).length === 0) {
    return res.status(400).send("Product information or CSV data is missing.");
  }

  const decisionKeywords = [
    "founder",
    "owner",
    "chief",
    "ceo",
    "cmo",
    "cto",
    "cfo",
    "cio",
    "president",
    "partner",
    "vp",
    "vice president",
    "head",
    "director",
    "managing director",
  ];
  const influencerKeywords = [
    "manager",
    "lead",
    "supervisor",
    "specialist",
    "coordinator",
    "consultant",
    "advisor",
    "analyst",
    "strategist",
    "program manager",
    "project manager",
    "product manager",
  ];

  // Normalize ideal use cases for matching
  const icp = product.ideal_use_cases
    ? product.ideal_use_cases.map((i) => i.toLowerCase())
    : [];

  results = csvData.map((prospect) => {
    let score = 0;

    // Role relevance
    const role = prospect.role ? prospect.role.toLowerCase() : "";
    if (decisionKeywords.some((kw) => role.includes(kw))) {
      score += 20;
    } else if (influencerKeywords.some((kw) => role.includes(kw))) {
      score += 10;
    }

    // Industry/use case match (checks both industry and company fields)
    const industry = prospect.industry ? prospect.industry.toLowerCase() : "";
    const company = prospect.company ? prospect.company.toLowerCase() : "";
    if (icp.some((i) => industry.includes(i) || company.includes(i))) {
      score += 20;
    } else if (icp.some((i) => i.includes(industry) || i.includes(company))) {
      score += 10;
    }

    // Data completeness
    const requiredFields = [
      "name",
      "role",
      "company",
      "industry",
      "location",
      "linkedin_bio",
    ];
    if (
      requiredFields.every(
        (field) => prospect[field] && prospect[field].trim() !== ""
      )
    ) {
      score += 10;
    }

    // AI Layer - Intent and Explanation (use gemini api)
    // Import GoogleGenAI at the top: const { GoogleGenAI } = require("@google/genai");
    // Ensure /score endpoint is async to use await inside map

    const ai = new GoogleGenAI({});

    // Prepare prompt for Gemini
    const prompt = `
    Prospect: ${JSON.stringify(prospect)}
    Offer: ${JSON.stringify(product)}
    Classify intent (High/Medium/Low) and explain in 1–2 sentences. Only respond in this format:
    Intent: <High|Medium|Low>
    Explanation: <your explanation>
    `;

    let aiIntent = "Low";
    let aiExplanation = "No AI response.";
    let aiScore = 10;

    try {
      const response = genrateAIResponse(prompt);
      const responseText = response || "";

      // Extract intent and explanation using regex
      const intentMatch = responseText.match(/Intent:\s*(High|Medium|Low)/i);
      const explanationMatch = responseText.match(/Explanation:\s*(.*)/i);

      if (intentMatch) {
        aiIntent = intentMatch[1];
        if (aiIntent === "High") aiScore = 50;
        else if (aiIntent === "Medium") aiScore = 30;
        else aiScore = 10;
      }
      if (explanationMatch) {
        aiExplanation = explanationMatch[1].trim();
      }
    } catch (err) {
      aiExplanation = "AI error: " + err.message;
    }

    return {
      ...prospect,
      rule_layer_score: score,
      ai_layer: {
        intent: aiIntent,
        explanation: aiExplanation,
        score: aiScore,
      },
      total_score: score + aiScore,
    };
  });

  res.json({ results });
});

app.get("/results", (req, res) => {
    if (results.length === 0) {
        return res.status(400).send("No results available. Please score leads first.");
    }

    // Format results for output
    const formattedResults = results.map(r => ({
        name: r.name,
        role: r.role,
        company: r.company,
        intent: r.ai_layer?.intent || "",
        score: r.total_score,
        reasoning: r.ai_layer?.explanation || ""
    }));

    // Convert to CSV
    const parser = new Parser({ fields: ["name", "role", "company", "intent", "score", "reasoning"] });
    const csvOutput = parser.parse(formattedResults);

    res.json({
        results: formattedResults,
    });
    res.header("Content-Type", "text/csv");
    res.attachment("results.csv");
    res.send(csvOutput);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
