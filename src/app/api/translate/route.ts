import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text, from, to } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
  }
  try {
    const prompt = `Translate the following medical text from ${from} to ${to}. Only return the translated text.\n\n${text}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a medical translation assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 512,
        temperature: 0.3,
      }),
    });
    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content?.trim() || '';
    return NextResponse.json({ translated });
  } catch (e) {
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
} 