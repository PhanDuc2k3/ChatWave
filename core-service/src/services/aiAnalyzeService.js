const axios = require("axios");

async function analyzeWithOpenAI(systemPrompt, userPrompt, apiKey) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 30000,
    }
  );

  return response.data.choices?.[0]?.message?.content || '{"actions": []}';
}

async function analyzeWithClaude(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://1gw.gwai.cloud";
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await axios.post(
    `${baseUrl}/v1/messages`,
    {
      model: model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      timeout: 30000,
    }
  );

  const content = response.data.content?.[0]?.text;
  if (!content) {
    throw new Error("Claude returned empty response");
  }

  return content;
}

module.exports = {
  analyzeWithOpenAI,
  analyzeWithClaude,
};
