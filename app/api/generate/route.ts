import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs"; // important for Buffer

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const WPM = 150;
function estimateWords(minutes: number) {
  const m = Math.max(1, Math.min(60, Number(minutes) || 5));
  return Math.round(m * WPM);
}

export async function POST(req: Request) {
  try {
    const {
      mode,
      name,
      topic,
      minutes,
      speakerA,
      speakerB,
    } = await req.json();

    const targetWords = estimateWords(minutes);

    let userPrompt: string;

    if (mode === "dialogue") {
      userPrompt = `
Generate a DIALOGUE podcast script.

Speaker A: ${speakerA}
Speaker B: ${speakerB}
Topic: ${topic}
Length: about ${minutes} minutes (~${targetWords} words).

Requirements:
- Natural back-and-forth conversation
- 2–4 sentence turns
- Timecodes every 30–60 seconds like [00:45]
- Use labels exactly:
  ${speakerA}: …
  ${speakerB}: …
- Include a 1-sentence intro & 1-sentence outro
- Make it clear this is an AI-generated simulation of the speakers.

Return ONLY the script text.
`.trim();
    } else {
      userPrompt = `
Generate a SOLO podcast script.

Voice role / name: ${name}
Topic: ${topic}
Length: about ${minutes} minutes (~${targetWords} words).

Include:
- A 1-sentence intro
- Timecodes every 30–60 seconds like [00:45]
- A 1-sentence outro
- A short line that this is an AI simulation, not the real person.

Return ONLY the script text.
`.trim();
    }

    // 1) Generate script with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "You are a senior audio producer. Produce clean podcast scripts with timecodes.",
        },
        { role: "user", content: userPrompt },
      ],
    });

    const script = completion.choices[0]?.message?.content ?? "";

    // 2) Convert script to speech with ElevenLabs
    const voiceId = process.env.ELEVEN_VOICE_ID; // set this in .env.local
    if (!voiceId) {
      console.warn("ELEVEN_VOICE_ID not set – returning script only.");
      return NextResponse.json({ script, audioBase64: null });
    }

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY || "",
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
          },
        }),
      }
    );

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      console.error(
        "ElevenLabs TTS error:",
        elevenRes.status,
        elevenRes.statusText,
        errText
      );
      // Return script so UI still works; no audio
      return NextResponse.json({
        script,
        audioBase64: null,
        ttsError: "ElevenLabs TTS failed",
      });
    }

    const audioBuffer = Buffer.from(await elevenRes.arrayBuffer());
    const audioBase64 = audioBuffer.toString("base64");

    return NextResponse.json({ script, audioBase64 });
  } catch (err: any) {
    console.error("API /generate error:", err);
    return new NextResponse(err?.message || "Server error", { status: 500 });
  }
}