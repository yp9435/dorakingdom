import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
    if (!process.env.GOOGLE_API_KEY) {
        return new Response(JSON.stringify({ error: 'API key not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const body = await request.json();
        const prompt = body.prompt;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Clean up the response if it contains markdown
        if (text.includes('```')) {
            // Extract JSON content between backticks
            const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
            if (jsonMatch) {
                text = jsonMatch[1];
            }
        }
        
        // Validate that the text is valid JSON
        try {
            JSON.parse(text); // Test if it's valid JSON
        } catch (e) {
            throw new Error('Invalid JSON response from AI');
        }

        return new Response(JSON.stringify({ text }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 
