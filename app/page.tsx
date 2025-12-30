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
    // 延遲一下確保 canvas 已經渲染
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

  // 獲取當前主題顏色
  const getTheme = (): ThemeColors => {
    if (currentTheme === 'custom' && Object.keys(customThemeColors).length > 0) {
      return { ...THEMES.green, ...customThemeColors } as ThemeColors;
    }
    return THEMES[currentTheme];
  };
  
  const theme = getTheme();

  // --- 繪製靜態膠囊條的函數 - 29個交替顏色 ---
  const drawStaticBars = () => {
    const canvas = homeCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    const currentThemeColors = getTheme();
    const bars = 29; // 29個膠囊
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
      // 交替顏色：偶數索引用深綠，奇數索引用淺綠
      ctx.fillStyle = i % 2 === 0 ? currentThemeColors.visualizerActive : currentThemeColors.visualizerInactive;
      ctx.fill();
    }
  };

  // --- 視覺化 (Visualizer) - 支援動態主題 ---
  const initVisualizer = (stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 64; // 控制條的數量密度
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const canvas = homeCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const currentThemeColors = getTheme();

    const draw = () => {
      if (mediaRecorderRef.current?.state !== 'recording') {
        // 停止時顯示靜態條
        drawStaticBars();
        return;
      }
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 設定繪圖參數 - 29個膠囊，交替顏色
        const bars = 29;
        const gap = 3;
        const barWidth = 6;
        const totalWidth = bars * (barWidth + gap) - gap;
        const startX = (canvas.width - totalWidth) / 2;
        const centerY = canvas.height / 2;

        for (let i = 0; i < bars; i++) {
          // 取得音量強度 (0~1)
          const value = dataArray[i % dataArray.length] / 255;
          
          // 計算高度：基礎高度 + 音量增幅
          const baseHeight = 8; 
          const height = baseHeight + (value * 25); 
          
          // 繪製圓角矩形 (膠囊狀)
          ctx.beginPath();
          ctx.roundRect(
            startX + i * (barWidth + gap), 
            centerY - height / 2, 
            barWidth, 
            height, 
            barWidth / 2
          );
          
          // 交替顏色：偶數索引用深綠，奇數索引用淺綠（有聲音時深綠會變高）
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
      initVisualizer(stream); // 無論是否追加都初始化視覺化器
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

  const handleStop = async (isAppend = false) => {
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    setStatus('AI 正在思考中...');
    
    try {
      const headers: HeadersInit = {};
      if (apiKey) headers['x-openai-key'] = apiKey;

      const fd = new FormData(); 
      fd.append('file', blob, 'audio.webm');
      fd.append('prompt', customVocab);

      const transRes = await fetch('/api/transcribe', { method: 'POST', headers, body: fd });
      const transData = await transRes.json();
      if (!transRes.ok) throw new Error(transData.error || '轉錄失敗');
      const text = transData.text;

      // 如果選擇自訂模式且有自訂提示詞，使用自訂提示詞
      const styleToUse = selectedMode === 'custom' && customModePrompt 
        ? customModePrompt 
        : customStylePrompt;

      const rewriteHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        rewriteHeaders['x-openai-key'] = apiKey;
      }

      const rwRes = await fetch('/api/rewrite', { 
        method: 'POST', 
        headers: rewriteHeaders,
        body: JSON.stringify({ text, mode: selectedMode, customStyle: styleToUse }) 
      });
      const ai = await rwRes.json();
      if (!rwRes.ok) throw new Error(ai.error || '改寫失敗');

      const newSegment = { id: Date.now().toString(), duration: recordingTime, timestamp: Date.now() };

      if (isAppend && currentNote) {
        const updated = {
          ...currentNote,
          content: currentNote.content + '\n\n' + (ai.content || text),
          totalDuration: currentNote.totalDuration + recordingTime,
          segments: [...currentNote.segments, newSegment]
        };
        setNotes(prev => prev.map(n => n.id === currentNote.id ? updated : n));
        setCurrentNote(updated);
      } else {
        const newNote: Note = {
          id: Date.now().toString(),
          title: ai.title || '新筆記',
          content: ai.content || text,
          createdAt: Date.now(),
          totalDuration: recordingTime,
          segments: [newSegment],
          mode: selectedMode,
          tags: ai.tags || [],
          folderId: 'default'
        };
        setNotes(prev => [newNote, ...prev]);
        setCurrentNote(newNote);
        setCurrentView('detail');
      }
    } catch (e: any) { alert(`處理失敗: ${e.message}`); }
    
    setStatus(''); setIsRecording(false); 
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const deleteNote = (id: string) => {
    if (confirm('確定要刪除這則筆記嗎？')) {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (currentNote?.id === id) { setCurrentNote(null); setCurrentView('list'); }
    }
  };

  // 重新生成筆記內容
  const regenerateNote = async () => {
    if (!currentNote) return;
    
    setStatus('AI 正在重新生成...');
    try {
      const headers: HeadersInit = {};
      if (apiKey) headers['x-openai-key'] = apiKey;

      // 獲取原始轉錄文字（這裡簡化處理，實際應該保存原始文字）
      const originalText = currentNote.content; // 暫時使用當前內容
      
      const styleToUse = currentNote.mode === 'custom' && customModePrompt 
        ? customModePrompt 
        : customStylePrompt;
      
      const rewriteHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        rewriteHeaders['x-openai-key'] = apiKey;
      }

      const rwRes = await fetch('/api/rewrite', { 
        method: 'POST', 
        headers: rewriteHeaders,
        body: JSON.stringify({ text: originalText, mode: currentNote.mode, customStyle: styleToUse }) 
      });
      const ai = await rwRes.json();
      if (!rwRes.ok) throw new Error(ai.error || '改寫失敗');

      const updated = {
        ...currentNote,
        content: ai.content || originalText,
        title: ai.title || currentNote.title,
      };
      setCurrentNote(updated);
      setNotes(prev => prev.map(n => n.id === currentNote.id ? updated : n));
    } catch (e: any) { 
      alert(`重新生成失敗: ${e.message}`); 
    }
    setStatus('');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // --- 介面渲染 (支援動態主題) ---
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
            <p className="text-[#88A088] text-[10px] font-bold tracking-[0.3em] uppercase mb-1">TALKING JOURNAL</p>
            <h1 className="text-3xl font-extrabold text-[#4A7C59] tracking-tight mb-4">Soft Voice Notes</h1>
            <button onClick={() => setCurrentView('list')} className="flex items-center text-[#6A8C6A] text-sm font-bold hover:text-[#4A7C59] transition-colors"><ChevronLeft size={16}/> 返回</button>
          </div>

          {/* Meta Info */}
          <div className="mb-4">
            <p className="text-xs text-[#6A8C6A] font-bold mb-1">
              {new Date(currentNote.createdAt).toLocaleDateString()} 週{['日','一','二','三','四','五','六'][new Date(currentNote.createdAt).getDay()]} 下午{new Date(currentNote.createdAt).getHours() % 12}:{new Date(currentNote.createdAt).getMinutes().toString().padStart(2,'0')}
            </p>
            <input 
              className="text-3xl font-black text-[#2C4A2C] bg-transparent outline-none w-full placeholder-[#A0BCA0]" 
              value={currentNote.title}
              onChange={(e) => {
                const updated = {...currentNote, title: e.target.value};
                setCurrentNote(updated);
                setNotes(notes.map(n => n.id === currentNote.id ? updated : n));
              }}
            />
          </div>

          {/* Audio Segments (淺綠色背景區塊) */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-[#6A8C6A]">錄音片段</span>
              <span className="text-xs text-[#88A088]">共 {formatTime(currentNote.totalDuration)}</span>
            </div>
            {currentNote.segments.length > 0 ? (
              <div className="space-y-2">
                {currentNote.segments.map((seg, idx) => (
                  // 使用 Image 1 中的淺綠色膠囊背景 #E0E8E0
                  <div key={seg.id} className="bg-[#E0E8E0] p-4 rounded-xl flex justify-between items-center">
                    <span className="text-sm font-bold text-[#4A7C59]">Segment {idx + 1} · {formatTime(seg.duration)}</span>
                    <button className="p-2 bg-[#4A7C59] rounded-full text-white shadow-sm hover:scale-105 transition-transform"><Play size={14} fill="currentColor"/></button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#A0BCA0] italic">目前尚無錄音片段。</p>
            )}
          </div>

          {/* Text Content (白色卡片) */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[#E8F0E8] flex-1 flex flex-col mb-3 min-h-[240px]">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-[#6A8C6A]">文字筆記</span>
                 {/* Mode Selector - 可切換模式 */}
                 <select 
                   value={currentNote.mode}
                   onChange={(e) => {
                     const updated = {...currentNote, mode: e.target.value as Mode};
                     setCurrentNote(updated);
                     setNotes(notes.map(n => n.id === currentNote.id ? updated : n));
                   }}
                   className="text-[10px] font-bold bg-[#E8F0E8] text-[#4A7C59] px-3 py-1 rounded-full border-none outline-none cursor-pointer"
                 >
                   {MODES.map(m => (
                     <option key={m.id} value={m.id}>{m.label}</option>
                   ))}
                 </select>
              </div>
              {/* Regenerate Button */}
              <button 
                onClick={regenerateNote}
                className="text-[10px] font-bold bg-[#4A7C59] text-white px-3 py-1 rounded-full flex items-center gap-1 hover:bg-[#3A6B48] transition-colors"
              >
                <RotateCcw size={10}/> 重新生成
              </button>
            </div>
            <textarea 
              className="flex-1 w-full bg-transparent outline-none text-[#2C4A2C] leading-loose text-lg resize-none"
              value={currentNote.content}
              onChange={(e) => {
                const updated = {...currentNote, content: e.target.value};
                setCurrentNote(updated);
                setNotes(notes.map(n => n.id === currentNote.id ? updated : n));
              }}
            />
            {/* Action Bar (複製/分享/刪除) */}
            <div className="flex gap-2 mt-4 pt-4">
              <button className="bg-[#E8F0E8] text-[#4A7C59] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-[#D0D8D0]" onClick={() => {navigator.clipboard.writeText(currentNote.content); alert('已複製');}}><Copy size={14}/> 複製</button>
              <button className="bg-[#E8F0E8] text-[#4A7C59] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-[#D0D8D0]"><Share2 size={14}/> 分享</button>
              <div className="flex-1"></div>
              <button onClick={() => deleteNote(currentNote.id)} className="bg-[#FEE2E2] text-red-500 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-[#FECACA]"><Trash2 size={14}/> 刪除</button>
            </div>
          </div>

          {/* Append Button with Visualizer and Timer */}
          <div className="w-full">
            {/* 音量視覺化器和計時器 - 追加錄音時顯示 */}
            {isRecording && (
              <div className="w-full rounded-[2rem] p-6 shadow-sm border mb-3" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
                <div className="flex justify-between items-end mb-4">
                  <span style={{ color: theme.textTertiary }} className="text-xs font-bold tracking-widest uppercase">INPUT LEVEL</span>
                  <span style={{ color: theme.primary }} className="text-xl font-mono font-bold">{formatTime(recordingTime)}</span>
                </div>
                <p style={{ color: theme.textSecondary }} className="text-sm font-bold mb-2">錄音時長</p>
                {/* 視覺化區域 */}
                <div className="rounded-2xl h-20 w-full mb-4 flex items-center justify-center overflow-hidden" style={{ backgroundColor: theme.inputBg }}>
                  <canvas ref={homeCanvasRef} width={300} height={60} className="w-full h-full" />
                </div>
                <p style={{ color: theme.textTertiary }} className="text-xs leading-relaxed text-center">對著麥克風說話，如果看到長條圖跳動，就代表麥克風正常運作。</p>
              </div>
            )}
          <button 
            onClick={() => isRecording ? mediaRecorderRef.current?.stop() : startRecording(true)}
              className={`w-full py-4 rounded-[2rem] font-bold text-lg shadow-sm flex items-center justify-center gap-2 transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#96C4A6] text-[#2C4A2C] hover:bg-[#85B395]'}`}
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
                <p style={{ color: theme.textTertiary }} className="text-sm mb-1">Capture thoughts on the go</p>
                <h1 style={{ color: theme.primary, fontFamily: 'var(--font-neoris)', fontWeight: 900 }} className="text-4xl tracking-tight mb-2">TALKING JOURNAL</h1>
                <p style={{ color: '#666666' }} className="text-sm">將腦中的千頭萬緒化為文字</p>
              </div>

              {/* Mode Selection - 支援動態主題 */}
              <div className="w-full mb-6">
                <p style={{ color: '#666666' }} className="text-sm mb-3">模式</p>
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
                {/* 日期顯示 - 中文格式，淺黑色，靠左對齊 */}
                <p style={{ color: '#666666' }} className="text-base mt-2 text-left font-medium">
                  {new Date().toLocaleDateString('zh-TW', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </p>
              </div>

              {/* Main Record Button - 支援動態主題 */}
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

              {/* Input Level Card - 簡化樣式 */}
              <div className="w-full rounded-[2rem] p-6 shadow-sm border mb-2" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
                 <div className="flex justify-between items-end mb-4">
                    <span style={{ color: theme.textTertiary }} className="text-xs font-bold tracking-widest uppercase">INPUT LEVEL</span>
                    <span style={{ color: theme.primary }} className="text-xl font-mono font-bold">{formatTime(recordingTime)}</span>
                 </div>
                 <p style={{ color: theme.textSecondary }} className="text-sm font-bold mb-2">錄音時長</p>
                 
                 {/* 視覺化區域 - 簡化膠囊樣式 */}
                 <div className="rounded-2xl h-20 w-full mb-4 flex items-center justify-center overflow-hidden" style={{ backgroundColor: theme.inputBg }}>
                    <canvas ref={homeCanvasRef} width={300} height={60} className="w-full h-full" />
                 </div>
                 <p style={{ color: theme.textTertiary }} className="text-xs leading-relaxed text-center">對著麥克風說話，如果看到長條圖跳動，就代表麥克風正常運作。</p>
              </div>
            </div>
          )}

          {/* === 列表頁 === */}
          {currentView === 'list' && (
            <div className="flex-1 p-6 pb-32 animate-in slide-in-from-right overflow-y-auto max-w-md mx-auto w-full">
              <div className="flex justify-between items-center mb-6 pt-4">
                <h2 className="text-3xl font-black text-[#2C4A2C]">我的筆記</h2>
                <div className="p-2 bg-white rounded-full shadow-sm text-[#4A7C59]"><ListIcon size={20}/></div>
              </div>
              
              <div className="relative mb-6">
                 <input 
                  className="w-full bg-white rounded-2xl p-4 pl-12 shadow-sm border border-[#E8F0E8] outline-none text-[#2C4A2C] placeholder-[#A0BCA0]"
                  placeholder="搜尋筆記..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 <Search className="absolute left-4 top-4 text-[#A0BCA0]" size={20}/>
              </div>

              <div className="space-y-4">
                {notes.filter(n => n.title.includes(searchQuery) || n.content.includes(searchQuery)).map(n => (
                  <div key={n.id} onClick={() => {setCurrentNote(n); setCurrentView('detail');}} className="bg-white p-5 rounded-[2rem] shadow-sm border border-transparent hover:border-[#4A7C59]/20 transition-all cursor-pointer relative group">
                    <div className="flex justify-between mb-2">
                       <span className="text-[10px] font-bold bg-[#E8F0E8] text-[#4A7C59] px-2 py-0.5 rounded uppercase">{MODES.find(m => m.id === n.mode)?.label}</span>
                       <span className="text-[10px] text-[#88A088]">{formatTime(n.totalDuration)}</span>
                    </div>
                    <h3 className="font-bold text-lg text-[#2C4A2C] line-clamp-1 mb-1">{n.title}</h3>
                    <p className="text-sm text-[#6A8C6A] line-clamp-2 leading-relaxed">{n.content}</p>
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={16} className="text-[#4A7C59]"/>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && <div className="text-center text-[#A0BCA0] py-10 text-sm">還沒有任何筆記<br/>試著錄下第一則語音吧！</div>}
              </div>
            </div>
          )}

          {/* === 日曆頁 === */}
          {currentView === 'calendar' && (
            <div className="flex-1 p-6 pb-32 animate-in slide-in-from-right overflow-y-auto max-w-md mx-auto w-full">
                <div className="flex justify-between items-center mb-8 pt-4">
                    <h2 className="text-3xl font-black text-[#2C4A2C]">日曆總覽</h2>
                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                        <ChevronLeft className="cursor-pointer text-[#88A088] hover:text-[#4A7C59]" size={20} onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth()-1)))}/>
                        <span className="text-sm font-bold text-[#2C4A2C] select-none">{currentCalendarDate.getFullYear()}年 {currentCalendarDate.getMonth()+1}月</span>
                        <ChevronRight className="cursor-pointer text-[#88A088] hover:text-[#4A7C59]" size={20} onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth()+1)))}/>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-[#E8F0E8] mb-8">
                    <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-[#A0BCA0] mb-4">
                        {['日','一','二','三','四','五','六'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {renderCalendarDays(currentCalendarDate, notes, selectedDateFilter, setSelectedDateFilter)}
                    </div>
                    <p className="text-[10px] text-center text-[#A0BCA0] mt-4">有筆記的日期下方會出現小點</p>
                </div>
                {selectedDateFilter && (
                    <div className="animate-in slide-in-from-bottom">
                        <div className="flex justify-between items-center mb-3 px-2">
                            <p className="text-xs font-bold text-[#6A8C6A]">{selectedDateFilter} 的筆記</p>
                            <button onClick={() => setSelectedDateFilter(null)}><X size={14} className="text-[#88A088]"/></button>
                        </div>
                        <div className="space-y-3">
                            {notes.filter(n => new Date(n.createdAt).toLocaleDateString() === selectedDateFilter).map(n => (
                                <div key={n.id} onClick={() => {setCurrentNote(n); setCurrentView('detail');}} className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8F0E8] cursor-pointer hover:border-[#4A7C59]/30">
                                    <h4 className="font-bold text-[#2C4A2C] text-sm mb-1">{n.title}</h4>
                                    <p className="text-xs text-[#88A088] line-clamp-1">{n.content}</p>
                                </div>
                            ))}
                            {notes.filter(n => new Date(n.createdAt).toLocaleDateString() === selectedDateFilter).length === 0 && <p className="text-xs text-[#A0BCA0] text-center py-2">本日無筆記</p>}
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

                {/* 主題選擇器 */}
                <div className="mb-6 p-6 rounded-[2rem] shadow-sm border" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
                    <div className="flex items-center gap-2 mb-4">
                        <SettingsIcon style={{ color: theme.primary }} size={20}/>
                        <h3 style={{ color: theme.text }} className="font-bold">主題配色</h3>
                    </div>
                    <p style={{ color: theme.textSecondary }} className="text-xs mb-4">選擇您喜歡的配色方案</p>
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
                                <div className="flex gap-1">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: THEMES[t].primary }}></div>
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: THEMES[t].textSecondary }}></div>
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: THEMES[t].background }}></div>
                                </div>
                            </button>
                        ))}
                    </div>
                    {currentTheme === 'custom' && (
                        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: theme.inputBg }}>
                            <p style={{ color: theme.textSecondary }} className="text-xs mb-3 font-bold">自訂顏色（進階）</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs mb-1 block" style={{ color: theme.textSecondary }}>主要顏色</label>
                                    <input 
                                        type="color" 
                                        value={customThemeColors.primary || theme.primary}
                                        onChange={(e) => setCustomThemeColors({...customThemeColors, primary: e.target.value})}
                                        className="w-full h-10 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs mb-1 block" style={{ color: theme.textSecondary }}>背景顏色</label>
                                    <input 
                                        type="color" 
                                        value={customThemeColors.background || theme.background}
                                        onChange={(e) => setCustomThemeColors({...customThemeColors, background: e.target.value})}
                                        className="w-full h-10 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 自訂模式設定 */}
                <div className="mb-6 p-6 rounded-[2rem] shadow-sm border" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
                    <div className="flex items-center gap-2 mb-4">
                        <PenTool style={{ color: theme.primary }} size={20}/>
                        <h3 style={{ color: theme.text }} className="font-bold">自訂模式</h3>
                    </div>
                    <p style={{ color: theme.textSecondary }} className="text-xs mb-4">建立您專屬的 AI 改寫風格</p>
                    
                    <div className="mb-4">
                        <label className="text-xs mb-2 block font-bold" style={{ color: theme.textSecondary }}>模式名稱</label>
                        <input 
                            type="text"
                            placeholder="例如：詩意風格、技術文檔..."
                            className="w-full rounded-xl p-3 text-sm outline-none border border-transparent"
                            style={{ 
                                backgroundColor: theme.inputBg, 
                                color: theme.text,
                                borderColor: theme.cardBorder
                            }}
                            value={customModeName}
                            onChange={(e) => setCustomModeName(e.target.value)}
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="text-xs mb-2 block font-bold" style={{ color: theme.textSecondary }}>自訂提示詞</label>
                        <textarea 
                            placeholder="例如：請用詩意的語言，加入比喻和意象，讓文字充滿畫面感..."
                            className="w-full rounded-xl p-3 text-sm outline-none border border-transparent resize-none"
                            style={{ 
                                backgroundColor: theme.inputBg, 
                                color: theme.text,
                                borderColor: theme.cardBorder,
                                minHeight: '100px'
                            }}
                            value={customModePrompt}
                            onChange={(e) => setCustomModePrompt(e.target.value)}
                        />
                    </div>
                    
                    {customModeName && customModePrompt && (
                        <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: theme.inputBg }}>
                            <p style={{ color: theme.textSecondary }} className="text-xs font-bold mb-1">預覽模式：</p>
                            <p style={{ color: theme.text }} className="text-sm">{customModeName}</p>
                        </div>
                    )}
                </div>

                {/* API 設定 */}
                <div className="mb-6 p-6 rounded-[2rem] shadow-sm border" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Key style={{ color: theme.primary }} size={20}/>
                        <h3 style={{ color: theme.text }} className="font-bold">OpenAI API 設定</h3>
                    </div>
                    <input 
                        type="password"
                        placeholder="sk-..."
                        className="w-full rounded-xl p-3 text-sm outline-none border border-transparent mb-4"
                        style={{ 
                            backgroundColor: theme.inputBg, 
                            color: theme.text,
                            borderColor: theme.cardBorder
                        }}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                    
                    <div className="border-t my-4" style={{ borderColor: theme.cardBorder }}></div>
                    
                    <div className="flex items-center gap-2 mb-4">
                        <Book style={{ color: theme.primary }} size={20}/>
                        <h3 style={{ color: theme.text }} className="font-bold">自訂詞彙 (Context Prompt)</h3>
                    </div>
                    <textarea 
                        placeholder="例如：台積電, 區塊鏈, Soft Notes..."
                        className="w-full rounded-xl p-3 text-sm outline-none border border-transparent resize-none mb-4"
                        style={{ 
                            backgroundColor: theme.inputBg, 
                            color: theme.text,
                            borderColor: theme.cardBorder,
                            minHeight: '80px'
                        }}
                        value={customVocab}
                        onChange={(e) => setCustomVocab(e.target.value)}
                    />

                    <div className="flex items-center gap-2 mb-4">
                        <PenTool style={{ color: theme.primary }} size={20}/>
                        <h3 style={{ color: theme.text }} className="font-bold">自訂文風提示 (Custom Style)</h3>
                    </div>
                    <textarea 
                        placeholder="例如：請模仿海明威的極簡風格..."
                        className="w-full rounded-xl p-3 text-sm outline-none border border-transparent resize-none mb-4"
                        style={{ 
                            backgroundColor: theme.inputBg, 
                            color: theme.text,
                            borderColor: theme.cardBorder,
                            minHeight: '80px'
                        }}
                        value={customStylePrompt}
                        onChange={(e) => setCustomStylePrompt(e.target.value)}
                    />

                    <button 
                        onClick={saveSettings}
                        className="w-full py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                        style={{ backgroundColor: theme.primary, color: '#FFFFFF' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryHover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
                    >
                        <Save size={16}/> 儲存所有設定
                    </button>
                    <AnimatePresence>
                        {showSettingsAlert && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="mt-3 text-center text-xs font-bold"
                                style={{ color: theme.primary }}
                            >
                                設定已更新！
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
             </div>
          )}

          {/* === 底部導航 - 支援動態主題 === */}
          <nav 
            className="fixed bottom-6 left-6 right-6 backdrop-blur-md rounded-[2rem] p-2.5 flex justify-around items-center z-50 max-w-md mx-auto border"
            style={{ 
              backgroundColor: `${theme.card}F5`, 
              borderColor: theme.cardBorder,
              boxShadow: `0 10px 40px ${theme.primary}15`
            }}
          >
            <button 
              onClick={() => setCurrentView('record')} 
              className="p-4 rounded-[1.5rem] transition-all"
              style={{
                backgroundColor: currentView === 'record' ? theme.primary : 'transparent',
                color: currentView === 'record' ? '#FFFFFF' : theme.textTertiary,
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'record') {
                  e.currentTarget.style.backgroundColor = theme.inputBg;
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'record') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Mic size={24} />
            </button>
            <button 
              onClick={() => setCurrentView('list')} 
              className="p-4 rounded-[1.5rem] transition-all"
              style={{
                backgroundColor: (currentView === 'list' || currentView === 'detail') ? theme.primary : 'transparent',
                color: (currentView === 'list' || currentView === 'detail') ? '#FFFFFF' : theme.textTertiary,
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'list' && currentView !== 'detail') {
                  e.currentTarget.style.backgroundColor = theme.inputBg;
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'list' && currentView !== 'detail') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <ListIcon size={24} />
            </button>
            <button 
              onClick={() => setCurrentView('calendar')} 
              className="p-4 rounded-[1.5rem] transition-all"
              style={{
                backgroundColor: currentView === 'calendar' ? theme.primary : 'transparent',
                color: currentView === 'calendar' ? '#FFFFFF' : theme.textTertiary,
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'calendar') {
                  e.currentTarget.style.backgroundColor = theme.inputBg;
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'calendar') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <CalendarIcon size={24} />
            </button>
            <button 
              onClick={() => setCurrentView('settings')} 
              className="p-4 rounded-[1.5rem] transition-all"
              style={{
                backgroundColor: currentView === 'settings' ? theme.primary : 'transparent',
                color: currentView === 'settings' ? '#FFFFFF' : theme.textTertiary,
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'settings') {
                  e.currentTarget.style.backgroundColor = theme.inputBg;
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'settings') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <SettingsIcon size={24} />
            </button>
          </nav>
        </>
      )}
    </main>
  );
}

// Helper: 渲染日曆格子 (綠色版)
function renderCalendarDays(
  currentDate: Date, 
  notes: Note[], 
  selected: string | null, 
  setSelected: (s: string | null) => void
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
                // 綠色系的日曆樣式：選中為 #4A7C59, 有筆記的小點也是 #4A7C59
                className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold cursor-pointer transition-all relative 
                ${isSel ? 'bg-[#4A7C59] text-white shadow-sm' : 'text-[#2C4A2C] hover:bg-[#E8F0E8]'}`}
            >
                {d}
                {hasNotes && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSel ? 'bg-white' : 'bg-[#4A7C59]'}`}></div>}
            </div>
        );
    }
    return res;
}