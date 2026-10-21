import { DeviceType, DevicePosition, InterfaceConfig, ArpEntry, KeyChain, AsPathAclRule } from '../../types/network';
import { CliMode, CliContext, CliExecutionResult } from '../../types/cli';

export abstract class Device {
  id: string;
  hostname: string;
  deviceType: DeviceType;
  model: string = '';
  osVersion: string = '';
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

  // Key Chains for authentication
  keyChains: Map<string, KeyChain> = new Map();

  // BGP AS-Path Access Lists
  asPathAccessLists: Map<number, AsPathAclRule[]> = new Map();

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
    if (!name) return undefined;
    const direct = this.interfaces.get(name);
    if (direct) return direct;

    const lower = name.toLowerCase();
    for (const [k, v] of this.interfaces.entries()) {
      if (k.toLowerCase() === lower || v.name.toLowerCase() === lower || v.shortName?.toLowerCase() === lower) {
        return v;
      }
    }
    return undefined;
  }

  setInterface(name: string, config: Partial<InterfaceConfig>): void {
    const existing = this.getInterface(name);
    if (existing) {
      this.interfaces.set(existing.name, { ...existing, ...config });
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
      case 'route-map-config':
        return `${host}(config-route-map)#`;
      case 'ip-sla-config':
        return `${host}(config-sla-echo)#`;
      case 'vrf-config':
        return `${host}(config-vrf)#`;
      case 'vrf-af-config':
        return `${host}(config-vrf-af)#`;
      case 'crypto-isakmp-policy':
        return `${host}(config-isakmp)#`;
      case 'crypto-ipsec-profile':
        return `${host}(config-ipsec-profile)#`;
      case 'crypto-transform-config':
        return `${host}(cfg-crypto-trans)#`;
      case 'zone-pair-config':
        return `${host}(config-sec-zone-pair)#`;
      case 'class-map-inspect':
        return `${host}(config-cmap)#`;
      case 'policy-map-inspect':
        return `${host}(config-pmap)#`;
      case 'policy-map-class-inspect':
        return `${host}(config-pmap-c)#`;
      case 'control-plane-config':
        return `${host}(config-cp)#`;
      case 'eem-applet-config':
        return `${host}(config-applet)#`;
      case 'mdt-subscription-config':
        return `${host}(config-mdt-sub)#`;
      case 'keychain-config':
        return `${host}(config-keychain)#`;
      case 'keychain-key-config':
        return `${host}(config-keychain-key)#`;
      case 'router-af-config':
        return `${host}(config-router-af)#`;
      case 'router-af-interface-config':
        return `${host}(config-router-af-interface)#`;
      case 'router-af-topology-config':
        return `${host}(config-router-af-topology)#`;
      case 'std-nacl-config':
        return `${host}(config-std-nacl)#`;
      case 'ext-nacl-config':
        return `${host}(config-ext-nacl)#`;
      case 'dhcpv6-config':
        return `${host}(config-dhcpv6)#`;
      case 'ipv6-acl-config':
        return `${host}(config-ipv6-acl)#`;
      case 'time-range-config':
        return `${host}(config-time-range)#`;
      default:
        return `${host}>`;
    }
  }
}
