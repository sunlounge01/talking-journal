import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    // 1. 取得資料與 Key
    const apiKey = request.headers.get('x-openai-key') || process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No API Key' }, { status: 500 });

    const { text, mode, customStyle } = await request.json(); // 🔥 接收 customStyle
    const openai = new OpenAI({ apiKey });

    // 2. 設定 System Prompt
    let systemPrompt = `
      你是一個專業的繁體中文編輯與校對人員。
      使用者的輸入是由語音轉文字生成的，可能包含同音異字或語意不通的錯誤。
      
      你的任務是：
      1. 先修正明顯的錯別字與同音字。
      2. 根據使用者的模式要求進行改寫。
      
      請回傳 JSON 格式：
      {
        "title": "短標題 (15字內)",
        "content": "改寫後的內容",
        "tags": ["標籤1", "標籤2", "標籤3"]
      }
    `;

    // 針對模式的微調
    if (mode === 'summary') {
      systemPrompt += "模式要求：請將內容整理成條理分明的「重點摘要」，使用列點符號 (Bullet points)，去除口語贅字。";
    } else if (mode === 'verbose') {
      systemPrompt += "模式要求：保留完整細節與對話脈絡，潤飾成通順流暢的完整文章，不要過度刪減。";
    } else if (mode === 'fun') {
      systemPrompt += "模式要求：將語氣改為幽默、生動，適合發布在社群媒體，適當加入 Emoji。";
    } else if (mode === 'formal') {
      systemPrompt += "模式要求：將語氣改為正式、專業，適合用於商務郵件或報告。";
    } else if (mode === 'custom') {
      // 🔥 自訂模式邏輯
      systemPrompt += `模式要求：請完全依照使用者定義的風格進行改寫。使用者的風格指示為：「${customStyle || '請自由發揮'}」。`;
    }

    // 3. 呼叫 GPT
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

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Rewrite API Error:', error);
    return NextResponse.json({ error: 'AI 整理失敗' }, { status: 500 });
  }
}