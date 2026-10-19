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

  // First Hop Redundancy Protocol (FHRP) per interface
  hsrp?: {
    group: number;
    virtualIp: string;
    priority: number;
    preempt: boolean;
    version: 1 | 2;
    virtualMac?: string;
    timers?: { hello: number; hold: number };
    state?: 'Active' | 'Standby' | 'Listen' | 'Speak' | 'Init';
  };
  vrrp?: {
    group: number;
    virtualIp: string;
    priority: number;
    preempt: boolean;
    version?: number;
    virtualMac?: string;
    advertisementInterval?: number;
    state?: 'Master' | 'Backup' | 'Init' | 'Initialize';
  };

  // Policy-Based Routing (PBR) per interface
  ipPolicyRouteMap?: string;

  // Virtual Routing and Forwarding (VRF-Lite) per interface
  vrf?: string;

  // Multiprotocol Label Switching (MPLS) per interface
  mplsEnabled?: boolean;

  // GRE Tunnel, IPsec & DMVPN/NHRP per interface
  tunnelSource?: string;
  tunnelDestination?: string;
  tunnelMode?: 'gre ip' | 'gre multipoint' | 'ipsec ipv4' | string;
  tunnelProtectionProfile?: string;
  nhrpNetworkId?: number;
  nhrpMaps?: { protocolIp?: string; nbmaIp: string; multicast?: boolean }[];
  nhrpNhsIp?: string;
  nhrpNhsNbma?: string;

  // Zone-Based Policy Firewall (ZBFW) per interface
  zoneMemberSecurity?: string;
}

// ==================== TAHAP 6: SECURITY & VPN SERVICES ====================

export interface CryptoIsakmpPolicy {
  priority: number;
  encryption?: 'aes' | 'aes 256' | '3des' | 'des' | string;
  hash?: 'sha' | 'sha256' | 'md5' | string;
  authentication?: 'pre-share' | string;
  group?: 2 | 5 | 14 | number;
  lifetime?: number;
}

export interface CryptoIsakmpKey {
  key: string;
  address: string;
}

export interface CryptoTransformSet {
  name: string;
  transforms: string[];
  espCipher?: string;
  espAuth?: string;
}

export interface CryptoIpsecProfile {
  name: string;
  transformSet?: string;
}

export interface CryptoSession {
  peerIp: string;
  interfaceName: string;
  status?: 'UP-ACTIVE' | 'DOWN' | string;
  ikeState: 'QM_IDLE' | 'MM_ACTIVE' | string;
  ikeSaState?: 'QM_IDLE' | 'MM_ACTIVE';
  ipsecState: 'ACTIVE' | 'DOWN' | string;
  inboundSpi: string;
  outboundSpi: string;
  transform: string;
  pktsEncrypted: number;
  pktsDecrypted: number;
  ipsecInPkts?: number;
  ipsecOutPkts?: number;
  profile?: string;
}

export interface NhrpMappingEntry {
  protocolIp: string;
  nbmaIp: string;
  type: 'static' | 'dynamic';
  flags?: string;
  flag?: 'unique' | 'router' | 'used';
  tunnelInterface?: string;
  networkId?: number;
}

export interface SecurityZone {
  name: string;
  interfaces: string[];
}

export interface ClassMapInspectMatch {
  type: 'protocol' | 'access-group';
  protocol?: string;
  accessGroup?: number;
}

export interface ClassMapInspect {
  name: string;
  matchType: 'match-any' | 'match-all';
  matchAcl?: string;
  matchProtocols?: string[];
  matches: ClassMapInspectMatch[];
}

export interface PolicyMapInspectClass {
  className: string;
  action: 'inspect' | 'pass' | 'drop';
}

export interface PolicyMapInspect {
  name: string;
  classes: PolicyMapInspectClass[];
}

export interface ZonePair {
  name: string;
  sourceZone: string;
  destinationZone: string;
  servicePolicy?: string;
}

export interface ZbfwSession {
  id: string;
  zonePair?: string;
  srcZone: string;
  dstZone: string;
  sourceIp?: string;
  srcIp: string;
  destIp?: string;
  dstIp: string;
  protocol: string;
  srcPort?: number;
  dstPort?: number;
  state: 'ESTABLISHED' | 'OPEN' | 'established' | string;
  expiresAt: number;
  lastActivity?: number;
}

export interface CoppClass {
  name?: string;
  className: string;
  matchAcl?: string;
  matchProtocols?: string[];
  policeRateBps?: number;
  rateLimitBps?: number;
  conformAction?: 'transmit';
  exceedAction?: 'drop';
}

export interface CoppPolicy {
  name: string;
  classes: CoppClass[];
}

export interface CoppState {
  policyMapName?: string;
  transmittedPkts: number;
  droppedPkts: number;
}

export interface VrfRouteTarget {
  type: 'import' | 'export' | 'both';
  rt: string; // e.g. "65000:100" or "10.0.0.1:100"
}

export interface VrfConfig {
  name: string;
  description?: string;
  rd?: string; // Route Distinguisher, e.g. "65000:100" or "10.0.0.1:100"
  routeTargets: VrfRouteTarget[];
  interfaces: string[];
  routingTable: RouteEntry[];
  arpTable: Map<string, string>; // IP -> MAC
}

export interface MplsLabelEntry {
  inLabel: number;
  prefix: string;
  outLabel: number | 'Pop Label' | 'Untagged';
  nextHop?: string;
  outInterface: string;
}

export interface MplsLdpNeighbor {
  peerId: string; // e.g. "192.168.12.2:0"
  localId: string; // e.g. "192.168.12.1:0"
  tcpConnection: string;
  state: 'Oper' | 'Non-Oper';
  interfaceName: string;
  peerIp: string;
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
  protocol: 'C' | 'S' | 'O' | 'O IA' | 'O E1' | 'O E2' | 'D' | 'D EX' | 'B' | 'R' | 'L'; // Connected, Static, OSPF Intra, OSPF Inter-Area, OSPF External 1/2, EIGRP, EIGRP External, BGP, RIP, Local
  adminDistance: number;       // C=0, S=1, O=110, D=90/170, B=20/200
  metric: number;
  tag?: number;
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
  areaRanges?: Array<{
    area: number;
    network: string;
    mask: string;
  }>;
  passiveInterfaces: string[];
  redistributions?: RedistributionConfig[];
}

export interface RedistributionConfig {
  protocol: 'ospf' | 'eigrp' | 'bgp' | 'static' | 'connected';
  asOrProcessId?: number;
  metric?: number;
  metricType?: '1' | '2' | 'type-1' | 'type-2';
  subnets?: boolean;
  bandwidth?: number;
  delay?: number;
  reliability?: number;
  load?: number;
  mtu?: number;
  routeMap?: string;
}

export interface EigrpConfig {
  enabled: boolean;
  asNumber: number;
  routerId?: string;
  networks: Array<{
    network: string;
    wildcard?: string;
  }>;
  passiveInterfaces: string[];
  autoSummary?: boolean;
  redistributions?: RedistributionConfig[];
}

export interface BgpNeighbor {
  ipAddress: string;
  ip?: string;
  remoteAs: number;
  description?: string;
  updateSource?: string;
  shutdown?: boolean;
  state?: 'Idle' | 'Connect' | 'Active' | 'OpenSent' | 'OpenConfirm' | 'Established';
}

export interface BgpConfig {
  enabled: boolean;
  asNumber: number;
  routerId?: string;
  neighbors: Map<string, BgpNeighbor>;
  networks: Array<{
    network: string;
    mask?: string;
  }>;
  redistributions?: RedistributionConfig[];
}

export interface RouteMapClause {
  sequence: number;
  action: 'permit' | 'deny';
  matchAcl?: number;
  matchPrefixList?: string;
  matchTag?: number;
  matchInterface?: string;
  setMetric?: number;
  setMetricType?: 'type-1' | 'type-2';
  setTag?: number;
  setIpNextHop?: string;
  setIpNextHopTrack?: {
    nextHop: string;
    trackId: number;
  };
}

export interface RouteMap {
  name: string;
  clauses: RouteMapClause[];
}

export interface IpPrefixListEntry {
  seq: number;
  action: 'permit' | 'deny';
  prefix: string; // e.g. "192.168.0.0/16"
  ge?: number;
  le?: number;
}

export interface IpPrefixList {
  name: string;
  entries: IpPrefixListEntry[];
}

export interface IpSlaConfig {
  id: number;
  type: 'icmp-echo';
  targetIp: string;
  frequency?: number;
  state: 'OK' | 'Timeout' | 'Down';
  rtt?: number;
}

export interface TrackObject {
  id: number;
  slaId: number;
  state: 'UP' | 'DOWN';
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
