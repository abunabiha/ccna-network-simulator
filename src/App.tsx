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
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { CableType } from './types/network';

export const App: React.FC = () => {
  const [connectingCable, setConnectingCable] = useState<CableType | null>(null);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);

  const isHostConfigOpen = useNetworkStore((state) => state.isHostConfigOpen);
  const activeHostConfigId = useNetworkStore((state) => state.activeHostConfigId);
  const closeHostConfig = useNetworkStore((state) => state.closeHostConfig);
  const isExamModalOpen = useNetworkStore((state) => state.isExamModalOpen);
  const closeExamModal = useNetworkStore((state) => state.closeExamModal);
  const isLiveConnectorOpen = useNetworkStore((state) => state.isLiveConnectorOpen);
  const closeLiveConnector = useNetworkStore((state) => state.closeLiveConnector);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Application Header */}
      <ErrorBoundary fallbackTitle="Terjadi Gangguan pada Header">
        <Header onOpenDocs={() => setIsDocsOpen(true)} />
      </ErrorBoundary>

      {/* Simulation Timeline Bar (Only visible when in Simulation mode) */}
      <ErrorBoundary fallbackTitle="Terjadi Gangguan pada Simulation Bar">
        <SimulationBar />
      </ErrorBoundary>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: Device Palette & Cabling Sidebar */}
        <ErrorBoundary fallbackTitle="Terjadi Gangguan pada Device Palette">
          <Sidebar 
            connectingCable={connectingCable}
            setConnectingCable={setConnectingCable}
          />
        </ErrorBoundary>

        {/* Center: Canvas & Bottom Terminal */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Interactive Topology Canvas */}
          <ErrorBoundary fallbackTitle="Terjadi Gangguan pada Topology Canvas">
            <TopologyCanvas 
              connectingCable={connectingCable}
              setConnectingCable={setConnectingCable}
            />
          </ErrorBoundary>

          {/* Cisco IOS Terminal Emulator */}
          <ErrorBoundary fallbackTitle="Terjadi Gangguan pada Terminal Cisco">
            <CiscoTerminal />
          </ErrorBoundary>
        </main>

        {/* Right: CCNA Lab Guide & Task Checklist */}
        <ErrorBoundary fallbackTitle="Terjadi Gangguan pada Lab Guide">
          <LabPanel />
        </ErrorBoundary>
      </div>

      {/* Visual PC IP Configuration Modal */}
      {isHostConfigOpen && (
        <ErrorBoundary fallbackTitle="Terjadi Gangguan pada Konfigurasi Host">
          <HostConfigModal 
            hostId={activeHostConfigId} 
            onClose={closeHostConfig} 
          />
        </ErrorBoundary>
      )}

      {/* Pearson VUE CCNA 200-301 Exam Simulator Modal */}
      <ErrorBoundary fallbackTitle="Terjadi Gangguan pada Exam Simulator">
        <PearsonVueExamModal 
          isOpen={isExamModalOpen} 
          onClose={closeExamModal} 
        />
      </ErrorBoundary>

      {/* Real-time Physical Hardware / Host NIC Connector Modal */}
      <ErrorBoundary fallbackTitle="Terjadi Gangguan pada Live Device Connector">
        <LiveDeviceConnectorModal 
          isOpen={isLiveConnectorOpen} 
          onClose={closeLiveConnector} 
        />
      </ErrorBoundary>

      {/* OSI 7-Layer PDU Inspector Modal */}
      <ErrorBoundary fallbackTitle="Terjadi Gangguan pada PDU Inspector">
        <PduInspector />
      </ErrorBoundary>

      {/* Lab Assessment Grade Report Card Modal */}
      <ErrorBoundary fallbackTitle="Terjadi Gangguan pada Grade Modal">
        <GradeModal />
      </ErrorBoundary>

      {/* Scientific SDLC Documentation Modal */}
      <ErrorBoundary fallbackTitle="Terjadi Gangguan pada Dokumentasi">
        <DocsModal 
          isOpen={isDocsOpen} 
          onClose={() => setIsDocsOpen(false)} 
        />
      </ErrorBoundary>
    </div>
  );
};

export default App;
