import React, { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { 
  Layers, 
  X, 
  ArrowRight, 
  Info, 
  CheckCircle2, 
  ShieldCheck, 
  Activity
} from 'lucide-react';

export const PduInspector: React.FC = () => {
  const { selectedPduEvent, setSelectedPduEvent } = useNetworkStore();
  const [activeTab, setActiveTab] = useState<'osi' | 'headers'>('osi');
  const [selectedLayer, setSelectedLayer] = useState<number>(3);

  if (!selectedPduEvent) return null;

  const inL = selectedPduEvent.inLayers;
  const outL = selectedPduEvent.outLayers;

  const layers = [
    { num: 7, name: 'Application', desc: 'ICMP Echo / Payload data' },
    { num: 4, name: 'Transport', desc: inL?.layer4?.info || 'ICMP Type 8 (Echo Request)' },
    { num: 3, name: 'Network', desc: inL?.layer3 ? `IP Header: Src ${inL.layer3.srcIp}, Dst ${inL.layer3.dstIp}, TTL ${inL.layer3.ttl}` : 'IP Routing' },
    { num: 2, name: 'Data Link', desc: inL?.layer2 ? `Ethernet II: Src MAC ${inL.layer2.srcMac}, Dst MAC ${inL.layer2.dstMac}` : 'Ethernet Frame' },
    { num: 1, name: 'Physical', desc: 'FastEthernet/GigabitEthernet Copper Signal' }
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">PDU Information</h2>
                <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                  At Device: {selectedPduEvent.currentDeviceId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                OSI 7-Layer Packet Inspection & Decapsulation
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedPduEvent(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: OSI Model vs Outbound PDU Details */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('osi')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'osi'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OSI Model (In-Layers vs Out-Layers)
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'headers'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inbound / Outbound PDU Details
          </button>
        </div>

        {/* Tab 1: OSI Model Analysis */}
        {activeTab === 'osi' && (
          <div className="grid grid-cols-2 gap-4">
            {/* In Layers */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5" />
                <span>In Layers (Decapsulation)</span>
              </div>

              <div className="space-y-1.5">
                {layers.map(layer => (
                  <div
                    key={layer.num}
                    onClick={() => setSelectedLayer(layer.num)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedLayer === layer.num
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Layer {layer.num}: {layer.name}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Matched</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Out Layers */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Out Layers (Encapsulation)</span>
              </div>

              <div className="space-y-1.5">
                {layers.map(layer => (
                  <div
                    key={layer.num}
                    onClick={() => setSelectedLayer(layer.num)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedLayer === layer.num
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Layer {layer.num}: {layer.name}</span>
                      <span className="text-[10px] text-amber-400 font-mono">Generated</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Raw Header Details */}
        {activeTab === 'headers' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 max-h-72 overflow-y-auto font-mono text-xs text-slate-300">
            <div className="border-b border-slate-800 pb-2">
              <span className="text-cyan-400 font-bold">ETHERNET II FRAME</span>
              <div className="grid grid-cols-2 gap-2 mt-1 text-[11px] text-slate-400">
                <div>Source MAC: <span className="text-slate-200 font-bold">{inL?.layer2?.srcMac || '0000.0000.0000'}</span></div>
                <div>Destination MAC: <span className="text-slate-200 font-bold">{inL?.layer2?.dstMac || 'FFFF.FFFF.FFFF'}</span></div>
                <div>Type: <span className="text-slate-200">0x0800 (IPv4)</span></div>
                <div>802.1Q VLAN Tag: <span className="text-slate-200">{inL?.layer2?.vlan || 'None (Untagged)'}</span></div>
              </div>
            </div>

            <div className="border-b border-slate-800 pb-2">
              <span className="text-cyan-400 font-bold">INTERNET PROTOCOL VERSION 4 (IPv4)</span>
              <div className="grid grid-cols-2 gap-2 mt-1 text-[11px] text-slate-400">
                <div>Source IP: <span className="text-emerald-400 font-bold">{inL?.layer3?.srcIp || '0.0.0.0'}</span></div>
                <div>Destination IP: <span className="text-emerald-400 font-bold">{inL?.layer3?.dstIp || '0.0.0.0'}</span></div>
                <div>TTL: <span className="text-slate-200">{inL?.layer3?.ttl || 128}</span></div>
                <div>Protocol: <span className="text-slate-200">{inL?.layer3?.protocol || 'ICMP (1)'}</span></div>
              </div>
            </div>

            <div>
              <span className="text-cyan-400 font-bold">ICMP PACKET</span>
              <div className="grid grid-cols-2 gap-2 mt-1 text-[11px] text-slate-400">
                <div>Type: <span className="text-slate-200">8 (Echo Request)</span></div>
                <div>Code: <span className="text-slate-200">0</span></div>
                <div>Checksum: <span className="text-slate-200">0x4d5b</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Pedagogical Explanation Box */}
        <div className="bg-slate-950/80 border border-cyan-500/40 rounded-xl p-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong>Analisis Lapisan OSI: </strong> 
            {selectedPduEvent.explanation}
          </div>
        </div>
      </div>
    </div>
  );
};
