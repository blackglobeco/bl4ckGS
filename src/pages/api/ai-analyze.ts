
import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';

async function urlToGenerativePart(url: string, mimeType: string) {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer'
    });

    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const byteSize = (base64.length * 3) / 4;
    console.log(`Base64 byte size: ${byteSize} bytes`);
    
    return {
      inlineData: {
        data: base64,
        mimeType
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('Unknown error occurred'); 
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageData } = req.body;

  if (!imageData) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const apikey = process.env.GEMINI_API_KEY;
      if (!apikey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not set' });
      }
      
      const genAI = new GoogleGenerativeAI(apikey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash"
      });

      const prompt = `Analyze this image to determine the most precise location where it was taken. Look for:

1. Readable street signs, building numbers, or addresses
2. Distinctive landmarks, monuments, or recognizable buildings
3. License plates with regional identifiers
4. Business names, storefronts, or signage
5. Architectural styles specific to regions
6. Natural landmarks or geographical features
7. Public transportation signs or station names
8. Language on signs or text visible in the image

Provide the SINGLE most specific and accurate location you can determine. Format your response as a JSON array with one location string. Examples:
- ["1600 Pennsylvania Avenue NW, Washington, DC, USA"]
- ["Eiffel Tower, Champ de Mars, Paris, France"]
- ["Times Square, New York, NY, USA"]

If you cannot determine a specific location with reasonable confidence, return ["Unknown location - insufficient visual markers"].

Be as specific as possible (street address > landmark > neighborhood > city > country).`;

      // Extract base64 data from data URL
      const base64Data = imageData.split(',')[1];
      const img = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        },
      };

      const result = await model.generateContent([prompt, img]);
      const response = await result.response;
      const text = await response.text();

      return res.status(200).json({ result: text });
    } catch (error) {
      console.error(`AI analysis attempt ${attempt} failed:`, error);
      
      // Check if it's a 503 error (service overloaded)
      if (error instanceof Error && error.message.includes('503')) {
        if (attempt < maxRetries) {
          console.log(`Retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue; // Try again
        } else {
          return res.status(503).json({ 
            error: 'The AI service is currently overloaded. Please try again in a few minutes.' 
          });
        }
      }
      
      // For other errors, return immediately
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      } else {
        return res.status(500).json({ error: 'Unknown error occurred' });
      }
    }
  }
}
