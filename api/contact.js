import { processContactSubmission } from "../lib/contact.js";

const ALLOW_HEADER = "POST, OPTIONS";

export async function POST(request) {
  const payload = await parseJson(request);
  if (payload instanceof Response) {
    return payload;
  }

  const result = await processContactSubmission(payload);
  return Response.json(result.body, { status: result.status });
}

export function GET() {
  return Response.json(
    { ok: false, error: "Method not allowed." },
    { status: 405, headers: { Allow: ALLOW_HEADER } },
  );
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { Allow: ALLOW_HEADER },
  });
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }
}
