import React, { useState, useRef, useEffect } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { CliParser } from '../../core/cli/Parser';
import { CommandHelpItem } from '../../types/cli';
import { 
  Terminal as TerminalIcon, 
  X, 
  Trash2, 
  HelpCircle, 
  Maximize2, 
  Minimize2,
  ChevronRight,
  Zap,
  Settings
} from 'lucide-react';

const EMPTY_OUTPUTS: string[] = [];

export const CiscoTerminal: React.FC = () => {
  const activeTerminalDeviceId = useNetworkStore((state) => state.activeTerminalDeviceId);
  const openTerminalTabs = useNetworkStore((state) => state.openTerminalTabs);
  const closeTerminalTab = useNetworkStore((state) => state.closeTerminalTab);
  const setActiveTerminalTab = useNetworkStore((state) => state.setActiveTerminalTab);
  const executeCommand = useNetworkStore((state) => state.executeCommand);
  const clearTerminalOutput = useNetworkStore((state) => state.clearTerminalOutput);
  const openHostConfig = useNetworkStore((state) => state.openHostConfig);
  const activeDevice = useNetworkStore((state) => 
    state.activeTerminalDeviceId ? state.devices.find(d => d.id === state.activeTerminalDeviceId) : undefined
  );
  const activeContext = useNetworkStore((state) => 
    state.activeTerminalDeviceId ? state.cliContexts[state.activeTerminalDeviceId] : null
  );
  const currentOutputs = useNetworkStore((state) => {
    const devId = state.activeTerminalDeviceId;
    return (devId && state.terminalOutputs[devId]) ? state.terminalOutputs[devId] : EMPTY_OUTPUTS;
  });
  const devices = useNetworkStore((state) => state.devices);

  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [helpList, setHelpList] = useState<CommandHelpItem[] | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const savedDraftRef = useRef<string>('');

  // Auto-scroll on new output
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentOutputs]);

  // Focus input and reset history draft when active tab changes
  useEffect(() => {
    inputRef.current?.focus();
    setHistoryIndex(-1);
    savedDraftRef.current = '';
    setHelpList(null);
  }, [activeTerminalDeviceId]);

  if (!activeDevice || !activeContext) {
    return null;
  }

  let prompt = 'Router>';
  try {
    prompt = activeDevice.getPrompt(activeContext);
  } catch (err) {
    prompt = `${activeDevice.hostname || 'Device'}>`;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. Enter Key
    if (e.key === 'Enter') {
      executeCommand(activeDevice.id, inputVal);
      setInputVal('');
      setHistoryIndex(-1);
      savedDraftRef.current = '';
      setHelpList(null);
      return;
    }

    // 2. Tab Key (Autocompletion)
    if (e.key === 'Tab') {
      e.preventDefault();
      const completion = CliParser.complete(inputVal, activeContext, activeDevice);
      setInputVal(completion.completedText);
      if (completion.candidates.length > 1) {
        // Show candidates
        executeCommand(activeDevice.id, inputVal);
        const candidateHelp: CommandHelpItem[] = completion.candidates.map(c => ({
          command: c,
          description: ''
        }));
        setHelpList(candidateHelp);
      }
      return;
    }

    // 3. Question Mark '?' Key (Contextual Help)
    if (e.key === '?') {
      e.preventDefault();
      const items = CliParser.getHelp(inputVal, activeContext, activeDevice);
      setHelpList(items);
      return;
    }

    // 4. Arrow Up (History Previous) / Ctrl+P
    if (e.key === 'ArrowUp' || (e.ctrlKey && e.key.toLowerCase() === 'p')) {
      e.preventDefault();
      const history = activeDevice.commandHistory || [];
      if (history.length === 0) return;

      // Save user's current typed text before moving into history
      if (historyIndex === -1) {
        savedDraftRef.current = inputVal;
      }

      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      const targetVal = history[nextIndex] || '';
      setInputVal(targetVal);

      // Move cursor to the end of input for immediate editing / retyping
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const pos = targetVal.length;
          inputRef.current.setSelectionRange(pos, pos);
        }
      });
      return;
    }

    // 5. Arrow Down (History Next) / Ctrl+N
    if (e.key === 'ArrowDown' || (e.ctrlKey && e.key.toLowerCase() === 'n')) {
      e.preventDefault();
      const history = activeDevice.commandHistory || [];
      if (historyIndex === -1) return;

      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        // Restore user draft
        setHistoryIndex(-1);
        const restored = savedDraftRef.current;
        setInputVal(restored);
        requestAnimationFrame(() => {
          if (inputRef.current) {
            const pos = restored.length;
            inputRef.current.setSelectionRange(pos, pos);
          }
        });
      } else {
        setHistoryIndex(nextIndex);
        const targetVal = history[nextIndex] || '';
        setInputVal(targetVal);
        requestAnimationFrame(() => {
          if (inputRef.current) {
            const pos = targetVal.length;
            inputRef.current.setSelectionRange(pos, pos);
          }
        });
      }
      return;
    }

    // 6. Ctrl + C (Abort line)
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      executeCommand(activeDevice.id, '^C');
      setInputVal('');
      setHistoryIndex(-1);
      savedDraftRef.current = '';
      setHelpList(null);
      return;
    }

    // Hide help list if user types normal characters
    if (helpList && e.key.length === 1) {
      setHelpList(null);
    }
  };

  const handleQuickCmd = (cmd: string) => {
    executeCommand(activeDevice.id, cmd);
    inputRef.current?.focus();
  };

  return (
    <div className={`border-t border-slate-800 bg-cisco-terminal flex flex-col transition-all duration-200 z-20 shadow-2xl ${
      isExpanded ? 'h-[620px]' : 'h-72'
    }`}>
      {/* Tab Bar & Action Controls */}
      <div className="h-9 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-2 select-none shrink-0">
        {/* Device Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {Array.from(new Set(openTerminalTabs)).map((tabId) => {
            const dev = devices.find(d => d.id === tabId);
            if (!dev) return null;
            const isActive = tabId === activeTerminalDeviceId;

            return (
              <div
                key={tabId}
                onClick={() => setActiveTerminalTab(tabId)}
                className={`flex items-center gap-2 px-3 py-1 rounded-t-md text-xs font-mono cursor-pointer transition-all border-t border-x ${
                  isActive
                    ? 'bg-cisco-terminal text-cyan-400 border-slate-700 font-semibold shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <TerminalIcon className="w-3.5 h-3.5" />
                <span>{dev.hostname || dev.id}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTerminalTab(tabId);
                  }}
                  className="hover:text-rose-400 ml-1 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Quick Snippets & Window Controls */}
        <div className="flex items-center gap-1.5">
          {activeDevice.deviceType === 'pc' || activeDevice.deviceType === 'server' || activeDevice.deviceType === 'cloud' ? (
            <div className="flex items-center gap-1 mr-2 text-[10px]">
              <button
                onClick={() => openHostConfig(activeDevice.id)}
                className="flex items-center gap-1 px-2.5 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold shadow transition-colors cursor-pointer mr-1"
                title="Buka Pengaturan IP Visual"
              >
                <Settings className="w-3 h-3" />
                <span>Desktop IP Config</span>
              </button>
              <button 
                onClick={() => handleQuickCmd('ipconfig /all')}
                className="hidden sm:inline px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-mono"
              >
                ipconfig /all
              </button>
              <button 
                onClick={() => handleQuickCmd('ping 192.168.1.1')}
                className="hidden sm:inline px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-mono"
              >
                ping gw
              </button>
              <button 
                onClick={() => handleQuickCmd('arp -a')}
                className="hidden md:inline px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-mono"
              >
                arp -a
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1 mr-2 text-[10px]">
              <button 
                onClick={() => handleQuickCmd('show ip interface brief')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-mono"
              >
                sh ip int br
              </button>
              <button 
                onClick={() => handleQuickCmd('show running-config')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-mono"
              >
                sh run
              </button>
              <button 
                onClick={() => handleQuickCmd('show ip route')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-mono"
              >
                sh ip ro
              </button>
              <button 
                onClick={() => handleQuickCmd('show ip arp')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-mono"
              >
                sh ip arp
              </button>
              <button 
                onClick={() => handleQuickCmd('configure terminal')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 font-mono"
              >
                conf t
              </button>
            </div>
          )}

          <button
            onClick={() => clearTerminalOutput(activeDevice.id)}
            title="Clear Console Buffer"
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Screen & Logs */}
      <div 
        onClick={() => inputRef.current?.focus()}
        className="flex-1 p-3 overflow-y-auto font-mono text-xs text-slate-200 space-y-1 select-text cursor-text"
      >
        {currentOutputs.map((line, idx) => (
          <pre key={idx} className="whitespace-pre-wrap leading-relaxed font-mono">
            {line}
          </pre>
        ))}

        {/* Contextual Help Modal / Tooltip */}
        {helpList && helpList.length > 0 && (
          <div className="my-2 p-2.5 bg-slate-900/95 border border-cyan-500/50 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              <span>Available Cisco IOS Commands in this mode:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
              {helpList.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">{item.command}</span>
                  <span className="text-slate-400">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive CLI Input Line */}
        <div className="flex items-center gap-1.5 text-xs font-mono pt-1">
          <span className="text-emerald-400 font-bold shrink-0">{prompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              if (historyIndex === -1) {
                savedDraftRef.current = e.target.value;
              }
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent text-slate-100 focus:outline-none font-mono caret-cyan-400"
          />
        </div>

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
