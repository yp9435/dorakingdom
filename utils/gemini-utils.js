import { GoogleGenerativeAI } from '@google/generative-ai';

let pdfContent = ''; // Store PDF content globally

export const setPDFContent = (content) => {
  pdfContent = content;
};

export const getPDFContent = () => {
  return pdfContent;
};

export async function analyzeContent(text) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Analyze this text and provide the main topic in 2-3 words: ${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw new Error('Failed to analyze content');
  }
}

export async function getGeminiResponse(userInput, hasPDF = false) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    let prompt = '';
    if (hasPDF && pdfContent) {
      prompt = `Context: The following is the content of a PDF document: ${pdfContent.substring(0, 10000)}

User Question: ${userInput}

Please provide a relevant response based on the PDF content if the question is related to it. If the question is not related to the PDF, provide a general response. Keep the response concise and informative.`;
    } else {
      prompt = `User Question: ${userInput}
Please provide a helpful and informative response. Keep it concise and natural.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini response error:', error);
    throw new Error('Failed to get response from AI');
  }
}

export async function extractMainIdeasForVideo(text) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
    Extract the main educational concepts or topics from this text that would be useful for finding relevant educational videos. Format the response as 2-3 key search terms that would work well with YouTube's search algorithm: ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini video topic error:', error);
    throw new Error('Failed to extract video topics');
  }
}