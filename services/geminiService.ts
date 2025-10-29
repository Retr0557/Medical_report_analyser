// FIX: Import GenerateContentResponse for proper typing of API results.
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import type { AnalysisPayload } from '../types';

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    parameters: {
      type: Type.ARRAY,
      description: "List of all extracted health parameters.",
      items: {
        type: Type.OBJECT,
        properties: {
          parameter: { type: Type.STRING, description: "Name of the health parameter (e.g., 'Hemoglobin', 'Glucose')." },
          value: { type: Type.STRING, description: "The measured value, formatted as a string (e.g., '14.1', 'Negative'). Use the string 'null' if not present." },
          unit: { type: Type.STRING, description: "The unit of measurement (e.g., 'g/dL', 'mg/dL'). Use the string 'null' if not present." },
          referenceRange: { type: Type.STRING, description: "The normal or reference range for the parameter. Use the string 'null' if not present." }
        },
        required: ["parameter", "value", "unit", "referenceRange"]
      }
    },
    summary: {
      type: Type.STRING,
      description: "A brief, neutral summary of the key findings in the report. This summary MUST NOT contain any medical advice."
    }
  },
  required: ["parameters", "summary"]
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 2, delayMs = 1000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < retries + 1; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      let isRetriable = false;
      if (err instanceof Error) {
        try {
          const errorObj = JSON.parse(err.message);
          if (errorObj.error && errorObj.error.status === 'UNAVAILABLE') {
            isRetriable = true;
          }
        } catch (e) {
          if (err.message.includes('503') || err.message.toLowerCase().includes('unavailable')) {
            isRetriable = true;
          }
        }
      }

      if (isRetriable && i < retries) {
        const delay = delayMs * Math.pow(2, i); // Exponential backoff
        console.warn(`API call failed, retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw lastError;
      }
    }
  }
  throw lastError;
};


export const analyzeMedicalReport = async (
  input: { content: string; mimeType: string }
): Promise<AnalysisPayload> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const model = 'gemini-2.5-pro';
    const promptInstructions = `
      You are a professional medical report analysis assistant.
      Your task is to extract all health parameters from the provided document (text, image, or PDF), organize them into the specified JSON format, and provide a neutral summary of the results.

      RULES:
      1.  Extract all identifiable health parameters, their values, units, and reference ranges.
      2.  All extracted data points (parameter, value, unit, referenceRange) MUST be formatted as strings in the JSON output. For example, a numeric value of 12.5 should be returned as the string "12.5".
      3.  If any piece of data (value, unit, reference range) for a parameter is unclear or missing, you MUST use the literal string 'null'. Do not use the actual null type in the JSON.
      4.  You MUST NEVER give any medical advice or interpretation. Your role is to neutrally extract and summarize the data present in the report.
      5.  Your entire response MUST be a single valid JSON object that adheres to the provided schema.
      6.  The summary should be a short text summary based ONLY on the provided report.
    `;

    let requestContents;

    if (input.mimeType === 'text/plain') {
        requestContents = `${promptInstructions}\n\nMedical Report Text:\n---\n${input.content}\n---`;
    } else {
        const filePart = {
            inlineData: {
                mimeType: input.mimeType,
                data: input.content, // base64 string
            },
        };
        const textPart = {
            text: `${promptInstructions}\n\nExtract the data from the provided file.`,
        };
        requestContents = { parts: [textPart, filePart] };
    }

    const apiCall = () => ai.models.generateContent({
        model,
        contents: requestContents,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        }
    });
    
    // FIX: Add explicit type annotation for the response object.
    const response: GenerateContentResponse = await withRetry(apiCall);

    const jsonString = response.text.trim();
    try {
        const parsedJson = JSON.parse(jsonString);
        parsedJson.parameters = parsedJson.parameters.map((p: any) => ({
            ...p,
            value: p.value === 'null' ? null : p.value,
            unit: p.unit === 'null' ? null : p.unit,
            referenceRange: p.referenceRange === 'null' ? null : p.referenceRange
        }));
        return parsedJson;
    } catch (e) {
        console.error("Failed to parse Gemini response:", e);
        console.error("Raw response:", jsonString);
        throw new Error("The API returned an invalid JSON format.");
    }
};

export const startChatSession = (analysisResult: AnalysisPayload): Chat => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const formattedParameters = analysisResult.parameters.map(p => 
        `- ${p.parameter}: ${p.value ?? 'N/A'} ${p.unit ?? ''} (Reference Range: ${p.referenceRange ?? 'N/A'})`
    ).join('\n');

    const baseSystemInstruction = `You are a friendly and helpful health assistant. Your main goal is to have a natural conversation with the user about their medical report. Use the report data below to answer their questions in a clear and simple way. Feel free to handle informal questions like "what's up with my hemoglobin?" or "tell me about glucose."

Here are your guidelines:
1.  If the user asks about something from their report, explain what that medical term means in simple language.
2.  You can mention the user's specific result from their report (e.g., "Your report shows your Hemoglobin is 14 g/dL"), but do not, under any circumstances, interpret it or say if it's "good" or "bad".
3.  THE MOST IMPORTANT RULE: You are an AI assistant, not a doctor. You MUST NEVER give medical advice, a diagnosis, or tell the user what they should do about their results.
4.  If a user asks for advice, interpretation, or a diagnosis, you must politely decline and strongly recommend they consult with a qualified healthcare professional. This is for their safety.
5.  Keep your explanations easy to understand for someone without a medical background.`;
    
    const reportContext = `
--- USER'S REPORT CONTEXT ---
Summary: ${analysisResult.summary}

Parameters:
${formattedParameters}
---
`;

    const fullSystemInstruction = `${baseSystemInstruction}\n\n${reportContext}`;
    
    const model = 'gemini-2.5-flash';
    return ai.chats.create({
        model,
        config: {
            systemInstruction: fullSystemInstruction,
        },
    });
};