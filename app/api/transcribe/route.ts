import { NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

export async function POST(request: Request) {
  try {
    // 1. 安全地讀取 JSON
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("JSON 解析失敗:", e);
      return NextResponse.json({ error: '無效的 JSON 格式' }, { status: 400 });
    }

    // 2. 檢查必要欄位
    const { audio, message, customPrompt } = body;

    if (!audio) {
      return NextResponse.json({ error: '未接收到音訊數據 (audio 欄位為空)' }, { status: 400 });
    }

    // 3. 檢查 API Key
    const apiKey = request.headers.get('x-openai-key') || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: '未設定 API Key' }, { status: 500 });
    }

    // 4. 處理音訊轉檔
    const audioBuffer = Buffer.from(audio, 'base64');
    const file = await toFile(audioBuffer, 'recording.webm', { type: 'audio/webm' });

    // 5. 呼叫 OpenAI
    const openai = new OpenAI({ apiKey });
    
    // 優先使用前端傳來的自訂提示詞，如果沒有就用預設的
    const prompt = customPrompt || "Soft Voice Notes, Talking Journal, 繁體中文";

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'zh',
      prompt: prompt,
      temperature: 0.2,
    });

    return NextResponse.json({
      text: transcription.text || '',
    });

  } catch (error: any) {
    console.error('API 處理錯誤:', error);
    return NextResponse.json(
      { error: error.message || '伺服器內部錯誤' },
      { status: 500 }
    );
  }
}