import { Device } from './Device';
import { DevicePosition, RouteEntry, OspfConfig, AclRule, DhcpPool, NatRule } from '../../types/network';
import { CliContext, CliExecutionResult } from '../../types/cli';
import { SubnetUtils } from '../network/Subnet';

export class Router extends Device {
  routingTable: RouteEntry[] = [];
  ospfConfig?: OspfConfig;
  dhcpPools: Map<string, DhcpPool> = new Map();
  dhcpExcludedAddresses: string[] = [];
  accessLists: Map<number, AclRule[]> = new Map();
  natRules: NatRule[] = [];

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

  updateConnectedRoutes(): void {
    // Filter out previous connected and local routes
    this.routingTable = this.routingTable.filter(r => r.protocol !== 'C' && r.protocol !== 'L');

    const uniqueIfaces = Array.from(new Set(this.interfaces.values()));
    for (const iface of uniqueIfaces) {
      if (iface.status === 'up' && !iface.isShutdown && iface.ipAddress && iface.subnetMask) {
        const netAddr = SubnetUtils.getNetworkAddress(iface.ipAddress, iface.subnetMask);
        const cidr = SubnetUtils.maskToCidr(iface.subnetMask);

        // Connected route
        this.routingTable.push({
          network: netAddr,
          mask: iface.subnetMask,
          cidr,
          exitInterface: iface.name,
          protocol: 'C',
          adminDistance: 0,
          metric: 0
        });

        // Local route (/32 host route)
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

  lookupRoute(destIp: string): RouteEntry | null {
    let bestMatch: RouteEntry | null = null;
    let longestPrefix = -1;

    for (const route of this.routingTable) {
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

    // Interfaces
    const uniqueIfaces = Array.from(new Set(this.interfaces.values()));
    for (const iface of uniqueIfaces) {
      lines.push(`interface ${iface.name}`);
      if (iface.description) lines.push(` description ${iface.description}`);
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
      for (const p of this.ospfConfig.passiveInterfaces) {
        lines.push(` passive-interface ${p}`);
      }
      lines.push('!');
    }

    // Static routes
    for (const route of this.routingTable) {
      if (route.protocol === 'S') {
        const next = route.nextHop || route.exitInterface;
        lines.push(`ip route ${route.network} ${route.mask} ${next}`);
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
