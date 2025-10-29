import { GoogleGenAI, Type, Chat } from "@google/genai";
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


export const analyzeMedicalReport = async (
  input: { content: string; mimeType: string },
  apiKey: string
): Promise<AnalysisPayload> => {
    if (!apiKey) throw new Error("API Key is required.");
    const ai = new GoogleGenAI({ apiKey });

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

export const startChatSession = (apiKey: string, analysisResult: AnalysisPayload): Chat => {
    if (!apiKey) throw new Error("API Key is required.");
    const ai = new GoogleGenAI({ apiKey });
    
    const formattedParameters = analysisResult.parameters.map(p => 
        `- ${p.parameter}: ${p.value ?? 'N/A'} ${p.unit ?? ''} (Reference Range: ${p.referenceRange ?? 'N/A'})`
    ).join('\n');

    const baseSystemInstruction = `You are a helpful assistant providing general medical information. The user has just had a medical report analyzed. Your primary goal is to answer questions about the extracted parameters using the data provided below as context.

RULES:
1.  When asked about a specific parameter (e.g., "What is Hemoglobin?"), provide a general explanation of what that parameter is and its function in the body.
2.  You can reference the user's specific value from their report if they ask about it, but you MUST NOT interpret it. For example, you can say "Your report shows a Hemoglobin value of 14 g/dL."
3.  You MUST NEVER give personalized medical advice, a diagnosis, or an opinion on whether their results are "good" or "bad".
4.  If the user asks for interpretation, advice, or a diagnosis, you MUST politely decline and strongly recommend they consult with a qualified healthcare professional.
5.  Keep your answers concise and easy to understand for a layperson.`;
    
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