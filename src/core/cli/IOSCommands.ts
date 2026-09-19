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
          { command: 'show ip dhcp binding', description: 'DHCP address bindings' },
          { command: 'show ip dhcp pool', description: 'DHCP pool information' },
          { command: 'show dhcp lease', description: 'Show DHCP client leases' },
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
          { command: 'ip route', description: 'Establish static routes' },
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
          { command: 'description', description: 'Interface specific description' },
          { command: 'duplex', description: 'Configure duplex operation' },
          { command: 'speed', description: 'Configure speed operation' },
          { command: 'do', description: 'To run privileged exec commands' },
          { command: 'exit', description: 'Exit from interface configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        if (device instanceof Router) {
          list.push(
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
    return `
Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.4(3)M2, RELEASE SOFTWARE (fc2)
Technical Support: http://www.cisco.com/techsupport
Copyright (c) 1986-2024 by Cisco Systems, Inc.

ROM: System Bootstrap, Version 15.4(3)M2, RELEASE SOFTWARE

${device.hostname} uptime is 2 hours, 45 minutes
System returned to ROM by power-on
System image file is "flash0:c2900-universalk9-mz.SPA.154-3.M2.bin"

Cisco CISCO2911/K9 (revision 1.0) with 491520K/32768K bytes of memory.
Processor board ID FTX1524890B
3 Gigabit Ethernet interfaces
1 Serial(sync/async) interface
DRAM configuration is 64 bits wide with parity disabled.
255K bytes of non-volatile configuration memory.
249856K bytes of ATA System CompactFlash 0 (Read/Write)

Configuration register is 0x2102
`.trim();
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
