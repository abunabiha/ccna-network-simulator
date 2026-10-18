import { Device } from './Device';
import { DevicePosition, ArpEntry } from '../../types/network';
import { CliContext, CliExecutionResult } from '../../types/cli';
import { SubnetUtils } from '../network/Subnet';
import { TopologyTraversal } from '../network/TopologyTraversal';

export class Host extends Device {
  ipAddress: string = '';
  subnetMask: string = '';
  defaultGateway: string = '';
  dnsServer: string = '';
  isDhcp: boolean = false;
  arpTable: ArpEntry[] = [];

  constructor(id: string, hostname: string, deviceType: 'pc' | 'server' | 'cloud', position: DevicePosition) {
    super(id, hostname, deviceType, position);

    if (deviceType === 'cloud') {
      this.ipAddress = '192.168.1.1';
      this.subnetMask = '255.255.255.0';
      this.defaultGateway = '192.168.1.1';
      this.dnsServer = '8.8.8.8';

      this.addInterface({
        name: 'GigabitEthernet0/0',
        shortName: 'Gi0/0',
        macAddress: `0060.2f${Math.floor(Math.random() * 89 + 10)}.${Math.floor(Math.random() * 8999 + 1000)}`,
        status: 'up',
        isShutdown: false,
        speed: '1Gb/s',
        ipAddress: '192.168.1.1',
        subnetMask: '255.255.255.0'
      });
      this.addInterface({
        name: 'FastEthernet0',
        shortName: 'Fa0',
        macAddress: `0060.2f${Math.floor(Math.random() * 89 + 10)}.${Math.floor(Math.random() * 8999 + 1000)}`,
        status: 'up',
        isShutdown: false,
        speed: '100Mb/s',
        ipAddress: '192.168.1.1',
        subnetMask: '255.255.255.0'
      });
    } else {
      this.addInterface({
        name: 'FastEthernet0',
        shortName: 'Fa0',
        macAddress: `0060.2f${Math.floor(Math.random() * 89 + 10)}.${Math.floor(Math.random() * 8999 + 1000)}`,
        status: 'up',
        isShutdown: false,
        speed: '100Mb/s'
      });
    }
  }

  executeCli(commandLine: string, _context: CliContext, allDevices: Device[] = []): CliExecutionResult {
    const cmd = commandLine.trim();
    if (!cmd) return { output: '' };

    // Record command history on Host / PC
    this.commandHistory.push(cmd);
    if (this.commandHistory.length > 100) {
      this.commandHistory.shift();
    }

    const parts = cmd.split(/\s+/);
    const mainCmd = parts[0].toLowerCase();

    if (mainCmd === 'ipconfig') {
      if (parts[1] && parts[1].toLowerCase() === '/renew') {
        const res = TopologyTraversal.acquireHostDhcp(this, allDevices);
        this.ipAddress = res.ipAddress;
        this.subnetMask = res.subnetMask;
        this.defaultGateway = res.defaultGateway;
        this.dnsServer = res.dnsServer;
        this.isDhcp = res.success;

        const ifc = this.interfaces.get('FastEthernet0') || this.interfaces.get('GigabitEthernet0/0');
        if (ifc) {
          ifc.ipAddress = res.ipAddress;
          ifc.subnetMask = res.subnetMask;
        }

        if (res.success) {
          return {
            output: `
DHCP request successful.
FastEthernet0:
   IP Address..............: ${this.ipAddress}
   Subnet Mask.............: ${this.subnetMask}
   Default Gateway.........: ${this.defaultGateway}
`.trim()
          };
        } else {
          return {
            output: `
DHCP request failed. No DHCP server responded in this broadcast domain.
APIPA address has been configured.
FastEthernet0:
   IP Address..............: ${this.ipAddress}
   Subnet Mask.............: ${this.subnetMask}
   Default Gateway.........: ${this.defaultGateway}
`.trim()
          };
        }
      }

      if (parts[1] && parts[1].toLowerCase() === '/release') {
        this.ipAddress = '0.0.0.0';
        this.subnetMask = '0.0.0.0';
        this.defaultGateway = '0.0.0.0';
        this.isDhcp = false;
        const ifc = this.interfaces.get('FastEthernet0') || this.interfaces.get('GigabitEthernet0/0');
        if (ifc) {
          ifc.ipAddress = '0.0.0.0';
          ifc.subnetMask = '0.0.0.0';
        }
        return {
          output: `
FastEthernet0:
   IP Address..............: 0.0.0.0
   Subnet Mask.............: 0.0.0.0
   Default Gateway.........: 0.0.0.0
`.trim()
        };
      }

      if (parts[1] && parts[1].toLowerCase() === '/all') {
        const iface = this.interfaces.get('FastEthernet0') || this.interfaces.get('GigabitEthernet0/0');
        return {
          output: `
FastEthernet0 Connection:
   Physical Address........: ${iface?.macAddress || '0000.0000.0000'}
   DHCP Enabled............: ${this.isDhcp ? 'Yes' : 'No'}
   IP Address..............: ${this.ipAddress || '0.0.0.0'}
   Subnet Mask.............: ${this.subnetMask || '0.0.0.0'}
   Default Gateway.........: ${this.defaultGateway || '0.0.0.0'}
   DNS Server..............: ${this.dnsServer || '0.0.0.0'}
`.trim()
        };
      }

      return {
        output: `
FastEthernet0:
   IP Address..............: ${this.ipAddress || '0.0.0.0'}
   Subnet Mask.............: ${this.subnetMask || '0.0.0.0'}
   Default Gateway.........: ${this.defaultGateway || '0.0.0.0'}
`.trim()
      };
    }

    if (mainCmd === 'arp') {
      if (parts[1] === '-a') {
        if (this.arpTable.length === 0) {
          return { output: 'No ARP Entries Found.' };
        }
        const lines = ['Internet Address      Physical Address      Type'];
        for (const entry of this.arpTable) {
          lines.push(`${entry.ipAddress.padEnd(21)} ${entry.macAddress.padEnd(21)} dynamic`);
        }
        return { output: lines.join('\n') };
      }
      return { output: 'Usage: arp -a' };
    }

    if (mainCmd === 'ping') {
      if (parts.length < 2) {
        return {
          output: `
Usage: ping [-n count] [-l size] target_name

Options:
    target_name    Target IPv4 address or domain name (e.g., 8.8.8.8, google.com)
`.trim()
        };
      }

      const target = parts[1].trim();

      // Check if IP is configured on this host
      if (!this.ipAddress || this.ipAddress === '0.0.0.0' || this.ipAddress.startsWith('169.254.')) {
        return {
          output: `IP address is not configured on FastEthernet0 or APIPA is active. Please configure static IP or verify DHCP.`
        };
      }

      // Domain resolution
      let resolvedIp = target;
      let isDomain = false;
      if (!SubnetUtils.isValidIpv4(target)) {
        isDomain = true;
        const domainMap: Record<string, string> = {
          'google.com': '173.194.116.138',
          'www.google.com': '173.194.116.138',
          'dns.google': '8.8.8.8',
          'cisco.com': '72.163.4.185',
          'www.cisco.com': '72.163.4.185',
          'cloudflare.com': '104.16.132.229',
          'one.one.one.one': '1.1.1.1'
        };

        const lowerTarget = target.toLowerCase();
        if (domainMap[lowerTarget]) {
          resolvedIp = domainMap[lowerTarget];
        } else if (lowerTarget.includes('.')) {
          resolvedIp = '173.194.' + (Math.abs(target.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 250 + 1) + '.138';
        } else {
          return {
            output: `Ping request could not find host ${target}. Please check the name and try again.`
          };
        }

        if (!this.dnsServer && !this.defaultGateway) {
          return {
            output: `Ping request could not find host ${target}. No DNS server or default gateway configured.`
          };
        }
      }

      const header = isDomain
        ? `Pinging ${target} [${resolvedIp}] with 32 bytes of data:`
        : `Pinging ${resolvedIp} with 32 bytes of data:`;

      // Reachability evaluation via TopologyTraversal
      const reachability = TopologyTraversal.evaluateHostReachability(this, resolvedIp, allDevices);

      if (reachability.isReachable) {
        const isLan = resolvedIp.startsWith('192.168.') || resolvedIp.startsWith('10.');
        const t1 = isLan ? Math.floor(Math.random() * 3 + 1) : Math.floor(Math.random() * 6 + 12);
        const t2 = isLan ? Math.floor(Math.random() * 3 + 1) : Math.floor(Math.random() * 6 + 12);
        const t3 = isLan ? Math.floor(Math.random() * 3 + 1) : Math.floor(Math.random() * 6 + 12);
        const t4 = isLan ? Math.floor(Math.random() * 3 + 1) : Math.floor(Math.random() * 6 + 12);
        const minT = Math.min(t1, t2, t3, t4);
        const maxT = Math.max(t1, t2, t3, t4);
        const avgT = Math.round((t1 + t2 + t3 + t4) / 4);
        const ttl = isLan ? 128 : 117;

        return {
          output: `
${header}
Reply from ${resolvedIp}: bytes=32 time=${t1}ms TTL=${ttl}
Reply from ${resolvedIp}: bytes=32 time=${t2}ms TTL=${ttl}
Reply from ${resolvedIp}: bytes=32 time=${t3}ms TTL=${ttl}
Reply from ${resolvedIp}: bytes=32 time=${t4}ms TTL=${ttl}

Ping statistics for ${resolvedIp}:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = ${minT}ms, Maximum = ${maxT}ms, Average = ${avgT}ms
`.trim()
        };
      }

      if (reachability.icmpType === 'dest-net-unreachable') {
        const responder = reachability.respondingIp || this.defaultGateway;
        return {
          output: `
${header}
Reply from ${responder}: Destination net unreachable.
Reply from ${responder}: Destination net unreachable.
Reply from ${responder}: Destination net unreachable.
Reply from ${responder}: Destination net unreachable.

Ping statistics for ${resolvedIp}:
    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)
`.trim()
        };
      }

      if (reachability.icmpType === 'dest-host-unreachable') {
        return {
          output: `
${header}
Destination host unreachable.
Destination host unreachable.
Destination host unreachable.
Destination host unreachable.

Ping statistics for ${resolvedIp}:
    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)
`.trim()
        };
      }

      return {
        output: `
${header}
Request timed out.
Request timed out.
Request timed out.
Request timed out.

Ping statistics for ${resolvedIp}:
    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)
`.trim()
      };
    }

    if (mainCmd === 'tracert') {
      if (parts.length < 2) {
        return { output: `Usage: tracert target_name` };
      }
      const target = parts[1].trim();
      let resolvedIp = target;
      if (!SubnetUtils.isValidIpv4(target)) {
        resolvedIp = '173.194.116.138';
      }

      const reachability = TopologyTraversal.evaluateHostReachability(this, resolvedIp, allDevices);

      if (reachability.isReachable && reachability.hops && reachability.hops.length > 0) {
        const hopLines = reachability.hops.map((hop, idx) => {
          const ms = idx === 0 ? '1 ms' : `${idx * 4 + 5} ms`;
          return `  ${idx + 1}    ${ms}    ${ms}    ${ms}  ${hop}`;
        });
        return {
          output: `
Tracing route to ${target} [${resolvedIp}] over a maximum of 30 hops:

${hopLines.join('\n')}

Trace complete.
`.trim()
        };
      }

      const gw = this.defaultGateway || '192.168.1.1';
      return {
        output: `
Tracing route to ${target} [${resolvedIp}] over a maximum of 30 hops:

  1     1 ms     1 ms     1 ms  ${gw}
  2     *        *        *     Request timed out.
  3     *        *        *     Request timed out.

Trace complete.
`.trim()
      };
    }

    if (mainCmd === 'help' || mainCmd === '?') {
      return {
        output: `
Available commands:
  ipconfig          Display IP configuration
  ipconfig /all     Display full IP & MAC configuration
  ping <target>     Send ICMP Echo requests to target IP or domain (e.g. 8.8.8.8, google.com)
  tracert <target>  Trace route to target IP or domain
  arp -a            Display ARP cache table
`.trim()
      };
    }

    return {
      output: `'${mainCmd}' is not recognized as an internal or external command.`
    };
  }

  getRunningConfig(): string {
    return `
Host: ${this.hostname} (${this.deviceType.toUpperCase()})
IP Address: ${this.ipAddress || 'None'}
Subnet Mask: ${this.subnetMask || 'None'}
Default Gateway: ${this.defaultGateway || 'None'}
DNS Server: ${this.dnsServer || 'None'}
DHCP: ${this.isDhcp ? 'Enabled' : 'Disabled'}
`.trim();
  }
}
