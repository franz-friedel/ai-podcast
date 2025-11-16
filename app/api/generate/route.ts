import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// Empirical word model: ~150 WPM speaking speed
const WPM = 150;

function estimateWordCount(minutes: number) {
  return Math.floor(minutes * WPM);
}

export async function POST(req: Request) {
  try {
    const {
      mode,
      name,
      topic,
      minutes,
      speakerA,
      speakerB
    } = await req.json();

    const words = estimateWordCount(minutes);

    let prompt = '';

    if (mode === 'dialogue') {
      prompt = `
Generate a DIALOGUE podcast script.

Speaker A: ${speakerA}
Speaker B: ${speakerB}
Topic: ${topic}

Length: about ${minutes} minutes (~${words} words).

Requirements:
- Natural back-and-forth conversation
- 2–4 sentence turns
- Timecodes every 30–60 seconds like [00:45]
- Use labels:
  ${speakerA}: …
  ${speakerB}: …
- Include a 1-sentence intro & outro
- Must state: “This is an AI-generated simulation.”

Return ONLY the script.
`.trim();
    } else {
      prompt = `
Generate a SOLO podcast script.

Voice role: ${name}
Topic: ${topic}
Length: about ${minutes} minutes (~${words} words).

Include:
- 1-line intro
- Timecodes every 30–60 seconds
- 1-line outro
- This is an AI simulation.

Return ONLY the script.
`.trim();
    }

    // Generate script text
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: 'You produce accurate, timed podcast scripts.' },
        { role: 'user', content: prompt }
      ]
    });

    const script = completion.choices[0].message?.content || '';

    // Convert script to speech using ElevenLabs
const elevenResponse = await fetch(
  "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID",
  {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVEN_API_KEY!,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: script,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8
      }
    })
  }
);

const audioBuffer = Buffer.from(await elevenResponse.arrayBuffer());
const audioBase64 = audioBuffer.toString("base64");
const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

    return NextResponse.json({
      script,
      audioUrl
    });
  } catch (err: any) {
    return new NextResponse(err.message || 'Error', { status: 500 });
  }
}
