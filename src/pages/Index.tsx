import { useState, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";

type AppState = "idle" | "processing" | "done";

interface HistoryItem {
  id: string;
  name: string;
  date: string;
  duration: string;
}

const MOCK_HISTORY: HistoryItem[] = [
  { id: "1", name: "Arctic Monkeys - Do I Wanna Know.mp3", date: "10 мая 2026", duration: "4:32" },
  { id: "2", name: "Radiohead - Creep.mp3", date: "9 мая 2026", duration: "3:58" },
  { id: "3", name: "Nirvana - Smells Like Teen Spirit.wav", date: "8 мая 2026", duration: "5:01" },
];

const SpectrumVisualizer = ({ active }: { active: boolean }) => {
  const bars = Array.from({ length: 48 });
  return (
    <div className="flex items-end justify-center gap-[3px] h-16">
      {bars.map((_, i) => {
        const delay = (i * 37) % 800;
        return (
          <div
            key={i}
            className="w-1 rounded-full"
            style={{
              height: active ? undefined : "8%",
              minHeight: "4px",
              background: i < 16
                ? `rgba(0, 245, 160, ${0.4 + (i / 16) * 0.6})`
                : i < 32
                ? `rgba(56, 189, 248, ${0.4 + ((i - 16) / 16) * 0.6})`
                : `rgba(168, 85, 247, ${0.4 + ((i - 32) / 16) * 0.6})`,
              animation: active ? `bar-dance ${0.4 + (delay / 1000)}s ease-in-out infinite` : undefined,
              animationDelay: active ? `${delay}ms` : undefined,
              transition: "height 0.3s ease",
            }}
          />
        );
      })}
    </div>
  );
};

const WaveBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 1440 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00f5a0" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path d="M0,100 C240,60 480,140 720,100 C960,60 1200,140 1440,100 L1440,200 L0,200 Z" fill="url(#waveGrad1)" />
    </svg>
    <svg className="absolute bottom-0 left-0 w-full opacity-[0.06]" viewBox="0 0 1440 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#00f5a0" />
        </linearGradient>
      </defs>
      <path d="M0,120 C360,80 720,160 1080,120 C1260,100 1380,80 1440,120 L1440,200 L0,200 Z" fill="url(#waveGrad2)" />
    </svg>
    <div
      className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
      style={{ background: "radial-gradient(circle, rgba(0,245,160,0.04) 0%, transparent 70%)" }}
    />
  </div>
);

const ProcessingAnimation = ({ progress }: { progress: number }) => (
  <div className="flex flex-col items-center gap-6">
    <div className="relative w-28 h-28">
      <div
        className="absolute inset-0 rounded-full border-2 opacity-20"
        style={{ borderColor: "#00f5a0" }}
      />
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r="46"
          fill="none"
          stroke="url(#progGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 46}`}
          strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress / 100)}`}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
        <defs>
          <linearGradient id="progGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5a0" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-xl font-medium" style={{ color: "#00f5a0" }}>
          {progress}%
        </span>
      </div>
    </div>
    <div className="text-center">
      <p className="font-syne font-semibold text-white/90 mb-1">Разделяю аудио...</p>
      <p className="font-mono text-xs text-white/40">ИИ анализирует частоты</p>
    </div>
    <SpectrumVisualizer active={true} />
  </div>
);

const ResultCard = ({ type, filename }: { type: "vocal" | "instrumental"; filename: string }) => {
  const isVocal = type === "vocal";
  const color = isVocal ? "#00f5a0" : "#a855f7";
  const bgColor = isVocal ? "rgba(0, 245, 160, 0.06)" : "rgba(168, 85, 247, 0.06)";
  const borderColor = isVocal ? "rgba(0, 245, 160, 0.2)" : "rgba(168, 85, 247, 0.2)";

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 animate-scale-in"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          <Icon name={isVocal ? "Mic2" : "Music2"} size={20} style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="font-syne font-semibold text-white/90 text-sm">
            {isVocal ? "Вокал" : "Инструментал"}
          </p>
          <p className="font-mono text-[10px] text-white/40 truncate">
            {filename.replace(/\.[^.]+$/, "")}_{type}.wav
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-[2px] h-8">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: `${Math.sin(i * 0.5) * 50 + 50}%`,
              background: color,
              opacity: 0.3 + Math.abs(Math.sin(i * 0.7)) * 0.5,
            }}
          />
        ))}
      </div>

      <button
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-syne font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
        style={{ background: color, color: "#050810" }}
      >
        <Icon name="Download" size={16} />
        Скачать WAV
      </button>
    </div>
  );
};

export default function Index() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startProcessing = useCallback((name: string) => {
    setFileName(name);
    setAppState("processing");
    setProgress(0);
    let p = 0;
    progressRef.current = setInterval(() => {
      p += Math.random() * 4 + 1;
      if (p >= 100) {
        p = 100;
        clearInterval(progressRef.current!);
        setTimeout(() => setAppState("done"), 300);
      }
      setProgress(Math.floor(p));
    }, 120);
  }, []);

  useEffect(() => () => { if (progressRef.current) clearInterval(progressRef.current); }, []);

  const handleFile = (file: File) => {
    if (!file) return;
    startProcessing(file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleReset = () => {
    setAppState("idle");
    setProgress(0);
    setFileName("");
  };

  return (
    <div className="min-h-screen font-syne relative" style={{ background: "var(--bg-deep)" }}>
      <WaveBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center animate-glow-pulse"
            style={{ background: "rgba(0, 245, 160, 0.1)", border: "1px solid rgba(0, 245, 160, 0.25)" }}
          >
            <Icon name="AudioWaveform" size={18} style={{ color: "var(--neon-green)" }} fallback="Music" />
          </div>
          <div>
            <h1 className="font-syne font-bold text-white text-base leading-none">StemSplit</h1>
            <p className="font-mono text-[10px] mt-0.5" style={{ color: "var(--neon-green)" }}>AI AUDIO SEPARATOR</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {[
            { id: "upload", label: "Загрузка", icon: "Upload" },
            { id: "history", label: "История", icon: "Clock" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                if (tab.id === "upload" && appState === "done") handleReset();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={
                activeTab === tab.id
                  ? { background: "rgba(0, 245, 160, 0.12)", color: "var(--neon-green)", border: "1px solid rgba(0, 245, 160, 0.2)" }
                  : { color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }
              }
            >
              <Icon name={tab.icon} size={14} fallback="Circle" />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12">

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="animate-fade-in">

            {/* Hero */}
            {appState === "idle" && (
              <div className="text-center mb-10">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 font-mono text-xs"
                  style={{ background: "rgba(0, 245, 160, 0.08)", border: "1px solid rgba(0, 245, 160, 0.15)", color: "var(--neon-green)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-glow inline-block" />
                  ИИ-обработка · WAV высокое качество
                </div>
                <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
                  Раздели музыку<br />
                  <span style={{ color: "var(--neon-green)" }}>на части</span>
                </h2>
                <p className="text-white/45 text-base font-normal">
                  Загрузи трек — получи вокал и инструментал отдельно
                </p>
              </div>
            )}

            {/* Drop Zone */}
            {appState === "idle" && (
              <div
                className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer mb-8`}
                style={{
                  borderColor: isDragOver ? "var(--neon-green)" : "rgba(255,255,255,0.1)",
                  background: isDragOver ? "rgba(0, 245, 160, 0.04)" : "rgba(255,255,255,0.02)",
                  padding: "48px 32px",
                  boxShadow: isDragOver ? "0 0 0 1px rgba(0, 245, 160, 0.4), inset 0 0 40px rgba(0, 245, 160, 0.04)" : undefined,
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.flac,.aac,.ogg"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(0, 245, 160, 0.08)", border: "1px solid rgba(0, 245, 160, 0.15)" }}
                  >
                    <Icon name="Upload" size={28} style={{ color: "var(--neon-green)" }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-white/80 text-base mb-1">
                      Перетащи файл или{" "}
                      <span style={{ color: "var(--neon-green)" }}>нажми для выбора</span>
                    </p>
                    <p className="font-mono text-xs text-white/30">MP3 · WAV · FLAC · AAC · до 200 МБ</p>
                  </div>
                  <SpectrumVisualizer active={false} />
                </div>
              </div>
            )}

            {/* Processing */}
            {appState === "processing" && (
              <div
                className="rounded-2xl p-10 flex flex-col items-center mb-8"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="font-mono text-xs text-white/30 mb-6 truncate max-w-full px-4 text-center">
                  {fileName}
                </div>
                <ProcessingAnimation progress={progress} />
                <div className="mt-6 w-full max-w-xs">
                  <div className="h-px rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full relative overflow-hidden"
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, #00f5a0, #38bdf8)",
                        transition: "width 0.3s ease",
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                          animation: "progress-shine 1.5s ease-in-out infinite",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Done: Results */}
            {appState === "done" && (
              <div className="mb-8">
                <div className="text-center mb-6">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs mb-4"
                    style={{ background: "rgba(0, 245, 160, 0.1)", border: "1px solid rgba(0, 245, 160, 0.2)", color: "var(--neon-green)" }}
                  >
                    <Icon name="CheckCircle" size={12} />
                    Обработка завершена
                  </div>
                  <p className="font-mono text-xs text-white/30 truncate px-8">{fileName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <ResultCard type="vocal" filename={fileName} />
                  <ResultCard type="instrumental" filename={fileName} />
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80 flex items-center justify-center gap-2"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
                >
                  <Icon name="Plus" size={16} />
                  Обработать ещё один трек
                </button>
              </div>
            )}

            {/* Features row */}
            {appState === "idle" && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "Zap", label: "Быстро", desc: "до 2 минут" },
                  { icon: "Shield", label: "Качество", desc: "WAV высокое" },
                  { icon: "Lock", label: "Приватно", desc: "файлы не хранятся" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="rounded-xl p-4 text-center"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}
                  >
                    <Icon name={f.icon} size={18} className="mx-auto mb-2" style={{ color: "var(--neon-green)" }} fallback="Circle" />
                    <p className="font-semibold text-white/80 text-sm">{f.label}</p>
                    <p className="font-mono text-[10px] text-white/30 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">История</h2>
              <span className="font-mono text-xs text-white/30">{MOCK_HISTORY.length} трека</span>
            </div>

            <div className="flex flex-col gap-3">
              {MOCK_HISTORY.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl p-4 flex items-center gap-4 group transition-all"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border-subtle)",
                    animationDelay: `${idx * 80}ms`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0, 245, 160, 0.06)", border: "1px solid rgba(0, 245, 160, 0.12)" }}
                  >
                    <Icon name="Music" size={16} style={{ color: "var(--neon-green)" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white/85 text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="font-mono text-[10px] text-white/30">{item.date}</span>
                      <span className="font-mono text-[10px] text-white/20">·</span>
                      <span className="font-mono text-[10px] text-white/30">{item.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-all hover:opacity-80"
                      style={{ background: "rgba(0, 245, 160, 0.1)", color: "var(--neon-green)", border: "1px solid rgba(0, 245, 160, 0.15)" }}
                    >
                      <Icon name="Mic2" size={12} />
                      Вокал
                    </button>
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-all hover:opacity-80"
                      style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7", border: "1px solid rgba(168, 85, 247, 0.15)" }}
                    >
                      <Icon name="Music2" size={12} />
                      Инстр.
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-6 rounded-2xl p-6 text-center"
              style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.06)" }}
            >
              <Icon name="Clock" size={24} className="mx-auto mb-2 opacity-20" />
              <p className="text-white/25 font-mono text-xs">Здесь будет полная история обработок</p>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center pb-8">
        <p className="font-mono text-[10px] text-white/15">
          STEMSPLIT · AI AUDIO SEPARATOR · 2026
        </p>
      </footer>
    </div>
  );
}
