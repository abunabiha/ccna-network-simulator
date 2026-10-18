import React from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { 
  Play, 
  SkipForward, 
  RotateCcw, 
  Eye, 
  Send, 
  Layers
} from 'lucide-react';

export const SimulationBar: React.FC = () => {
  const simulationMode = useNetworkStore((state) => state.simulationMode);
  const simulationEvents = useNetworkStore((state) => state.simulationEvents);
  const currentEventIndex = useNetworkStore((state) => state.currentEventIndex);
  const stepSimulation = useNetworkStore((state) => state.stepSimulation);
  const resetSimulation = useNetworkStore((state) => state.resetSimulation);
  const setSelectedPduEvent = useNetworkStore((state) => state.setSelectedPduEvent);
  const firstDeviceId = useNetworkStore((state) => state.devices[0]?.id || 'R1');

  if (simulationMode !== 'simulation') return null;

  const currentEvent = simulationEvents[currentEventIndex] || null;

  return (
    <div className="h-12 bg-slate-900/95 border-b border-amber-500/40 px-4 flex items-center justify-between text-xs text-slate-200 z-20 backdrop-blur select-none">
      {/* Simulation Status & Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/80 border border-amber-500/50 rounded-lg text-amber-300 font-bold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>SIMULATION MODE (PDU FLOW)</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={stepSimulation}
            title="Step Forward to Next Hop"
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step Forward</span>
          </button>

          <button
            onClick={resetSimulation}
            title="Reset Simulation"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Current Packet Information */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-[11px]">Current Event:</span>
        <span className="font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          {currentEvent 
            ? `ICMP Echo [${currentEvent.packet.sourceIp} -> ${currentEvent.packet.destIp}] @ ${currentEvent.currentDeviceId}`
            : 'No active packet in transit. Run "ping <dest-ip>" in terminal to generate PDUs.'}
        </span>
      </div>

      {/* Right: Inspect PDU Button */}
      <div>
        <button
          onClick={() => {
            // Generate a sample PDU event if none exists to allow exploration
            if (!currentEvent) {
              setSelectedPduEvent({
                id: 'evt-sample',
                step: 1,
                currentDeviceId: firstDeviceId,
                packet: {
                  sourceIp: '192.168.1.10',
                  destIp: '192.168.1.1',
                  protocol: 'ICMP',
                  ttl: 128,
                  data: 'Echo Request'
                },
                status: 'processed',
                explanation: 'Device received an ICMP Echo Request and decapsulates the packet to inspect IP header destination.',
                inLayers: {
                  layer2: { srcMac: '0060.2f11.2233', dstMac: '0001.c422.3344', vlan: 1 },
                  layer3: { srcIp: '192.168.1.10', dstIp: '192.168.1.1', ttl: 128, protocol: 'ICMP' },
                  layer4: { type: 'ICMP', info: 'Type 8 (Echo Request)' }
                },
                outLayers: {
                  layer2: { srcMac: '0001.c422.3344', dstMac: '0060.2f11.2233', vlan: 1 },
                  layer3: { srcIp: '192.168.1.1', dstIp: '192.168.1.10', ttl: 255, protocol: 'ICMP' },
                  layer4: { type: 'ICMP', info: 'Type 0 (Echo Reply)' }
                }
              });
            } else {
              setSelectedPduEvent(currentEvent);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Inspect OSI 7-Layers</span>
        </button>
      </div>
    </div>
  );
};
