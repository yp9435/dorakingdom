import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
    if (!process.env.GOOGLE_API_KEY) {
        return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    try {
        const { prompt } = await request.json();
        
        // Initialize the model with explicit configuration
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            generationConfig: {
                temperature: 0.9,
                topK: 1,
                topP: 1,
                maxOutputTokens: 2048,
            },
        });

        // Generate content
        const generation = await model.generateContent(prompt);
        const result = await generation.response;
        const text = result.text();

        return Response.json({ text });
        
    } catch (error) {
        console.error('API Error:', error);
        return Response.json(
            { error: 'Error connecting to Gemini API: ' + error.message }, 
            { status: 500 }
        );
    }
} 