import { Device } from './Device';
import { DevicePosition, RouteEntry, InterfaceConfig, OspfConfig, EigrpConfig, BgpConfig, AclRule, DhcpPool, NatRule, RouteMap, IpPrefixList, IpSlaConfig, TrackObject, VrfConfig, MplsLabelEntry, CryptoIsakmpPolicy, CryptoIsakmpKey, CryptoTransformSet, CryptoIpsecProfile, CryptoSession, NhrpMappingEntry, SecurityZone, ZonePair, ClassMapInspect, PolicyMapInspect, ZbfwSession, CoppPolicy, CoppState } from '../../types/network';
import { CliContext, CliExecutionResult } from '../../types/cli';
import { SubnetUtils } from '../network/Subnet';

export class Router extends Device {
  routingTable: RouteEntry[] = [];
  ospfConfig?: OspfConfig;
  eigrpConfig?: EigrpConfig;
  bgpConfig?: BgpConfig;
  dhcpPools: Map<string, DhcpPool> = new Map();
  dhcpExcludedAddresses: string[] = [];
  accessLists: Map<number, AclRule[]> = new Map();
  natRules: NatRule[] = [];
  routeMaps: Map<string, RouteMap> = new Map();
  prefixLists: Map<string, IpPrefixList> = new Map();
  ipSlas: Map<number, IpSlaConfig> = new Map();
  trackObjects: Map<number, TrackObject> = new Map();
  vrfInstances: Map<string, VrfConfig> = new Map();
  mplsEnabled: boolean = false;
  mplsLdpRouterId?: string;
  mplsInterfaces: Set<string> = new Set();
  lfib: MplsLabelEntry[] = [];

  // GRE / IPsec / DMVPN
  cryptoPolicies: Map<number, CryptoIsakmpPolicy> = new Map();
  cryptoKeys: CryptoIsakmpKey[] = [];
  cryptoTransformSets: Map<string, CryptoTransformSet> = new Map();
  cryptoProfiles: Map<string, CryptoIpsecProfile> = new Map();
  cryptoSessions: Map<string, CryptoSession> = new Map();
  nhrpCache: NhrpMappingEntry[] = [];

  // Zone-Based Policy Firewall (ZBFW)
  securityZones: Map<string, SecurityZone> = new Map();
  zonePairs: Map<string, ZonePair> = new Map();
  inspectClassMaps: Map<string, ClassMapInspect> = new Map();
  inspectPolicyMaps: Map<string, PolicyMapInspect> = new Map();
  zbfwSessions: ZbfwSession[] = [];

  // Control Plane Policing (CoPP)
  coppPolicy?: CoppPolicy;
  coppState: CoppState = { transmittedPkts: 0, droppedPkts: 0 };

  constructor(id: string, hostname: string, position: DevicePosition) {
    super(id, hostname, 'router', position);

    this.model = 'C8200L-1N-4T';
    this.osVersion = '17.15.4c';

    // Catalyst C8200L-1N-4T: 4x Onboard GigabitEthernet ports
    const gi000 = {
      name: 'GigabitEthernet0/0/0',
      shortName: 'Gi0/0/0',
      macAddress: `0001.c4${Math.floor(Math.random() * 89 + 10)}.${Math.floor(Math.random() * 8999 + 1000)}`,
      status: 'down' as const,
      isShutdown: true,
      speed: '1000Mb/s',
      duplex: 'auto' as const
    };

    const gi001 = {
      name: 'GigabitEthernet0/0/1',
      shortName: 'Gi0/0/1',
      macAddress: `0001.c4${Math.floor(Math.random() * 89 + 10)}.${Math.floor(Math.random() * 8999 + 1000)}`,
      status: 'down' as const,
      isShutdown: true,
      speed: '1000Mb/s',
      duplex: 'auto' as const
    };

    const gi002 = {
      name: 'GigabitEthernet0/0/2',
      shortName: 'Gi0/0/2',
      macAddress: `0001.c4${Math.floor(Math.random() * 89 + 10)}.${Math.floor(Math.random() * 8999 + 1000)}`,
      status: 'down' as const,
      isShutdown: true,
      speed: '1000Mb/s',
      duplex: 'auto' as const
    };

    const gi003 = {
      name: 'GigabitEthernet0/0/3',
      shortName: 'Gi0/0/3',
      macAddress: `0001.c4${Math.floor(Math.random() * 89 + 10)}.${Math.floor(Math.random() * 8999 + 1000)}`,
      status: 'down' as const,
      isShutdown: true,
      speed: '1000Mb/s',
      duplex: 'auto' as const
    };

    // NIM-2T: 2-Port Serial WAN Interface Module
    const se010 = {
      name: 'Serial0/1/0',
      shortName: 'Se0/1/0',
      macAddress: `0001.c4${Math.floor(Math.random() * 89 + 10)}.${Math.floor(Math.random() * 8999 + 1000)}`,
      status: 'down' as const,
      isShutdown: true,
      speed: '1544Kb/s',
      description: 'NIM-2T WAN Serial Port 0'
    };

    const se011 = {
      name: 'Serial0/1/1',
      shortName: 'Se0/1/1',
      macAddress: `0001.c4${Math.floor(Math.random() * 89 + 10)}.${Math.floor(Math.random() * 8999 + 1000)}`,
      status: 'down' as const,
      isShutdown: true,
      speed: '1544Kb/s',
      description: 'NIM-2T WAN Serial Port 1'
    };

    this.addInterface(gi000);
    this.addInterface(gi001);
    this.addInterface(gi002);
    this.addInterface(gi003);
    this.addInterface(se010);
    this.addInterface(se011);

    // Map compatibility aliases for CCNA 2-tuple notation (Gi0/0, Gi0/1, Gi0/2, Se0/0/0)
    this.interfaces.set('GigabitEthernet0/0', gi000);
    this.interfaces.set('GigabitEthernet0/1', gi001);
    this.interfaces.set('GigabitEthernet0/2', gi002);
    this.interfaces.set('Serial0/0/0', se010);
  }

  getOrCreateTunnel(nameOrId: string | number): InterfaceConfig {
    const idStr = typeof nameOrId === 'number' ? nameOrId.toString() : nameOrId.toString().replace(/^[^\d]*/, '');
    const fullName = `Tunnel${idStr}`;
    const shortName = `Tu${idStr}`;
    let iface = this.interfaces.get(fullName);
    if (!iface) {
      iface = {
        name: fullName,
        shortName: shortName,
        macAddress: `0001.c4${Math.floor(Math.random() * 89 + 10)}.${Math.floor(Math.random() * 8999 + 1000)}`,
        status: 'up',
        isShutdown: false,
        speed: '1000Mb/s',
        tunnelMode: 'gre ip'
      };
      this.addInterface(iface);
      this.interfaces.set(shortName, iface);
    }
    return iface;
  }

  override getInterface(name: string): InterfaceConfig | undefined {
    if (!name) return undefined;
    const direct = super.getInterface(name);
    if (direct) return direct;

    const match = name.match(/^(?:tunnel|tu)\s*(\d+)$/i);
    if (match) {
      return this.getOrCreateTunnel(match[1]);
    }
    return undefined;
  }

  updateConnectedRoutes(): void {
    // Filter out previous connected and local routes from global table
    this.routingTable = this.routingTable.filter(r => r.protocol !== 'C' && r.protocol !== 'L');

    // Also clear previous connected and local routes from each VRF table
    for (const vrf of this.vrfInstances.values()) {
      vrf.routingTable = vrf.routingTable.filter(r => r.protocol !== 'C' && r.protocol !== 'L');
    }

    const uniqueIfaces = Array.from(new Set(this.interfaces.values()));
    for (const iface of uniqueIfaces) {
      if (iface.status === 'up' && !iface.isShutdown && iface.ipAddress && iface.subnetMask) {
        const netAddr = SubnetUtils.getNetworkAddress(iface.ipAddress, iface.subnetMask);
        const cidr = SubnetUtils.maskToCidr(iface.subnetMask);

        const connRoute: RouteEntry = {
          network: netAddr,
          mask: iface.subnetMask,
          cidr,
          exitInterface: iface.name,
          protocol: 'C',
          adminDistance: 0,
          metric: 0
        };

        const localRoute: RouteEntry = {
          network: iface.ipAddress,
          mask: '255.255.255.255',
          cidr: 32,
          exitInterface: iface.name,
          protocol: 'L',
          adminDistance: 0,
          metric: 0
        };

        if (iface.vrf) {
          let vrf = this.vrfInstances.get(iface.vrf);
          if (!vrf) {
            vrf = {
              name: iface.vrf,
              routeTargets: [],
              interfaces: [iface.name],
              routingTable: [],
              arpTable: new Map()
            };
            this.vrfInstances.set(iface.vrf, vrf);
          } else if (!vrf.interfaces.includes(iface.name)) {
            vrf.interfaces.push(iface.name);
          }
          vrf.routingTable.push(connRoute, localRoute);
        } else {
          this.routingTable.push(connRoute, localRoute);
        }
      }
    }
  }

  lookupRoute(destIp: string, vrfName?: string): RouteEntry | null {
    let targetTable = this.routingTable;
    if (vrfName && this.vrfInstances.has(vrfName)) {
      targetTable = this.vrfInstances.get(vrfName)!.routingTable;
    }

    let bestMatch: RouteEntry | null = null;
    let longestPrefix = -1;

    for (const route of targetTable) {
      if (route.network === '0.0.0.0' && route.mask === '0.0.0.0') {
        // Default route match
        if (longestPrefix < 0) {
          bestMatch = route;
          longestPrefix = 0;
        }
      } else if (SubnetUtils.matchesNetwork(destIp, route.network, route.mask, false)) {
        if (route.cidr > longestPrefix) {
          longestPrefix = route.cidr;
          bestMatch = route;
        } else if (route.cidr === longestPrefix && bestMatch) {
          if (route.adminDistance < bestMatch.adminDistance) {
            bestMatch = route;
          }
        }
      }
    }

    return bestMatch;
  }

  executeCli(commandLine: string, context: CliContext): CliExecutionResult {
    // Handled in IOSCommands engine
    return { output: '' };
  }

  getRunningConfig(): string {
    const lines: string[] = [
      'Building configuration...',
      'Current configuration : 1824 bytes',
      '!',
      `version 15.4`,
      `service timestamps debug datetime msec`,
      `service timestamps log datetime msec`,
      this.servicePasswordEncryption ? 'service password-encryption' : 'no service password-encryption',
      '!',
      `hostname ${this.hostname}`,
      '!'
    ];

    if (this.bannerMotd) {
      lines.push(`banner motd ^C${this.bannerMotd}^C`, '!');
    }

    if (this.enableSecret) {
      lines.push(`enable secret 5 ${this.enableSecret}`, '!');
    } else if (this.enablePassword) {
      lines.push(`enable password ${this.enablePassword}`, '!');
    }

    if (this.ipRouting) {
      lines.push('ip routing', '!');
    }

    if (!this.cdpEnabled) {
      lines.push('no cdp run', '!');
    } else {
      if (this.cdpTimer !== 60) lines.push(`cdp timer ${this.cdpTimer}`, '!');
      if (this.cdpHoldtime !== 180) lines.push(`cdp holdtime ${this.cdpHoldtime}`, '!');
    }

    // DHCP Excluded Addresses
    for (const exc of this.dhcpExcludedAddresses) {
      lines.push(`ip dhcp excluded-address ${exc}`);
    }
    if (this.dhcpExcludedAddresses.length > 0) lines.push('!');

    // DHCP Pools
    for (const pool of this.dhcpPools.values()) {
      lines.push(`ip dhcp pool ${pool.name}`);
      if (pool.network && pool.mask) lines.push(` network ${pool.network} ${pool.mask}`);
      if (pool.defaultRouter) lines.push(` default-router ${pool.defaultRouter}`);
      if (pool.dnsServer) lines.push(` dns-server ${pool.dnsServer}`);
      if (pool.domainName) lines.push(` domain-name ${pool.domainName}`);
      if (pool.leaseDays) lines.push(` lease ${pool.leaseDays}`);
      lines.push('!');
    }

    // VRF Definitions
    for (const vrf of this.vrfInstances.values()) {
      lines.push(`vrf definition ${vrf.name}`);
      if (vrf.rd) lines.push(` rd ${vrf.rd}`);
      if (vrf.description) lines.push(` description ${vrf.description}`);
      if (vrf.routeTargets.length > 0) {
        lines.push(' address-family ipv4');
        for (const rt of vrf.routeTargets) {
          lines.push(`  route-target ${rt.type} ${rt.rt}`);
        }
        lines.push(' exit-address-family');
      }
      lines.push('!');
    }

    // Interfaces
    const uniqueIfaces = Array.from(new Set(this.interfaces.values()));
    for (const iface of uniqueIfaces) {
      lines.push(`interface ${iface.name}`);
      if (iface.description) lines.push(` description ${iface.description}`);
      if (iface.vrf) lines.push(` vrf forwarding ${iface.vrf}`);
      if (iface.mplsEnabled) lines.push(` mpls ip`);
      if (iface.isSubinterface && iface.dot1qVlan) {
        lines.push(` encapsulation dot1Q ${iface.dot1qVlan}`);
      }
      if (iface.encapsulation && iface.encapsulation !== 'dot1Q') {
        lines.push(` encapsulation ${iface.encapsulation}`);
      }
      if (iface.clockRate) {
        lines.push(` clock rate ${iface.clockRate}`);
      }
      if (iface.isDhcpClient) {
        lines.push(` ip address dhcp`);
      } else if (iface.ipAddress && iface.subnetMask) {
        lines.push(` ip address ${iface.ipAddress} ${iface.subnetMask}`);
      } else {
        lines.push(` no ip address`);
      }
      if (iface.hsrp) {
        lines.push(` standby ${iface.hsrp.group} ip ${iface.hsrp.virtualIp}`);
        if (iface.hsrp.priority !== 100) lines.push(` standby ${iface.hsrp.group} priority ${iface.hsrp.priority}`);
        if (iface.hsrp.preempt) lines.push(` standby ${iface.hsrp.group} preempt`);
        if (iface.hsrp.version === 2) lines.push(` standby version 2`);
      }
      if (iface.vrrp) {
        lines.push(` vrrp ${iface.vrrp.group} ip ${iface.vrrp.virtualIp}`);
        if (iface.vrrp.priority !== 100) lines.push(` vrrp ${iface.vrrp.group} priority ${iface.vrrp.priority}`);
        if (iface.vrrp.preempt) lines.push(` vrrp ${iface.vrrp.group} preempt`);
      }
      if (iface.ipPolicyRouteMap) {
        lines.push(` ip policy route-map ${iface.ipPolicyRouteMap}`);
      }
      if (iface.zoneMemberSecurity) {
        lines.push(` zone-member security ${iface.zoneMemberSecurity}`);
      }
      if (iface.tunnelSource) {
        lines.push(` tunnel source ${iface.tunnelSource}`);
      }
      if (iface.tunnelDestination) {
        lines.push(` tunnel destination ${iface.tunnelDestination}`);
      }
      if (iface.tunnelMode) {
        lines.push(` tunnel mode ${iface.tunnelMode}`);
      }
      if (iface.tunnelProtectionProfile) {
        lines.push(` tunnel protection ipsec profile ${iface.tunnelProtectionProfile}`);
      }
      if (iface.nhrpNetworkId) {
        lines.push(` ip nhrp network-id ${iface.nhrpNetworkId}`);
      }
      if (iface.nhrpMaps && iface.nhrpMaps.length > 0) {
        for (const m of iface.nhrpMaps) {
          if (m.multicast) {
            lines.push(` ip nhrp map multicast ${m.nbmaIp}`);
          } else if (m.protocolIp) {
            lines.push(` ip nhrp map ${m.protocolIp} ${m.nbmaIp}`);
          }
        }
      }
      if (iface.nhrpNhsIp) {
        lines.push(` ip nhrp nhs ${iface.nhrpNhsIp}${iface.nhrpNhsNbma ? ' nbma ' + iface.nhrpNhsNbma : ''}`);
      }
      if (iface.natType) {
        lines.push(` ip nat ${iface.natType}`);
      }
      if (iface.duplex) lines.push(` duplex ${iface.duplex}`);
      if (iface.speed) lines.push(` speed ${iface.speed}`);
      if (iface.cdpEnabled === false) {
        lines.push(` no cdp enable`);
      }
      if (iface.isShutdown) {
        lines.push(` shutdown`);
      } else {
        lines.push(` no shutdown`);
      }
      lines.push('!');
    }

    // OSPF
    if (this.ospfConfig && this.ospfConfig.enabled) {
      lines.push(`router ospf ${this.ospfConfig.processId}`);
      if (this.ospfConfig.routerId) lines.push(` router-id ${this.ospfConfig.routerId}`);
      for (const net of this.ospfConfig.networks) {
        lines.push(` network ${net.network} ${net.wildcard} area ${net.area}`);
      }
      if (this.ospfConfig.areaRanges) {
        for (const ar of this.ospfConfig.areaRanges) {
          lines.push(` area ${ar.area} range ${ar.network} ${ar.mask}`);
        }
      }
      for (const p of this.ospfConfig.passiveInterfaces) {
        lines.push(` passive-interface ${p}`);
      }
      if (this.ospfConfig.redistributions) {
        for (const r of this.ospfConfig.redistributions) {
          let cmd = ` redistribute ${r.protocol}`;
          if (r.asOrProcessId) cmd += ` ${r.asOrProcessId}`;
          if (r.metric !== undefined) cmd += ` metric ${r.metric}`;
          if (r.metricType) cmd += ` metric-type ${r.metricType}`;
          if (r.subnets) cmd += ` subnets`;
          if (r.routeMap) cmd += ` route-map ${r.routeMap}`;
          lines.push(cmd);
        }
      }
      lines.push('!');
    }

    // EIGRP
    if (this.eigrpConfig && this.eigrpConfig.enabled) {
      lines.push(`router eigrp ${this.eigrpConfig.asNumber}`);
      if (this.eigrpConfig.routerId) lines.push(` eigrp router-id ${this.eigrpConfig.routerId}`);
      for (const net of this.eigrpConfig.networks) {
        lines.push(` network ${net.network}${net.wildcard ? ' ' + net.wildcard : ''}`);
      }
      for (const p of this.eigrpConfig.passiveInterfaces) {
        lines.push(` passive-interface ${p}`);
      }
      if (this.eigrpConfig.redistributions) {
        for (const r of this.eigrpConfig.redistributions) {
          let cmd = ` redistribute ${r.protocol}`;
          if (r.asOrProcessId) cmd += ` ${r.asOrProcessId}`;
          if (r.bandwidth && r.delay) {
            cmd += ` metric ${r.bandwidth} ${r.delay} ${r.reliability || 255} ${r.load || 1} ${r.mtu || 1500}`;
          } else if (r.metric) {
            cmd += ` metric ${r.metric}`;
          }
          if (r.routeMap) cmd += ` route-map ${r.routeMap}`;
          lines.push(cmd);
        }
      }
      lines.push('!');
    }

    // BGP
    if (this.bgpConfig && this.bgpConfig.enabled) {
      lines.push(`router bgp ${this.bgpConfig.asNumber}`);
      if (this.bgpConfig.routerId) lines.push(` bgp router-id ${this.bgpConfig.routerId}`);
      for (const n of this.bgpConfig.neighbors.values()) {
        lines.push(` neighbor ${n.ipAddress} remote-as ${n.remoteAs}`);
        if (n.updateSource) lines.push(` neighbor ${n.ipAddress} update-source ${n.updateSource}`);
        if (n.description) lines.push(` neighbor ${n.ipAddress} description ${n.description}`);
      }
      for (const net of this.bgpConfig.networks) {
        lines.push(` network ${net.network}${net.mask ? ' mask ' + net.mask : ''}`);
      }
      if (this.bgpConfig.redistributions) {
        for (const r of this.bgpConfig.redistributions) {
          let cmd = ` redistribute ${r.protocol}`;
          if (r.asOrProcessId) cmd += ` ${r.asOrProcessId}`;
          if (r.metric !== undefined) cmd += ` metric ${r.metric}`;
          if (r.routeMap) cmd += ` route-map ${r.routeMap}`;
          lines.push(cmd);
        }
      }
      lines.push('!');
    }

    // IP Prefix Lists
    for (const pl of this.prefixLists.values()) {
      for (const e of pl.entries) {
        let cmd = `ip prefix-list ${pl.name} seq ${e.seq} ${e.action} ${e.prefix}`;
        if (e.ge) cmd += ` ge ${e.ge}`;
        if (e.le) cmd += ` le ${e.le}`;
        lines.push(cmd);
      }
    }

    // Route Maps
    for (const rm of this.routeMaps.values()) {
      for (const c of rm.clauses) {
        lines.push(`route-map ${rm.name} ${c.action} ${c.sequence}`);
        if (c.matchAcl) lines.push(` match ip address ${c.matchAcl}`);
        if (c.matchPrefixList) lines.push(` match ip address prefix-list ${c.matchPrefixList}`);
        if (c.matchTag) lines.push(` match tag ${c.matchTag}`);
        if (c.matchInterface) lines.push(` match interface ${c.matchInterface}`);
        if (c.setMetric !== undefined) lines.push(` set metric ${c.setMetric}`);
        if (c.setMetricType) lines.push(` set metric-type ${c.setMetricType}`);
        if (c.setTag !== undefined) lines.push(` set tag ${c.setTag}`);
        if (c.setIpNextHop) lines.push(` set ip next-hop ${c.setIpNextHop}`);
        if (c.setIpNextHopTrack) lines.push(` set ip next-hop verify-availability ${c.setIpNextHopTrack.nextHop} 1 track ${c.setIpNextHopTrack.trackId}`);
        lines.push('!');
      }
    }

    // IP SLA & Track
    for (const sla of this.ipSlas.values()) {
      lines.push(`ip sla ${sla.id}`);
      lines.push(` icmp-echo ${sla.targetIp}`);
      if (sla.frequency) lines.push(` frequency ${sla.frequency}`);
      lines.push('!');
    }
    for (const trk of this.trackObjects.values()) {
      lines.push(`track ${trk.id} ip sla ${trk.slaId} state`);
    }

    // Static routes
    for (const route of this.routingTable) {
      if (route.protocol === 'S') {
        const next = route.nextHop || route.exitInterface;
        lines.push(`ip route ${route.network} ${route.mask} ${next}`);
      }
    }

    // Static routes per VRF
    for (const vrf of this.vrfInstances.values()) {
      for (const route of vrf.routingTable) {
        if (route.protocol === 'S') {
          const next = route.nextHop || route.exitInterface;
          lines.push(`ip route vrf ${vrf.name} ${route.network} ${route.mask} ${next}`);
        }
      }
    }

    // Static ARP entries
    for (const entry of this.arpTable) {
      if (entry.type === 'static' || entry.age === '-') {
        lines.push(`arp ${entry.ipAddress} ${entry.macAddress} ARPA`);
      }
    }

    // Access lists
    for (const [num, rules] of this.accessLists.entries()) {
      for (const r of rules) {
        if (num <= 99) {
          lines.push(`access-list ${num} ${r.action} ${r.sourceIp} ${r.sourceWildcard || ''}`.trim());
        } else {
          lines.push(`access-list ${num} ${r.action} ${r.protocol || 'ip'} ${r.sourceIp} ${r.sourceWildcard || ''} ${r.destIp || ''} ${r.destWildcard || ''}`.trim());
        }
      }
    }

    // Security Zones
    for (const zone of this.securityZones.values()) {
      lines.push(`zone security ${zone.name}`);
      lines.push('!');
    }

    // Inspect Class Maps
    for (const cm of this.inspectClassMaps.values()) {
      lines.push(`class-map type inspect ${cm.matchType} ${cm.name}`);
      for (const m of cm.matches) {
        if (m.type === 'protocol') lines.push(` match protocol ${m.protocol}`);
        else if (m.type === 'access-group') lines.push(` match access-group ${m.accessGroup}`);
      }
      lines.push('!');
    }

    // Inspect Policy Maps
    for (const pm of this.inspectPolicyMaps.values()) {
      lines.push(`policy-map type inspect ${pm.name}`);
      for (const c of pm.classes) {
        lines.push(` class type inspect ${c.className}`);
        lines.push(`  ${c.action}`);
      }
      lines.push('!');
    }

    // Zone Pairs
    for (const zp of this.zonePairs.values()) {
      lines.push(`zone-pair security ${zp.name} source ${zp.sourceZone} destination ${zp.destinationZone}`);
      if (zp.servicePolicy) lines.push(` service-policy type inspect ${zp.servicePolicy}`);
      lines.push('!');
    }

    // Crypto ISAKMP Policies
    for (const p of this.cryptoPolicies.values()) {
      lines.push(`crypto isakmp policy ${p.priority}`);
      if (p.encryption) lines.push(` encr ${p.encryption}`);
      if (p.hash) lines.push(` hash ${p.hash}`);
      if (p.authentication) lines.push(` authentication ${p.authentication}`);
      if (p.group) lines.push(` group ${p.group}`);
      if (p.lifetime) lines.push(` lifetime ${p.lifetime}`);
      lines.push('!');
    }

    // Crypto ISAKMP Keys
    for (const k of this.cryptoKeys) {
      lines.push(`crypto isakmp key ${k.key} address ${k.address}`);
    }

    // Crypto Transform Sets
    for (const ts of this.cryptoTransformSets.values()) {
      lines.push(`crypto ipsec transform-set ${ts.name} ${ts.transforms.join(' ')}`);
    }

    // Crypto IPsec Profiles
    for (const prof of this.cryptoProfiles.values()) {
      lines.push(`crypto ipsec profile ${prof.name}`);
      if (prof.transformSet) lines.push(` set transform-set ${prof.transformSet}`);
      lines.push('!');
    }

    // Control Plane
    if (this.coppPolicy) {
      lines.push('control-plane');
      lines.push(` service-policy input ${this.coppPolicy.name}`);
      lines.push('!');
    }

    // Lines
    lines.push('line con 0');
    if (this.consolePassword) lines.push(` password ${this.consolePassword}`, ' login');
    lines.push('!');
    lines.push('line vty 0 4');
    if (this.vtyPassword) lines.push(` password ${this.vtyPassword}`, ' login');
    lines.push(' transport input ssh telnet');
    lines.push('!');
    lines.push('end');

    return lines.join('\n');
  }
}
