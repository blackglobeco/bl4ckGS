import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';


async function urlToGenerativePart(url: string, mimeType: string) {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer'
    });

    console.log(response.data);

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
      return error.message;
    } else {
      return 'Unknown error occurred'; 
    }
  }
}

export async function getAIOutput(imageurl:string) {
  try {
    const apikey = process.env.GEMINI_API_KEY;
    if (!apikey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    const genAI = new GoogleGenerativeAI(apikey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = "List all countries, cities, districts, street addresses, postal codes, and landmarks this photo satisfies in a string array in square brackets. If it doesn't satisfy any, return an empty array.";

    // Await the asynchronous function and handle possible null result
    const img = await urlToGenerativePart(imageurl, "image/jpeg");
    if (!img) {
      console.error('Failed to get image data.');
      return null;
    }

    const result = await model.generateContent([prompt, img]);
    const response = await result.response;
    const text = await response.text();

    // Instead of just logging, return the text
    return text;
  } catch (error) {
    if (error instanceof Error) {
      return error.message; // Return the error message as a string
    } else {
      return 'Unknown error occurred'; // Fallback error message
    }
  }
}
