import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { AnalysisPayload } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
          value: { type: Type.STRING, description: "The measured value. Can be a number or string. Use 'null' as a string if not present." },
          unit: { type: Type.STRING, description: "The unit of measurement (e.g., 'g/dL', 'mg/dL'). Use 'null' as a string if not present." },
          referenceRange: { type: Type.STRING, description: "The normal or reference range for the parameter. Use 'null' as a string if not present." }
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


export const analyzeMedicalReport = async (input: { content: string; mimeType: string }): Promise<AnalysisPayload> => {
    const model = 'gemini-2.5-pro';
    const promptInstructions = `
      You are a professional medical report analysis assistant.
      Your task is to extract all health parameters from the provided document (text, image, or PDF), organize them into the specified JSON format, and provide a neutral summary of the results.

      RULES:
      1.  Extract all identifiable health parameters, their values, units, and reference ranges.
      2.  If any piece of data (value, unit, reference range) for a parameter is unclear or missing, you MUST represent it as the string 'null'.
      3.  You MUST NEVER give any medical advice or interpretation. Your role is to neutrally extract and summarize the data present in the report.
      4.  Your entire response MUST be a single valid JSON object that adheres to the provided schema.
      5.  The summary should be a short text summary based ONLY on the provided report.
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

    const response = await ai.models.generateContent({
        model,
        contents: requestContents,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        }
    });

    const jsonString = response.text.trim();
    try {
        // The API should return a valid JSON string based on the schema.
        const parsedJson = JSON.parse(jsonString);
        // Normalize 'null' strings to actual null values for consistency in the app
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

export const startChatSession = (): Chat => {
    const model = 'gemini-2.5-flash';
    return ai.chats.create({
        model,
        config: {
            systemInstruction: 'You are a helpful assistant providing general medical information. The user has just had a medical report analyzed. You can answer general questions, but you MUST NOT provide personalized medical advice or interpret their specific results. If asked to interpret their results, politely decline and suggest they speak with a healthcare professional.',
        },
    });
};