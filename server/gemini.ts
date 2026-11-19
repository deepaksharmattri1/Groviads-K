import {
  GoogleGenAI,
  ThinkingLevel,
  type Content,
} from '@google/genai';

export type ChatRolePreset = 'strategist' | 'architect' | 'analyst' | 'concierge';
export type FreeChatModel = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';

const ROLE_INSTRUCTIONS: Record<ChatRolePreset, string> = {
  strategist:
    'You are the Senior Growth Strategist at GROVIADS. Give sharp, structured recommendations across SEO, performance marketing, conversion funnels, and brand positioning. Keep advice actionable, transparent on assumptions, and avoid inventing client metrics.',
  architect:
    'You are the Principal Solutions Architect at GROVIADS. Advise on web/mobile application architecture, cloud automation, API integrations, CRM workflows, and end-to-end security. Prefer clean, maintainable engineering blueprints.',
  analyst:
    'You are the Business Intelligence & Analytics Lead at GROVIADS. Help businesses design executive KPI trees, attribution pipelines, reporting cadence, and experimentation frameworks.',
  concierge:
    'You are the GROVIADS Client Concierge. Answer concisely about GROVIADS services (Digital Marketing, Software Engineering, Business Intelligence, AI Automation), free 30-minute discovery consultations, and how to submit a project scope.',
};

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Open Settings > Secrets in AI Studio to attach your Gemini API key.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function normalizeGeminiError(error: unknown): { status: number; message: string } {
  let raw = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string; code?: number; status?: string } };
    if (parsed?.error?.message) {
      raw = `${parsed.error.code || ''} ${parsed.error.status || ''} ${parsed.error.message}`.trim();
    }
  } catch {
    // raw is plain text
  }
  const lower = raw.toLowerCase();
  if (lower.includes('api_key') || lower.includes('api key') || lower.includes('not configured')) {
    return {
      status: 400,
      message:
        'Gemini API key is missing or invalid. Please check GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (lower.includes('permission_denied') || lower.includes('403')) {
    return {
      status: 403,
      message:
        'Gemini API permission denied. Please verify your GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429')) {
    return {
      status: 429,
      message:
        'Gemini API rate limit or quota reached. Please wait a moment or check your quota in Settings > Secrets.',
    };
  }
  if (lower.includes('unavailable') || lower.includes('503') || lower.includes('high demand') || lower.includes('overloaded')) {
    return {
      status: 503,
      message:
        'This Gemini model is currently experiencing high demand. Please retry in a few seconds or switch to gemini-3.1-flash-lite.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 404,
      message: 'Requested Gemini model endpoint was not found.',
    };
  }
  return { status: 500, message: raw || 'Gemini request failed.' };
}

export interface ChatTurnInput {
  role: 'user' | 'model';
  text: string;
}

export async function runMultiTurnChat(params: {
  history: ChatTurnInput[];
  message: string;
  rolePreset: ChatRolePreset;
  model: FreeChatModel;
  thinkingDepth?: 'low' | 'high';
}): Promise<{ text: string; model: FreeChatModel; rolePreset: ChatRolePreset }> {
  const ai = getAiClient();
  const formattedHistory: Content[] = params.history
    .filter((h) => h.text && h.text.trim().length > 0)
    .map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

  const systemInstruction =
    ROLE_INSTRUCTIONS[params.rolePreset] || ROLE_INSTRUCTIONS.strategist;

  const config: Record<string, unknown> = {
    systemInstruction,
  };

  if (params.model === 'gemini-4-hydrogen') {
    config.thinkingConfig = {
      thinkingLevel:
        params.thinkingDepth === 'high' ? ThinkingLevel.HIGH : ThinkingLevel.LOW,
    };
  }

  const chat = ai.chats.create({
    model: params.model,
    history: formattedHistory,
    config,
  });

  const response = await chat.sendMessage({
    message: params.message,
  });

  return {
    text: response.text ?? '',
    model: params.model,
    rolePreset: params.rolePreset,
  };
}

export interface GroundedWebSource {
  title: string;
  uri: string;
}

export async function runSearchGroundedQuery(prompt: string): Promise<{
  text: string;
  sources: GroundedWebSource[];
}> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are a market intelligence researcher for GROVIADS. Use Google Search grounding to answer with up-to-date facts, concise executive bullets, and clear takeaways.',
      tools: [{ googleSearch: {} }],
    },
  });

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();
  const sources: GroundedWebSource[] = [];
  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      sources.push({
        title: chunk.web?.title || uri,
        uri,
      });
    }
  }

  return {
    text: response.text ?? '',
    sources,
  };
}

export interface GroundedMapsSource {
  title: string;
  uri: string;
  placeId?: string;
  reviewSnippets: string[];
}

export async function runMapsGroundedQuery(params: {
  prompt: string;
  latitude?: number;
  longitude?: number;
}): Promise<{
  text: string;
  places: GroundedMapsSource[];
}> {
  const ai = getAiClient();
  const hasCoords =
    typeof params.latitude === 'number' &&
    Number.isFinite(params.latitude) &&
    typeof params.longitude === 'number' &&
    Number.isFinite(params.longitude);

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: params.prompt,
    config: {
      systemInstruction:
        'You are a location strategy advisor for GROVIADS. Use Google Maps grounding to provide accurate local market insights and place recommendations. Format output in clean Markdown.',
      tools: [{ googleMaps: {} }],
      ...(hasCoords
        ? {
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: params.latitude!,
                  longitude: params.longitude!,
                },
              },
            },
          }
        : {}),
    },
  });

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();
  const places: GroundedMapsSource[] = [];
  for (const chunk of chunks) {
    const maps = chunk.maps;
    if (maps?.uri && !seen.has(maps.uri)) {
      seen.add(maps.uri);
      const snippets: string[] = [];
      const reviewSources = (maps as { placeAnswerSources?: { reviewSnippets?: Array<{ content?: string }> } })
        .placeAnswerSources?.reviewSnippets;
      if (Array.isArray(reviewSources)) {
        for (const r of reviewSources) {
          if (r?.content) snippets.push(r.content);
        }
      }
      places.push({
        title: maps.title || 'Google Maps Place',
        uri: maps.uri,
        placeId: maps.placeId,
        reviewSnippets: snippets,
      });
    }
  }

  return {
    text: response.text ?? '',
    places,
  };
}
