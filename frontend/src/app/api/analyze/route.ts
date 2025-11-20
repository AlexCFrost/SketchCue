import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.' },
        { status: 500 }
      );
    }

    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using gemini-1.5-flash for better free tier limits:
    // - 15 RPM (requests per minute)
    // - 1 million TPM (tokens per minute)  
    // - 1,500 RPD (requests per day)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      { inlineData: { mimeType: "image/png", data: image.split(",")[1] } },
      { text: "Describe this air-drawn sketch in one creative sentence." },
    ]);

    const description = result.response.text();
    return NextResponse.json({ description });
    
  } catch (error: unknown) {
    console.error('Error analyzing sketch:', error);
    
    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message?.includes('API_KEY_INVALID')) {
        return NextResponse.json(
          { error: 'Invalid Gemini API key. Please get a valid API key from https://aistudio.google.com/app/apikey' },
          { status: 401 }
        );
      }
      
      if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429') || error.message?.includes('quota')) {
        return NextResponse.json(
          { error: 'Gemini API quota exceeded. Please wait a minute and try again, or get a new API key from https://aistudio.google.com/app/apikey' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze sketch. Please try again.' },
      { status: 500 }
    );
  }
}
