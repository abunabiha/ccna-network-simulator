import React, { useRef } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { CCNA_LABS } from '../../data/ccnaLabs';
import { 
  Network, 
  Award, 
  Play, 
  RotateCcw, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Cpu,
  Download,
  Upload,
  BookOpenCheck,
  Radio
} from 'lucide-react';

interface HeaderProps {
  onOpenDocs: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDocs }) => {
  const currentLab = useNetworkStore((state) => state.currentLab);
  const loadLab = useNetworkStore((state) => state.loadLab);
  const gradeCurrentLab = useNetworkStore((state) => state.gradeCurrentLab);
  const gradeReport = useNetworkStore((state) => state.gradeReport);
  const simulationMode = useNetworkStore((state) => state.simulationMode);
  const setSimulationMode = useNetworkStore((state) => state.setSimulationMode);
  const openExamModal = useNetworkStore((state) => state.openExamModal);
  const openLiveConnector = useNetworkStore((state) => state.openLiveConnector);
  const exportTopologyJson = useNetworkStore((state) => state.exportTopologyJson);
  const importTopologyJson = useNetworkStore((state) => state.importTopologyJson);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportTopology = () => {
    const jsonStr = exportTopologyJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cisco_topology_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importTopologyJson(content);
        if (!success) {
          alert('Gagal mengimpor topologi. Format file JSON tidak valid.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none z-30 shadow-md">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-white">
              CCNA <span className="text-cyan-400">NetSim Pro</span>
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Exam 200-301 v1.1
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-none">
            Cisco IOS Simulator & Automated Lab Grading
          </p>
        </div>
      </div>

      {/* Center: Lab Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
          <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
          <select
            value={currentLab?.id || ''}
            onChange={(e) => loadLab(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-4 font-medium"
          >
            {CCNA_LABS.map((lab) => (
              <option key={lab.id} value={lab.id} className="bg-slate-900 text-slate-200">
                [{lab.difficulty}] {lab.title}
              </option>
            ))}
          </select>
        </div>

        {/* Real-time vs Simulation Toggle */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setSimulationMode('realtime')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              simulationMode === 'realtime'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Realtime
          </button>
          <button
            onClick={() => setSimulationMode('simulation')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              simulationMode === 'simulation'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Simulation (PDU)
          </button>
        </div>
      </div>

      {/* Right Controls: Topology I/O, Exam, Grade & Academic Docs */}
      <div className="flex items-center gap-2">
        {/* Hidden File Input for Topology Import */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".json" 
          className="hidden" 
          onChange={handleImportFile} 
        />

        {/* Export / Import Topology Buttons */}
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={handleExportTopology}
            title="Export Current Topology & Configurations (.json)"
            className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-md text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Export</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import Saved Topology (.json)"
            className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-md text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Import</span>
          </button>
        </div>

        {/* Reset Lab */}
        <button
          onClick={() => currentLab && loadLab(currentLab.id)}
          title="Reset Topology & Configurations"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Pearson VUE Exam Simulator Button */}
        <button
          onClick={openExamModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#002f56] hover:bg-[#003d70] border border-amber-400/60 rounded-lg text-xs font-bold text-amber-300 shadow-md shadow-blue-950/50 transition-all active:scale-95"
        >
          <BookOpenCheck className="w-4 h-4 text-amber-400" />
          <span>Pearson VUE Exam</span>
        </button>

        {/* Real-Time Physical Device Connector Button */}
        <button
          onClick={openLiveConnector}
          title="Connect to Real Physical Network Hardware (SSH/Telnet) or Host NIC"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/60 rounded-lg text-xs font-bold text-emerald-300 shadow-md shadow-emerald-950/50 transition-all active:scale-95"
        >
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Live Device Link</span>
        </button>

        {/* Scientific SDLC Docs */}
        <button
          onClick={onOpenDocs}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 font-medium transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">SDLC Docs</span>
        </button>

        {/* Check Lab / Grade Button */}
        <button
          onClick={gradeCurrentLab}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950/50 transition-all border border-emerald-400/30 active:scale-95"
        >
          <Award className="w-4 h-4" />
          <span>Check Lab</span>
          {gradeReport && (
            <span className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
              gradeReport.isPassed ? 'bg-emerald-900 text-emerald-200' : 'bg-amber-900 text-amber-200'
            }`}>
              {gradeReport.totalScore}%
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
