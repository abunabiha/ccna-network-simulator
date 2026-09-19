import React, { useState, useRef } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { Device } from '../../core/devices/Device';
import { Host } from '../../core/devices/Host';
import { CableType, DeviceType } from '../../types/network';
import { 
  CiscoRouterIcon, 
  CiscoSwitchIcon, 
  CiscoL3SwitchIcon, 
  CiscoPcIcon, 
  CiscoServerIcon,
  CiscoCloudIcon
} from '../common/CiscoIcons';
import { 
  Terminal, 
  Settings,
  X,
  Radio,
  Move
} from 'lucide-react';

interface TopologyCanvasProps {
  connectingCable: CableType | null;
  setConnectingCable: (cable: CableType | null) => void;
}

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  connectingCable,
  setConnectingCable
}) => {
  const { 
    devices, 
    links, 
    selectedDeviceId, 
    selectDevice, 
    moveDevice, 
    openTerminal, 
    openHostConfig,
    addDevice,
    connectPorts,
    removeLink 
  } = useNetworkStore();

  const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Port connection modal state
  const [cableSourceDevId, setCableSourceDevId] = useState<string | null>(null);
  const [connectionModal, setConnectionModal] = useState<{
    sourceDev: Device;
    targetDev: Device;
  } | null>(null);

  const [selectedSourcePort, setSelectedSourcePort] = useState<string>('');
  const [selectedTargetPort, setSelectedTargetPort] = useState<string>('');

  const svgRef = useRef<SVGSVGElement>(null);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, dev: Device) => {
    e.stopPropagation();
    selectDevice(dev.id);

    if (connectingCable) {
      if (!cableSourceDevId) {
        setCableSourceDevId(dev.id);
      } else if (cableSourceDevId !== dev.id) {
        // Open port selection modal
        const src = devices.find(d => d.id === cableSourceDevId);
        if (src) {
          const availSrcPorts = Array.from(src.interfaces.values()).filter(p => !isPortConnected(src.id, p.name));
          const availDstPorts = Array.from(dev.interfaces.values()).filter(p => !isPortConnected(dev.id, p.name));

          setSelectedSourcePort(availSrcPorts[0]?.name || '');
          setSelectedTargetPort(availDstPorts[0]?.name || '');
          setConnectionModal({ sourceDev: src, targetDev: dev });
        }
        setCableSourceDevId(null);
      }
      return;
    }

    setDraggingDeviceId(dev.id);
    setDragOffset({
      x: e.clientX - dev.position.x,
      y: e.clientY - dev.position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingDeviceId && svgRef.current) {
      const newX = Math.max(50, Math.min(e.clientX - dragOffset.x, 1200));
      const newY = Math.max(50, Math.min(e.clientY - dragOffset.y, 800));
      moveDevice(draggingDeviceId, newX, newY);
    }
  };

  const handleMouseUp = () => {
    setDraggingDeviceId(null);
  };

  const isPortConnected = (devId: string, portName: string) => {
    return links.some(
      l => (l.sourceDeviceId === devId && l.sourcePort === portName) ||
           (l.targetDeviceId === devId && l.targetPort === portName)
    );
  };

  const handleConfirmConnection = () => {
    if (connectionModal && selectedSourcePort && selectedTargetPort) {
      connectPorts(
        connectionModal.sourceDev.id,
        selectedSourcePort,
        connectionModal.targetDev.id,
        selectedTargetPort,
        connectingCable || 'straight'
      );
      setConnectionModal(null);
      setConnectingCable(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data && data.type && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const x = Math.max(60, Math.min(Math.round(e.clientX - rect.left), 1100));
        const y = Math.max(60, Math.min(Math.round(e.clientY - rect.top), 750));
        addDevice(data.type, x, y);
      }
    } catch (err) {
      console.error('Error handling drop on canvas:', err);
    }
  };

  return (
    <div 
      className="relative flex-1 h-full bg-slate-950 overflow-hidden select-none cursor-default"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Background Grid Pattern */}
      <svg
        ref={svgRef}
        className="w-full h-full absolute inset-0"
        onClick={() => {
          selectDevice(null);
          if (connectingCable) setCableSourceDevId(null);
        }}
      >
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.8" className="fill-slate-800" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Cable Links Rendering */}
        {links.map((link) => {
          const srcDev = devices.find(d => d.id === link.sourceDeviceId);
          const dstDev = devices.find(d => d.id === link.targetDeviceId);
          if (!srcDev || !dstDev) return null;

          const x1 = srcDev.position.x;
          const y1 = srcDev.position.y;
          const x2 = dstDev.position.x;
          const y2 = dstDev.position.y;

          // Midpoint for port labels
          const mx1 = x1 + (x2 - x1) * 0.28;
          const my1 = y1 + (y2 - y1) * 0.28;
          const mx2 = x1 + (x2 - x1) * 0.72;
          const my2 = y1 + (y2 - y1) * 0.72;

          const srcPort = srcDev.interfaces.get(link.sourcePort);
          const dstPort = dstDev.interfaces.get(link.targetPort);

          const isSrcUp = srcPort?.status === 'up' && !srcPort.isShutdown;
          const isDstUp = dstPort?.status === 'up' && !dstPort.isShutdown;

          return (
            <g key={link.id} className="group cursor-pointer" onClick={(e) => { e.stopPropagation(); removeLink(link.id); }}>
              {/* Invisible thick line for easier click to delete */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="16" />

              {/* Visible Cable */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={link.cableType === 'crossover' ? '#f59e0b' : '#06b6d4'}
                strokeWidth="2.5"
                strokeDasharray={link.cableType === 'crossover' ? '6,4' : undefined}
                className="group-hover:stroke-rose-500 transition-colors"
              />

              {/* Status Indicators (Link lights) */}
              <circle cx={mx1} cy={my1} r="4" fill={isSrcUp ? '#10b981' : '#ef4444'} />
              <circle cx={mx2} cy={my2} r="4" fill={isDstUp ? '#10b981' : '#ef4444'} />

              {/* Port Name Tags */}
              <text x={mx1} y={my1 - 7} textAnchor="middle" className="fill-slate-400 text-[9px] font-mono select-none">
                {srcPort?.shortName || link.sourcePort}
              </text>
              <text x={mx2} y={my2 - 7} textAnchor="middle" className="fill-slate-400 text-[9px] font-mono select-none">
                {dstPort?.shortName || link.targetPort}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Device Nodes Rendering with Cisco Standard Icons */}
      {devices.map((dev) => {
        const isSelected = selectedDeviceId === dev.id;
        const isCableSource = cableSourceDevId === dev.id;
        const isHostDev = dev.deviceType === 'pc' || dev instanceof Host;

        let icon = <CiscoRouterIcon size={46} />;
        let borderColor = 'border-sky-500/60';
        let bgGlow = 'from-sky-950/40 to-slate-900';

        if (dev.deviceType === 'router') {
          icon = <CiscoRouterIcon size={46} />;
          borderColor = 'border-sky-500/60';
          bgGlow = 'from-sky-950/40 to-slate-900';
        } else if (dev.deviceType === 'switch') {
          icon = <CiscoSwitchIcon size={46} />;
          borderColor = 'border-teal-500/60';
          bgGlow = 'from-teal-950/40 to-slate-900';
        } else if (dev.deviceType === 'switch-l3') {
          icon = <CiscoL3SwitchIcon size={46} />;
          borderColor = 'border-indigo-500/60';
          bgGlow = 'from-indigo-950/40 to-slate-900';
        } else if (dev.deviceType === 'server') {
          icon = <CiscoServerIcon size={44} />;
          borderColor = 'border-purple-500/60';
          bgGlow = 'from-purple-950/40 to-slate-900';
        } else if (dev.deviceType === 'cloud') {
          icon = <CiscoCloudIcon size={46} />;
          borderColor = 'border-cyan-500/60';
          bgGlow = 'from-cyan-950/40 to-slate-900';
        } else {
          icon = <CiscoPcIcon size={44} />;
          borderColor = 'border-sky-500/60';
          bgGlow = 'from-sky-950/40 to-slate-900';
        }

        // Subtitle text (e.g. IP address for host, or model for router)
        let subText = dev.deviceType.toUpperCase();
        if (dev instanceof Host && dev.ipAddress) {
          subText = dev.ipAddress;
        }

        return (
          <div
            key={dev.id}
            onMouseDown={(e) => handleMouseDown(e, dev)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (isHostDev) {
                openHostConfig(dev.id);
              } else {
                openTerminal(dev.id);
              }
            }}
            style={{
              left: `${dev.position.x}px`,
              top: `${dev.position.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
            className={`absolute flex flex-col items-center select-none cursor-move group transition-shadow ${
              isSelected ? 'scale-105 z-20' : 'z-10'
            }`}
          >
            {/* Device Node Icon Box */}
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-b ${bgGlow} border-2 flex items-center justify-center shadow-lg relative transition-all ${
                isSelected
                  ? 'border-cyan-400 ring-4 ring-cyan-500/20 shadow-cyan-900/60'
                  : isCableSource
                  ? 'border-amber-400 ring-4 ring-amber-500/20 animate-pulse'
                  : `${borderColor} hover:border-slate-400 shadow-slate-950/80`
              }`}
            >
              {icon}

              {/* Quick action buttons on hover */}
              <div className="absolute -top-3 -right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isHostDev && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openHostConfig(dev.id);
                    }}
                    title="Visual IP Configuration"
                    className="w-6 h-6 rounded-full bg-sky-700 hover:bg-sky-500 text-white border border-sky-400 flex items-center justify-center shadow transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openTerminal(dev.id);
                  }}
                  title={isHostDev ? 'Command Prompt' : 'Cisco IOS CLI Console'}
                  className="w-6 h-6 rounded-full bg-slate-800 hover:bg-cyan-500 text-slate-200 hover:text-slate-950 border border-slate-700 flex items-center justify-center shadow transition-colors"
                >
                  <Terminal className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Device Hostname & IP Label */}
            <div className="mt-1.5 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-200 tracking-tight bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 shadow-sm">
                {dev.hostname}
              </span>
              <span className="text-[10px] font-mono text-cyan-400/90 mt-0.5">
                {subText}
              </span>
            </div>
          </div>
        );
      })}

      {/* Empty Canvas Indicator for Free Sandbox Mode */}
      {devices.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none p-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-md text-center shadow-2xl backdrop-blur-sm space-y-3 pointer-events-auto">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400">
              <CiscoRouterIcon size={44} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Free Sandbox Mode (Kanvas Kosong)</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Kanvas topologi kosong dan siap digunakan. Tarik (<strong>Drag & Drop</strong>) perangkat dari bilah <strong>Device Palette</strong> di sebelah kiri untuk mulai merancang jaringan Anda secara mandiri.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px] text-cyan-400 font-semibold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <Move className="w-3.5 h-3.5" />
              <span>Cisco Router, Switch L2/L3, PC, Server, Cloud Bridge</span>
            </div>
          </div>
        </div>
      )}

      {/* Cable Connecting Tooltip Banner */}
      {connectingCable && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-cyan-500/60 text-cyan-300 px-4 py-2 rounded-full text-xs font-medium shadow-2xl flex items-center gap-2 backdrop-blur z-30">
          <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>
            {cableSourceDevId 
              ? 'Pilih perangkat tujuan untuk memasang port' 
              : 'Pilih perangkat sumber untuk mulai menghubungkan kabel'}
          </span>
          <button
            onClick={() => {
              setConnectingCable(null);
              setCableSourceDevId(null);
            }}
            className="ml-2 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Port Selection Dialog */}
      {connectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Connect Interfaces</span>
              </h3>
              <button 
                onClick={() => setConnectionModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Source Device Ports */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cyan-400">
                  {connectionModal.sourceDev.hostname} (Source):
                </label>
                <select
                  value={selectedSourcePort}
                  onChange={(e) => setSelectedSourcePort(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {Array.from(connectionModal.sourceDev.interfaces.values())
                    .filter(p => !isPortConnected(connectionModal.sourceDev.id, p.name))
                    .map(p => (
                      <option key={p.name} value={p.name}>
                        {p.shortName} ({p.name})
                      </option>
                    ))}
                </select>
              </div>

              {/* Target Device Ports */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cyan-400">
                  {connectionModal.targetDev.hostname} (Target):
                </label>
                <select
                  value={selectedTargetPort}
                  onChange={(e) => setSelectedTargetPort(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {Array.from(connectionModal.targetDev.interfaces.values())
                    .filter(p => !isPortConnected(connectionModal.targetDev.id, p.name))
                    .map(p => (
                      <option key={p.name} value={p.name}>
                        {p.shortName} ({p.name})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setConnectionModal(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConnection}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-950/50"
              >
                Connect Cable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
