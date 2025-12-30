import { NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai'; // 加入 toFile 工具

export async function POST(request: Request) {
  try {
    // 1. 檢查 API Key 
    const apiKey = request.headers.get('x-openai-key') || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('錯誤：未找到 API Key');
      return NextResponse.json({ error: '未設定 API Key' }, { status: 500 });
    }

    // 🔥【關鍵修改】適應新的 JSON 格式
    // 以前是 request.formData()，現在改成 request.json()
    const body = await request.json();
    const base64Audio = body.audio;

    if (!base64Audio) {
      return NextResponse.json({ error: '未接收到音訊數據' }, { status: 400 });
    }

    // 2. 把 Base64 字串轉回 OpenAI 看得懂的檔案格式
    // 這一步是把「文字」變回「聲音」的關鍵
    const audioBuffer = Buffer.from(base64Audio, 'base64');
    const file = await toFile(audioBuffer, 'recording.webm', { type: 'audio/webm' });

    console.log(`正在轉錄檔案, 大小約: ${audioBuffer.length} bytes`);

    // 3. 初始化 OpenAI
    const openai = new OpenAI({ apiKey });

    // 🔥【關鍵字優化設定】(保留原本的設定)
    const keywordPrompt = "Soft Voice Notes, Talking Journal, 精煉重點, 詳盡逐字, 幽默風格, 嚴肅職場, 筆記, 摘要, 追加錄音, Append, Segment";

    // 4. 呼叫 Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'zh',      // 強制繁體中文
      prompt: keywordPrompt, 
      temperature: 0.2,    
    });

    console.log('轉寫結果:', transcription.text);

    // 5. 回傳結果給前端
    return NextResponse.json({
      text: transcription.text || '',
    });

  } catch (error: any) {
    console.error('Whisper API 錯誤詳情:', error);
    return NextResponse.json(
      { error: error.message || '轉錄失敗' },
      { status: 500 }
    );
  }
}