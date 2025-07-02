import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing AssemblyAI API key' }, { status: 500 });
  }
  const formData = await req.formData();
  const audio = formData.get('audio');
  if (!audio) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
  }
  try {
    // 1. Upload audio to AssemblyAI
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { 'authorization': apiKey },
      body: audio as Blob,
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.upload_url) {
      return NextResponse.json({ error: 'Failed to upload audio to AssemblyAI' }, { status: 500 });
    }
    // 2. Request transcription
    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadData.upload_url,
        language_code: 'auto',
        punctuate: true,
        format_text: true,
      }),
    });
    const transcriptData = await transcriptRes.json();
    if (!transcriptData.id) {
      return NextResponse.json({ error: 'Failed to start transcription' }, { status: 500 });
    }
    // 3. Poll for completion
    let status = transcriptData.status;
    let transcriptText = '';
    for (let i = 0; i < 30; i++) { // up to ~30 seconds
      await new Promise(res => setTimeout(res, 1000));
      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, {
        headers: { 'authorization': apiKey },
      });
      const pollData = await pollRes.json();
      status = pollData.status;
      if (status === 'completed') {
        transcriptText = pollData.text;
        break;
      } else if (status === 'error') {
        return NextResponse.json({ error: pollData.error || 'Transcription failed' }, { status: 500 });
      }
    }
    if (!transcriptText) {
      return NextResponse.json({ error: 'Transcription timed out' }, { status: 504 });
    }
    return NextResponse.json({ transcript: transcriptText });
  } catch {
    return NextResponse.json({ error: 'AssemblyAI transcription failed' }, { status: 500 });
  }
} 