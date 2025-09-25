# Kuvuka Lead Scoring API

This is an Express.js API for scoring sales leads using both rule-based logic and Google Gemini AI. It processes uploaded CSVs of prospects, scores them, and provides results with AI-driven intent classification and explanations.

## Live url - https://kuvaka-assignment-i0qe.onrender.com/

## Setup Steps

1. **Clone the repository**
   ```zsh
   git clone https://github.com/fazalkadivar21/kuvaka-assignment.git
   cd kuvuka
   ```
2. **Install dependencies**
   ```zsh
   pnpm install
   # or
   npm install
   ```
3. **Set up environment variables**
   - Create a `.env` file in the root directory.
   - Add your Google GenAI API key:
     ```env
     GOOGLE_API_KEY=your_google_genai_api_key
     PORT=3000 # optional
     ```
4. **Run the server**
   ```zsh
   node src/index.js
   # or
   pnpm start
   ```

## API Usage Examples

### 1. Submit Product Offer

```bash
curl -X POST http://localhost:3000/offers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ProductX",
    "value_props": ["Fast", "Reliable"],
    "ideal_use_cases": ["SaaS", "Fintech"]
  }'
```

### 2. Upload Leads CSV

```bash
curl -X POST http://localhost:3000/leads/upload \
  -F "file=@leads.csv"
```

### 3. Score Leads

```bash
curl -X POST http://localhost:3000/score
```

### 4. Get Results (CSV & JSON)

```bash
curl -X GET http://localhost:3000/results
```

## Rule Logic & AI Prompts

### Rule Layer
- **Role relevance:**
  - Decision-makers (e.g., CEO, Founder) get +20 points.
  - Influencers (e.g., Manager, Lead) get +10 points.
- **Industry/Use Case Match:**
  - If prospect's industry/company matches ideal use cases, +20 points.
  - Partial match, +10 points.
- **Data Completeness:**
  - All required fields present, +10 points.

### AI Layer (Gemini)
- For each prospect, the following prompt is sent to Gemini:
  ```
  Prospect: {prospect JSON}
  Offer: {product JSON}
  Classify intent (High/Medium/Low) and explain in 1–2 sentences. Only respond in this format:
  Intent: <High|Medium|Low>
  Explanation: <your explanation>
  ```
- **Intent Scoring:**
  - High: +50 points
  - Medium: +30 points
  - Low: +10 points

### Output
- Each prospect gets:
  - `rule_layer_score`: Score from rule logic
  - `ai_layer`: AI intent, explanation, and score
  - `total_score`: Sum of rule and AI scores

## Notes
- Results are available in both JSON and downloadable CSV format.
- Requires a valid Google GenAI API key.
