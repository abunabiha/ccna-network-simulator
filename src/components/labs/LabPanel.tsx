import React, { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Target,
  FileQuestion,
  Award
} from 'lucide-react';

export const LabPanel: React.FC = () => {
  const { currentLab, gradeReport, gradeCurrentLab } = useNetworkStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  if (!currentLab) return null;

  return (
    <div className={`w-80 bg-slate-900 border-l border-slate-800 flex flex-col justify-between select-none z-20 shrink-0 transition-all ${
      isCollapsed ? 'w-12' : 'w-80'
    }`}>
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-bold text-xs text-slate-200 truncate">
              Lab Guide & Tasks
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 p-3 overflow-y-auto space-y-4">
          {/* Lab Header Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                {currentLab.domain}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{currentLab.estimatedMinutes}m</span>
              </div>
            </div>

            <h2 className="text-sm font-bold text-slate-100 leading-snug">
              {currentLab.title}
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              {currentLab.scenario}
            </p>
          </div>

          {/* Objectives */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Lab Objectives</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-300">
              {currentLab.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 bg-slate-950/40 p-1.5 rounded border border-slate-800/50">
                  <span className="text-cyan-400 font-bold text-[10px] mt-0.5">•</span>
                  <span className="text-[11px] leading-tight">{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Task Checklist & Auto-Grade Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tasks ({currentLab.tasks.length})</span>
              </div>
              {gradeReport && (
                <span className="text-xs font-bold text-emerald-400">
                  {gradeReport.totalScore}%
                </span>
              )}
            </div>

            <div className="space-y-2">
              {currentLab.tasks.map((task) => {
                const evalResult = gradeReport?.taskResults.find(r => r.taskId === task.id);
                const isPassed = evalResult?.passed;
                const isExpanded = expandedTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`bg-slate-950 border rounded-xl p-2.5 transition-all ${
                      isPassed
                        ? 'border-emerald-500/50 bg-emerald-950/10'
                        : evalResult
                        ? 'border-rose-500/40 bg-rose-950/10'
                        : 'border-slate-800'
                    }`}
                  >
                    <div 
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    >
                      <div className="flex items-start gap-2 flex-1 pr-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                          isPassed
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isPassed ? '✓' : ''}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-200 leading-snug">
                            {task.description}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Target: {task.targetDevice} {task.targetInterface ? `(${task.targetInterface})` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                        {task.points} pts
                      </span>
                    </div>

                    {/* Diagnostic / Hint Dropdown */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                        {evalResult && (
                          <div className={`p-1.5 rounded ${
                            isPassed ? 'bg-emerald-950/40 text-emerald-300' : 'bg-rose-950/40 text-rose-300'
                          }`}>
                            {evalResult.diagnostic}
                          </div>
                        )}
                        {task.hint && (
                          <div className="flex items-start gap-1.5 text-slate-400 bg-slate-900/60 p-1.5 rounded">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span><strong>Hint:</strong> {task.hint}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer Grade Action */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={gradeCurrentLab}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all"
          >
            <Award className="w-4 h-4" />
            <span>Check Lab & View Score</span>
          </button>
        </div>
      )}
    </div>
  );
};
