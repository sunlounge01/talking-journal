'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Mic, Square, Calendar as CalendarIcon, List as ListIcon, 
  Settings as SettingsIcon, ChevronLeft, Copy, Share2, 
  Trash2, Play, Search, Plus, Edit3 
} from 'lucide-react';

// --- 設定與型別 ---
type View = 'home' | 'list' | 'detail' | 'calendar' | 'settings';
type Mode = 'summary' | 'verbose' | 'polish' | 'fun' | 'formal' | 'custom';

interface Note {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  duration: number;
  mode: Mode;
  tags: string[];
  folderId: string;
}

// 🔥 完整模式列表 (Grid 排版用)
const MODES: { id: Mode; label: string }[] = [
  { id: 'summary', label: '精煉重點' },
  { id: 'verbose', label: '詳盡逐字' },
  { id: 'polish', label: '優化修飾' },
  { id: 'fun', label: '幽默風格' },
  { id: 'formal', label: '嚴肅職場' },
  { id: 'custom', label: '✨ 自訂風格' },
];

export default function Home() {
  // --- 狀態 ---
  const [view, setView] = useState<View>('home');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [mode, setMode] = useState<Mode>('summary');
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  
  // 設定相關狀態
  const [apiKey, setApiKey] = useState('');
  const [customVocab, setCustomVocab] = useState(''); // 自訂詞彙
  const [customPrompt, setCustomPrompt] = useState(''); // 自訂模式指令

  const [searchQuery, setSearchQuery] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [statusText, setStatusText] = useState(''); 
  const [appendTargetId, setAppendTargetId] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // --- 初始化讀取 ---
  useEffect(() => {
    const savedNotes = localStorage.getItem('tj_notes_v1');
    const savedKey = localStorage.getItem('tj_openai_api_key');
    const savedVocab = localStorage.getItem('tj_custom_vocab');
    const savedPrompt = localStorage.getItem('tj_custom_prompt');

    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedKey) setApiKey(savedKey);
    if (savedVocab) setCustomVocab(savedVocab);
    if (savedPrompt) setCustomPrompt(savedPrompt);
    
    const today = new Date();
    setSelectedDateStr(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`);
  }, []);

  // --- 自動存檔 ---
  useEffect(() => { localStorage.setItem('tj_notes_v1', JSON.stringify(notes)); }, [notes]);

  const saveSettings = () => {
    localStorage.setItem('tj_openai_api_key', apiKey);
    localStorage.setItem('tj_custom_vocab', customVocab);
    localStorage.setItem('tj_custom_prompt', customPrompt);
    alert('所有設定已儲存！');
    setView('home');
  };

  // --- 🔥 視覺化引擎 (依據你的圖片高度還原) ---
  const initVisualizer = (stream: MediaStream) => {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    const audioCtx = new AudioContextClass();
    audioContextRef.current = audioCtx;
    
    const analyser = audioCtx.createAnalyser();
    // 這裡設為 64，代表我們會拿到 32 個頻率數據，適合畫出約 20 條粗一點的長條
    analyser.fftSize = 64; 
    // 讓跳動稍微平滑一點，不會閃爍太快
    analyser.smoothingTimeConstant = 0.5; 
    analyserRef.current = analyser;
    
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const draw = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      ctx.clearRect(0, 0, width, height);
      
      // 設定長條數量與間距
      const barCount = 22; 
      const spacing = 6; // 間距
      const totalSpacing = (barCount - 1) * spacing;
      const barWidth = (width - totalSpacing) / barCount;

      // 為了不讓長條圖太過擁擠，我們取樣 dataArray
      const step = Math.floor(bufferLength / barCount);

      for(let i = 0; i < barCount; i++) {
        // 取得音量強度 (0~255)
        const value = dataArray[i]; // 這裡可以做 i * step 如果條數少
        const percent = value / 255;
        
        // 計算高度：最少顯示 10% 高度 (像膠囊)，最高 90%
        // 乘上 1.2 讓說話時跳動明顯一點
        let barHeight = Math.max(barWidth, height * percent * 1.2);
        
        // 限制最大高度不超過畫布
        if (barHeight > height) barHeight = height;

        const x = i * (barWidth + spacing);
        const y = height - barHeight; // 底部對齊

        // 🔥 顏色交替：深綠(#8fc1a3) 與 淺綠(#c8d6af)
        ctx.fillStyle = i % 2 === 0 ? '#8fc1a3' : '#c8d6af'; 
        
        ctx.beginPath();
        // 畫圓角矩形 (Capsule) - 圓角半徑設為寬度的一半
        if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        } else {
            // 舊瀏覽器兼容
            ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  // --- 錄音邏輯 ---
  const startRecording = async () => {
    if (!apiKey) {
        alert('請先到設定頁面輸入 OpenAI API Key');
        setView('settings');
        return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      initVisualizer(stream);
      
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(blob);
        
        stream.getTracks().forEach(t => t.stop());
        if (audioContextRef.current) audioContextRef.current.close();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      };

      mr.start();
      setIsRecording(true);
      setStatusText(appendTargetId ? '正在追加錄音...' : '錄音中...');
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

    } catch (err) {
      alert('無法存取麥克風');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatusText('處理中...');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleStartAppend = () => {
    if (!currentNote) return;
    setAppendTargetId(currentNote.id);
    setView('home');
  };

  const processAudio = async (blob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = (reader.result as string).split(',')[1];
      
      try {
        setStatusText('AI 正在思考...');
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-openai-key': apiKey 
          },
          // 傳送 mode, customVocab, customPrompt
          body: JSON.stringify({ 
            audio: base64Audio, 
            mode: mode,
            customVocab: customVocab,
            customPrompt: customPrompt
          })
        });

        if (!res.ok) throw new Error('API 請求失敗');
        const data = await res.json();

        if (appendTargetId) {
            // 追加模式
            setNotes(prev => prev.map(n => {
                if (n.id === appendTargetId) {
                    const updatedNote = {
                        ...n,
                        text: n.text + '\n\n' + data.text,
                        duration: n.duration + recordingTime
                    };
                    setCurrentNote(updatedNote);
                    return updatedNote;
                }
                return n;
            }));
            setAppendTargetId(null);
            setView('detail');
        } else {
            // 新增模式
            const newNote: Note = {
                id: Date.now().toString(),
                title: data.text.slice(0, 10) + (data.text.length > 10 ? '...' : ''),
                text: data.text,
                createdAt: new Date().toISOString(),
                duration: recordingTime,
                mode: mode,
                tags: [],
                folderId: 'default'
            };
            setNotes(prev => [newNote, ...prev]);
            setCurrentNote(newNote);
            setView('detail');
        }
        setStatusText('');

      } catch (e) {
        alert('處理失敗: ' + (e as Error).message);
        setStatusText('失敗');
      }
    };
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const deleteNote = (id: string) => {
    if (confirm('確定刪除？')) {
        setNotes(prev => prev.filter(n => n.id !== id));
        setView('list');
    }
  };

  // --- 畫面渲染 ---
  return (
    <div className="min-h-screen bg-[#f0f5f0] text-[#2d4030] font-sans flex justify-center">
      <div className="w-full max-w-md p-6 flex flex-col relative min-h-screen">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div onClick={() => { setView('home'); setAppendTargetId(null); }} className="cursor-pointer">
            <div className="text-[10px] tracking-[0.3em] uppercase opacity-60">Talking Journal</div>
            <h1 className="text-2xl font-black text-[#4a7c59]">Soft Voice Notes</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('calendar')} className={`w-9 h-9 rounded-full flex items-center justify-center transition ${view === 'calendar' ? 'bg-[#4a7c59] text-white' : 'bg-white shadow-sm'}`}>
              <CalendarIcon size={16} />
            </button>
            <button onClick={() => setView('list')} className={`w-9 h-9 rounded-full flex items-center justify-center transition ${view === 'list' ? 'bg-[#4a7c59] text-white' : 'bg-white shadow-sm'}`}>
              <ListIcon size={16} />
            </button>
            <button onClick={() => setView('settings')} className={`w-9 h-9 rounded-full flex items-center justify-center transition ${view === 'settings' ? 'bg-[#4a7c59] text-white' : 'bg-white shadow-sm'}`}>
              <SettingsIcon size={16} />
            </button>
          </div>
        </header>

        {/* 1. 首頁 (Home) */}
        {view === 'home' && (
          <div className="flex-1 flex flex-col animate-in fade-in">
            {appendTargetId && currentNote ? (
                 <div className="mb-4 text-center bg-[#dde6dd] py-2 rounded-xl text-xs font-bold text-[#4a7c59]">
                    正在追加到：{currentNote.title}
                 </div>
            ) : (
                <div className="text-sm opacity-70 mb-4">
                  {new Date().toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'long' })}
                </div>
            )}

            {/* 🔥 模式選擇 (Grid Layout: 5 columns) */}
            <div className="w-full mb-6">
              <p className="text-xs opacity-60 mb-2 font-bold tracking-widest uppercase">MODE</p>
              <div className="grid grid-cols-5 gap-2">
                {MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`w-full h-9 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center text-center shadow-sm active:scale-95 ${
                      mode === m.id 
                        ? 'bg-[#4a7c59] text-white' 
                        : 'bg-[#dde6dd] text-[#2d4030] hover:bg-[#c8d6af]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 錄音按鈕 */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-32 h-32 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${
                    isRecording ? 'bg-[#4a7c59] scale-105' : 'bg-[#4a7c59]'
                  }`}
                >
                  {isRecording ? <Square size={32} /> : <Mic size={40} />}
                </button>
                {isRecording && (
                  <div className="absolute -bottom-8 left-0 right-0 flex justify-center">
                    <span className="bg-white px-2 py-0.5 rounded-full text-[10px] shadow-sm flex items-center gap-1 text-[#4a7c59]">
                      <span className="w-2 h-2 bg-[#4a7c59] rounded-full animate-pulse"/> 錄音中
                    </span>
                  </div>
                )}
              </div>
              {statusText && <p className="mt-12 text-sm text-[#4a7c59] font-bold animate-pulse">{statusText}</p>}
            </div>

            {/* 🔥 視覺化卡片 (膠囊狀、深淺綠) */}
            <div className="mt-8 bg-white rounded-3xl p-4 shadow-[0_18px_45px_rgba(74,124,89,0.18)]">
              <div className="flex justify-between text-[11px] opacity-60 mb-2">
                <span className="tracking-widest">INPUT LEVEL</span>
                <span className="tracking-widest">{formatTime(recordingTime)}</span>
              </div>
              {/* 背景也是淺綠色，配合膠囊 */}
              <div className="bg-[#f0f5f0] rounded-2xl h-24 border border-[#c8d6af]/70 overflow-hidden relative flex items-end justify-center pb-2">
                 <canvas ref={canvasRef} width={320} height={96} className="w-full h-full" />
              </div>
              <p className="text-[11px] opacity-70 mt-2 text-center">
                {isRecording ? '正在聆聽...' : (appendTargetId ? '準備追加錄音...' : '對著麥克風說話，如果看到長條圖跳動，就代表麥克風正常運作。')}
              </p>
            </div>
            
            {appendTargetId && (
                <button 
                    onClick={() => { setAppendTargetId(null); setView('detail'); }}
                    className="mt-4 w-full py-3 rounded-full bg-white text-[#4a7c59] font-bold text-sm shadow-sm"
                >
                    取消追加
                </button>
            )}
          </div>
        )}

        {/* 2. 列表 (List) */}
        {view === 'list' && (
          <div className="flex-1 animate-in slide-in-from-right">
            <h2 className="font-bold text-xl mb-4">我的筆記</h2>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 opacity-40 w-4 h-4"/>
                <input 
                    type="text" 
                    placeholder="搜尋筆記..." 
                    className="w-full bg-white rounded-full pl-9 pr-4 py-2 text-xs border border-[#dde6dd] focus:outline-none focus:border-[#4a7c59]"
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="space-y-3">
                {notes.filter(n => n.title.includes(searchQuery) || n.text.includes(searchQuery)).map(n => (
                    <div key={n.id} onClick={() => { setCurrentNote(n); setView('detail'); }} className="bg-white p-4 rounded-2xl shadow-sm cursor-pointer hover:-translate-y-0.5 transition-transform">
                        <div className="font-bold text-[15px] mb-1 truncate">{n.title}</div>
                        <div className="flex justify-between text-[11px] opacity-60">
                            <span>{new Date(n.createdAt).toLocaleDateString()} · {MODES.find(m=>m.id===n.mode)?.label}</span>
                            <span>{formatTime(n.duration)}</span>
                        </div>
                    </div>
                ))}
                {notes.length === 0 && <div className="text-center text-xs opacity-50 mt-10">還沒有筆記，去錄一段吧！</div>}
            </div>
          </div>
        )}

        {/* 3. 詳情 (Detail) */}
        {view === 'detail' && currentNote && (
          <div className="flex-1 flex flex-col animate-in slide-in-from-right pb-24">
            <button onClick={() => setView('list')} className="text-xs font-bold opacity-80 mb-4 flex items-center">
                <ChevronLeft size={14}/> 返回
            </button>
            <div className="text-[11px] opacity-60 mb-1">{new Date(currentNote.createdAt).toLocaleString()}</div>
            <input 
                className="text-xl font-bold bg-transparent border-b border-[#c8d6af] pb-1 mb-4 focus:outline-none focus:border-[#4a7c59]"
                value={currentNote.title}
                onChange={e => {
                    const updated = { ...currentNote, title: e.target.value };
                    setCurrentNote(updated);
                    setNotes(prev => prev.map(n => n.id === currentNote.id ? updated : n));
                }}
            />
            
            <div className="bg-white rounded-3xl p-5 shadow-sm flex-1 flex flex-col mb-4">
                <div className="flex justify-between mb-3">
                    <div className="text-xs font-bold text-[#4a7c59] bg-[#f0f5f0] px-2 py-1 rounded-full">
                        {MODES.find(m=>m.id===currentNote.mode)?.label}
                    </div>
                    <button onClick={() => deleteNote(currentNote.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={16}/>
                    </button>
                </div>
                <textarea 
                    className="flex-1 w-full resize-none outline-none text-sm leading-relaxed"
                    value={currentNote.text}
                    onChange={e => {
                        const updated = { ...currentNote, text: e.target.value };
                        setCurrentNote(updated);
                        setNotes(prev => prev.map(n => n.id === currentNote.id ? updated : n));
                    }}
                />
                <div className="border-t border-[#dde6dd] mt-4 pt-3 flex gap-3">
                    <button onClick={() => navigator.clipboard.writeText(currentNote.text)} className="flex items-center gap-1 text-xs bg-[#f0f5f0] px-3 py-1.5 rounded-full hover:bg-[#dde6dd]">
                        <Copy size={12}/> 複製
                    </button>
                    <button className="flex items-center gap-1 text-xs bg-[#f0f5f0] px-3 py-1.5 rounded-full hover:bg-[#dde6dd]">
                        <Share2 size={12}/> 分享
                    </button>
                </div>
            </div>

            <div className="fixed bottom-6 left-0 right-0 flex justify-center px-6 pointer-events-none">
                <button 
                    onClick={handleStartAppend}
                    className="pointer-events-auto w-full max-w-sm bg-[#8fc1a3] text-[#2d4030] py-3 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-[#7db091] active:scale-95 transition"
                >
                    <Plus size={18}/> 追加錄音 Append
                </button>
            </div>
          </div>
        )}

        {/* 4. 日曆 (Calendar) */}
        {view === 'calendar' && (
            <div className="flex-1 animate-in slide-in-from-right">
                <h2 className="font-bold text-xl mb-4">日曆總覽</h2>
                <div className="bg-white p-4 rounded-3xl shadow-sm mb-4">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <button onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth()-1)))} className="hover:bg-gray-100 rounded-full p-1">‹</button>
                        <span className="font-bold text-sm">{calendarDate.getFullYear()} 年 {calendarDate.getMonth()+1} 月</span>
                        <button onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth()+1)))} className="hover:bg-gray-100 rounded-full p-1">›</button>
                    </div>
                    <div className="grid grid-cols-7 text-center text-[10px] opacity-60 mb-2">
                        {['日','一','二','三','四','五','六'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {(() => {
                            const year = calendarDate.getFullYear();
                            const month = calendarDate.getMonth();
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            const firstDay = new Date(year, month, 1).getDay();
                            const days = [];
                            
                            for(let i=0; i<firstDay; i++) days.push(<div key={`empty-${i}`}/>);
                            
                            for(let d=1; d<=daysInMonth; d++) {
                                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                                const hasNote = notes.some(n => n.createdAt.startsWith(dateStr));
                                const isSelected = selectedDateStr === dateStr;
                                
                                days.push(
                                    <button 
                                        key={d}
                                        onClick={() => setSelectedDateStr(dateStr)}
                                        className={`h-8 w-8 rounded-full flex flex-col items-center justify-center text-xs relative ${isSelected ? 'bg-[#4a7c59] text-white' : 'hover:bg-[#f0f5f0]'}`}
                                    >
                                        {d}
                                        {hasNote && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#4a7c59]'}`}/>}
                                    </button>
                                );
                            }
                            return days;
                        })()}
                    </div>
                </div>
                
                <div className="text-xs opacity-70 mb-2">{selectedDateStr} 的筆記</div>
                <div className="space-y-2">
                    {notes.filter(n => n.createdAt.startsWith(selectedDateStr || '')).map(n => (
                        <div key={n.id} onClick={() => { setCurrentNote(n); setView('detail'); }} className="bg-white p-3 rounded-2xl shadow-sm flex justify-between items-center cursor-pointer">
                            <span className="font-bold text-sm truncate w-2/3">{n.title}</span>
                            <span className="text-[10px] opacity-60">{formatTime(n.duration)}</span>
                        </div>
                    ))}
                    {notes.filter(n => n.createdAt.startsWith(selectedDateStr || '')).length === 0 && (
                        <div className="text-center text-xs opacity-40 py-4">這天沒有筆記</div>
                    )}
                </div>
            </div>
        )}

        {/* 5. 設定 (Settings) 🔥 全新升級：含自訂詞彙 & 自訂指令 */}
        {view === 'settings' && (
            <div className="flex-1 animate-in slide-in-from-right overflow-y-auto pb-6">
                <h2 className="font-bold text-xl mb-4">設定</h2>
                
                {/* API Key */}
                <div className="bg-white p-6 rounded-3xl shadow-sm mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <SettingsIcon size={16} className="text-[#4a7c59]"/>
                        <label className="text-xs font-bold opacity-80">OpenAI API Key</label>
                    </div>
                    <input 
                        type="password" 
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full bg-[#f0f5f0] p-3 rounded-xl text-sm outline-none border border-transparent focus:border-[#4a7c59]"
                    />
                </div>

                {/* 自訂詞彙 */}
                <div className="bg-white p-6 rounded-3xl shadow-sm mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Edit3 size={16} className="text-[#4a7c59]"/>
                        <label className="text-xs font-bold opacity-80">自訂詞彙 (Context Prompt)</label>
                    </div>
                    <p className="text-[10px] opacity-50 mb-2">輸入專有名詞、人名或特殊術語，以逗號分隔，幫助 AI 更精準辨識。</p>
                    <textarea 
                        value={customVocab}
                        onChange={e => setCustomVocab(e.target.value)}
                        placeholder="例如：台積電, 區塊鏈, Soft Notes, 精煉重點..."
                        className="w-full bg-[#f0f5f0] p-3 rounded-xl text-sm h-20 outline-none border border-transparent focus:border-[#4a7c59] resize-none"
                    />
                </div>

                {/* 自訂模式指令 */}
                <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Play size={16} className="text-[#4a7c59]"/>
                        <label className="text-xs font-bold opacity-80">自訂模式指令 (Custom Prompt)</label>
                    </div>
                    <p className="text-[10px] opacity-50 mb-2">當選擇「自訂風格」模式時，AI 將依照此指令進行改寫。</p>
                    <textarea 
                        value={customPrompt}
                        onChange={e => setCustomPrompt(e.target.value)}
                        placeholder="例如：請用詩意的語言改寫，並加入比喻..."
                        className="w-full bg-[#f0f5f0] p-3 rounded-xl text-sm h-24 outline-none border border-transparent focus:border-[#4a7c59] resize-none"
                    />
                </div>

                <button onClick={saveSettings} className="w-full bg-[#4a7c59] text-white py-3 rounded-full font-bold shadow-md active:scale-95 transition">
                    儲存所有設定
                </button>
            </div>
        )}

      </div>
    </div>
  );
}