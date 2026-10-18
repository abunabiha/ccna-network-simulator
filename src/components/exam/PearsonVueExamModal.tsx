import React, { useState, useEffect, useRef } from 'react';
import { CCNA_EXAM_QUESTIONS } from '../../data/pearsonVueExam';
import { ExamQuestion, CandidateAnswer, PearsonVueScoreReport, DomainScore } from '../../types/exam';
import { CcnaDomain } from '../../types/lab';
import { Router } from '../../core/devices/Router';
import { Switch } from '../../core/devices/Switch';
import { CliParser } from '../../core/cli/Parser';
import { CliContext } from '../../types/cli';
import { 
  X, 
  Clock, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  Award, 
  RotateCcw,
  Eye,
  Terminal,
  Layers,
  ArrowRight,
  Check,
  Play
} from 'lucide-react';
import { useNetworkStore } from '../../store/useNetworkStore';

interface PearsonVueExamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PearsonVueExamModal: React.FC<PearsonVueExamModalProps> = ({ isOpen, onClose }) => {
  const userName = useNetworkStore((state) => state.userName);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, CandidateAnswer>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120 * 60); // 120 minutes
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [isExhibitOpen, setIsExhibitOpen] = useState<boolean>(false);
  const [isReviewScreen, setIsReviewScreen] = useState<boolean>(false);
  const [scoreReport, setScoreReport] = useState<PearsonVueScoreReport | null>(null);
  const [showRationales, setShowRationales] = useState<boolean>(false);

  // Drag & Drop local interaction state
  const [selectedDragItemId, setSelectedDragItemId] = useState<string | null>(null);

  // Simlet local CLI state
  const [simletDevice, setSimletDevice] = useState<Router | Switch | null>(null);
  const [simletContext, setSimletContext] = useState<CliContext>({ deviceId: 'SIM', mode: 'user-exec' });
  const [simletLines, setSimletLines] = useState<string[]>([]);
  const [simletInput, setSimletInput] = useState<string>('');
  const simletScrollRef = useRef<HTMLDivElement>(null);

  const currentQ: ExamQuestion = CCNA_EXAM_QUESTIONS[currentIndex];
  const userAns = answers[currentQ.id] || { questionId: currentQ.id, selectedOptions: [], isMarkedForReview: false };

  // Initialize simlet when current question is simlet
  useEffect(() => {
    if (currentQ.type === 'simlet' && currentQ.simlet) {
      const hostname = currentQ.simlet.deviceHostname;
      const dev = currentQ.simlet.deviceType === 'router'
        ? new Router('SIM_R', hostname, { x: 100, y: 100 })
        : new Switch('SIM_SW', hostname, { x: 100, y: 100 }, false);

      const ctx: CliContext = { deviceId: hostname, mode: 'user-exec' };
      setSimletDevice(dev);
      setSimletContext(ctx);
      setSimletLines([
        `Cisco IOS Software, IOS-XE Software (X86_64_LINUX_IOSD-UNIVERSALK9-M)`,
        `Technical Support: http://www.cisco.com/techsupport`,
        `Compiled for Pearson VUE CCNA 200-301 Examination Simulator`,
        `\nPress Enter to begin configuration...\n`
      ]);
    } else {
      setSimletDevice(null);
      setSelectedDragItemId(null);
    }
  }, [currentIndex, currentQ.type]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isTimerPaused || scoreReport) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isTimerPaused, scoreReport]);

  useEffect(() => {
    if (simletScrollRef.current) {
      simletScrollRef.current.scrollTop = simletScrollRef.current.scrollHeight;
    }
  }, [simletLines]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Multiple Choice Handler
  const handleSelectOption = (optId: string) => {
    if (scoreReport) return;
    if (currentQ.type === 'single_choice') {
      setAnswers(prev => ({
        ...prev,
        [currentQ.id]: {
          ...userAns,
          selectedOptions: [optId]
        }
      }));
    } else if (currentQ.type === 'multiple_choice') {
      const exists = userAns.selectedOptions.includes(optId);
      let updated: string[];
      if (exists) {
        updated = userAns.selectedOptions.filter(id => id !== optId);
      } else {
        const limit = currentQ.requiredSelections || 2;
        if (userAns.selectedOptions.length < limit) {
          updated = [...userAns.selectedOptions, optId];
        } else {
          updated = [...userAns.selectedOptions.slice(1), optId];
        }
      }
      setAnswers(prev => ({
        ...prev,
        [currentQ.id]: {
          ...userAns,
          selectedOptions: updated
        }
      }));
    }
  };

  // Drag & Drop Handler
  const handleAssignSlot = (targetId: string, itemId: string) => {
    if (scoreReport) return;
    const currentMatches = { ...(userAns.dragDropMatches || {}) };
    // Remove if previously assigned elsewhere
    for (const [tId, val] of Object.entries(currentMatches)) {
      if (val === itemId) delete currentMatches[tId];
    }
    currentMatches[targetId] = itemId;

    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...userAns,
        dragDropMatches: currentMatches,
        selectedOptions: Object.keys(currentMatches)
      }
    }));
    setSelectedDragItemId(null);
  };

  const handleClearSlot = (targetId: string) => {
    if (scoreReport) return;
    const currentMatches = { ...(userAns.dragDropMatches || {}) };
    delete currentMatches[targetId];

    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...userAns,
        dragDropMatches: currentMatches,
        selectedOptions: Object.keys(currentMatches)
      }
    }));
  };

  // Simlet CLI Execution Handler
  const handleSimletCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simletDevice || !simletInput.trim()) return;

    const cmd = simletInput.trim();
    const prompt = simletDevice.getPrompt(simletContext);
    const result = CliParser.execute(cmd, simletContext, simletDevice, [simletDevice]);

    const updatedContext: CliContext = {
      ...simletContext,
      mode: result.newMode || simletContext.mode,
      ...(result.contextUpdates || {})
    };

    const newOutputs = [...simletLines, `${prompt} ${cmd}`];
    if (result.output) {
      newOutputs.push(result.output);
    }

    setSimletLines(newOutputs);
    setSimletContext(updatedContext);
    setSimletInput('');

    // Check simlet task completion
    if (currentQ.simlet) {
      let allCompleted = true;
      for (const t of currentQ.simlet.tasks) {
        if (t.expectedKey === 'switchportMode') {
          const p = simletDevice.interfaces.get('GigabitEthernet0/1') || simletDevice.interfaces.get('FastEthernet0/1');
          if (p?.switchportMode !== t.expectedValue) allCompleted = false;
        } else if (t.expectedKey === 'nativeVlan') {
          const p = simletDevice.interfaces.get('GigabitEthernet0/1') || simletDevice.interfaces.get('FastEthernet0/1');
          if (p?.nativeVlan !== t.expectedValue) allCompleted = false;
        } else if (t.expectedKey === 'ospfEnabled') {
          if (simletDevice instanceof Router && !simletDevice.ospfConfig?.enabled) allCompleted = false;
        } else if (t.expectedKey === 'routerId') {
          if (simletDevice instanceof Router && simletDevice.ospfConfig?.routerId !== t.expectedValue) allCompleted = false;
        }
      }

      setAnswers(prev => ({
        ...prev,
        [currentQ.id]: {
          ...userAns,
          selectedOptions: allCompleted ? ['simlet_completed'] : ['in_progress'],
          simletCommands: [...(userAns.simletCommands || []), cmd]
        }
      }));
    }
  };

  const handleToggleMark = () => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...userAns,
        isMarkedForReview: !userAns.isMarkedForReview
      }
    }));
  };

  // Grade & End Exam
  const handleFinishExam = () => {
    let totalCorrect = 0;
    const domainMap: Record<CcnaDomain, { correct: number; total: number }> = {
      '1. Network Fundamentals': { correct: 0, total: 0 },
      '2. Network Access': { correct: 0, total: 0 },
      '3. IP Connectivity': { correct: 0, total: 0 },
      '4. IP Services': { correct: 0, total: 0 },
      '5. Security Fundamentals': { correct: 0, total: 0 },
      '6. Automation & Programmability': { correct: 0, total: 0 }
    };

    for (const q of CCNA_EXAM_QUESTIONS) {
      domainMap[q.domain].total++;
      const ans = answers[q.id];
      let isCorrect = false;

      if (q.type === 'single_choice' || q.type === 'multiple_choice') {
        const candidateOpts = ans?.selectedOptions || [];
        const correctOpts = q.correctAnswer || [];
        isCorrect = candidateOpts.length === correctOpts.length &&
          candidateOpts.every(id => correctOpts.includes(id));
      } else if (q.type === 'drag_drop' && q.dropTargets) {
        const matches = ans?.dragDropMatches || {};
        isCorrect = q.dropTargets.length > 0 &&
          q.dropTargets.every(target => matches[target.id] === target.correctItemId);
      } else if (q.type === 'simlet') {
        isCorrect = Boolean(
          (ans?.selectedOptions || []).includes('simlet_completed') ||
          (ans?.simletCommands && ans.simletCommands.length >= 3)
        );
      }

      if (isCorrect) {
        totalCorrect++;
        domainMap[q.domain].correct++;
      }
    }

    const domainScores: DomainScore[] = Object.entries(domainMap).map(([dom, stats]) => ({
      domain: dom as CcnaDomain,
      correctCount: stats.correct,
      totalCount: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    }));

    // Cisco scale 300 - 1000, passing score 825
    const ratio = totalCorrect / CCNA_EXAM_QUESTIONS.length;
    const scaledScore = Math.round(300 + ratio * 700);
    const verdict: 'PASS' | 'FAIL' = scaledScore >= 825 ? 'PASS' : 'FAIL';

    setScoreReport({
      candidateName: userName ? `${userName} / CCNA Candidate` : 'Peserta CCNA / CCNA Candidate',
      examCode: '200-301 CCNA v1.1',
      examDate: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
      passingScore: 825,
      candidateScore: scaledScore,
      verdict,
      domainScores,
      totalCorrect,
      totalQuestions: CCNA_EXAM_QUESTIONS.length
    });

    setIsReviewScreen(false);
  };

  const handleResetExam = () => {
    setAnswers({});
    setCurrentIndex(0);
    setScoreReport(null);
    setSecondsRemaining(120 * 60);
    setIsReviewScreen(false);
    setShowRationales(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col z-50 select-none animate-in fade-in">
      {/* Top Pearson VUE Header */}
      <header className="h-16 bg-[#002f56] border-b-2 border-amber-400 px-6 flex items-center justify-between text-white shadow-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-white px-2.5 py-1 rounded text-[#002f56] font-black tracking-wider text-xs uppercase shadow-sm">
            PEARSON VUE
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              Cisco Certified Network Associate (CCNA 200-301 v1.1)
            </div>
            <div className="text-[11px] text-slate-300">
              Candidate: <span className="font-semibold text-amber-300">{userName || 'Peserta CCNA'}</span> | Registration: <span className="font-mono">CSCO1492048</span>
            </div>
          </div>
        </div>

        {/* Center: Timer Countdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#001f3b] border border-blue-900/80 px-3 py-1.5 rounded-lg shadow-inner">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-300">Time Remaining:</span>
            <span className="font-mono font-bold text-amber-300 text-sm tracking-widest">
              {formatTime(secondsRemaining)}
            </span>
          </div>

          <button
            onClick={() => setIsTimerPaused(!isTimerPaused)}
            className="text-[11px] bg-blue-900/60 hover:bg-blue-800 text-slate-200 px-2.5 py-1 rounded border border-blue-700"
          >
            {isTimerPaused ? 'Resume' : 'Pause'}
          </button>
        </div>

        {/* Right: Close */}
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-blue-900/80"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Examination Viewport */}
      <main className="flex-1 bg-slate-900 flex flex-col justify-between overflow-hidden p-6 max-w-5xl w-full mx-auto shadow-2xl my-4 rounded-2xl border border-slate-700">
        {/* VIEW 1: OFFICIAL SCORE REPORT */}
        {scoreReport ? (
          <div className="flex-1 overflow-y-auto space-y-5 p-2">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                Official Pearson VUE Cisco Examination Score Report
              </div>
              <h1 className="text-2xl font-black text-white">
                Exam 200-301: Implementing and Administering Cisco Solutions (CCNA)
              </h1>
              <div className="text-xs text-slate-400">
                Candidate: {scoreReport.candidateName} | Date: {scoreReport.examDate}
              </div>

              <div className={`p-4 rounded-xl max-w-md mx-auto border flex items-center justify-center gap-3 ${
                scoreReport.verdict === 'PASS'
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-500 text-rose-300'
              }`}>
                <Award className="w-8 h-8 shrink-0" />
                <div className="text-left">
                  <div className="text-xl font-black tracking-wide">
                    VERDICT: {scoreReport.verdict === 'PASS' ? 'PASSED (LULUS)' : 'FAILED (BELUM LULUS)'}
                  </div>
                  <div className="text-xs">
                    Your Score: <strong className="text-white font-mono text-sm">{scoreReport.candidateScore}</strong> (Passing Score: {scoreReport.passingScore} / 1000)
                  </div>
                </div>
              </div>
            </div>

            {/* Section Analysis Breakdown */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Section Performance Analysis (CCNA 200-301 v1.1 Blueprint):
              </div>
              <div className="space-y-2">
                {scoreReport.domainScores.map(ds => (
                  <div key={ds.domain} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{ds.domain}</div>
                      <div className="text-[11px] text-slate-400">
                        {ds.correctCount} of {ds.totalCount} questions correct
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-36 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            ds.percentage >= 80 ? 'bg-emerald-500' : ds.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${ds.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-white w-10 text-right">
                        {ds.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleResetExam}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Examination</span>
              </button>
              <button
                onClick={() => {
                  setScoreReport(null);
                  setCurrentIndex(0);
                  setShowRationales(true);
                }}
                className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950/50"
              >
                <Eye className="w-4 h-4" />
                <span>Review Questions & Rationales</span>
              </button>
            </div>
          </div>
        ) : isReviewScreen ? (
          /* VIEW 2: REVIEW SCREEN */
          <div className="flex-1 overflow-y-auto space-y-4 p-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Item Review Screen</h2>
                <p className="text-xs text-slate-400">
                  Periksa status jawaban semua tipe soal (Pilihan Ganda, Drag & Drop, dan Simlet).
                </p>
              </div>
              <button
                onClick={() => setIsReviewScreen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Back to Questions
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {CCNA_EXAM_QUESTIONS.map((q, idx) => {
                const ans = answers[q.id];
                const isMarked = ans?.isMarkedForReview;
                const isAnswered = ans && (
                  (ans.selectedOptions && ans.selectedOptions.length > 0) ||
                  (ans.dragDropMatches && Object.keys(ans.dragDropMatches).length > 0) ||
                  (ans.simletCommands && ans.simletCommands.length > 0)
                );

                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsReviewScreen(false);
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <span>Q{idx + 1}</span>
                        <span className="text-[9px] uppercase px-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {q.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {isAnswered ? <span className="text-emerald-400">Answered</span> : <span className="text-rose-400">Incomplete</span>}
                      </div>
                    </div>

                    {isMarked && (
                      <Flag className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleFinishExam}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/50"
              >
                Submit & End Examination
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 3: QUESTION PRESENTATION */
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="overflow-y-auto space-y-4 pr-1">
              {/* Question Header & Type Badge */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded-lg">
                    Question {currentIndex + 1} of {CCNA_EXAM_QUESTIONS.length}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {currentQ.domain}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {currentQ.type.toUpperCase().replace('_', ' ')}
                  </span>
                </div>

                {/* Exhibit & Mark for Review */}
                <div className="flex items-center gap-3">
                  {currentQ.exhibitContent && (
                    <button
                      onClick={() => setIsExhibitOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Exhibit / Topology</span>
                    </button>
                  )}

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={userAns.isMarkedForReview}
                      onChange={handleToggleMark}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <Flag className={`w-3 h-3 ${userAns.isMarkedForReview ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                    <span>Mark for Review</span>
                  </label>
                </div>
              </div>

              {/* Prompt Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 leading-relaxed font-medium">
                {currentQ.prompt}
                {currentQ.requiredSelections && currentQ.requiredSelections > 1 && (
                  <span className="block text-xs font-bold text-amber-400 mt-2">
                    (Choose {currentQ.requiredSelections} options)
                  </span>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* MODEL 1 & 2: MULTIPLE CHOICE (Single or Multiple) */}
              {/* ------------------------------------------------------------- */}
              {(currentQ.type === 'single_choice' || currentQ.type === 'multiple_choice') && currentQ.options && (
                <div className="space-y-2.5">
                  {currentQ.options.map((opt) => {
                    const isSelected = userAns.selectedOptions.includes(opt.id);
                    const isCorrect = (currentQ.correctAnswer || []).includes(opt.id);

                    let borderStyle = 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80';
                    if (showRationales) {
                      if (isCorrect) borderStyle = 'border-emerald-500 bg-emerald-950/30 text-emerald-200';
                      else if (isSelected && !isCorrect) borderStyle = 'border-rose-500 bg-rose-950/30 text-rose-200';
                    } else if (isSelected) {
                      borderStyle = 'border-cyan-500 bg-cyan-950/40 text-cyan-200 shadow-md';
                    }

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${borderStyle}`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${
                          isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {opt.id}
                        </div>
                        <div className="text-xs text-slate-200 leading-relaxed flex-1">
                          {opt.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* MODEL 3: DRAG AND DROP (Matching Items to Target Slots) */}
              {/* ------------------------------------------------------------- */}
              {currentQ.type === 'drag_drop' && currentQ.dragItems && currentQ.dropTargets && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column: Source Items */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Item Pilihan (Drag / Klik Item)</span>
                    </div>

                    <div className="space-y-2">
                      {currentQ.dragItems.map((item) => {
                        const isAssigned = Object.values(userAns.dragDropMatches || {}).includes(item.id);
                        const isSelected = selectedDragItemId === item.id;

                        return (
                          <div
                            key={item.id}
                            draggable={!isAssigned}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', item.id);
                            }}
                            onClick={() => !isAssigned && setSelectedDragItemId(item.id)}
                            className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                              isAssigned
                                ? 'opacity-30 border-slate-800 bg-slate-900 cursor-not-allowed text-slate-500'
                                : isSelected
                                ? 'border-cyan-400 bg-cyan-950/60 text-white shadow-lg cursor-pointer ring-2 ring-cyan-500/40'
                                : 'border-slate-700 bg-slate-900/90 hover:border-cyan-500/60 cursor-pointer text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{item.text}</span>
                              {isAssigned && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Drop Target Slots */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Target Slot (Klik untuk Menempatkan)</span>
                    </div>

                    <div className="space-y-2.5">
                      {currentQ.dropTargets.map((target) => {
                        const assignedItemId = (userAns.dragDropMatches || {})[target.id];
                        const assignedItem = currentQ.dragItems?.find(i => i.id === assignedItemId);
                        const isCorrectMatch = target.correctItemId === assignedItemId;

                        let slotStyle = 'border-dashed border-slate-700 bg-slate-900/60 text-slate-400';
                        if (showRationales) {
                          slotStyle = isCorrectMatch
                            ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 border-solid'
                            : 'border-rose-500 bg-rose-950/40 text-rose-200 border-solid';
                        } else if (assignedItem) {
                          slotStyle = 'border-cyan-500 bg-cyan-950/40 text-cyan-200 border-solid shadow-md';
                        }

                        return (
                          <div
                            key={target.id}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const itemId = e.dataTransfer.getData('text/plain');
                              if (itemId) handleAssignSlot(target.id, itemId);
                            }}
                            onClick={() => {
                              if (selectedDragItemId) {
                                handleAssignSlot(target.id, selectedDragItemId);
                              }
                            }}
                            className={`p-3 rounded-xl border text-xs transition-all ${slotStyle}`}
                          >
                            <div className="flex items-center justify-between font-mono font-semibold text-[11px] mb-1">
                              <span className="text-slate-300">{target.label}</span>
                              {assignedItem && !showRationales && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearSlot(target.id);
                                  }}
                                  className="text-[10px] text-rose-400 hover:text-rose-300 font-sans"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            <div className="text-xs font-sans">
                              {assignedItem ? (
                                <span className="text-white font-medium">{assignedItem.text}</span>
                              ) : (
                                <span className="text-slate-500 italic">
                                  {selectedDragItemId ? 'Klik untuk memasukkan item terpilih' : 'Kosong (Tarik atau klik item di kiri)'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* MODEL 4: SIMLET / SIMULATION LAB INTERACTIVE CLI QUESTION */}
              {/* ------------------------------------------------------------- */}
              {currentQ.type === 'simlet' && currentQ.simlet && (
                <div className="space-y-3">
                  {/* Task checklist bar */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs space-y-1.5">
                    <div className="font-bold text-cyan-400 uppercase text-[11px] tracking-wider">
                      Simlet Configuration Objectives:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {currentQ.simlet.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[11px]">{task.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Cisco IOS Terminal Console */}
                  <div className="bg-slate-950 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-bold text-white">{currentQ.simlet.deviceHostname} - Cisco IOS Console</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">CCNA Live Simlet Engine</span>
                    </div>

                    <div
                      ref={simletScrollRef}
                      className="p-4 h-64 overflow-y-auto font-mono text-xs text-slate-200 space-y-1 bg-black/90"
                    >
                      {simletLines.map((line, idx) => (
                        <div key={idx} className="whitespace-pre-wrap leading-relaxed">{line}</div>
                      ))}
                    </div>

                    {/* Console input form */}
                    <form onSubmit={handleSimletCommandSubmit} className="flex items-center bg-slate-900 border-t border-slate-800 p-2">
                      <span className="font-mono text-xs text-cyan-400 px-2 font-bold">
                        {simletDevice?.getPrompt(simletContext) || `${currentQ.simlet.deviceHostname}#`}
                      </span>
                      <input
                        type="text"
                        value={simletInput}
                        onChange={(e) => setSimletInput(e.target.value)}
                        placeholder="Ketik perintah Cisco IOS (contoh: enable, conf t, interface ...)"
                        className="flex-1 bg-transparent text-xs font-mono text-white focus:outline-none px-1"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow"
                      >
                        Execute
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Rationales / Explanation Display (Review Mode) */}
              {showRationales && (
                <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Official CCNA Rationale & Explanation:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {currentQ.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setIsReviewScreen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
              >
                Item Review Screen
              </button>

              {currentIndex < CCNA_EXAM_QUESTIONS.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(CCNA_EXAM_QUESTIONS.length - 1, prev + 1))}
                  className="flex items-center gap-1.5 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950/50 transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsReviewScreen(true)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/50"
                >
                  Review & End Exam
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Exhibit Popover Modal */}
      {isExhibitOpen && currentQ.exhibitContent && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{currentQ.exhibitTitle || 'Examination Exhibit'}</span>
              </h3>
              <button
                onClick={() => setIsExhibitOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed max-h-80 select-text">
              {currentQ.exhibitContent}
            </pre>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsExhibitOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Close Exhibit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
