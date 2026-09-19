import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { TopologyCanvas } from './components/canvas/TopologyCanvas';
import { CiscoTerminal } from './components/terminal/CiscoTerminal';
import { LabPanel } from './components/labs/LabPanel';
import { SimulationBar } from './components/simulation/SimulationBar';
import { PduInspector } from './components/simulation/PduInspector';
import { GradeModal } from './components/labs/GradeModal';
import { DocsModal } from './components/docs/DocsModal';
import { HostConfigModal } from './components/devices/HostConfigModal';
import { PearsonVueExamModal } from './components/exam/PearsonVueExamModal';
import { LiveDeviceConnectorModal } from './components/devices/LiveDeviceConnectorModal';
import { useNetworkStore } from './store/useNetworkStore';
import { CableType } from './types/network';

export const App: React.FC = () => {
  const [connectingCable, setConnectingCable] = useState<CableType | null>(null);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);

  const { 
    isHostConfigOpen, 
    activeHostConfigId, 
    closeHostConfig,
    isExamModalOpen,
    closeExamModal,
    isLiveConnectorOpen,
    closeLiveConnector
  } = useNetworkStore();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Application Header */}
      <Header onOpenDocs={() => setIsDocsOpen(true)} />

      {/* Simulation Timeline Bar (Only visible when in Simulation mode) */}
      <SimulationBar />

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: Device Palette & Cabling Sidebar */}
        <Sidebar 
          connectingCable={connectingCable}
          setConnectingCable={setConnectingCable}
        />

        {/* Center: Canvas & Bottom Terminal */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Interactive Topology Canvas */}
          <TopologyCanvas 
            connectingCable={connectingCable}
            setConnectingCable={setConnectingCable}
          />

          {/* Cisco IOS Terminal Emulator */}
          <CiscoTerminal />
        </main>

        {/* Right: CCNA Lab Guide & Task Checklist */}
        <LabPanel />
      </div>

      {/* Visual PC IP Configuration Modal */}
      {isHostConfigOpen && (
        <HostConfigModal 
          hostId={activeHostConfigId} 
          onClose={closeHostConfig} 
        />
      )}

      {/* Pearson VUE CCNA 200-301 Exam Simulator Modal */}
      <PearsonVueExamModal 
        isOpen={isExamModalOpen} 
        onClose={closeExamModal} 
      />

      {/* Real-time Physical Hardware / Host NIC Connector Modal */}
      <LiveDeviceConnectorModal 
        isOpen={isLiveConnectorOpen} 
        onClose={closeLiveConnector} 
      />

      {/* OSI 7-Layer PDU Inspector Modal */}
      <PduInspector />

      {/* Lab Assessment Grade Report Card Modal */}
      <GradeModal />

      {/* Scientific SDLC Documentation Modal */}
      <DocsModal 
        isOpen={isDocsOpen} 
        onClose={() => setIsDocsOpen(false)} 
      />
    </div>
  );
};

export default App;
