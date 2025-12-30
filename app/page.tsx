'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { 
  Mic, Square, Trash2, Calendar as CalendarIcon, List as ListIcon, 
  Settings as SettingsIcon, ChevronLeft, Copy, 
  Search, ChevronRight, X, Play, Share2, RotateCcw, 
  Plus, Key, Save, PenTool, Book 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 型別定義 ---
type Mode = 'summary' | 'verbose' | 'fun' | 'formal' | 'custom';
type View = 'record' | 'list' | 'calendar' | 'settings' | 'detail';
type Theme = 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'custom';

// --- 主題配色系統 ---
interface ThemeColors {
  name: string;
  primary: string;        // 主要按鈕/強調色
  primaryHover: string;   // 主要按鈕懸停
  primaryLight: string;   // 淺色按鈕
  text: string;           // 主要文字
  textSecondary: string;  // 次要文字
  textTertiary: string;   // 第三級文字
  background: string;     // 背景色
  card: string;           // 卡片背景
  cardBorder: string;     // 卡片邊框
  inputBg: string;        // 輸入框背景
  visualizerActive: string; // 視覺化器活動色
  visualizerInactive: string; // 視覺化器非活動色
}

const THEMES: Record<Theme, ThemeColors> = {
  green: {
    name: '🌲 森林綠',
    primary: '#4A7C59',
    primaryHover: '#3A6B48',
    primaryLight: '#96C4A6',
    text: '#2C4A2C',
    textSecondary: '#6A8C6A',
    textTertiary: '#88A088',
    background: '#F0F5F0',
    card: '#FFFFFF',
    cardBorder: '#E8F0E8',
    inputBg: '#F0F5F0',
    visualizerActive: '#81C784',
    visualizerInactive: '#C8E6C9',
  },
  blue: {
    name: '🌊 海洋藍',
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    primaryLight: '#93C5FD',
    text: '#1E3A8A',
    textSecondary: '#4B5563',
    textTertiary: '#6B7280',
    background: '#EFF6FF',
    card: '#FFFFFF',
    cardBorder: '#DBEAFE',
    inputBg: '#EFF6FF',
    visualizerActive: '#60A5FA',
    visualizerInactive: '#BFDBFE',
  },
  purple: {
    name: '💜 夢幻紫',
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryLight: '#C4B5FD',
    text: '#4C1D95',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    background: '#F5F3FF',
    card: '#FFFFFF',
    cardBorder: '#E9D5FF',
    inputBg: '#F5F3FF',
    visualizerActive: '#A78BFA',
    visualizerInactive: '#DDD6FE',
  },
  orange: {
    name: '🍊 活力橙',
    primary: '#F97316',
    primaryHover: '#EA580C',
    primaryLight: '#FDBA74',
    text: '#9A3412',
    textSecondary: '#78716C',
    textTertiary: '#A8A29E',
    background: '#FFF7ED',
    card: '#FFFFFF',
    cardBorder: '#FFEDD5',
    inputBg: '#FFF7ED',
    visualizerActive: '#FB923C',
    visualizerInactive: '#FED7AA',
  },
  pink: {
    name: '🌸 浪漫粉',
    primary: '#EC4899',
    primaryHover: '#DB2777',
    primaryLight: '#F9A8D4',
    text: '#9F1239',
    textSecondary: '#78716C',
    textTertiary: '#A8A29E',
    background: '#FDF2F8',
    card: '#FFFFFF',
    cardBorder: '#FCE7F3',
    inputBg: '#FDF2F8',
    visualizerActive: '#F472B6',
    visualizerInactive: '#FBCFE8',
  },
  custom: {
    name: '🎨 自訂',
    primary: '#4A7C59',
    primaryHover: '#3A6B48',
    primaryLight: '#96C4A6',
    text: '#2C4A2C',
    textSecondary: '#6A8C6A',
    textTertiary: '#88A088',
    background: '#F0F5F0',
    card: '#FFFFFF',
    cardBorder: '#E8F0E8',
    inputBg: '#F0F5F0',
    visualizerActive: '#81C784',
    visualizerInactive: '#C8E6C9',
  },
};

interface AudioSegment {
  id: string;
  duration: number;
  timestamp: number;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  totalDuration: number;
  segments: AudioSegment[];
  mode: Mode;
  tags: string[];
  folderId: string;
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'summary', label: '精煉重點' },
  { id: 'verbose', label: '詳盡逐字' },
  { id: 'fun', label: '幽默風格' },
  { id: 'formal', label: '嚴肅職場' },
  { id: 'custom', label: '✨ 自訂風格' },
];

export default function Home() {
  // --- 狀態管理 ---
  const [currentView, setCurrentView] = useState<View>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedMode, setSelectedMode] = useState<Mode>('summary');
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  
  // 設定狀態
  const [apiKey, setApiKey] = useState('');
  const [customVocab, setCustomVocab] = useState('');
  const [customStylePrompt, setCustomStylePrompt] = useState('');
  const [showSettingsAlert, setShowSettingsAlert] = useState(false);
  
  // 主題狀態
  const [currentTheme, setCurrentTheme] = useState<Theme>('green');
  const [customThemeColors, setCustomThemeColors] = useState<Partial<ThemeColors>>({});
  
  // 自訂模式狀態
  const [customModePrompt, setCustomModePrompt] = useState('');
  const [customModeName, setCustomModeName] = useState('');

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const homeCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 初始化
  useEffect(() => {
    const savedNotes = localStorage.getItem('soft_notes_v2');
    const savedKey = localStorage.getItem('openai_api_key');
    const savedVocab = localStorage.getItem('openai_custom_vocab');
    const savedStyle = localStorage.getItem('openai_custom_style');
    const savedTheme = localStorage.getItem('app_theme') as Theme;
    const savedCustomTheme = localStorage.getItem('app_custom_theme');
    const savedCustomMode = localStorage.getItem('app_custom_mode');
    const savedCustomModeName = localStorage.getItem('app_custom_mode_name');
    
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedKey) setApiKey(savedKey);
    setCustomVocab(savedVocab || "Soft Voice Notes, Talking Journal, 精煉重點, 詳盡逐字, 幽默風格, 嚴肅職場, 筆記, 摘要, 追加錄音, Append");
    setCustomStylePrompt(savedStyle || "請用溫暖、感性且帶有文學氣息的筆觸改寫，類似散文風格。");
    if (savedTheme && THEMES[savedTheme]) setCurrentTheme(savedTheme);
    if (savedCustomTheme) setCustomThemeColors(JSON.parse(savedCustomTheme));
    if (savedCustomMode) setCustomModePrompt(savedCustomMode);
    if (savedCustomModeName) setCustomModeName(savedCustomModeName);
  }, []);

  useEffect(() => {
    localStorage.setItem('soft_notes_v2', JSON.stringify(notes));
  }, [notes]);

  // 初始化靜態視覺化器
  useEffect(() => {
    const timer = setTimeout(() => {
      drawStaticBars();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentTheme, customThemeColors]);

  const saveSettings = () => {
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('openai_custom_vocab', customVocab);
    localStorage.setItem('openai_custom_style', customStylePrompt);
    localStorage.setItem('app_theme', currentTheme);
    localStorage.setItem('app_custom_theme', JSON.stringify(customThemeColors));
    localStorage.setItem('app_custom_mode', customModePrompt);
    localStorage.setItem('app_custom_mode_name', customModeName);
    setShowSettingsAlert(true);
    setTimeout(() => setShowSettingsAlert(false), 2000);
  };

  const getTheme = (): ThemeColors => {
    if (currentTheme === 'custom' && Object.keys(customThemeColors).length > 0) {
      return { ...THEMES.green, ...customThemeColors } as ThemeColors;
    }
    return THEMES[currentTheme];
  };
  
  const theme = getTheme();

  // --- 繪製靜態膠囊條 ---
  const drawStaticBars = () => {
    const canvas = homeCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    const currentThemeColors = getTheme();
    const bars = 29; 
    const gap = 3;
    const barWidth = 6;
    const totalWidth = bars * (barWidth + gap) - gap;
    const startX = (canvas.width - totalWidth) / 2;
    const centerY = canvas.height / 2;
    const baseHeight = 8;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < bars; i++) {
      ctx.beginPath();
      ctx.roundRect(
        startX + i * (barWidth + gap),
        centerY - baseHeight / 2,
        barWidth,
        baseHeight,
        barWidth / 2
      );
      ctx.fillStyle = i % 2 === 0 ? currentThemeColors.visualizerActive : currentThemeColors.visualizerInactive;
      ctx.fill();
    }
  };

  // --- 視覺化 (Visualizer) ---
  const initVisualizer = (stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    audioContextRef.current = audioCtx; // 存起來以便之後關閉

    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 64;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const canvas = homeCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    // 取得當前顏色的閉包
    const draw = () => {
      if (mediaRecorderRef.current?.state !== 'recording') {
        drawStaticBars();
        return;
      }
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      const currentThemeColors = getTheme(); // 每次繪製都重新獲取主題顏色

      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const bars = 29;
        const gap = 3;
        const barWidth = 6;
        const totalWidth = bars * (barWidth + gap) - gap;
        const startX = (canvas.width - totalWidth) / 2;
        const centerY = canvas.height / 2;

        for (let i = 0; i < bars; i++) {
          const value = dataArray[i % dataArray.length] / 255;
          const baseHeight = 8; 
          const height = baseHeight + (value * 25); 
          
          ctx.beginPath();
          ctx.roundRect(
            startX + i * (barWidth + gap), 
            centerY - height / 2, 
            barWidth, 
            height, 
            barWidth / 2
          );
          
          if (value > 0.1) {
            ctx.fillStyle = i % 2 === 0 ? currentThemeColors.visualizerActive : currentThemeColors.visualizerInactive;
          } else {
            ctx.fillStyle = i % 2 === 0 ? currentThemeColors.visualizerActive : currentThemeColors.visualizerInactive;
          }
          ctx.fill();
        }
      }
    };
    draw();
  };

  // --- 錄音功能 ---
  const startRecording = async (isAppend = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      initVisualizer(stream);
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = () => handleStop(isAppend);
      mr.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) { alert('無法存取麥克風，請檢查權限。'); }
  };

  // 🔥【修正】處理停止錄音與 JSON 上傳
  const handleStop = async (isAppend = false) => {
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    setStatus('AI 正在思考中...');

    // 關閉 AudioContext 釋放資源
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
    }
    
    // 將 Blob 轉為 Base64 (解決 400 Error 的關鍵)
    const reader = new FileReader();
    reader.readAsDataURL(blob);

    reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        try {
           const headers: HeadersInit = {
             'Content-Type': 'application/json', // 告訴後端這是 JSON
           };
           if (apiKey) headers['x-openai-key'] = apiKey;

           // 呼叫我們剛剛修好的統一 API (/api/chat)
           const response = await fetch('/api/chat', { 
             method: 'POST', 
             headers, 
             body: JSON.stringify({
                audio: base64Audio, 
                message: "請幫我整理這段語音筆記",
                // 傳遞前端設定的提示詞給後端 (如果後端有支援的話，或是僅依賴後端預設)
                customPrompt: customVocab 
             }) 
           });

           if (!response.ok) {
             const errData = await response.json();
             throw new Error(errData.error || '處理失敗');
           }

           const data = await response.json();
           const text = data.text; // 這是後端回傳的文字結果

           // 建立新筆記物件
           const newSegment = { id: Date.now().toString(), duration: recordingTime, timestamp: Date.now() };
           
           if (isAppend && currentNote) {
             const updated = {
               ...currentNote,
               content: currentNote.content + '\n\n' + text,
               totalDuration: currentNote.totalDuration + recordingTime,
               segments: [...currentNote.segments, newSegment]
             };
             setNotes(prev => prev.map(n => n.id === currentNote.id ? updated : n));
             setCurrentNote(updated);
           } else {
             const newNote: Note = {
               id: Date.now().toString(),
               title: '新的語音筆記 ' + new Date().toLocaleString(), // 暫時用時間當標題
               content: text,
               createdAt: Date.now(),
               totalDuration: recordingTime,
               segments: [newSegment],
               mode: selectedMode,
               tags: [],
               folderId: 'default'
             };
             setNotes(prev => [newNote, ...prev]);
             setCurrentNote(newNote);
             setCurrentView('detail');
           }

        } catch (e: any) { 
            alert(`處理失敗: ${e.message}`); 
            setStatus('發生錯誤');
        } finally {
            setStatus(''); 
            setIsRecording(false); 
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
    };
  };

  const deleteNote = (id: string) => {
    if (confirm('確定要刪除這則筆記嗎？')) {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (currentNote?.id === id) { setCurrentNote(null); setCurrentView('list'); }
    }
  };

  // 暫時簡化的重新生成功能 (尚未實作後端 JSON 對應)
  const regenerateNote = async () => {
    alert("重新生成功能將在下一版後端更新中提供！");
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // --- 介面渲染 ---
  return (
    <main 
      className="min-h-screen flex flex-col font-sans overflow-hidden relative transition-colors"
      style={{ 
        backgroundColor: theme.background, 
        color: theme.text 
      }}
    >
      
      {/* === 詳情頁 (Detail View) === */}
      {currentView === 'detail' && currentNote ? (
        <div className="flex-1 flex flex-col p-6 pb-32 animate-in slide-in-from-right duration-300 overflow-y-auto max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-6 pt-4">
            <p className="text-[#88A088] text-[10px] font-bold tracking-[0.3em] uppercase mb-1">THE WALKING JOURNAL</p>
            <h1 className="text-3xl font-extrabold tracking-tight mb-4" style={{color: theme.primary}}>Soft Voice Notes</h1>
            <button onClick={() => setCurrentView('list')} className="flex items-center text-sm font-bold transition-colors" style={{color: theme.textSecondary}}><ChevronLeft size={16}/> 返回</button>
          </div>

          {/* Meta Info */}
          <div className="mb-4">
            <p className="text-xs font-bold mb-1" style={{color: theme.textSecondary}}>
              {new Date(currentNote.createdAt).toLocaleDateString()} 週{['日','一','二','三','四','五','六'][new Date(currentNote.createdAt).getDay()]} 下午{new Date(currentNote.createdAt).getHours() % 12}:{new Date(currentNote.createdAt).getMinutes().toString().padStart(2,'0')}
            </p>
            <input 
              className="text-3xl font-black bg-transparent outline-none w-full placeholder-opacity-50" 
              style={{color: theme.text}}
              placeholder="無標題"
              value={currentNote.title}
              onChange={(e) => {
                const updated = {...currentNote, title: e.target.value};
                setCurrentNote(updated);
                setNotes(notes.map(n => n.id === currentNote.id ? updated : n));
              }}
            />
          </div>

          {/* Audio Segments */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold" style={{color: theme.textSecondary}}>錄音片段</span>
              <span className="text-xs" style={{color: theme.textTertiary}}>共 {formatTime(currentNote.totalDuration)}</span>
            </div>
            {currentNote.segments.length > 0 ? (
              <div className="space-y-2">
                {currentNote.segments.map((seg, idx) => (
                  <div key={seg.id} className="p-4 rounded-xl flex justify-between items-center" style={{backgroundColor: theme.cardBorder}}>
                    <span className="text-sm font-bold" style={{color: theme.primary}}>Segment {idx + 1} · {formatTime(seg.duration)}</span>
                    <button className="p-2 rounded-full text-white shadow-sm hover:scale-105 transition-transform" style={{backgroundColor: theme.primary}}><Play size={14} fill="currentColor"/></button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic" style={{color: theme.textTertiary}}>目前尚無錄音片段。</p>
            )}
          </div>

          {/* Text Content */}
          <div className="rounded-[1.5rem] p-6 shadow-sm border flex-1 flex flex-col mb-3 min-h-[240px]" style={{backgroundColor: theme.card, borderColor: theme.cardBorder}}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                 <span className="text-xs font-bold" style={{color: theme.textSecondary}}>文字筆記</span>
                 <select 
                   value={currentNote.mode}
                   onChange={(e) => {
                     const updated = {...currentNote, mode: e.target.value as Mode};
                     setCurrentNote(updated);
                     setNotes(notes.map(n => n.id === currentNote.id ? updated : n));
                   }}
                   className="text-[10px] font-bold px-3 py-1 rounded-full border-none outline-none cursor-pointer"
                   style={{backgroundColor: theme.inputBg, color: theme.primary}}
                 >
                   {MODES.map(m => (
                     <option key={m.id} value={m.id}>{m.label}</option>
                   ))}
                 </select>
              </div>
            </div>
            <textarea 
              className="flex-1 w-full bg-transparent outline-none leading-loose text-lg resize-none"
              style={{color: theme.text}}
              value={currentNote.content}
              onChange={(e) => {
                const updated = {...currentNote, content: e.target.value};
                setCurrentNote(updated);
                setNotes(notes.map(n => n.id === currentNote.id ? updated : n));
              }}
            />
            {/* Action Bar */}
            <div className="flex gap-2 mt-4 pt-4">
              <button className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:opacity-80 transition-opacity" style={{backgroundColor: theme.inputBg, color: theme.primary}} onClick={() => {navigator.clipboard.writeText(currentNote.content); alert('已複製');}}><Copy size={14}/> 複製</button>
              <button className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:opacity-80 transition-opacity" style={{backgroundColor: theme.inputBg, color: theme.primary}}><Share2 size={14}/> 分享</button>
              <div className="flex-1"></div>
              <button onClick={() => deleteNote(currentNote.id)} className="bg-[#FEE2E2] text-red-500 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-[#FECACA]"><Trash2 size={14}/> 刪除</button>
            </div>
          </div>

          {/* Append Button */}
          <div className="w-full">
            {isRecording && (
              <div className="w-full rounded-[2rem] p-6 shadow-sm border mb-3" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
                <div className="flex justify-between items-end mb-4">
                  <span style={{ color: theme.textTertiary }} className="text-xs font-bold tracking-widest uppercase">INPUT LEVEL</span>
                  <span style={{ color: theme.primary }} className="text-xl font-mono font-bold">{formatTime(recordingTime)}</span>
                </div>
                <div className="rounded-2xl h-20 w-full mb-4 flex items-center justify-center overflow-hidden" style={{ backgroundColor: theme.inputBg }}>
                  <canvas ref={homeCanvasRef} width={300} height={60} className="w-full h-full" />
                </div>
              </div>
            )}
          <button 
            onClick={() => isRecording ? mediaRecorderRef.current?.stop() : startRecording(true)}
              className={`w-full py-4 rounded-[2rem] font-bold text-lg shadow-sm flex items-center justify-center gap-2 transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:opacity-90'}`}
              style={{backgroundColor: isRecording ? '#EF4444' : theme.primaryLight, color: isRecording ? 'white' : theme.text}}
          >
            {isRecording ? <Square size={20} fill="currentColor"/> : <Plus size={20} strokeWidth={2.5}/>}
            {isRecording ? '正在追加錄音...' : '+ 追加錄音 Append'}
          </button>
          </div>
        </div>
      ) : (
        <>
          {/* === 首頁 (錄音) === */}
          {currentView === 'record' && (
            <div className="flex-1 p-6 flex flex-col items-center animate-in fade-in overflow-y-auto pb-32 max-w-md mx-auto w-full">
              {/* 標題區塊 */}
              <div className="w-full mb-8 pt-4">
                <p style={{ color: theme.textTertiary }} className="text-sm mb-1">Clear your mind</p>
                <h1 style={{ color: theme.primary, fontWeight: 900 }} className="text-4xl tracking-tight mb-2">The Walking Journal</h1>
                <p style={{ color: theme.textSecondary }} className="text-sm">One step at a time</p>
              </div>

              {/* Mode Selection */}
              <div className="w-full mb-6">
                <p style={{ color: theme.textSecondary }} className="text-sm mb-3">模式</p>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                  {MODES.map(m => (
                    <button 
                        key={m.id} 
                        onClick={() => setSelectedMode(m.id)} 
                        className="px-5 py-2.5 rounded-full text-sm shadow-sm whitespace-nowrap transition-all"
                        style={{
                          backgroundColor: selectedMode === m.id ? theme.primary : theme.inputBg,
                          color: selectedMode === m.id ? '#FFFFFF' : theme.textSecondary,
                          fontWeight: selectedMode === m.id ? 'bold' : 'normal',
                        }}
                    >
                        {m.id === 'custom' && customModeName ? customModeName : m.label}
                    </button>
                  ))}
                </div>
                <p style={{ color: theme.textSecondary }} className="text-base mt-2 text-left font-medium">
                  {new Date().toLocaleDateString('zh-TW', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </p>
              </div>

              {/* Main Record Button */}
              <div className="flex-1 flex flex-col justify-center items-center mb-4">
                <button 
                  onClick={() => isRecording ? mediaRecorderRef.current?.stop() : startRecording(false)}
                  className="w-40 h-40 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    backgroundColor: isRecording ? '#EF4444' : theme.primary,
                  }}
                >
                  {isRecording ? <Square size={48} className="text-white fill-current"/> : <Mic size={56} className="text-white"/>}
                </button>
                {status && <p style={{ color: theme.primary }} className="mt-8 font-bold animate-pulse">{status}</p>}
              </div>

              {/* Input Level Card */}
              <div className="w-full rounded-[2rem] p-6 shadow-sm border mb-2" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
                 <div className="flex justify-between items-end mb-4">
                    <span style={{ color: theme.textTertiary }} className="text-xs font-bold tracking-widest uppercase">INPUT LEVEL</span>
                    <span style={{ color: theme.primary }} className="text-xl font-mono font-bold">{formatTime(recordingTime)}</span>
                 </div>
                 <p style={{ color: theme.textSecondary }} className="text-sm font-bold mb-2">錄音時長</p>
                 
                 <div className="rounded-2xl h-20 w-full mb-4 flex items-center justify-center overflow-hidden" style={{ backgroundColor: theme.inputBg }}>
                    <canvas ref={homeCanvasRef} width={300} height={60} className="w-full h-full" />
                 </div>
                 <p style={{ color: theme.textTertiary }} className="text-xs leading-relaxed text-center">Tap the microphone to start walking</p>
              </div>
            </div>
          )}

          {/* === 列表頁 === */}
          {currentView === 'list' && (
            <div className="flex-1 p-6 pb-32 animate-in slide-in-from-right overflow-y-auto max-w-md mx-auto w-full">
              <div className="flex justify-between items-center mb-6 pt-4">
                <h2 className="text-3xl font-black" style={{color: theme.text}}>我的筆記</h2>
                <div className="p-2 rounded-full shadow-sm" style={{backgroundColor: theme.card, color: theme.primary}}><ListIcon size={20}/></div>
              </div>
              
              <div className="relative mb-6">
                 <input 
                  className="w-full rounded-2xl p-4 pl-12 shadow-sm border outline-none placeholder-opacity-50"
                  style={{backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text}}
                  placeholder="搜尋筆記..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 <Search className="absolute left-4 top-4" style={{color: theme.textTertiary}} size={20}/>
              </div>

              <div className="space-y-4">
                {notes.filter(n => n.title.includes(searchQuery) || n.content.includes(searchQuery)).map(n => (
                  <div key={n.id} onClick={() => {setCurrentNote(n); setCurrentView('detail');}} className="p-5 rounded-[2rem] shadow-sm border border-transparent hover:border-opacity-50 transition-all cursor-pointer relative group" style={{backgroundColor: theme.card}}>
                    <div className="flex justify-between mb-2">
                       <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase" style={{backgroundColor: theme.inputBg, color: theme.primary}}>{MODES.find(m => m.id === n.mode)?.label}</span>
                       <span className="text-[10px]" style={{color: theme.textTertiary}}>{formatTime(n.totalDuration)}</span>
                    </div>
                    <h3 className="font-bold text-lg line-clamp-1 mb-1" style={{color: theme.text}}>{n.title}</h3>
                    <p className="text-sm line-clamp-2 leading-relaxed" style={{color: theme.textSecondary}}>{n.content}</p>
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={16} style={{color: theme.primary}}/>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && <div className="text-center py-10 text-sm" style={{color: theme.textTertiary}}>還沒有任何筆記<br/>試著錄下第一則語音吧！</div>}
              </div>
            </div>
          )}

          {/* === 日曆頁 === */}
          {currentView === 'calendar' && (
            <div className="flex-1 p-6 pb-32 animate-in slide-in-from-right overflow-y-auto max-w-md mx-auto w-full">
                <div className="flex justify-between items-center mb-8 pt-4">
                    <h2 className="text-3xl font-black" style={{color: theme.text}}>日曆總覽</h2>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full shadow-sm" style={{backgroundColor: theme.card}}>
                        <ChevronLeft className="cursor-pointer hover:opacity-70" style={{color: theme.textTertiary}} size={20} onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth()-1)))}/>
                        <span className="text-sm font-bold select-none" style={{color: theme.text}}>{currentCalendarDate.getFullYear()}年 {currentCalendarDate.getMonth()+1}月</span>
                        <ChevronRight className="cursor-pointer hover:opacity-70" style={{color: theme.textTertiary}} size={20} onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth()+1)))}/>
                    </div>
                </div>
                <div className="p-6 rounded-[2.5rem] shadow-sm border mb-8" style={{backgroundColor: theme.card, borderColor: theme.cardBorder}}>
                    <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold mb-4" style={{color: theme.textTertiary}}>
                        {['日','一','二','三','四','五','六'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {renderCalendarDays(currentCalendarDate, notes, selectedDateFilter, setSelectedDateFilter, theme)}
                    </div>
                    <p className="text-[10px] text-center mt-4" style={{color: theme.textTertiary}}>有筆記的日期下方會出現小點</p>
                </div>
                {selectedDateFilter && (
                    <div className="animate-in slide-in-from-bottom">
                        <div className="flex justify-between items-center mb-3 px-2">
                            <p className="text-xs font-bold" style={{color: theme.textSecondary}}>{selectedDateFilter} 的筆記</p>
                            <button onClick={() => setSelectedDateFilter(null)}><X size={14} style={{color: theme.textTertiary}}/></button>
                        </div>
                        <div className="space-y-3">
                            {notes.filter(n => new Date(n.createdAt).toLocaleDateString() === selectedDateFilter).map(n => (
                                <div key={n.id} onClick={() => {setCurrentNote(n); setCurrentView('detail');}} className="p-4 rounded-2xl shadow-sm border cursor-pointer hover:border-opacity-50" style={{backgroundColor: theme.card, borderColor: theme.cardBorder}}>
                                    <h4 className="font-bold text-sm mb-1" style={{color: theme.text}}>{n.title}</h4>
                                    <p className="text-xs line-clamp-1" style={{color: theme.textTertiary}}>{n.content}</p>
                                </div>
                            ))}
                            {notes.filter(n => new Date(n.createdAt).toLocaleDateString() === selectedDateFilter).length === 0 && <p className="text-xs text-center py-2" style={{color: theme.textTertiary}}>本日無筆記</p>}
                        </div>
                    </div>
                )}
            </div>
          )}

          {/* === 設定頁 (Settings) === */}
          {currentView === 'settings' && (
             <div className="flex-1 p-6 pb-32 animate-in slide-in-from-right overflow-y-auto max-w-md mx-auto w-full">
                <div className="mb-8 pt-4">
                    <h2 style={{ color: theme.text }} className="text-3xl font-black mb-2">設定</h2>
                    <p style={{ color: theme.textTertiary }} className="text-sm">管理您的應用程式偏好</p>
                </div>
                <div className="mb-6 p-6 rounded-[2rem] shadow-sm border" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
                    <div className="flex items-center gap-2 mb-4">
                        <SettingsIcon style={{ color: theme.primary }} size={20}/>
                        <h3 style={{ color: theme.text }} className="font-bold">主題配色</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {(Object.keys(THEMES) as Theme[]).filter(t => t !== 'custom').map(t => (
                            <button
                                key={t}
                                onClick={() => setCurrentTheme(t)}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                    currentTheme === t ? 'scale-105 shadow-md' : 'opacity-70 hover:opacity-100'
                                }`}
                                style={{
                                    backgroundColor: THEMES[t].background,
                                    borderColor: currentTheme === t ? THEMES[t].primary : THEMES[t].cardBorder,
                                    color: THEMES[t].text,
                                }}
                            >
                                <div className="text-sm font-bold mb-2">{THEMES[t].name}</div>
                            </button>
                        ))}
                    </div>
                </div>
                <button 
                    onClick={saveSettings}
                    className="w-full py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                    style={{ backgroundColor: theme.primary, color: '#FFFFFF' }}
                >
                    <Save size={16}/> 儲存所有設定
                </button>
             </div>
          )}

          {/* === 底部導航 === */}
          <nav 
            className="fixed bottom-6 left-6 right-6 backdrop-blur-md rounded-[2rem] p-2.5 flex justify-around items-center z-50 max-w-md mx-auto border"
            style={{ 
              backgroundColor: `${theme.card}F5`, 
              borderColor: theme.cardBorder,
              boxShadow: `0 10px 40px ${theme.primary}15`
            }}
          >
            <button onClick={() => setCurrentView('record')} className="p-4 rounded-[1.5rem] transition-all" style={{backgroundColor: currentView === 'record' ? theme.primary : 'transparent', color: currentView === 'record' ? '#FFFFFF' : theme.textTertiary}}>
              <Mic size={24} />
            </button>
            <button onClick={() => setCurrentView('list')} className="p-4 rounded-[1.5rem] transition-all" style={{backgroundColor: (currentView === 'list' || currentView === 'detail') ? theme.primary : 'transparent', color: (currentView === 'list' || currentView === 'detail') ? '#FFFFFF' : theme.textTertiary}}>
              <ListIcon size={24} />
            </button>
            <button onClick={() => setCurrentView('calendar')} className="p-4 rounded-[1.5rem] transition-all" style={{backgroundColor: currentView === 'calendar' ? theme.primary : 'transparent', color: currentView === 'calendar' ? '#FFFFFF' : theme.textTertiary}}>
              <CalendarIcon size={24} />
            </button>
            <button onClick={() => setCurrentView('settings')} className="p-4 rounded-[1.5rem] transition-all" style={{backgroundColor: currentView === 'settings' ? theme.primary : 'transparent', color: currentView === 'settings' ? '#FFFFFF' : theme.textTertiary}}>
              <SettingsIcon size={24} />
            </button>
          </nav>
        </>
      )}
    </main>
  );
}

// Helper: 渲染日曆格子 (支援主題)
function renderCalendarDays(
  currentDate: Date, 
  notes: Note[], 
  selected: string | null, 
  setSelected: (s: string | null) => void,
  theme: ThemeColors
): ReactNode[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const res: ReactNode[] = [];

    for(let i = 0; i < firstDay; i++) {
        res.push(<div key={`e-${i}`}></div>);
    }

    for(let d = 1; d <= daysInMonth; d++) {
        const dStr = new Date(year, month, d).toLocaleDateString();
        const hasNotes = notes.some(n => new Date(n.createdAt).toLocaleDateString() === dStr);
        const isSel = selected === dStr;
        
        res.push(
            <div 
                key={d} 
                onClick={() => setSelected(isSel ? null : dStr)}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold cursor-pointer transition-all relative ${isSel ? 'shadow-sm' : 'hover:opacity-80'}`}
                style={{
                    backgroundColor: isSel ? theme.primary : 'transparent',
                    color: isSel ? '#FFFFFF' : theme.text,
                }}
            >
                {d}
                {hasNotes && <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{backgroundColor: isSel ? '#FFFFFF' : theme.primary}}></div>}
            </div>
        );
    }
    return res;
}