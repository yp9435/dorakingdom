import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
    if (!process.env.GOOGLE_API_KEY) {
        return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const body = await request.json();
        const prompt = body.prompt;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return Response.json({ text });
    } catch (error) {
        console.error('Generation error:', error);
        return Response.json({ error: 'Failed to generate content' }, { status: 500 });
    }
} 