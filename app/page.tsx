'use client';

import React, { useState } from 'react';

export default function PodcastPage() {
  const [mode, setMode] = useState<'monologue' | 'dialogue'>('monologue');
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [minutes, setMinutes] = useState(5);

  const [speakerA, setSpeakerA] = useState('');
  const [speakerB, setSpeakerB] = useState('');

  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [ttsError, setTtsError] = useState('');

  function estimateWords(m: number) {
    return Math.round((m || 1) * 150);
  }

  function base64ToBlob(base64: string, mime = 'audio/mpeg') {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setTtsError('');
    setScript('');
    setAudioUrl('');

    if (!topic.trim()) {
      setError('Topic is required.');
      return;
    }

    if (mode === 'dialogue' && (!speakerA.trim() || !speakerB.trim())) {
      setError('Both speakers are required in dialogue mode.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          name,
          topic,
          minutes,
          speakerA,
          speakerB,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Request failed');
      }

      const data = await res.json();
      setScript(data.script || '');

      if (data.ttsError) {
        setTtsError(data.ttsError);
      }

      if (data.audioBase64) {
        const blob = base64ToBlob(data.audioBase64);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setName('');
    setTopic('');
    setMinutes(5);
    setSpeakerA('');
    setSpeakerB('');
    setScript('');
    setAudioUrl('');
    setError('');
    setTtsError('');
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-2">AI Podcast Generator</h1>
      <p className="text-gray-300 mb-8">
        Generate monologue or dialogue podcasts. Voices are AI-generated using ElevenLabs.
      </p>

      <form
        onSubmit={handleGenerate}
        className="bg-neutral-900 p-6 rounded-2xl w-full max-w-3xl"
      >
        {/* Mode */}
        <label className="block mb-2 text-gray-300">Mode</label>
        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === 'monologue'}
              onChange={() => setMode('monologue')}
            />
            Monologue
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === 'dialogue'}
              onChange={() => setMode('dialogue')}
            />
            Dialogue
          </label>
        </div>

        {/* Name or Speakers */}
        {mode === 'monologue' ? (
          <div className="mb-4">
            <label className="block text-gray-300 mb-1">Name / Role</label>
            <input
              className="w-full rounded-xl bg-neutral-800 p-3"
              placeholder='e.g. "Tech entrepreneur"'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Speaker A</label>
              <input
                className="w-full rounded-xl bg-neutral-800 p-3"
                value={speakerA}
                onChange={(e) => setSpeakerA(e.target.value)}
                placeholder="e.g. Host"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Speaker B</label>
              <input
                className="w-full rounded-xl bg-neutral-800 p-3"
                value={speakerB}
                onChange={(e) => setSpeakerB(e.target.value)}
                placeholder="e.g. Guest"
              />
            </div>
          </>
        )}

        {/* Topic */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Topic</label>
          <input
            className="w-full rounded-xl bg-neutral-800 p-3"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Rockets, AI, finance, psychology..."
          />
        </div>

        {/* Length */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-1">
            Length (minutes) – approx {estimateWords(minutes)} words
          </label>
          <input
            className="w-full rounded-xl bg-neutral-800 p-3"
            type="number"
            min={1}
            max={60}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 bg-white text-black p-3 rounded-xl font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Generating…' : 'Generate Podcast'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-6 bg-neutral-700 rounded-xl"
          >
            Reset
          </button>
        </div>

        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
        {ttsError && !error && (
          <p className="text-yellow-400 mt-4 text-sm">
            Script generated, but audio failed: {ttsError}
          </p>
        )}
      </form>

      {/* Audio */}
      {audioUrl && (
        <div className="mt-10 max-w-3xl">
          <h2 className="text-xl mb-2 font-semibold">Audio</h2>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      {/* Script */}
      {script && (
        <div className="mt-10 max-w-3xl">
          <h2 className="text-xl mb-2 font-semibold">Script</h2>
          <pre className="bg-neutral-900 p-6 rounded-2xl whitespace-pre-wrap">
            {script}
          </pre>
        </div>
      )}
    </main>
  );
}