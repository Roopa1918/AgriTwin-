// AgriTwin — Netlify Serverless Function for Google Gemini Plant Diagnosis
// Executes server-side in Node environment so GEMINI_API_KEY is never exposed to the frontend.

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { imageBase64, mimeType, cropName, plantPart, userApiKey, language } = body;

    const apiKey = process.env.GEMINI_API_KEY || userApiKey;

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'NO_API_KEY',
        message: 'Google Gemini API key is not configured on the server. Set GEMINI_API_KEY in your Netlify site settings or enter your key.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({
        error: 'MISSING_IMAGE',
        message: 'No photograph was provided for analysis.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const cleanMime = mimeType || 'image/jpeg';

    const langInstruction = language === 'kn'
      ? 'CRITICAL LANGUAGE REQUIREMENT: You MUST write "observation", "possibleCause", "symptoms", "suggestedAction", "confidence", and "clarityFeedback" in natural, farmer-friendly KANNADA (ಕನ್ನಡ) so a Karnataka farmer can easily understand it. Keep scientific accuracy intact.'
      : language === 'hi'
      ? 'CRITICAL LANGUAGE REQUIREMENT: You MUST write "observation", "possibleCause", "symptoms", "suggestedAction", "confidence", and "clarityFeedback" in natural, farmer-friendly HINDI (हिन्दी) so an Indian farmer can easily understand it. Keep scientific accuracy intact.'
      : 'LANGUAGE REQUIREMENT: Write all output fields in simple, farmer-friendly English.';

    const prompt = `You are an expert agricultural botanist and plant pathologist assisting smallholder farmers.
Analyze this photograph of a crop/plant part (Crop context: ${cropName || 'Farm crop'}, Plant part: ${plantPart || 'Leaf / Stem / Fruit'}).

${langInstruction}

Carefully evaluate:
1. Is this photograph of a plant, crop, leaf, stem, fruit, or agricultural specimen? If not, clearly state that.
2. Is the photograph clear and in focus enough to observe symptoms? If it is blurry, dark, or too distant, clearly state that the image is insufficient and ask the farmer to take a clearer, well-lit close-up.
3. What visible damage, lesions, discoloration, or abnormalities exist?
4. What is the most plausible cause? Distinguish carefully between:
   - Plant disease (fungal, bacterial, viral)
   - Pest damage (insects, caterpillars, mites, chewing, sucking)
   - Nutrient deficiency (nitrogen, potassium, phosphorus, zinc, iron chlorosis, etc.)
   - Environmental stress (heat, drought, waterlogging, sunscald)
   - Normal healthy growth or minor mechanical damage.
   Do NOT assume every damaged plant has a disease. If uncertain between multiple causes, explicitly explain the possibilities.
5. What specific, practical, farmer-friendly actions should the farmer do next? Prioritize low-cost cultural practices, field inspection, and safety.
6. State your confidence level honestly.

Respond ONLY with valid JSON matching this exact structure:
{
  "observation": "Clear description of what is visible in the photo",
  "possibleCause": "Assessment of likely cause(s), distinguishing disease, pest, nutrient, or environmental stress",
  "causeType": "disease | pest | nutrient | environmental | healthy | uncertain",
  "symptoms": ["Visible sign 1", "Visible sign 2"],
  "suggestedAction": "Step-by-step actionable advice for the farmer",
  "confidence": "e.g. 82% (Moderate confidence) — brown concentric leaf rings typical of early blight",
  "confidenceLevel": "high | moderate | low",
  "isPlantImage": true,
  "isClear": true,
  "clarityFeedback": null,
  "cropIdentified": "Identified or presumed crop name"
}`;

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let geminiRes = null;
    let lastError = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inlineData: { mimeType: cleanMime, data: cleanBase64 } },
                  { text: prompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        });

        if (response.ok) {
          geminiRes = await response.json();
          break;
        } else {
          const errData = await response.text();
          lastError = `Model ${model} returned ${response.status}: ${errData}`;
        }
      } catch (e) {
        lastError = e.message;
      }
    }

    if (!geminiRes) {
      return new Response(JSON.stringify({
        error: 'AI_SERVICE_ERROR',
        message: `Failed to communicate with Google Gemini API: ${lastError || 'Network or quota issue'}`
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return new Response(JSON.stringify({
        error: 'EMPTY_RESPONSE',
        message: 'Gemini API returned an empty analysis.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const parsed = JSON.parse(rawText.trim());
    return new Response(JSON.stringify({ success: true, diagnosis: parsed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'SERVER_ERROR', message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

