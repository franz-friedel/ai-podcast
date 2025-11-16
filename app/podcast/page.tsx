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

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setScript('');
    setAudioUrl('');

    if (!topic.trim()) {
      setError('Topic is required.');
      return;
    }

    if (mode === 'dialogue' && (!speakerA.trim() || !speakerB.trim())) {
      setError('Both speakers are required for dialogue mode.');
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
          speakerB
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      setScript(data.script);
      setAudioUrl(data.audioUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setName('');
    setTopic('');
    setMinutes(5);
    setScript('');
    setAudioUrl('');
    setSpeakerA('');
    setSpeakerB('');
    setError('');
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-2">AI Podcast Generator</h1>
      <p className="text-gray-300 mb-8">
        Create monologue or dialogue podcasts with AI-generated voices and scripts.
      </p>

      {/* Form */}
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

        {/* Name (monologue only) */}
        {mode === 'monologue' && (
          <div className="mb-4">
            <label className="block text-gray-300 mb-1">Name</label>
            <input
              className="w-full rounded-xl bg-neutral-800 p-3"
              placeholder="Voice role, e.g. 'Historian' or 'Tech Analyst'"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        {/* Speaker A / B */}
        {mode === 'dialogue' && (
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
            placeholder="Rockets, AI, Finance, Psychology..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        {/* Length */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-1">Length (minutes)</label>
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
            className="flex-1 bg-white text-black p-3 rounded-xl font-semibold"
            disabled={loading}
          >
            {loading ? 'Generating…' : 'Generate Podcast'}
          </button>

          <button
            type="button"
            className="px-6 bg-neutral-700 rounded-xl"
            onClick={reset}
          >
            Reset
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 mt-4 text-sm">{error}</p>
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
