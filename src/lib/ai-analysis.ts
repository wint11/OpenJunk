
import OpenAI from 'openai';

// Define the shape of the extracted metadata
export interface ExtractedMetadata {
  title?: string;
  authors?: string[]; // List of author names
  affiliations?: string[]; // List of units/universities
  abstract?: string;
  journalName?: string; // If detected
  keywords?: string[];
}

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || 'mock-key', 
  baseURL: 'https://api.deepseek.com',
});

export async function analyzeTextWithAI(text: string): Promise<ExtractedMetadata> {
  // Check if we have a valid key
  if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
    console.warn("API Key not found. Returning mock metadata.");
    return {
      title: "基于人工智能的智能投稿系统设计与实现",
      authors: ["张三", "李四"],
      affiliations: ["清华大学计算机系", "北京大学信息科学学院"],
      abstract: "本文提出了一种基于大语言模型的智能投稿系统，能够自动提取稿件元数据并推荐合适的期刊...",
      journalName: "计算机学报",
      keywords: ["人工智能", "投稿系统", "大语言模型"]
    };
  }

  try {
    const prompt = `
      You are an expert academic editor. Extract the following metadata from the text below (which is the beginning of a research paper).
      Return ONLY a valid JSON object. Do not include markdown formatting (like \`\`\`json).
      
      Fields to extract:
      - title: The paper title
      - authors: Array of author names
      - affiliations: Array of author affiliations/units
      - abstract: The abstract text (if present)
      - journalName: The target journal name (if explicitly mentioned)
      - keywords: Array of keywords

      Text to analyze:
      "${text.slice(0, 2000)}" 
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "deepseek-chat", 
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content returned from AI");

    const result = JSON.parse(content);
    return result as ExtractedMetadata;

  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Return empty/partial structure on error to prevent crash
    return {};
  }
}
