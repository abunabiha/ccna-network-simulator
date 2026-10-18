import { Device } from './Device';
import { DevicePosition, VlanInfo, MacTableEntry, RouteEntry, DhcpPool, OspfConfig, EigrpConfig, BgpConfig, RouteMap, IpPrefixList, IpSlaConfig, TrackObject } from '../../types/network';
import { CliContext, CliExecutionResult } from '../../types/cli';
import { SubnetUtils } from '../network/Subnet';

export class Switch extends Device {
  vlanDatabase: Map<number, VlanInfo> = new Map();
  macTable: MacTableEntry[] = [];
  isLayer3: boolean = false;
  routingTable: RouteEntry[] = [];
  ospfConfig?: OspfConfig;
  eigrpConfig?: EigrpConfig;
  bgpConfig?: BgpConfig;
  spanningTreeMode: 'pvst' | 'rapid-pvst' | 'mst' = 'pvst';
  stpPriorities: Map<number, number> = new Map();
  vtp: { domain: string; mode: 'server' | 'client' | 'transparent' | 'off'; version: number } = { domain: '', mode: 'server', version: 2 };
  defaultGateway?: string;
  dhcpPools: Map<string, DhcpPool> = new Map();
  dhcpExcludedAddresses: string[] = [];
  routeMaps: Map<string, RouteMap> = new Map();
  prefixLists: Map<string, IpPrefixList> = new Map();
  ipSlas: Map<number, IpSlaConfig> = new Map();
  trackObjects: Map<number, TrackObject> = new Map();

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

    // Management Interface Vlan1
    this.addInterface({
      name: 'Vlan1',
      shortName: 'Vl1',
      macAddress: `0002.ba00.0001`,
      status: 'down',
      isShutdown: true
    });
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

    for (const iface of this.interfaces.values()) {
      if (iface.status === 'up' && !iface.isShutdown && iface.ipAddress && iface.subnetMask) {
        const netAddr = SubnetUtils.getNetworkAddress(iface.ipAddress, iface.subnetMask);
        const cidr = SubnetUtils.maskToCidr(iface.subnetMask);

        this.routingTable.push({
          network: netAddr,
          mask: iface.subnetMask,
          cidr,
          exitInterface: iface.name,
          protocol: 'C',
          adminDistance: 0,
          metric: 0
        });

        this.routingTable.push({
          network: iface.ipAddress,
          mask: '255.255.255.255',
          cidr: 32,
          exitInterface: iface.name,
          protocol: 'L',
          adminDistance: 0,
          metric: 0
        });
      }
    }
  }

  updateConnectedRoutes(): void {
    this.updateL3ConnectedRoutes();
  }

  lookupRoute(destIp: string): RouteEntry | null {
    if (!this.isLayer3 || !this.ipRouting) return null;
    let bestMatch: RouteEntry | null = null;
    let longestPrefix = -1;

    for (const route of this.routingTable) {
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

    // Interfaces (deduplicated by object reference)
    for (const iface of Array.from(new Set(this.interfaces.values()))) {
      lines.push(`interface ${iface.name}`);
      if (iface.description) lines.push(` description ${iface.description}`);

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

    // EIGRP
    if (this.eigrpConfig && this.eigrpConfig.enabled) {
      lines.push(`router eigrp ${this.eigrpConfig.asNumber}`);
      if (this.eigrpConfig.routerId) lines.push(` eigrp router-id ${this.eigrpConfig.routerId}`);
      for (const net of this.eigrpConfig.networks) {
        lines.push(` network ${net.network}${net.wildcard ? ` ${net.wildcard}` : ''}`);
      }
      for (const pIf of this.eigrpConfig.passiveInterfaces) {
        lines.push(` passive-interface ${pIf}`);
      }
      if (this.eigrpConfig.autoSummary === false) lines.push(' no auto-summary');
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
      for (const nb of this.bgpConfig.neighbors.values()) {
        const ip = nb.ipAddress || nb.ip;
        lines.push(` neighbor ${ip} remote-as ${nb.remoteAs}`);
        if (nb.updateSource) lines.push(` neighbor ${ip} update-source ${nb.updateSource}`);
        if (nb.description) lines.push(` neighbor ${ip} description ${nb.description}`);
        if (nb.shutdown) lines.push(` neighbor ${ip} shutdown`);
      }
      for (const net of this.bgpConfig.networks) {
        lines.push(` network ${net.network}${net.mask ? ` mask ${net.mask}` : ''}`);
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
