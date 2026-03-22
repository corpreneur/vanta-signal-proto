import { http, HttpResponse } from "msw";

/**
 * Default MSW request handlers for tests.
 * Add handlers here for any Supabase or external API calls
 * that components make during testing.
 */

const SUPABASE_URL = "https://fwmrhpayssaiuhqzzeig.supabase.co";

export const handlers = [
  // Stub: Supabase signals select
  http.get(`${SUPABASE_URL}/rest/v1/signals`, () => {
    return HttpResponse.json([]);
  }),

  // Stub: Supabase auth session
  http.get(`${SUPABASE_URL}/auth/v1/session`, () => {
    return HttpResponse.json({ data: { session: null }, error: null });
  }),

  // Stub: Lovable AI gateway
  http.post("https://ai.gateway.lovable.dev/v1/chat/completions", () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              signalType: "MEETING",
              priority: "medium",
              summary: "Test classification",
              actionsTaken: ["NOTION_LOG"],
              confidence: 0.9,
            }),
          },
        },
      ],
    });
  }),
];
