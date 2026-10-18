import React from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { DeviceType, CableType } from '../../types/network';
import { Host } from '../../core/devices/Host';
import { 
  CiscoRouterIcon, 
  CiscoSwitchIcon, 
  CiscoL3SwitchIcon, 
  CiscoPcIcon, 
  CiscoServerIcon,
  CiscoCloudIcon 
} from '../common/CiscoIcons';
import { 
  Cable, 
  Plus, 
  Trash2, 
  Info,
  Settings,
  Layers,
  Move
} from 'lucide-react';

interface SidebarProps {
  connectingCable: CableType | null;
  setConnectingCable: (cable: CableType | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ connectingCable, setConnectingCable }) => {
  const addDevice = useNetworkStore((state) => state.addDevice);
  const selectedDeviceId = useNetworkStore((state) => state.selectedDeviceId);
  const removeDevice = useNetworkStore((state) => state.removeDevice);
  const openHostConfig = useNetworkStore((state) => state.openHostConfig);
  const deviceCount = useNetworkStore((state) => state.devices.length);
  const selectedDev = useNetworkStore((state) => 
    state.selectedDeviceId ? state.devices.find(d => d.id === state.selectedDeviceId) : undefined
  );

  const isDraggingRef = React.useRef(false);

  const handleAdd = (type: DeviceType) => {
    // Menempatkan node di tengah kanvas secara acak sedikit agar tidak menumpuk
    const x = 320 + Math.floor(Math.random() * 120 - 60);
    const y = 240 + Math.floor(Math.random() * 120 - 60);
    addDevice(type, x, y);
  };

  const handleCardClick = (type: DeviceType) => {
    if (isDraggingRef.current) return;
    handleAdd(type);
  };

  const handleDragStart = (e: React.DragEvent, type: DeviceType) => {
    isDraggingRef.current = true;
    e.dataTransfer.setData('application/json', JSON.stringify({ type }));
    e.dataTransfer.setData('text/plain', JSON.stringify({ type }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none z-20 shrink-0">
      <div className="p-3 overflow-y-auto space-y-4">
        {/* Device Palette */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Device Palette</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <Move className="w-2.5 h-2.5" /> Drag & Drop
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Cisco ISR Router */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'router')}
              onDragEnd={handleDragEnd}
              onClick={() => handleCardClick('router')}
              title="Drag ke canvas atau klik untuk menambahkan"
              className="flex flex-col items-center justify-center p-2.5 bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all group cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CiscoRouterIcon size={38} />
              </div>
              <span className="text-[11px] font-semibold text-slate-200 mt-1">Cisco Router</span>
              <span className="text-[9px] text-slate-500">ISR 4331 / 2911</span>
            </div>

            {/* Catalyst L2 Switch */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'switch')}
              onDragEnd={handleDragEnd}
              onClick={() => handleCardClick('switch')}
              title="Drag ke canvas atau klik untuk menambahkan"
              className="flex flex-col items-center justify-center p-2.5 bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/50 rounded-xl transition-all group cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CiscoSwitchIcon size={38} />
              </div>
              <span className="text-[11px] font-semibold text-slate-200 mt-1">Catalyst 2960</span>
              <span className="text-[9px] text-slate-500">Layer 2 Switch</span>
            </div>

            {/* Catalyst L3 Switch */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'switch-l3')}
              onDragEnd={handleDragEnd}
              onClick={() => handleCardClick('switch-l3')}
              title="Drag ke canvas atau klik untuk menambahkan"
              className="flex flex-col items-center justify-center p-2.5 bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl transition-all group cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CiscoL3SwitchIcon size={38} />
              </div>
              <span className="text-[11px] font-semibold text-slate-200 mt-1">Catalyst 9300</span>
              <span className="text-[9px] text-indigo-400 font-medium">L3 Switch (IOS-XE 17.12.6)</span>
            </div>

            {/* PC Desktop */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'pc')}
              onDragEnd={handleDragEnd}
              onClick={() => handleCardClick('pc')}
              title="Drag ke canvas atau klik untuk menambahkan"
              className="flex flex-col items-center justify-center p-2.5 bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-sky-500/50 rounded-xl transition-all group cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CiscoPcIcon size={38} />
              </div>
              <span className="text-[11px] font-semibold text-slate-200 mt-1">PC Desktop</span>
              <span className="text-[9px] text-slate-500">DHCP / Static IP</span>
            </div>

            {/* Server */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'server')}
              onDragEnd={handleDragEnd}
              onClick={() => handleCardClick('server')}
              title="Drag ke canvas atau klik untuk menambahkan"
              className="flex flex-col items-center justify-center p-2.5 bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/50 rounded-xl transition-all group cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CiscoServerIcon size={38} />
              </div>
              <span className="text-[11px] font-semibold text-slate-200 mt-1">App Server</span>
              <span className="text-[9px] text-slate-500">HTTP / DNS</span>
            </div>

            {/* Real Host Network Bridge (Cloud) */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'cloud')}
              onDragEnd={handleDragEnd}
              onClick={() => handleCardClick('cloud')}
              title="Drag ke canvas atau klik untuk menjembatani jaringan fisik PC"
              className="flex flex-col items-center justify-center p-2.5 bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all group cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CiscoCloudIcon size={38} />
              </div>
              <span className="text-[11px] font-semibold text-slate-200 mt-1">Host Bridge</span>
              <span className="text-[9px] text-slate-500">Live Real NIC</span>
            </div>
          </div>
        </div>

        {/* Cabling & Connections */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            <Cable className="w-3.5 h-3.5 text-cyan-400" />
            <span>Connections</span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => setConnectingCable(connectingCable === 'straight' ? null : 'straight')}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium border transition-all ${
                connectingCable === 'straight'
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-cyan-400 rounded-full" />
                <span>Copper Straight-Through</span>
              </div>
              {connectingCable === 'straight' && (
                <span className="text-[10px] bg-cyan-500 text-slate-950 px-1 rounded font-bold">Active</span>
              )}
            </button>

            <button
              onClick={() => setConnectingCable(connectingCable === 'crossover' ? null : 'crossover')}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium border transition-all ${
                connectingCable === 'crossover'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 border-t border-dashed border-amber-400" />
                <span>Copper Cross-Over</span>
              </div>
              {connectingCable === 'crossover' && (
                <span className="text-[10px] bg-amber-500 text-slate-950 px-1 rounded font-bold">Active</span>
              )}
            </button>
          </div>
        </div>

        {/* Selected Device Properties / Actions */}
        {selectedDev && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase">Selected Node</span>
              <button
                onClick={() => removeDevice(selectedDev.id)}
                title="Delete Device"
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-1 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="text-sm font-bold text-cyan-400">{selectedDev.hostname || selectedDev.id}</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                Type: {selectedDev.deviceType || 'Device'} ({selectedDev.id})
              </div>
            </div>

            {/* Interface list preview */}
            <div className="space-y-1 pt-1 border-t border-slate-800/60">
              <div className="text-[10px] font-semibold text-slate-400">Ports & Interfaces:</div>
              <div className="max-h-28 overflow-y-auto space-y-0.5 pr-1">
                {Array.from(selectedDev.interfaces?.values?.() ?? []).slice(0, 6).map((iface, idx) => (
                  <div key={iface?.name || idx} className="flex items-center justify-between text-[10px] text-slate-300 bg-slate-900/60 px-1.5 py-0.5 rounded">
                    <span>
                      {iface?.shortName || iface?.name || 'Port'}
                      {iface?.ipAddress ? ` (${iface.ipAddress})` : ''}
                    </span>
                    <span className={iface?.isShutdown ? 'text-rose-400' : iface?.status === 'up' ? 'text-emerald-400' : 'text-slate-500'}>
                      {iface?.isShutdown ? 'Admin Down' : (iface?.status || 'down')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick action for Host IP config */}
            {(selectedDev.deviceType === 'pc' || selectedDev.deviceType === 'server' || selectedDev instanceof Host) && (
              <button
                onClick={() => openHostConfig(selectedDev.id)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-sky-950/80 hover:bg-sky-900 border border-sky-600/50 text-sky-300 rounded-lg text-xs font-semibold transition-colors mt-2"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configure IP (Visual GUI)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[10px] text-slate-500 flex items-center justify-between">
        <span>Topology Nodes: {deviceCount}</span>
        <span className="text-cyan-500 font-medium">Auto-Sync</span>
      </div>
    </aside>
  );
};
