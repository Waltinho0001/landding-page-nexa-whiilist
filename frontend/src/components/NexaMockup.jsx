import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Check, Flame, Sparkles, Smartphone, Plus, RefreshCw, ChevronRight, Zap, Trash2, Edit2, Filter, X, ArrowRight, Star, Clock, AlertCircle } from 'lucide-react';

const PRESET_CONVERSATIONS = [
  { text: 'Estudar química amanhã às 15h', title: 'Estudar química', date: 'Amanhã', time: '15:00', p: 'Alta', category: 'Estudos' },
  { text: 'Ler 10 páginas hoje à noite', title: 'Ler 10 páginas', date: 'Hoje', time: '20:00', p: 'Média', category: 'Leitura' },
  { text: 'Comprar ingredientes do bolo urgente', title: 'Comprar ingredientes do bolo', date: 'Hoje', time: 'Imediato', p: 'Alta', category: 'Compras' },
  { text: 'Treinar na academia hoje 18h', title: 'Treinar na academia', date: 'Hoje', time: '18:00', p: 'Média', category: 'Saúde' },
  { text: 'Reunião com equipe amanhã 10h importante', title: 'Reunião com equipe', date: 'Amanhã', time: '10:00', p: 'Alta', category: 'Trabalho' },
];

const CATEGORIES = {
  Estudos: { color: 'bg-indigo-100 text-indigo-600', dot: 'bg-indigo-500' },
  Leitura: { color: 'bg-violet-100 text-violet-600', dot: 'bg-violet-500' },
  Compras: { color: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' },
  Saúde: { color: 'bg-rose-100 text-rose-600', dot: 'bg-rose-500' },
  Trabalho: { color: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' },
  Pessoal: { color: 'bg-sky-100 text-sky-600', dot: 'bg-sky-500' },
};

const PRIORITY_CONFIG = {
  Alta: { bg: 'bg-rose-500', bgSoft: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', dot: 'bg-rose-500', gradient: 'from-rose-500 to-rose-600' },
  Média: { bg: 'bg-amber-500', bgSoft: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600' },
  Baixa: { bg: 'bg-emerald-500', bgSoft: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600' },
};

const TIMER_PRESETS = [
  { label: 'Foco', duration: 25 * 60, icon: Zap },
  { label: 'Curto', duration: 15 * 60, icon: Clock },
  { label: 'Pausa', duration: 5 * 60, icon: Star },
];

export default function NexaApp() {
  const [activeTab, setActiveTab] = useState('input');
  const [typedText, setTypedText] = useState('');
  const [extractedTask, setExtractedTask] = useState({ title: '', dueDate: 'Hoje', time: 'Livre', priority: 'Média', category: 'Pessoal' });
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Gravar vídeo do pitch', dueDate: 'Hoje', time: '11:30', priority: 'Alta', completed: false, category: 'Trabalho', createdAt: Date.now() - 3600000 },
    { id: '2', title: 'Responder e-mails pendentes', dueDate: 'Hoje', time: '16:00', priority: 'Média', completed: false, category: 'Trabalho', createdAt: Date.now() - 7200000 },
    { id: '3', title: 'Revisão semanal', dueDate: 'Amanhã', time: '09:00', priority: 'Baixa', completed: false, category: 'Pessoal', createdAt: Date.now() - 10800000 },
  ]);
  const [filter, setFilter] = useState('all');
  const [timerDuration, setTimerDuration] = useState(25 * 60);
  const [timerPresetIndex, setTimerPresetIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [streakCount, setStreakCount] = useState(4);
  const [completedToday, setCompletedToday] = useState(2);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const [confettiParticles, setConfettiParticles] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editText, setEditText] = useState('');
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [deleteMode, setDeleteMode] = useState(false);
  const intervalRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast(message);
    setToastType(type);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const text = typedText.toLowerCase();
    let title = typedText || '';
    let dueDate = 'Hoje';
    let time = 'Livre';
    let priority = 'Média';
    let category = 'Pessoal';

    if (text.includes('estudar')) {
      title = 'Estudar ' + typedText.substring(text.indexOf('estudar') + 7).split('amanhã')[0].split('amanha')[0].split('hoje')[0].trim();
      category = 'Estudos';
    } else if (text.includes('ler') || text.includes('livro')) {
      title = 'Ler ' + typedText.substring(text.indexOf('ler') + 3).split('amanhã')[0].split('amanha')[0].split('hoje')[0].trim();
      category = 'Leitura';
    } else if (text.includes('comprar')) {
      title = 'Comprar ' + typedText.substring(text.indexOf('comprar') + 7).split('urgente')[0].trim();
      category = 'Compras';
    } else if (text.includes('treinar') || text.includes('academia') || text.includes('correr')) {
      title = 'Treinar ' + typedText.substring(text.indexOf('treinar') + 7).split('amanhã')[0].split('amanha')[0].split('hoje')[0].trim();
      category = 'Saúde';
    } else if (text.includes('reunião') || text.includes('reuniao') || text.includes('trabalho')) {
      category = 'Trabalho';
    }

    if (text.includes('amanhã') || text.includes('amanha')) {
      dueDate = 'Amanhã';
    } else if (text.includes('hoje')) {
      dueDate = 'Hoje';
    } else if (text.includes('sexta')) {
      dueDate = 'Sexta-feira';
    }

    if (text.includes('às') || text.includes('as ')) {
      const parts = text.split(/às|as/);
      if (parts.length > 1) {
        const timeMatch = parts[1].trim().match(/(\d{1,2}:\d{2})/);
        if (timeMatch) time = timeMatch[1];
      }
    } else if (text.includes('noite')) {
      time = '20:00';
    } else if (text.includes('manhã') || text.includes('manha')) {
      time = '09:00';
    } else if (text.includes('tarde')) {
      time = '14:00';
    }

    if (text.includes('urgente') || text.includes('alta') || text.includes('importante')) {
      priority = 'Alta';
    } else if (text.includes('baixa') || text.includes('relaxado') || text.includes('leve')) {
      priority = 'Baixa';
    }

    title = title
      .replace(/amanhã/gi, '')
      .replace(/amanha/gi, '')
      .replace(/hoje/gi, '')
      .replace(/às \d{1,2}(h|:\d{2})/gi, '')
      .replace(/as \d{1,2}(h|:\d{2})/gi, '')
      .replace(/urgente/gi, '')
      .replace(/importante/gi, '')
      .trim();

    if (!title) title = 'Nova Tarefa';

    setExtractedTask({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      dueDate,
      time,
      priority,
      category,
    });
  }, [typedText]);

  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerDuration((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            showToast('⏰ Pomodoro finalizado!', 'info');
            return TIMER_PRESETS[timerPresetIndex].duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTimerRunning, timerPresetIndex, showToast]);

  const triggerConfetti = useCallback(() => {
    const particles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 20,
      color: ['#8958f3', '#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'][Math.floor(Math.random() * 6)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.3,
    }));
    setConfettiParticles(particles);
    setTimeout(() => setConfettiParticles([]), 1500);
  }, []);

  const handleCreateTask = useCallback(() => {
    if (!extractedTask.title.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: extractedTask.title,
      dueDate: extractedTask.dueDate,
      time: extractedTask.time,
      priority: extractedTask.priority,
      completed: false,
      category: extractedTask.category,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setTypedText('');
    showToast('✨ Tarefa criada com sucesso!');
  }, [extractedTask, showToast]);

  const handlePresetClick = useCallback((preset) => {
    setTypedText(preset.text);
  }, []);

  const toggleTaskCompletion = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          if (nextCompleted) {
            setCompletedToday((c) => {
              const next = c + 1;
              if (c === 0) setStreakCount((s) => s + 1);
              return next;
            });
            setCelebrationData({ title: t.title, streak: streakCount + 1 });
            setShowCelebration(true);
            triggerConfetti();
            setTimeout(() => {
              setShowCelebration(false);
              setCelebrationData(null);
            }, 2500);
          } else {
            setCompletedToday((c) => Math.max(0, c - 1));
          }
          return { ...t, completed: nextCompleted };
        }
        return t;
      })
    );
  }, [streakCount, triggerConfetti]);

  const deleteTask = useCallback((id, e) => {
    if (e) e.stopPropagation();
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('🗑️ Tarefa removida', 'info');
  }, [showToast]);

  const startEditing = useCallback((task) => {
    setEditingTaskId(task.id);
    setEditText(task.title);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editText.trim()) return;
    setTasks((prev) => prev.map((t) => (t.id === editingTaskId ? { ...t, title: editText.trim() } : t)));
    setEditingTaskId(null);
    setEditText('');
    showToast('✏️ Tarefa atualizada');
  }, [editingTaskId, editText, showToast]);

  const handleTimerPresetChange = useCallback((index) => {
    setTimerPresetIndex(index);
    setIsTimerRunning(false);
    setTimerDuration(TIMER_PRESETS[index].duration);
  }, []);

  const formatMinSec = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const currentFocusTask = tasks.find((t) => !t.completed);
  const canCreateTask = extractedTask.title && extractedTask.title !== 'Nova Tarefa' && typedText.trim().length > 0;
  const progress = timerDuration / TIMER_PRESETS[timerPresetIndex].duration;
  const circumference = 2 * Math.PI * 70;
  const dashOffset = circumference * (1 - progress);
  const activeTasks = tasks.filter((t) => !t.completed).length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const dailyProgress = tasks.length > 0 ? completedTasks / tasks.length : 0;

  const priorityColors = PRIORITY_CONFIG;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#f5f0ff] via-[#f0f4ff] to-[#e8f0fe] p-4 selection:bg-[#8958f3]/20">
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes celebrate-in { 0% { opacity: 0; transform: scale(0.9) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes celebrate-out { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.9); } }
        @keyframes slide-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in-right { 0% { opacity: 0; transform: translateX(20px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes slide-out-left { 0% { opacity: 1; transform: translateX(0); } 100% { opacity: 0; transform: translateX(-20px); } }
        @keyframes timer-glow { 0%, 100% { filter: drop-shadow(0 0 8px rgba(137, 88, 243, 0.3)); } 50% { filter: drop-shadow(0 0 16px rgba(137, 88, 243, 0.6)); } }
        @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 20px rgba(137, 88, 243, 0.15); } 50% { box-shadow: 0 0 40px rgba(137, 88, 243, 0.3); } }
        @keyframes confetti-fall { 0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; } 100% { transform: translateY(120px) rotate(720deg) scale(0); opacity: 0; } }
        @keyframes toast-in { 0% { opacity: 0; transform: translateY(-20px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes toast-out { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-10px) scale(0.95); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-out-left { animation: slide-out-left 0.3s ease-in forwards; }
        .animate-timer-glow { animation: timer-glow 2s ease-in-out infinite; }
        .animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }
        .animate-toast-in { animation: toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-toast-out { animation: toast-out 0.3s ease-in forwards; }
        .minimal-scrollbar::-webkit-scrollbar { width: 3px; }
        .minimal-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .minimal-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 9999px; transition: background 0.2s; }
        .minimal-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
        .minimal-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.3) transparent; }
        .hide-scrollbar::-webkit-scrollbar { width: 0px; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .task-item-enter { animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] ${toastType === 'info' ? 'bg-slate-800' : 'bg-emerald-600'} text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-toast-in`}>
          <span className="text-sm font-semibold">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="relative">
        <div
          className="absolute -inset-20 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(137, 88, 243, 0.08) 0%, rgba(167, 139, 250, 0.04) 40%, transparent 70%)' }}
        />

        <div className="relative bg-gradient-to-b from-[#1a1a2e] via-[#16162a] to-[#0f0f1e] rounded-[55px] p-[6px] shadow-[0_0_0_2px_rgba(255,255,255,0.08),0_25px_80px_-12px_rgba(0,0,0,0.6),0_0_100px_-20px_rgba(137,88,243,0.15)] w-[390px]">
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-36 h-7 bg-[#0a0a12] rounded-full flex items-center justify-center gap-6 z-20">
            <div className="w-2.5 h-2.5 bg-[#1e1e3a] rounded-full border border-[#2a2a4a]" />
            <div className="w-16 h-1.5 bg-[#1e1e3a] rounded-full" />
            <div className="w-2.5 h-2.5 rounded-full" />
          </div>

          <div className="relative bg-white rounded-[50px] overflow-y-auto minimal-scrollbar" style={{ height: '720px' }}>
            {showCelebration && (
              <div className="absolute inset-0 z-50 flex items-center justify-center animate-celebrate-in">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-900/95 backdrop-blur-sm" />
                {confettiParticles.map((p) => (
                  <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.color,
                      animation: `confetti-fall 1.2s ${p.delay}s ease-out forwards`,
                      transform: `rotate(${p.rotation}deg)`,
                    }}
                  />
                ))}
                <div className="relative flex flex-col items-center gap-4 px-6">
                  <div className="relative">
                    <div className="absolute inset-0 w-20 h-20 bg-emerald-400 rounded-full animate-ping opacity-20" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                      <Check className="w-10 h-10 stroke-[3] text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white mb-1">Excelente!</p>
                    <p className="text-sm text-slate-400">"{celebrationData?.title}" concluída!</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full">
                    <Flame className="w-5 h-5 fill-current animate-pulse" />
                    <span className="text-sm font-bold">{celebrationData?.streak} dias de streak!</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Menos papelada, mais atitude ✨</p>
                </div>
              </div>
            )}

            <header className="px-5 pt-12 pb-3 flex justify-between items-center bg-gradient-to-b from-white to-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6d3ad4] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#8958f3]/25">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[15px] tracking-tight text-slate-900">nexa</span>
                    <span className="bg-gradient-to-r from-[#8958f3] to-[#a78bfa] text-[8px] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">app</span>
                  </div>
                  <p className="text-[9px] text-slate-400 -mt-0.5">Assistente inteligente</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100/80 rounded-full px-2.5 py-1.5 border border-slate-200/50">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hoje</span>
                  <span className="text-[12px] font-mono font-bold text-[#6d3ad4]">{completedToday}</span>
                </div>
                <div className="flex items-center gap-1 bg-gradient-to-r from-amber-50 to-orange-50 py-1.5 px-2.5 rounded-full border border-amber-200/60">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="text-[11px] font-mono font-bold text-amber-600">{streakCount}d</span>
                </div>
              </div>
            </header>

            <div className="flex mx-4 mb-3 p-1 bg-slate-100 rounded-2xl relative">
              <div
                className="absolute top-1 bottom-1 bg-white rounded-xl shadow-sm transition-all duration-300 ease-out"
                style={{
                  left: activeTab === 'input' ? '4px' : 'calc(50% + 2px)',
                  width: 'calc(50% - 6px)',
                }}
              />
              <button
                type="button"
                onClick={() => setActiveTab('input')}
                className={`flex-1 py-2.5 text-[11px] font-semibold rounded-xl relative z-10 transition-colors cursor-pointer ${activeTab === 'input' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Entrada
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('focus')}
                className={`flex-1 py-2.5 text-[11px] font-semibold rounded-xl relative z-10 transition-colors cursor-pointer ${activeTab === 'focus' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Foco
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 hide-scrollbar">
              {activeTab === 'input' ? (
                <div className="space-y-3 animate-slide-up">
                  <div className="relative rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3]" />
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(137, 88, 243, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(167, 139, 250, 0.3) 0%, transparent 40%)' }} />
                    <div className="relative p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-[#a78bfa]" />
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#c4b5fd] font-semibold">Entrada Rápida</span>
                      </div>
                      <p className="text-[13px] text-white/80 leading-relaxed">
                        Digite sua ideia em linguagem natural e veja como a <span className="text-white font-semibold">Nexa</span> transforma em uma tarefa clara.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold">Comando Inteligente</p>
                        <p className="text-[13px] font-bold text-slate-900">Assistente de Lista Instantânea</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePresetClick(PRESET_CONVERSATIONS[0])}
                        className="text-[10px] text-[#8958f3] font-semibold flex items-center gap-1 hover:gap-2 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        Exemplo
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                        placeholder="Ex: Treino hoje 18h importante..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-12 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:border-[#8958f3] focus:ring-4 focus:ring-[#8958f3]/10 transition-all"
                      />
                      <div className="absolute left-3.5 top-3.5 w-5 h-5 rounded-lg bg-gradient-to-br from-[#8958f3]/20 to-[#a78bfa]/20 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-[#8958f3]" />
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateTask}
                        disabled={!canCreateTask}
                        className={`absolute right-1.5 top-1.5 rounded-xl p-2.5 shadow-lg transition-all active:scale-95 ${canCreateTask ? 'bg-gradient-to-r from-[#8958f3] to-[#a78bfa] text-white shadow-[#8958f3]/25 hover:shadow-xl hover:shadow-[#8958f3]/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        title="Adicionar tarefa"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_CONVERSATIONS.slice(0, 4).map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => handlePresetClick(preset)}
                        className="rounded-2xl bg-white border border-slate-200/80 p-3.5 text-left hover:border-[#8958f3]/30 hover:shadow-md transition-all active:scale-[0.98] group"
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className={`w-2 h-2 rounded-full ${preset.p === 'Alta' ? 'bg-rose-500' : preset.p === 'Média' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{preset.date}</span>
                        </div>
                        <span className="text-[12px] font-bold text-slate-900 block leading-tight">{preset.title}</span>
                        <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          {preset.time}
                          <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </span>
                      </button>
                    ))}
                  </div>

                  {canCreateTask ? (
                    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 p-4 space-y-3 shadow-sm animate-slide-up">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8958f3] animate-pulse" />
                          Prévia inteligente
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${priorityColors[extractedTask.priority]?.bgSoft} ${priorityColors[extractedTask.priority]?.text}`}>
                          {extractedTask.priority}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{extractedTask.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {extractedTask.dueDate} {extractedTask.time !== 'Livre' ? `· ${extractedTask.time}` : ''}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${CATEGORIES[extractedTask.category]?.color || 'bg-slate-100 text-slate-600'}`}>
                            {extractedTask.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 p-5 text-center">
                      <Sparkles className="w-5 h-5 text-slate-300 mx-auto mb-2 animate-float" />
                      <p className="text-[12px] text-slate-400">Digite um comando para ver a prévia</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCreateTask}
                    disabled={!canCreateTask}
                    className={`w-full rounded-2xl py-3.5 font-bold text-sm transition-all ${canCreateTask ? 'bg-gradient-to-r from-[#6d3ad4] via-[#8958f3] to-[#a78bfa] text-white shadow-lg shadow-[#8958f3]/20 hover:shadow-xl hover:shadow-[#8958f3]/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    aria-disabled={!canCreateTask}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      Criar tarefa inteligente
                    </span>
                  </button>

                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Minhas Tarefas ({activeTasks})
                      </p>
                      <div className="flex gap-1">
                        {['all', 'active', 'completed'].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFilter(f)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${filter === f ? 'bg-[#8958f3] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                          >
                            {f === 'all' ? 'Todas' : f === 'active' ? 'Ativas' : 'Feitas'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#8958f3] to-[#a78bfa] rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${dailyProgress * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">{Math.round(dailyProgress * 100)}%</span>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto hide-scrollbar pr-1">
                      {filteredTasks.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                            <Filter className="w-5 h-5 text-slate-300" />
                          </div>
                          <p className="text-[12px] text-slate-400">Nenhuma tarefa {filter === 'active' ? 'ativa' : filter === 'completed' ? 'concluída' : 'ainda'}</p>
                        </div>
                      ) : (
                        filteredTasks.map((task) => {
                          const pc = priorityColors[task.priority] || priorityColors['Média'];
                          const cat = CATEGORIES[task.category] || CATEGORIES['Pessoal'];
                          const isEditing = editingTaskId === task.id;

                          return (
                            <div
                              key={task.id}
                              className={`rounded-2xl p-3 border transition-all task-item-enter ${task.completed ? 'bg-emerald-50/50 border-emerald-200/50' : 'bg-white border-slate-200/80 hover:border-[#8958f3]/20 hover:shadow-sm'}`}
                            >
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleTaskCompletion(task.id)}
                                  className={`w-5 h-5 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : `bg-white border ${pc.border}`}`}
                                >
                                  {task.completed && <Check className="w-3 h-3 stroke-[3] text-white" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                      className="w-full text-[12px] font-semibold bg-slate-50 border border-[#8958f3] rounded-lg px-2 py-1 focus:outline-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <p className={`text-[12px] font-semibold truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                      {task.title}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      {task.time}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase ${pc.bgSoft} ${pc.text}`}>
                                      {task.priority}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold ${cat.color}`}>
                                      {task.category}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  {!task.completed && (
                                    <button
                                      type="button"
                                      onClick={() => startEditing(task)}
                                      className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                                    >
                                      <Edit2 className="w-2.5 h-2.5 text-slate-400" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => deleteTask(task.id, e)}
                                    className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Remover tarefa"
                                  >
                                    <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full animate-slide-up">
                  {currentFocusTask ? (
                    <>
                      <div className="relative rounded-3xl overflow-hidden shadow-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#8958f3] to-[#6d3ad4]" />
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 0%, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />
                        <div className="relative p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-[9px] text-white font-bold uppercase tracking-wider">Em foco agora</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-bold bg-white/15 text-white`}>
                                {currentFocusTask.priority}
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-bold bg-white/15 text-white`}>
                                {currentFocusTask.category}
                              </span>
                            </div>
                          </div>
                          <h3 className="font-bold text-[17px] text-white leading-tight">{currentFocusTask.title}</h3>
                          <p className="text-[12px] text-white/70 mt-2 flex items-center gap-2">
                            <span className="bg-white/10 rounded-md px-2 py-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {currentFocusTask.dueDate}
                            </span>
                            {currentFocusTask.time && currentFocusTask.time !== 'Livre' && (
                              <span>{currentFocusTask.time}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-5 mt-6">
                        <div className="relative animate-timer-glow">
                          <div className="absolute inset-0 w-44 h-44 rounded-full bg-gradient-to-br from-[#8958f3]/5 to-[#a78bfa]/5" />
                          <svg className="w-44 h-44 relative z-10" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                            <circle
                              cx="80"
                              cy="80"
                              r="70"
                              stroke="url(#timerGradient)"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={circumference}
                              strokeDashoffset={dashOffset}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                            />
                            <defs>
                              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6d3ad4" />
                                <stop offset="100%" stopColor="#a78bfa" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <span className="font-mono text-[32px] font-bold text-slate-900 tracking-tight">{formatMinSec(timerDuration)}</span>
                            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-semibold mt-1">
                              {isTimerRunning ? 'Concentrado' : 'Pomodoro'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {TIMER_PRESETS.map((preset, idx) => {
                            const Icon = preset.icon;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleTimerPresetChange(idx)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${timerPresetIndex === idx ? 'bg-[#8958f3] text-white shadow-lg shadow-[#8958f3]/25' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setIsTimerRunning(false);
                              setTimerDuration(TIMER_PRESETS[timerPresetIndex].duration);
                            }}
                            className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-95 border border-slate-200 cursor-pointer"
                            title="Reiniciar"
                          >
                            <RefreshCw className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsTimerRunning((prev) => !prev)}
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer ${isTimerRunning ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/25' : 'bg-gradient-to-br from-[#6d3ad4] to-[#8958f3] text-white shadow-[#8958f3]/25'}`}
                            title={isTimerRunning ? 'Pausar' : 'Iniciar'}
                          >
                            {isTimerRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsTimerRunning(false);
                              setTimerDuration(5 * 60);
                              showToast('☕ Pausa de 5 minutos', 'info');
                            }}
                            className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-95 border border-slate-200 cursor-pointer"
                            title="Pausa curta"
                          >
                            <AlertCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-auto space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleTaskCompletion(currentFocusTask.id)}
                          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-5 h-5 stroke-[2.5]" />
                          Concluir Tarefa
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('input')}
                          className="w-full rounded-2xl bg-slate-100 text-slate-600 py-3 font-semibold hover:bg-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Ver todas as tarefas
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                      <div className="relative mb-4 animate-float">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                          <Check className="w-10 h-10 stroke-[2] text-emerald-500" />
                        </div>
                      </div>
                      <p className="text-[14px] font-bold text-slate-900 mb-1">Tudo concluído! 🎉</p>
                      <p className="text-[12px] text-slate-400 mb-4">Nenhuma tarefa em foco no momento.</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('input')}
                        className="bg-gradient-to-r from-[#8958f3] to-[#a78bfa] text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-[#8958f3]/20 hover:shadow-xl transition-all cursor-pointer"
                      >
                        Criar nova tarefa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer className="px-4 py-2.5 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
              <div className="flex items-center justify-center gap-1.5">
                <Smartphone className="w-3 h-3 text-[#8958f3]" />
                <span className="text-[9px] text-slate-400 font-semibold">Interface interativa — Toque nos botões</span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
