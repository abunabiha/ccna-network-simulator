export type CliMode = 
  | 'user-exec'          // Router>
  | 'priv-exec'          // Router#
  | 'global-config'      // Router(config)#
  | 'interface-config'   // Router(config-if)#
  | 'subinterface-config'// Router(config-subif)#
  | 'vlan-config'        // Switch(config-vlan)#
  | 'router-config'      // Router(config-router)#
  | 'line-config'        // Router(config-line)#
  | 'dhcp-config';       // Router(dhcp-config)#

export interface CliContext {
  deviceId: string;
  mode: CliMode;
  targetInterface?: string;
  targetVlan?: number;
  targetRoutingProcess?: string;
  targetLine?: string;
  targetDhcpPool?: string;
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
