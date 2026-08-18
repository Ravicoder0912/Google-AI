import React, { useState, useEffect, useRef } from "react";
import {
  Dices,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  Trophy,
  Coins,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Shuffle,
  Flame,
  Heart,
  ArrowRight,
} from "lucide-react";

interface RandomizerOption {
  id: string;
  name: string;
  color: string;
}

interface RandomizerTabProps {
  initialOptions?: Array<{ id: string; name: string }>;
  decisionTitle?: string;
  onCommitChoice?: (chosenOptionName: string) => void;
}

const PALETTE = [
  "#4F46E5", // Indigo
  "#059669", // Emerald
  "#D97706", // Amber
  "#E11D48", // Rose
  "#0284C7", // Sky
  "#7C3AED", // Violet
  "#0D9488", // Teal
  "#EA580C", // Orange
];

export const RandomizerTab: React.FC<RandomizerTabProps> = ({
  initialOptions,
  decisionTitle,
  onCommitChoice,
}) => {
  const [options, setOptions] = useState<RandomizerOption[]>(() => {
    if (initialOptions && initialOptions.length >= 2) {
      return initialOptions.map((o, idx) => ({
        id: o.id || `opt-${idx}`,
        name: o.name,
        color: PALETTE[idx % PALETTE.length],
      }));
    }
    return [
      { id: "opt-1", name: "Option A", color: PALETTE[0] },
      { id: "opt-2", name: "Option B", color: PALETTE[1] },
      { id: "opt-3", name: "Option C", color: PALETTE[2] },
    ];
  });

  const [mode, setMode] = useState<"wheel" | "coin" | "dice">("wheel");
  const [newOptionInput, setNewOptionInput] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<RandomizerOption | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gutReactionReaction, setGutReaction] = useState<"relief" | "disappointed" | null>(null);

  // Wheel animation refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Web Audio synth for mechanical wheel click sound
  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // Audio autoplay policy
    }
  };

  const playWinChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.3);
      });
    } catch (e) {}
  };

  // Draw the wheel on canvas
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const numOptions = options.length;

    if (numOptions === 0) return;
    const sliceAngle = (2 * Math.PI) / numOptions;

    ctx.clearRect(0, 0, width, height);

    // Draw outer ring shadow
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();

    // Draw Slices
    for (let i = 0; i < numOptions; i++) {
      const startAngle = angle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const opt = options[i];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = opt.color;
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw Slice Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 4;

      const maxLen = 16;
      const displayText = opt.name.length > maxLen ? opt.name.slice(0, maxLen - 1) + "…" : opt.name;
      ctx.fillText(displayText, radius - 24, 5);
      ctx.restore();
    }

    // Center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = "#0F172A";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center icon dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#F8FAFC";
    ctx.fill();
  };

  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [options]);

  // Spin Wheel Physics Execution
  const handleSpinWheel = () => {
    if (isSpinning || options.length < 2) return;

    setIsSpinning(true);
    setSelectedWinner(null);
    setGutReaction(null);

    const fullRotations = 5 + Math.random() * 4; // 5 to 9 full spins
    const randomExtra = Math.random() * 2 * Math.PI;
    const targetTotalAngle = fullRotations * 2 * Math.PI + randomExtra;
    const duration = 4200; // ms
    const startTime = performance.now();
    const startAngle = currentAngleRef.current;
    let lastTickAngle = startAngle;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic ease-out deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startAngle + targetTotalAngle * easeOut;
      currentAngleRef.current = current;

      // Click sound on crossing segment boundaries
      const slice = (2 * Math.PI) / options.length;
      if (Math.floor(current / slice) !== Math.floor(lastTickAngle / slice)) {
        playClickSound();
        lastTickAngle = current;
      }

      drawWheel(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setSpinCount((c) => c + 1);

        // Compute which slice landed at the top pointer (3 * PI / 2 or top 270 deg)
        // Canvas coordinate 0 is 3 o'clock (right). Pointer is at 12 o'clock (-PI/2 or 3PI/2)
        const normalizedAngle = (current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        // The pointer is at angle 3*PI/2 (top)
        const pointerAngle = (1.5 * Math.PI - normalizedAngle + 2 * Math.PI) % (2 * Math.PI);
        const winningIndex = Math.floor(pointerAngle / slice) % options.length;
        const winner = options[winningIndex] || options[0];

        setSelectedWinner(winner);
        playWinChime();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Coin Flip Mode Execution
  const handleFlipCoin = () => {
    if (isSpinning || options.length < 2) return;
    setIsSpinning(true);
    setSelectedWinner(null);
    setGutReaction(null);

    const winnerIndex = Math.random() < 0.5 ? 0 : 1;
    let tick = 0;
    const interval = setInterval(() => {
      playClickSound();
      tick++;
      if (tick > 12) {
        clearInterval(interval);
        setIsSpinning(false);
        setSelectedWinner(options[winnerIndex]);
        setSpinCount((c) => c + 1);
        playWinChime();
      }
    }, 120);
  };

  const handleAddOption = () => {
    if (!newOptionInput.trim()) return;
    const nextColor = PALETTE[options.length % PALETTE.length];
    setOptions([
      ...options,
      {
        id: `custom-opt-${Date.now()}`,
        name: newOptionInput.trim(),
        color: nextColor,
      },
    ]);
    setNewOptionInput("");
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleEliminateWinnerAndRespin = () => {
    if (!selectedWinner) return;
    if (options.length <= 2) {
      alert("At least 2 options are required for random selection.");
      return;
    }
    const remaining = options.filter((o) => o.id !== selectedWinner.id);
    setOptions(remaining);
    setSelectedWinner(null);
    setGutReaction(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center flex-shrink-0">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-lg sm:text-xl">
                  Random Decision Maker & Gut Probe
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Subconscious Revealer
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Stuck in analysis paralysis? Spin the wheel or flip a coin to break the tie and instantly reveal how your gut truly reacts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-md text-xs font-medium border transition-colors ${
                soundEnabled
                  ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}
              title={soundEnabled ? "Mute audio effects" : "Enable audio effects"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setMode("wheel")}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  mode === "wheel"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Wheel
              </button>
              <button
                onClick={() => setMode("coin")}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  mode === "coin"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Coin Flip
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / CENTER: RANDOMIZER STAGE */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col items-center justify-center relative min-h-[420px]">
          {/* Wheel Mode */}
          {mode === "wheel" && (
            <div className="relative flex flex-col items-center">
              {/* Pointer at 12 o'clock pointing downward */}
              <div className="absolute -top-3 z-10 filter drop-shadow-md">
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-rose-600 animate-bounce" />
              </div>

              {/* Canvas wheel */}
              <canvas
                ref={canvasRef}
                width={340}
                height={340}
                className="max-w-full h-auto rounded-full transition-transform duration-75 select-none"
              />

              {/* Action Button */}
              <button
                onClick={handleSpinWheel}
                disabled={isSpinning || options.length < 2}
                className={`mt-6 px-6 py-2.5 rounded-lg font-bold text-sm text-white shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                  isSpinning
                    ? "bg-slate-400 cursor-not-allowed scale-95"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 ring-4 ring-indigo-100"
                }`}
              >
                <Shuffle className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
                <span>{isSpinning ? "Spinning..." : "Spin the Wheel"}</span>
              </button>
            </div>
          )}

          {/* Coin Flip Mode */}
          {mode === "coin" && (
            <div className="flex flex-col items-center justify-center space-y-6 py-6">
              <div
                className={`w-36 h-36 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-100 border-4 border-amber-600 shadow-xl flex items-center justify-center text-center p-3 transition-transform duration-300 select-none ${
                  isSpinning ? "animate-spin scale-110" : "hover:scale-105"
                }`}
              >
                <div className="w-28 h-28 rounded-full border-2 border-dashed border-amber-700 flex flex-col items-center justify-center">
                  <Coins className="w-8 h-8 text-amber-900 mb-1" />
                  <span className="font-bold text-amber-950 text-xs uppercase tracking-wider px-1 line-clamp-1">
                    {selectedWinner ? selectedWinner.name : "Flip Me"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-slate-100 border text-slate-700 font-semibold">
                  Heads: {options[0]?.name || "Option 1"}
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 border text-slate-700 font-semibold">
                  Tails: {options[1]?.name || "Option 2"}
                </span>
              </div>

              <button
                onClick={handleFlipCoin}
                disabled={isSpinning || options.length < 2}
                className="px-6 py-2.5 rounded-lg font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
              >
                <Coins className="w-4 h-4" />
                <span>{isSpinning ? "Flipping..." : "Flip the Coin"}</span>
              </button>
            </div>
          )}

          {/* WINNER RESULT POPUP & FREUD-KAHNEMAN TEST */}
          {selectedWinner && !isSpinning && (
            <div className="w-full mt-6 p-5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-lg animate-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                      Fate Has Spoken
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {selectedWinner.name}
                    </h3>
                  </div>
                </div>

                {onCommitChoice && (
                  <button
                    onClick={() => onCommitChoice(selectedWinner.name)}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    Lock In This Choice
                  </button>
                )}
              </div>

              {/* Kahneman Freud Intuition Test */}
              <div className="mt-4 p-4 rounded-lg bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-white">The Kahneman-Freud Intuition Test: </span>
                    Notice your immediate visceral sensation the instant it landed on{" "}
                    <span className="font-bold text-emerald-300">"{selectedWinner.name}"</span>.
                    Did you feel a wave of relief, or a quiet pang of disappointment?
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setGutReaction("relief")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                      gutReactionReaction === "relief"
                        ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>I felt relief! (I truly want this)</span>
                  </button>

                  <button
                    onClick={() => setGutReaction("disappointed")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                      gutReactionReaction === "disappointed"
                        ? "bg-rose-600 text-white ring-2 ring-rose-400"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-300" />
                    <span>I felt disappointed...</span>
                  </button>
                </div>

                {/* Subconscious revelation feedback */}
                {gutReactionReaction === "disappointed" && (
                  <div className="p-3 rounded-md bg-rose-950/60 border border-rose-800 text-xs text-rose-200 animate-in fade-in flex items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-white">💡 Subconscious Insight: </span>
                      Your disappointment proves you didn't actually want "{selectedWinner.name}". Eliminate this choice from the pool and spin again!
                    </div>
                    {options.length > 2 && (
                      <button
                        onClick={handleEliminateWinnerAndRespin}
                        className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white font-medium rounded text-[11px] whitespace-nowrap flex-shrink-0"
                      >
                        Eliminate & Re-spin
                      </button>
                    )}
                  </div>
                )}

                {gutReactionReaction === "relief" && (
                  <div className="p-3 rounded-md bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 animate-in fade-in">
                    <span className="font-bold text-white">🎉 Conviction Confirmed: </span>
                    Your subconscious is fully aligned. Stop overthinking and move to immediate execution!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: OPTION CONFIGURATION POOL */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Active Choice Pool ({options.length})
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {spinCount > 0 ? `${spinCount} spins completed` : "Ready to spin"}
              </span>
            </div>

            {/* Option Input Form */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newOptionInput}
                onChange={(e) => setNewOptionInput(e.target.value)}
                placeholder="Add custom option..."
                className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-800"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddOption();
                }}
              />
              <button
                onClick={handleAddOption}
                disabled={!newOptionInput.trim()}
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-40 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {options.map((opt, idx) => (
                <div
                  key={opt.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 group hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {opt.name}
                    </span>
                  </div>

                  {options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(opt.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove option"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
              Quick Decision Templates
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  setOptions([
                    { id: "p1", name: "Yes / Proceed", color: PALETTE[0] },
                    { id: "p2", name: "No / Wait", color: PALETTE[3] },
                  ]);
                  setSelectedWinner(null);
                }}
                className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
              >
                Yes vs No
              </button>
              <button
                onClick={() => {
                  setOptions([
                    { id: "p1", name: "Accept New Offer", color: PALETTE[0] },
                    { id: "p2", name: "Stay at Current Role", color: PALETTE[1] },
                    { id: "p3", name: "Negotiate Counter", color: PALETTE[2] },
                  ]);
                  setSelectedWinner(null);
                }}
                className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
              >
                Job Dilemma
              </button>
              {initialOptions && initialOptions.length >= 2 && (
                <button
                  onClick={() => {
                    setOptions(
                      initialOptions.map((o, idx) => ({
                        id: o.id || `opt-${idx}`,
                        name: o.name,
                        color: PALETTE[idx % PALETTE.length],
                      }))
                    );
                    setSelectedWinner(null);
                  }}
                  className="text-[10px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-medium transition-colors border border-indigo-100"
                >
                  Reset to Current Decision
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
