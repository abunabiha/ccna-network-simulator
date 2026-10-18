export type DeviceType = 'router' | 'switch' | 'switch-l3' | 'pc' | 'server' | 'cloud';

export type CableType = 'straight' | 'crossover' | 'serial' | 'console';

export type PortStatus = 'up' | 'down' | 'admin-down';

export type SwitchPortMode = 'access' | 'trunk' | 'dynamic' | 'none';

export interface InterfaceConfig {
  name: string;                // e.g. 'GigabitEthernet0/0', 'FastEthernet0/1', 'Serial0/0/0'
  shortName: string;           // e.g. 'Gi0/0', 'Fa0/1', 'Se0/0/0'
  ipAddress?: string;          // e.g. '192.168.1.1'
  subnetMask?: string;         // e.g. '255.255.255.0'
  ipv6Address?: string;        // e.g. '2001:db8:acad:1::1/64'
  macAddress: string;          // e.g. '0011.2233.4455'
  status: PortStatus;
  speed?: string;              // '1000Mb/s', '100Mb/s'
  duplex?: 'auto' | 'full' | 'half';
  description?: string;
  isShutdown: boolean;

  // Switchport properties
  switchportMode?: SwitchPortMode;
  accessVlan?: number;         // default 1
  trunkAllowedVlans?: number[]; // default [1..4094]
  nativeVlan?: number;         // default 1
  portSecurity?: {
    enabled: boolean;
    maxMacs: number;
    violation: 'protect' | 'restrict' | 'shutdown';
    stickyMacs: string[];
  };

  // Router subinterface properties (e.g. Gi0/0.10)
  isSubinterface?: boolean;
  parentInterface?: string;
  dot1qVlan?: number;

  // NAT properties
  natType?: 'inside' | 'outside';

  // Serial WAN (NIM-2T) properties
  clockRate?: number;          // e.g. 64000, 128000, 2000000
  isDce?: boolean;
  encapsulation?: 'hdlc' | 'ppp' | 'dot1Q';

  // DHCP Client properties
  isDhcpClient?: boolean;
  dhcpLease?: {
    assignedIp: string;
    subnetMask: string;
    defaultGateway: string;
    dnsServer?: string;
    leaseTime?: number;
    serverIp?: string;
  };

  // Connected topology peer tracking
  connectedDeviceId?: string;
  connectedPort?: string;

  // Cisco Discovery Protocol (CDP) per interface
  cdpEnabled?: boolean;

  // Spanning Tree Protocol (STP) per interface
  stpPortFast?: boolean;
  stpBpduGuard?: boolean;
  stpBpduFilter?: boolean;
  stpRootGuard?: boolean;
  stpCost?: number;
  stpPortPriority?: number;
  stpState?: 'disabled' | 'blocking' | 'listening' | 'learning' | 'forwarding';
  stpRole?: 'Root' | 'Desg' | 'Altn' | 'Back' | 'Disa';

  // EtherChannel / Link Aggregation per interface
  channelGroup?: number;
  channelMode?: 'active' | 'passive' | 'desirable' | 'auto' | 'on';
  channelProtocol?: 'LACP' | 'PAgP' | 'NONE';

  // Dynamic Trunking Protocol (DTP) per interface
  dtpMode?: 'access' | 'trunk' | 'dynamic-auto' | 'dynamic-desirable';
  dtpNoNegotiate?: boolean;
}

export interface StpPortStatus {
  portName: string;
  role: 'Root' | 'Desg' | 'Altn' | 'Back' | 'Disa';
  status: 'FWD' | 'BLK' | 'LRN' | 'LIS' | 'DSB';
  cost: number;
  priority: number;
  portNumber: number;
  type: string;
}

export interface EtherChannelBundle {
  groupId: number;
  protocol: 'LACP' | 'PAgP' | '-';
  ports: string[];
  status: 'SU' | 'SD' | 'RU' | 'RD';
}

export interface VtpConfig {
  domain: string;
  mode: 'server' | 'client' | 'transparent' | 'off';
  version: number;
}

export interface DevicePosition {
  x: number;
  y: number;
}

export interface RouteEntry {
  network: string;             // '192.168.2.0'
  mask: string;                // '255.255.255.0'
  cidr: number;                // 24
  nextHop?: string;            // '10.0.0.2'
  exitInterface?: string;      // 'GigabitEthernet0/0'
  protocol: 'C' | 'S' | 'O' | 'D' | 'R' | 'L'; // Connected, Static, OSPF, EIGRP, RIP, Local
  adminDistance: number;       // C=0, S=1, O=110
  metric: number;
}

export interface VlanInfo {
  id: number;
  name: string;
  status: 'active' | 'suspended';
}

export interface MacTableEntry {
  vlan: number;
  macAddress: string;
  type: 'DYNAMIC' | 'STATIC';
  port: string;
}

export interface ArpEntry {
  protocol?: string;         // 'Internet'
  ipAddress: string;
  age?: number | '-';        // Age in minutes, or '-' for local/static
  macAddress: string;
  type?: 'ARPA' | 'dynamic' | 'static';
  interfaceName: string;
}

export interface OspfConfig {
  enabled: boolean;
  processId: number;
  routerId?: string;
  networks: Array<{
    network: string;
    wildcard: string;
    area: number;
  }>;
  passiveInterfaces: string[];
}

export interface AclRule {
  number: number;              // 1-99 Standard, 100-199 Extended
  action: 'permit' | 'deny';
  protocol?: 'ip' | 'icmp' | 'tcp' | 'udp';
  sourceIp: string;            // 'any', 'host 1.2.3.4', or '192.168.1.0'
  sourceWildcard?: string;     // '0.0.0.255'
  destIp?: string;
  destWildcard?: string;
  destPort?: number | string;  // e.g. 80, 22, 23
}

export interface DhcpPool {
  name: string;
  network: string;
  mask: string;
  defaultRouter?: string;
  dnsServer?: string;
  domainName?: string;
  leaseDays?: number;
  excludedAddresses?: string[];
}

export interface NatRule {
  type: 'static' | 'dynamic' | 'overload';
  insideLocal?: string;
  insideGlobal?: string;
  aclNumber?: number;
  interfaceName?: string;
}

export interface PhysicalLink {
  id: string;
  sourceDeviceId: string;
  sourcePort: string;
  targetDeviceId: string;
  targetPort: string;
  cableType: CableType;
  color?: string;
}

export interface EthernetFrame {
  sourceMac: string;
  destMac: string;
  vlanTag?: number;
  payload: IpPacket;
}

export interface IpPacket {
  sourceIp: string;
  destIp: string;
  protocol: 'ICMP' | 'TCP' | 'UDP' | 'OSPF';
  ttl: number;
  data: any;
}

export interface SimulationEvent {
  id: string;
  step: number;
  currentDeviceId: string;
  fromPort?: string;
  toPort?: string;
  packet: IpPacket;
  frame?: EthernetFrame;
  status: 'transmitting' | 'received' | 'dropped' | 'processed';
  explanation: string;
  inLayers?: {
    layer2?: { srcMac: string; dstMac: string; vlan?: number };
    layer3?: { srcIp: string; dstIp: string; ttl: number; protocol: string };
    layer4?: { type: string; info: string };
  };
  outLayers?: {
    layer2?: { srcMac: string; dstMac: string; vlan?: number };
    layer3?: { srcIp: string; dstIp: string; ttl: number; protocol: string };
    layer4?: { type: string; info: string };
  };
}
