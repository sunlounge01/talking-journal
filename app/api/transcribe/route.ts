import { NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

export async function POST(request: Request) {
  try {
    // 1. 讀取前端寄來的 JSON
    const body = await request.json();
    const { audio, prompt } = body;

    if (!audio) {
      return NextResponse.json({ error: '未接收到音訊數據' }, { status: 400 });
    }

    // 2. 驗證金鑰
    const apiKey = request.headers.get('x-openai-key') || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: '未設定 API Key' }, { status: 500 });
    }

    // 3. 處理音檔 (Base64 -> File)
    const audioBuffer = Buffer.from(audio, 'base64');
    const file = await toFile(audioBuffer, 'recording.webm', { type: 'audio/webm' });

    // 4. 呼叫 Whisper 轉錄
    const openai = new OpenAI({ apiKey });
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'zh', // 強制繁體中文
      prompt: prompt || "Talking Journal, 繁體中文, 筆記, 逐字稿", // 使用前端傳來的提示詞
      temperature: 0.2,
    });

    // 5. 回傳原始文字
    return NextResponse.json({
      text: transcription.text || '',
    });

  } catch (error: any) {
    console.error('Transcribe Error:', error);
    return NextResponse.json({ error: error.message || '轉錄失敗' }, { status: 500 });
  }
}