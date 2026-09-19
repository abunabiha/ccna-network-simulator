import React from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  X, 
  RotateCcw, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const GradeModal: React.FC = () => {
  const { 
    isGradeModalOpen, 
    closeGradeModal, 
    gradeReport, 
    currentLab 
  } = useNetworkStore();

  if (!isGradeModalOpen || !gradeReport || !currentLab) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow background */}
        <div className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-30 ${
          gradeReport.isPassed ? 'bg-emerald-500' : 'bg-amber-500'
        }`} />

        {/* Header */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                CCNA Certification Exam Benchmark
              </span>
              <span className="text-xs text-slate-500">Graded at {gradeReport.gradedAt}</span>
            </div>
            <h2 className="text-lg font-extrabold text-white mt-1">
              Lab Assessment Scorecard
            </h2>
            <p className="text-xs text-slate-400">{currentLab.title}</p>
          </div>
          <button
            onClick={closeGradeModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Banner */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between relative z-10 ${
          gradeReport.isPassed
            ? 'bg-gradient-to-r from-emerald-950/60 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
            : 'bg-gradient-to-r from-amber-950/60 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-950/40'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${
              gradeReport.isPassed ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              {gradeReport.isPassed ? <Sparkles className="w-7 h-7" /> : <Award className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-black ${
                  gradeReport.isPassed ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {gradeReport.totalScore}%
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  gradeReport.isPassed ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                }`}>
                  {gradeReport.isPassed ? 'PASSED (LULUS 100%)' : 'BELUM LULUS (WAJIB 100%)'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {gradeReport.passedTasksCount} dari {gradeReport.totalTasksCount} kriteria verifikasi terpenuhi.
              </p>
            </div>
          </div>
        </div>

        {/* Task by task breakdown */}
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 relative z-10">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Detailed Diagnostic Checklist:
          </div>

          {currentLab.tasks.map((task) => {
            const result = gradeReport.taskResults.find(r => r.taskId === task.id);
            const passed = result?.passed;

            return (
              <div
                key={task.id}
                className={`p-3 rounded-xl border flex items-start gap-3 ${
                  passed
                    ? 'bg-slate-950/70 border-emerald-500/30'
                    : 'bg-slate-950/70 border-rose-500/30'
                }`}
              >
                {passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{task.description}</span>
                    <span className={`font-mono text-[11px] ${passed ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                      {result?.earnedPoints || 0} / {task.points} pts
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 ${passed ? 'text-emerald-300/80' : 'text-rose-300/90'}`}>
                    {result?.diagnostic}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 relative z-10">
          <button
            onClick={closeGradeModal}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Continue Practicing
          </button>
        </div>
      </div>
    </div>
  );
};
