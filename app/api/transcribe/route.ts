import { NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 接收更多參數：customVocab (詞彙), customPrompt (自訂模式指令)
    const { audio, mode, customVocab, customPrompt } = body;

    if (!audio) return NextResponse.json({ error: '無音訊' }, { status: 400 });

    const apiKey = request.headers.get('x-openai-key') || process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: '未設定 API Key' }, { status: 500 });

    const openai = new OpenAI({ apiKey });
    
    // 1. 轉錄 (加入自訂詞彙)
    const file = await toFile(Buffer.from(audio, 'base64'), 'audio.webm', { type: 'audio/webm' });
    const transcription = await openai.audio.transcriptions.create({
      file, 
      model: 'whisper-1', 
      language: 'zh',
      // 如果前端有傳自訂詞彙就用，沒有就用預設
      prompt: customVocab || "Talking Journal, 繁體中文, 筆記, 逐字稿", 
      temperature: 0.2,
    });
    const rawText = transcription.text || "";

    // 2. 根據模式整理 (加入自訂模式)
    let systemPrompt = "你是一個貼心的筆記助手。請將語音內容整理成筆記。";
    
    if (mode === 'summary') systemPrompt = "請提供【精煉重點摘要】，列點說明，去除贅字。";
    else if (mode === 'verbose') systemPrompt = "請提供【詳盡逐字稿】，保留對話細節但修飾語氣使其通順。";
    else if (mode === 'polish') systemPrompt = "重點是【優化修飾】。請完整保留原文的語意與細節，不要過度刪減，但將用字遣詞修飾得更優美流暢。務必加入一個自然的「開場白」與「總結性結尾」。";
    else if (mode === 'fun') systemPrompt = "請用【幽默風趣】的風格改寫，可以使用生動的比喻或流行語。";
    else if (mode === 'formal') systemPrompt = "請用【嚴肅職場】的風格改寫，用詞精確，適合正式匯報。";
    else if (mode === 'custom') systemPrompt = customPrompt || "請依照使用者的自訂需求進行改寫。"; // 🔥 自訂模式

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: rawText }
        ],
    });

    return NextResponse.json({
      text: completion.choices[0].message.content || rawText,
    });

  } catch (error: any) {
    console.error('Transcribe Error:', error);
    return NextResponse.json({ error: error.message || '轉錄失敗' }, { status: 500 });
  }
}