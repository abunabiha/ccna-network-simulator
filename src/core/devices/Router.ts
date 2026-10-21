import { Device } from './Device';
import { DevicePosition, RouteEntry, InterfaceConfig, OspfConfig, OspfV3Config, EigrpConfig, EigrpV6Config, BgpConfig, AclRule, NamedAcl, DhcpPool, NatRule, RouteMap, IpPrefixList, IpSlaConfig, TrackObject, VrfConfig, MplsLabelEntry, CryptoIsakmpPolicy, CryptoIsakmpKey, CryptoTransformSet, CryptoIpsecProfile, CryptoSession, NhrpMappingEntry, SecurityZone, ZonePair, ClassMapInspect, PolicyMapInspect, ZbfwSession, CoppPolicy, CoppState, EemApplet, EemHistoryEntry, MdtSubscription, NetconfSession, DhcpV6Pool, DhcpV6Binding, Ipv6NamedAcl, TimeRangeConfig } from '../../types/network';
import { CliContext, CliExecutionResult } from '../../types/cli';
import { SubnetUtils } from '../network/Subnet';

export class Router extends Device {
  routingTable: RouteEntry[] = [];
  ipv6RoutingTable: RouteEntry[] = [];
  ospfConfig?: OspfConfig;
  ospfv3Config?: OspfV3Config;
  ipv6UnicastRouting: boolean = false;
  eigrpConfig?: EigrpConfig;
  eigrpV6Config?: EigrpV6Config;
  bgpConfig?: BgpConfig;
  dhcpPools: Map<string, DhcpPool> = new Map();
  dhcpExcludedAddresses: string[] = [];
  dhcpv6Pools: Map<string, DhcpV6Pool> = new Map();
  dhcpv6Bindings: DhcpV6Binding[] = [];
  accessLists: Map<number, AclRule[]> = new Map();
  namedAccessLists: Map<string, NamedAcl> = new Map();
  ipv6AccessLists: Map<string, Ipv6NamedAcl> = new Map();
  timeRanges: Map<string, TimeRangeConfig> = new Map();
  vtyAccessClass?: { acl: string; direction: 'in' | 'out' };
  ipLocalPolicyRouteMap?: string;
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

  // Network Automation, Programmability & Telemetry (CCNP Tahap 7)
  restconfEnabled: boolean = false;
  netconfEnabled: boolean = false;
  eemApplets: Map<string, EemApplet> = new Map();
  eemHistory: EemHistoryEntry[] = [];
  mdtSubscriptions: Map<number, MdtSubscription> = new Map();
  netconfSessions: NetconfSession[] = [];

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
      if (vrf.addressFamilies && vrf.addressFamilies.length > 0) {
        for (const af of vrf.addressFamilies) {
          lines.push(` address-family ${af}`);
          if (af === 'ipv4' && vrf.routeTargets.length > 0) {
            for (const rt of vrf.routeTargets) {
              lines.push(`  route-target ${rt.type} ${rt.rt}`);
            }
          }
          lines.push(' exit-address-family');
        }
      } else if (vrf.routeTargets.length > 0) {
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
      if (iface.ipv6Address) {
        lines.push(` ipv6 address ${iface.ipv6Address}`);
      }
      if (iface.ipv6LinkLocal) {
        lines.push(` ipv6 address ${iface.ipv6LinkLocal} link-local`);
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
      if (iface.tunnelKey !== undefined) {
        lines.push(` tunnel key ${iface.tunnelKey}`);
      }
      if (iface.tunnelProtectionProfile) {
        lines.push(` tunnel protection ipsec profile ${iface.tunnelProtectionProfile}`);
      }
      if (iface.nhrpNetworkId) {
        if (iface.tunnelMode && iface.tunnelMode.includes('ipv6')) {
          lines.push(` ipv6 nhrp network-id ${iface.nhrpNetworkId}`);
        } else {
          lines.push(` ip nhrp network-id ${iface.nhrpNetworkId}`);
        }
      }
      if (iface.nhrpAuthentication) {
        if (iface.tunnelMode && iface.tunnelMode.includes('ipv6')) {
          lines.push(` ipv6 nhrp authentication ${iface.nhrpAuthentication}`);
        } else {
          lines.push(` ip nhrp authentication ${iface.nhrpAuthentication}`);
        }
      }
      if (iface.nhrpMulticastDynamic) {
        if (iface.tunnelMode && iface.tunnelMode.includes('ipv6')) {
          lines.push(` ipv6 nhrp map multicast dynamic`);
        } else {
          lines.push(` ip nhrp map multicast dynamic`);
        }
      }
      if (iface.nhrpRedirect) {
        if (iface.tunnelMode && iface.tunnelMode.includes('ipv6')) {
          lines.push(` ipv6 nhrp redirect`);
        } else {
          lines.push(` ip nhrp redirect`);
        }
      }
      if (iface.nhrpShortcut) {
        if (iface.tunnelMode && iface.tunnelMode.includes('ipv6')) {
          lines.push(` ipv6 nhrp shortcut`);
        } else {
          lines.push(` ip nhrp shortcut`);
        }
      }
      if (iface.nhrpIpv6Nhs) {
        lines.push(` ipv6 nhrp nhs ${iface.nhrpIpv6Nhs.tunnelIpv6} nbma ${iface.nhrpIpv6Nhs.nbmaIpv6}${iface.nhrpIpv6Nhs.multicast ? ' multicast' : ''}`);
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
      if (iface.ipMtu) lines.push(` ip mtu ${iface.ipMtu}`);
      if (iface.ipTcpAdjustMss) lines.push(` ip tcp adjust-mss ${iface.ipTcpAdjustMss}`);
      if (iface.ipv6Mtu) lines.push(` ipv6 mtu ${iface.ipv6Mtu}`);
      if (iface.ipv6TcpAdjustMss) lines.push(` ipv6 tcp adjust-mss ${iface.ipv6TcpAdjustMss}`);
      if (iface.ipv6EigrpSplitHorizon) {
        for (const [as, enabled] of Object.entries(iface.ipv6EigrpSplitHorizon)) {
          if (!enabled) lines.push(` no ipv6 split-horizon eigrp ${as}`);
        }
      }
      if (iface.ipv6NdOtherConfigFlag) lines.push(' ipv6 nd other-config-flag');
      if (iface.ipv6NdManagedConfigFlag) lines.push(' ipv6 nd managed-config-flag');
      if (iface.ipv6NdRaDnsServer) lines.push(` ipv6 nd ra dns server ${iface.ipv6NdRaDnsServer}`);
      if (iface.ipv6NdPrefixNoAutoconfig) {
        for (const pfx of iface.ipv6NdPrefixNoAutoconfig) {
          lines.push(` ipv6 nd prefix ${pfx} no-autoconfig`);
        }
      }
      if (iface.ipv6DhcpServerPool) lines.push(` ipv6 dhcp server ${iface.ipv6DhcpServerPool}`);
      if (iface.ipAccessGroup) {
        if (iface.ipAccessGroup.in) lines.push(` ip access-group ${iface.ipAccessGroup.in} in`);
        if (iface.ipAccessGroup.out) lines.push(` ip access-group ${iface.ipAccessGroup.out} out`);
      }
      if (iface.ipv6TrafficFilter) {
        if (iface.ipv6TrafficFilter.in) lines.push(` ipv6 traffic-filter ${iface.ipv6TrafficFilter.in} in`);
        if (iface.ipv6TrafficFilter.out) lines.push(` ipv6 traffic-filter ${iface.ipv6TrafficFilter.out} out`);
      }
      if (iface.urpfMode) {
        lines.push(` ip verify unicast source reachable-via ${iface.urpfMode}${iface.urpfAllowDefault ? ' allow-default' : ''}`);
      }
      if (iface.natType) {
        lines.push(` ip nat ${iface.natType}`);
      }
      if (iface.bandwidthKbps) lines.push(` bandwidth ${iface.bandwidthKbps}`);
      if (iface.eigrpHelloInterval) {
        for (const [as, sec] of Object.entries(iface.eigrpHelloInterval)) {
          lines.push(` ip hello-interval eigrp ${as} ${sec}`);
        }
      }
      if (iface.eigrpHoldTime) {
        for (const [as, sec] of Object.entries(iface.eigrpHoldTime)) {
          lines.push(` ip hold-time eigrp ${as} ${sec}`);
        }
      }
      if (iface.eigrpSummaryAddresses) {
        for (const sa of iface.eigrpSummaryAddresses) {
          lines.push(` ip summary-address eigrp ${sa.asNumber} ${sa.network} ${sa.mask}`);
        }
      }
      if (iface.eigrpAuthMode) {
        for (const [as, mode] of Object.entries(iface.eigrpAuthMode)) {
          lines.push(` ip authentication mode eigrp ${as} ${mode}`);
        }
      }
      if (iface.eigrpAuthKeyChain) {
        for (const [as, kc] of Object.entries(iface.eigrpAuthKeyChain)) {
          lines.push(` ip authentication key-chain eigrp ${as} ${kc}`);
        }
      }
      if (iface.eigrpIpv6As) {
        lines.push(` ipv6 eigrp ${iface.eigrpIpv6As}`);
      }
      if (iface.eigrpIpv6SummaryAddresses) {
        for (const sa of iface.eigrpIpv6SummaryAddresses) {
          lines.push(` ipv6 summary-address eigrp ${sa.asNumber} ${sa.prefix}`);
        }
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

    // Key Chains
    if (this.keyChains && this.keyChains.size > 0) {
      for (const kc of this.keyChains.values()) {
        lines.push(`key chain ${kc.name}`);
        for (const k of kc.keys.values()) {
          lines.push(` key ${k.keyId}`);
          if (k.keyString) lines.push(`  key-string ${k.keyString}`);
        }
        lines.push('!');
      }
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
      if (this.ospfConfig.summaryAddresses) {
        for (const sa of this.ospfConfig.summaryAddresses) {
          lines.push(` summary-address ${sa.network} ${sa.mask}`);
        }
      }
      if (this.ospfConfig.areaTypes) {
        for (const [area, type] of Object.entries(this.ospfConfig.areaTypes)) {
          if (type === 'stub') lines.push(` area ${area} stub`);
          else if (type === 'totally-stubby') lines.push(` area ${area} stub no-summary`);
          else if (type === 'nssa') lines.push(` area ${area} nssa`);
          else if (type === 'totally-nssa') lines.push(` area ${area} nssa no-summary`);
        }
      }
      if (this.ospfConfig.areaAuth) {
        for (const [area, auth] of Object.entries(this.ospfConfig.areaAuth)) {
          lines.push(` area ${area} authentication ${auth}`);
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

    // OSPFv3
    if (this.ospfv3Config && this.ospfv3Config.enabled) {
      lines.push(`router ospfv3 ${this.ospfv3Config.processId}`);
      if (this.ospfv3Config.routerId) lines.push(` router-id ${this.ospfv3Config.routerId}`);
      if (this.ospfv3Config.addressFamilies) {
        for (const [afName, afCfg] of this.ospfv3Config.addressFamilies.entries()) {
          lines.push(` !`);
          lines.push(` address-family ${afName} unicast`);
          for (const p of afCfg.passiveInterfaces) {
            lines.push(`  passive-interface ${p}`);
          }
          if (afCfg.redistributions) {
            for (const r of afCfg.redistributions) {
              let cmd = `  redistribute ${r.protocol}`;
              if (r.asOrProcessId) cmd += ` ${r.asOrProcessId}`;
              if (r.metricType) cmd += ` metric-type ${r.metricType === 'type-1' ? '1' : r.metricType === 'type-2' ? '2' : r.metricType}`;
              if (r.metric !== undefined) cmd += ` metric ${r.metric}`;
              if (r.routeMap) cmd += ` route-map ${r.routeMap}`;
              if (r.includeConnected) cmd += ` include-connected`;
              lines.push(cmd);
            }
          }
          lines.push(` exit-address-family`);
        }
      }
      lines.push('!');
    }

    // EIGRP IPv4
    if (this.eigrpConfig && this.eigrpConfig.enabled) {
      if (this.eigrpConfig.name) {
        lines.push(`router eigrp ${this.eigrpConfig.name}`);
        lines.push(` !`);
        lines.push(` address-family ipv4 unicast autonomous-system ${this.eigrpConfig.asNumber}`);
        if (this.eigrpConfig.routerId) lines.push(`  eigrp router-id ${this.eigrpConfig.routerId}`);
        for (const net of this.eigrpConfig.networks) {
          lines.push(`  network ${net.network}${net.wildcard ? ' ' + net.wildcard : ''}`);
        }
        if (this.eigrpConfig.passiveInterfaceDefault) {
          lines.push(`  passive-interface default`);
        }
        for (const p of this.eigrpConfig.passiveInterfaces) {
          if (p.startsWith('no passive-interface')) {
            lines.push(`  ${p}`);
          } else {
            lines.push(`  passive-interface ${p}`);
          }
        }
        const hasTopology = this.eigrpConfig.variance || (this.eigrpConfig.distributeLists && this.eigrpConfig.distributeLists.length > 0) || this.eigrpConfig.defaultMetric || (this.eigrpConfig.redistributions && this.eigrpConfig.redistributions.length > 0);
        if (hasTopology) {
          lines.push(`  topology base`);
          if (this.eigrpConfig.distributeLists) {
            for (const dl of this.eigrpConfig.distributeLists) {
              if (dl.prefixList) {
                lines.push(`   distribute-list prefix ${dl.prefixList} ${dl.direction}${dl.interfaceName ? ' ' + dl.interfaceName : ''}`);
              } else if (dl.acl) {
                lines.push(`   distribute-list ${dl.acl} ${dl.direction}${dl.interfaceName ? ' ' + dl.interfaceName : ''}`);
              }
            }
          }
          if (this.eigrpConfig.variance) {
            lines.push(`   variance ${this.eigrpConfig.variance}`);
          }
          if (this.eigrpConfig.defaultMetric) {
            const dm = this.eigrpConfig.defaultMetric;
            lines.push(`   default-metric ${dm.bandwidth} ${dm.delay} ${dm.reliability} ${dm.load} ${dm.mtu}`);
          }
          if (this.eigrpConfig.redistributions) {
            for (const r of this.eigrpConfig.redistributions) {
              let cmd = `   redistribute ${r.protocol}`;
              if (r.asOrProcessId) cmd += ` ${r.asOrProcessId}`;
              if (r.bandwidth && r.delay) {
                cmd += ` metric ${r.bandwidth} ${r.delay} ${r.reliability || 255} ${r.load || 1} ${r.mtu || 1500}`;
              } else if (r.metric) {
                cmd += ` metric ${r.metric}`;
              }
              if (r.metricType) cmd += ` metric-type ${r.metricType}`;
              if (r.routeMap) cmd += ` route-map ${r.routeMap}`;
              if (r.includeConnected) cmd += ` include-connected`;
              lines.push(cmd);
            }
          }
          lines.push(`  exit-af-topology`);
        }
        if (this.eigrpConfig.stub && this.eigrpConfig.stub.enabled) {
          const opts = this.eigrpConfig.stub.options?.length ? ' ' + this.eigrpConfig.stub.options.join(' ') : '';
          lines.push(`  eigrp stub${opts}`);
        }
        lines.push(` exit-address-family`);
      } else {
        lines.push(`router eigrp ${this.eigrpConfig.asNumber}`);
        if (this.eigrpConfig.routerId) lines.push(` eigrp router-id ${this.eigrpConfig.routerId}`);
        for (const net of this.eigrpConfig.networks) {
          lines.push(` network ${net.network}${net.wildcard ? ' ' + net.wildcard : ''}`);
        }
        if (this.eigrpConfig.passiveInterfaceDefault) {
          lines.push(` passive-interface default`);
        }
        for (const p of this.eigrpConfig.passiveInterfaces) {
          if (p.startsWith('no passive-interface')) {
            lines.push(` ${p}`);
          } else {
            lines.push(` passive-interface ${p}`);
          }
        }
        if (this.eigrpConfig.variance) {
          lines.push(` variance ${this.eigrpConfig.variance}`);
        }
        if (this.eigrpConfig.stub && this.eigrpConfig.stub.enabled) {
          const opts = this.eigrpConfig.stub.options?.length ? ' ' + this.eigrpConfig.stub.options.join(' ') : '';
          lines.push(` eigrp stub${opts}`);
        }
        if (this.eigrpConfig.distributeLists) {
          for (const dl of this.eigrpConfig.distributeLists) {
            if (dl.prefixList) {
              lines.push(` distribute-list prefix ${dl.prefixList} ${dl.direction}${dl.interfaceName ? ' ' + dl.interfaceName : ''}`);
            } else if (dl.acl) {
              lines.push(` distribute-list ${dl.acl} ${dl.direction}${dl.interfaceName ? ' ' + dl.interfaceName : ''}`);
            }
          }
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
            if (r.includeConnected) cmd += ` include-connected`;
            lines.push(cmd);
          }
        }
      }
      lines.push('!');
    }

    // EIGRP IPv6
    if (this.eigrpV6Config && this.eigrpV6Config.enabled) {
      if (this.eigrpV6Config.name) {
        lines.push(`router eigrp ${this.eigrpV6Config.name}`);
        lines.push(` !`);
        lines.push(` address-family ipv6 unicast autonomous-system ${this.eigrpV6Config.asNumber}`);
        if (this.eigrpV6Config.routerId) lines.push(`  eigrp router-id ${this.eigrpV6Config.routerId}`);
        if (this.eigrpV6Config.stub && this.eigrpV6Config.stub.enabled) {
          const opts = this.eigrpV6Config.stub.options?.length ? ' ' + this.eigrpV6Config.stub.options.join(' ') : '';
          lines.push(`  eigrp stub${opts}`);
        }
        const hasV6Topology = this.eigrpV6Config.variance || (this.eigrpV6Config.distributeLists && this.eigrpV6Config.distributeLists.length > 0) || this.eigrpV6Config.defaultMetric || (this.eigrpV6Config.redistributions && this.eigrpV6Config.redistributions.length > 0);
        if (hasV6Topology) {
          lines.push(`  topology base`);
          if (this.eigrpV6Config.distributeLists) {
            for (const dl of this.eigrpV6Config.distributeLists) {
              if (dl.prefixList) {
                lines.push(`   distribute-list prefix ${dl.prefixList} ${dl.direction}${dl.interfaceName ? ' ' + dl.interfaceName : ''}`);
              } else if (dl.acl) {
                lines.push(`   distribute-list ${dl.acl} ${dl.direction}${dl.interfaceName ? ' ' + dl.interfaceName : ''}`);
              }
            }
          }
          if (this.eigrpV6Config.variance) {
            lines.push(`   variance ${this.eigrpV6Config.variance}`);
          }
          if (this.eigrpV6Config.defaultMetric) {
            const dm = this.eigrpV6Config.defaultMetric;
            lines.push(`   default-metric ${dm.bandwidth} ${dm.delay} ${dm.reliability} ${dm.load} ${dm.mtu}`);
          }
          if (this.eigrpV6Config.redistributions) {
            for (const r of this.eigrpV6Config.redistributions) {
              let cmd = `   redistribute ${r.protocol}`;
              if (r.asOrProcessId) cmd += ` ${r.asOrProcessId}`;
              if (r.bandwidth && r.delay) {
                cmd += ` metric ${r.bandwidth} ${r.delay} ${r.reliability || 255} ${r.load || 1} ${r.mtu || 1500}`;
              } else if (r.metric) {
                cmd += ` metric ${r.metric}`;
              }
              if (r.metricType) cmd += ` metric-type ${r.metricType}`;
              if (r.routeMap) cmd += ` route-map ${r.routeMap}`;
              if (r.includeConnected) cmd += ` include-connected`;
              lines.push(cmd);
            }
          }
          lines.push(`  exit-af-topology`);
        }
        lines.push(` exit-address-family`);
      } else {
        lines.push(`ipv6 router eigrp ${this.eigrpV6Config.asNumber}`);
        if (this.eigrpV6Config.routerId) lines.push(` eigrp router-id ${this.eigrpV6Config.routerId}`);
        if (this.eigrpV6Config.passiveInterfaceDefault) {
          lines.push(` passive-interface default`);
        }
        for (const p of this.eigrpV6Config.passiveInterfaces) {
          if (p.startsWith('no passive-interface')) {
            lines.push(` ${p}`);
          } else {
            lines.push(` passive-interface ${p}`);
          }
        }
        if (this.eigrpV6Config.variance) {
          lines.push(` variance ${this.eigrpV6Config.variance}`);
        }
        if (this.eigrpV6Config.redistributions) {
          for (const r of this.eigrpV6Config.redistributions) {
            let cmd = ` redistribute ${r.protocol}`;
            if (r.asOrProcessId) cmd += ` ${r.asOrProcessId}`;
            if (r.bandwidth && r.delay) {
              cmd += ` metric ${r.bandwidth} ${r.delay} ${r.reliability || 255} ${r.load || 1} ${r.mtu || 1500}`;
            } else if (r.metric) {
              cmd += ` metric ${r.metric}`;
            }
            if (r.routeMap) cmd += ` route-map ${r.routeMap}`;
            if (r.includeConnected) cmd += ` include-connected`;
            lines.push(cmd);
          }
        }
      }
      lines.push('!');
    }

    // BGP
    if (this.bgpConfig && this.bgpConfig.enabled) {
      lines.push(`router bgp ${this.bgpConfig.asNumber}`);
      if (this.bgpConfig.routerId) lines.push(` bgp router-id ${this.bgpConfig.routerId}`);
      if (this.bgpConfig.clusterId) lines.push(` bgp cluster-id ${this.bgpConfig.clusterId}`);
      if (this.bgpConfig.asnotation === 'dot') lines.push(` bgp asnotation dot`);
      if (this.bgpConfig.logNeighborChanges) lines.push(` bgp log-neighbor-changes`);
      if (this.bgpConfig.noBgpDefaultIpv4Unicast) lines.push(` no bgp default ipv4-unicast`);

      // Peer Groups
      if (this.bgpConfig.peerGroups) {
        for (const [pgName, pg] of this.bgpConfig.peerGroups.entries()) {
          lines.push(` neighbor ${pgName} peer-group`);
          if (pg.remoteAs) lines.push(` neighbor ${pgName} remote-as ${pg.remoteAs}`);
          if (pg.updateSource) lines.push(` neighbor ${pgName} update-source ${pg.updateSource}`);
          if (pg.password) lines.push(` neighbor ${pgName} password ${pg.password}`);
          if (pg.filterListOut) lines.push(` neighbor ${pgName} filter-list ${pg.filterListOut} out`);
          if (pg.filterListIn) lines.push(` neighbor ${pgName} filter-list ${pg.filterListIn} in`);
          if (pg.routeMapOut) lines.push(` neighbor ${pgName} route-map ${pg.routeMapOut} out`);
          if (pg.routeMapIn) lines.push(` neighbor ${pgName} route-map ${pg.routeMapIn} in`);
        }
      }

      // Global Neighbors
      for (const n of this.bgpConfig.neighbors.values()) {
        const ip = n.ipAddress || n.ip;
        if (n.peerGroup) {
          lines.push(` neighbor ${ip} peer-group ${n.peerGroup}`);
        }
        if (n.remoteAs) lines.push(` neighbor ${ip} remote-as ${n.remoteAs}`);
        if (n.updateSource) lines.push(` neighbor ${ip} update-source ${n.updateSource}`);
        if (n.password) lines.push(` neighbor ${ip} password ${n.password}`);
        if (n.description) lines.push(` neighbor ${ip} description ${n.description}`);
        if (n.defaultOriginate) lines.push(` neighbor ${ip} default-originate`);
        if (n.weight !== undefined) lines.push(` neighbor ${ip} weight ${n.weight}`);
        if (n.nextHopSelf) lines.push(` neighbor ${ip} next-hop-self`);
        if (n.routeReflectorClient) lines.push(` neighbor ${ip} route-reflector-client`);
        if (n.filterListOut) lines.push(` neighbor ${ip} filter-list ${n.filterListOut} out`);
        if (n.filterListIn) lines.push(` neighbor ${ip} filter-list ${n.filterListIn} in`);
        if (n.routeMapOut) lines.push(` neighbor ${ip} route-map ${n.routeMapOut} out`);
        if (n.routeMapIn) lines.push(` neighbor ${ip} route-map ${n.routeMapIn} in`);
        if (n.prefixListOut) lines.push(` neighbor ${ip} prefix-list ${n.prefixListOut} out`);
        if (n.prefixListIn) lines.push(` neighbor ${ip} prefix-list ${n.prefixListIn} in`);
        if (n.shutdown) lines.push(` neighbor ${ip} shutdown`);
      }

      // Global Networks
      for (const net of this.bgpConfig.networks) {
        lines.push(` network ${net.network}${net.mask ? ' mask ' + net.mask : ''}`);
      }

      // Global Aggregates
      if (this.bgpConfig.aggregateAddresses) {
        for (const agg of this.bgpConfig.aggregateAddresses) {
          let cmd = ` aggregate-address ${agg.prefix} ${agg.mask}`;
          if (agg.summaryOnly) cmd += ' summary-only';
          if (agg.asSet) cmd += ' as-set';
          lines.push(cmd);
        }
      }

      // Address Families
      if (this.bgpConfig.addressFamilies) {
        for (const [afKey, af] of this.bgpConfig.addressFamilies.entries()) {
          lines.push(` !`);
          lines.push(` address-family ${af.type}${af.subType ? ' ' + af.subType : ''}`);
          for (const net of af.networks) {
            lines.push(`  network ${net.network}${net.mask ? ' mask ' + net.mask : ''}`);
          }
          if (af.aggregateAddresses) {
            for (const agg of af.aggregateAddresses) {
              let cmd = `  aggregate-address ${agg.prefix} ${agg.mask}`;
              if (agg.summaryOnly) cmd += ' summary-only';
              if (agg.asSet) cmd += ' as-set';
              lines.push(cmd);
            }
          }
          for (const [nip, ncfg] of af.neighbors.entries()) {
            if (ncfg.activate === false) {
              lines.push(`  no neighbor ${nip} activate`);
            } else if (ncfg.activate === true) {
              lines.push(`  neighbor ${nip} activate`);
            }
            if (ncfg.nextHopSelf) lines.push(`  neighbor ${nip} next-hop-self`);
            if (ncfg.routeReflectorClient) lines.push(`  neighbor ${nip} route-reflector-client`);
            if (ncfg.filterListOut) lines.push(`  neighbor ${nip} filter-list ${ncfg.filterListOut} out`);
            if (ncfg.filterListIn) lines.push(`  neighbor ${nip} filter-list ${ncfg.filterListIn} in`);
            if (ncfg.routeMapOut) lines.push(`  neighbor ${nip} route-map ${ncfg.routeMapOut} out`);
            if (ncfg.routeMapIn) lines.push(`  neighbor ${nip} route-map ${ncfg.routeMapIn} in`);
            if (ncfg.prefixListOut) lines.push(`  neighbor ${nip} prefix-list ${ncfg.prefixListOut} out`);
            if (ncfg.prefixListIn) lines.push(`  neighbor ${nip} prefix-list ${ncfg.prefixListIn} in`);
            if (ncfg.weight !== undefined) lines.push(`  neighbor ${nip} weight ${ncfg.weight}`);
            if (ncfg.defaultOriginate) lines.push(`  neighbor ${nip} default-originate`);
          }
          lines.push(` exit-address-family`);
        }
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

    // AS-Path Access Lists
    for (const [num, rules] of this.asPathAccessLists.entries()) {
      for (const rule of rules) {
        lines.push(`ip as-path access-list ${num} ${rule.action} ${rule.regex}`);
      }
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
        if (c.description) lines.push(` description ${c.description}`);
        if (c.matchAcl) lines.push(` match ip address ${c.matchAcl}`);
        if (c.matchPrefixList) lines.push(` match ip address prefix-list ${c.matchPrefixList}`);
        if (c.matchIpv6AddressPrefixList) lines.push(` match ipv6 address prefix-list ${c.matchIpv6AddressPrefixList}`);
        if (c.matchAsPath) lines.push(` match as-path ${c.matchAsPath}`);
        if (c.matchTag) lines.push(` match tag ${c.matchTag}`);
        if (c.matchInterface) lines.push(` match interface ${c.matchInterface}`);
        if (c.setMetric !== undefined) lines.push(` set metric ${c.setMetric}`);
        if (c.setMetricType) lines.push(` set metric-type ${c.setMetricType}`);
        if (c.setTag !== undefined) lines.push(` set tag ${c.setTag}`);
        if (c.setIpNextHop && !c.setIpNextHopTrack) lines.push(` set ip next-hop ${c.setIpNextHop}`);
        if (c.setIpNextHopTrack) lines.push(` set ip next-hop verify-availability ${c.setIpNextHopTrack.nextHop} 1 track ${c.setIpNextHopTrack.trackId}`);
        if (c.setWeight !== undefined) lines.push(` set weight ${c.setWeight}`);
        if (c.setLocalPreference !== undefined) lines.push(` set local-preference ${c.setLocalPreference}`);
        if (c.setAsPathPrepend) lines.push(` set as-path prepend ${c.setAsPathPrepend}`);
        lines.push('!');
      }
    }

    if (this.ipLocalPolicyRouteMap) {
      lines.push(`ip local policy route-map ${this.ipLocalPolicyRouteMap}`);
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
        if (typeof num === 'number' && num <= 99) {
          lines.push(`access-list ${num} ${r.action} ${r.sourceIp} ${r.sourceWildcard || ''}`.trim());
        } else {
          lines.push(`access-list ${num} ${r.action} ${r.protocol || 'ip'} ${r.sourceIp} ${r.sourceWildcard || ''} ${r.destIp || ''} ${r.destWildcard || ''}`.trim());
        }
      }
    }

    // Time Ranges
    if (this.timeRanges) {
      for (const tr of this.timeRanges.values()) {
        lines.push(`time-range ${tr.name}`);
        if (tr.periodic) {
          for (const p of tr.periodic) {
            lines.push(` periodic ${p.days} ${p.startTime} to ${p.endTime}`);
          }
        }
        lines.push('!');
      }
    }

    // Named Access Lists
    if (this.namedAccessLists) {
      for (const nacl of this.namedAccessLists.values()) {
        lines.push(`ip access-list ${nacl.type} ${nacl.name}`);
        if (nacl.remarks) {
          for (const rem of nacl.remarks) {
            lines.push(` remark ${rem}`);
          }
        }
        for (const r of nacl.rules) {
          const seqPfx = r.sequence ? `${r.sequence} ` : '';
          if (nacl.type === 'standard') {
            lines.push(` ${seqPfx}${r.action} ${r.sourceIp}${r.sourceWildcard ? ' ' + r.sourceWildcard : ''}`);
          } else {
            let rLine = ` ${seqPfx}${r.action} ${r.protocol || 'ip'} ${r.sourceIp}${r.sourceWildcard ? ' ' + r.sourceWildcard : ''} ${r.destIp || 'any'}${r.destWildcard ? ' ' + r.destWildcard : ''}`;
            if (r.destPort) rLine += ` eq ${r.destPort}`;
            if (r.portRange) rLine += ` range ${r.portRange.start} ${r.portRange.end}`;
            if (r.timeRange) rLine += ` time-range ${r.timeRange}`;
            lines.push(rLine.trim());
          }
        }
        lines.push('!');
      }
    }

    // IPv6 Access Lists
    if (this.ipv6AccessLists) {
      for (const acl of this.ipv6AccessLists.values()) {
        lines.push(`ipv6 access-list ${acl.name}`);
        if (acl.remarks) {
          for (const rem of acl.remarks) lines.push(` remark ${rem}`);
        }
        for (const r of acl.rules) {
          const seqPfx = r.sequence ? `${r.sequence} ` : '';
          let line = ` ${seqPfx}${r.action} ${r.protocol} ${r.source} ${r.dest}`;
          if (r.icmpType) line += ` ${r.icmpType}`;
          if (r.destPort) line += ` eq ${r.destPort}`;
          if (r.destPortRange) line += ` range ${r.destPortRange.start} ${r.destPortRange.end}`;
          if (r.timeRange) line += ` time-range ${r.timeRange}`;
          lines.push(line);
        }
        lines.push('!');
      }
    }

    // IPv6 DHCP Pools
    if (this.dhcpv6Pools) {
      for (const pool of this.dhcpv6Pools.values()) {
        lines.push(`ipv6 dhcp pool ${pool.name}`);
        if (pool.addressPrefix) lines.push(` address prefix ${pool.addressPrefix}`);
        if (pool.dnsServer) lines.push(` dns-server ${pool.dnsServer}`);
        if (pool.domainName) lines.push(` domain-name ${pool.domainName}`);
        lines.push('!');
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

    // Automation & Telemetry (Tahap 7)
    if (this.restconfEnabled) {
      lines.push('restconf');
    }
    if (this.netconfEnabled) {
      lines.push('netconf-yang');
    }

    // EEM Applets
    for (const applet of this.eemApplets.values()) {
      lines.push(`event manager applet ${applet.name}`);
      if (applet.event) {
        if (applet.event.type === 'cli') {
          lines.push(` event cli pattern "${applet.event.pattern}" sync ${applet.event.sync ? 'yes' : 'no'}`);
        } else if (applet.event.type === 'syslog') {
          lines.push(` event syslog pattern "${applet.event.pattern}"`);
        } else if (applet.event.type === 'timer') {
          lines.push(` event timer watchdog time ${applet.event.timeSec}`);
        }
      }
      for (const act of applet.actions) {
        const arg = act.argument || (act.type === 'syslog' ? act.message : act.command) || '';
        if (act.type === 'syslog') {
          lines.push(` action ${act.label} syslog msg "${arg}"`);
        } else if (act.type === 'cli') {
          lines.push(` action ${act.label} cli command "${arg}"`);
        }
      }
      lines.push('!');
    }

    // MDT Subscriptions
    for (const sub of this.mdtSubscriptions.values()) {
      lines.push(`telemetry ietf subscription ${sub.id}`);
      lines.push(` encoding ${sub.encoding}`);
      lines.push(` filter xpath ${sub.filterXpath}`);
      lines.push(` source-address ${sub.sourceAddress || '0.0.0.0'}`);
      lines.push(` stream ${sub.stream}`);
      if (sub.updatePolicy.type === 'periodic') {
        lines.push(` update-policy periodic ${sub.updatePolicy.periodCentiseconds}`);
      } else {
        lines.push(` update-policy on-change`);
      }
      for (const rx of sub.receivers) {
        lines.push(` receiver ip address ${rx.address} ${rx.port} protocol ${rx.protocol}`);
      }
      lines.push('!');
    }

    // Lines
    lines.push('line con 0');
    if (this.consolePassword) lines.push(` password ${this.consolePassword}`, ' login');
    lines.push('!');
    lines.push('line vty 0 4');
    if (this.vtyAccessClass) lines.push(` access-class ${this.vtyAccessClass.acl} ${this.vtyAccessClass.direction}`);
    if (this.vtyPassword) lines.push(` password ${this.vtyPassword}`, ' login');
    lines.push(' transport input ssh telnet');
    lines.push('!');
    lines.push('end');

    return lines.join('\n');
  }
}
