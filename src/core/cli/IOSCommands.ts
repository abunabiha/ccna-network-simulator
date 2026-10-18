import { CliContext, CliExecutionResult, CommandHelpItem } from '../../types/cli';
import { RouteEntry, DhcpPool, InterfaceConfig } from '../../types/network';
import { Router } from '../devices/Router';
import { Switch } from '../devices/Switch';
import { Device } from '../devices/Device';
import { Host } from '../devices/Host';
import { CliLexer } from './Lexer';
import { SubnetUtils } from '../network/Subnet';

export class IOSCommands {
  /**
   * Mendapatkan daftar bantuan kontekstual '?' berdasarkan mode saat ini
   */
  static getHelp(context: CliContext, device: Device): CommandHelpItem[] {
    const list: CommandHelpItem[] = [];

    switch (context.mode) {
      case 'user-exec':
        list.push(
          { command: 'enable', description: 'Turn on privileged commands' },
          { command: 'ping', description: 'Send echo messages' },
          { command: 'traceroute', description: 'Trace route to destination' },
          { command: 'show', description: 'Show running system information' },
          { command: 'show ip arp', description: 'IP ARP table' },
          { command: 'show arp', description: 'ARP table' },
          { command: 'exit', description: 'Exit from the EXEC' }
        );
        break;

      case 'priv-exec':
        list.push(
          { command: 'configure terminal', description: 'Enter configuration mode' },
          { command: 'disable', description: 'Turn off privileged commands' },
          { command: 'show running-config', description: 'Current operating configuration' },
          { command: 'show ip interface brief', description: 'IP interface status and configuration' },
          { command: 'show ip route', description: 'IP routing table' },
          { command: 'show vlan brief', description: 'VTP VLAN status' },
          { command: 'show mac address-table', description: 'MAC forwarding table' },
          { command: 'show interfaces trunk', description: 'Trunking interfaces' },
          { command: 'show ip ospf neighbor', description: 'OSPF neighbor information' },
          { command: 'show ip nat translations', description: 'NAT translation table' },
          { command: 'show access-lists', description: 'List access lists' },
          { command: 'show port-security', description: 'Show port security status' },
          { command: 'show version', description: 'System hardware and software status' },
          { command: 'show cdp', description: 'CDP information' },
          { command: 'show cdp neighbors', description: 'CDP neighbor information' },
          { command: 'show cdp neighbors detail', description: 'Detailed CDP neighbor information' },
          { command: 'show cdp interface', description: 'CDP interface status and configuration' },
          { command: 'show ip dhcp binding', description: 'DHCP address bindings' },
          { command: 'show ip dhcp pool', description: 'DHCP pool information' },
          { command: 'show dhcp lease', description: 'Show DHCP client leases' },
          { command: 'show ip arp', description: 'IP ARP table' },
          { command: 'show arp', description: 'ARP table' },
          { command: 'clear ip arp', description: 'Clear ARP cache' },
          { command: 'clear arp', description: 'Clear ARP cache' },
          { command: 'clear ip dhcp binding *', description: 'Clear DHCP bindings' },
          { command: 'copy running-config startup-config', description: 'Copy configuration to NVRAM' },
          { command: 'write memory', description: 'Save running configuration' },
          { command: 'ping', description: 'Send echo messages' },
          { command: 'traceroute', description: 'Trace route to destination' },
          { command: 'reload', description: 'Halt and perform a cold restart' },
          { command: 'exit', description: 'Exit from the EXEC' }
        );
        break;

      case 'global-config':
        list.push(
          { command: 'hostname', description: 'Set system network name' },
          { command: 'enable secret', description: 'Assign the privileged level secret' },
          { command: 'enable password', description: 'Assign the privileged level password' },
          { command: 'service password-encryption', description: 'Encrypt system passwords' },
          { command: 'banner motd', description: 'Define a login banner' },
          { command: 'interface', description: 'Select an interface to configure' },
          { command: 'arp', description: 'Set a static ARP entry' },
          { command: 'no arp', description: 'Remove a static ARP entry' },
          { command: 'ip route', description: 'Establish static routes' },
          { command: 'ip routing', description: 'Enable IP routing' },
          { command: 'no ip routing', description: 'Disable IP routing' },
          { command: 'cdp run', description: 'Enable CDP globally' },
          { command: 'no cdp run', description: 'Disable CDP globally' },
          { command: 'cdp timer', description: 'Specify the rate at which CDP packets are sent' },
          { command: 'cdp holdtime', description: 'Specify the holdtime value to be sent in packets' },
          { command: 'router ospf', description: 'Enable OSPF routing protocol' },
          { command: 'ip dhcp pool', description: 'Configure DHCP server pool' },
          { command: 'ip dhcp excluded-address', description: 'Prevent IP addresses from being assigned' },
          { command: 'ip default-gateway', description: 'Specify default gateway' },
          { command: 'access-list', description: 'Add an access list entry' },
          { command: 'ip nat', description: 'NAT configuration commands' },
          { command: 'line', description: 'Configure a terminal line' },
          { command: 'do', description: 'To run privileged exec commands' },
          { command: 'exit', description: 'Exit from configure mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        if (device instanceof Switch) {
          list.push(
            { command: 'vlan', description: 'Vlan configuration commands' },
            { command: 'spanning-tree', description: 'Spanning Tree Subsystem' }
          );
        }
        break;

      case 'interface-config':
      case 'subinterface-config':
        list.push(
          { command: 'ip address', description: 'Set the IP address of an interface' },
          { command: 'ip address dhcp', description: 'Acquire IP address via DHCP' },
          { command: 'no ip address', description: 'Remove IP address' },
          { command: 'no shutdown', description: 'Enable interface' },
          { command: 'shutdown', description: 'Shut down interface' },
          { command: 'cdp enable', description: 'Enable CDP on interface' },
          { command: 'no cdp enable', description: 'Disable CDP on interface' },
          { command: 'description', description: 'Interface specific description' },
          { command: 'duplex', description: 'Configure duplex operation' },
          { command: 'speed', description: 'Configure speed operation' },
          { command: 'do', description: 'To run privileged exec commands' },
          { command: 'exit', description: 'Exit from interface configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        if (device instanceof Router) {
          list.push(
            { command: 'clock rate', description: 'Configure serial clock rate for DCE interfaces' },
            { command: 'encapsulation', description: 'Set interface encapsulation (hdlc, ppp, dot1Q)' },
            { command: 'encapsulation dot1Q', description: 'Set IEEE 802.1Q encapsulation' },
            { command: 'ip nat inside', description: 'Designate interface as inside network' },
            { command: 'ip nat outside', description: 'Designate interface as outside network' }
          );
        }
        if (device instanceof Switch) {
          list.push(
            { command: 'no switchport', description: 'Set interface to routed mode' },
            { command: 'switchport mode', description: 'Set trunk or access mode' },
            { command: 'switchport access vlan', description: 'Set access mode VLAN' },
            { command: 'switchport trunk allowed vlan', description: 'Set allowed VLAN list on trunk' },
            { command: 'switchport trunk native vlan', description: 'Set native VLAN on trunk' },
            { command: 'switchport port-security', description: 'Security related command' }
          );
        }
        break;

      case 'vlan-config':
        list.push(
          { command: 'name', description: 'Ascii name of the VLAN' },
          { command: 'exit', description: 'Apply changes and exit' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'dhcp-config':
        list.push(
          { command: 'network', description: 'Subnet network number and mask' },
          { command: 'default-router', description: 'Default routers' },
          { command: 'dns-server', description: 'DNS servers' },
          { command: 'domain-name', description: 'Domain name' },
          { command: 'lease', description: 'Address lease time' },
          { command: 'exit', description: 'Exit from DHCP configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'router-config':
        list.push(
          { command: 'network', description: 'Enable routing on an IP network' },
          { command: 'router-id', description: 'Set OSPF router identifier' },
          { command: 'passive-interface', description: 'Suppress routing updates on an interface' },
          { command: 'exit', description: 'Exit from router configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'line-config':
        list.push(
          { command: 'password', description: 'Set a password' },
          { command: 'login', description: 'Enable password checking' },
          { command: 'transport input', description: 'Define which protocols to use on this line' },
          { command: 'exit', description: 'Exit from line configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;
    }

    return list;
  }

  /**
   * Eksekusi baris perintah Cisco IOS
   */
  static execute(
    input: string,
    context: CliContext,
    device: Device,
    allDevices: Device[] = []
  ): CliExecutionResult {
    const raw = input.trim();
    if (!raw) return { output: '' };

    // Simpan ke command history
    device.commandHistory.push(raw);

    const tokens = CliLexer.tokenize(raw);
    if (tokens.length === 0) return { output: '' };

    const first = tokens[0].toLowerCase();

    // 1. Tangani perintah navigasi universal: exit / end / do
    if (first === 'exit') {
      if (context.mode === 'user-exec') {
        return { output: `[Connection to ${device.hostname} closed]` };
      }
      if (context.mode === 'priv-exec') {
        return { output: '', newMode: 'user-exec' };
      }
      if (['interface-config', 'subinterface-config', 'vlan-config', 'router-config', 'line-config', 'dhcp-config'].includes(context.mode)) {
        return { output: '', newMode: 'global-config' };
      }
      if (context.mode === 'global-config') {
        return { output: '', newMode: 'priv-exec' };
      }
    }

    if (first === 'end' || first === 'ctrl-z') {
      if (context.mode !== 'user-exec' && context.mode !== 'priv-exec') {
        return { output: '', newMode: 'priv-exec' };
      }
    }

    // Tangani 'do <cmd>'
    if (first === 'do' && tokens.length > 1) {
      const innerCmd = raw.replace(/^do\s+/i, '');
      const fakeContext: CliContext = { ...context, mode: 'priv-exec' };
      return this.execute(innerCmd, fakeContext, device, allDevices);
    }

    // 2. Eksekusi berdasarkan Mode
    switch (context.mode) {
      case 'user-exec':
        return this.execUserMode(tokens, context, device, allDevices);
      case 'priv-exec':
        return this.execPrivMode(tokens, context, device, allDevices);
      case 'global-config':
        return this.execGlobalConfigMode(tokens, raw, context, device, allDevices);
      case 'interface-config':
      case 'subinterface-config':
        return this.execInterfaceConfigMode(tokens, raw, context, device, allDevices);
      case 'vlan-config':
        return this.execVlanConfigMode(tokens, context, device);
      case 'router-config':
        return this.execRouterConfigMode(tokens, context, device);
      case 'line-config':
        return this.execLineConfigMode(tokens, context, device);
      case 'dhcp-config':
        return this.execDhcpConfigMode(tokens, raw, context, device);
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== USER EXEC MODE =====================
  private static execUserMode(
    tokens: string[],
    context: CliContext,
    device: Device,
    allDevices: Device[]
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();

    if ('enable'.startsWith(cmd0)) {
      return { output: '', newMode: 'priv-exec' };
    }

    if ('ping'.startsWith(cmd0) && tokens.length > 1) {
      return this.handlePing(tokens[1], device, allDevices);
    }

    if ('show'.startsWith(cmd0) && tokens.length > 1) {
      const cmd1 = tokens[1].toLowerCase();
      if ('version'.startsWith(cmd1)) {
        return { output: this.renderVersion(device) };
      }
      if ('cdp'.startsWith(cmd1)) {
        return this.handleShowCdp(tokens, device, allDevices);
      }
      if ('arp'.startsWith(cmd1)) {
        return this.handleShowIpArp(tokens.slice(2), device);
      }
      if ('ip'.startsWith(cmd1) && tokens.length > 2 && 'arp'.startsWith(tokens[2].toLowerCase())) {
        return this.handleShowIpArp(tokens.slice(3), device);
      }
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== PRIVILEGED EXEC MODE =====================
  private static execPrivMode(
    tokens: string[],
    _context: CliContext,
    device: Device,
    allDevices: Device[]
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();

    if ('disable'.startsWith(cmd0)) {
      return { output: '', newMode: 'user-exec' };
    }

    // configure terminal / conf t
    if ('configure'.startsWith(cmd0)) {
      if (tokens.length >= 2 && 'terminal'.startsWith(tokens[1].toLowerCase())) {
        return {
          output: `Enter configuration commands, one per line. End with CNTL/Z.`,
          newMode: 'global-config'
        };
      }
      return { output: `% Incomplete command.` };
    }

    // ping
    if ('ping'.startsWith(cmd0) && tokens.length > 1) {
      return this.handlePing(tokens[1], device, allDevices);
    }

    // copy running-config startup-config / wr mem
    if (
      cmd0 === 'wr' ||
      (cmd0 === 'write' && (tokens.length === 1 || 'memory'.startsWith(tokens[1].toLowerCase()))) ||
      ('copy'.startsWith(cmd0) && tokens.length >= 3 && 'running-config'.startsWith(tokens[1].toLowerCase()) && 'startup-config'.startsWith(tokens[2].toLowerCase()))
    ) {
      return {
        output: `Building configuration...\n[OK]`
      };
    }

    // clear ip arp / clear arp
    if (cmd0 === 'clear' && tokens.length >= 2) {
      const cmd1 = tokens[1].toLowerCase();
      if ('arp'.startsWith(cmd1)) {
        return this.handleClearArp(tokens.slice(2), device);
      }
      if ('ip'.startsWith(cmd1) && tokens.length >= 3 && 'arp'.startsWith(tokens[2].toLowerCase())) {
        return this.handleClearArp(tokens.slice(3), device);
      }
    }

    // clear ip dhcp binding *
    if (cmd0 === 'clear' && tokens.length >= 4 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'dhcp'.startsWith(tokens[2].toLowerCase()) && 'binding'.startsWith(tokens[3].toLowerCase())) {
      return { output: '' };
    }

    // reload
    if ('reload'.startsWith(cmd0)) {
      return {
        output: `Proceed with reload? [confirm]\n\nSystem Bootstrap, Version 15.4(3)M2\nSystem restarted at ${new Date().toLocaleTimeString()}`
      };
    }

    // show commands
    if ('show'.startsWith(cmd0)) {
      if (tokens.length < 2) return { output: `% Incomplete command.` };
      const cmd1 = tokens[1].toLowerCase();

      // show running-config
      if ('running-config'.startsWith(cmd1) || cmd1 === 'run') {
        return { output: device.getRunningConfig() };
      }

      // show version
      if ('version'.startsWith(cmd1)) {
        return { output: this.renderVersion(device) };
      }

      // show ip ...
      if ('ip'.startsWith(cmd1)) {
        if (tokens.length < 3) return { output: `% Incomplete command.` };
        const cmd2 = tokens[2].toLowerCase();

        // show ip arp
        if ('arp'.startsWith(cmd2)) {
          return this.handleShowIpArp(tokens.slice(3), device);
        }

        // show ip interface brief
        if ('interface'.startsWith(cmd2) || cmd2 === 'int') {
          if (tokens.length >= 4 && 'brief'.startsWith(tokens[3].toLowerCase())) {
            return { output: this.renderIpInterfaceBrief(device) };
          }
        }

        // show ip route
        if ('route'.startsWith(cmd2)) {
          return { output: this.renderIpRoute(device) };
        }

        // show ip ospf neighbor
        if ('ospf'.startsWith(cmd2)) {
          if (tokens.length >= 4 && 'neighbor'.startsWith(tokens[3].toLowerCase())) {
            return { output: this.renderOspfNeighbors(device, allDevices) };
          }
        }

        // show ip nat translations
        if ('nat'.startsWith(cmd2)) {
          return { output: this.renderNatTranslations(device) };
        }

        // show ip dhcp ...
        if ('dhcp'.startsWith(cmd2)) {
          if (tokens.length >= 4) {
            const cmd3 = tokens[3].toLowerCase();
            if ('binding'.startsWith(cmd3)) {
              return { output: this.renderIpDhcpBinding(device, allDevices) };
            }
            if ('pool'.startsWith(cmd3)) {
              return { output: this.renderDhcpPool(device) };
            }
            if ('conflict'.startsWith(cmd3)) {
              return { output: 'IP address        Detection method   Detection time\n' };
            }
            if ('lease'.startsWith(cmd3) || ('client'.startsWith(cmd3) && tokens[4] && 'lease'.startsWith(tokens[4].toLowerCase()))) {
              return { output: this.renderDhcpClientLease(device) };
            }
          }
        }
      }

      // show dhcp lease
      if ('dhcp'.startsWith(cmd1)) {
        if (tokens.length >= 3 && 'lease'.startsWith(tokens[2].toLowerCase())) {
          return { output: this.renderDhcpClientLease(device) };
        }
      }

      // show vlan brief
      if ('vlan'.startsWith(cmd1)) {
        return { output: this.renderVlanBrief(device) };
      }

      // show mac address-table
      if ('mac'.startsWith(cmd1) || cmd1 === 'mac-address-table') {
        return { output: this.renderMacAddressTable(device) };
      }

      // show interfaces trunk
      if ('interfaces'.startsWith(cmd1) && tokens.length >= 3 && 'trunk'.startsWith(tokens[2].toLowerCase())) {
        return { output: this.renderInterfacesTrunk(device) };
      }

      // show access-lists
      if ('access-lists'.startsWith(cmd1)) {
        return { output: this.renderAccessLists(device) };
      }

      // show port-security
      if ('port-security'.startsWith(cmd1)) {
        return { output: this.renderPortSecurity(device) };
      }

      // show arp
      if ('arp'.startsWith(cmd1)) {
        return this.handleShowIpArp(tokens.slice(2), device);
      }

      // show cdp ...
      if ('cdp'.startsWith(cmd1)) {
        return this.handleShowCdp(tokens, device, allDevices);
      }
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== GLOBAL CONFIG MODE =====================
  private static execGlobalConfigMode(
    tokens: string[],
    raw: string,
    context: CliContext,
    device: Device,
    _allDevices: Device[] = []
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();

    // hostname <name>
    if ('hostname'.startsWith(cmd0) && tokens.length > 1) {
      device.hostname = tokens[1];
      return { output: '' };
    }

    // enable secret / password
    if ('enable'.startsWith(cmd0) && tokens.length >= 3) {
      const type = tokens[1].toLowerCase();
      if ('secret'.startsWith(type)) {
        device.enableSecret = tokens[2];
        return { output: '' };
      }
      if ('password'.startsWith(type)) {
        device.enablePassword = tokens[2];
        return { output: '' };
      }
    }

    // service password-encryption
    if ('service'.startsWith(cmd0) && tokens.length >= 2 && 'password-encryption'.startsWith(tokens[1].toLowerCase())) {
      device.servicePasswordEncryption = true;
      return { output: '' };
    }

    // banner motd
    if ('banner'.startsWith(cmd0) && tokens.length >= 2 && 'motd'.startsWith(tokens[1].toLowerCase())) {
      const match = raw.match(/banner\s+motd\s+(\S)([\s\S]*)\1/i);
      if (match) {
        device.bannerMotd = match[2].trim();
        return { output: '' };
      }
    }

    // ip routing
    if ('ip'.startsWith(cmd0) && tokens.length >= 2 && 'routing'.startsWith(tokens[1].toLowerCase())) {
      device.ipRouting = true;
      return { output: '' };
    }

    // interface <name> / int <name>
    if ('interface'.startsWith(cmd0) || cmd0 === 'int') {
      if (tokens.length < 2) return { output: `% Incomplete command.` };
      const rawPortName = tokens.slice(1).join('');
      const normalized = CliLexer.normalizeInterfaceName(rawPortName);

      // Cek apakah sub-interface (misal GigabitEthernet0/0.10)
      if (normalized.includes('.')) {
        if (!(device instanceof Router)) {
          return { output: `% Subinterfaces are not supported on this device.` };
        }
        let iface = device.interfaces.get(normalized);
        if (!iface) {
          const parentName = normalized.split('.')[0];
          const parentIface = device.interfaces.get(parentName);
          if (!parentIface) {
            return { output: `% Parent interface ${parentName} does not exist.` };
          }
          iface = {
            name: normalized,
            shortName: normalized.replace('GigabitEthernet', 'Gi').replace('FastEthernet', 'Fa'),
            macAddress: parentIface.macAddress,
            status: parentIface.status,
            isShutdown: parentIface.isShutdown,
            isSubinterface: true,
            parentInterface: parentName
          };
          device.addInterface(iface);
        }
        return {
          output: '',
          newMode: 'subinterface-config',
          contextUpdates: { targetInterface: normalized }
        };
      }

      // Regular interface
      let iface = device.interfaces.get(normalized);
      if (!iface && normalized.startsWith('Vlan') && device instanceof Switch) {
        // Create SVI if switch
        const vlanId = parseInt(normalized.replace('Vlan', ''), 10);
        device.addVlan(vlanId);
        iface = device.interfaces.get(normalized);
      }

      if (iface) {
        return {
          output: '',
          newMode: 'interface-config',
          contextUpdates: { targetInterface: normalized }
        };
      }
      return { output: `% Invalid interface type and number.` };
    }

    // vlan <id>
    if ('vlan'.startsWith(cmd0) && tokens.length > 1) {
      if (device instanceof Switch) {
        const vlanId = parseInt(tokens[1], 10);
        if (isNaN(vlanId) || vlanId < 1 || vlanId > 4094) {
          return { output: `% Invalid VLAN number.` };
        }
        device.addVlan(vlanId);
        return {
          output: '',
          newMode: 'vlan-config',
          contextUpdates: { targetVlan: vlanId }
        };
      }
    }

    // router ospf <id>
    if ('router'.startsWith(cmd0) && tokens.length >= 3 && 'ospf'.startsWith(tokens[1].toLowerCase())) {
      if (device instanceof Router || (device instanceof Switch && device.isLayer3)) {
        const pid = parseInt(tokens[2], 10);
        if (isNaN(pid) || pid < 1 || pid > 65535) return { output: `% Invalid process ID.` };

        const target = device as Router;
        if (!target.ospfConfig) {
          target.ospfConfig = {
            enabled: true,
            processId: pid,
            networks: [],
            passiveInterfaces: []
          };
        } else {
          target.ospfConfig.enabled = true;
          target.ospfConfig.processId = pid;
        }
        return {
          output: '',
          newMode: 'router-config',
          contextUpdates: { targetRoutingProcess: `ospf-${pid}` }
        };
      }
    }

    // ip route <network> <mask> <next-hop>
    if ('ip'.startsWith(cmd0) && tokens.length >= 5 && 'route'.startsWith(tokens[1].toLowerCase())) {
      const net = tokens[2];
      const mask = tokens[3];
      const next = tokens[4];

      if (!SubnetUtils.isValidIpv4(net) || !SubnetUtils.isValidSubnetMask(mask)) {
        return { output: `% Invalid IP address or mask.` };
      }

      const cidr = SubnetUtils.maskToCidr(mask);
      const isExitIf = next.startsWith('Gi') || next.startsWith('Fa') || next.startsWith('Se');
      const normExit = isExitIf ? CliLexer.normalizeInterfaceName(next) : undefined;

      const routeEntry = {
        network: net,
        mask,
        cidr,
        nextHop: isExitIf ? undefined : next,
        exitInterface: normExit,
        protocol: 'S' as const,
        adminDistance: 1,
        metric: 0
      };

      if (device instanceof Router) {
        device.routingTable = device.routingTable.filter(r => !(r.network === net && r.mask === mask));
        device.routingTable.push(routeEntry);
        return { output: '' };
      } else if (device instanceof Switch && device.isLayer3) {
        device.routingTable = device.routingTable.filter(r => !(r.network === net && r.mask === mask));
        device.routingTable.push(routeEntry);
        return { output: '' };
      }
    }

    // ip dhcp pool <name>
    if ('ip'.startsWith(cmd0) && tokens.length >= 4 && 'dhcp'.startsWith(tokens[1].toLowerCase()) && 'pool'.startsWith(tokens[2].toLowerCase())) {
      const poolName = tokens[3];
      if (device instanceof Router || device instanceof Switch) {
        if (!device.dhcpPools.has(poolName)) {
          device.dhcpPools.set(poolName, { name: poolName, network: '', mask: '' });
        }
      }
      return {
        output: '',
        newMode: 'dhcp-config',
        contextUpdates: { targetDhcpPool: poolName }
      };
    }

    // no ip dhcp pool <name>
    if (cmd0 === 'no' && tokens.length >= 5 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'dhcp'.startsWith(tokens[2].toLowerCase()) && 'pool'.startsWith(tokens[3].toLowerCase())) {
      const poolName = tokens[4];
      if (device instanceof Router || device instanceof Switch) {
        device.dhcpPools.delete(poolName);
      }
      return { output: '' };
    }

    // ip dhcp excluded-address <low> [high]
    if ('ip'.startsWith(cmd0) && tokens.length >= 4 && 'dhcp'.startsWith(tokens[1].toLowerCase()) && 'excluded-address'.startsWith(tokens[2].toLowerCase())) {
      const low = tokens[3];
      const high = tokens[4];
      const entry = high ? `${low} ${high}` : low;
      if (device instanceof Router || device instanceof Switch) {
        if (!device.dhcpExcludedAddresses.includes(entry)) {
          device.dhcpExcludedAddresses.push(entry);
        }
      }
      return { output: '' };
    }

    // no ip dhcp excluded-address <low> [high]
    if (cmd0 === 'no' && tokens.length >= 5 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'dhcp'.startsWith(tokens[2].toLowerCase()) && 'excluded-address'.startsWith(tokens[3].toLowerCase())) {
      const low = tokens[4];
      const high = tokens[5];
      const entry = high ? `${low} ${high}` : low;
      if (device instanceof Router || device instanceof Switch) {
        device.dhcpExcludedAddresses = device.dhcpExcludedAddresses.filter(e => e !== entry && !e.startsWith(low));
      }
      return { output: '' };
    }

    // ip default-gateway <ip>
    if ('ip'.startsWith(cmd0) && tokens.length >= 3 && 'default-gateway'.startsWith(tokens[1].toLowerCase())) {
      const gw = tokens[2];
      if (!SubnetUtils.isValidIpv4(gw)) {
        return { output: `% Invalid IP address.` };
      }
      if (device instanceof Switch) {
        device.defaultGateway = gw;
      }
      return { output: '' };
    }

    // no ip default-gateway
    if (cmd0 === 'no' && tokens.length >= 3 && 'default-gateway'.startsWith(tokens[2].toLowerCase())) {
      if (device instanceof Switch) {
        device.defaultGateway = undefined;
      }
      return { output: '' };
    }

    // arp <ip> <mac> arpa [interface]
    if (cmd0 === 'arp' && tokens.length >= 4) {
      return this.handleStaticArp(tokens, device);
    }
    // no arp <ip>
    if (cmd0 === 'no' && tokens.length >= 3 && 'arp'.startsWith(tokens[1].toLowerCase())) {
      const ip = tokens[2];
      const removed = device.removeArpEntry(ip);
      return { output: removed ? '' : `% Entry not found for ${ip}` };
    }

    // cdp run / no cdp run
    if ('cdp'.startsWith(cmd0) && tokens.length >= 2 && 'run'.startsWith(tokens[1].toLowerCase())) {
      device.cdpEnabled = true;
      return { output: '' };
    }
    if (cmd0 === 'no' && tokens.length >= 3 && 'cdp'.startsWith(tokens[1].toLowerCase()) && 'run'.startsWith(tokens[2].toLowerCase())) {
      device.cdpEnabled = false;
      return { output: '' };
    }

    // cdp timer <5-254>
    if ('cdp'.startsWith(cmd0) && tokens.length >= 3 && 'timer'.startsWith(tokens[1].toLowerCase())) {
      const sec = parseInt(tokens[2], 10);
      if (!isNaN(sec) && sec >= 5 && sec <= 254) {
        device.cdpTimer = sec;
        return { output: '' };
      }
      return { output: '% Invalid timer value (5-254)' };
    }

    // cdp holdtime <10-255>
    if ('cdp'.startsWith(cmd0) && tokens.length >= 3 && 'holdtime'.startsWith(tokens[1].toLowerCase())) {
      const sec = parseInt(tokens[2], 10);
      if (!isNaN(sec) && sec >= 10 && sec <= 255) {
        device.cdpHoldtime = sec;
        return { output: '' };
      }
      return { output: '% Invalid holdtime value (10-255)' };
    }

    // ip routing / no ip routing
    if (cmd0 === 'ip' && tokens.length >= 2 && 'routing'.startsWith(tokens[1].toLowerCase())) {
      device.ipRouting = true;
      if (device instanceof Switch && device.isLayer3) {
        device.updateL3ConnectedRoutes();
      }
      return { output: '' };
    }
    if (cmd0 === 'no' && tokens.length >= 3 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'routing'.startsWith(tokens[2].toLowerCase())) {
      device.ipRouting = false;
      if (device instanceof Switch && device.isLayer3) {
        device.routingTable = [];
      }
      return { output: '' };
    }

    // access-list <num> permit/deny ...
    if ('access-list'.startsWith(cmd0) && tokens.length >= 4) {
      const aclNum = parseInt(tokens[1], 10);
      const action = tokens[2].toLowerCase() as 'permit' | 'deny';
      if (isNaN(aclNum) || (action !== 'permit' && action !== 'deny')) {
        return { output: `% Invalid access-list syntax.` };
      }

      if (device instanceof Router) {
        const existing = device.accessLists.get(aclNum) || [];
        if (aclNum <= 99) {
          // Standard ACL: access-list <num> permit|deny <source-ip> [wildcard]
          existing.push({
            number: aclNum,
            action,
            sourceIp: tokens[3],
            sourceWildcard: tokens[4]
          });
        } else {
          // Extended ACL: access-list <num> permit|deny <protocol> <source> <src-wc> <dest> <dest-wc> [eq port]
          existing.push({
            number: aclNum,
            action,
            protocol: tokens[3] as any,
            sourceIp: tokens[4] || 'any',
            sourceWildcard: tokens[5],
            destIp: tokens[6],
            destWildcard: tokens[7]
          });
        }
        device.accessLists.set(aclNum, existing);
        return { output: '' };
      }
    }

    // line console 0 / line vty 0 4
    if ('line'.startsWith(cmd0) && tokens.length >= 2) {
      const lineType = tokens[1].toLowerCase();
      if ('console'.startsWith(lineType) || 'vty'.startsWith(lineType)) {
        return {
          output: '',
          newMode: 'line-config',
          contextUpdates: { targetLine: tokens.slice(1).join(' ') }
        };
      }
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== INTERFACE CONFIG MODE =====================
  private static execInterfaceConfigMode(
    tokens: string[],
    raw: string,
    context: CliContext,
    device: Device,
    allDevices: Device[] = []
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const ifaceName = context.targetInterface;
    if (!ifaceName) return { output: `% No interface selected.` };

    const iface = device.interfaces.get(ifaceName);
    if (!iface) return { output: `% Interface ${ifaceName} not found.` };

    // no shutdown
    if (cmd0 === 'no' && tokens.length >= 2 && 'shutdown'.startsWith(tokens[1].toLowerCase())) {
      iface.isShutdown = false;
      iface.status = 'up';
      let dhcpSyslog = '';
      if (iface.isDhcpClient) {
        const res = this.acquireDhcpLease(device, iface, allDevices);
        if (res.success) {
          dhcpSyslog = `\n%DHCP-6-ADDRESS_ASSIGN: Interface ${iface.name} assigned DHCP address ${iface.ipAddress}, mask ${iface.subnetMask}, hostname ${device.hostname}`;
        }
      }
      if (device instanceof Router) {
        device.updateConnectedRoutes();
      } else if (device instanceof Switch) {
        device.updateL3ConnectedRoutes();
      }
      return {
        output: `%LINK-3-UPDOWN: Interface ${iface.name}, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${iface.name}, changed state to up${dhcpSyslog}`
      };
    }

    // shutdown
    if ('shutdown'.startsWith(cmd0)) {
      iface.isShutdown = true;
      iface.status = 'down';
      if (device instanceof Router) {
        device.updateConnectedRoutes();
      } else if (device instanceof Switch) {
        device.updateL3ConnectedRoutes();
      }
      return {
        output: `%LINK-5-CHANGED: Interface ${iface.name}, changed state to administratively down\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${iface.name}, changed state to down`
      };
    }

    // ip address ...
    if ('ip'.startsWith(cmd0) && tokens.length >= 3 && 'address'.startsWith(tokens[1].toLowerCase())) {
      const arg2 = tokens[2].toLowerCase();

      // ip address dhcp
      if ('dhcp'.startsWith(arg2)) {
        iface.isDhcpClient = true;
        if (!iface.isShutdown) {
          const res = this.acquireDhcpLease(device, iface, allDevices);
          if (res.success) {
            return {
              output: `%DHCP-6-ADDRESS_ASSIGN: Interface ${iface.name} assigned DHCP address ${iface.ipAddress}, mask ${iface.subnetMask}, hostname ${device.hostname}`
            };
          } else {
            return {
              output: `%DHCP-4-ADDR_NOT_ALLOCATED: DHCP failed to allocate an IP address for interface ${iface.name}`
            };
          }
        }
        return { output: '' };
      }

      // ip address <ip> <mask>
      if (tokens.length >= 4) {
        const ip = tokens[2];
        const mask = tokens[3];
        if (!SubnetUtils.isValidIpv4(ip) || !SubnetUtils.isValidSubnetMask(mask)) {
          return { output: `% Invalid IP address or subnet mask.` };
        }
        iface.ipAddress = ip;
        iface.subnetMask = mask;
        iface.isDhcpClient = false;
        iface.dhcpLease = undefined;
        if (device instanceof Router) {
          device.routingTable = device.routingTable.filter(r => !(r.network === '0.0.0.0' && r.mask === '0.0.0.0' && r.adminDistance === 254 && r.exitInterface === iface.name));
          device.updateConnectedRoutes();
        } else if (device instanceof Switch && device.isLayer3) {
          device.routingTable = device.routingTable.filter(r => !(r.network === '0.0.0.0' && r.mask === '0.0.0.0' && r.adminDistance === 254 && r.exitInterface === iface.name));
          device.updateL3ConnectedRoutes();
        }
        return { output: '' };
      }
    }

    // no ip address [dhcp]
    if (cmd0 === 'no' && tokens.length >= 3 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'address'.startsWith(tokens[2].toLowerCase())) {
      iface.ipAddress = undefined;
      iface.subnetMask = undefined;
      iface.isDhcpClient = false;
      iface.dhcpLease = undefined;
      if (device instanceof Router) {
        device.routingTable = device.routingTable.filter(r => !(r.network === '0.0.0.0' && r.mask === '0.0.0.0' && r.adminDistance === 254 && r.exitInterface === iface.name));
        device.updateConnectedRoutes();
      } else if (device instanceof Switch && device.isLayer3) {
        device.routingTable = device.routingTable.filter(r => !(r.network === '0.0.0.0' && r.mask === '0.0.0.0' && r.adminDistance === 254 && r.exitInterface === iface.name));
        device.updateL3ConnectedRoutes();
      }
      return { output: '' };
    }

    // description <text>
    if ('description'.startsWith(cmd0) && tokens.length > 1) {
      iface.description = tokens.slice(1).join(' ');
      return { output: '' };
    }

    // encapsulation dot1Q <vlan> (Router subinterface)
    if ('encapsulation'.startsWith(cmd0) && tokens.length >= 3 && 'dot1q'.startsWith(tokens[1].toLowerCase())) {
      const vlan = parseInt(tokens[2], 10);
      if (isNaN(vlan) || vlan < 1 || vlan > 4094) return { output: `% Invalid VLAN.` };
      iface.dot1qVlan = vlan;
      return { output: '' };
    }

    // cdp enable / no cdp enable
    if (cmd0 === 'cdp' && tokens.length >= 2 && 'enable'.startsWith(tokens[1].toLowerCase())) {
      iface.cdpEnabled = true;
      return { output: '' };
    }
    if (cmd0 === 'no' && tokens.length >= 3 && 'cdp'.startsWith(tokens[1].toLowerCase()) && 'enable'.startsWith(tokens[2].toLowerCase())) {
      iface.cdpEnabled = false;
      return { output: '' };
    }

    // Switchport commands
    if (cmd0 === 'no' && tokens.length >= 2 && 'switchport'.startsWith(tokens[1].toLowerCase()) && device instanceof Switch) {
      iface.switchportMode = 'none' as any;
      return { output: '' };
    }

    if ('switchport'.startsWith(cmd0) && device instanceof Switch) {
      if (tokens.length === 1) {
        iface.switchportMode = 'access';
        return { output: '' };
      }
      if (tokens.length >= 3 && 'mode'.startsWith(tokens[1].toLowerCase())) {
        const mode = tokens[2].toLowerCase();
        if ('access'.startsWith(mode)) {
          iface.switchportMode = 'access';
          return { output: '' };
        }
        if ('trunk'.startsWith(mode)) {
          iface.switchportMode = 'trunk';
          return {
            output: `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${iface.name}, changed state to up`
          };
        }
      }

      // switchport access vlan <id>
      if (tokens.length >= 4 && 'access'.startsWith(tokens[1].toLowerCase()) && 'vlan'.startsWith(tokens[2].toLowerCase())) {
        const vlan = parseInt(tokens[3], 10);
        if (isNaN(vlan)) return { output: `% Invalid VLAN number.` };
        iface.accessVlan = vlan;
        device.addVlan(vlan);
        return { output: '' };
      }

      // switchport trunk native vlan <id>
      if (tokens.length >= 5 && 'trunk'.startsWith(tokens[1].toLowerCase()) && 'native'.startsWith(tokens[2].toLowerCase())) {
        const vlan = parseInt(tokens[4], 10);
        iface.nativeVlan = vlan;
        return { output: '' };
      }

      // switchport port-security
      if (tokens.length >= 2 && 'port-security'.startsWith(tokens[1].toLowerCase())) {
        if (!iface.portSecurity) {
          iface.portSecurity = { enabled: true, maxMacs: 1, violation: 'shutdown', stickyMacs: [] };
        }
        iface.portSecurity.enabled = true;

        if (tokens.length >= 4 && 'mac-address'.startsWith(tokens[2].toLowerCase())) {
          if ('sticky'.startsWith(tokens[3].toLowerCase())) {
            if (tokens[4]) {
              iface.portSecurity.stickyMacs.push(tokens[4]);
            }
          }
        }
        return { output: '' };
      }
    }

    // ip nat inside / outside
    if ('ip'.startsWith(cmd0) && tokens.length >= 3 && 'nat'.startsWith(tokens[1].toLowerCase())) {
      const type = tokens[2].toLowerCase();
      if ('inside'.startsWith(type)) {
        iface.natType = 'inside';
        return { output: '' };
      }
      if ('outside'.startsWith(type)) {
        iface.natType = 'outside';
        return { output: '' };
      }
    }

    // clock rate <bps> (Serial DCE)
    if ('clock'.startsWith(cmd0) && tokens.length >= 3 && 'rate'.startsWith(tokens[1].toLowerCase())) {
      if (!iface.name.toLowerCase().startsWith('serial')) {
        return { output: `% Selected interface is not a serial interface.` };
      }
      const rate = parseInt(tokens[2], 10);
      if (isNaN(rate) || rate <= 0) {
        return { output: `% Invalid clock rate value. Common rates: 64000, 128000, 2000000.` };
      }
      iface.clockRate = rate;
      iface.isDce = true;
      return { output: '' };
    }

    // no clock rate
    if (cmd0 === 'no' && tokens.length >= 3 && 'clock'.startsWith(tokens[1].toLowerCase()) && 'rate'.startsWith(tokens[2].toLowerCase())) {
      iface.clockRate = undefined;
      iface.isDce = false;
      return { output: '' };
    }

    // encapsulation <hdlc | ppp> (Serial interfaces)
    if ('encapsulation'.startsWith(cmd0) && tokens.length >= 2) {
      const encap = tokens[1].toLowerCase();
      if (encap === 'hdlc' || encap === 'ppp') {
        if (!iface.name.toLowerCase().startsWith('serial')) {
          return { output: `% Encapsulation ${encap.toUpperCase()} is only supported on serial interfaces.` };
        }
        iface.encapsulation = encap as 'hdlc' | 'ppp';
        return { output: '' };
      }
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== VLAN CONFIG MODE =====================
  private static execVlanConfigMode(
    tokens: string[],
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    if ('name'.startsWith(cmd0) && tokens.length > 1) {
      if (device instanceof Switch && context.targetVlan) {
        const vlan = device.vlanDatabase.get(context.targetVlan);
        if (vlan) {
          vlan.name = tokens[1];
          return { output: '' };
        }
      }
    }
    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== ROUTER OSPF CONFIG MODE =====================
  private static execRouterConfigMode(
    tokens: string[],
    _context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();

    // network <ip> <wildcard> area <area-id>
    if ('network'.startsWith(cmd0) && tokens.length >= 5 && 'area'.startsWith(tokens[3].toLowerCase())) {
      const net = tokens[1];
      const wc = tokens[2];
      const area = parseInt(tokens[4], 10);

      const target = device as Router;
      if (target.ospfConfig) {
        target.ospfConfig.networks.push({ network: net, wildcard: wc, area });
        return { output: '' };
      }
    }

    // router-id <id>
    if ('router-id'.startsWith(cmd0) && tokens.length > 1) {
      const target = device as Router;
      if (target.ospfConfig) {
        target.ospfConfig.routerId = tokens[1];
        return { output: '' };
      }
    }

    // passive-interface <interface>
    if ('passive-interface'.startsWith(cmd0) && tokens.length > 1) {
      const norm = CliLexer.normalizeInterfaceName(tokens[1]);
      const target = device as Router;
      if (target.ospfConfig) {
        target.ospfConfig.passiveInterfaces.push(norm);
        return { output: '' };
      }
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== LINE CONFIG MODE =====================
  private static execLineConfigMode(
    tokens: string[],
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();

    if ('password'.startsWith(cmd0) && tokens.length > 1) {
      if (context.targetLine?.includes('con')) {
        device.consolePassword = tokens[1];
      } else {
        device.vtyPassword = tokens[1];
      }
      return { output: '' };
    }

    if ('login'.startsWith(cmd0)) {
      return { output: '' };
    }

    if ('transport'.startsWith(cmd0)) {
      return { output: '' };
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== DHCP CONFIG MODE =====================
  private static execDhcpConfigMode(
    tokens: string[],
    raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const poolName = context.targetDhcpPool;
    if (!poolName) return { output: `% No DHCP pool selected.` };

    const pool = (device instanceof Router || device instanceof Switch) ? device.dhcpPools.get(poolName) : undefined;
    if (!pool) return { output: `% DHCP pool ${poolName} not found.` };

    // network <network-number> [mask | /cidr]
    if ('network'.startsWith(cmd0) && tokens.length >= 2) {
      const netArg = tokens[1];
      let net = netArg;
      let mask = tokens[2];

      if (netArg.includes('/')) {
        const [ipPart, cidrPart] = netArg.split('/');
        net = ipPart;
        const cidr = parseInt(cidrPart, 10);
        if (!isNaN(cidr)) {
          mask = SubnetUtils.cidrToMask(cidr);
        }
      }

      if (!mask || !SubnetUtils.isValidIpv4(net) || !SubnetUtils.isValidSubnetMask(mask)) {
        return { output: `% Invalid network or subnet mask.` };
      }

      pool.network = SubnetUtils.getNetworkAddress(net, mask);
      pool.mask = mask;
      return { output: '' };
    }

    // default-router <ip>
    if ('default-router'.startsWith(cmd0) && tokens.length >= 2) {
      const gw = tokens[1];
      if (!SubnetUtils.isValidIpv4(gw)) {
        return { output: `% Invalid default-router IP address.` };
      }
      pool.defaultRouter = gw;
      return { output: '' };
    }

    // dns-server <ip>
    if ('dns-server'.startsWith(cmd0) && tokens.length >= 2) {
      const dns = tokens[1];
      if (!SubnetUtils.isValidIpv4(dns)) {
        return { output: `% Invalid DNS server IP address.` };
      }
      pool.dnsServer = dns;
      return { output: '' };
    }

    // domain-name <domain>
    if ('domain-name'.startsWith(cmd0) && tokens.length >= 2) {
      pool.domainName = tokens[1];
      return { output: '' };
    }

    // lease <days>
    if ('lease'.startsWith(cmd0) && tokens.length >= 2) {
      const days = parseInt(tokens[1], 10);
      if (!isNaN(days)) pool.leaseDays = days;
      return { output: '' };
    }

    // exit
    if (cmd0 === 'exit') {
      return { output: '', newMode: 'global-config' };
    }

    // end
    if (cmd0 === 'end') {
      return { output: '', newMode: 'priv-exec' };
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== DHCP LEASE HELPERS =====================
  private static acquireDhcpLease(
    device: Device,
    iface: InterfaceConfig,
    allDevices: Device[] = []
  ): { success: boolean; message: string } {
    const reachablePeers: Device[] = [];
    const directPeerId = iface.connectedDeviceId;
    let directPeer = directPeerId ? allDevices.find(d => d.id === directPeerId) : undefined;

    if (!directPeer) {
      for (const d of allDevices) {
        if (d.id === device.id) continue;
        for (const peerIface of d.interfaces.values()) {
          if (
            peerIface.connectedDeviceId === device.id &&
            (peerIface.connectedPort === iface.name || peerIface.connectedPort === iface.shortName)
          ) {
            directPeer = d;
            break;
          }
        }
        if (directPeer) break;
      }
    }

    if (directPeer) {
      reachablePeers.push(directPeer);
      if (directPeer instanceof Switch) {
        for (const swIface of directPeer.interfaces.values()) {
          if (swIface.connectedDeviceId && swIface.connectedDeviceId !== device.id) {
            const nextDev = allDevices.find(d => d.id === swIface.connectedDeviceId);
            if (nextDev && !reachablePeers.includes(nextDev)) {
              reachablePeers.push(nextDev);
            }
          }
        }
      }
    }

    const cloudDevices = allDevices.filter(d => d.deviceType === 'cloud');
    for (const c of cloudDevices) {
      if (!reachablePeers.includes(c)) {
        reachablePeers.push(c);
      }
    }

    // A. Router or Switch with dhcpPools
    for (const peer of reachablePeers) {
      const pools = (peer instanceof Router || peer instanceof Switch) ? peer.dhcpPools : undefined;
      if (pools && pools.size > 0) {
        for (const pool of pools.values()) {
          if (pool.network && pool.mask) {
            const assigned = this.allocateIpFromPool(pool, peer, allDevices);
            if (assigned) {
              const gw = pool.defaultRouter || this.getDeviceIpInSubnet(peer, pool.network, pool.mask) || '0.0.0.0';
              const dns = pool.dnsServer || '8.8.8.8';
              this.applyDhcpLease(device, iface, assigned, pool.mask, gw, dns, gw);
              return { success: true, message: `Assigned ${assigned}` };
            }
          }
        }
      }
    }

    // B. Cloud device (LiveHostBridge / Physical Host Bridge)
    for (const peer of reachablePeers) {
      if (peer.deviceType === 'cloud') {
        const cloudHost = peer as Host;
        const gw = cloudHost.defaultGateway || cloudHost.ipAddress || '192.168.1.1';
        const mask = cloudHost.subnetMask || '255.255.255.0';
        const dns = cloudHost.dnsServer || '8.8.8.8';

        const netBase = SubnetUtils.getNetworkAddress(gw, mask);
        const prefixParts = netBase.split('.');
        const prefix = `${prefixParts[0]}.${prefixParts[1]}.${prefixParts[2]}`;

        const usedIps = new Set<string>();
        usedIps.add(gw);
        usedIps.add(cloudHost.ipAddress);
        for (const d of allDevices) {
          for (const ifc of d.interfaces.values()) {
            if (ifc.ipAddress && ifc.ipAddress !== iface.ipAddress) usedIps.add(ifc.ipAddress);
          }
          if (d instanceof Host && d.ipAddress && d.id !== device.id) usedIps.add(d.ipAddress);
        }

        let assignedIp = `${prefix}.105`;
        if (usedIps.has(assignedIp)) {
          let octet = 106;
          while (octet < 250 && usedIps.has(`${prefix}.${octet}`)) {
            octet++;
          }
          assignedIp = `${prefix}.${octet}`;
        }

        this.applyDhcpLease(device, iface, assignedIp, mask, gw, dns, gw);
        return { success: true, message: `Assigned ${assignedIp}` };
      }
    }

    // C. Server device
    for (const peer of reachablePeers) {
      if (peer.deviceType === 'server') {
        const serverHost = peer as Host;
        if (serverHost.ipAddress && serverHost.subnetMask) {
          const gw = serverHost.defaultGateway || serverHost.ipAddress;
          const mask = serverHost.subnetMask;
          const netBase = SubnetUtils.getNetworkAddress(serverHost.ipAddress, mask);
          const prefixParts = netBase.split('.');
          const prefix = `${prefixParts[0]}.${prefixParts[1]}.${prefixParts[2]}`;
          const assignedIp = `${prefix}.100`;
          this.applyDhcpLease(device, iface, assignedIp, mask, gw, serverHost.dnsServer || '8.8.8.8', serverHost.ipAddress);
          return { success: true, message: `Assigned ${assignedIp}` };
        }
      }
    }

    return { success: false, message: 'No DHCP server responded' };
  }

  private static allocateIpFromPool(
    pool: DhcpPool,
    serverDevice: Device,
    allDevices: Device[]
  ): string | null {
    const netLong = SubnetUtils.ipToLong(pool.network);
    const maskLong = SubnetUtils.ipToLong(pool.mask);
    const totalHosts = (~maskLong >>> 0) - 1;

    const excludedList: string[] = [];
    if (serverDevice instanceof Router || serverDevice instanceof Switch) {
      for (const exc of serverDevice.dhcpExcludedAddresses) {
        const parts = exc.split(/\s+/);
        if (parts.length === 1) {
          excludedList.push(parts[0]);
        } else if (parts.length === 2) {
          const start = SubnetUtils.ipToLong(parts[0]);
          const end = SubnetUtils.ipToLong(parts[1]);
          for (let ip = start; ip <= end; ip++) {
            excludedList.push(SubnetUtils.longToIp(ip));
          }
        }
      }
    }
    if (pool.defaultRouter) excludedList.push(pool.defaultRouter);

    const usedIps = new Set<string>(excludedList);
    for (const d of allDevices) {
      for (const ifc of d.interfaces.values()) {
        if (ifc.ipAddress) usedIps.add(ifc.ipAddress);
      }
      if (d instanceof Host && d.ipAddress) usedIps.add(d.ipAddress);
    }

    for (let i = 1; i <= Math.min(totalHosts, 254); i++) {
      const candidateIp = SubnetUtils.longToIp((netLong + i) >>> 0);
      if (!usedIps.has(candidateIp)) {
        return candidateIp;
      }
    }

    return null;
  }

  private static applyDhcpLease(
    device: Device,
    iface: InterfaceConfig,
    ip: string,
    mask: string,
    gateway: string,
    dns: string,
    serverIp: string
  ): void {
    iface.ipAddress = ip;
    iface.subnetMask = mask;
    iface.isDhcpClient = true;
    iface.dhcpLease = {
      assignedIp: ip,
      subnetMask: mask,
      defaultGateway: gateway,
      dnsServer: dns,
      serverIp: serverIp,
      leaseTime: 86400
    };

    if (device instanceof Router) {
      device.updateConnectedRoutes();
      device.routingTable = device.routingTable.filter(
        r => !(r.network === '0.0.0.0' && r.mask === '0.0.0.0' && r.adminDistance === 254)
      );
      if (gateway && gateway !== '0.0.0.0') {
        device.routingTable.push({
          network: '0.0.0.0',
          mask: '0.0.0.0',
          cidr: 0,
          nextHop: gateway,
          exitInterface: iface.name,
          protocol: 'S',
          adminDistance: 254,
          metric: 0
        });
      }
    } else if (device instanceof Switch) {
      device.defaultGateway = gateway;
      if (device.isLayer3) {
        device.updateL3ConnectedRoutes();
        device.routingTable = device.routingTable.filter(
          r => !(r.network === '0.0.0.0' && r.mask === '0.0.0.0' && r.adminDistance === 254)
        );
        if (gateway && gateway !== '0.0.0.0') {
          device.routingTable.push({
            network: '0.0.0.0',
            mask: '0.0.0.0',
            cidr: 0,
            nextHop: gateway,
            exitInterface: iface.name,
            protocol: 'S',
            adminDistance: 254,
            metric: 0
          });
        }
      }
    }
  }

  private static getDeviceIpInSubnet(device: Device, network: string, _mask: string): string | undefined {
    for (const iface of device.interfaces.values()) {
      if (iface.ipAddress && iface.subnetMask) {
        if (SubnetUtils.getNetworkAddress(iface.ipAddress, iface.subnetMask) === network) {
          return iface.ipAddress;
        }
      }
    }
    return undefined;
  }

  // ===================== RENDERERS =====================
  private static renderDhcpClientLease(device: Device): string {
    const leases: string[] = [];
    for (const iface of device.interfaces.values()) {
      if (iface.isDhcpClient && iface.dhcpLease) {
        const l = iface.dhcpLease;
        leases.push(
          `Temp IP addr: ${l.assignedIp}  for peer on Interface: ${iface.name}\n` +
          `DHCP Lease server: ${l.serverIp || l.defaultGateway}, DNS server: ${l.dnsServer || '8.8.8.8'}\n` +
          `Domain name: local\n` +
          `DHCP transaction id: 0x1A2B\n` +
          `Lease: ${l.leaseTime || 86400} secs, Renewal: 43200 secs, Rebind: 75600 secs\n` +
          `Next timer fires after: 11:59:58\n` +
          `Retry count: 0   Client-ID: cisco-${iface.macAddress || '0001.c400.0001'}-${iface.shortName}`
        );
      }
    }
    if (leases.length === 0) {
      return `% No active DHCP client leases.`;
    }
    return leases.join('\n\n');
  }

  private static renderIpDhcpBinding(device: Device, allDevices: Device[]): string {
    const lines = [
      'Bindings from all pools :',
      'IP address          Client-ID/              Lease expiration        Type',
      '                    Hardware address/',
      '                    User name'
    ];

    let count = 0;
    for (const d of allDevices) {
      if (d.id === device.id) continue;
      for (const ifc of d.interfaces.values()) {
        if (ifc.isDhcpClient && ifc.dhcpLease && ifc.ipAddress) {
          const ipCol = ifc.ipAddress.padEnd(20);
          const mac = ifc.macAddress ? `01${ifc.macAddress.replace(/\./g, '')}` : '0100.01c4.1234.56';
          const clientCol = mac.padEnd(24);
          const expCol = 'Mar 18 2026 08:30 AM    ';
          const typeCol = 'Automatic';
          lines.push(`${ipCol}${clientCol}${expCol}${typeCol}`);
          count++;
        }
      }
    }

    if (count === 0) {
      return 'Bindings from all pools :\nIP address          Client-ID/              Lease expiration        Type\n                    Hardware address/\n                    User name\n';
    }

    return lines.join('\n');
  }

  private static renderDhcpPool(device: Device): string {
    const pools = (device instanceof Router || device instanceof Switch) ? device.dhcpPools : undefined;
    if (!pools || pools.size === 0) {
      return `% No DHCP pools configured.`;
    }

    const sections: string[] = [];
    for (const pool of pools.values()) {
      const net = pool.network || '0.0.0.0';
      const mask = pool.mask || '255.255.255.0';
      const cidr = SubnetUtils.maskToCidr(mask);
      const totalHosts = Math.max(0, Math.pow(2, 32 - cidr) - 2);
      const excCount = (device as any).dhcpExcludedAddresses?.length || 0;

      sections.push(
        `Pool ${pool.name} :\n` +
        `  Utilization mark (high/low)    : 100 / 0\n` +
        `  Subnet size (total/usable)     : ${totalHosts} / ${Math.max(0, totalHosts - 1)}\n` +
        `  Total addresses                : ${totalHosts}\n` +
        `  Leased addresses               : 1\n` +
        `  Excluded addresses             : ${excCount}\n` +
        `  Pending event                  : none\n` +
        `  1 subnet is currently in the pool :\n` +
        `  Current index        IP address range                    Leased/Excluded/Total\n` +
        `  ${net.padEnd(20)} ${net} - ${pool.defaultRouter || net}         1    / ${excCount}        / ${totalHosts}`
      );
    }

    return sections.join('\n\n');
  }

  private static renderIpInterfaceBrief(device: Device): string {
    const lines = [
      'Interface              IP-Address      OK? Method Status                Protocol',
    ];

    for (const iface of device.interfaces.values()) {
      const nameCol = iface.shortName.padEnd(22);
      const ipCol = (iface.ipAddress || 'unassigned').padEnd(16);
      const okCol = 'YES'.padEnd(4);
      const methodCol = (iface.isDhcpClient ? 'DHCP' : (iface.ipAddress ? 'manual' : 'unset')).padEnd(7);
      const statusCol = (iface.isShutdown ? 'administratively down' : (iface.status === 'up' ? 'up' : 'down')).padEnd(22);
      const protoCol = iface.isShutdown ? 'down' : (iface.status === 'up' ? 'up' : 'down');

      lines.push(`${nameCol}${ipCol}${okCol}${methodCol}${statusCol}${protoCol}`);
    }

    return lines.join('\n');
  }

  private static renderIpRoute(device: Device): string {
    let routingTable: RouteEntry[] = [];
    if (device instanceof Router) {
      routingTable = device.routingTable;
    } else if (device instanceof Switch && device.isLayer3) {
      routingTable = device.routingTable;
    } else {
      return `% IP routing not enabled on this device.`;
    }

    const header = [
      'Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP',
      '       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area',
      '       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2',
      '       E1 - OSPF external type 1, E2 - OSPF external type 2',
      '',
      'Gateway of last resort is not set',
      ''
    ];

    const defaultRoute = routingTable.find(r => r.network === '0.0.0.0' && r.mask === '0.0.0.0');
    if (defaultRoute) {
      const gw = defaultRoute.nextHop || defaultRoute.exitInterface;
      header[5] = `Gateway of last resort is ${gw} to network 0.0.0.0`;
    }

    if (routingTable.length === 0) {
      return header.join('\n');
    }

    for (const r of routingTable) {
      if (r.network === '0.0.0.0' && r.mask === '0.0.0.0') {
        const target = r.nextHop ? `via ${r.nextHop}` : `is directly connected, ${r.exitInterface}`;
        header.push(`S*    0.0.0.0/0 [${r.adminDistance}/${r.metric}] ${target}`);
      } else if (r.protocol === 'C') {
        header.push(`C     ${r.network}/${r.cidr} is directly connected, ${r.exitInterface}`);
      } else if (r.protocol === 'L') {
        header.push(`L     ${r.network}/32 is directly connected, ${r.exitInterface}`);
      } else if (r.protocol === 'S') {
        const target = r.nextHop ? `[${r.adminDistance}/${r.metric}] via ${r.nextHop}` : `is directly connected, ${r.exitInterface}`;
        header.push(`S     ${r.network}/${r.cidr} ${target}`);
      } else if (r.protocol === 'O') {
        header.push(`O     ${r.network}/${r.cidr} [110/${r.metric || 2}] via ${r.nextHop || '10.0.0.2'}, ${r.exitInterface || 'GigabitEthernet0/0'}`);
      }
    }

    return header.join('\n');
  }

  private static renderVlanBrief(device: Device): string {
    if (!(device instanceof Switch)) return `% Device does not support VLAN database.`;

    const lines = [
      'VLAN Name                             Status    Ports',
      '---- -------------------------------- --------- -------------------------------'
    ];

    for (const vlan of device.vlanDatabase.values()) {
      const idCol = vlan.id.toString().padEnd(5);
      const nameCol = vlan.name.padEnd(33);
      const statusCol = vlan.status.padEnd(10);

      // Find ports assigned to this access VLAN
      const assignedPorts: string[] = [];
      for (const iface of device.interfaces.values()) {
        if (iface.switchportMode === 'access' && iface.accessVlan === vlan.id) {
          assignedPorts.push(iface.shortName);
        }
      }
      const portsCol = assignedPorts.join(', ');
      lines.push(`${idCol}${nameCol}${statusCol}${portsCol}`);
    }

    return lines.join('\n');
  }

  private static renderMacAddressTable(device: Device): string {
    if (!(device instanceof Switch)) return `% Device does not support MAC address table.`;

    const lines = [
      '          Mac Address Table',
      '-------------------------------------------',
      'Vlan    Mac Address       Type        Ports',
      '----    -----------       --------    -----'
    ];

    for (const entry of device.macTable) {
      lines.push(`${entry.vlan.toString().padEnd(8)}${entry.macAddress.padEnd(18)}${entry.type.padEnd(12)}${entry.port}`);
    }

    if (device.macTable.length === 0) {
      lines.push('Total Mac Addresses for this criterion: 0');
    }

    return lines.join('\n');
  }

  private static renderInterfacesTrunk(device: Device): string {
    if (!(device instanceof Switch)) return `% Device does not support trunking.`;

    const lines = [
      'Port        Mode         Encapsulation  Status        Native vlan',
      '================================================================='
    ];

    let found = false;
    for (const iface of device.interfaces.values()) {
      if (iface.switchportMode === 'trunk') {
        found = true;
        lines.push(`${iface.shortName.padEnd(12)}on           802.1q         trunking      ${iface.nativeVlan || 1}`);
      }
    }

    if (!found) {
      return 'No interfaces are currently configured as trunks.';
    }

    return lines.join('\n');
  }

  private static renderOspfNeighbors(device: Device, allDevices: Device[]): string {
    const lines = [
      'Neighbor ID     Pri   State           Dead Time   Address         Interface',
      '==========================================================================='
    ];

    // Find neighboring routers that have active OSPF
    let count = 0;
    for (const other of allDevices) {
      if (other.id !== device.id && other instanceof Router && other.ospfConfig?.enabled) {
        count++;
        const neighborId = other.ospfConfig.routerId || other.interfaces.get('GigabitEthernet0/0')?.ipAddress || '1.1.1.1';
        lines.push(`${neighborId.padEnd(16)}1     FULL/BDR        00:00:34    10.0.0.2        GigabitEthernet0/0`);
      }
    }

    if (count === 0) {
      return 'No OSPF neighbors found.';
    }

    return lines.join('\n');
  }

  private static renderNatTranslations(device: Device): string {
    if (!(device instanceof Router)) return `% Device does not support NAT.`;

    return `
Pro  Inside global          Inside local           Outside local          Outside global
icmp 203.0.113.1:1024       192.168.1.10:1024      8.8.8.8:1024           8.8.8.8:1024
tcp  203.0.113.1:49201      192.168.1.10:49201     198.51.100.5:80        198.51.100.5:80
`.trim();
  }

  private static renderAccessLists(device: Device): string {
    if (!(device instanceof Router)) return `% No access lists.`;

    const lines: string[] = [];
    for (const [num, rules] of device.accessLists.entries()) {
      const type = num <= 99 ? 'Standard' : 'Extended';
      lines.push(`${type} IP access list ${num}`);
      let seq = 10;
      for (const r of rules) {
        if (num <= 99) {
          lines.push(`    ${seq} ${r.action} ${r.sourceIp} ${r.sourceWildcard || ''}`.trim());
        } else {
          lines.push(`    ${seq} ${r.action} ${r.protocol || 'ip'} ${r.sourceIp} ${r.sourceWildcard || ''} ${r.destIp || ''} ${r.destWildcard || ''}`.trim());
        }
        seq += 10;
      }
    }

    return lines.length > 0 ? lines.join('\n') : 'No access-lists configured.';
  }

  private static renderPortSecurity(device: Device): string {
    if (!(device instanceof Switch)) return `% Device does not support port-security.`;

    const lines = [
      'Secure Port  MaxSecureAddr  CurrentAddr  SecurityViolation  Security Action',
      '             (Count)        (Count)      (Count)',
      '---------------------------------------------------------------------------'
    ];

    for (const iface of device.interfaces.values()) {
      if (iface.portSecurity && iface.portSecurity.enabled) {
        lines.push(`${iface.shortName.padEnd(13)}${iface.portSecurity.maxMacs.toString().padEnd(15)}1              0                  ${iface.portSecurity.violation.padEnd(15)}`);
      }
    }

    return lines.join('\n');
  }

  private static renderVersion(device: Device): string {
    if (device.deviceType === 'switch-l3') {
      return `
Cisco IOS XE Software, Version 17.12.6
Cisco IOS Software [Cupertino], Catalyst L3 Switch Software (CAT9K_LITE_IOSXE), Version 17.12.6, RELEASE SOFTWARE (fc2)
Technical Support: http://www.cisco.com/techsupport
Copyright (c) 1986-2024 by Cisco Systems, Inc.
Compiled Fri 15-Mar-24 14:20 by mcpre

ROM: IOS-XE ROMMON

${device.hostname} uptime is 2 hours, 18 minutes
Uptime for this control processor is 2 hours, 19 minutes
System returned to ROM by power-on
System image file is "bootflash:packages.conf"
Last reload reason: Power-on

cisco Catalyst 9300-24T (ARM64) processor with 4194304K/2097152K bytes of memory.
Processor board ID FCW2145L099
24 Gigabit Ethernet interfaces
4 Ten Gigabit Ethernet interfaces
2048K bytes of non-volatile configuration memory.
4194304K bytes of physical memory.
11272192K bytes of Bootflash at bootflash:

Configuration register is 0x102
`.trim();
    }

    if (device.deviceType === 'switch') {
      return `
Cisco IOS Software, Catalyst L2 Switch Software (CAT9K_LITE_IOSXE), Version 17.12.6, RELEASE SOFTWARE (fc2)
Technical Support: http://www.cisco.com/techsupport
Copyright (c) 1986-2024 by Cisco Systems, Inc.
Compiled Fri 15-Mar-24 14:20 by mcpre

ROM: IOS-XE ROMMON

${device.hostname} uptime is 2 hours, 15 minutes
System returned to ROM by power-on
System image file is "bootflash:packages.conf"

cisco Catalyst 9200L-24T-4G (ARM64) processor with 2097152K bytes of memory.
Processor board ID JAE23420XYZ
24 Gigabit Ethernet interfaces
4 1G SFP interfaces
The password-recovery mechanism is enabled.
2048K bytes of non-volatile configuration memory.
Base ethernet MAC Address       : 00:26:0B:44:A8:80
Model number                    : C9200L-24T-4G-E

Configuration register is 0x102
`.trim();
    }

    // Cisco Catalyst C8200L-1N-4T Router (IOS-XE 17.15.4c)
    return `
Cisco IOS XE Software, Version 17.15.4c
Cisco IOS Software [Dublin], Catalyst Edge Software (C8200L-UNIVERSALK9), Version 17.15.4c, RELEASE SOFTWARE (fc1)
Technical Support: http://www.cisco.com/techsupport
Copyright (c) 1986-2024 by Cisco Systems, Inc.
Compiled Thu 29-Aug-24 16:35 by mcpre

ROM: IOS-XE ROMMON

${device.hostname} uptime is 2 hours, 45 minutes
Uptime for this control processor is 2 hours, 47 minutes
System returned to ROM by power-on
System image file is "bootflash:c8200l-universalk9.17.15.04c.SPA.bin"
Last reload reason: Power-on

cisco C8200L-1N-4T (1RU) processor with 4194304K/2097152K bytes of memory.
Processor board ID FDO24180ABC
4 Gigabit Ethernet interfaces
2 Serial(sync/async) network interface modules (NIM-2T)
32768K bytes of non-volatile configuration memory.
4194304K bytes of physical memory.
11272192K bytes of Bootflash at bootflash:

Configuration register is 0x2102
`.trim();
  }

  // ===================== CDP (CISCO DISCOVERY PROTOCOL) HANDLERS =====================
  private static handleShowCdp(
    tokens: string[],
    device: Device,
    allDevices: Device[]
  ): CliExecutionResult {
    if (!device.cdpEnabled) {
      return { output: '% CDP is not enabled' };
    }

    if (tokens.length === 2) {
      // show cdp
      return { output: this.renderCdpStatus(device) };
    }

    const sub = tokens[2].toLowerCase();

    // show cdp neighbors [detail]
    if ('neighbors'.startsWith(sub)) {
      if (tokens.length >= 4 && 'detail'.startsWith(tokens[3].toLowerCase())) {
        return { output: this.renderCdpNeighborsDetail(device, allDevices) };
      }
      return { output: this.renderCdpNeighbors(device, allDevices) };
    }

    // show cdp entry <entry-name>
    if ('entry'.startsWith(sub)) {
      if (tokens.length < 4) {
        return { output: '% Incomplete command. Specify neighbor device ID.' };
      }
      const entryName = tokens.slice(3).join(' ');
      return { output: this.renderCdpNeighborsDetail(device, allDevices, entryName) };
    }

    // show cdp interface [interface-id]
    if ('interface'.startsWith(sub) || sub === 'int') {
      const targetIface = tokens[3];
      return { output: this.renderCdpInterface(device, targetIface) };
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  private static renderCdpStatus(device: Device): string {
    if (!device.cdpEnabled) {
      return '% CDP is not enabled';
    }
    return [
      'Global CDP information:',
      `    Sending CDP packets every ${device.cdpTimer} seconds`,
      `    Sending a holdtime value of ${device.cdpHoldtime} seconds`,
      `    Sending CDPv2 advertisements is enabled`,
      `    CDP Version 2 is enabled`,
      `    CDP is globally enabled`
    ].join('\n');
  }

  private static getCdpNeighborsList(device: Device, allDevices: Device[]): Array<{
    localPort: string;
    localShort: string;
    neighborDevice: Device;
    neighborPort: string;
    neighborShort: string;
    holdtime: number;
    capability: string;
    capabilitiesLong: string;
    platform: string;
    platformFull: string;
    ipAddress: string;
    version: string;
    duplex: string;
    nativeVlan: number;
  }> {
    const list: Array<any> = [];
    if (!device.cdpEnabled) return list;

    for (const iface of device.interfaces.values()) {
      if (iface.isShutdown || iface.status !== 'up') continue;
      if (iface.cdpEnabled === false) continue;
      // Skip logical interfaces like Vlan or Loopback for physical CDP neighbor discovery
      const ifaceNameLower = iface.name.toLowerCase();
      if (ifaceNameLower.startsWith('vlan') || ifaceNameLower.startsWith('loopback')) continue;

      let peerDevId = iface.connectedDeviceId;
      let peerPortName = iface.connectedPort;

      // If not directly set on this interface, look in other devices' interfaces
      if (!peerDevId) {
        for (const otherDev of allDevices) {
          if (otherDev.id === device.id) continue;
          for (const otherIface of otherDev.interfaces.values()) {
            if (
              otherIface.connectedDeviceId === device.id &&
              (otherIface.connectedPort === iface.name || otherIface.connectedPort === iface.shortName)
            ) {
              peerDevId = otherDev.id;
              peerPortName = otherIface.name;
              break;
            }
          }
          if (peerDevId) break;
        }
      }

      if (!peerDevId) continue;
      const peerDev = allDevices.find(d => d.id === peerDevId);
      if (!peerDev || peerDev.cdpEnabled === false) continue;

      const peerIface = peerPortName 
        ? (peerDev.getInterface(peerPortName) || Array.from(peerDev.interfaces.values()).find(i => i.name === peerPortName || i.shortName === peerPortName))
        : undefined;

      if (!peerIface || peerIface.isShutdown || peerIface.status !== 'up' || peerIface.cdpEnabled === false) continue;

      let capability = 'R';
      let capabilitiesLong = 'Router';
      let platform = 'C2900';
      let platformFull = 'cisco CISCO2911/K9';
      let version = 'Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.4(3)M2, RELEASE SOFTWARE (fc2)';

      if (peerDev.deviceType === 'switch-l3') {
        capability = 'R S I';
        capabilitiesLong = 'Router Switch IGMP';
        platform = 'cisco C9300-';
        platformFull = 'cisco C9300-24T';
        version = 'Cisco IOS XE Software, Version 17.12.6, Catalyst L3 Switch Software (CAT9K_LITE_IOSXE), RELEASE SOFTWARE (fc2)';
      } else if (peerDev.deviceType === 'switch') {
        capability = 'S I';
        capabilitiesLong = 'Switch IGMP';
        platform = 'WS-C2960-';
        platformFull = 'cisco WS-C2960-24TT-L';
        version = 'Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE4, RELEASE SOFTWARE (fc1)';
      } else if (peerDev.deviceType === 'router') {
        capability = 'R';
        capabilitiesLong = 'Router';
        platform = 'C2900';
        platformFull = 'cisco CISCO2911/K9';
        version = 'Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.4(3)M2, RELEASE SOFTWARE (fc2)';
      } else {
        capability = 'H';
        capabilitiesLong = 'Host';
        platform = 'Host PC';
        platformFull = 'Host Ethernet Workstation';
        version = 'Host Network Station v1.0';
      }

      const ipAddress = peerIface.ipAddress || 
        peerDev.interfaces.get('Vlan1')?.ipAddress || 
        Array.from(peerDev.interfaces.values()).find(i => Boolean(i.ipAddress))?.ipAddress || 
        (peerDev as any).ipAddress || 
        '';

      const holdtime = Math.max(10, device.cdpHoldtime - Math.min(30, (iface.name.length * 7 + peerDev.hostname.length * 3) % 25 + 5));

      list.push({
        localPort: iface.name,
        localShort: iface.shortName,
        neighborDevice: peerDev,
        neighborPort: peerIface.name,
        neighborShort: peerIface.shortName,
        holdtime,
        capability,
        capabilitiesLong,
        platform,
        platformFull,
        ipAddress,
        version,
        duplex: peerIface.duplex || 'full',
        nativeVlan: peerIface.nativeVlan || 1
      });
    }

    return list;
  }

  private static renderCdpNeighbors(device: Device, allDevices: Device[]): string {
    if (!device.cdpEnabled) {
      return '% CDP is not enabled';
    }

    const header = [
      'Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge',
      '                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone,',
      '                  D - Remote, C - CVTA, M - Two-port Mac Relay',
      '',
      'Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID'
    ];

    const neighbors = this.getCdpNeighborsList(device, allDevices);
    if (neighbors.length === 0) {
      return header.join('\n');
    }

    for (const n of neighbors) {
      const devIdCol = n.neighborDevice.hostname.padEnd(17);
      const localCol = n.localShort.padEnd(18);
      const holdCol = n.holdtime.toString().padEnd(11);
      const capCol = n.capability.padStart(10).padEnd(12);
      const platCol = n.platform.padEnd(10);
      const portCol = n.neighborShort;
      header.push(`${devIdCol}${localCol}${holdCol}${capCol}${platCol}${portCol}`);
    }

    return header.join('\n');
  }

  private static renderCdpNeighborsDetail(
    device: Device, 
    allDevices: Device[], 
    filterEntry?: string
  ): string {
    if (!device.cdpEnabled) {
      return '% CDP is not enabled';
    }

    let neighbors = this.getCdpNeighborsList(device, allDevices);
    if (filterEntry && filterEntry !== '*') {
      const filterLower = filterEntry.toLowerCase();
      neighbors = neighbors.filter(n => 
        n.neighborDevice.hostname.toLowerCase() === filterLower ||
        n.neighborDevice.hostname.toLowerCase().startsWith(filterLower)
      );
    }

    if (neighbors.length === 0) {
      return '% Entry not found in CDP neighbor table';
    }

    const blocks: string[] = [];
    for (const n of neighbors) {
      blocks.push([
        '-------------------------',
        `Device ID: ${n.neighborDevice.hostname}`,
        `Entry address(es):`,
        `  IP address: ${n.ipAddress || 'unassigned'}`,
        `Platform: ${n.platformFull},  Capabilities: ${n.capabilitiesLong}`,
        `Interface: ${n.localPort},  Port ID (outgoing port): ${n.neighborPort}`,
        `Holdtime : ${n.holdtime} sec`,
        '',
        'Version :',
        n.version,
        '',
        'advertisement version: 2',
        `Duplex: ${n.duplex}`,
        `Native VLAN: ${n.nativeVlan}`,
        '-------------------------'
      ].join('\n'));
    }

    return blocks.join('\n\n');
  }

  private static renderCdpInterface(device: Device, targetIface?: string): string {
    if (!device.cdpEnabled) {
      return '% CDP is not enabled';
    }

    const ifaces = Array.from(device.interfaces.values());
    let selected = ifaces;
    if (targetIface) {
      const matched = ifaces.find(i => 
        i.name.toLowerCase() === targetIface.toLowerCase() || 
        i.shortName.toLowerCase() === targetIface.toLowerCase()
      );
      if (!matched) {
        return `% Invalid interface ${targetIface}`;
      }
      selected = [matched];
    }

    const sections: string[] = [];
    for (const ifc of selected) {
      if (ifc.name.toLowerCase().startsWith('vlan') || ifc.name.toLowerCase().startsWith('loopback')) continue;
      const statusStr = ifc.isShutdown ? 'administratively down' : (ifc.status === 'up' ? 'up' : 'down');
      const cdpLine = ifc.cdpEnabled === false
        ? '  CDP is disabled on this interface'
        : [
            `  Encapsulation ARPA`,
            `  Sending CDP packets every ${device.cdpTimer} seconds`,
            `  Holdtime is ${device.cdpHoldtime} seconds`
          ].join('\n');

      sections.push(`${ifc.name} is ${statusStr}, line protocol is ${statusStr}\n${cdpLine}`);
    }

    return sections.length > 0 ? sections.join('\n\n') : '% No interfaces available for CDP.';
  }

  // ===================== ARP (ADDRESS RESOLUTION PROTOCOL) HANDLERS =====================
  private static handleShowIpArp(tokens: string[], device: Device): CliExecutionResult {
    const filterArg = tokens[0]?.toLowerCase();
    const rows: Array<{
      protocol: string;
      address: string;
      age: string;
      hardware: string;
      type: string;
      iface: string;
    }> = [];

    const seenIps = new Set<string>();

    // 1. Include device's own active L3 interfaces
    for (const iface of device.interfaces.values()) {
      if (iface.ipAddress && !iface.isShutdown && iface.status === 'up') {
        rows.push({
          protocol: 'Internet',
          address: iface.ipAddress,
          age: '-',
          hardware: iface.macAddress,
          type: 'ARPA',
          iface: iface.name
        });
        seenIps.add(iface.ipAddress);
      }
    }

    // 2. Include entries from device.arpTable
    for (const entry of device.arpTable) {
      if (!seenIps.has(entry.ipAddress)) {
        rows.push({
          protocol: entry.protocol || 'Internet',
          address: entry.ipAddress,
          age: entry.age !== undefined ? entry.age.toString() : '0',
          hardware: entry.macAddress,
          type: 'ARPA',
          iface: entry.interfaceName || 'GigabitEthernet0/0'
        });
        seenIps.add(entry.ipAddress);
      }
    }

    // 3. Filter if requested
    let filtered = rows;
    if (filterArg) {
      filtered = rows.filter(r => 
        r.address === filterArg || 
        r.iface.toLowerCase() === filterArg ||
        r.iface.toLowerCase().startsWith(filterArg) ||
        r.hardware.toLowerCase() === filterArg
      );
    }

    const header = [
      'Protocol  Address          Age (min)  Hardware Addr   Type   Interface'
    ];

    for (const r of filtered) {
      const protoCol = r.protocol.padEnd(10);
      const addrCol = r.address.padEnd(17);
      const ageCol = r.age.padStart(9).padEnd(11);
      const hwCol = r.hardware.padEnd(16);
      const typeCol = r.type.padEnd(7);
      const ifaceCol = r.iface;
      header.push(`${protoCol}${addrCol}${ageCol}${hwCol}${typeCol}${ifaceCol}`);
    }

    return { output: header.join('\n') };
  }

  private static handleClearArp(tokens: string[], device: Device): CliExecutionResult {
    if (tokens.length > 0 && SubnetUtils.isValidIpv4(tokens[0])) {
      device.removeArpEntry(tokens[0]);
    } else {
      device.clearArpTable(true);
    }
    return { output: '' };
  }

  private static handleStaticArp(tokens: string[], device: Device): CliExecutionResult {
    // arp <ip> <mac> arpa [interface]
    const ip = tokens[1];
    const mac = tokens[2];
    const encap = tokens[3]?.toLowerCase();

    if (!SubnetUtils.isValidIpv4(ip)) {
      return { output: `% Invalid IP address: ${ip}` };
    }

    if (encap !== 'arpa') {
      return { output: `% Unrecognized encapsulation type. Only ARPA supported.` };
    }

    const normMac = mac.toLowerCase().replace(/[:-]/g, '.');
    let targetIface = tokens[4] ? CliLexer.normalizeInterfaceName(tokens[4]) : undefined;

    if (!targetIface) {
      for (const ifc of device.interfaces.values()) {
        if (ifc.ipAddress && ifc.subnetMask && SubnetUtils.isSameSubnet(ifc.ipAddress, ip, ifc.subnetMask)) {
          targetIface = ifc.name;
          break;
        }
      }
    }

    if (!targetIface) {
      targetIface = Array.from(device.interfaces.values())[0]?.name || 'GigabitEthernet0/0';
    }

    device.addArpEntry({
      protocol: 'Internet',
      ipAddress: ip,
      age: '-',
      macAddress: normMac,
      type: 'static',
      interfaceName: targetIface
    });

    return { output: '' };
  }

  // ===================== PING HANDLER =====================
  private static handlePing(targetRaw: string, sourceDevice: Device, allDevices: Device[]): CliExecutionResult {
    const target = targetRaw.trim();
    let isDomain = false;
    let resolvedIp = target;

    // Handle domain names
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

      const lower = target.toLowerCase();
      if (domainMap[lower]) {
        resolvedIp = domainMap[lower];
      } else if (lower.includes('.')) {
        resolvedIp = '173.194.' + (Math.abs(lower.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 250 + 1) + '.138';
      } else {
        return { output: `% Unrecognized host or address, or protocol not running.` };
      }
    }

    // Cari apakah targetIp ada di salah satu interface aktif di jaringan
    let targetDevice: Device | null = null;
    for (const dev of allDevices) {
      if (dev instanceof Host && dev.ipAddress === resolvedIp) {
        targetDevice = dev;
        break;
      }
      for (const iface of dev.interfaces.values()) {
        if (iface.status === 'up' && !iface.isShutdown && iface.ipAddress === resolvedIp) {
          targetDevice = dev;
          break;
        }
      }
      if (targetDevice) break;
    }

    // Periksa apakah router/switch memiliki antarmuka aktif untuk merutekan ke luar / internet / Cloud bridge
    const hasUpInterface = Array.from(sourceDevice.interfaces.values()).some(
      i => i.status === 'up' && !i.isShutdown
    );
    const hasCloud = allDevices.some(d => d.deviceType === 'cloud');

    const domainTranslationHeader = isDomain
      ? `Translating "${target}"...domain server (8.8.8.8) [OK]\n\n`
      : '';

    const sendingHeader = `${domainTranslationHeader}Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${resolvedIp}, timeout is 2 seconds:`;

    if (targetDevice) {
      // Dynamic ARP resolution
      let srcIface: InterfaceConfig | undefined;
      for (const ifc of sourceDevice.interfaces.values()) {
        if (ifc.ipAddress && ifc.subnetMask && SubnetUtils.isSameSubnet(ifc.ipAddress, resolvedIp, ifc.subnetMask)) {
          srcIface = ifc;
          break;
        }
      }
      if (!srcIface) {
        srcIface = Array.from(sourceDevice.interfaces.values()).find(i => i.ipAddress && !i.isShutdown && i.status === 'up');
      }

      let dstMac = '0001.96a1.1234';
      let dstIfaceName = 'GigabitEthernet0/0';
      if (targetDevice instanceof Host) {
        dstMac = targetDevice.interfaces.get('FastEthernet0')?.macAddress || '0050.7966.6800';
        dstIfaceName = 'FastEthernet0';
      } else {
        const dstIface = Array.from(targetDevice.interfaces.values()).find(i => i.ipAddress === resolvedIp) || Array.from(targetDevice.interfaces.values())[0];
        if (dstIface) {
          dstMac = dstIface.macAddress;
          dstIfaceName = dstIface.name;
        }
      }

      if (srcIface) {
        sourceDevice.addArpEntry({
          protocol: 'Internet',
          ipAddress: resolvedIp,
          macAddress: dstMac,
          interfaceName: srcIface.name,
          type: 'ARPA',
          age: 0
        });
        if (srcIface.ipAddress) {
          targetDevice.addArpEntry({
            protocol: 'Internet',
            ipAddress: srcIface.ipAddress,
            macAddress: srcIface.macAddress,
            interfaceName: dstIfaceName,
            type: targetDevice instanceof Host ? 'dynamic' : 'ARPA',
            age: 0
          });
        }
      }

      return {
        output: `${sendingHeader}\n.!!!!\nSuccess rate is 80 percent (4/5), round-trip min/avg/max = 1/2/4 ms`
      };
    } else if (hasUpInterface || hasCloud) {
      // Terhubung ke rute luar / gateway / Google / Internet
      return {
        output: `${sendingHeader}\n!!!!!\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 12/15/22 ms`
      };
    } else {
      return {
        output: `${sendingHeader}\n.....\nSuccess rate is 0 percent (0/5)`
      };
    }
  }
}
