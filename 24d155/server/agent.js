const { GoogleGenerativeAI } = require('@google/generative-ai');

async function processArticles(rawArticles, topics) {
  if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Please set GOOGLE_API_KEY in the .env file.');
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  const results = [];
  const batchSize = 5; // Process in batches of 5 to avoid giant prompts

  for (let i = 0; i < rawArticles.length; i += batchSize) {
    const batch = rawArticles.slice(i, i + batchSize);
    
    const prompt = `
You are an expert AI news curator. I will provide a list of news articles.
For each article, you must:
1. Determine if it fits into any of these user-selected topics: ${topics.join(', ')}. If it doesn't fit any, label it "Uncategorized".
2. Score the sentiment from -1.0 (very negative) to +1.0 (very positive).
3. Determine the sentiment label: "Positive", "Negative", or "Neutral".
4. Write a concise 3-sentence summary based on the provided title and summary snippet. Make it sound professional.
5. Extract or infer exactly 5 key bullet-point highlights.

Return the result as a valid JSON array of objects. Do not wrap in markdown \`\`\`json blocks, just return raw JSON.
Each object must have this exact structure:
{
  "original_id": "the id provided",
  "category": "The matched topic or 'Uncategorized'",
  "sentiment": 0.0,
  "sentimentLabel": "Neutral",
  "summary": "3 sentence summary...",
  "highlights": ["point 1", "point 2", "point 3", "point 4", "point 5"]
}

Here are the articles:
${JSON.stringify(batch.map(a => ({ id: a.id, title: a.title, content: a.summary })), null, 2)}
`;

    try {
      const response = await model.generateContent(prompt);
      let text = response.response.text();
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      const parsedBatch = JSON.parse(text);
      
      parsedBatch.forEach(parsed => {
        if (parsed.category === 'Uncategorized' || !topics.includes(parsed.category)) return;

        const original = batch.find(a => a.id === parsed.original_id);
        if (original) {
          results.push({
            id: original.id,
            title: original.title,
            source: original.source,
            publishedAt: original.publishedAt,
            url: original.url,
            category: parsed.category,
            sentiment: parsed.sentiment,
            sentimentLabel: parsed.sentimentLabel,
            summary: parsed.summary,
            highlights: parsed.highlights
          });
        }
      });
    } catch (err) {
      console.error('Error processing batch:', err.message);
    }
  }

  // Group by category and limit to top 5
  const grouped = {};
  topics.forEach(t => grouped[t] = { icon: '📰', articles: [] }); // default icon

  results.forEach(r => {
    if (grouped[r.category]) {
      grouped[r.category].articles.push(r);
    }
  });

  Object.keys(grouped).forEach(cat => {
    grouped[cat].articles = grouped[cat].articles.slice(0, 5);
  });

  return grouped;
}

module.exports = { processArticles };
