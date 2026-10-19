export type CliMode = 
  | 'user-exec'          // Router>
  | 'priv-exec'          // Router#
  | 'global-config'      // Router(config)#
  | 'interface-config'   // Router(config-if)#
  | 'subinterface-config'// Router(config-subif)#
  | 'vlan-config'        // Switch(config-vlan)#
  | 'router-config'      // Router(config-router)#
  | 'line-config'        // Router(config-line)#
  | 'dhcp-config'        // Router(dhcp-config)#
  | 'route-map-config'   // Router(config-route-map)#
  | 'ip-sla-config'      // Router(config-sla-echo)#
  | 'vrf-config'         // Router(config-vrf)#
  | 'vrf-af-config'      // Router(config-vrf-af)#
  | 'crypto-isakmp-policy' // Router(config-isakmp)#
  | 'crypto-ipsec-profile' // Router(config-ipsec-profile)#
  | 'zone-pair-config'   // Router(config-sec-zone-pair)#
  | 'class-map-inspect'  // Router(config-cmap)#
  | 'policy-map-inspect' // Router(config-pmap)#
  | 'policy-map-class-inspect' // Router(config-pmap-c)#
  | 'control-plane-config'; // Router(config-cp)#

export interface CliContext {
  deviceId: string;
  mode: CliMode;
  targetInterface?: string;
  targetVlan?: number;
  targetRoutingProcess?: string;
  targetRoutingProtocol?: 'ospf' | 'eigrp' | 'bgp';
  targetAsNumber?: number;
  targetProcessId?: number;
  targetLine?: string;
  targetDhcpPool?: string;
  targetRouteMapName?: string;
  targetRouteMapSeq?: number;
  targetIpSlaId?: number;
  targetVrfName?: string;
  targetVrfAf?: string;
  targetIsakmpPriority?: number;
  targetIpsecProfileName?: string;
  targetZonePairName?: string;
  targetClassMapName?: string;
  targetPolicyMapName?: string;
  targetPolicyMapClass?: string;
}

export interface CommandHelpItem {
  command: string;
  description: string;
}

export interface CliExecutionResult {
  output: string;
  newMode?: CliMode;
  contextUpdates?: Partial<CliContext>;
  error?: boolean;
}

export interface CommandDefinition {
  keyword: string;
  modes: CliMode[];
  description: string;
  subcommands?: CommandDefinition[];
  handler?: (args: string[], context: CliContext, device: any) => CliExecutionResult;
}
