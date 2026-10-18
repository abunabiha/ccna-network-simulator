import { DeviceType, DevicePosition, InterfaceConfig, ArpEntry } from '../../types/network';
import { CliMode, CliContext, CliExecutionResult } from '../../types/cli';

export abstract class Device {
  id: string;
  hostname: string;
  deviceType: DeviceType;
  position: DevicePosition;
  interfaces: Map<string, InterfaceConfig>;
  bannerMotd: string = '';
  enableSecret: string = '';
  enablePassword: string = '';
  consolePassword: string = '';
  vtyPassword: string = '';
  servicePasswordEncryption: boolean = false;
  ipRouting: boolean = true;
  commandHistory: string[] = [];

  // Address Resolution Protocol (ARP)
  arpTable: ArpEntry[] = [];

  // Cisco Discovery Protocol (CDP)
  cdpEnabled: boolean = true;
  cdpTimer: number = 60;
  cdpHoldtime: number = 180;
  cdpVersion: number = 2;

  constructor(id: string, hostname: string, deviceType: DeviceType, position: DevicePosition) {
    this.id = id;
    this.hostname = hostname;
    this.deviceType = deviceType;
    this.position = position;
    this.interfaces = new Map();
  }

  abstract executeCli(commandLine: string, context: CliContext): CliExecutionResult;
  abstract getRunningConfig(): string;

  getInterface(name: string): InterfaceConfig | undefined {
    return this.interfaces.get(name);
  }

  setInterface(name: string, config: Partial<InterfaceConfig>): void {
    const existing = this.interfaces.get(name);
    if (existing) {
      this.interfaces.set(name, { ...existing, ...config });
    }
  }

  addInterface(config: InterfaceConfig): void {
    this.interfaces.set(config.name, config);
  }

  // ===================== ARP METHODS =====================
  addArpEntry(entry: ArpEntry): void {
    const existingIndex = this.arpTable.findIndex(e => e.ipAddress === entry.ipAddress);
    const enriched: ArpEntry = {
      protocol: entry.protocol || 'Internet',
      ipAddress: entry.ipAddress,
      age: entry.age !== undefined ? entry.age : 0,
      macAddress: entry.macAddress,
      type: entry.type || (entry.age === '-' ? 'static' : 'ARPA'),
      interfaceName: entry.interfaceName
    };
    if (existingIndex >= 0) {
      this.arpTable[existingIndex] = enriched;
    } else {
      this.arpTable.push(enriched);
    }
  }

  removeArpEntry(ipAddress: string): boolean {
    const prevLen = this.arpTable.length;
    this.arpTable = this.arpTable.filter(e => e.ipAddress !== ipAddress);
    return this.arpTable.length < prevLen;
  }

  clearArpTable(keepStatic: boolean = true): void {
    if (keepStatic) {
      this.arpTable = this.arpTable.filter(e => e.type === 'static' || e.age === '-');
    } else {
      this.arpTable = [];
    }
  }

  getArpEntries(): ArpEntry[] {
    return this.arpTable;
  }

  getPrompt(context: CliContext): string {
    const host = this.hostname;
    switch (context.mode) {
      case 'user-exec':
        return `${host}>`;
      case 'priv-exec':
        return `${host}#`;
      case 'global-config':
        return `${host}(config)#`;
      case 'interface-config':
        return `${host}(config-if)#`;
      case 'subinterface-config':
        return `${host}(config-subif)#`;
      case 'vlan-config':
        return `${host}(config-vlan)#`;
      case 'router-config':
        return `${host}(config-router)#`;
      case 'line-config':
        return `${host}(config-line)#`;
      case 'dhcp-config':
        return `${host}(dhcp-config)#`;
      default:
        return `${host}>`;
    }
  }
}
