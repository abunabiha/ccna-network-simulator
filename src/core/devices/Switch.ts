import { Device } from './Device';
import { DevicePosition, VlanInfo, MacTableEntry, RouteEntry, DhcpPool, OspfConfig, OspfV3Config, EigrpConfig, EigrpV6Config, BgpConfig, RouteMap, IpPrefixList, IpSlaConfig, TrackObject, VrfConfig, MplsLabelEntry, AclRule, NamedAcl } from '../../types/network';
import { CliContext, CliExecutionResult } from '../../types/cli';
import { SubnetUtils } from '../network/Subnet';

export class Switch extends Device {
  vlanDatabase: Map<number, VlanInfo> = new Map();
  macTable: MacTableEntry[] = [];
  isLayer3: boolean = false;
  routingTable: RouteEntry[] = [];
  ospfConfig?: OspfConfig;
  ospfv3Config?: OspfV3Config;
  ipv6UnicastRouting: boolean = false;
  eigrpConfig?: EigrpConfig;
  eigrpV6Config?: EigrpV6Config;
  bgpConfig?: BgpConfig;
  spanningTreeMode: 'pvst' | 'rapid-pvst' | 'mst' = 'pvst';
  stpPriorities: Map<number, number> = new Map();
  vtp: { domain: string; mode: 'server' | 'client' | 'transparent' | 'off'; version: number } = { domain: '', mode: 'server', version: 2 };
  defaultGateway?: string;
  dhcpPools: Map<string, DhcpPool> = new Map();
  dhcpExcludedAddresses: string[] = [];
  accessLists: Map<number | string, AclRule[]> = new Map();
  namedAccessLists: Map<string, NamedAcl> = new Map();
  ipLocalPolicyRouteMap?: string;
  routeMaps: Map<string, RouteMap> = new Map();
  prefixLists: Map<string, IpPrefixList> = new Map();
  ipSlas: Map<number, IpSlaConfig> = new Map();
  trackObjects: Map<number, TrackObject> = new Map();
  vrfInstances: Map<string, VrfConfig> = new Map();
  mplsEnabled: boolean = false;
  mplsLdpRouterId?: string;
  mplsInterfaces: Set<string> = new Set();
  lfib: MplsLabelEntry[] = [];

  constructor(id: string, hostname: string, position: DevicePosition, isLayer3: boolean = false) {
    super(id, hostname, isLayer3 ? 'switch-l3' : 'switch', position);
    this.isLayer3 = isLayer3;
    this.ipRouting = isLayer3;

    if (isLayer3) {
      this.model = 'C9300L-24T-4G-A';
      this.osVersion = '17.12.6';
    } else {
      this.model = 'C9200L-24T-4G-E';
      this.osVersion = '17.12.6';
    }

    // Default VLAN 1 & STP priority 32768
    this.vlanDatabase.set(1, { id: 1, name: 'default', status: 'active' });
    this.stpPriorities.set(1, 32768);

    // 24 FastEthernet ports
    for (let i = 1; i <= 24; i++) {
      const pName = `FastEthernet0/${i}`;
      const short = `Fa0/${i}`;
      this.addInterface({
        name: pName,
        shortName: short,
        macAddress: `0002.ba${(i < 10 ? '0' + i : i)}.${Math.floor(Math.random() * 8999 + 1000)}`,
        status: 'up',
        isShutdown: false,
        switchportMode: 'access',
        accessVlan: 1,
        trunkAllowedVlans: Array.from({ length: 4094 }, (_, idx) => idx + 1),
        nativeVlan: 1,
        speed: '100Mb/s',
        duplex: 'auto',
        portSecurity: {
          enabled: false,
          maxMacs: 1,
          violation: 'shutdown',
          stickyMacs: []
        }
      });
    }

    // 2 GigabitEthernet ports (uplinks)
    for (let i = 1; i <= 2; i++) {
      const pName = `GigabitEthernet0/${i}`;
      const short = `Gi0/${i}`;
      this.addInterface({
        name: pName,
        shortName: short,
        macAddress: `0002.ba${(24 + i)}.${Math.floor(Math.random() * 8999 + 1000)}`,
        status: 'up',
        isShutdown: false,
        switchportMode: 'access',
        accessVlan: 1,
        trunkAllowedVlans: Array.from({ length: 4094 }, (_, idx) => idx + 1),
        nativeVlan: 1,
        speed: '1000Mb/s',
        duplex: 'auto'
      });
    }

    // For L3 switches (Catalyst 9300L), provide GigabitEthernet1/0/1 through GigabitEthernet1/0/24
    if (isLayer3) {
      for (let i = 1; i <= 24; i++) {
        const pName = `GigabitEthernet1/0/${i}`;
        const short = `Gi1/0/${i}`;
        this.addInterface({
          name: pName,
          shortName: short,
          macAddress: `0002.ba${(i < 10 ? '0' + i : i)}.${Math.floor(Math.random() * 8999 + 1000)}`,
          status: 'up',
          isShutdown: false,
          switchportMode: 'access',
          accessVlan: 1,
          trunkAllowedVlans: Array.from({ length: 4094 }, (_, idx) => idx + 1),
          nativeVlan: 1,
          speed: '1000Mb/s',
          duplex: 'auto',
          portSecurity: {
            enabled: false,
            maxMacs: 1,
            violation: 'shutdown',
            stickyMacs: []
          }
        });
      }
    }

    // Management Interface Vlan1
    this.addInterface({
      name: 'Vlan1',
      shortName: 'Vl1',
      macAddress: `0002.ba00.0001`,
      status: 'down',
      isShutdown: true
    });
  }

  override getInterface(name: string) {
    if (!name) return undefined;
    const direct = super.getInterface(name);
    if (direct) return direct;

    // Resolve Gi1/0/X -> Fa0/X or Gi0/X
    const m = name.match(/^(?:GigabitEthernet|Gi)1\/0\/(\d+)$/i);
    if (m) {
      const portNum = parseInt(m[1], 10);
      return this.interfaces.get(`GigabitEthernet1/0/${portNum}`) ||
             this.interfaces.get(`FastEthernet0/${portNum}`) ||
             this.interfaces.get(`GigabitEthernet0/${portNum}`);
    }
    const mFa = name.match(/^(?:FastEthernet|Fa)0\/(\d+)$/i);
    if (mFa) {
      const portNum = parseInt(mFa[1], 10);
      return this.interfaces.get(`FastEthernet0/${portNum}`) ||
             this.interfaces.get(`GigabitEthernet1/0/${portNum}`);
    }
    return undefined;
  }

  learnMac(vlan: number, macAddress: string, port: string): void {
    const existing = this.macTable.find(e => e.macAddress.toLowerCase() === macAddress.toLowerCase() && e.vlan === vlan);
    if (existing) {
      existing.port = port;
    } else {
      this.macTable.push({
        vlan,
        macAddress,
        type: 'DYNAMIC',
        port
      });
    }
  }

  addVlan(id: number, name?: string): void {
    const vlanName = name || `VLAN${id.toString().padStart(4, '0')}`;
    this.vlanDatabase.set(id, { id, name: vlanName, status: 'active' });

    // If L3 switch, allow SVI creation
    if (this.isLayer3 && !this.interfaces.has(`Vlan${id}`)) {
      this.addInterface({
        name: `Vlan${id}`,
        shortName: `Vl${id}`,
        macAddress: `0002.ba00.${id.toString(16).padStart(4, '0')}`,
        status: 'down',
        isShutdown: true
      });
    }
  }

  updateL3ConnectedRoutes(): void {
    if (!this.isLayer3 || !this.ipRouting) return;
    this.routingTable = this.routingTable.filter(r => r.protocol !== 'C' && r.protocol !== 'L');

    // Also clear previous connected and local routes from each VRF table
    for (const vrf of this.vrfInstances.values()) {
      vrf.routingTable = vrf.routingTable.filter(r => r.protocol !== 'C' && r.protocol !== 'L');
    }

    for (const iface of this.interfaces.values()) {
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

  updateConnectedRoutes(): void {
    this.updateL3ConnectedRoutes();
  }

  lookupRoute(destIp: string, vrfName?: string): RouteEntry | null {
    if (!this.isLayer3 || !this.ipRouting) return null;
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
      } else {
        if (SubnetUtils.isIpInSubnet(destIp, route.network, route.mask)) {
          if (route.cidr > longestPrefix) {
            longestPrefix = route.cidr;
            bestMatch = route;
          }
        }
      }
    }

    return bestMatch;
  }

  executeCli(commandLine: string, context: CliContext): CliExecutionResult {
    return { output: '' };
  }

  getRunningConfig(): string {
    const lines: string[] = [
      'Building configuration...',
      'Current configuration : 2410 bytes',
      '!',
      this.isLayer3 ? 'version 17.12' : 'version 15.2',
      'no service timestamps log datetime msec',
      'no service timestamps debug datetime msec',
      this.servicePasswordEncryption ? 'service password-encryption' : 'no service password-encryption',
      '!',
      `hostname ${this.hostname}`,
      '!'
    ];

    if (!this.cdpEnabled) {
      lines.push('no cdp run', '!');
    } else {
      if (this.cdpTimer !== 60) lines.push(`cdp timer ${this.cdpTimer}`, '!');
      if (this.cdpHoldtime !== 180) lines.push(`cdp holdtime ${this.cdpHoldtime}`, '!');
    }

    if (this.bannerMotd) {
      lines.push(`banner motd ^C${this.bannerMotd}^C`, '!');
    }

    if (this.enableSecret) {
      lines.push(`enable secret 5 ${this.enableSecret}`, '!');
    }

    if (this.isLayer3 && this.ipRouting) {
      lines.push('ip routing', '!');
    }

    if (this.defaultGateway) {
      lines.push(`ip default-gateway ${this.defaultGateway}`, '!');
    }

    // DHCP Pools
    for (const pool of this.dhcpPools.values()) {
      lines.push(`ip dhcp pool ${pool.name}`);
      if (pool.network && pool.mask) lines.push(` network ${pool.network} ${pool.mask}`);
      if (pool.defaultRouter) lines.push(` default-router ${pool.defaultRouter}`);
      if (pool.dnsServer) lines.push(` dns-server ${pool.dnsServer}`);
      lines.push('!');
    }

    // VTP
    if (this.vtp.domain) {
      lines.push(`vtp domain ${this.vtp.domain}`);
      lines.push(`vtp mode ${this.vtp.mode}`);
      lines.push('!');
    }

    // Spanning Tree
    lines.push(`spanning-tree mode ${this.spanningTreeMode}`);
    lines.push('spanning-tree extend system-id');
    for (const [vlanId, prio] of this.stpPriorities.entries()) {
      if (prio !== 32768) {
        lines.push(`spanning-tree vlan ${vlanId} priority ${prio}`);
      }
    }
    lines.push('!');

    // VLANs
    for (const [vlanId, vlan] of this.vlanDatabase.entries()) {
      if (vlanId !== 1) {
        lines.push(`vlan ${vlanId}`);
        lines.push(` name ${vlan.name}`);
        lines.push('!');
      }
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

    // Interfaces (deduplicated by object reference)
    for (const iface of Array.from(new Set(this.interfaces.values()))) {
      lines.push(`interface ${iface.name}`);
      if (iface.description) lines.push(` description ${iface.description}`);
      if (iface.vrf) lines.push(` vrf forwarding ${iface.vrf}`);
      if (iface.mplsEnabled) lines.push(` mpls ip`);

      if (iface.isDhcpClient) {
        lines.push(' ip address dhcp');
      } else if (iface.ipAddress && iface.subnetMask) {
        lines.push(` ip address ${iface.ipAddress} ${iface.subnetMask}`);
      }

      if (!iface.name.startsWith('Vlan')) {
        if (iface.channelGroup) {
          lines.push(` channel-group ${iface.channelGroup} mode ${iface.channelMode || 'on'}`);
        }

        if (iface.stpPortFast) {
          lines.push(' spanning-tree portfast');
        }
        if (iface.stpBpduGuard) {
          lines.push(' spanning-tree bpduguard enable');
        }
        if (iface.stpBpduFilter) {
          lines.push(' spanning-tree bpdufilter enable');
        }
        if (iface.stpRootGuard) {
          lines.push(' spanning-tree guard root');
        }
        if (iface.stpCost) {
          lines.push(` spanning-tree cost ${iface.stpCost}`);
        }
        if (iface.dtpMode) {
          lines.push(` switchport mode ${iface.dtpMode}`);
        }
        if (iface.dtpNoNegotiate) {
          lines.push(' switchport nonegotiate');
        }

        if (iface.switchportMode === 'none') {
          lines.push(' no switchport');
        } else if (iface.switchportMode === 'trunk') {
          lines.push(' switchport mode trunk');
          if (iface.nativeVlan && iface.nativeVlan !== 1) {
            lines.push(` switchport trunk native vlan ${iface.nativeVlan}`);
          }
          if (iface.trunkAllowedVlans && iface.trunkAllowedVlans.length < 4094) {
            lines.push(` switchport trunk allowed vlan ${iface.trunkAllowedVlans.join(',')}`);
          }
        } else if (iface.switchportMode === 'access') {
          lines.push(' switchport mode access');
          if (iface.accessVlan && iface.accessVlan !== 1) {
            lines.push(` switchport access vlan ${iface.accessVlan}`);
          }
        }

        if (iface.portSecurity && iface.portSecurity.enabled) {
          lines.push(' switchport port-security');
          if (iface.portSecurity.maxMacs > 1) {
            lines.push(` switchport port-security maximum ${iface.portSecurity.maxMacs}`);
          }
          if (iface.portSecurity.violation) {
            lines.push(` switchport port-security violation ${iface.portSecurity.violation}`);
          }
          for (const mac of iface.portSecurity.stickyMacs) {
            lines.push(` switchport port-security mac-address sticky ${mac}`);
          }
        }
      }

      if (iface.hsrp) {
        if (iface.hsrp.version === 2) lines.push(' standby version 2');
        lines.push(` standby ${iface.hsrp.group} ip ${iface.hsrp.virtualIp}`);
        if (iface.hsrp.priority && iface.hsrp.priority !== 100) lines.push(` standby ${iface.hsrp.group} priority ${iface.hsrp.priority}`);
        if (iface.hsrp.preempt) lines.push(` standby ${iface.hsrp.group} preempt`);
      }
      if (iface.vrrp) {
        lines.push(` vrrp ${iface.vrrp.group} ip ${iface.vrrp.virtualIp}`);
        if (iface.vrrp.priority && iface.vrrp.priority !== 100) lines.push(` vrrp ${iface.vrrp.group} priority ${iface.vrrp.priority}`);
        if (iface.vrrp.preempt) lines.push(` vrrp ${iface.vrrp.group} preempt`);
      }

      if (iface.ipPolicyRouteMap) {
        lines.push(` ip policy route-map ${iface.ipPolicyRouteMap}`);
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

      if (iface.cdpEnabled === false) {
        lines.push(' no cdp enable');
      }

      if (iface.isShutdown) {
        lines.push(' shutdown');
      } else {
        lines.push(' no shutdown');
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

    // Static ARP entries
    for (const entry of this.arpTable) {
      if (entry.type === 'static' || entry.age === '-') {
        lines.push(`arp ${entry.ipAddress} ${entry.macAddress} ARPA`);
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
      for (const pIf of this.ospfConfig.passiveInterfaces) {
        lines.push(` passive-interface ${pIf}`);
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
          lines.push(` network ${net.network}${net.wildcard ? ` ${net.wildcard}` : ''}`);
        }
        if (this.eigrpConfig.passiveInterfaceDefault) {
          lines.push(` passive-interface default`);
        }
        for (const pIf of this.eigrpConfig.passiveInterfaces) {
          if (pIf.startsWith('no passive-interface')) {
            lines.push(` ${pIf}`);
          } else {
            lines.push(` passive-interface ${pIf}`);
          }
        }
        if (this.eigrpConfig.autoSummary === false) lines.push(' no auto-summary');
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
      for (const nb of this.bgpConfig.neighbors.values()) {
        const ip = nb.ipAddress || nb.ip;
        if (nb.peerGroup) {
          lines.push(` neighbor ${ip} peer-group ${nb.peerGroup}`);
        }
        if (nb.remoteAs) lines.push(` neighbor ${ip} remote-as ${nb.remoteAs}`);
        if (nb.updateSource) lines.push(` neighbor ${ip} update-source ${nb.updateSource}`);
        if (nb.password) lines.push(` neighbor ${ip} password ${nb.password}`);
        if (nb.description) lines.push(` neighbor ${ip} description ${nb.description}`);
        if (nb.defaultOriginate) lines.push(` neighbor ${ip} default-originate`);
        if (nb.weight !== undefined) lines.push(` neighbor ${ip} weight ${nb.weight}`);
        if (nb.nextHopSelf) lines.push(` neighbor ${ip} next-hop-self`);
        if (nb.routeReflectorClient) lines.push(` neighbor ${ip} route-reflector-client`);
        if (nb.filterListOut) lines.push(` neighbor ${ip} filter-list ${nb.filterListOut} out`);
        if (nb.filterListIn) lines.push(` neighbor ${ip} filter-list ${nb.filterListIn} in`);
        if (nb.routeMapOut) lines.push(` neighbor ${ip} route-map ${nb.routeMapOut} out`);
        if (nb.routeMapIn) lines.push(` neighbor ${ip} route-map ${nb.routeMapIn} in`);
        if (nb.prefixListOut) lines.push(` neighbor ${ip} prefix-list ${nb.prefixListOut} out`);
        if (nb.prefixListIn) lines.push(` neighbor ${ip} prefix-list ${nb.prefixListIn} in`);
        if (nb.shutdown) lines.push(` neighbor ${ip} shutdown`);
      }

      // Global Networks
      for (const net of this.bgpConfig.networks) {
        lines.push(` network ${net.network}${net.mask ? ` mask ${net.mask}` : ''}`);
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
          if (nacl.type === 'standard') {
            lines.push(` ${r.action} ${r.sourceIp}${r.sourceWildcard ? ' ' + r.sourceWildcard : ''}`);
          } else {
            lines.push(` ${r.action} ${r.protocol || 'ip'} ${r.sourceIp}${r.sourceWildcard ? ' ' + r.sourceWildcard : ''}${r.destIp ? ' ' + r.destIp : ''}${r.destWildcard ? ' ' + r.destWildcard : ''}`.trim());
          }
        }
        lines.push('!');
      }
    }

    // Management lines
    lines.push('line con 0');
    if (this.consolePassword) lines.push(` password ${this.consolePassword}`, ' login');
    lines.push('!');
    lines.push('line vty 0 4');
    if (this.vtyPassword) lines.push(` password ${this.vtyPassword}`, ' login');
    lines.push('!');
    lines.push('end');

    return lines.join('\n');
  }
}
