export const dynamic = "force-dynamic";
export const runtime = "edge";

const UPSTREAM_STREAM = "https://tfc-radio.netlify.app/stream/americana-hq.mp3";

export async function GET() {
  const upstream = await fetch(UPSTREAM_STREAM, {
    headers: {
      "Accept": "*/*",
    },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Stream unavailable", { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache, no-store",
      "Transfer-Encoding": "chunked",
    },
  });
}
