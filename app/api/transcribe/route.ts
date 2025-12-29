import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    // 1. 檢查 API Key 
    // 優先使用前端傳來的 Key (從 Settings 設定的)，如果沒有則使用環境變數
    const apiKey = request.headers.get('x-openai-key') || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('錯誤：未找到 API Key');
      return NextResponse.json({ error: '未設定 API Key' }, { status: 500 });
    }

    // 2. 獲取上傳的檔案
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未接收到音訊檔案' }, { status: 400 });
    }

    // 3. 初始化 OpenAI
    const openai = new OpenAI({ apiKey });

    // 🔥【關鍵字優化設定】
    // 這裡放入您希望 AI 優先辨識出的詞彙，能有效減少同音異字錯誤
    // 例如：App 名稱、特定術語、您的名字等
    const keywordPrompt = "Soft Voice Notes, Talking Journal, 精煉重點, 詳盡逐字, 幽默風格, 嚴肅職場, 筆記, 摘要, 追加錄音, Append, Segment";

    console.log(`正在轉錄檔案: ${file.name}, 大小: ${file.size} bytes`);

    // 4. 呼叫 Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'zh',      // 強制繁體中文，避免 AI 偶爾講英文
      prompt: keywordPrompt, // 傳入提示詞以修正特定名詞
      temperature: 0.2,    // 降低隨機性，提高準確度
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