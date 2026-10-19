import { CliContext, CliExecutionResult, CommandHelpItem } from '../../types/cli';
import { RouteEntry, DhcpPool, InterfaceConfig, RedistributionConfig } from '../../types/network';
import { Router } from '../devices/Router';
import { Switch } from '../devices/Switch';
import { Device } from '../devices/Device';
import { Host } from '../devices/Host';
import { CliLexer } from './Lexer';
import { SubnetUtils } from '../network/Subnet';
import { SpanningTreeEngine } from '../network/SpanningTreeEngine';
import { EtherChannelEngine } from '../network/EtherChannelEngine';
import { RoutingProtocolEngine } from '../network/RoutingProtocolEngine';
import { FhrpEngine } from '../network/FhrpEngine';
import { PolicyEngine } from '../network/PolicyEngine';
import { VrfEngine } from '../network/VrfEngine';
import { SecurityVpnEngine } from '../network/SecurityVpnEngine';
import { TopologyTraversal } from '../network/TopologyTraversal';
import { TelemetryAutomationEngine } from '../network/TelemetryAutomationEngine';

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
          { command: 'show standby', description: 'HSRP status and configuration' },
          { command: 'show vrrp', description: 'VRRP status and configuration' },
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
          { command: 'show ip ospf database', description: 'OSPF database summary' },
          { command: 'show ip eigrp neighbors', description: 'EIGRP neighbor information' },
          { command: 'show ip bgp summary', description: 'BGP neighbor status' },
          { command: 'show standby', description: 'HSRP status and configuration' },
          { command: 'show standby brief', description: 'HSRP summary status' },
          { command: 'show vrrp', description: 'VRRP status and configuration' },
          { command: 'show vrrp brief', description: 'VRRP summary status' },
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
          { command: 'router eigrp', description: 'Enable EIGRP routing protocol' },
          { command: 'router bgp', description: 'Enable BGP routing protocol' },
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
          { command: 'standby', description: 'HSRP interface configuration commands' },
          { command: 'standby version', description: 'HSRP version' },
          { command: 'vrrp', description: 'VRRP interface configuration commands' },
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
          { command: 'neighbor', description: 'Specify a neighbor router (BGP)' },
          { command: 'area', description: 'OSPF area parameters (range, etc.)' },
          { command: 'router-id', description: 'Set router identifier' },
          { command: 'passive-interface', description: 'Suppress routing updates on an interface' },
          { command: 'no auto-summary', description: 'Disable automatic network number summarization' },
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

      case 'route-map-config':
        list.push(
          { command: 'match ip address', description: 'Match address of route or packet' },
          { command: 'match tag', description: 'Match tag of route' },
          { command: 'set metric', description: 'Set metric for destination routing protocol' },
          { command: 'set metric-type', description: 'Set metric type for destination routing protocol' },
          { command: 'set tag', description: 'Set tag for destination routing protocol' },
          { command: 'set ip next-hop', description: 'Set next hop to which the packet is forwarded' },
          { command: 'exit', description: 'Exit from route-map configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'ip-sla-config':
        list.push(
          { command: 'icmp-echo', description: 'ICMP echo request to target IP' },
          { command: 'frequency', description: 'Frequency of an operation' },
          { command: 'exit', description: 'Exit from IP SLA configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'vrf-config':
        list.push(
          { command: 'rd', description: 'Specify Route Distinguisher' },
          { command: 'description', description: 'VRF specific description' },
          { command: 'route-target', description: 'Specify Target VPN Extended Communities' },
          { command: 'address-family', description: 'Enter Address Family command mode' },
          { command: 'exit', description: 'Exit from VRF configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'vrf-af-config':
        list.push(
          { command: 'route-target', description: 'Specify Target VPN Extended Communities' },
          { command: 'exit', description: 'Exit from VRF address-family configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'crypto-isakmp-policy':
        list.push(
          { command: 'encryption', description: 'Set type of encryption algorithm' },
          { command: 'hash', description: 'Set type of hash algorithm' },
          { command: 'authentication', description: 'Set type of authentication' },
          { command: 'group', description: 'Set Diffie-Hellman group' },
          { command: 'lifetime', description: 'Set lifetime for ISAKMP SA' },
          { command: 'exit', description: 'Exit from ISAKMP policy configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'crypto-ipsec-profile':
        list.push(
          { command: 'set transform-set', description: 'Specify transform-set for profile' },
          { command: 'exit', description: 'Exit from IPsec profile configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'zone-pair-config':
        list.push(
          { command: 'service-policy type inspect', description: 'Attach inspection service policy' },
          { command: 'exit', description: 'Exit from zone-pair configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'class-map-inspect':
        list.push(
          { command: 'match protocol', description: 'Match protocol name' },
          { command: 'match access-group', description: 'Match access-list number' },
          { command: 'exit', description: 'Exit from class-map configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'policy-map-inspect':
        list.push(
          { command: 'class type inspect', description: 'Specify inspection class' },
          { command: 'exit', description: 'Exit from policy-map configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'policy-map-class-inspect':
        list.push(
          { command: 'inspect', description: 'Stateful packet inspection' },
          { command: 'pass', description: 'Pass packet without state tracking' },
          { command: 'drop', description: 'Drop packet' },
          { command: 'exit', description: 'Exit from policy-map class configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'control-plane-config':
        list.push(
          { command: 'service-policy input', description: 'Attach policing policy map to control plane' },
          { command: 'exit', description: 'Exit from control-plane configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'eem-applet-config':
        list.push(
          { command: 'event cli pattern', description: 'Event trigger on CLI command match' },
          { command: 'event syslog pattern', description: 'Event trigger on syslog message match' },
          { command: 'event timer watchdog', description: 'Event trigger on periodic timer' },
          { command: 'action syslog msg', description: 'Generate syslog message action' },
          { command: 'action cli command', description: 'Execute CLI command action' },
          { command: 'exit', description: 'Exit from applet configuration mode' },
          { command: 'end', description: 'Exit to privileged EXEC mode' }
        );
        break;

      case 'mdt-subscription-config':
        list.push(
          { command: 'encoding', description: 'Set streaming encoding (encode-kvgpb or encode-xml)' },
          { command: 'filter xpath', description: 'Set XPath filter for telemetry stream' },
          { command: 'source-address', description: 'Set local source address' },
          { command: 'stream', description: 'Set telemetry stream type (e.g. yang-push)' },
          { command: 'update-policy periodic', description: 'Set periodic update interval in centiseconds' },
          { command: 'update-policy on-change', description: 'Set event-driven on-change telemetry update' },
          { command: 'receiver ip address', description: 'Configure telemetry receiver destination' },
          { command: 'exit', description: 'Exit from subscription configuration mode' },
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
      if (context.mode === 'vrf-af-config') {
        return { output: '', newMode: 'vrf-config' };
      }
      if (['interface-config', 'subinterface-config', 'vlan-config', 'router-config', 'line-config', 'dhcp-config', 'route-map-config', 'ip-sla-config', 'vrf-config', 'crypto-isakmp-policy', 'crypto-ipsec-profile', 'zone-pair-config', 'class-map-inspect', 'policy-map-inspect', 'policy-map-class-inspect', 'control-plane-config', 'eem-applet-config', 'mdt-subscription-config'].includes(context.mode)) {
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

    // EEM CLI event evaluation
    let eemPrefixOutput = '';
    if (device instanceof Router && device.eemApplets.size > 0 && first !== 'exit' && first !== 'end' && context.mode !== 'eem-applet-config') {
      const eemResult = TelemetryAutomationEngine.triggerEemCliEvent(device, raw, (subCmd) => {
        return IOSCommands.execute(subCmd, { ...context, mode: 'priv-exec' }, device, allDevices).output;
      });

      if (eemResult.intercepted) {
        if (eemResult.suppressCli) {
          return { output: eemResult.output.join('\n') };
        } else if (eemResult.output.length > 0) {
          eemPrefixOutput = eemResult.output.join('\n') + '\n';
        }
      }
    }

    // 2. Eksekusi berdasarkan Mode
    let result: CliExecutionResult;
    switch (context.mode) {
      case 'user-exec':
        result = this.execUserMode(tokens, context, device, allDevices);
        break;
      case 'priv-exec':
        result = this.execPrivMode(tokens, context, device, allDevices);
        break;
      case 'global-config':
        result = this.execGlobalConfigMode(tokens, raw, context, device, allDevices);
        break;
      case 'interface-config':
      case 'subinterface-config':
        result = this.execInterfaceConfigMode(tokens, raw, context, device, allDevices);
        break;
      case 'vlan-config':
        result = this.execVlanConfigMode(tokens, context, device);
        break;
      case 'router-config':
        result = this.execRouterConfigMode(tokens, context, device);
        break;
      case 'line-config':
        result = this.execLineConfigMode(tokens, context, device);
        break;
      case 'dhcp-config':
        result = this.execDhcpConfigMode(tokens, raw, context, device);
        break;
      case 'route-map-config':
        result = this.execRouteMapConfigMode(tokens, raw, context, device);
        break;
      case 'ip-sla-config':
        result = this.execIpSlaConfigMode(tokens, raw, context, device);
        break;
      case 'vrf-config':
        result = this.execVrfConfigMode(tokens, raw, context, device);
        break;
      case 'vrf-af-config':
        result = this.execVrfAfConfigMode(tokens, raw, context, device);
        break;
      case 'crypto-isakmp-policy':
        result = this.execCryptoIsakmpPolicyMode(tokens, raw, context, device);
        break;
      case 'crypto-ipsec-profile':
        result = this.execCryptoIpsecProfileMode(tokens, raw, context, device);
        break;
      case 'zone-pair-config':
        result = this.execZonePairConfigMode(tokens, raw, context, device);
        break;
      case 'class-map-inspect':
        result = this.execClassMapInspectMode(tokens, raw, context, device);
        break;
      case 'policy-map-inspect':
        result = this.execPolicyMapInspectMode(tokens, raw, context, device);
        break;
      case 'policy-map-class-inspect':
        result = this.execPolicyMapClassInspectMode(tokens, raw, context, device);
        break;
      case 'control-plane-config':
        result = this.execControlPlaneConfigMode(tokens, raw, context, device);
        break;
      case 'eem-applet-config':
        result = this.execEemAppletConfigMode(tokens, raw, context, device);
        break;
      case 'mdt-subscription-config':
        result = this.execMdtSubscriptionConfigMode(tokens, raw, context, device);
        break;
      case 'keychain-config':
        result = this.execKeyChainConfigMode(tokens, raw, context, device);
        break;
      case 'keychain-key-config':
        result = this.execKeyChainKeyConfigMode(tokens, raw, context, device);
        break;
      case 'router-af-config':
        result = this.execRouterAfConfigMode(tokens, raw, context, device);
        break;
      case 'router-af-interface-config':
        result = this.execRouterAfInterfaceConfigMode(tokens, raw, context, device);
        break;
      case 'router-af-topology-config':
        result = this.execRouterAfTopologyConfigMode(tokens, raw, context, device);
        break;
      default:
        result = { output: `% Invalid input detected at '^' marker.` };
    }

    if (eemPrefixOutput && result) {
      return { ...result, output: eemPrefixOutput + result.output };
    }
    return result;
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
      if (tokens.length >= 4 && tokens[1].toLowerCase() === 'vrf') {
        return this.handlePing(tokens[3], device, allDevices, tokens[2]);
      }
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
      if ('spanning-tree'.startsWith(cmd1) && device instanceof Switch) {
        return this.handleShowSpanningTree(tokens, device, allDevices);
      }
      if ('etherchannel'.startsWith(cmd1) && device instanceof Switch) {
        return this.handleShowEtherchannel(tokens, device, allDevices);
      }
      if ('vtp'.startsWith(cmd1) && device instanceof Switch) {
        return this.handleShowVtp(tokens, device);
      }
      if ('standby'.startsWith(cmd1)) {
        FhrpEngine.convergeFhrp(allDevices);
        const isBrief = tokens.length >= 3 && 'brief'.startsWith(tokens[2].toLowerCase());
        return { output: FhrpEngine.renderShowStandby(device, isBrief) };
      }
      if ('standby'.startsWith(cmd1)) {
        FhrpEngine.convergeFhrp(allDevices);
        const isBrief = tokens.length >= 3 && 'brief'.startsWith(tokens[2].toLowerCase());
        return { output: FhrpEngine.renderShowStandby(device, isBrief) };
      }
      if ('vrrp'.startsWith(cmd1)) {
        FhrpEngine.convergeFhrp(allDevices);
        const isBrief = tokens.length >= 3 && 'brief'.startsWith(tokens[2].toLowerCase());
        return { output: FhrpEngine.renderShowVrrp(device, isBrief) };
      }
      if ('route-map'.startsWith(cmd1)) {
        const rmName = tokens.length >= 3 ? tokens[2] : undefined;
        return { output: PolicyEngine.renderShowRouteMap(device, rmName) };
      }
      if ('track'.startsWith(cmd1)) {
        PolicyEngine.evaluateIpSla(allDevices);
        const trkId = tokens.length >= 3 ? parseInt(tokens[2], 10) : undefined;
        return { output: PolicyEngine.renderShowTrack(device, trkId) };
      }
      if ('ip'.startsWith(cmd1) && tokens.length > 2) {
        const cmd2 = tokens[2].toLowerCase();
        if ('prefix-list'.startsWith(cmd2)) {
          const plName = tokens.length >= 4 ? tokens[3] : undefined;
          return { output: PolicyEngine.renderShowIpPrefixList(device, plName) };
        }
        if ('sla'.startsWith(cmd2)) {
          PolicyEngine.evaluateIpSla(allDevices);
          return { output: PolicyEngine.renderShowIpSla(device) };
        }
        if ('ospf'.startsWith(cmd2)) {
          RoutingProtocolEngine.convergeRoutingProtocols(allDevices);
          return { output: RoutingProtocolEngine.renderShowIpOspfNeighbor(device, allDevices) };
        }
        if ('eigrp'.startsWith(cmd2)) {
          RoutingProtocolEngine.convergeRoutingProtocols(allDevices);
          return { output: RoutingProtocolEngine.renderShowIpEigrpNeighbors(device, allDevices) };
        }
        if ('bgp'.startsWith(cmd2)) {
          RoutingProtocolEngine.convergeRoutingProtocols(allDevices);
          return { output: RoutingProtocolEngine.renderShowIpBgpSummary(device, allDevices) };
        }
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
      if (tokens.length >= 4 && tokens[1].toLowerCase() === 'vrf') {
        return this.handlePing(tokens[3], device, allDevices, tokens[2]);
      }
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

        // show ip nhrp
        if ('nhrp'.startsWith(cmd2) && device instanceof Router) {
          return { output: SecurityVpnEngine.renderShowIpNhrp(device) };
        }

        // show ip interface brief
        if ('interface'.startsWith(cmd2) || cmd2 === 'int') {
          if (tokens.length >= 4 && 'brief'.startsWith(tokens[3].toLowerCase())) {
            return { output: this.renderIpInterfaceBrief(device) };
          }
        }

        // show ip prefix-list ...
        if ('prefix-list'.startsWith(cmd2)) {
          const plName = tokens.length >= 4 ? tokens[3] : undefined;
          return { output: PolicyEngine.renderShowIpPrefixList(device, plName) };
        }

        // show ip sla ...
        if ('sla'.startsWith(cmd2)) {
          PolicyEngine.evaluateIpSla(allDevices);
          return { output: PolicyEngine.renderShowIpSla(device) };
        }

        // show ip vrf
        if ('vrf'.startsWith(cmd2)) {
          return { output: VrfEngine.renderShowVrf(device as Router | Switch) };
        }

        // show ip route
        if ('route'.startsWith(cmd2)) {
          if (tokens.length >= 5 && tokens[3].toLowerCase() === 'vrf') {
            return { output: VrfEngine.renderShowIpRouteVrf(device as Router | Switch, tokens[4]) };
          }
          return { output: this.renderIpRoute(device, allDevices) };
        }

        // show ip ospf ...
        if ('ospf'.startsWith(cmd2)) {
          RoutingProtocolEngine.convergeRoutingProtocols(allDevices);
          if (tokens.length >= 4 && 'neighbor'.startsWith(tokens[3].toLowerCase())) {
            return { output: RoutingProtocolEngine.renderShowIpOspfNeighbor(device, allDevices) };
          }
          if (tokens.length >= 4 && 'database'.startsWith(tokens[3].toLowerCase())) {
            return { output: RoutingProtocolEngine.renderShowIpOspfDatabase(device, allDevices) };
          }
          return { output: RoutingProtocolEngine.renderShowIpOspf(device, allDevices) };
        }

        // show ip eigrp ...
        if ('eigrp'.startsWith(cmd2)) {
          RoutingProtocolEngine.convergeRoutingProtocols(allDevices);
          if (tokens.length >= 4 && 'neighbors'.startsWith(tokens[3].toLowerCase())) {
            return { output: RoutingProtocolEngine.renderShowIpEigrpNeighbors(device, allDevices) };
          }
          if (tokens.length >= 4 && 'interfaces'.startsWith(tokens[3].toLowerCase())) {
            return { output: RoutingProtocolEngine.renderShowIpEigrpInterfaces(device, allDevices) };
          }
          if (tokens.length >= 4 && 'topology'.startsWith(tokens[3].toLowerCase())) {
            return { output: RoutingProtocolEngine.renderShowIpEigrpTopology(device, allDevices) };
          }
          return { output: RoutingProtocolEngine.renderShowIpEigrpNeighbors(device, allDevices) };
        }

        // show ip bgp ...
        if ('bgp'.startsWith(cmd2)) {
          RoutingProtocolEngine.convergeRoutingProtocols(allDevices);
          if (tokens.length >= 4 && 'summary'.startsWith(tokens[3].toLowerCase())) {
            return { output: RoutingProtocolEngine.renderShowIpBgpSummary(device, allDevices) };
          }
          return { output: RoutingProtocolEngine.renderShowIpBgp(device, allDevices) };
        }

        // show ip as-path-access-list [num]
        if ('as-path-access-list'.startsWith(cmd2) || (cmd2 === 'as-path' && tokens.length >= 4 && 'access-list'.startsWith(tokens[3].toLowerCase()))) {
          const lines: string[] = [];
          for (const [num, rules] of device.asPathAccessLists.entries()) {
            for (const r of rules) {
              lines.push(`AS path access list ${num}`);
              lines.push(`    ${r.action} ${r.regex}`);
            }
          }
          return { output: lines.length > 0 ? lines.join('\n') : '% No AS-path access-list configured.' };
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

      // show spanning-tree ...
      if ('spanning-tree'.startsWith(cmd1) && device instanceof Switch) {
        return this.handleShowSpanningTree(tokens, device, allDevices);
      }

      // show etherchannel ...
      if ('etherchannel'.startsWith(cmd1) && device instanceof Switch) {
        return this.handleShowEtherchannel(tokens, device, allDevices);
      }

      // show vtp ...
      if ('vtp'.startsWith(cmd1) && device instanceof Switch) {
        return this.handleShowVtp(tokens, device);
      }

      // show dtp ...
      if ('dtp'.startsWith(cmd1) && device instanceof Switch) {
        return this.handleShowDtp(tokens, device);
      }

      // show standby ...
      if ('standby'.startsWith(cmd1)) {
        FhrpEngine.convergeFhrp(allDevices);
        const isBrief = tokens.length >= 3 && 'brief'.startsWith(tokens[2].toLowerCase());
        return { output: FhrpEngine.renderShowStandby(device, isBrief) };
      }

      // show vrrp ...
      if ('vrrp'.startsWith(cmd1)) {
        FhrpEngine.convergeFhrp(allDevices);
        const isBrief = tokens.length >= 3 && 'brief'.startsWith(tokens[2].toLowerCase());
        return { output: FhrpEngine.renderShowVrrp(device, isBrief) };
      }

      // show bgp [ipv4 | ipv6] [unicast] [summary]
      if ('bgp'.startsWith(cmd1)) {
        RoutingProtocolEngine.convergeRoutingProtocols(allDevices);
        const afType = (tokens.length >= 3 && tokens[2].toLowerCase().includes('6')) ? 'ipv6' : 'ipv4';
        const isSummary = tokens.some(t => t.toLowerCase() === 'summary');
        if (isSummary) {
          return { output: RoutingProtocolEngine.renderShowBgpSummary(device, afType, allDevices) };
        }
        return { output: RoutingProtocolEngine.renderShowBgpTable(device, afType, allDevices) };
      }

      // show route-map ...
      if ('route-map'.startsWith(cmd1)) {
        const rmName = tokens.length >= 3 ? tokens[2] : undefined;
        return { output: PolicyEngine.renderShowRouteMap(device, rmName) };
      }

      // show track ...
      if ('track'.startsWith(cmd1)) {
        PolicyEngine.evaluateIpSla(allDevices);
        const trkId = tokens.length >= 3 ? parseInt(tokens[2], 10) : undefined;
        return { output: PolicyEngine.renderShowTrack(device, trkId) };
      }

      // show vrf ...
      if ('vrf'.startsWith(cmd1)) {
        return { output: VrfEngine.renderShowVrf(device as Router | Switch) };
      }

      // show mpls ...
      if ('mpls'.startsWith(cmd1)) {
        VrfEngine.convergeMpls(allDevices);
        if (tokens.length >= 3) {
          const cmd2 = tokens[2].toLowerCase();
          if ('interfaces'.startsWith(cmd2)) {
            return { output: VrfEngine.renderShowMplsInterfaces(device as Router | Switch) };
          }
          if ('forwarding-table'.startsWith(cmd2)) {
            return { output: VrfEngine.renderShowMplsForwardingTable(device as Router | Switch) };
          }
          if ('ldp'.startsWith(cmd2)) {
            if (tokens.length >= 4 && 'neighbor'.startsWith(tokens[3].toLowerCase())) {
              return { output: VrfEngine.renderShowMplsLdpNeighbor(device as Router | Switch, allDevices) };
            }
          }
        }
        return { output: VrfEngine.renderShowMplsInterfaces(device as Router | Switch) };
      }

      // show crypto ...
      if ('crypto'.startsWith(cmd1) && device instanceof Router) {
        if (tokens.length >= 4 && 'isakmp'.startsWith(tokens[2].toLowerCase()) && 'sa'.startsWith(tokens[3].toLowerCase())) {
          return { output: SecurityVpnEngine.renderShowCryptoIsakmpSa(device) };
        }
        if (tokens.length >= 4 && 'ipsec'.startsWith(tokens[2].toLowerCase()) && 'sa'.startsWith(tokens[3].toLowerCase())) {
          return { output: SecurityVpnEngine.renderShowCryptoIpsecSa(device) };
        }
        if (tokens.length >= 3 && 'session'.startsWith(tokens[2].toLowerCase())) {
          return { output: SecurityVpnEngine.renderShowCryptoSession(device) };
        }
        return { output: SecurityVpnEngine.renderShowCryptoSession(device) };
      }

      // show zone security
      if ('zone'.startsWith(cmd1) && device instanceof Router) {
        return { output: SecurityVpnEngine.renderShowZoneSecurity(device) };
      }

      // show zone-pair security
      if ('zone-pair'.startsWith(cmd1) && device instanceof Router) {
        return { output: SecurityVpnEngine.renderShowZonePairSecurity(device) };
      }

      // show policy-map ...
      if ('policy-map'.startsWith(cmd1) && device instanceof Router) {
        if (tokens.length >= 3 && 'control-plane'.startsWith(tokens[2].toLowerCase())) {
          return { output: SecurityVpnEngine.renderShowPolicyMapControlPlane(device) };
        }
        if (tokens.length >= 3 && tokens[2].toLowerCase() === 'type' && tokens[3]?.toLowerCase() === 'inspect') {
          const zpName = tokens.length >= 6 ? tokens[5] : (tokens.length >= 5 && !'zone-pair'.startsWith(tokens[4].toLowerCase()) ? tokens[4] : undefined);
          return { output: SecurityVpnEngine.renderShowPolicyMapInspect(device, zpName) };
        }
      }

      // show restconf ...
      if ('restconf'.startsWith(cmd1) && device instanceof Router) {
        return { output: TelemetryAutomationEngine.renderShowRestconfStatus(device) };
      }

      // show netconf-yang ...
      if ('netconf-yang'.startsWith(cmd1) && device instanceof Router) {
        if (tokens.length >= 3 && 'sessions'.startsWith(tokens[2].toLowerCase())) {
          return { output: TelemetryAutomationEngine.renderShowNetconfYangSessions(device) };
        }
        return { output: TelemetryAutomationEngine.renderShowNetconfYangStatus(device) };
      }

      // show event manager ...
      if ('event'.startsWith(cmd1) && tokens.length >= 3 && 'manager'.startsWith(tokens[2].toLowerCase()) && device instanceof Router) {
        if (tokens.length >= 4 && 'history'.startsWith(tokens[3].toLowerCase())) {
          return { output: TelemetryAutomationEngine.renderShowEemHistory(device) };
        }
        return { output: TelemetryAutomationEngine.renderShowEemRegistered(device) };
      }

      // show telemetry ...
      if ('telemetry'.startsWith(cmd1) && device instanceof Router) {
        if (tokens.length >= 3 && 'connection'.startsWith(tokens[2].toLowerCase())) {
          return { output: TelemetryAutomationEngine.renderShowTelemetryConnection(device) };
        }
        if (tokens.length >= 3 && 'ietf'.startsWith(tokens[2].toLowerCase())) {
          if (tokens.length >= 5 && !isNaN(parseInt(tokens[4], 10))) {
            return { output: TelemetryAutomationEngine.renderShowMdtSubscriptions(device, parseInt(tokens[4], 10)) };
          }
          return { output: TelemetryAutomationEngine.renderShowMdtSubscriptions(device) };
        }
        return { output: TelemetryAutomationEngine.renderShowMdtSubscriptions(device) };
      }

      // show key chain
      if ('key'.startsWith(cmd1) && tokens.length >= 3 && 'chain'.startsWith(tokens[2].toLowerCase())) {
        const lines: string[] = [];
        if (device.keyChains && device.keyChains.size > 0) {
          for (const kc of device.keyChains.values()) {
            lines.push(`Key-chain ${kc.name}:`);
            for (const k of kc.keys.values()) {
              lines.push(`    key ${k.keyId} -- text "${k.keyString || ''}"`);
              lines.push(`        accept lifetime (always valid) - (always valid) [valid now]`);
              lines.push(`        send lifetime (always valid) - (always valid) [valid now]`);
            }
          }
        } else {
          lines.push('% No key chains configured');
        }
        return { output: lines.join('\n') };
      }

      // show ipv6 ...
      if ('ipv6'.startsWith(cmd1) && tokens.length >= 3) {
        const cmd2 = tokens[2].toLowerCase();
        if ('eigrp'.startsWith(cmd2)) {
          RoutingProtocolEngine.convergeRoutingProtocols(allDevices);
          if (tokens.length >= 4 && 'neighbors'.startsWith(tokens[3].toLowerCase())) {
            return { output: RoutingProtocolEngine.renderShowIpv6EigrpNeighbors(device, allDevices) };
          }
          if (tokens.length >= 4 && 'interfaces'.startsWith(tokens[3].toLowerCase())) {
            return { output: RoutingProtocolEngine.renderShowIpv6EigrpInterfaces(device, allDevices) };
          }
          if (tokens.length >= 4 && 'topology'.startsWith(tokens[3].toLowerCase())) {
            return { output: RoutingProtocolEngine.renderShowIpv6EigrpTopology(device, allDevices) };
          }
          return { output: RoutingProtocolEngine.renderShowIpv6EigrpNeighbors(device, allDevices) };
        }
        if ('route'.startsWith(cmd2)) {
          return { output: this.renderIpv6Route(device) };
        }
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

    // ipv6 unicast-routing
    if (cmd0 === 'ipv6' && tokens.length >= 2 && 'unicast-routing'.startsWith(tokens[1].toLowerCase())) {
      (device as Router | Switch).ipv6UnicastRouting = true;
      return { output: '' };
    }

    // no ipv6 unicast-routing
    if (cmd0 === 'no' && tokens.length >= 3 && tokens[1].toLowerCase() === 'ipv6' && 'unicast-routing'.startsWith(tokens[2].toLowerCase())) {
      (device as Router | Switch).ipv6UnicastRouting = false;
      return { output: '' };
    }

    // router ospfv3 <pid> OR ipv6 router ospf <pid>
    if (
      ('router'.startsWith(cmd0) && tokens.length >= 3 && tokens[1].toLowerCase().startsWith('ospfv3')) ||
      ('ipv6'.startsWith(cmd0) && tokens.length >= 4 && 'router'.startsWith(tokens[1].toLowerCase()) && 'ospf'.startsWith(tokens[2].toLowerCase()))
    ) {
      const pidStr = tokens[0].toLowerCase().startsWith('router') ? tokens[2] : tokens[3];
      const pid = parseInt(pidStr, 10);
      if (isNaN(pid) || pid < 1) return { output: `% Invalid process ID.` };
      const target = device as Router | Switch;
      if (!target.ospfv3Config) {
        target.ospfv3Config = { enabled: true, processId: pid, passiveInterfaces: [] };
      } else {
        target.ospfv3Config.enabled = true;
        target.ospfv3Config.processId = pid;
      }
      return {
        output: '',
        newMode: 'router-config',
        contextUpdates: {
          targetRoutingProcess: `ospfv3-${pid}`,
          targetRoutingProtocol: 'ospfv3',
          targetProcessId: pid
        }
      };
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
      if (!iface && normalized.startsWith('Port-channel') && (device instanceof Switch || device instanceof Router)) {
        const poNum = parseInt(normalized.replace('Port-channel', ''), 10);
        if (!isNaN(poNum)) {
          const baseMac = Array.from(device.interfaces.values())[0]?.macAddress || '0002.ba00.0001';
          const poIface: InterfaceConfig = {
            name: normalized,
            shortName: `Po${poNum}`,
            macAddress: baseMac,
            status: 'up',
            isShutdown: false,
            switchportMode: 'access',
            accessVlan: 1,
            trunkAllowedVlans: Array.from({ length: 4094 }, (_, idx) => idx + 1),
            nativeVlan: 1
          };
          device.addInterface(poIface);
          iface = poIface;
        }
      }

      if (!iface && normalized.startsWith('Tunnel') && device instanceof Router) {
        iface = device.getOrCreateTunnel(normalized);
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

        const target = device as Router | Switch;
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
          contextUpdates: {
            targetRoutingProcess: `ospf-${pid}`,
            targetRoutingProtocol: 'ospf',
            targetProcessId: pid
          }
        };
      }
    }

    // router eigrp <as | name>
    if ('router'.startsWith(cmd0) && tokens.length >= 3 && 'eigrp'.startsWith(tokens[1].toLowerCase())) {
      if (device instanceof Router || (device instanceof Switch && device.isLayer3)) {
        const as = parseInt(tokens[2], 10);
        const target = device as Router | Switch;

        if (!isNaN(as)) {
          if (as < 1 || as > 65535) return { output: `% Invalid AS number.` };
          if (!target.eigrpConfig) {
            target.eigrpConfig = {
              enabled: true,
              asNumber: as,
              networks: [],
              passiveInterfaces: []
            };
          } else {
            target.eigrpConfig.enabled = true;
            target.eigrpConfig.asNumber = as;
          }
          return {
            output: '',
            newMode: 'router-config',
            contextUpdates: {
              targetRoutingProcess: `eigrp-${as}`,
              targetRoutingProtocol: 'eigrp',
              targetAsNumber: as
            }
          };
        } else {
          // Named EIGRP: router eigrp <NAME>
          const name = tokens[2];
          return {
            output: '',
            newMode: 'router-config',
            contextUpdates: {
              targetRoutingProcess: `eigrp-${name}`,
              targetRoutingProtocol: 'eigrp',
              targetEigrpName: name
            }
          };
        }
      }
    }

    // ipv6 router eigrp <as>
    if (cmd0 === 'ipv6' && tokens.length >= 4 && 'router'.startsWith(tokens[1].toLowerCase()) && 'eigrp'.startsWith(tokens[2].toLowerCase())) {
      if (device instanceof Router || (device instanceof Switch && device.isLayer3)) {
        const as = parseInt(tokens[3], 10);
        if (isNaN(as) || as < 1 || as > 65535) return { output: `% Invalid AS number.` };

        const target = device as Router | Switch;
        if (!target.eigrpV6Config) {
          target.eigrpV6Config = {
            enabled: true,
            asNumber: as,
            passiveInterfaces: []
          };
        } else {
          target.eigrpV6Config.enabled = true;
          target.eigrpV6Config.asNumber = as;
        }
        return {
          output: '',
          newMode: 'router-config',
          contextUpdates: {
            targetRoutingProcess: `eigrp-v6-${as}`,
            targetRoutingProtocol: 'eigrp',
            targetAsNumber: as,
            targetAfProto: 'ipv6'
          }
        };
      }
    }

    // key chain <name>
    if (cmd0 === 'key' && tokens.length >= 3 && 'chain'.startsWith(tokens[1].toLowerCase())) {
      const name = tokens[2];
      if (!device.keyChains.has(name)) {
        device.keyChains.set(name, { name, keys: new Map() });
      }
      return {
        output: '',
        newMode: 'keychain-config',
        contextUpdates: {
          targetKeyChain: name
        }
      };
    }

    // router bgp <as>
    if ('router'.startsWith(cmd0) && tokens.length >= 3 && 'bgp'.startsWith(tokens[1].toLowerCase())) {
      if (device instanceof Router || (device instanceof Switch && device.isLayer3)) {
        let as = parseInt(tokens[2], 10);
        if (tokens[2].includes('.')) {
          const parts = tokens[2].split('.');
          const hi = parseInt(parts[0], 10);
          const lo = parseInt(parts[1], 10);
          if (!isNaN(hi) && !isNaN(lo)) {
            as = hi * 65536 + lo;
          }
        }
        if (isNaN(as) || as < 1 || as > 4294967295) return { output: `% Invalid AS number.` };

        const target = device as Router | Switch;
        if (!target.bgpConfig) {
          target.bgpConfig = {
            enabled: true,
            asNumber: as,
            neighbors: new Map(),
            networks: []
          };
        } else {
          target.bgpConfig.enabled = true;
          target.bgpConfig.asNumber = as;
        }
        return {
          output: '',
          newMode: 'router-config',
          contextUpdates: {
            targetRoutingProcess: `bgp-${as}`,
            targetRoutingProtocol: 'bgp',
            targetAsNumber: as
          }
        };
      }
    }

    // no router ospf / eigrp / bgp
    if (cmd0 === 'no' && tokens.length >= 3 && 'router'.startsWith(tokens[1].toLowerCase())) {
      const proto = tokens[2].toLowerCase();
      const target = device as Router | Switch;
      if ('ospf'.startsWith(proto)) {
        target.ospfConfig = undefined;
        return { output: '' };
      }
      if ('eigrp'.startsWith(proto)) {
        target.eigrpConfig = undefined;
        return { output: '' };
      }
      if ('bgp'.startsWith(proto)) {
        target.bgpConfig = undefined;
        return { output: '' };
      }
    }

    // route-map <name> [permit | deny] [sequence]
    if ('route-map'.startsWith(cmd0) && tokens.length >= 2) {
      const mapName = tokens[1];
      let action: 'permit' | 'deny' = 'permit';
      let seq = 10;
      if (tokens.length >= 3) {
        const a3 = tokens[2].toLowerCase();
        if (a3 === 'deny') action = 'deny';
        else if (a3 === 'permit') action = 'permit';
        else if (!isNaN(parseInt(a3, 10))) seq = parseInt(a3, 10);
      }
      if (tokens.length >= 4) {
        const a4 = tokens[3].toLowerCase();
        if (a4 === 'deny') action = 'deny';
        else if (a4 === 'permit') action = 'permit';
        else if (!isNaN(parseInt(a4, 10))) seq = parseInt(a4, 10);
      }

      const target = device as Router | Switch;
      if (!target.routeMaps) target.routeMaps = new Map();
      let rm = target.routeMaps.get(mapName);
      if (!rm) {
        rm = { name: mapName, clauses: [] };
        target.routeMaps.set(mapName, rm);
      }
      let clause = rm.clauses.find(c => c.sequence === seq);
      if (!clause) {
        clause = { sequence: seq, action };
        rm.clauses.push(clause);
      } else {
        clause.action = action;
      }

      return {
        output: '',
        newMode: 'route-map-config',
        contextUpdates: {
          targetRouteMapName: mapName,
          targetRouteMapSeq: seq
        }
      };
    }

    // no route-map <name> [permit | deny] [sequence]
    if (cmd0 === 'no' && tokens.length >= 3 && 'route-map'.startsWith(tokens[1].toLowerCase())) {
      const mapName = tokens[2];
      const target = device as Router | Switch;
      if (target.routeMaps) {
        if (tokens.length >= 4) {
          const lastTok = tokens[tokens.length - 1];
          const seqNum = parseInt(lastTok, 10);
          if (!isNaN(seqNum)) {
            const rm = target.routeMaps.get(mapName);
            if (rm) {
              rm.clauses = rm.clauses.filter(c => c.sequence !== seqNum);
              if (rm.clauses.length === 0) target.routeMaps.delete(mapName);
            }
            return { output: '' };
          }
        }
        target.routeMaps.delete(mapName);
      }
      return { output: '' };
    }

    // ip as-path access-list <num> {permit | deny} <regex>
    if ('ip'.startsWith(cmd0) && tokens.length >= 5 && 'as-path'.startsWith(tokens[1].toLowerCase()) && 'access-list'.startsWith(tokens[2].toLowerCase())) {
      const aclNum = parseInt(tokens[3], 10);
      const action = tokens[4].toLowerCase() as 'permit' | 'deny';
      const regex = tokens.slice(5).join(' ');
      if (!isNaN(aclNum) && (action === 'permit' || action === 'deny')) {
        if (!device.asPathAccessLists.has(aclNum)) {
          device.asPathAccessLists.set(aclNum, []);
        }
        device.asPathAccessLists.get(aclNum)!.push({ action, regex });
        return { output: '' };
      }
    }

    // no ip as-path access-list <num>
    if (cmd0 === 'no' && tokens.length >= 5 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'as-path'.startsWith(tokens[2].toLowerCase()) && 'access-list'.startsWith(tokens[3].toLowerCase())) {
      const aclNum = parseInt(tokens[4], 10);
      if (!isNaN(aclNum)) {
        device.asPathAccessLists.delete(aclNum);
        return { output: '' };
      }
    }

    // ip prefix-list <name> [seq <seq>] {permit | deny} <network/len> [ge <ge>] [le <le>]
    if ('ip'.startsWith(cmd0) && tokens.length >= 3 && 'prefix-list'.startsWith(tokens[1].toLowerCase())) {
      const listName = tokens[2];
      let seq = 10;
      let action: 'permit' | 'deny' = 'permit';
      let prefix = '';
      let ge: number | undefined;
      let le: number | undefined;

      let idx = 3;
      if (idx < tokens.length && 'seq'.startsWith(tokens[idx].toLowerCase())) {
        idx++;
        seq = parseInt(tokens[idx], 10) || 10;
        idx++;
      }
      if (idx < tokens.length) {
        const act = tokens[idx].toLowerCase();
        if (act === 'permit' || act === 'deny') {
          action = act;
          idx++;
        }
      }
      if (idx < tokens.length) {
        prefix = tokens[idx];
        idx++;
      }
      while (idx < tokens.length) {
        if ('ge'.startsWith(tokens[idx].toLowerCase()) && idx + 1 < tokens.length) {
          ge = parseInt(tokens[idx + 1], 10);
          idx += 2;
        } else if ('le'.startsWith(tokens[idx].toLowerCase()) && idx + 1 < tokens.length) {
          le = parseInt(tokens[idx + 1], 10);
          idx += 2;
        } else {
          idx++;
        }
      }

      if (prefix && prefix.includes('/')) {
        const target = device as Router | Switch;
        if (!target.prefixLists) target.prefixLists = new Map();
        let pl = target.prefixLists.get(listName);
        if (!pl) {
          pl = { name: listName, entries: [] };
          target.prefixLists.set(listName, pl);
        }
        if (!tokens.some(t => t.toLowerCase() === 'seq') && pl.entries.length > 0) {
          const maxSeq = Math.max(...pl.entries.map(e => e.seq));
          seq = maxSeq + 10;
        }
        pl.entries = pl.entries.filter(e => e.seq !== seq);
        pl.entries.push({ seq, action, prefix, ge, le });
        pl.entries.sort((a, b) => a.seq - b.seq);
        return { output: '' };
      }
    }

    // no ip prefix-list <name> [seq <seq>]
    if (cmd0 === 'no' && tokens.length >= 4 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'prefix-list'.startsWith(tokens[2].toLowerCase())) {
      const listName = tokens[3];
      const target = device as Router | Switch;
      if (target.prefixLists) {
        if (tokens.length >= 6 && 'seq'.startsWith(tokens[4].toLowerCase())) {
          const seqNum = parseInt(tokens[5], 10);
          const pl = target.prefixLists.get(listName);
          if (pl) {
            pl.entries = pl.entries.filter(e => e.seq !== seqNum);
            if (pl.entries.length === 0) target.prefixLists.delete(listName);
          }
          return { output: '' };
        }
        target.prefixLists.delete(listName);
      }
      return { output: '' };
    }

    // ip sla <id>
    if ('ip'.startsWith(cmd0) && tokens.length >= 3 && 'sla'.startsWith(tokens[1].toLowerCase()) && !tokens[1].toLowerCase().includes('schedule')) {
      const slaId = parseInt(tokens[2], 10);
      if (isNaN(slaId)) return { output: '% Invalid SLA ID' };
      const target = device as Router | Switch;
      if (!target.ipSlas) target.ipSlas = new Map();
      let sla = target.ipSlas.get(slaId);
      if (!sla) {
        sla = { id: slaId, type: 'icmp-echo', targetIp: '', state: 'Timeout' };
        target.ipSlas.set(slaId, sla);
      }
      return {
        output: '',
        newMode: 'ip-sla-config',
        contextUpdates: { targetIpSlaId: slaId }
      };
    }

    // no ip sla <id>
    if (cmd0 === 'no' && tokens.length >= 4 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'sla'.startsWith(tokens[2].toLowerCase())) {
      const slaId = parseInt(tokens[3], 10);
      const target = device as Router | Switch;
      if (target.ipSlas) target.ipSlas.delete(slaId);
      return { output: '' };
    }

    // track <id> ip sla <slaId> state
    if ('track'.startsWith(cmd0) && tokens.length >= 5 && 'ip'.startsWith(tokens[2].toLowerCase()) && 'sla'.startsWith(tokens[3].toLowerCase())) {
      const trkId = parseInt(tokens[1], 10);
      const slaId = parseInt(tokens[4], 10);
      const target = device as Router | Switch;
      if (!target.trackObjects) target.trackObjects = new Map();
      target.trackObjects.set(trkId, {
        id: trkId,
        slaId,
        state: 'DOWN'
      });
      return { output: '' };
    }

    // no track <id>
    if (cmd0 === 'no' && tokens.length >= 3 && 'track'.startsWith(tokens[1].toLowerCase())) {
      const trkId = parseInt(tokens[2], 10);
      const target = device as Router | Switch;
      if (target.trackObjects) target.trackObjects.delete(trkId);
      return { output: '' };
    }

    // vrf definition <name> / ip vrf <name>
    if (
      (cmd0 === 'vrf' && tokens.length >= 3 && 'definition'.startsWith(tokens[1].toLowerCase())) ||
      (cmd0 === 'ip' && tokens.length >= 3 && 'vrf'.startsWith(tokens[1].toLowerCase()) && !tokens[1].toLowerCase().includes('forwarding'))
    ) {
      const vrfName = cmd0 === 'vrf' ? tokens[2] : tokens[2];
      VrfEngine.getOrCreateVrf(device as Router | Switch, vrfName);
      return {
        output: '',
        newMode: 'vrf-config',
        contextUpdates: { targetVrfName: vrfName }
      };
    }

    // no vrf definition <name> / no ip vrf <name>
    if (
      (cmd0 === 'no' && tokens.length >= 4 && 'vrf'.startsWith(tokens[1].toLowerCase()) && 'definition'.startsWith(tokens[2].toLowerCase())) ||
      (cmd0 === 'no' && tokens.length >= 4 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'vrf'.startsWith(tokens[2].toLowerCase()))
    ) {
      const vrfName = tokens[1].toLowerCase() === 'vrf' ? tokens[3] : tokens[3];
      VrfEngine.removeVrf(device as Router | Switch, vrfName);
      return { output: '' };
    }

    // mpls ip (global)
    if (cmd0 === 'mpls' && tokens.length >= 2 && 'ip'.startsWith(tokens[1].toLowerCase())) {
      (device as Router | Switch).mplsEnabled = true;
      return { output: '' };
    }

    // no mpls ip (global)
    if (cmd0 === 'no' && tokens.length >= 3 && 'mpls'.startsWith(tokens[1].toLowerCase()) && 'ip'.startsWith(tokens[2].toLowerCase())) {
      (device as Router | Switch).mplsEnabled = false;
      return { output: '' };
    }

    // mpls ldp router-id <interface> [force]
    if (cmd0 === 'mpls' && tokens.length >= 4 && 'ldp'.startsWith(tokens[1].toLowerCase()) && 'router-id'.startsWith(tokens[2].toLowerCase())) {
      (device as Router | Switch).mplsLdpRouterId = tokens[3];
      return { output: '' };
    }

    // ip route vrf <name> <network> <mask|cidr> <next-hop>
    if ('ip'.startsWith(cmd0) && tokens.length >= 7 && 'route'.startsWith(tokens[1].toLowerCase()) && tokens[2].toLowerCase() === 'vrf') {
      const vrfName = tokens[3];
      const net = tokens[4];
      const mask = tokens[5];
      const next = tokens[6];

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

      const target = device as Router | Switch;
      const vrf = VrfEngine.getOrCreateVrf(target, vrfName);
      vrf.routingTable = vrf.routingTable.filter(r => !(r.network === net && r.mask === mask));
      vrf.routingTable.push(routeEntry);
      return { output: '' };
    }

    // no ip route vrf <name> <network> <mask|cidr> [next-hop]
    if (cmd0 === 'no' && tokens.length >= 6 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'route'.startsWith(tokens[2].toLowerCase()) && tokens[3].toLowerCase() === 'vrf') {
      const vrfName = tokens[4];
      const net = tokens[5];
      const mask = tokens[6];
      const target = device as Router | Switch;
      if (target.vrfInstances && target.vrfInstances.has(vrfName)) {
        const vrf = target.vrfInstances.get(vrfName)!;
        vrf.routingTable = vrf.routingTable.filter(r => !(r.network === net && r.mask === mask));
      }
      return { output: '' };
    }

    // no ip route <network> <mask|cidr> [next-hop]
    if (cmd0 === 'no' && tokens.length >= 5 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'route'.startsWith(tokens[2].toLowerCase()) && tokens[3].toLowerCase() !== 'vrf') {
      const net = tokens[3];
      const mask = tokens[4];
      if (device instanceof Router || (device instanceof Switch && device.isLayer3)) {
        device.routingTable = device.routingTable.filter(r => !(r.network === net && r.mask === mask));
      }
      return { output: '' };
    }

    // ip route <network> <mask|cidr> <next-hop>
    if ('ip'.startsWith(cmd0) && tokens.length >= 5 && 'route'.startsWith(tokens[1].toLowerCase()) && tokens[2].toLowerCase() !== 'vrf') {
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

    // spanning-tree mode <pvst | rapid-pvst | mst>
    if ('spanning-tree'.startsWith(cmd0) && tokens.length >= 3 && 'mode'.startsWith(tokens[1].toLowerCase())) {
      if (!(device instanceof Switch)) return { output: `% Spanning tree is only supported on switches.` };
      const m = tokens[2].toLowerCase();
      if (m === 'pvst' || m === 'rapid-pvst' || m === 'mst') {
        device.spanningTreeMode = m as any;
        return { output: '' };
      }
      return { output: `% Invalid spanning-tree mode. Available: pvst, rapid-pvst, mst.` };
    }

    // spanning-tree vlan <id> priority <val> / root <primary|secondary>
    if ('spanning-tree'.startsWith(cmd0) && tokens.length >= 5 && 'vlan'.startsWith(tokens[1].toLowerCase())) {
      if (!(device instanceof Switch)) return { output: `% Spanning tree is only supported on switches.` };
      const vlanId = parseInt(tokens[2], 10);
      const sub = tokens[3].toLowerCase();
      if ('priority'.startsWith(sub)) {
        const prio = parseInt(tokens[4], 10);
        if (isNaN(prio) || prio < 0 || prio > 61440 || prio % 4096 !== 0) {
          return { output: `% Bridge priority must be in increments of 4096 (0, 4096, 8192 ... 61440).` };
        }
        device.stpPriorities.set(vlanId, prio);
        return { output: '' };
      }
      if ('root'.startsWith(sub)) {
        const rootType = tokens[4].toLowerCase();
        if ('primary'.startsWith(rootType)) {
          device.stpPriorities.set(vlanId, 24576);
          return { output: '' };
        } else if ('secondary'.startsWith(rootType)) {
          device.stpPriorities.set(vlanId, 28672);
          return { output: '' };
        }
      }
    }

    // no spanning-tree vlan <id> priority
    if (cmd0 === 'no' && tokens.length >= 5 && 'spanning-tree'.startsWith(tokens[1].toLowerCase()) && 'vlan'.startsWith(tokens[2].toLowerCase()) && 'priority'.startsWith(tokens[4].toLowerCase())) {
      if (device instanceof Switch) {
        const vlanId = parseInt(tokens[3], 10);
        device.stpPriorities.set(vlanId, 32768);
      }
      return { output: '' };
    }

    // spanning-tree portfast default / bpduguard default
    if ('spanning-tree'.startsWith(cmd0) && tokens.length >= 3 && 'portfast'.startsWith(tokens[1].toLowerCase())) {
      if ('default'.startsWith(tokens[2].toLowerCase())) {
        return { output: '% Portfast default enabled on all access ports.' };
      }
      if ('bpduguard'.startsWith(tokens[2].toLowerCase()) && tokens.length >= 4 && 'default'.startsWith(tokens[3].toLowerCase())) {
        return { output: '% Portfast BPDU guard default enabled.' };
      }
    }

    // vtp domain <name> / vtp mode <mode>
    if ('vtp'.startsWith(cmd0) && tokens.length >= 3) {
      if (!(device instanceof Switch)) return { output: `% VTP is only supported on switches.` };
      const vSub = tokens[1].toLowerCase();
      if ('domain'.startsWith(vSub)) {
        const oldDomain = device.vtp.domain || 'NULL';
        device.vtp.domain = tokens[2];
        return { output: `Changing VTP domain name from ${oldDomain} to ${tokens[2]}` };
      }
      if ('mode'.startsWith(vSub)) {
        const m = tokens[2].toLowerCase();
        if (['server', 'client', 'transparent', 'off'].includes(m)) {
          device.vtp.mode = m as any;
          return { output: `Setting device to VTP ${m.toUpperCase()} mode.` };
        }
        return { output: `% Invalid VTP mode. Available: server, client, transparent, off.` };
      }
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

    // crypto isakmp policy <priority>
    if ('crypto'.startsWith(cmd0) && tokens.length >= 4 && 'isakmp'.startsWith(tokens[1].toLowerCase()) && 'policy'.startsWith(tokens[2].toLowerCase())) {
      const prio = parseInt(tokens[3], 10);
      if (isNaN(prio) || prio < 1 || prio > 10000) return { output: '% Invalid priority (1-10000).' };
      if (device instanceof Router) {
        if (!device.cryptoPolicies.has(prio)) {
          device.cryptoPolicies.set(prio, { priority: prio });
        }
      }
      return {
        output: '',
        newMode: 'crypto-isakmp-policy',
        contextUpdates: { targetIsakmpPriority: prio }
      };
    }

    // crypto isakmp key <secret> address <peer>
    if ('crypto'.startsWith(cmd0) && tokens.length >= 6 && 'isakmp'.startsWith(tokens[1].toLowerCase()) && 'key'.startsWith(tokens[2].toLowerCase()) && 'address'.startsWith(tokens[4].toLowerCase())) {
      if (device instanceof Router) {
        device.cryptoKeys = device.cryptoKeys.filter(k => k.address !== tokens[5]);
        device.cryptoKeys.push({ key: tokens[3], address: tokens[5] });
      }
      return { output: '' };
    }

    // crypto ipsec transform-set <name> <transforms...>
    if ('crypto'.startsWith(cmd0) && tokens.length >= 5 && 'ipsec'.startsWith(tokens[1].toLowerCase()) && 'transform-set'.startsWith(tokens[2].toLowerCase())) {
      const tsName = tokens[3];
      const transforms = tokens.slice(4);
      if (device instanceof Router) {
        device.cryptoTransformSets.set(tsName, { name: tsName, transforms });
      }
      return { output: '' };
    }

    // crypto ipsec profile <name>
    if ('crypto'.startsWith(cmd0) && tokens.length >= 4 && 'ipsec'.startsWith(tokens[1].toLowerCase()) && 'profile'.startsWith(tokens[2].toLowerCase())) {
      const profName = tokens[3];
      if (device instanceof Router) {
        if (!device.cryptoProfiles.has(profName)) {
          device.cryptoProfiles.set(profName, { name: profName });
        }
      }
      return {
        output: '',
        newMode: 'crypto-ipsec-profile',
        contextUpdates: { targetIpsecProfileName: profName }
      };
    }

    // zone security <name>
    if ('zone'.startsWith(cmd0) && tokens.length >= 3 && 'security'.startsWith(tokens[1].toLowerCase())) {
      const zName = tokens[2];
      if (device instanceof Router) {
        if (!device.securityZones.has(zName)) {
          device.securityZones.set(zName, { name: zName, interfaces: [] });
        }
      }
      return { output: '' };
    }

    // zone-pair security <name> source <src> destination <dst>
    if ('zone-pair'.startsWith(cmd0) && tokens.length >= 7 && 'security'.startsWith(tokens[1].toLowerCase()) && 'source'.startsWith(tokens[3].toLowerCase()) && 'destination'.startsWith(tokens[5].toLowerCase())) {
      const zpName = tokens[2];
      const srcZone = tokens[4];
      const dstZone = tokens[6];
      if (device instanceof Router) {
        device.zonePairs.set(zpName, { name: zpName, sourceZone: srcZone, destinationZone: dstZone });
      }
      return {
        output: '',
        newMode: 'zone-pair-config',
        contextUpdates: { targetZonePairName: zpName }
      };
    }

    // class-map type inspect [match-any | match-all] <name>
    if ('class-map'.startsWith(cmd0) && tokens.length >= 4 && tokens[1].toLowerCase() === 'type' && tokens[2].toLowerCase() === 'inspect') {
      let matchType: 'match-any' | 'match-all' = 'match-all';
      let cmName = tokens[3];
      if (tokens.length >= 5 && (tokens[3].toLowerCase() === 'match-any' || tokens[3].toLowerCase() === 'match-all')) {
        matchType = tokens[3].toLowerCase() as any;
        cmName = tokens[4];
      }
      if (device instanceof Router) {
        if (!device.inspectClassMaps.has(cmName)) {
          device.inspectClassMaps.set(cmName, { name: cmName, matchType, matches: [] });
        }
      }
      return {
        output: '',
        newMode: 'class-map-inspect',
        contextUpdates: { targetClassMapName: cmName }
      };
    }

    // policy-map type inspect <name>
    if ('policy-map'.startsWith(cmd0) && tokens.length >= 4 && tokens[1].toLowerCase() === 'type' && tokens[2].toLowerCase() === 'inspect') {
      const pmName = tokens[3];
      if (device instanceof Router) {
        if (!device.inspectPolicyMaps.has(pmName)) {
          device.inspectPolicyMaps.set(pmName, { name: pmName, classes: [] });
        }
      }
      return {
        output: '',
        newMode: 'policy-map-inspect',
        contextUpdates: { targetPolicyMapName: pmName }
      };
    }

    // control-plane
    if ('control-plane'.startsWith(cmd0)) {
      return {
        output: '',
        newMode: 'control-plane-config'
      };
    }

    // restconf
    if (cmd0 === 'restconf') {
      if (device instanceof Router) {
        device.restconfEnabled = true;
      }
      return { output: '' };
    }
    if (cmd0 === 'no' && tokens.length >= 2 && tokens[1].toLowerCase() === 'restconf') {
      if (device instanceof Router) {
        device.restconfEnabled = false;
      }
      return { output: '' };
    }

    // netconf-yang
    if (cmd0 === 'netconf-yang') {
      if (device instanceof Router) {
        device.netconfEnabled = true;
      }
      return { output: '' };
    }
    if (cmd0 === 'no' && tokens.length >= 2 && tokens[1].toLowerCase() === 'netconf-yang') {
      if (device instanceof Router) {
        device.netconfEnabled = false;
      }
      return { output: '' };
    }

    // event manager applet <name>
    if ('event'.startsWith(cmd0) && tokens.length >= 4 && tokens[1].toLowerCase() === 'manager' && tokens[2].toLowerCase() === 'applet') {
      const appletName = tokens[3];
      if (device instanceof Router) {
        if (!device.eemApplets.has(appletName)) {
          device.eemApplets.set(appletName, { name: appletName, actions: [] });
        }
      }
      return {
        output: '',
        newMode: 'eem-applet-config',
        contextUpdates: { targetAppletName: appletName }
      };
    }

    if (cmd0 === 'no' && tokens.length >= 5 && tokens[1].toLowerCase() === 'event' && tokens[2].toLowerCase() === 'manager' && tokens[3].toLowerCase() === 'applet') {
      const appletName = tokens[4];
      if (device instanceof Router) {
        device.eemApplets.delete(appletName);
      }
      return { output: '' };
    }

    // telemetry ietf subscription <id>
    if ('telemetry'.startsWith(cmd0) && tokens.length >= 4 && tokens[1].toLowerCase() === 'ietf' && tokens[2].toLowerCase() === 'subscription') {
      const subId = parseInt(tokens[3], 10);
      if (isNaN(subId)) return { output: '% Invalid subscription ID' };
      if (device instanceof Router) {
        if (!device.mdtSubscriptions.has(subId)) {
          device.mdtSubscriptions.set(subId, {
            id: subId,
            encoding: 'encode-kvgpb',
            filterXpath: '/ietf-interfaces:interfaces-state',
            stream: 'yang-push',
            updatePolicy: { type: 'periodic', periodCentiseconds: 1000 },
            receivers: []
          });
        }
      }
      return {
        output: '',
        newMode: 'mdt-subscription-config',
        contextUpdates: { targetSubscriptionId: subId }
      };
    }

    if (cmd0 === 'no' && tokens.length >= 5 && tokens[1].toLowerCase() === 'telemetry' && tokens[2].toLowerCase() === 'ietf' && tokens[3].toLowerCase() === 'subscription') {
      const subId = parseInt(tokens[4], 10);
      if (device instanceof Router && !isNaN(subId)) {
        device.mdtSubscriptions.delete(subId);
      }
      return { output: '' };
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

    // ip policy route-map <name>
    if ('ip'.startsWith(cmd0) && tokens.length >= 4 && 'policy'.startsWith(tokens[1].toLowerCase()) && 'route-map'.startsWith(tokens[2].toLowerCase())) {
      iface.ipPolicyRouteMap = tokens[3];
      return { output: '' };
    }

    // no ip policy route-map
    if (cmd0 === 'no' && tokens.length >= 4 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'policy'.startsWith(tokens[2].toLowerCase()) && 'route-map'.startsWith(tokens[3].toLowerCase())) {
      iface.ipPolicyRouteMap = undefined;
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

    // channel-group <id> mode <active | passive | desirable | auto | on>
    if ('channel-group'.startsWith(cmd0) && tokens.length >= 4 && 'mode'.startsWith(tokens[2].toLowerCase())) {
      const gid = parseInt(tokens[1], 10);
      const mode = tokens[3].toLowerCase();
      if (isNaN(gid) || gid < 1 || gid > 128) {
        return { output: `% Invalid channel-group number (1-128).` };
      }
      if (!['active', 'passive', 'desirable', 'auto', 'on'].includes(mode)) {
        return { output: `% Invalid channel-group mode. Valid modes: active, passive, desirable, auto, on.` };
      }
      iface.channelGroup = gid;
      iface.channelMode = mode as any;
      if (mode === 'active' || mode === 'passive') iface.channelProtocol = 'LACP';
      else if (mode === 'desirable' || mode === 'auto') iface.channelProtocol = 'PAgP';
      else iface.channelProtocol = 'NONE';

      // Pastikan Port-channel<gid> ada di switch
      const poName = `Port-channel${gid}`;
      if (device instanceof Switch && !device.interfaces.has(poName)) {
        const baseMac = Array.from(device.interfaces.values())[0]?.macAddress || '0002.ba00.0001';
        device.addInterface({
          name: poName,
          shortName: `Po${gid}`,
          macAddress: baseMac,
          status: 'up',
          isShutdown: false,
          switchportMode: iface.switchportMode || 'access',
          accessVlan: iface.accessVlan || 1,
          trunkAllowedVlans: iface.trunkAllowedVlans || Array.from({ length: 4094 }, (_, idx) => idx + 1),
          nativeVlan: iface.nativeVlan || 1
        });
      }
      return { output: '' };
    }

    // no channel-group [id]
    if (cmd0 === 'no' && tokens.length >= 2 && 'channel-group'.startsWith(tokens[1].toLowerCase())) {
      iface.channelGroup = undefined;
      iface.channelMode = undefined;
      iface.channelProtocol = undefined;
      return { output: '' };
    }

    // spanning-tree portfast [disable | edge]
    if ('spanning-tree'.startsWith(cmd0) && tokens.length >= 2 && 'portfast'.startsWith(tokens[1].toLowerCase())) {
      if (tokens.length >= 3 && 'disable'.startsWith(tokens[2].toLowerCase())) {
        iface.stpPortFast = false;
        return { output: '' };
      }
      iface.stpPortFast = true;
      return {
        output: `%Warning: portfast should only be enabled on ports connected to a single host.\n Connecting hubs, concentrators, switches, bridges, etc... to this interface\n when portfast is enabled, can cause temporary bridging loops.\n Use with CAUTION`
      };
    }
    if (cmd0 === 'no' && tokens.length >= 3 && 'spanning-tree'.startsWith(tokens[1].toLowerCase()) && 'portfast'.startsWith(tokens[2].toLowerCase())) {
      iface.stpPortFast = false;
      return { output: '' };
    }

    // spanning-tree bpduguard <enable | disable>
    if ('spanning-tree'.startsWith(cmd0) && tokens.length >= 3 && 'bpduguard'.startsWith(tokens[1].toLowerCase())) {
      const sub = tokens[2].toLowerCase();
      iface.stpBpduGuard = sub === 'enable';
      return { output: '' };
    }
    if (cmd0 === 'no' && tokens.length >= 3 && 'spanning-tree'.startsWith(tokens[1].toLowerCase()) && 'bpduguard'.startsWith(tokens[2].toLowerCase())) {
      iface.stpBpduGuard = false;
      return { output: '' };
    }

    // spanning-tree bpdufilter <enable | disable>
    if ('spanning-tree'.startsWith(cmd0) && tokens.length >= 3 && 'bpdufilter'.startsWith(tokens[1].toLowerCase())) {
      const sub = tokens[2].toLowerCase();
      iface.stpBpduFilter = sub === 'enable';
      return { output: '' };
    }

    // spanning-tree guard root / no spanning-tree guard root
    if ('spanning-tree'.startsWith(cmd0) && tokens.length >= 3 && 'guard'.startsWith(tokens[1].toLowerCase()) && 'root'.startsWith(tokens[2].toLowerCase())) {
      iface.stpRootGuard = true;
      return { output: '' };
    }
    if (cmd0 === 'no' && tokens.length >= 4 && 'spanning-tree'.startsWith(tokens[1].toLowerCase()) && 'guard'.startsWith(tokens[2].toLowerCase())) {
      iface.stpRootGuard = false;
      return { output: '' };
    }

    // spanning-tree cost <cost>
    if ('spanning-tree'.startsWith(cmd0) && tokens.length >= 3 && 'cost'.startsWith(tokens[1].toLowerCase())) {
      const cost = parseInt(tokens[2], 10);
      if (isNaN(cost) || cost < 1) return { output: `% Invalid cost value.` };
      iface.stpCost = cost;
      return { output: '' };
    }

    // switchport mode dynamic <desirable | auto>
    if ('switchport'.startsWith(cmd0) && tokens.length >= 4 && 'mode'.startsWith(tokens[1].toLowerCase()) && 'dynamic'.startsWith(tokens[2].toLowerCase())) {
      const dMode = tokens[3].toLowerCase();
      if (dMode === 'desirable' || dMode === 'auto') {
        iface.dtpMode = `dynamic-${dMode}` as any;
        return { output: '' };
      }
    }

    // switchport nonegotiate
    if ('switchport'.startsWith(cmd0) && tokens.length >= 2 && 'nonegotiate'.startsWith(tokens[1].toLowerCase())) {
      iface.dtpNoNegotiate = true;
      return { output: '' };
    }

    // ===================== FHRP: HSRP (HOT STANDBY ROUTER PROTOCOL) =====================
    // standby version <1 | 2>
    if ('standby'.startsWith(cmd0) && tokens.length >= 3 && 'version'.startsWith(tokens[1].toLowerCase())) {
      const v = parseInt(tokens[2], 10);
      if (v === 1 || v === 2) {
        if (!iface.hsrp) {
          iface.hsrp = { group: 1, virtualIp: '', priority: 100, preempt: false, version: v as (1 | 2), state: 'Init' };
        } else {
          iface.hsrp.version = v as (1 | 2);
        }
        return { output: '' };
      }
      return { output: `% Invalid HSRP version. Supported: 1, 2` };
    }

    // standby <group> ip <vip>
    if ('standby'.startsWith(cmd0) && tokens.length >= 4 && 'ip'.startsWith(tokens[2].toLowerCase())) {
      const grp = parseInt(tokens[1], 10);
      const vip = tokens[3];
      if (isNaN(grp) || grp < 0 || grp > 4095) return { output: `% Invalid group number.` };
      if (!SubnetUtils.isValidIpv4(vip)) return { output: `% Invalid IP address: ${vip}` };

      if (!iface.hsrp) {
        iface.hsrp = { group: grp, virtualIp: vip, priority: 100, preempt: false, version: 1, state: 'Init' };
      } else {
        iface.hsrp.group = grp;
        iface.hsrp.virtualIp = vip;
      }
      return { output: '' };
    }

    // standby <group> priority <prio>
    if ('standby'.startsWith(cmd0) && tokens.length >= 4 && 'priority'.startsWith(tokens[2].toLowerCase())) {
      const grp = parseInt(tokens[1], 10);
      const prio = parseInt(tokens[3], 10);
      if (isNaN(prio) || prio < 1 || prio > 255) return { output: `% Invalid priority (1-255).` };
      if (!iface.hsrp) {
        iface.hsrp = { group: isNaN(grp) ? 1 : grp, virtualIp: '', priority: prio, preempt: false, version: 1, state: 'Init' };
      } else {
        iface.hsrp.priority = prio;
      }
      return { output: '' };
    }

    // standby <group> preempt
    if ('standby'.startsWith(cmd0) && tokens.length >= 3 && 'preempt'.startsWith(tokens[2].toLowerCase())) {
      const grp = parseInt(tokens[1], 10);
      if (!iface.hsrp) {
        iface.hsrp = { group: isNaN(grp) ? 1 : grp, virtualIp: '', priority: 100, preempt: true, version: 1, state: 'Init' };
      } else {
        iface.hsrp.preempt = true;
      }
      return { output: '' };
    }

    // no standby <group> preempt
    if (cmd0 === 'no' && tokens.length >= 4 && 'standby'.startsWith(tokens[1].toLowerCase()) && 'preempt'.startsWith(tokens[3].toLowerCase())) {
      if (iface.hsrp) iface.hsrp.preempt = false;
      return { output: '' };
    }

    // standby <group> timers [msec] <hello> [msec] <hold>
    if ('standby'.startsWith(cmd0) && tokens.length >= 4 && 'timers'.startsWith(tokens[2].toLowerCase())) {
      const hello = parseInt(tokens[3], 10);
      const hold = parseInt(tokens[4] || `${hello * 3}`, 10);
      if (iface.hsrp) {
        iface.hsrp.timers = { hello: isNaN(hello) ? 3 : hello, hold: isNaN(hold) ? 10 : hold };
      }
      return { output: '' };
    }

    // no standby <group> ...
    if (cmd0 === 'no' && tokens.length >= 3 && 'standby'.startsWith(tokens[1].toLowerCase())) {
      iface.hsrp = undefined;
      return { output: '' };
    }

    // ===================== FHRP: VRRP (VIRTUAL ROUTER REDUNDANCY PROTOCOL) =====================
    // vrrp <group> ip <vip>
    if ('vrrp'.startsWith(cmd0) && tokens.length >= 4 && 'ip'.startsWith(tokens[2].toLowerCase())) {
      const grp = parseInt(tokens[1], 10);
      const vip = tokens[3];
      if (isNaN(grp) || grp < 1 || grp > 255) return { output: `% Invalid VRRP group number (1-255).` };
      if (!SubnetUtils.isValidIpv4(vip)) return { output: `% Invalid IP address: ${vip}` };

      if (!iface.vrrp) {
        iface.vrrp = { group: grp, virtualIp: vip, priority: 100, preempt: true, version: 3, state: 'Initialize' };
      } else {
        iface.vrrp.group = grp;
        iface.vrrp.virtualIp = vip;
      }
      return { output: '' };
    }

    // vrrp <group> priority <prio>
    if ('vrrp'.startsWith(cmd0) && tokens.length >= 4 && 'priority'.startsWith(tokens[2].toLowerCase())) {
      const grp = parseInt(tokens[1], 10);
      const prio = parseInt(tokens[3], 10);
      if (isNaN(prio) || prio < 1 || prio > 254) return { output: `% Invalid priority (1-254).` };
      if (!iface.vrrp) {
        iface.vrrp = { group: isNaN(grp) ? 1 : grp, virtualIp: '', priority: prio, preempt: true, version: 3, state: 'Initialize' };
      } else {
        iface.vrrp.priority = prio;
      }
      return { output: '' };
    }

    // vrrp <group> preempt
    if ('vrrp'.startsWith(cmd0) && tokens.length >= 3 && 'preempt'.startsWith(tokens[2].toLowerCase())) {
      const grp = parseInt(tokens[1], 10);
      if (!iface.vrrp) {
        iface.vrrp = { group: isNaN(grp) ? 1 : grp, virtualIp: '', priority: 100, preempt: true, version: 3, state: 'Initialize' };
      } else {
        iface.vrrp.preempt = true;
      }
      return { output: '' };
    }

    // no vrrp <group> preempt
    if (cmd0 === 'no' && tokens.length >= 4 && 'vrrp'.startsWith(tokens[1].toLowerCase()) && 'preempt'.startsWith(tokens[3].toLowerCase())) {
      if (iface.vrrp) iface.vrrp.preempt = false;
      return { output: '' };
    }

    // vrrp <group> timers advertise <val>
    if ('vrrp'.startsWith(cmd0) && tokens.length >= 5 && 'timers'.startsWith(tokens[2].toLowerCase()) && 'advertise'.startsWith(tokens[3].toLowerCase())) {
      const adv = parseInt(tokens[4], 10);
      if (iface.vrrp && !isNaN(adv)) {
        iface.vrrp.advertisementInterval = adv;
      }
      return { output: '' };
    }

    // vrf forwarding <name> / ip vrf forwarding <name>
    if (
      (cmd0 === 'vrf' && tokens.length >= 3 && 'forwarding'.startsWith(tokens[1].toLowerCase())) ||
      (cmd0 === 'ip' && tokens.length >= 4 && 'vrf'.startsWith(tokens[1].toLowerCase()) && 'forwarding'.startsWith(tokens[2].toLowerCase()))
    ) {
      const vrfName = cmd0 === 'vrf' ? tokens[2] : tokens[3];
      VrfEngine.assignInterfaceToVrf(device as Router | Switch, iface.name, vrfName);
      return { output: `% Interface ${iface.name} bound to VRF ${vrfName}` };
    }

    // no vrf forwarding / no ip vrf forwarding
    if (
      (cmd0 === 'no' && tokens.length >= 3 && 'vrf'.startsWith(tokens[1].toLowerCase()) && 'forwarding'.startsWith(tokens[2].toLowerCase())) ||
      (cmd0 === 'no' && tokens.length >= 4 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'vrf'.startsWith(tokens[2].toLowerCase()) && 'forwarding'.startsWith(tokens[3].toLowerCase()))
    ) {
      VrfEngine.unassignInterfaceFromVrf(device as Router | Switch, iface.name);
      return { output: '' };
    }

    // mpls ip
    if (cmd0 === 'mpls' && tokens.length >= 2 && 'ip'.startsWith(tokens[1].toLowerCase())) {
      VrfEngine.enableMplsOnInterface(device as Router | Switch, iface.name);
      return { output: '' };
    }

    // no mpls ip
    if (cmd0 === 'no' && tokens.length >= 3 && 'mpls'.startsWith(tokens[1].toLowerCase()) && 'ip'.startsWith(tokens[2].toLowerCase())) {
      VrfEngine.disableMplsOnInterface(device as Router | Switch, iface.name);
      return { output: '' };
    }

    // ip ospf authentication [message-digest | null]
    if (cmd0 === 'ip' && tokens.length >= 3 && 'ospf'.startsWith(tokens[1].toLowerCase()) && 'authentication'.startsWith(tokens[2].toLowerCase())) {
      const auth = tokens.length >= 4 ? tokens[3].toLowerCase() : 'simple';
      iface.ospfAuthType = auth as any;
      return { output: '' };
    }

    // ip ospf message-digest-key <id> md5 <key>
    if (cmd0 === 'ip' && tokens.length >= 6 && 'ospf'.startsWith(tokens[1].toLowerCase()) && 'message-digest-key'.startsWith(tokens[2].toLowerCase())) {
      const keyId = parseInt(tokens[3], 10);
      const key = tokens[5];
      iface.ospfMessageDigestKey = { keyId: isNaN(keyId) ? 1 : keyId, key };
      return { output: '' };
    }

    // ip ospf hello-interval <sec>
    if (cmd0 === 'ip' && tokens.length >= 4 && 'ospf'.startsWith(tokens[1].toLowerCase()) && 'hello-interval'.startsWith(tokens[2].toLowerCase())) {
      iface.ospfHelloInterval = parseInt(tokens[3], 10);
      return { output: '' };
    }

    // ip ospf dead-interval <sec>
    if (cmd0 === 'ip' && tokens.length >= 4 && 'ospf'.startsWith(tokens[1].toLowerCase()) && 'dead-interval'.startsWith(tokens[2].toLowerCase())) {
      iface.ospfDeadInterval = parseInt(tokens[3], 10);
      return { output: '' };
    }

    // ip ospf cost <cost>
    if (cmd0 === 'ip' && tokens.length >= 4 && 'ospf'.startsWith(tokens[1].toLowerCase()) && 'cost'.startsWith(tokens[2].toLowerCase())) {
      iface.ospfCost = parseInt(tokens[3], 10);
      return { output: '' };
    }

    // ip ospf network <point-to-point|broadcast>
    if (cmd0 === 'ip' && tokens.length >= 4 && 'ospf'.startsWith(tokens[1].toLowerCase()) && 'network'.startsWith(tokens[2].toLowerCase())) {
      iface.ospfNetworkType = tokens[3].toLowerCase() as any;
      return { output: '' };
    }

    // ospfv3 <pid> ipv6 area <area-id>
    if (cmd0 === 'ospfv3' && tokens.length >= 5 && 'ipv6'.startsWith(tokens[2].toLowerCase()) && 'area'.startsWith(tokens[3].toLowerCase())) {
      iface.ospfv3ProcessId = parseInt(tokens[1], 10);
      iface.ospfv3Area = parseInt(tokens[4], 10);
      return { output: '' };
    }

    // ipv6 ospf <pid> area <area-id>
    if (cmd0 === 'ipv6' && tokens.length >= 5 && 'ospf'.startsWith(tokens[1].toLowerCase()) && 'area'.startsWith(tokens[3].toLowerCase())) {
      iface.ospfv3ProcessId = parseInt(tokens[2], 10);
      iface.ospfv3Area = parseInt(tokens[4], 10);
      return { output: '' };
    }

    // ipv6 ospf hello-interval <sec> / dead-interval <sec>
    if (cmd0 === 'ipv6' && tokens.length >= 4 && 'ospf'.startsWith(tokens[1].toLowerCase()) && 'hello-interval'.startsWith(tokens[2].toLowerCase())) {
      iface.ospfHelloInterval = parseInt(tokens[3], 10);
      return { output: '' };
    }
    if (cmd0 === 'ipv6' && tokens.length >= 4 && 'ospf'.startsWith(tokens[1].toLowerCase()) && 'dead-interval'.startsWith(tokens[2].toLowerCase())) {
      iface.ospfDeadInterval = parseInt(tokens[3], 10);
      return { output: '' };
    }

    // tunnel source <ip | ifaceName>
    if ('tunnel'.startsWith(cmd0) && tokens.length >= 3 && 'source'.startsWith(tokens[1].toLowerCase())) {
      iface.tunnelSource = tokens[2];
      return { output: '' };
    }

    // tunnel destination <ip>
    if ('tunnel'.startsWith(cmd0) && tokens.length >= 3 && 'destination'.startsWith(tokens[1].toLowerCase())) {
      iface.tunnelDestination = tokens[2];
      return { output: '' };
    }

    // tunnel mode <mode...>
    if ('tunnel'.startsWith(cmd0) && tokens.length >= 3 && 'mode'.startsWith(tokens[1].toLowerCase())) {
      iface.tunnelMode = tokens.slice(2).join(' ').toLowerCase();
      return { output: '' };
    }

    // tunnel protection ipsec profile <name>
    if (
      'tunnel'.startsWith(cmd0) &&
      tokens.length >= 5 &&
      'protection'.startsWith(tokens[1].toLowerCase()) &&
      'ipsec'.startsWith(tokens[2].toLowerCase()) &&
      'profile'.startsWith(tokens[3].toLowerCase())
    ) {
      iface.tunnelProtectionProfile = tokens[4];
      return { output: '' };
    }

    // ip nhrp network-id <id>
    if ('ip'.startsWith(cmd0) && tokens.length >= 4 && 'nhrp'.startsWith(tokens[1].toLowerCase()) && 'network-id'.startsWith(tokens[2].toLowerCase())) {
      const netId = parseInt(tokens[3], 10);
      iface.nhrpNetworkId = isNaN(netId) ? 1 : netId;
      return { output: '' };
    }

    // ip nhrp map multicast <nbmaIp>
    if ('ip'.startsWith(cmd0) && tokens.length >= 5 && 'nhrp'.startsWith(tokens[1].toLowerCase()) && 'map'.startsWith(tokens[2].toLowerCase()) && 'multicast'.startsWith(tokens[3].toLowerCase())) {
      if (!iface.nhrpMaps) iface.nhrpMaps = [];
      iface.nhrpMaps.push({ nbmaIp: tokens[4], multicast: true });
      return { output: '' };
    }

    // ip nhrp map <protoIp> <nbmaIp>
    if ('ip'.startsWith(cmd0) && tokens.length >= 5 && 'nhrp'.startsWith(tokens[1].toLowerCase()) && 'map'.startsWith(tokens[2].toLowerCase())) {
      if (!iface.nhrpMaps) iface.nhrpMaps = [];
      iface.nhrpMaps.push({ protocolIp: tokens[3], nbmaIp: tokens[4] });
      if (device instanceof Router) {
        const ex = device.nhrpCache.findIndex(e => e.protocolIp === tokens[3]);
        const ent = { protocolIp: tokens[3], nbmaIp: tokens[4], type: 'static' as const, flags: 'authoritative' };
        if (ex >= 0) device.nhrpCache[ex] = ent;
        else device.nhrpCache.push(ent);
      }
      return { output: '' };
    }

    // ip nhrp nhs <protoIp> [nbma <nbmaIp>]
    if ('ip'.startsWith(cmd0) && tokens.length >= 4 && 'nhrp'.startsWith(tokens[1].toLowerCase()) && 'nhs'.startsWith(tokens[2].toLowerCase())) {
      iface.nhrpNhsIp = tokens[3];
      if (tokens.length >= 6 && 'nbma'.startsWith(tokens[4].toLowerCase())) {
        iface.nhrpNhsNbma = tokens[5];
      }
      // Register with hub if found in allDevices
      if (device instanceof Router) {
        for (const other of allDevices) {
          if (other instanceof Router && other.id !== device.id) {
            for (const otherIfc of other.interfaces.values()) {
              if (otherIfc.ipAddress === iface.nhrpNhsIp || (iface.nhrpNhsNbma && otherIfc.ipAddress === iface.nhrpNhsNbma)) {
                SecurityVpnEngine.registerSpokeNhrp(
                  device,
                  other,
                  iface.ipAddress || '',
                  Array.from(device.interfaces.values()).find(i => i.ipAddress && !i.name.startsWith('Tu') && !i.name.startsWith('Lo'))?.ipAddress || '',
                  iface.nhrpNhsIp,
                  iface.nhrpNhsNbma || otherIfc.ipAddress || '',
                  iface.nhrpNetworkId || 1
                );
                break;
              }
            }
          }
        }
      }
      return { output: '' };
    }

    // zone-member security <zoneName>
    if ('zone-member'.startsWith(cmd0) && tokens.length >= 3 && 'security'.startsWith(tokens[1].toLowerCase())) {
      const zName = tokens[2];
      iface.zoneMemberSecurity = zName;
      if (device instanceof Router) {
        if (!device.securityZones.has(zName)) {
          device.securityZones.set(zName, { name: zName, interfaces: [iface.name] });
        } else {
          const z = device.securityZones.get(zName)!;
          if (!z.interfaces.includes(iface.name)) z.interfaces.push(iface.name);
        }
      }
      return { output: '' };
    }

    // no zone-member security
    if (cmd0 === 'no' && tokens.length >= 3 && 'zone-member'.startsWith(tokens[1].toLowerCase())) {
      iface.zoneMemberSecurity = undefined;
      return { output: '' };
    }

    // bandwidth <kbps>
    if ('bandwidth'.startsWith(cmd0) && tokens.length >= 2) {
      const bw = parseInt(tokens[1], 10);
      if (!isNaN(bw)) {
        iface.bandwidthKbps = bw;
        return { output: '' };
      }
    }

    // ip hello-interval eigrp <as> <sec>
    if ('ip'.startsWith(cmd0) && tokens.length >= 5 && 'hello-interval'.startsWith(tokens[1].toLowerCase()) && 'eigrp'.startsWith(tokens[2].toLowerCase())) {
      const as = parseInt(tokens[3], 10);
      const sec = parseInt(tokens[4], 10);
      if (!isNaN(as) && !isNaN(sec)) {
        if (!iface.eigrpHelloInterval) iface.eigrpHelloInterval = {};
        iface.eigrpHelloInterval[as] = sec;
        return { output: '' };
      }
    }

    // ip hold-time eigrp <as> <sec>
    if ('ip'.startsWith(cmd0) && tokens.length >= 5 && 'hold-time'.startsWith(tokens[1].toLowerCase()) && 'eigrp'.startsWith(tokens[2].toLowerCase())) {
      const as = parseInt(tokens[3], 10);
      const sec = parseInt(tokens[4], 10);
      if (!isNaN(as) && !isNaN(sec)) {
        if (!iface.eigrpHoldTime) iface.eigrpHoldTime = {};
        iface.eigrpHoldTime[as] = sec;
        return { output: '' };
      }
    }

    // ip summary-address eigrp <as> <net> <mask>
    if ('ip'.startsWith(cmd0) && tokens.length >= 6 && 'summary-address'.startsWith(tokens[1].toLowerCase()) && 'eigrp'.startsWith(tokens[2].toLowerCase())) {
      const as = parseInt(tokens[3], 10);
      const net = tokens[4];
      const mask = tokens[5];
      if (!iface.eigrpSummaryAddresses) iface.eigrpSummaryAddresses = [];
      iface.eigrpSummaryAddresses = iface.eigrpSummaryAddresses.filter(sa => !(sa.asNumber === as && sa.network === net));
      iface.eigrpSummaryAddresses.push({ asNumber: as, network: net, mask });
      return { output: '' };
    }

    // no ip summary-address eigrp <as> <net> [mask]
    if (cmd0 === 'no' && tokens.length >= 6 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'summary-address'.startsWith(tokens[2].toLowerCase()) && 'eigrp'.startsWith(tokens[3].toLowerCase())) {
      const as = parseInt(tokens[4], 10);
      const net = tokens[5];
      if (iface.eigrpSummaryAddresses) {
        iface.eigrpSummaryAddresses = iface.eigrpSummaryAddresses.filter(sa => !(sa.asNumber === as && sa.network === net));
      }
      return { output: '' };
    }

    // ip authentication mode eigrp <as> <md5|hmac-sha-256>
    if ('ip'.startsWith(cmd0) && tokens.length >= 6 && 'authentication'.startsWith(tokens[1].toLowerCase()) && 'mode'.startsWith(tokens[2].toLowerCase()) && 'eigrp'.startsWith(tokens[3].toLowerCase())) {
      const as = parseInt(tokens[4], 10);
      const mode = tokens[5].toLowerCase();
      if (!iface.eigrpAuthMode) iface.eigrpAuthMode = {};
      iface.eigrpAuthMode[as] = mode;
      return { output: '' };
    }

    // ip authentication key-chain eigrp <as> <keychain>
    if ('ip'.startsWith(cmd0) && tokens.length >= 6 && 'authentication'.startsWith(tokens[1].toLowerCase()) && 'key-chain'.startsWith(tokens[2].toLowerCase()) && 'eigrp'.startsWith(tokens[3].toLowerCase())) {
      const as = parseInt(tokens[4], 10);
      const kc = tokens[5];
      if (!iface.eigrpAuthKeyChain) iface.eigrpAuthKeyChain = {};
      iface.eigrpAuthKeyChain[as] = kc;
      return { output: '' };
    }

    // ipv6 eigrp <as>
    if ('ipv6'.startsWith(cmd0) && tokens.length >= 3 && 'eigrp'.startsWith(tokens[1].toLowerCase())) {
      const as = parseInt(tokens[2], 10);
      if (!isNaN(as)) {
        iface.eigrpIpv6As = as;
        return { output: '' };
      }
    }

    // no ipv6 eigrp <as>
    if (cmd0 === 'no' && tokens.length >= 3 && 'ipv6'.startsWith(tokens[1].toLowerCase()) && 'eigrp'.startsWith(tokens[2].toLowerCase())) {
      iface.eigrpIpv6As = undefined;
      return { output: '' };
    }

    // ipv6 summary-address eigrp <as> <prefix>
    if ('ipv6'.startsWith(cmd0) && tokens.length >= 5 && 'summary-address'.startsWith(tokens[1].toLowerCase()) && 'eigrp'.startsWith(tokens[2].toLowerCase())) {
      const as = parseInt(tokens[3], 10);
      const prefix = tokens[4];
      if (!iface.eigrpIpv6SummaryAddresses) iface.eigrpIpv6SummaryAddresses = [];
      iface.eigrpIpv6SummaryAddresses = iface.eigrpIpv6SummaryAddresses.filter(sa => !(sa.asNumber === as && sa.prefix === prefix));
      iface.eigrpIpv6SummaryAddresses.push({ asNumber: as, prefix });
      return { output: '' };
    }

    // no ipv6 summary-address eigrp <as> <prefix>
    if (cmd0 === 'no' && tokens.length >= 5 && 'ipv6'.startsWith(tokens[1].toLowerCase()) && 'summary-address'.startsWith(tokens[2].toLowerCase()) && 'eigrp'.startsWith(tokens[3].toLowerCase())) {
      const as = parseInt(tokens[4], 10);
      const prefix = tokens[5];
      if (iface.eigrpIpv6SummaryAddresses) {
        iface.eigrpIpv6SummaryAddresses = iface.eigrpIpv6SummaryAddresses.filter(sa => !(sa.asNumber === as && sa.prefix === prefix));
      }
      return { output: '' };
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

  // ===================== ROUTER CONFIG MODE (OSPF, EIGRP, BGP) =====================
  private static execRouterConfigMode(
    tokens: string[],
    _context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const target = device as Router | Switch;

    let proto = _context.targetRoutingProtocol;
    if (!proto && _context.targetRoutingProcess) {
      if (_context.targetRoutingProcess.startsWith('ospf')) proto = 'ospf';
      else if (_context.targetRoutingProcess.startsWith('eigrp')) proto = 'eigrp';
      else if (_context.targetRoutingProcess.startsWith('bgp')) proto = 'bgp';
    }

    // address-family <ipv4|ipv6> [unicast] [autonomous-system <as>]
    if ('address-family'.startsWith(cmd0) && tokens.length >= 2) {
      const afProto = tokens[1].toLowerCase() as 'ipv4' | 'ipv6';
      if (afProto === 'ipv4' || afProto === 'ipv6') {
        const asIdx = tokens.findIndex(t => 'autonomous-system'.startsWith(t.toLowerCase()));
        if (asIdx !== -1 && asIdx + 1 < tokens.length) {
          const as = parseInt(tokens[asIdx + 1], 10);
          if (isNaN(as)) return { output: '% Invalid autonomous-system number.' };

          if (afProto === 'ipv4') {
            if (!target.eigrpConfig) {
              target.eigrpConfig = {
                enabled: true,
                asNumber: as,
                name: _context.targetEigrpName,
                networks: [],
                passiveInterfaces: []
              };
            } else {
              target.eigrpConfig.enabled = true;
              target.eigrpConfig.asNumber = as;
              if (_context.targetEigrpName) target.eigrpConfig.name = _context.targetEigrpName;
            }
          } else if (afProto === 'ipv6') {
            if (!target.eigrpV6Config) {
              target.eigrpV6Config = {
                enabled: true,
                asNumber: as,
                name: _context.targetEigrpName,
                passiveInterfaces: []
              };
            } else {
              target.eigrpV6Config.enabled = true;
              target.eigrpV6Config.asNumber = as;
              if (_context.targetEigrpName) target.eigrpV6Config.name = _context.targetEigrpName;
            }
          }

          return {
            output: '',
            newMode: 'router-af-config',
            contextUpdates: {
              targetAfProto: afProto,
              targetAsNumber: as,
              targetAfType: 'eigrp'
            }
          };
        } else if (proto === 'bgp' || target.bgpConfig) {
          if (!target.bgpConfig) {
            target.bgpConfig = {
              enabled: true,
              asNumber: _context.targetAsNumber || 65000,
              neighbors: new Map(),
              networks: []
            };
          }
          if (!target.bgpConfig.addressFamilies) {
            target.bgpConfig.addressFamilies = new Map();
          }
          if (!target.bgpConfig.addressFamilies.has(afProto)) {
            target.bgpConfig.addressFamilies.set(afProto, {
              type: afProto,
              subType: 'unicast',
              networks: [],
              neighbors: new Map()
            });
          }
          return {
            output: '',
            newMode: 'router-af-config',
            contextUpdates: {
              targetAfProto: afProto,
              targetAfType: 'bgp'
            }
          };
        }
      }
    }

    // eigrp stub [receive-only | connected | summary | static | leak-map]*
    if ('eigrp'.startsWith(cmd0) && tokens.length >= 2 && 'stub'.startsWith(tokens[1].toLowerCase())) {
      const opts = tokens.slice(2).map(o => o.toLowerCase());
      const stubCfg = { enabled: true, options: opts };
      if (_context.targetAfProto === 'ipv6' && target.eigrpV6Config) {
        target.eigrpV6Config.stub = stubCfg;
      } else if (target.eigrpConfig) {
        target.eigrpConfig.stub = stubCfg;
      }
      return { output: '' };
    }

    // no eigrp stub ...
    if (cmd0 === 'no' && tokens.length >= 3 && 'eigrp'.startsWith(tokens[1].toLowerCase()) && 'stub'.startsWith(tokens[2].toLowerCase())) {
      const cfg = _context.targetAfProto === 'ipv6' ? target.eigrpV6Config : target.eigrpConfig;
      if (cfg && cfg.stub) {
        if (tokens.length >= 4 && tokens[3].toLowerCase() === 'receive-only') {
          cfg.stub.options = cfg.stub.options?.filter(o => o !== 'receive-only');
        } else {
          cfg.stub = undefined;
        }
      }
      return { output: '' };
    }

    // variance <num>
    if ('variance'.startsWith(cmd0) && tokens.length >= 2) {
      const v = parseInt(tokens[1], 10);
      if (!isNaN(v)) {
        if (_context.targetAfProto === 'ipv6' && target.eigrpV6Config) {
          target.eigrpV6Config.variance = v;
        } else if (target.eigrpConfig) {
          target.eigrpConfig.variance = v;
        }
        return { output: '' };
      }
    }

    // distribute-list prefix <name> out [iface]
    if ('distribute-list'.startsWith(cmd0) && tokens.length >= 4 && 'prefix'.startsWith(tokens[1].toLowerCase())) {
      const prefixName = tokens[2];
      const direction = tokens[3].toLowerCase() as 'in' | 'out';
      const ifaceNorm = tokens.length >= 5 ? CliLexer.normalizeInterfaceName(tokens[4]) : undefined;
      if (target.eigrpConfig) {
        if (!target.eigrpConfig.distributeLists) target.eigrpConfig.distributeLists = [];
        target.eigrpConfig.distributeLists.push({ prefixList: prefixName, direction, interfaceName: ifaceNorm });
      }
      return { output: '' };
    }

    // no distribute-list prefix <name> [out] [iface]
    if (cmd0 === 'no' && tokens.length >= 4 && 'distribute-list'.startsWith(tokens[1].toLowerCase()) && 'prefix'.startsWith(tokens[2].toLowerCase())) {
      const prefixName = tokens[3];
      if (target.eigrpConfig && target.eigrpConfig.distributeLists) {
        target.eigrpConfig.distributeLists = target.eigrpConfig.distributeLists.filter(dl => dl.prefixList !== prefixName);
      }
      return { output: '' };
    }

    // OSPF area stub: area <area> stub [no-summary]
    if ('area'.startsWith(cmd0) && tokens.length >= 3 && 'stub'.startsWith(tokens[2].toLowerCase())) {
      const area = parseInt(tokens[1], 10);
      const isNoSummary = tokens.length >= 4 && 'no-summary'.startsWith(tokens[3].toLowerCase());
      const areaType = isNoSummary ? 'totally-stubby' : 'stub';
      if (target.ospfConfig) {
        if (!target.ospfConfig.areaTypes) target.ospfConfig.areaTypes = {};
        target.ospfConfig.areaTypes[area] = areaType;
      }
      if (target.ospfv3Config) {
        if (!target.ospfv3Config.areaTypes) target.ospfv3Config.areaTypes = {};
        target.ospfv3Config.areaTypes[area] = areaType;
      }
      return { output: '' };
    }

    // OSPF area nssa: area <area> nssa [no-summary]
    if ('area'.startsWith(cmd0) && tokens.length >= 3 && 'nssa'.startsWith(tokens[2].toLowerCase())) {
      const area = parseInt(tokens[1], 10);
      const isNoSummary = tokens.length >= 4 && 'no-summary'.startsWith(tokens[3].toLowerCase());
      const areaType = isNoSummary ? 'totally-nssa' : 'nssa';
      if (target.ospfConfig) {
        if (!target.ospfConfig.areaTypes) target.ospfConfig.areaTypes = {};
        target.ospfConfig.areaTypes[area] = areaType;
      }
      if (target.ospfv3Config) {
        if (!target.ospfv3Config.areaTypes) target.ospfv3Config.areaTypes = {};
        target.ospfv3Config.areaTypes[area] = areaType;
      }
      return { output: '' };
    }

    // OSPF area authentication: area <area> authentication [message-digest]
    if ('area'.startsWith(cmd0) && tokens.length >= 3 && 'authentication'.startsWith(tokens[2].toLowerCase())) {
      const area = parseInt(tokens[1], 10);
      const authType = tokens.length >= 4 && 'message-digest'.startsWith(tokens[3].toLowerCase()) ? 'message-digest' : 'simple';
      if (target.ospfConfig) {
        if (!target.ospfConfig.areaAuth) target.ospfConfig.areaAuth = {};
        target.ospfConfig.areaAuth[area] = authType;
        return { output: '' };
      }
    }

    // OSPF summary-address: summary-address <network> <mask|cidr>
    if ('summary-address'.startsWith(cmd0) && tokens.length >= 3) {
      const net = tokens[1];
      const mask = tokens[2];
      if (target.ospfConfig) {
        if (!target.ospfConfig.summaryAddresses) target.ospfConfig.summaryAddresses = [];
        target.ospfConfig.summaryAddresses.push({ network: net, mask });
        return { output: '' };
      }
    }

    // OSPF area range: area <area> range <network> <mask>
    if ('area'.startsWith(cmd0) && tokens.length >= 5 && 'range'.startsWith(tokens[2].toLowerCase())) {
      const area = parseInt(tokens[1], 10);
      const net = tokens[3];
      const mask = tokens[4];
      if (target.ospfConfig) {
        if (!target.ospfConfig.areaRanges) target.ospfConfig.areaRanges = [];
        target.ospfConfig.areaRanges.push({ area, network: net, mask });
        return { output: '' };
      }
    }

    // OSPF network: network <ip> <wildcard> area <area-id>
    if ('network'.startsWith(cmd0) && tokens.length >= 5 && 'area'.startsWith(tokens[3].toLowerCase())) {
      const net = tokens[1];
      const wc = tokens[2];
      const area = parseInt(tokens[4], 10);

      if (target.ospfConfig) {
        target.ospfConfig.networks.push({ network: net, wildcard: wc, area });
        return { output: '' };
      }
    }

    // EIGRP network: network <ip> [wildcard]
    if ('network'.startsWith(cmd0) && (proto === 'eigrp' || (!tokens.includes('area') && !tokens.includes('mask') && target.eigrpConfig && !target.ospfConfig && !target.bgpConfig))) {
      const net = tokens[1];
      const wc = tokens.length > 2 ? tokens[2] : undefined;
      if (target.eigrpConfig) {
        target.eigrpConfig.networks.push({ network: net, wildcard: wc });
        return { output: '' };
      }
    }

    // BGP network: network <ip> [mask <mask>]
    if ('network'.startsWith(cmd0) && proto === 'bgp') {
      const net = tokens[1];
      let mask = '255.255.255.0';
      if (tokens.length >= 4 && 'mask'.startsWith(tokens[2].toLowerCase())) {
        mask = tokens[3];
      }
      if (target.bgpConfig) {
        target.bgpConfig.networks.push({ network: net, mask });
        return { output: '' };
      }
    }

    // BGP log-neighbor-changes
    if ('bgp'.startsWith(cmd0) && tokens.length >= 2 && 'log-neighbor-changes'.startsWith(tokens[1].toLowerCase())) {
      if (target.bgpConfig) {
        target.bgpConfig.logNeighborChanges = true;
        return { output: '' };
      }
    }

    // BGP cluster-id <id>
    if ('bgp'.startsWith(cmd0) && tokens.length >= 3 && 'cluster-id'.startsWith(tokens[1].toLowerCase())) {
      if (target.bgpConfig) {
        target.bgpConfig.clusterId = tokens[2];
        return { output: '' };
      }
    }

    // BGP asnotation dot
    if ('bgp'.startsWith(cmd0) && tokens.length >= 3 && 'asnotation'.startsWith(tokens[1].toLowerCase()) && tokens[2].toLowerCase() === 'dot') {
      if (target.bgpConfig) {
        target.bgpConfig.asnotation = 'dot';
        return { output: '' };
      }
    }

    // no bgp default ipv4-unicast
    if (cmd0 === 'no' && tokens.length >= 4 && 'bgp'.startsWith(tokens[1].toLowerCase()) && 'default'.startsWith(tokens[2].toLowerCase())) {
      if (target.bgpConfig) {
        target.bgpConfig.noBgpDefaultIpv4Unicast = true;
        return { output: '' };
      }
    }

    // BGP aggregate-address <prefix> <mask|cidr> [summary-only] [as-set]
    if ('aggregate-address'.startsWith(cmd0) && tokens.length >= 3) {
      if (target.bgpConfig) {
        if (!target.bgpConfig.aggregateAddresses) target.bgpConfig.aggregateAddresses = [];
        const prefix = tokens[1];
        const mask = tokens[2];
        const summaryOnly = tokens.some(t => t.toLowerCase() === 'summary-only');
        const asSet = tokens.some(t => t.toLowerCase() === 'as-set');
        target.bgpConfig.aggregateAddresses.push({ prefix, mask, summaryOnly, asSet });
        return { output: '' };
      }
    }
    if (cmd0 === 'no' && tokens.length >= 3 && 'aggregate-address'.startsWith(tokens[1].toLowerCase())) {
      if (target.bgpConfig && target.bgpConfig.aggregateAddresses) {
        const prefix = tokens[2];
        target.bgpConfig.aggregateAddresses = target.bgpConfig.aggregateAddresses.filter(a => a.prefix !== prefix);
        return { output: '' };
      }
    }

    // BGP neighbor peer-group creation: neighbor <name> peer-group
    if ('neighbor'.startsWith(cmd0) && tokens.length === 3 && 'peer-group'.startsWith(tokens[2].toLowerCase())) {
      const pgName = tokens[1];
      if (target.bgpConfig) {
        if (!target.bgpConfig.peerGroups) target.bgpConfig.peerGroups = new Map();
        if (!target.bgpConfig.peerGroups.has(pgName)) {
          target.bgpConfig.peerGroups.set(pgName, {
            ipAddress: pgName,
            remoteAs: target.bgpConfig.asNumber,
            isPeerGroup: true
          });
        }
        return { output: '' };
      }
    }

    // BGP neighbor assign to peer-group: neighbor <ip> peer-group <group>
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 4 && 'peer-group'.startsWith(tokens[2].toLowerCase())) {
      const ip = tokens[1];
      const pgName = tokens[3];
      if (target.bgpConfig) {
        let nb = target.bgpConfig.neighbors.get(ip);
        if (!nb) {
          const pg = target.bgpConfig.peerGroups?.get(pgName);
          nb = { ipAddress: ip, ip, remoteAs: pg?.remoteAs || target.bgpConfig.asNumber, peerGroup: pgName };
          target.bgpConfig.neighbors.set(ip, nb);
        } else {
          nb.peerGroup = pgName;
        }
        return { output: '' };
      }
    }

    // BGP neighbor: neighbor <ip> remote-as <as>
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 4 && 'remote-as'.startsWith(tokens[2].toLowerCase())) {
      const peer = tokens[1];
      let as = parseInt(tokens[3], 10);
      if (tokens[3].includes('.')) {
        const parts = tokens[3].split('.');
        const hi = parseInt(parts[0], 10);
        const lo = parseInt(parts[1], 10);
        if (!isNaN(hi) && !isNaN(lo)) as = hi * 65536 + lo;
      }
      if (target.bgpConfig) {
        if (target.bgpConfig.peerGroups && target.bgpConfig.peerGroups.has(peer)) {
          target.bgpConfig.peerGroups.get(peer)!.remoteAs = as;
        } else {
          let nb = target.bgpConfig.neighbors.get(peer);
          if (!nb) {
            nb = { ipAddress: peer, ip: peer, remoteAs: as };
            target.bgpConfig.neighbors.set(peer, nb);
          } else {
            nb.remoteAs = as;
          }
        }
        return { output: '' };
      }
    }

    // BGP neighbor update-source: neighbor <ip> update-source <iface>
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 4 && 'update-source'.startsWith(tokens[2].toLowerCase())) {
      const peer = tokens[1];
      const ifaceNorm = CliLexer.normalizeInterfaceName(tokens[3]);
      if (target.bgpConfig) {
        if (target.bgpConfig.peerGroups?.has(peer)) {
          target.bgpConfig.peerGroups.get(peer)!.updateSource = ifaceNorm;
        } else {
          let nb = target.bgpConfig.neighbors.get(peer);
          if (!nb) {
            nb = { ipAddress: peer, ip: peer, remoteAs: target.bgpConfig.asNumber, updateSource: ifaceNorm };
            target.bgpConfig.neighbors.set(peer, nb);
          } else {
            nb.updateSource = ifaceNorm;
          }
        }
        return { output: '' };
      }
    }

    // BGP neighbor password: neighbor <ip/name> password <pwd>
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 4 && 'password'.startsWith(tokens[2].toLowerCase())) {
      const peer = tokens[1];
      const pwd = tokens[3];
      if (target.bgpConfig) {
        if (target.bgpConfig.peerGroups?.has(peer)) {
          target.bgpConfig.peerGroups.get(peer)!.password = pwd;
        } else {
          let nb = target.bgpConfig.neighbors.get(peer);
          if (nb) nb.password = pwd;
          else target.bgpConfig.neighbors.set(peer, { ipAddress: peer, remoteAs: target.bgpConfig.asNumber, password: pwd });
        }
        return { output: '' };
      }
    }

    // BGP neighbor default-originate: neighbor <ip/name> default-originate
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 3 && 'default-originate'.startsWith(tokens[2].toLowerCase())) {
      const peer = tokens[1];
      if (target.bgpConfig) {
        let nb = target.bgpConfig.neighbors.get(peer);
        if (nb) nb.defaultOriginate = true;
        else target.bgpConfig.neighbors.set(peer, { ipAddress: peer, remoteAs: target.bgpConfig.asNumber, defaultOriginate: true });
        return { output: '' };
      }
    }

    // BGP neighbor next-hop-self: neighbor <ip/name> next-hop-self
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 3 && 'next-hop-self'.startsWith(tokens[2].toLowerCase())) {
      const peer = tokens[1];
      if (target.bgpConfig) {
        let nb = target.bgpConfig.neighbors.get(peer);
        if (nb) nb.nextHopSelf = true;
        else target.bgpConfig.neighbors.set(peer, { ipAddress: peer, remoteAs: target.bgpConfig.asNumber, nextHopSelf: true });
        return { output: '' };
      }
    }

    // BGP neighbor route-reflector-client: neighbor <ip/name> route-reflector-client
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 3 && 'route-reflector-client'.startsWith(tokens[2].toLowerCase())) {
      const peer = tokens[1];
      if (target.bgpConfig) {
        let nb = target.bgpConfig.neighbors.get(peer);
        if (nb) nb.routeReflectorClient = true;
        else target.bgpConfig.neighbors.set(peer, { ipAddress: peer, remoteAs: target.bgpConfig.asNumber, routeReflectorClient: true });
        return { output: '' };
      }
    }

    // BGP neighbor filter-list: neighbor <ip/name> filter-list <num> in|out
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 5 && 'filter-list'.startsWith(tokens[2].toLowerCase())) {
      const peer = tokens[1];
      const aclNum = parseInt(tokens[3], 10);
      const dir = tokens[4].toLowerCase() as 'in' | 'out';
      if (target.bgpConfig) {
        const item = target.bgpConfig.peerGroups?.get(peer) || target.bgpConfig.neighbors.get(peer);
        if (item) {
          if (dir === 'in') item.filterListIn = aclNum;
          else item.filterListOut = aclNum;
        }
        return { output: '' };
      }
    }

    // BGP neighbor route-map: neighbor <ip/name> route-map <map> in|out
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 5 && 'route-map'.startsWith(tokens[2].toLowerCase())) {
      const peer = tokens[1];
      const mapName = tokens[3];
      const dir = tokens[4].toLowerCase() as 'in' | 'out';
      if (target.bgpConfig) {
        const item = target.bgpConfig.peerGroups?.get(peer) || target.bgpConfig.neighbors.get(peer);
        if (item) {
          if (dir === 'in') item.routeMapIn = mapName;
          else item.routeMapOut = mapName;
        }
        return { output: '' };
      }
    }

    // BGP neighbor prefix-list: neighbor <ip/name> prefix-list <list> in|out
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 5 && 'prefix-list'.startsWith(tokens[2].toLowerCase())) {
      const peer = tokens[1];
      const listName = tokens[3];
      const dir = tokens[4].toLowerCase() as 'in' | 'out';
      if (target.bgpConfig) {
        const item = target.bgpConfig.peerGroups?.get(peer) || target.bgpConfig.neighbors.get(peer);
        if (item) {
          if (dir === 'in') item.prefixListIn = listName;
          else item.prefixListOut = listName;
        }
        return { output: '' };
      }
    }

    // BGP neighbor weight: neighbor <ip/name> weight <val>
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 4 && 'weight'.startsWith(tokens[2].toLowerCase())) {
      const peer = tokens[1];
      const wVal = parseInt(tokens[3], 10);
      if (target.bgpConfig) {
        const item = target.bgpConfig.peerGroups?.get(peer) || target.bgpConfig.neighbors.get(peer);
        if (item) item.weight = wVal;
        return { output: '' };
      }
    }

    // BGP neighbor activate: neighbor <ip> activate
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 3 && 'activate'.startsWith(tokens[2].toLowerCase())) {
      const peer = tokens[1];
      if (target.bgpConfig) {
        let nb = target.bgpConfig.neighbors.get(peer);
        if (nb) nb.activate = true;
        return { output: '' };
      }
    }
    if (cmd0 === 'no' && tokens.length >= 4 && 'neighbor'.startsWith(tokens[1].toLowerCase()) && 'activate'.startsWith(tokens[3].toLowerCase())) {
      const peer = tokens[2];
      if (target.bgpConfig) {
        let nb = target.bgpConfig.neighbors.get(peer);
        if (nb) nb.activate = false;
        return { output: '' };
      }
    }

    // BGP neighbor description: neighbor <ip> description <desc>
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 4 && 'description'.startsWith(tokens[2].toLowerCase())) {
      const ip = tokens[1];
      const desc = tokens.slice(3).join(' ');
      if (target.bgpConfig) {
        let nb = target.bgpConfig.neighbors.get(ip);
        if (!nb) {
          nb = { ipAddress: ip, ip, remoteAs: target.bgpConfig.asNumber, description: desc };
          target.bgpConfig.neighbors.set(ip, nb);
        } else {
          nb.description = desc;
        }
        return { output: '' };
      }
    }

    // BGP neighbor shutdown: neighbor <ip> shutdown
    if ('neighbor'.startsWith(cmd0) && tokens.length >= 3 && 'shutdown'.startsWith(tokens[2].toLowerCase())) {
      const ip = tokens[1];
      if (target.bgpConfig) {
        const nb = target.bgpConfig.neighbors.get(ip);
        if (nb) nb.shutdown = true;
        return { output: '' };
      }
    }

    // BGP no neighbor <ip> shutdown
    if (cmd0 === 'no' && tokens.length >= 4 && 'neighbor'.startsWith(tokens[1].toLowerCase()) && 'shutdown'.startsWith(tokens[3].toLowerCase())) {
      const ip = tokens[2];
      if (target.bgpConfig) {
        const nb = target.bgpConfig.neighbors.get(ip);
        if (nb) nb.shutdown = false;
        return { output: '' };
      }
    }

    // EIGRP router-id: eigrp router-id <id>
    if ('eigrp'.startsWith(cmd0) && tokens.length >= 3 && 'router-id'.startsWith(tokens[1].toLowerCase())) {
      if (target.eigrpConfig) {
        target.eigrpConfig.routerId = tokens[2];
        return { output: '' };
      }
    }

    // BGP router-id: bgp router-id <id>
    if ('bgp'.startsWith(cmd0) && tokens.length >= 3 && 'router-id'.startsWith(tokens[1].toLowerCase())) {
      if (target.bgpConfig) {
        target.bgpConfig.routerId = tokens[2];
        return { output: '' };
      }
    }

    // router-id <id>
    if ('router-id'.startsWith(cmd0) && tokens.length > 1) {
      const rid = tokens[1];
      if (proto === 'eigrp' && target.eigrpConfig) {
        target.eigrpConfig.routerId = rid;
      } else if (proto === 'bgp' && target.bgpConfig) {
        target.bgpConfig.routerId = rid;
      } else if (target.ospfConfig) {
        target.ospfConfig.routerId = rid;
      }
      return { output: '' };
    }

    // passive-interface default
    if ('passive-interface'.startsWith(cmd0) && tokens.length > 1 && tokens[1].toLowerCase() === 'default') {
      if (_context.targetAfProto === 'ipv6' && target.eigrpV6Config) {
        target.eigrpV6Config.passiveInterfaceDefault = true;
      } else if (target.eigrpConfig) {
        target.eigrpConfig.passiveInterfaceDefault = true;
      }
      return { output: '' };
    }

    // no passive-interface <interface>
    if (cmd0 === 'no' && tokens.length >= 3 && 'passive-interface'.startsWith(tokens[1].toLowerCase())) {
      const norm = CliLexer.normalizeInterfaceName(tokens[2]);
      const cfg = _context.targetAfProto === 'ipv6' ? target.eigrpV6Config : target.eigrpConfig;
      if (cfg) {
        cfg.passiveInterfaces = cfg.passiveInterfaces.filter(p => p !== norm && p !== `no passive-interface ${norm}`);
        if (cfg.passiveInterfaceDefault) {
          cfg.passiveInterfaces.push(`no passive-interface ${norm}`);
        }
      } else if (target.ospfConfig) {
        target.ospfConfig.passiveInterfaces = target.ospfConfig.passiveInterfaces.filter(p => p !== norm);
      }
      return { output: '' };
    }

    // passive-interface <interface>
    if ('passive-interface'.startsWith(cmd0) && tokens.length > 1) {
      const norm = CliLexer.normalizeInterfaceName(tokens[1]);
      if (_context.targetAfProto === 'ipv6' && target.eigrpV6Config) {
        target.eigrpV6Config.passiveInterfaces.push(norm);
      } else if (proto === 'eigrp' && target.eigrpConfig) {
        target.eigrpConfig.passiveInterfaces.push(norm);
      } else if (target.ospfConfig) {
        target.ospfConfig.passiveInterfaces.push(norm);
      }
      return { output: '' };
    }

    // no auto-summary
    if (cmd0 === 'no' && tokens.length >= 2 && 'auto-summary'.startsWith(tokens[1].toLowerCase())) {
      if (target.eigrpConfig) {
        target.eigrpConfig.autoSummary = false;
        return { output: '' };
      }
    }

    // auto-summary
    if ('auto-summary'.startsWith(cmd0)) {
      if (target.eigrpConfig) {
        target.eigrpConfig.autoSummary = true;
        return { output: '' };
      }
    }

    // redistribute <protocol> [asOrPid] [metric ...] [metric-type <1|2>] [route-map <name>] [subnets]
    if ('redistribute'.startsWith(cmd0) && tokens.length >= 2) {
      const redisProto = tokens[1].toLowerCase();
      let asOrPid: number | undefined;
      let metric: number | undefined;
      let metricType: 'type-1' | 'type-2' | undefined;
      let routeMap: string | undefined;
      let subnets = false;

      let idx = 2;
      // If next token is numeric (AS or Process ID for ospf, eigrp, bgp)
      if (idx < tokens.length && !isNaN(parseInt(tokens[idx], 10)) && ['ospf', 'eigrp', 'bgp'].includes(redisProto)) {
        asOrPid = parseInt(tokens[idx], 10);
        idx++;
      }

      while (idx < tokens.length) {
        const t = tokens[idx].toLowerCase();
        if ('subnets'.startsWith(t)) {
          subnets = true;
          idx++;
        } else if ('metric-type'.startsWith(t) && idx + 1 < tokens.length) {
          const mt = tokens[idx + 1].toLowerCase();
          if (mt === '1' || mt === 'type-1') metricType = 'type-1';
          else if (mt === '2' || mt === 'type-2') metricType = 'type-2';
          idx += 2;
        } else if ('metric'.startsWith(t) && idx + 1 < tokens.length) {
          metric = parseInt(tokens[idx + 1], 10);
          idx += 2;
          while (idx < tokens.length && !isNaN(parseInt(tokens[idx], 10))) {
            idx++;
          }
        } else if ('route-map'.startsWith(t) && idx + 1 < tokens.length) {
          routeMap = tokens[idx + 1];
          idx += 2;
        } else {
          idx++;
        }
      }

      const redisEntry: RedistributionConfig = {
        protocol: redisProto as any,
        asOrProcessId: asOrPid,
        metric,
        metricType,
        routeMap,
        subnets
      };

      if (target.ospfConfig && (proto === 'ospf' || (!target.eigrpConfig && !target.bgpConfig))) {
        if (!target.ospfConfig.redistributions) target.ospfConfig.redistributions = [];
        target.ospfConfig.redistributions = target.ospfConfig.redistributions.filter(r => r.protocol !== redisProto);
        target.ospfConfig.redistributions.push(redisEntry);
        return { output: '' };
      }
      if (target.eigrpConfig && (proto === 'eigrp' || (!target.ospfConfig && !target.bgpConfig))) {
        if (!target.eigrpConfig.redistributions) target.eigrpConfig.redistributions = [];
        target.eigrpConfig.redistributions = target.eigrpConfig.redistributions.filter(r => r.protocol !== redisProto);
        target.eigrpConfig.redistributions.push(redisEntry);
        return { output: '' };
      }
      if (target.bgpConfig && (proto === 'bgp' || (!target.ospfConfig && !target.eigrpConfig))) {
        if (!target.bgpConfig.redistributions) target.bgpConfig.redistributions = [];
        target.bgpConfig.redistributions = target.bgpConfig.redistributions.filter(r => r.protocol !== redisProto);
        target.bgpConfig.redistributions.push(redisEntry);
        return { output: '' };
      }
    }

    // no redistribute <protocol> [asOrPid]
    if (cmd0 === 'no' && tokens.length >= 3 && 'redistribute'.startsWith(tokens[1].toLowerCase())) {
      const redisProto = tokens[2].toLowerCase();
      if (target.ospfConfig && target.ospfConfig.redistributions) {
        target.ospfConfig.redistributions = target.ospfConfig.redistributions.filter(r => r.protocol !== redisProto);
      }
      if (target.eigrpConfig && target.eigrpConfig.redistributions) {
        target.eigrpConfig.redistributions = target.eigrpConfig.redistributions.filter(r => r.protocol !== redisProto);
      }
      if (target.bgpConfig && target.bgpConfig.redistributions) {
        target.bgpConfig.redistributions = target.bgpConfig.redistributions.filter(r => r.protocol !== redisProto);
      }
      return { output: '' };
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

  // ===================== ROUTE-MAP CONFIG MODE =====================
  private static execRouteMapConfigMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const mapName = context.targetRouteMapName || (context as any).targetRouteMap;
    const seq = context.targetRouteMapSeq || (context as any).targetSequence || 10;
    const target = device as Router | Switch;

    if (!mapName || !target.routeMaps) {
      return { output: '% No route-map currently being edited.' };
    }

    let rm = target.routeMaps.get(mapName);
    if (!rm) {
      rm = { name: mapName, clauses: [] };
      target.routeMaps.set(mapName, rm);
    }

    let clause = rm.clauses.find(c => c.sequence === seq);
    if (!clause) {
      clause = { sequence: seq, action: 'permit' };
      rm.clauses.push(clause);
    }

    // match ip address prefix-list <name>
    if ('match'.startsWith(cmd0) && tokens.length >= 5 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'address'.startsWith(tokens[2].toLowerCase()) && 'prefix-list'.startsWith(tokens[3].toLowerCase())) {
      clause.matchPrefixList = tokens[4];
      return { output: '' };
    }

    // match ip address <acl-id>
    if ('match'.startsWith(cmd0) && tokens.length >= 4 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'address'.startsWith(tokens[2].toLowerCase())) {
      const aclId = parseInt(tokens[3], 10);
      if (!isNaN(aclId)) {
        clause.matchAcl = aclId;
        return { output: '' };
      }
    }

    // match tag <tag>
    if ('match'.startsWith(cmd0) && tokens.length >= 3 && 'tag'.startsWith(tokens[1].toLowerCase())) {
      const tagVal = parseInt(tokens[2], 10);
      if (!isNaN(tagVal)) {
        clause.matchTag = tagVal;
        return { output: '' };
      }
    }

    // set metric <val>
    if ('set'.startsWith(cmd0) && tokens.length >= 3 && 'metric'.startsWith(tokens[1].toLowerCase()) && !tokens[1].toLowerCase().includes('type')) {
      const mVal = parseInt(tokens[2], 10);
      if (!isNaN(mVal)) {
        clause.setMetric = mVal;
        return { output: '' };
      }
    }

    // set metric-type <type-1 | type-2 | 1 | 2>
    if ('set'.startsWith(cmd0) && tokens.length >= 3 && 'metric-type'.startsWith(tokens[1].toLowerCase())) {
      const mt = tokens[2].toLowerCase();
      clause.setMetricType = (mt === 'type-1' || mt === '1') ? 'type-1' : 'type-2';
      return { output: '' };
    }

    // set tag <tag>
    if ('set'.startsWith(cmd0) && tokens.length >= 3 && 'tag'.startsWith(tokens[1].toLowerCase())) {
      const tagVal = parseInt(tokens[2], 10);
      if (!isNaN(tagVal)) {
        clause.setTag = tagVal;
        return { output: '' };
      }
    }

    // set ip next-hop verify-availability <ip> 1 track <trackId>
    if ('set'.startsWith(cmd0) && tokens.length >= 7 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'next-hop'.startsWith(tokens[2].toLowerCase()) && 'verify-availability'.startsWith(tokens[3].toLowerCase())) {
      const nextHop = tokens[4];
      let trackId = 1;
      const trackIdx = tokens.findIndex(t => t.toLowerCase() === 'track');
      if (trackIdx !== -1 && trackIdx + 1 < tokens.length) {
        trackId = parseInt(tokens[trackIdx + 1], 10) || 1;
      }
      clause.setIpNextHopTrack = { nextHop, trackId };
      clause.setIpNextHop = nextHop;
      return { output: '' };
    }

    // match as-path <acl-id>
    if ('match'.startsWith(cmd0) && tokens.length >= 3 && 'as-path'.startsWith(tokens[1].toLowerCase())) {
      const aclId = parseInt(tokens[2], 10);
      if (!isNaN(aclId)) {
        clause.matchAsPath = aclId;
        return { output: '' };
      }
    }

    // match ipv6 address prefix-list <name>
    if ('match'.startsWith(cmd0) && tokens.length >= 5 && 'ipv6'.startsWith(tokens[1].toLowerCase()) && 'address'.startsWith(tokens[2].toLowerCase()) && 'prefix-list'.startsWith(tokens[3].toLowerCase())) {
      clause.matchIpv6AddressPrefixList = tokens[4];
      return { output: '' };
    }

    // set weight <val>
    if ('set'.startsWith(cmd0) && tokens.length >= 3 && 'weight'.startsWith(tokens[1].toLowerCase())) {
      const wVal = parseInt(tokens[2], 10);
      if (!isNaN(wVal)) {
        clause.setWeight = wVal;
        return { output: '' };
      }
    }

    // set local-preference <val>
    if ('set'.startsWith(cmd0) && tokens.length >= 3 && 'local-preference'.startsWith(tokens[1].toLowerCase())) {
      const lpVal = parseInt(tokens[2], 10);
      if (!isNaN(lpVal)) {
        clause.setLocalPreference = lpVal;
        return { output: '' };
      }
    }

    // set as-path prepend <as-string...>
    if ('set'.startsWith(cmd0) && tokens.length >= 4 && 'as-path'.startsWith(tokens[1].toLowerCase()) && 'prepend'.startsWith(tokens[2].toLowerCase())) {
      clause.setAsPathPrepend = tokens.slice(3).join(' ');
      return { output: '' };
    }

    // set ip next-hop <ip>
    if ('set'.startsWith(cmd0) && tokens.length >= 4 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'next-hop'.startsWith(tokens[2].toLowerCase())) {
      clause.setIpNextHop = tokens[3];
      return { output: '' };
    }

    // no match ...
    if (cmd0 === 'no' && tokens.length >= 2) {
      const sub = tokens[1].toLowerCase();
      if ('match'.startsWith(sub)) {
        clause.matchPrefixList = undefined;
        clause.matchAcl = undefined;
        clause.matchTag = undefined;
        return { output: '' };
      }
      if ('set'.startsWith(sub)) {
        clause.setMetric = undefined;
        clause.setMetricType = undefined;
        clause.setTag = undefined;
        clause.setIpNextHop = undefined;
        clause.setIpNextHopTrack = undefined;
        return { output: '' };
      }
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== IP SLA CONFIG MODE =====================
  private static execIpSlaConfigMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const slaId = context.targetIpSlaId;
    const target = device as Router | Switch;

    if (!slaId || !target.ipSlas) {
      return { output: '% No IP SLA currently being edited.' };
    }

    let sla = target.ipSlas.get(slaId);
    if (!sla) {
      sla = { id: slaId, type: 'icmp-echo', targetIp: '', state: 'Timeout' };
      target.ipSlas.set(slaId, sla);
    }

    // icmp-echo <targetIp>
    if ('icmp-echo'.startsWith(cmd0) && tokens.length >= 2) {
      sla.targetIp = tokens[1];
      return { output: '' };
    }

    // frequency <sec>
    if ('frequency'.startsWith(cmd0) && tokens.length >= 2) {
      sla.frequency = parseInt(tokens[1], 10) || 10;
      return { output: '' };
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== VRF CONFIG MODE =====================
  private static execVrfConfigMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const vrfName = context.targetVrfName;
    if (!vrfName) return { output: '% No VRF selected.' };

    const target = device as Router | Switch;
    const vrf = VrfEngine.getOrCreateVrf(target, vrfName);

    // rd <ASN:nn | IP:nn>
    if ('rd'.startsWith(cmd0) && tokens.length >= 2) {
      vrf.rd = tokens[1];
      return { output: '' };
    }

    // description <text>
    if ('description'.startsWith(cmd0) && tokens.length >= 2) {
      vrf.description = tokens.slice(1).join(' ');
      return { output: '' };
    }

    // route-target {export|import|both} <rt>
    if ('route-target'.startsWith(cmd0) && tokens.length >= 3) {
      const type = tokens[1].toLowerCase();
      const rt = tokens[2];
      if (type === 'export' || type === 'import' || type === 'both') {
        vrf.routeTargets.push({ type: type as any, rt });
        return { output: '' };
      }
    }

    // address-family ipv4 [unicast]
    if ('address-family'.startsWith(cmd0) && tokens.length >= 2 && 'ipv4'.startsWith(tokens[1].toLowerCase())) {
      return {
        output: '',
        newMode: 'vrf-af-config',
        contextUpdates: { targetVrfAf: 'ipv4' }
      };
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== VRF ADDRESS-FAMILY CONFIG MODE =====================
  private static execVrfAfConfigMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const vrfName = context.targetVrfName;
    if (!vrfName) return { output: '% No VRF selected.' };

    const target = device as Router | Switch;
    const vrf = VrfEngine.getOrCreateVrf(target, vrfName);

    // route-target {export|import|both} <rt>
    if ('route-target'.startsWith(cmd0) && tokens.length >= 3) {
      const type = tokens[1].toLowerCase();
      const rt = tokens[2];
      if (type === 'export' || type === 'import' || type === 'both') {
        vrf.routeTargets.push({ type: type as any, rt });
        return { output: '' };
      }
    }

    // exit-address-family / exit
    if ('exit-address-family'.startsWith(cmd0) || cmd0 === 'exit') {
      return {
        output: '',
        newMode: 'vrf-config'
      };
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== CRYPTO ISAKMP POLICY CONFIG MODE =====================
  private static execCryptoIsakmpPolicyMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const prio = context.targetIsakmpPriority;
    if (!prio || !(device instanceof Router)) return { output: '% No ISAKMP policy selected.' };

    let policy = device.cryptoPolicies.get(prio);
    if (!policy) {
      policy = { priority: prio };
      device.cryptoPolicies.set(prio, policy);
    }

    // encryption / encr <alg>
    if (('encryption'.startsWith(cmd0) || 'encr'.startsWith(cmd0)) && tokens.length > 1) {
      policy.encryption = tokens.slice(1).join(' ');
      return { output: '' };
    }

    // hash <alg>
    if ('hash'.startsWith(cmd0) && tokens.length > 1) {
      policy.hash = tokens[1];
      return { output: '' };
    }

    // authentication <type>
    if ('authentication'.startsWith(cmd0) && tokens.length > 1) {
      policy.authentication = tokens[1];
      return { output: '' };
    }

    // group <group-num>
    if ('group'.startsWith(cmd0) && tokens.length > 1) {
      policy.group = parseInt(tokens[1], 10);
      return { output: '' };
    }

    // lifetime <seconds>
    if ('lifetime'.startsWith(cmd0) && tokens.length > 1) {
      policy.lifetime = parseInt(tokens[1], 10);
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

  // ===================== CRYPTO IPSEC PROFILE CONFIG MODE =====================
  private static execCryptoIpsecProfileMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const profName = context.targetIpsecProfileName;
    if (!profName || !(device instanceof Router)) return { output: '% No IPsec profile selected.' };

    let prof = device.cryptoProfiles.get(profName);
    if (!prof) {
      prof = { name: profName };
      device.cryptoProfiles.set(profName, prof);
    }

    // set transform-set <name>
    if (cmd0 === 'set' && tokens.length >= 3 && 'transform-set'.startsWith(tokens[1].toLowerCase())) {
      prof.transformSet = tokens[2];
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

  // ===================== ZONE-PAIR CONFIG MODE =====================
  private static execZonePairConfigMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const zpName = context.targetZonePairName;
    if (!zpName || !(device instanceof Router)) return { output: '% No zone-pair selected.' };

    const zp = device.zonePairs.get(zpName);
    if (!zp) return { output: `% Zone-pair ${zpName} not found.` };

    // service-policy type inspect <name>
    if ('service-policy'.startsWith(cmd0) && tokens.length >= 4 && tokens[1].toLowerCase() === 'type' && tokens[2].toLowerCase() === 'inspect') {
      zp.servicePolicy = tokens[3];
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

  // ===================== CLASS-MAP INSPECT CONFIG MODE =====================
  private static execClassMapInspectMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const cmName = context.targetClassMapName;
    if (!cmName || !(device instanceof Router)) return { output: '% No class-map selected.' };

    const cm = device.inspectClassMaps.get(cmName);
    if (!cm) return { output: `% Class-map ${cmName} not found.` };

    // match protocol <protocol>
    if ('match'.startsWith(cmd0) && tokens.length >= 3 && 'protocol'.startsWith(tokens[1].toLowerCase())) {
      cm.matches.push({ type: 'protocol', protocol: tokens[2].toLowerCase() });
      return { output: '' };
    }

    // match access-group <num>
    if ('match'.startsWith(cmd0) && tokens.length >= 3 && 'access-group'.startsWith(tokens[1].toLowerCase())) {
      const aclNum = parseInt(tokens[2], 10);
      cm.matches.push({ type: 'access-group', accessGroup: isNaN(aclNum) ? 1 : aclNum });
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

  // ===================== POLICY-MAP INSPECT CONFIG MODE =====================
  private static execPolicyMapInspectMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const pmName = context.targetPolicyMapName;
    if (!pmName || !(device instanceof Router)) return { output: '% No policy-map selected.' };

    const pm = device.inspectPolicyMaps.get(pmName);
    if (!pm) return { output: `% Policy-map ${pmName} not found.` };

    // class type inspect <className>
    if ('class'.startsWith(cmd0) && tokens.length >= 4 && tokens[1].toLowerCase() === 'type' && tokens[2].toLowerCase() === 'inspect') {
      const className = tokens[3];
      let pClass = pm.classes.find(c => c.className === className);
      if (!pClass) {
        pClass = { className, action: 'drop' };
        pm.classes.push(pClass);
      }
      return {
        output: '',
        newMode: 'policy-map-class-inspect',
        contextUpdates: { targetPolicyMapClass: className }
      };
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

  // ===================== POLICY-MAP CLASS INSPECT CONFIG MODE =====================
  private static execPolicyMapClassInspectMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const pmName = context.targetPolicyMapName;
    const className = context.targetPolicyMapClass;
    if (!pmName || !className || !(device instanceof Router)) return { output: '% No class selected.' };

    const pm = device.inspectPolicyMaps.get(pmName);
    const pClass = pm?.classes.find(c => c.className === className);
    if (!pClass) return { output: `% Class ${className} not found in policy.` };

    // inspect
    if ('inspect'.startsWith(cmd0)) {
      pClass.action = 'inspect';
      return { output: '' };
    }

    // pass
    if ('pass'.startsWith(cmd0)) {
      pClass.action = 'pass';
      return { output: '' };
    }

    // drop
    if ('drop'.startsWith(cmd0)) {
      pClass.action = 'drop';
      return { output: '' };
    }

    // exit
    if (cmd0 === 'exit') {
      return { output: '', newMode: 'policy-map-inspect' };
    }

    // end
    if (cmd0 === 'end') {
      return { output: '', newMode: 'priv-exec' };
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== CONTROL PLANE CONFIG MODE =====================
  private static execControlPlaneConfigMode(
    tokens: string[],
    _raw: string,
    _context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    if (!(device instanceof Router)) return { output: '% Control plane not supported on this device.' };

    // service-policy input <policyName>
    if ('service-policy'.startsWith(cmd0) && tokens.length >= 3 && 'input'.startsWith(tokens[1].toLowerCase())) {
      const pName = tokens[2];
      device.coppPolicy = {
        name: pName,
        classes: [{ className: 'class-default', rateLimitBps: 1000000 }]
      };
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

  // ===================== EEM APPLET CONFIG MODE =====================
  private static execEemAppletConfigMode(
    tokens: string[],
    raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const appletName = context.targetAppletName;
    if (!appletName || !(device instanceof Router)) return { output: '% No applet selected.' };

    const applet = device.eemApplets.get(appletName);
    if (!applet) return { output: `% Applet ${appletName} not found.` };

    // exit
    if (cmd0 === 'exit') {
      return { output: '', newMode: 'global-config' };
    }

    // end
    if (cmd0 === 'end') {
      return { output: '', newMode: 'priv-exec' };
    }

    // event cli pattern "<regex>" [sync yes|no]
    if ('event'.startsWith(cmd0) && tokens.length >= 4 && 'cli'.startsWith(tokens[1].toLowerCase()) && 'pattern'.startsWith(tokens[2].toLowerCase())) {
      const patternMatch = raw.match(/pattern\s+["']?([^"']+)["']?/i);
      const pattern = patternMatch ? patternMatch[1] : tokens[3];
      const isSync = raw.toLowerCase().includes('sync yes');
      applet.event = {
        type: 'cli',
        pattern,
        sync: isSync
      };
      return { output: '' };
    }

    // event syslog pattern "<regex>"
    if ('event'.startsWith(cmd0) && tokens.length >= 4 && 'syslog'.startsWith(tokens[1].toLowerCase()) && 'pattern'.startsWith(tokens[2].toLowerCase())) {
      const patternMatch = raw.match(/pattern\s+["']?([^"']+)["']?/i);
      const pattern = patternMatch ? patternMatch[1] : tokens[3];
      applet.event = {
        type: 'syslog',
        pattern
      };
      return { output: '' };
    }

    // event timer watchdog time <sec>
    if ('event'.startsWith(cmd0) && tokens.length >= 5 && 'timer'.startsWith(tokens[1].toLowerCase()) && 'watchdog'.startsWith(tokens[2].toLowerCase()) && 'time'.startsWith(tokens[3].toLowerCase())) {
      const timeSec = parseInt(tokens[4], 10) || 60;
      applet.event = {
        type: 'timer',
        timeSec
      };
      return { output: '' };
    }

    // action <label> syslog msg "<msg>"
    if ('action'.startsWith(cmd0) && tokens.length >= 5 && 'syslog'.startsWith(tokens[2].toLowerCase()) && 'msg'.startsWith(tokens[3].toLowerCase())) {
      const label = tokens[1];
      const msgMatch = raw.match(/msg\s+["']?([^"']+)["']?/i);
      const msg = msgMatch ? msgMatch[1] : tokens.slice(4).join(' ');
      applet.actions = applet.actions.filter(a => a.label !== label);
      applet.actions.push({
        label,
        type: 'syslog',
        argument: msg
      });
      return { output: '' };
    }

    // action <label> cli command "<cmd>"
    if ('action'.startsWith(cmd0) && tokens.length >= 5 && 'cli'.startsWith(tokens[2].toLowerCase()) && 'command'.startsWith(tokens[3].toLowerCase())) {
      const label = tokens[1];
      const cmdMatch = raw.match(/command\s+["']?([^"']+)["']?/i);
      const targetCmd = cmdMatch ? cmdMatch[1] : tokens.slice(4).join(' ');
      applet.actions = applet.actions.filter(a => a.label !== label);
      applet.actions.push({
        label,
        type: 'cli',
        argument: targetCmd
      });
      return { output: '' };
    }

    // no event
    if (cmd0 === 'no' && tokens.length >= 2 && 'event'.startsWith(tokens[1].toLowerCase())) {
      applet.event = undefined;
      return { output: '' };
    }

    // no action <label>
    if (cmd0 === 'no' && tokens.length >= 3 && 'action'.startsWith(tokens[1].toLowerCase())) {
      const label = tokens[2];
      applet.actions = applet.actions.filter(a => a.label !== label);
      return { output: '' };
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== MDT SUBSCRIPTION CONFIG MODE =====================
  private static execMdtSubscriptionConfigMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const subId = context.targetSubscriptionId;
    if (subId === undefined || !(device instanceof Router)) return { output: '% No subscription selected.' };

    const sub = device.mdtSubscriptions.get(subId);
    if (!sub) return { output: `% Subscription ${subId} not found.` };

    // exit
    if (cmd0 === 'exit') {
      return { output: '', newMode: 'global-config' };
    }

    // end
    if (cmd0 === 'end') {
      return { output: '', newMode: 'priv-exec' };
    }

    // encoding <encode-kvgpb | encode-xml>
    if ('encoding'.startsWith(cmd0) && tokens.length >= 2) {
      const enc = tokens[1].toLowerCase();
      if (enc === 'encode-xml' || enc === 'xml') {
        sub.encoding = 'encode-xml';
      } else {
        sub.encoding = 'encode-kvgpb';
      }
      return { output: '' };
    }

    // filter xpath <xpath>
    if ('filter'.startsWith(cmd0) && tokens.length >= 3 && 'xpath'.startsWith(tokens[1].toLowerCase())) {
      sub.filterXpath = tokens[2];
      return { output: '' };
    }

    // source-address <ip>
    if ('source-address'.startsWith(cmd0) && tokens.length >= 2) {
      sub.sourceAddress = tokens[1];
      return { output: '' };
    }

    // stream <streamName>
    if ('stream'.startsWith(cmd0) && tokens.length >= 2) {
      sub.stream = tokens[1];
      return { output: '' };
    }

    // update-policy periodic <centiseconds>
    if ('update-policy'.startsWith(cmd0) && tokens.length >= 3 && 'periodic'.startsWith(tokens[1].toLowerCase())) {
      const cs = parseInt(tokens[2], 10) || 1000;
      sub.updatePolicy = { type: 'periodic', periodCentiseconds: cs };
      return { output: '' };
    }

    // update-policy on-change
    if ('update-policy'.startsWith(cmd0) && tokens.length >= 2 && 'on-change'.startsWith(tokens[1].toLowerCase())) {
      sub.updatePolicy = { type: 'on-change' };
      return { output: '' };
    }

    // receiver ip address <address> <port> protocol <protocol>
    if ('receiver'.startsWith(cmd0) && tokens.length >= 7 && 'ip'.startsWith(tokens[1].toLowerCase()) && 'address'.startsWith(tokens[2].toLowerCase())) {
      const address = tokens[3];
      const port = parseInt(tokens[4], 10) || 57500;
      const protocol = (tokens[6] || 'grpc-tcp').toLowerCase() as 'grpc-tcp' | 'grpc-tls' | 'native';
      sub.receivers.push({ address, port, protocol });
      return { output: '' };
    }

    // no receiver ip address <address> <port>
    if (cmd0 === 'no' && tokens.length >= 5 && 'receiver'.startsWith(tokens[1].toLowerCase())) {
      const address = tokens[4];
      sub.receivers = sub.receivers.filter(r => r.address !== address);
      return { output: '' };
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== KEY CHAIN CONFIG MODE =====================
  private static execKeyChainConfigMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();

    if (cmd0 === 'exit') {
      return { output: '', newMode: 'global-config' };
    }
    if (cmd0 === 'end') {
      return { output: '', newMode: 'priv-exec' };
    }

    // key <keyId>
    if (cmd0 === 'key' && tokens.length >= 2) {
      const keyId = parseInt(tokens[1], 10);
      if (isNaN(keyId)) return { output: '% Invalid key id.' };

      if (context.targetKeyChain) {
        let kc = device.keyChains.get(context.targetKeyChain);
        if (!kc) {
          kc = { name: context.targetKeyChain, keys: new Map() };
          device.keyChains.set(context.targetKeyChain, kc);
        }
        if (!kc.keys.has(keyId)) {
          kc.keys.set(keyId, { keyId });
        }
      }

      return {
        output: '',
        newMode: 'keychain-key-config',
        contextUpdates: {
          targetKeyId: keyId
        }
      };
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== KEY CHAIN KEY CONFIG MODE =====================
  private static execKeyChainKeyConfigMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();

    if (cmd0 === 'exit') {
      return { output: '', newMode: 'keychain-config' };
    }
    if (cmd0 === 'end') {
      return { output: '', newMode: 'priv-exec' };
    }

    // key-string <string>
    if ('key-string'.startsWith(cmd0) && tokens.length >= 2) {
      const keyString = tokens.slice(1).join(' ');
      if (context.targetKeyChain && context.targetKeyId !== undefined) {
        const kc = device.keyChains.get(context.targetKeyChain);
        if (kc) {
          let k = kc.keys.get(context.targetKeyId);
          if (!k) {
            k = { keyId: context.targetKeyId };
            kc.keys.set(context.targetKeyId, k);
          }
          k.keyString = keyString;
        }
      }
      return { output: '' };
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== ROUTER ADDRESS-FAMILY CONFIG MODE =====================
  private static execRouterAfConfigMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const target = device as Router | Switch;

    if (cmd0 === 'exit' || 'exit-address-family'.startsWith(cmd0)) {
      return { output: '', newMode: 'router-config' };
    }
    if (cmd0 === 'end') {
      return { output: '', newMode: 'priv-exec' };
    }

    const isBgp = context.targetAfType === 'bgp' || (!!target.bgpConfig && !target.eigrpConfig && !target.eigrpV6Config);
    const afKey = context.targetAfProto || 'ipv4';

    if (isBgp && target.bgpConfig) {
      if (!target.bgpConfig.addressFamilies) target.bgpConfig.addressFamilies = new Map();
      if (!target.bgpConfig.addressFamilies.has(afKey)) {
        target.bgpConfig.addressFamilies.set(afKey, {
          type: afKey as any,
          subType: 'unicast',
          networks: [],
          neighbors: new Map()
        });
      }
      const af = target.bgpConfig.addressFamilies.get(afKey)!;

      // network <ip|prefix> [mask <mask>]
      if ('network'.startsWith(cmd0) && tokens.length >= 2) {
        const net = tokens[1];
        let mask: string | undefined;
        if (tokens.length >= 4 && 'mask'.startsWith(tokens[2].toLowerCase())) {
          mask = tokens[3];
        }
        af.networks.push({ network: net, mask });
        return { output: '' };
      }

      // aggregate-address <prefix> <mask|cidr> [summary-only] [as-set]
      if ('aggregate-address'.startsWith(cmd0) && tokens.length >= 3) {
        if (!af.aggregateAddresses) af.aggregateAddresses = [];
        const prefix = tokens[1];
        const mask = tokens[2];
        const summaryOnly = tokens.some(t => t.toLowerCase() === 'summary-only');
        const asSet = tokens.some(t => t.toLowerCase() === 'as-set');
        af.aggregateAddresses.push({ prefix, mask, summaryOnly, asSet });
        return { output: '' };
      }
      if (cmd0 === 'no' && tokens.length >= 3 && 'aggregate-address'.startsWith(tokens[1].toLowerCase())) {
        if (af.aggregateAddresses) {
          const prefix = tokens[2];
          af.aggregateAddresses = af.aggregateAddresses.filter(a => a.prefix !== prefix);
        }
        return { output: '' };
      }

      // neighbor <ip> activate
      if ('neighbor'.startsWith(cmd0) && tokens.length >= 3 && 'activate'.startsWith(tokens[2].toLowerCase())) {
        const peer = tokens[1];
        if (!af.neighbors.has(peer)) af.neighbors.set(peer, {});
        af.neighbors.get(peer)!.activate = true;
        return { output: '' };
      }

      // no neighbor <ip> activate
      if (cmd0 === 'no' && tokens.length >= 4 && 'neighbor'.startsWith(tokens[1].toLowerCase()) && 'activate'.startsWith(tokens[3].toLowerCase())) {
        const peer = tokens[2];
        if (!af.neighbors.has(peer)) af.neighbors.set(peer, {});
        af.neighbors.get(peer)!.activate = false;
        return { output: '' };
      }

      // neighbor <ip> next-hop-self
      if ('neighbor'.startsWith(cmd0) && tokens.length >= 3 && 'next-hop-self'.startsWith(tokens[2].toLowerCase())) {
        const peer = tokens[1];
        if (!af.neighbors.has(peer)) af.neighbors.set(peer, {});
        af.neighbors.get(peer)!.nextHopSelf = true;
        return { output: '' };
      }

      // neighbor <ip> route-reflector-client
      if ('neighbor'.startsWith(cmd0) && tokens.length >= 3 && 'route-reflector-client'.startsWith(tokens[2].toLowerCase())) {
        const peer = tokens[1];
        if (!af.neighbors.has(peer)) af.neighbors.set(peer, {});
        af.neighbors.get(peer)!.routeReflectorClient = true;
        return { output: '' };
      }

      // neighbor <ip> filter-list <num> in|out
      if ('neighbor'.startsWith(cmd0) && tokens.length >= 5 && 'filter-list'.startsWith(tokens[2].toLowerCase())) {
        const peer = tokens[1];
        const aclNum = parseInt(tokens[3], 10);
        const dir = tokens[4].toLowerCase() as 'in' | 'out';
        if (!af.neighbors.has(peer)) af.neighbors.set(peer, {});
        const ncfg = af.neighbors.get(peer)!;
        if (dir === 'in') ncfg.filterListIn = aclNum;
        else ncfg.filterListOut = aclNum;
        return { output: '' };
      }

      // neighbor <ip> route-map <name> in|out
      if ('neighbor'.startsWith(cmd0) && tokens.length >= 5 && 'route-map'.startsWith(tokens[2].toLowerCase())) {
        const peer = tokens[1];
        const mapName = tokens[3];
        const dir = tokens[4].toLowerCase() as 'in' | 'out';
        if (!af.neighbors.has(peer)) af.neighbors.set(peer, {});
        const ncfg = af.neighbors.get(peer)!;
        if (dir === 'in') ncfg.routeMapIn = mapName;
        else ncfg.routeMapOut = mapName;
        return { output: '' };
      }

      // neighbor <ip> prefix-list <name> in|out
      if ('neighbor'.startsWith(cmd0) && tokens.length >= 5 && 'prefix-list'.startsWith(tokens[2].toLowerCase())) {
        const peer = tokens[1];
        const listName = tokens[3];
        const dir = tokens[4].toLowerCase() as 'in' | 'out';
        if (!af.neighbors.has(peer)) af.neighbors.set(peer, {});
        const ncfg = af.neighbors.get(peer)!;
        if (dir === 'in') ncfg.prefixListIn = listName;
        else ncfg.prefixListOut = listName;
        return { output: '' };
      }

      // neighbor <ip> weight <val>
      if ('neighbor'.startsWith(cmd0) && tokens.length >= 4 && 'weight'.startsWith(tokens[2].toLowerCase())) {
        const peer = tokens[1];
        const wVal = parseInt(tokens[3], 10);
        if (!af.neighbors.has(peer)) af.neighbors.set(peer, {});
        af.neighbors.get(peer)!.weight = wVal;
        return { output: '' };
      }

      // neighbor <ip> default-originate
      if ('neighbor'.startsWith(cmd0) && tokens.length >= 3 && 'default-originate'.startsWith(tokens[2].toLowerCase())) {
        const peer = tokens[1];
        if (!af.neighbors.has(peer)) af.neighbors.set(peer, {});
        af.neighbors.get(peer)!.defaultOriginate = true;
        return { output: '' };
      }
    }

    // network <ip> [wildcard] (IPv4)
    if ('network'.startsWith(cmd0) && tokens.length >= 2) {
      const net = tokens[1];
      const wc = tokens.length > 2 ? tokens[2] : undefined;
      if (context.targetAfProto !== 'ipv6' && target.eigrpConfig) {
        target.eigrpConfig.networks.push({ network: net, wildcard: wc });
      }
      return { output: '' };
    }

    // eigrp router-id <id>
    if ('eigrp'.startsWith(cmd0) && tokens.length >= 3 && 'router-id'.startsWith(tokens[1].toLowerCase())) {
      if (context.targetAfProto === 'ipv6' && target.eigrpV6Config) {
        target.eigrpV6Config.routerId = tokens[2];
      } else if (target.eigrpConfig) {
        target.eigrpConfig.routerId = tokens[2];
      }
      return { output: '' };
    }

    // router-id <id>
    if ('router-id'.startsWith(cmd0) && tokens.length >= 2) {
      if (context.targetAfProto === 'ipv6' && target.eigrpV6Config) {
        target.eigrpV6Config.routerId = tokens[1];
      } else if (target.eigrpConfig) {
        target.eigrpConfig.routerId = tokens[1];
      }
      return { output: '' };
    }

    // eigrp stub [receive-only | connected | summary | static | leak-map]*
    if ('eigrp'.startsWith(cmd0) && tokens.length >= 2 && 'stub'.startsWith(tokens[1].toLowerCase())) {
      const opts = tokens.slice(2).map(o => o.toLowerCase());
      const stubCfg = { enabled: true, options: opts };
      if (context.targetAfProto === 'ipv6' && target.eigrpV6Config) {
        target.eigrpV6Config.stub = stubCfg;
      } else if (target.eigrpConfig) {
        target.eigrpConfig.stub = stubCfg;
      }
      return { output: '' };
    }

    // no eigrp stub ...
    if (cmd0 === 'no' && tokens.length >= 3 && 'eigrp'.startsWith(tokens[1].toLowerCase()) && 'stub'.startsWith(tokens[2].toLowerCase())) {
      const cfg = context.targetAfProto === 'ipv6' ? target.eigrpV6Config : target.eigrpConfig;
      if (cfg && cfg.stub) {
        if (tokens.length >= 4 && tokens[3].toLowerCase() === 'receive-only') {
          cfg.stub.options = cfg.stub.options?.filter(o => o !== 'receive-only');
        } else {
          cfg.stub = undefined;
        }
      }
      return { output: '' };
    }

    // passive-interface default
    if ('passive-interface'.startsWith(cmd0) && tokens.length > 1 && tokens[1].toLowerCase() === 'default') {
      if (context.targetAfProto === 'ipv6' && target.eigrpV6Config) {
        target.eigrpV6Config.passiveInterfaceDefault = true;
      } else if (target.eigrpConfig) {
        target.eigrpConfig.passiveInterfaceDefault = true;
      }
      return { output: '' };
    }

    // no passive-interface <interface>
    if (cmd0 === 'no' && tokens.length >= 3 && 'passive-interface'.startsWith(tokens[1].toLowerCase())) {
      const norm = CliLexer.normalizeInterfaceName(tokens[2]);
      const cfg = context.targetAfProto === 'ipv6' ? target.eigrpV6Config : target.eigrpConfig;
      if (cfg) {
        cfg.passiveInterfaces = cfg.passiveInterfaces.filter(p => p !== norm && p !== `no passive-interface ${norm}`);
        if (cfg.passiveInterfaceDefault) {
          cfg.passiveInterfaces.push(`no passive-interface ${norm}`);
        }
      }
      return { output: '' };
    }

    // passive-interface <interface>
    if ('passive-interface'.startsWith(cmd0) && tokens.length > 1) {
      const norm = CliLexer.normalizeInterfaceName(tokens[1]);
      if (context.targetAfProto === 'ipv6' && target.eigrpV6Config) {
        target.eigrpV6Config.passiveInterfaces.push(norm);
      } else if (target.eigrpConfig) {
        target.eigrpConfig.passiveInterfaces.push(norm);
      }
      return { output: '' };
    }

    // topology base
    if ('topology'.startsWith(cmd0) && tokens.length >= 2 && 'base'.startsWith(tokens[1].toLowerCase())) {
      return {
        output: '',
        newMode: 'router-af-topology-config'
      };
    }

    // af-interface <interface>
    if ('af-interface'.startsWith(cmd0) && tokens.length >= 2) {
      const ifaceNorm = CliLexer.normalizeInterfaceName(tokens[1]);
      return {
        output: '',
        newMode: 'router-af-interface-config',
        contextUpdates: {
          targetAfInterface: ifaceNorm
        }
      };
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== ROUTER AF-TOPOLOGY CONFIG MODE =====================
  private static execRouterAfTopologyConfigMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const target = device as Router | Switch;

    if (cmd0 === 'exit' || 'exit-af-topology'.startsWith(cmd0)) {
      return { output: '', newMode: 'router-af-config' };
    }
    if (cmd0 === 'end') {
      return { output: '', newMode: 'priv-exec' };
    }

    // variance <num>
    if ('variance'.startsWith(cmd0) && tokens.length >= 2) {
      const v = parseInt(tokens[1], 10);
      if (!isNaN(v)) {
        if (context.targetAfProto === 'ipv6' && target.eigrpV6Config) {
          target.eigrpV6Config.variance = v;
        } else if (target.eigrpConfig) {
          target.eigrpConfig.variance = v;
        }
        return { output: '' };
      }
    }

    return { output: `% Invalid input detected at '^' marker.` };
  }

  // ===================== ROUTER AF-INTERFACE CONFIG MODE =====================
  private static execRouterAfInterfaceConfigMode(
    tokens: string[],
    _raw: string,
    context: CliContext,
    device: Device
  ): CliExecutionResult {
    const cmd0 = tokens[0].toLowerCase();
    const target = device as Router | Switch;
    const ifaceName = context.targetAfInterface;
    const iface = ifaceName ? target.getInterface(ifaceName) : undefined;
    const as = context.targetAsNumber || 1;

    if (cmd0 === 'exit' || 'exit-af-interface'.startsWith(cmd0)) {
      return { output: '', newMode: 'router-af-config' };
    }
    if (cmd0 === 'end') {
      return { output: '', newMode: 'priv-exec' };
    }

    // authentication mode hmac-sha-256 <key>
    if ('authentication'.startsWith(cmd0) && tokens.length >= 4 && 'mode'.startsWith(tokens[1].toLowerCase()) && 'hmac-sha-256'.startsWith(tokens[2].toLowerCase())) {
      const key = tokens[3];
      if (iface) {
        if (!iface.eigrpAuthMode) iface.eigrpAuthMode = {};
        iface.eigrpAuthMode[as] = 'hmac-sha-256';
        if (!iface.eigrpAuthKey) iface.eigrpAuthKey = {};
        iface.eigrpAuthKey[as] = key;
      }
      return { output: '' };
    }

    // authentication mode md5
    if ('authentication'.startsWith(cmd0) && tokens.length >= 3 && 'mode'.startsWith(tokens[1].toLowerCase()) && 'md5'.startsWith(tokens[2].toLowerCase())) {
      if (iface) {
        if (!iface.eigrpAuthMode) iface.eigrpAuthMode = {};
        iface.eigrpAuthMode[as] = 'md5';
      }
      return { output: '' };
    }

    // hello-interval <sec>
    if ('hello-interval'.startsWith(cmd0) && tokens.length >= 2) {
      const sec = parseInt(tokens[1], 10);
      if (iface && !isNaN(sec)) {
        if (!iface.eigrpHelloInterval) iface.eigrpHelloInterval = {};
        iface.eigrpHelloInterval[as] = sec;
      }
      return { output: '' };
    }

    // hold-time <sec>
    if ('hold-time'.startsWith(cmd0) && tokens.length >= 2) {
      const sec = parseInt(tokens[1], 10);
      if (iface && !isNaN(sec)) {
        if (!iface.eigrpHoldTime) iface.eigrpHoldTime = {};
        iface.eigrpHoldTime[as] = sec;
      }
      return { output: '' };
    }

    // shutdown
    if ('shutdown'.startsWith(cmd0)) {
      if (iface) iface.eigrpAfShutdown = true;
      return { output: '' };
    }

    // no shutdown
    if (cmd0 === 'no' && tokens.length >= 2 && 'shutdown'.startsWith(tokens[1].toLowerCase())) {
      if (iface) iface.eigrpAfShutdown = false;
      return { output: '' };
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

  private static renderIpRoute(device: Device, allDevices: Device[] = []): string {
    if (allDevices.length > 0) {
      RoutingProtocolEngine.convergeRoutingProtocols(allDevices);
    }
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
        header.push(`O     ${r.network}/${r.cidr} [${r.adminDistance || 110}/${r.metric || 2}] via ${r.nextHop || '10.0.0.2'}, ${r.exitInterface || 'GigabitEthernet0/0'}`);
      } else if (r.protocol === 'O IA') {
        header.push(`O IA  ${r.network}/${r.cidr} [${r.adminDistance || 110}/${r.metric || 3}] via ${r.nextHop || '10.0.0.2'}, ${r.exitInterface || 'GigabitEthernet0/0'}`);
      } else if (r.protocol === 'D') {
        header.push(`D     ${r.network}/${r.cidr} [${r.adminDistance || 90}/${r.metric || 30720}] via ${r.nextHop || '10.0.0.2'}, ${r.exitInterface || 'GigabitEthernet0/0'}`);
      } else if (r.protocol === 'D EX') {
        header.push(`D EX  ${r.network}/${r.cidr} [${r.adminDistance || 170}/${r.metric || 30720}] via ${r.nextHop || '10.0.0.2'}, ${r.exitInterface || 'GigabitEthernet0/0'}`);
      } else if (r.protocol === 'B') {
        header.push(`B     ${r.network}/${r.cidr} [${r.adminDistance || 20}/${r.metric || 0}] via ${r.nextHop || '10.0.0.2'}, ${r.exitInterface || 'GigabitEthernet0/0'}`);
      }
    }

    return header.join('\n');
  }

  private static renderIpv6Route(device: Device): string {
    const isL3 = (device instanceof Router) || (device instanceof Switch && (device as Switch).isLayer3);
    const unicastEnabled = (device as any).ipv6UnicastRouting === true;
    if (!isL3 || !unicastEnabled) {
      return `% IPv6 routing not enabled`;
    }

    const header = [
      'IPv6 Routing Table - default',
      'Codes: C - Connected, L - Local, S - Static, U - User',
      '       B - BGP, R - RIP, I1 - ISIS L1, I2 - ISIS L2',
      '       IA - ISIS interarea, IS - ISIS summary, D - EIGRP, EX - EIGRP external',
      '       ND - ND Default, NDp - ND Prefix, DCE - Destination, NDr - Redirect',
      '       O - OSPF Intra, OI - OSPF Inter, OE1 - OSPF ext 1, OE2 - OSPF ext 2',
      '       ON1 - OSPF NSSA ext 1, ON2 - OSPF NSSA ext 2',
      ''
    ];

    const routes: string[] = [];
    for (const iface of device.interfaces.values()) {
      if (!iface.isShutdown && iface.status === 'up' && iface.ipv6Address) {
        const parts = iface.ipv6Address.split('/');
        const ip = parts[0];
        const prefixLen = parts[1] || '64';

        let netPrefix = ip;
        if (ip.includes('::')) {
          const segments = ip.split('::');
          netPrefix = `${segments[0]}::/${prefixLen}`;
        } else {
          netPrefix = `${ip}/${prefixLen}`;
        }

        routes.push(`C   ${netPrefix} [0/0]\n     via ${iface.name}, directly connected`);
        routes.push(`L   ${ip}/128 [0/0]\n     via ${iface.name}, receive`);
      }
    }

    const eigrpV6 = (device as any).eigrpV6Config;
    if (eigrpV6 && eigrpV6.enabled) {
      for (const iface of device.interfaces.values()) {
        if (iface.eigrpIpv6SummaryAddresses) {
          for (const sa of iface.eigrpIpv6SummaryAddresses) {
            routes.push(`D   ${sa.prefix} [90/30720]\n     via Null0, directly connected`);
          }
        }
      }
    }

    if (routes.length === 0) {
      return header.join('\n') + '\n% No IPv6 routes found';
    }

    return header.join('\n') + routes.join('\n');
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
    if (tokens.length >= 2 && tokens[0].toLowerCase() === 'vrf') {
      return { output: VrfEngine.renderShowIpArpVrf(device as Router | Switch, tokens[1]) };
    }

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
  private static handlePing(targetRaw: string, sourceDevice: Device, allDevices: Device[], vrfName?: string): CliExecutionResult {
    const target = targetRaw.trim();
    let isDomain = false;
    let resolvedIp = target;

    if (vrfName) {
      const devL3 = sourceDevice as Router | Switch;
      if (!devL3.vrfInstances || !devL3.vrfInstances.has(vrfName)) {
        return { output: `% VRF ${vrfName} does not exist.` };
      }
      const vrf = devL3.vrfInstances.get(vrfName)!;
      let targetInVrf = false;
      let dstMac = '0001.96a1.1234';
      let vrfExitIfName = vrf.interfaces[0] || 'GigabitEthernet0/0/0';

      for (const dev of allDevices) {
        if (dev instanceof Host && dev.ipAddress === resolvedIp) {
          const hostEndpoints = TopologyTraversal.getL2BroadcastDomain(dev, 'FastEthernet0', allDevices);
          const connectsToVrf = hostEndpoints.some(ep => ep.device.id === sourceDevice.id && vrf.interfaces.includes(ep.interfaceName));
          if (connectsToVrf) {
            targetInVrf = true;
            dstMac = dev.interfaces.get('FastEthernet0')?.macAddress || '0050.7966.6800';
            break;
          }
        }
        for (const ifc of dev.interfaces.values()) {
          if (ifc.status === 'up' && !ifc.isShutdown && ifc.ipAddress === resolvedIp) {
            if (dev.id === sourceDevice.id && vrf.interfaces.includes(ifc.name)) {
              targetInVrf = true;
              dstMac = ifc.macAddress;
              vrfExitIfName = ifc.name;
              break;
            } else if (ifc.vrf === vrfName) {
              targetInVrf = true;
              dstMac = ifc.macAddress;
              break;
            }
          }
        }
        if (targetInVrf) break;
      }

      const vrfRoute = devL3.lookupRoute(resolvedIp, vrfName);
      if (vrfRoute) {
        targetInVrf = true;
      }

      if (targetInVrf) {
        sourceDevice.addArpEntry({
          protocol: 'Internet',
          ipAddress: resolvedIp,
          macAddress: dstMac,
          interfaceName: vrfExitIfName,
          type: 'ARPA',
          age: 0
        });
        return {
          output: `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${resolvedIp}, timeout is 2 seconds:\n!!!!!\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`
        };
      } else {
        return {
          output: `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${resolvedIp}, timeout is 2 seconds:\n.....\nSuccess rate is 0 percent (0/5)`
        };
      }
    }

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

    // Check if resolvedIp is an FHRP Virtual IP (HSRP / VRRP)
    if (!targetDevice) {
      const fhrpRes = FhrpEngine.resolveVirtualGateway(resolvedIp, allDevices);
      if (fhrpRes) {
        targetDevice = fhrpRes.activeDevice;
      }
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

  // ===================== SPANNING TREE PROTOCOL (STP) HANDLERS =====================
  private static handleShowSpanningTree(
    tokens: string[],
    device: Device,
    allDevices: Device[]
  ): CliExecutionResult {
    if (!(device instanceof Switch)) {
      return { output: `% Spanning tree is not enabled on this device.` };
    }

    if (tokens.length === 2) {
      return { output: SpanningTreeEngine.renderShowSpanningTree(device, allDevices, 1) };
    }

    const sub = tokens[2].toLowerCase();

    if ('summary'.startsWith(sub)) {
      return { output: SpanningTreeEngine.renderShowSpanningTreeSummary(device, allDevices) };
    }

    if ('root'.startsWith(sub)) {
      return { output: SpanningTreeEngine.renderShowSpanningTreeRoot(device, allDevices) };
    }

    if ('vlan'.startsWith(sub) && tokens.length >= 4) {
      const vlanId = parseInt(tokens[3], 10);
      if (isNaN(vlanId)) return { output: `% Invalid VLAN number.` };
      return { output: SpanningTreeEngine.renderShowSpanningTree(device, allDevices, vlanId) };
    }

    return { output: SpanningTreeEngine.renderShowSpanningTree(device, allDevices, 1) };
  }

  // ===================== ETHERCHANNEL HANDLERS =====================
  private static handleShowEtherchannel(
    tokens: string[],
    device: Device,
    allDevices: Device[]
  ): CliExecutionResult {
    if (!(device instanceof Switch)) {
      return { output: `% EtherChannel is not supported on this device.` };
    }

    if (tokens.length === 2) {
      return { output: EtherChannelEngine.renderShowEtherchannelSummary(device, allDevices) };
    }

    const sub = tokens[2].toLowerCase();

    if ('summary'.startsWith(sub)) {
      return { output: EtherChannelEngine.renderShowEtherchannelSummary(device, allDevices) };
    }

    if ('port-channel'.startsWith(sub)) {
      return { output: EtherChannelEngine.renderShowEtherchannelPortChannel(device, allDevices) };
    }

    const gid = parseInt(tokens[2], 10);
    if (!isNaN(gid)) {
      return { output: EtherChannelEngine.renderShowEtherchannelSummary(device, allDevices, gid) };
    }

    return { output: EtherChannelEngine.renderShowEtherchannelSummary(device, allDevices) };
  }

  // ===================== VTP HANDLERS =====================
  private static handleShowVtp(_tokens: string[], device: Device): CliExecutionResult {
    if (!(device instanceof Switch)) {
      return { output: `% VTP is not supported on this device.` };
    }

    const domainName = device.vtp?.domain || '';
    const vtpMode = device.vtp?.mode || 'server';
    const capMode = vtpMode.charAt(0).toUpperCase() + vtpMode.slice(1);

    return {
      output: [
        'VTP Version capable             : 1 to 3',
        'VTP version running             : 2',
        `VTP Domain Name                 : ${domainName}`,
        'VTP Pruning Mode                : Disabled',
        'VTP Traps Generation            : Disabled',
        `Device ID                       : ${device.id}`,
        'Configuration last modified by 0.0.0.0',
        'Local updater ID is 0.0.0.0',
        'Feature VLAN:',
        '--------------',
        `VTP Operating Mode                : ${capMode}`,
        'Maximum VLANs supported locally   : 1005',
        `Number of existing VLANs          : ${device.vlanDatabase.size}`,
        'Configuration Revision            : 0',
        'MD5 digest                        : 0xAB 0xCD 0x12 0x34 0x56 0x78 0x90 0xEF'
      ].join('\n')
    };
  }

  // ===================== DTP HANDLERS =====================
  private static handleShowDtp(tokens: string[], device: Device): CliExecutionResult {
    if (!(device instanceof Switch)) {
      return { output: `% DTP is not supported on this device.` };
    }

    if (tokens.length >= 4 && ('interface'.startsWith(tokens[2].toLowerCase()) || tokens[2] === 'int')) {
      const ifaceName = tokens[3];
      const ifc = device.interfaces.get(ifaceName) || Array.from(device.interfaces.values()).find(i => i.shortName?.toLowerCase() === ifaceName.toLowerCase());
      if (!ifc) return { output: `% Interface ${ifaceName} not found.` };

      return {
        output: [
          `DTP information for ${ifc.name}:`,
          `  TOS Metric:                       0`,
          `  TOS Version:                      1`,
          `  Administrative Mode:              ${ifc.dtpMode || (ifc.switchportMode === 'trunk' ? 'trunk' : 'dynamic-auto')}`,
          `  Operational Mode:                 ${ifc.switchportMode === 'trunk' ? 'trunk' : 'static-access'}`,
          `  Administrative Trunking Encapsulation: dot1q`,
          `  Operational Trunking Encapsulation: dot1q`,
          `  Negotiation of Trunking:          ${ifc.dtpNoNegotiate ? 'Disabled' : 'Enabled'}`
        ].join('\n')
      };
    }

    return {
      output: [
        'Global DTP information',
        '----------------------',
        'Sending DTP Hello packets every 30 seconds',
        'Dynamic Trunk timeout is 300 seconds',
        `Interfaces using DTP: ${Array.from(device.interfaces.values()).filter(i => !i.dtpNoNegotiate).length}`
      ].join('\n')
    };
  }
}

