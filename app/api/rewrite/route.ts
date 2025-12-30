import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, mode, customStyle } = body;

    if (!text) return NextResponse.json({ error: '無文字內容' }, { status: 400 });

    const apiKey = request.headers.get('x-openai-key') || process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: '未設定 API Key' }, { status: 500 });

    const openai = new OpenAI({ apiKey });

    // 設定 AI 的基本人設
    let systemPrompt = "你是一個專業的文字編輯與筆記整理助手。請將使用者的語音逐字稿整理成一篇完整的文章。請回傳 JSON 格式，包含 title (標題), content (內容), tags (標籤陣列)。";
    
    // 🔥 根據模式調整指令
    if (mode === 'summary') {
        systemPrompt += " 重點是【精煉摘要】，列點說明，去除贅字，只保留核心資訊。";
    }
    else if (mode === 'verbose') {
        systemPrompt += " 重點是【保留細節】，盡量還原對話內容，但修飾掉口語贅字讓語句通順。";
    }
    else if (mode === 'polish') {
        // 🔥 這是你指定的新模式
        systemPrompt += " 重點是【優化修飾】。請完整保留原文的語意與細節，不要過度刪減，但將用字遣詞修飾得更優美流暢。務必加入一個自然的「開場白」與「總結性結尾」，讓整段文字看起來像是一篇結構完整的日記或文章。";
    }
    else if (mode === 'fun') {
        systemPrompt += " 風格要【幽默風趣】，可以使用生動的語言、譬喻或網路流行語，讓內容讀起來很有趣。";
    }
    else if (mode === 'formal') {
        systemPrompt += " 風格要【嚴肅專業】，使用正式的商務或學術用語，適合用於職場匯報或正式文件。";
    }
    else if (mode === 'custom') {
        systemPrompt += ` 請依照此自訂風格改寫：${customStyle}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" }, 
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json({
      title: result.title || "未命名筆記",
      content: result.content || text,
      tags: result.tags || []
    });

  } catch (error: any) {
    console.error('Rewrite Error:', error);
    return NextResponse.json({ error: error.message || '改寫失敗' }, { status: 500 });
  }
}