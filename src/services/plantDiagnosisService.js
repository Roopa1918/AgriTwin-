// AgriTwin — Plant Diagnosis Service using Google Gemini Vision AI
// Analyzes farmer-uploaded photographs of leaves, stems, fruits, and crops.
// Communicates with a secure server-side endpoint (/api/diagnose-plant) or direct Gemini API with user-provided key.

/**
 * Validates that the selected file is an allowed image format
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No image file was provided.' };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];

  const typeMatches = allowedTypes.includes(file.type);
  const extMatches = allowedExts.includes(ext);

  if (!typeMatches && !extMatches) {
    return {
      valid: false,
      error: 'Please upload a photo in JPG, JPEG, PNG, or WEBP format.'
    };
  }

  // 12MB hard limit before processing
  if (file.size > 12 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Image file size is too large (over 12MB). Please select a photo under 10MB.'
    };
  }

  return { valid: true };
}

/**
 * Scales down high-resolution mobile camera photos client-side to a max dimension of 1600px.
 * Preserves fine visual details while ensuring fast, reliable upload and staying within API limits.
 */
export function prepareImageForAnalysis(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file from device.'));
    };

    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Failed to decode image data. The file may be corrupted.'));
      };

      img.onload = () => {
        const maxDimension = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with 0.88 quality
        const mimeType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        const optimizedDataUrl = canvas.toDataURL(mimeType, 0.88);
        const base64Data = optimizedDataUrl.split(',')[1];

        resolve({
          dataUrl: optimizedDataUrl,
          base64Data,
          mimeType,
          originalName: file.name,
          originalSize: file.size,
          optimizedWidth: width,
          optimizedHeight: height
        });
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Calls the secure backend endpoint /api/diagnose-plant or direct Gemini API
 * Returns structured farmer-friendly plant health diagnosis.
 */
export async function diagnosePlantPhoto({
  base64Data,
  mimeType = 'image/jpeg',
  cropName = 'Field Crop',
  plantPart = 'Leaf',
  userApiKey = null,
  language = 'en'
}) {
  if (!base64Data) {
    throw new Error('Please upload a photograph of your crop or plant part first.');
  }

  // 1. Try secure server-side endpoint first (/api/diagnose-plant)
  // This endpoint reads process.env.GEMINI_API_KEY without exposing keys to frontend
  try {
    const response = await fetch('/api/diagnose-plant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType,
        cropName,
        plantPart,
        userApiKey: userApiKey || undefined,
        language
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.diagnosis) {
        return normalizeDiagnosis(data.diagnosis, cropName);
      }
    }

    // Check specific error responses from our backend
    if (response.status === 400 || response.status === 502) {
      const errJson = await response.json().catch(() => ({}));
      if (errJson.error === 'NO_API_KEY') {
        // If server has no key and user provided one in UI, fall back to direct client call below
        if (!userApiKey) {
          const err = new Error('NO_API_KEY');
          err.code = 'NO_API_KEY';
          err.details = 'Google Gemini API key is not configured on the server.';
          throw err;
        }
      } else if (errJson.message) {
        throw new Error(errJson.message);
      }
    }
  } catch (err) {
    if (err.code === 'NO_API_KEY') throw err;
    // If backend endpoint is unavailable (e.g. static site preview), fall through to direct call if userApiKey provided
    if (!userApiKey) {
      // If neither server responded nor user key provided, inform user
      const customErr = new Error('NO_API_KEY');
      customErr.code = 'NO_API_KEY';
      customErr.details = 'Backend diagnosis endpoint unavailable and no user API key provided.';
      throw customErr;
    }
  }

  // 2. Direct client fallback (only if user provided their key in the UI)
  if (userApiKey) {
    return await callGeminiDirectly({
      base64Data,
      mimeType,
      cropName,
      plantPart,
      apiKey: userApiKey,
      language
    });
  }

  throw new Error('No AI service or API key configured.');
}

/**
 * Direct call to Google Gemini API (used as fallback when user provides API key in UI)
 */
async function callGeminiDirectly({ base64Data, mimeType, cropName, plantPart, apiKey, language = 'en' }) {
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
                { inlineData: { mimeType, data: base64Data } },
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
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.trim());
          return normalizeDiagnosis(parsed, cropName);
        }
      } else {
        const errBody = await response.text();
        lastError = `Model ${model} error (${response.status}): ${errBody}`;
      }
    } catch (e) {
      lastError = e.message;
    }
  }

  throw new Error(`Failed to analyze image with Gemini API. ${lastError || 'Please check your API key and network connection.'}`);
}

/**
 * Normalizes and validates the diagnosis payload to match farmer-friendly format
 */
function normalizeDiagnosis(raw, fallbackCrop) {
  return {
    observation: raw.observation || 'Visible foliage examined in the uploaded photograph.',
    possibleCause: raw.possibleCause || 'Inconclusive cause based on visual signs.',
    causeType: raw.causeType || (raw.isClear === false ? 'uncertain' : 'disease'),
    symptoms: Array.isArray(raw.symptoms) && raw.symptoms.length > 0 
      ? raw.symptoms 
      : ['Visual features inspected from uploaded photograph'],
    suggestedAction: raw.suggestedAction || 'Inspect the surrounding plants and consult a local agricultural extension officer before applying treatment.',
    confidence: raw.confidence || 'Moderate confidence based on visible symptoms.',
    confidenceLevel: raw.confidenceLevel || 'moderate',
    isPlantImage: raw.isPlantImage !== false,
    isClear: raw.isClear !== false,
    clarityFeedback: raw.clarityFeedback || null,
    cropIdentified: raw.cropIdentified || fallbackCrop || 'Crop',
    analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

