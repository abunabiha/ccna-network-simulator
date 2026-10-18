import { create } from 'zustand';
import { Device } from '../core/devices/Device';
import { Router } from '../core/devices/Router';
import { Switch } from '../core/devices/Switch';
import { Host } from '../core/devices/Host';
import { PhysicalLink, DeviceType, CableType, SimulationEvent } from '../types/network';
import { CliContext } from '../types/cli';
import { LabDefinition, LabGradeReport } from '../types/lab';
import { CCNA_LABS } from '../data/ccnaLabs';
import { CliParser } from '../core/cli/Parser';
import { LabGrader } from '../core/grader/LabGrader';

interface NetworkState {
  devices: Device[];
  links: PhysicalLink[];
  selectedDeviceId: string | null;
  activeTerminalDeviceId: string | null;
  openTerminalTabs: string[];
  cliContexts: Record<string, CliContext>;
  terminalOutputs: Record<string, string[]>;
  currentLab: LabDefinition | null;
  gradeReport: LabGradeReport | null;
  isGradeModalOpen: boolean;
  simulationMode: 'realtime' | 'simulation';
  simulationEvents: SimulationEvent[];
  currentEventIndex: number;
  selectedPduEvent: SimulationEvent | null;

  isHostConfigOpen: boolean;
  activeHostConfigId: string | null;
  isExamModalOpen: boolean;
  isLiveConnectorOpen: boolean;

  // Actions
  openLiveConnector: () => void;
  closeLiveConnector: () => void;
  addDevice: (type: DeviceType, x: number, y: number, customName?: string) => Device;
  removeDevice: (id: string) => void;
  moveDevice: (id: string, x: number, y: number) => void;
  connectPorts: (sourceId: string, sourcePort: string, targetId: string, targetPort: string, cableType?: CableType) => boolean;
  removeLink: (id: string) => void;
  selectDevice: (id: string | null) => void;
  openTerminal: (id: string) => void;
  closeTerminalTab: (id: string) => void;
  setActiveTerminalTab: (id: string) => void;
  executeCommand: (deviceId: string, command: string) => void;
  clearTerminalOutput: (deviceId: string) => void;
  loadLab: (labId: string) => void;
  gradeCurrentLab: () => void;
  closeGradeModal: () => void;
  setSimulationMode: (mode: 'realtime' | 'simulation') => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  setSelectedPduEvent: (event: SimulationEvent | null) => void;
  openHostConfig: (id: string) => void;
  closeHostConfig: () => void;
  updateHostConfig: (id: string, config: {
    isDhcp: boolean;
    ipAddress: string;
    subnetMask: string;
    defaultGateway: string;
    dnsServer: string;
    ipv6Address?: string;
    ipv6Gateway?: string;
  }) => void;
  openExamModal: () => void;
  closeExamModal: () => void;
  exportTopologyJson: () => string;
  importTopologyJson: (jsonData: string) => boolean;
}

export const useNetworkStore = create<NetworkState>((set, get) => {
  // Inisialisasi default lab pertama
  const initialLab = CCNA_LABS[0];

  const initializeLabDevices = (lab: LabDefinition) => {
    const devices: Device[] = [];
    const contexts: Record<string, CliContext> = {};
    const outputs: Record<string, string[]> = {};

    for (const d of lab.initialTopology.devices) {
      let dev: Device;
      if (d.type === 'router') {
        dev = new Router(d.id, d.hostname, { x: d.x, y: d.y });
      } else if (d.type === 'switch') {
        dev = new Switch(d.id, d.hostname, { x: d.x, y: d.y }, false);
      } else if (d.type === 'switch-l3') {
        dev = new Switch(d.id, d.hostname, { x: d.x, y: d.y }, true);
      } else {
        dev = new Host(d.id, d.hostname, d.type as any, { x: d.x, y: d.y });
        // Preset IP for host in lab 01
        if (d.id === 'PC1') {
          (dev as Host).ipAddress = '192.168.1.10';
          (dev as Host).subnetMask = '255.255.255.0';
          (dev as Host).defaultGateway = '192.168.1.1';
        }
      }

      devices.push(dev);
      contexts[dev.id] = {
        deviceId: dev.id,
        mode: dev instanceof Host ? 'user-exec' : 'user-exec'
      };
      outputs[dev.id] = [
        dev instanceof Host
          ? `Microsoft Windows [Version 10.0.19045.3803]\n(c) Microsoft Corporation. All rights reserved.\n`
          : `\nPress RETURN to get started!\n`
      ];
    }

    const links: PhysicalLink[] = lab.initialTopology.links.map(l => ({
      id: l.id,
      sourceDeviceId: l.sourceDeviceId,
      sourcePort: l.sourcePort,
      targetDeviceId: l.targetDeviceId,
      targetPort: l.targetPort,
      cableType: l.cableType || 'straight'
    }));

    // Update initial port link status to up if cables connected and set peer references
    for (const link of links) {
      const srcDev = devices.find(d => d.id === link.sourceDeviceId);
      const dstDev = devices.find(d => d.id === link.targetDeviceId);
      if (srcDev) {
        const p = srcDev.interfaces.get(link.sourcePort);
        if (p) {
          if (!p.isShutdown) p.status = 'up';
          p.connectedDeviceId = link.targetDeviceId;
          p.connectedPort = link.targetPort;
        }
      }
      if (dstDev) {
        const p = dstDev.interfaces.get(link.targetPort);
        if (p) {
          if (!p.isShutdown) p.status = 'up';
          p.connectedDeviceId = link.sourceDeviceId;
          p.connectedPort = link.sourcePort;
        }
      }
    }

    return { devices, links, contexts, outputs };
  };

  const initialData = initializeLabDevices(initialLab);

  return {
    devices: initialData.devices,
    links: initialData.links,
    selectedDeviceId: 'R1',
    activeTerminalDeviceId: 'R1',
    openTerminalTabs: ['R1', 'SW1', 'PC1'],
    cliContexts: initialData.contexts,
    terminalOutputs: initialData.outputs,
    currentLab: initialLab,
    gradeReport: null,
    isGradeModalOpen: false,
    simulationMode: 'realtime',
    simulationEvents: [],
    currentEventIndex: 0,
    selectedPduEvent: null,
    isHostConfigOpen: false,
    activeHostConfigId: null,
    isExamModalOpen: false,
    isLiveConnectorOpen: false,

    openLiveConnector: () => {
      set({ isLiveConnectorOpen: true });
    },

    closeLiveConnector: () => {
      set({ isLiveConnectorOpen: false });
    },

    addDevice: (type: DeviceType, x: number, y: number, customName?: string) => {
      const { devices, cliContexts, terminalOutputs, openTerminalTabs, activeTerminalDeviceId } = get();
      
      // Collision-free unique ID using timestamp and random string
      const randSuffix = Math.random().toString(36).substring(2, 8);
      const ts = Date.now().toString(36);
      const id = `${type.toUpperCase()}_${ts}_${randSuffix}`;

      // Calculate next available unique hostname
      let name = customName;
      if (!name) {
        if (type === 'cloud') {
          const cloudCount = devices.filter(d => d.deviceType === 'cloud').length;
          name = cloudCount === 0 ? 'LiveHostBridge' : `LiveHostBridge_${cloudCount + 1}`;
        } else {
          const prefixName = 
            type === 'router' ? 'Router' :
            type === 'switch' ? 'Switch' :
            type === 'switch-l3' ? 'SwitchL3_' :
            type === 'server' ? 'Server' :
            'PC';

          let nextNum = 1;
          while (devices.some(d => d.hostname?.toLowerCase() === `${prefixName}${nextNum}`.toLowerCase())) {
            nextNum++;
          }
          name = `${prefixName}${nextNum}`;
        }
      }

      let dev: Device;
      if (type === 'router') {
        dev = new Router(id, name, { x, y });
      } else if (type === 'switch') {
        dev = new Switch(id, name, { x, y }, false);
      } else if (type === 'switch-l3') {
        dev = new Switch(id, name, { x, y }, true);
      } else {
        dev = new Host(id, name, type as any, { x, y });
        if (type === 'cloud') {
          (dev as Host).ipAddress = '192.168.1.1';
          (dev as Host).subnetMask = '255.255.255.0';
          (dev as Host).defaultGateway = '192.168.1.1';
        }
      }

      // Only set activeTerminalDeviceId if none exists
      const nextActiveTerminalId = activeTerminalDeviceId || dev.id;
      // Do not clutter openTerminalTabs unless user specifically opens terminal
      const updatedTabs = openTerminalTabs.length === 0 ? [dev.id] : openTerminalTabs;

      set({
        devices: [...devices, dev],
        selectedDeviceId: dev.id,
        activeTerminalDeviceId: nextActiveTerminalId,
        openTerminalTabs: updatedTabs,
        cliContexts: {
          ...cliContexts,
          [dev.id]: { deviceId: dev.id, mode: 'user-exec' }
        },
        terminalOutputs: {
          ...terminalOutputs,
          [dev.id]: [dev instanceof Host ? 'Windows Command Prompt [Version 10.0]\n' : '\nPress RETURN to get started!\n']
        }
      });

      return dev;
    },

    removeDevice: (id: string) => {
      const { devices, links, openTerminalTabs, activeTerminalDeviceId } = get();
      const updatedDevices = devices.filter(d => d.id !== id);
      const updatedLinks = links.filter(l => l.sourceDeviceId !== id && l.targetDeviceId !== id);
      const updatedTabs = openTerminalTabs.filter(t => t !== id);
      const nextActive = activeTerminalDeviceId === id ? (updatedTabs[0] || null) : activeTerminalDeviceId;

      set({
        devices: updatedDevices,
        links: updatedLinks,
        openTerminalTabs: updatedTabs,
        activeTerminalDeviceId: nextActive,
        selectedDeviceId: null
      });
    },

    moveDevice: (id: string, x: number, y: number) => {
      const { devices } = get();
      const dev = devices.find(d => d.id === id);
      if (!dev) return;
      if (dev.position?.x === x && dev.position?.y === y) return;

      const updated = devices.map(d => {
        if (d.id === id) {
          d.position = { x, y };
        }
        return d;
      });
      set({ devices: [...updated] });
    },

    connectPorts: (sourceId: string, sourcePort: string, targetId: string, targetPort: string, cableType: CableType = 'straight') => {
      const { links, devices } = get();
      // Pastikan port belum terhubung
      const exists = links.some(
        l => (l.sourceDeviceId === sourceId && l.sourcePort === sourcePort) ||
             (l.targetDeviceId === sourceId && l.targetPort === sourcePort) ||
             (l.sourceDeviceId === targetId && l.sourcePort === targetPort) ||
             (l.targetDeviceId === targetId && l.targetPort === targetPort)
      );
      if (exists) return false;

      const newLink: PhysicalLink = {
        id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sourceDeviceId: sourceId,
        sourcePort,
        targetDeviceId: targetId,
        targetPort,
        cableType
      };

      const srcDev = devices.find(d => d.id === sourceId);
      const dstDev = devices.find(d => d.id === targetId);

      if (srcDev) {
        const p = srcDev.interfaces.get(sourcePort);
        if (p) {
          if (!p.isShutdown) p.status = 'up';
          p.connectedDeviceId = targetId;
          p.connectedPort = targetPort;
        }
      }
      if (dstDev) {
        const p = dstDev.interfaces.get(targetPort);
        if (p) {
          if (!p.isShutdown) p.status = 'up';
          p.connectedDeviceId = sourceId;
          p.connectedPort = sourcePort;
        }
      }

      set({ links: [...links, newLink], devices: [...devices] });
      return true;
    },

    removeLink: (id: string) => {
      const { links, devices } = get();
      const link = links.find(l => l.id === id);
      if (link) {
        const srcDev = devices.find(d => d.id === link.sourceDeviceId);
        const dstDev = devices.find(d => d.id === link.targetDeviceId);
        if (srcDev) {
          const p = srcDev.interfaces.get(link.sourcePort);
          if (p) {
            p.status = 'down';
            p.connectedDeviceId = undefined;
            p.connectedPort = undefined;
          }
        }
        if (dstDev) {
          const p = dstDev.interfaces.get(link.targetPort);
          if (p) {
            p.status = 'down';
            p.connectedDeviceId = undefined;
            p.connectedPort = undefined;
          }
        }
      }
      set({ links: links.filter(l => l.id !== id), devices: [...devices] });
    },

    selectDevice: (id: string | null) => {
      set({ selectedDeviceId: id });
    },

    openTerminal: (id: string) => {
      const { openTerminalTabs } = get();
      if (!openTerminalTabs.includes(id)) {
        set({
          openTerminalTabs: [...openTerminalTabs, id],
          activeTerminalDeviceId: id
        });
      } else {
        set({ activeTerminalDeviceId: id });
      }
    },

    closeTerminalTab: (id: string) => {
      const { openTerminalTabs, activeTerminalDeviceId } = get();
      const updated = openTerminalTabs.filter(t => t !== id);
      const nextActive = activeTerminalDeviceId === id ? (updated[0] || null) : activeTerminalDeviceId;
      set({ openTerminalTabs: updated, activeTerminalDeviceId: nextActive });
    },

    setActiveTerminalTab: (id: string) => {
      set({ activeTerminalDeviceId: id, selectedDeviceId: id });
    },

    executeCommand: (deviceId: string, command: string) => {
      const { devices, cliContexts, terminalOutputs } = get();
      const device = devices.find(d => d.id === deviceId);
      if (!device) return;

      const currentContext = cliContexts[deviceId] || { deviceId, mode: 'user-exec' };
      const prompt = device.getPrompt(currentContext);

      // Jalankan Parser
      const result = CliParser.execute(command, currentContext, device, devices);

      // Perbarui Context
      const updatedContext: CliContext = {
        ...currentContext,
        mode: result.newMode || currentContext.mode,
        ...(result.contextUpdates || {})
      };

      // Format baris output (dibatasi 200 baris terbaru agar memori dan DOM tetap ringan)
      const deviceOutputs = terminalOutputs[deviceId] || [];
      const newLines = [...deviceOutputs, `${prompt} ${command}`];
      if (result.output) {
        newLines.push(result.output);
      }
      const boundedLines = newLines.length > 200 ? newLines.slice(-200) : newLines;

      set({
        devices: [...devices],
        cliContexts: {
          ...cliContexts,
          [deviceId]: updatedContext
        },
        terminalOutputs: {
          ...terminalOutputs,
          [deviceId]: boundedLines
        }
      });
    },

    clearTerminalOutput: (deviceId: string) => {
      const { terminalOutputs } = get();
      set({
        terminalOutputs: {
          ...terminalOutputs,
          [deviceId]: []
        }
      });
    },

    loadLab: (labId: string) => {
      const lab = CCNA_LABS.find(l => l.id === labId);
      if (!lab) return;

      const initialized = initializeLabDevices(lab);
      set({
        currentLab: lab,
        devices: initialized.devices,
        links: initialized.links,
        cliContexts: initialized.contexts,
        terminalOutputs: initialized.outputs,
        openTerminalTabs: initialized.devices.slice(0, 3).map(d => d.id),
        activeTerminalDeviceId: initialized.devices[0]?.id || null,
        selectedDeviceId: initialized.devices[0]?.id || null,
        gradeReport: null,
        isGradeModalOpen: false,
        simulationEvents: [],
        currentEventIndex: 0
      });
    },

    gradeCurrentLab: () => {
      const { currentLab, devices } = get();
      if (!currentLab) return;

      const report = LabGrader.grade(currentLab, devices);
      set({ gradeReport: report, isGradeModalOpen: true });
    },

    closeGradeModal: () => {
      set({ isGradeModalOpen: false });
    },

    setSimulationMode: (mode: 'realtime' | 'simulation') => {
      set({ simulationMode: mode });
    },

    stepSimulation: () => {
      const { currentEventIndex, simulationEvents } = get();
      if (currentEventIndex < simulationEvents.length - 1) {
        const nextIdx = currentEventIndex + 1;
        set({
          currentEventIndex: nextIdx,
          selectedPduEvent: simulationEvents[nextIdx]
        });
      }
    },

    resetSimulation: () => {
      set({ currentEventIndex: 0, selectedPduEvent: null });
    },

    setSelectedPduEvent: (event: SimulationEvent | null) => {
      set({ selectedPduEvent: event });
    },

    openHostConfig: (id: string) => {
      set({ isHostConfigOpen: true, activeHostConfigId: id });
    },

    closeHostConfig: () => {
      set({ isHostConfigOpen: false, activeHostConfigId: null });
    },

    updateHostConfig: (id: string, config: {
      isDhcp: boolean;
      ipAddress: string;
      subnetMask: string;
      defaultGateway: string;
      dnsServer: string;
      ipv6Address?: string;
      ipv6Gateway?: string;
    }) => {
      const { devices } = get();
      const updated = devices.map(d => {
        if (d.id === id) {
          const h = d as Host;
          h.isDhcp = config.isDhcp;
          h.ipAddress = config.ipAddress;
          h.subnetMask = config.subnetMask;
          h.defaultGateway = config.defaultGateway;
          h.dnsServer = config.dnsServer;

          // Update network adapter interface FastEthernet0
          const ifc = h.interfaces?.get('FastEthernet0') || Array.from(h.interfaces?.values() || [])[0];
          if (ifc) {
            ifc.ipAddress = config.ipAddress;
            ifc.subnetMask = config.subnetMask;
            if (config.ipAddress && config.ipAddress !== '0.0.0.0') {
              ifc.status = 'up';
            }
          }
        }
        return d;
      });

      set({ devices: [...updated] });
    },

    openExamModal: () => {
      set({ isExamModalOpen: true });
    },

    closeExamModal: () => {
      set({ isExamModalOpen: false });
    },

    exportTopologyJson: () => {
      const { devices, links } = get();
      const exportData = {
        app: 'CCNA NetSim Pro',
        version: '1.1.0',
        exportedAt: new Date().toISOString(),
        topology: {
          devices: devices.map(d => ({
            id: d.id,
            hostname: d.hostname,
            deviceType: d.deviceType,
            position: d.position,
            interfaces: Array.from(d.interfaces.values()).map(i => ({
              name: i.name,
              shortName: i.shortName,
              ipAddress: i.ipAddress,
              subnetMask: i.subnetMask,
              status: i.status,
              isShutdown: i.isShutdown
            })),
            isDhcp: d instanceof Host ? d.isDhcp : undefined,
            ipAddress: d instanceof Host ? d.ipAddress : undefined,
            subnetMask: d instanceof Host ? d.subnetMask : undefined,
            defaultGateway: d instanceof Host ? d.defaultGateway : undefined,
            dnsServer: d instanceof Host ? d.dnsServer : undefined
          })),
          links: links.map(l => ({
            id: l.id,
            sourceDeviceId: l.sourceDeviceId,
            sourcePort: l.sourcePort,
            targetDeviceId: l.targetDeviceId,
            targetPort: l.targetPort,
            cableType: l.cableType
          }))
        }
      };
      return JSON.stringify(exportData, null, 2);
    },

    importTopologyJson: (jsonData: string) => {
      try {
        const parsed = JSON.parse(jsonData);
        const topData = parsed.topology || parsed;
        if (!topData || !Array.isArray(topData.devices)) {
          return false;
        }

        const newDevices: Device[] = [];
        const contexts: Record<string, CliContext> = {};
        const outputs: Record<string, string[]> = {};

        for (const d of topData.devices) {
          let dev: Device;
          const pos = d.position || { x: 300, y: 300 };
          if (d.deviceType === 'router' || d.type === 'router') {
            dev = new Router(d.id, d.hostname, pos);
          } else if (d.deviceType === 'switch-l3' || d.type === 'switch-l3') {
            dev = new Switch(d.id, d.hostname, pos, true);
          } else if (d.deviceType === 'switch' || d.type === 'switch') {
            dev = new Switch(d.id, d.hostname, pos, false);
          } else {
            dev = new Host(d.id, d.hostname, (d.deviceType || d.type || 'pc') as any, pos);
            if (dev instanceof Host) {
              if (d.ipAddress) dev.ipAddress = d.ipAddress;
              if (d.subnetMask) dev.subnetMask = d.subnetMask;
              if (d.defaultGateway) dev.defaultGateway = d.defaultGateway;
              if (d.dnsServer) dev.dnsServer = d.dnsServer;
              if (typeof d.isDhcp === 'boolean') dev.isDhcp = d.isDhcp;
            }
          }

          // Restore interface states if available
          if (Array.isArray(d.interfaces)) {
            for (const ifaceData of d.interfaces) {
              const p = dev.interfaces.get(ifaceData.name);
              if (p) {
                if (ifaceData.ipAddress !== undefined) p.ipAddress = ifaceData.ipAddress;
                if (ifaceData.subnetMask !== undefined) p.subnetMask = ifaceData.subnetMask;
                if (ifaceData.status !== undefined) p.status = ifaceData.status;
                if (ifaceData.isShutdown !== undefined) p.isShutdown = ifaceData.isShutdown;
              }
            }
          }

          newDevices.push(dev);
          contexts[dev.id] = { deviceId: dev.id, mode: 'user-exec' };
          outputs[dev.id] = [
            dev instanceof Host
              ? 'Microsoft Windows [Version 10.0.19045.3803]\n(c) Microsoft Corporation. All rights reserved.\n'
              : '\nPress RETURN to get started!\n'
          ];
        }

        const newLinks: PhysicalLink[] = Array.isArray(topData.links)
          ? topData.links.map((l: any, idx: number) => ({
              id: l.id || `imported_link_${idx}_${Date.now()}`,
              sourceDeviceId: l.sourceDeviceId,
              sourcePort: l.sourcePort,
              targetDeviceId: l.targetDeviceId,
              targetPort: l.targetPort,
              cableType: l.cableType || 'straight'
            }))
          : [];

        // Update interface statuses according to links
        for (const link of newLinks) {
          const srcDev = newDevices.find(d => d.id === link.sourceDeviceId);
          const dstDev = newDevices.find(d => d.id === link.targetDeviceId);
          if (srcDev) {
            const p = srcDev.interfaces.get(link.sourcePort);
            if (p && !p.isShutdown) p.status = 'up';
          }
          if (dstDev) {
            const p = dstDev.interfaces.get(link.targetPort);
            if (p && !p.isShutdown) p.status = 'up';
          }
        }

        set({
          devices: newDevices,
          links: newLinks,
          cliContexts: contexts,
          terminalOutputs: outputs,
          openTerminalTabs: newDevices.slice(0, 3).map(d => d.id),
          activeTerminalDeviceId: newDevices[0]?.id || null,
          selectedDeviceId: newDevices[0]?.id || null,
          currentLab: null,
          gradeReport: null
        });

        return true;
      } catch (err) {
        console.error('Failed to import topology JSON:', err);
        return false;
      }
    }
  };
});
