import { Router } from '../devices/Router';
import { EemApplet, EemAction, EemHistoryEntry, MdtSubscription, NetconfSession } from '../../types/network';

export interface RestconfResponse {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
}

export class TelemetryAutomationEngine {
  /**
   * Processes a RESTCONF request according to RFC 8040.
   */
  static queryRestconf(
    router: Router,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: any
  ): RestconfResponse {
    if (!router.restconfEnabled) {
      return {
        statusCode: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/yang-data+json' },
        body: {
          'ietf-restconf:errors': {
            error: [
              {
                'error-type': 'application',
                'error-tag': 'operation-failed',
                'error-message': 'RESTCONF server is not enabled on this device'
              }
            ]
          }
        }
      };
    }

    // Normalize path
    const cleanPath = path.trim().replace(/\/+$/, '');

    // Root metadata
    if (cleanPath === '/restconf' || cleanPath === '/restconf/') {
      return {
        statusCode: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/yang-data+json' },
        body: {
          'ietf-restconf:restconf': {
            data: {},
            operations: {},
            'yang-library-version': '2019-01-04'
          }
        }
      };
    }

    // 1. GET /restconf/data/Cisco-IOS-XE-native:native
    if (cleanPath === '/restconf/data/Cisco-IOS-XE-native:native' || cleanPath === '/restconf/data/native') {
      if (method === 'GET') {
        return {
          statusCode: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/yang-data+json' },
          body: {
            'Cisco-IOS-XE-native:native': {
              version: router.osVersion,
              model: router.model,
              hostname: router.hostname,
              'ip': {
                'routing': true
              }
            }
          }
        };
      }
      if (method === 'PATCH' || method === 'PUT') {
        const nativeData = body?.['Cisco-IOS-XE-native:native'] || body?.native || body;
        if (nativeData?.hostname) {
          router.hostname = nativeData.hostname;
        }
        return {
          statusCode: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/yang-data+json' },
          body: { message: 'Native configuration updated successfully' }
        };
      }
    }

    // 2. /restconf/data/ietf-interfaces:interfaces
    if (cleanPath === '/restconf/data/ietf-interfaces:interfaces' || cleanPath === '/restconf/data/interfaces') {
      if (method === 'GET') {
        const ifaceList = Array.from(router.interfaces.values()).map(intf => ({
          name: intf.name,
          description: intf.description || '',
          type: 'iana-if-type:ethernetCsmacd',
          enabled: !intf.isShutdown,
          'ietf-ip:ipv4': intf.ipAddress
            ? {
                address: [
                  {
                    ip: intf.ipAddress,
                    netmask: intf.subnetMask
                  }
                ]
              }
            : undefined
        }));

        return {
          statusCode: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/yang-data+json' },
          body: {
            'ietf-interfaces:interfaces': {
              interface: ifaceList
            }
          }
        };
      }
    }

    // 3. /restconf/data/ietf-interfaces:interfaces/interface=<name>
    const ifaceMatch = cleanPath.match(/^\/restconf\/data\/ietf-interfaces:interfaces\/interface=([^\/]+)$/);
    if (ifaceMatch) {
      const ifName = decodeURIComponent(ifaceMatch[1]);
      const intf = router.interfaces.get(ifName);
      if (!intf) {
        return {
          statusCode: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'application/yang-data+json' },
          body: {
            'ietf-restconf:errors': {
              error: [
                {
                  'error-type': 'application',
                  'error-tag': 'data-missing',
                  'error-message': `Interface ${ifName} not found`
                }
              ]
            }
          }
        };
      }

      if (method === 'GET') {
        return {
          statusCode: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/yang-data+json' },
          body: {
            'ietf-interfaces:interface': {
              name: intf.name,
              description: intf.description || '',
              type: 'iana-if-type:ethernetCsmacd',
              enabled: !intf.isShutdown,
              'ietf-ip:ipv4': intf.ipAddress
                ? {
                    address: [
                      {
                        ip: intf.ipAddress,
                        netmask: intf.subnetMask
                      }
                    ]
                  }
                : undefined
            }
          }
        };
      }

      if (method === 'PATCH' || method === 'PUT') {
        const ifData = body?.['ietf-interfaces:interface'] || body?.interface || body;
        if (ifData) {
          if (typeof ifData.enabled === 'boolean') {
            intf.isShutdown = !ifData.enabled;
            intf.status = intf.isShutdown ? 'down' : 'up';
          }
          if (ifData.description !== undefined) {
            intf.description = ifData.description;
          }
          if (ifData['ietf-ip:ipv4']?.address?.[0]) {
            const addr = ifData['ietf-ip:ipv4'].address[0];
            intf.ipAddress = addr.ip;
            intf.subnetMask = addr.netmask;
          }
        }
        return {
          statusCode: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/yang-data+json' },
          body: { message: `Interface ${ifName} updated successfully` }
        };
      }

      if (method === 'DELETE') {
        // Clear IP and reset description
        intf.ipAddress = undefined;
        intf.subnetMask = undefined;
        intf.description = undefined;
        return {
          statusCode: 204,
          statusText: 'No Content',
          headers: {},
          body: null
        };
      }
    }

    // 4. /restconf/data/ietf-interfaces:interfaces-state
    if (cleanPath === '/restconf/data/ietf-interfaces:interfaces-state' || cleanPath === '/restconf/data/interfaces-state') {
      if (method === 'GET') {
        const stateList = Array.from(router.interfaces.values()).map(intf => ({
          name: intf.name,
          type: 'iana-if-type:ethernetCsmacd',
          'admin-status': intf.isShutdown ? 'down' : 'up',
          'oper-status': intf.status === 'up' ? 'up' : 'down',
          speed: intf.speed || '1000000000',
          statistics: {
            'discontinuity-time': '2026-01-01T00:00:00Z',
            'in-octets': Math.floor(Math.random() * 500000 + 100000),
            'in-unicast-pkts': Math.floor(Math.random() * 5000 + 1000),
            'out-octets': Math.floor(Math.random() * 450000 + 90000),
            'out-unicast-pkts': Math.floor(Math.random() * 4500 + 900)
          }
        }));

        return {
          statusCode: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/yang-data+json' },
          body: {
            'ietf-interfaces:interfaces-state': {
              interface: stateList
            }
          }
        };
      }
    }

    // 5. /restconf/data/Cisco-IOS-XE-native:native/ip/route
    if (cleanPath === '/restconf/data/Cisco-IOS-XE-native:native/ip/route') {
      if (method === 'GET') {
        const routes = router.routingTable.map(r => ({
          network: r.network,
          mask: r.mask,
          nextHop: r.nextHop,
          exitInterface: r.exitInterface,
          protocol: r.protocol,
          metric: r.metric,
          tag: r.tag
        }));
        return {
          statusCode: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/yang-data+json' },
          body: {
            'Cisco-IOS-XE-native:route': routes
          }
        };
      }
    }

    return {
      statusCode: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'application/yang-data+json' },
      body: {
        'ietf-restconf:errors': {
          error: [
            {
              'error-type': 'application',
              'error-tag': 'invalid-value',
              'error-message': `Resource ${cleanPath} does not exist`
            }
          ]
        }
      }
    };
  }

  /**
   * Executes a NETCONF XML RPC command according to RFC 6241.
   */
  static executeNetconfRpc(router: Router, rpcXml: string): string {
    if (!router.netconfEnabled) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<rpc-reply xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <rpc-error>
    <error-type>application</error-type>
    <error-tag>operation-failed</error-tag>
    <error-severity>error</error-severity>
    <error-message>NETCONF-YANG agent is not running on device</error-message>
  </rpc-error>
</rpc-reply>`;
    }

    // Extract message-id
    const msgIdMatch = rpcXml.match(/message-id=["']([^"']+)["']/);
    const messageId = msgIdMatch ? msgIdMatch[1] : '101';

    // Ensure session exists
    if (router.netconfSessions.length === 0) {
      router.netconfSessions.push({
        sessionId: 42,
        username: 'admin',
        clientIp: '127.0.0.1',
        protocol: 'ssh',
        loginTime: new Date().toISOString()
      });
    }

    // 1. <close-session>
    if (rpcXml.includes('<close-session')) {
      router.netconfSessions = [];
      return `<?xml version="1.0" encoding="UTF-8"?>
<rpc-reply message-id="${messageId}" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <ok/>
</rpc-reply>`;
    }

    // 2. <get-config>
    if (rpcXml.includes('<get-config>')) {
      const ifaceXml = Array.from(router.interfaces.values()).map(intf => `      <interface>
        <name>${intf.name}</name>
        <description>${intf.description || ''}</description>
        <type>iana-if-type:ethernetCsmacd</type>
        <enabled>${!intf.isShutdown}</enabled>
        ${intf.ipAddress ? `<ipv4 xmlns="urn:ietf:params:xml:ns:yang:ietf-ip"><address><ip>${intf.ipAddress}</ip><netmask>${intf.subnetMask}</netmask></address></ipv4>` : ''}
      </interface>`).join('\n');

      return `<?xml version="1.0" encoding="UTF-8"?>
<rpc-reply message-id="${messageId}" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <data>
    <native xmlns="http://cisco.com/ns/yang/Cisco-IOS-XE-native">
      <version>${router.osVersion}</version>
      <hostname>${router.hostname}</hostname>
    </native>
    <interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">
${ifaceXml}
    </interfaces>
  </data>
</rpc-reply>`;
    }

    // 3. <get>
    if (rpcXml.includes('<get>')) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<rpc-reply message-id="${messageId}" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <data>
    <native xmlns="http://cisco.com/ns/yang/Cisco-IOS-XE-native">
      <hostname>${router.hostname}</hostname>
      <model>${router.model}</model>
      <version>${router.osVersion}</version>
    </native>
  </data>
</rpc-reply>`;
    }

    // 4. <edit-config>
    if (rpcXml.includes('<edit-config>')) {
      // Check for hostname change
      const hostMatch = rpcXml.match(/<hostname>([^<]+)<\/hostname>/);
      if (hostMatch) {
        router.hostname = hostMatch[1].trim();
      }

      // Check for interface shutdown/no shutdown
      const ifMatch = rpcXml.match(/<name>([^<]+)<\/name>[\s\S]*?<shutdown\s*\/>/);
      if (ifMatch) {
        const intf = router.interfaces.get(ifMatch[1].trim());
        if (intf) {
          intf.isShutdown = true;
          intf.status = 'down';
        }
      }

      return `<?xml version="1.0" encoding="UTF-8"?>
<rpc-reply message-id="${messageId}" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <ok/>
</rpc-reply>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<rpc-reply message-id="${messageId}" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <ok/>
</rpc-reply>`;
  }

  /**
   * Intercepts and tests CLI commands against configured EEM applets.
   */
  static triggerEemCliEvent(
    router: Router,
    cliCommand: string,
    executeCliCallback?: (cmd: string) => string
  ): { intercepted: boolean; suppressCli: boolean; output: string[] } {
    let intercepted = false;
    let suppressCli = false;
    const output: string[] = [];

    const trimmedCmd = cliCommand.trim();

    for (const applet of router.eemApplets.values()) {
      if (!applet.event || applet.event.type !== 'cli' || !applet.event.pattern) continue;

      let matched = false;
      try {
        const regex = new RegExp(applet.event.pattern);
        matched = regex.test(trimmedCmd);
      } catch {
        matched = trimmedCmd.includes(applet.event.pattern);
      }

      if (matched) {
        intercepted = true;
        if (applet.event.sync) {
          suppressCli = true;
        }

        const actionsExecuted: string[] = [];

        // Sort actions by label (e.g., "1.0", "2.0")
        const sortedActions = [...applet.actions].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

        for (const act of sortedActions) {
          actionsExecuted.push(`${act.label} ${act.type}`);
          const arg = act.argument || (act.type === 'syslog' ? act.message : act.command) || '';
          if (act.type === 'syslog') {
            const logMsg = `%HA_EM-6-LOG: ${applet.name}: ${arg}`;
            output.push(logMsg);
          } else if (act.type === 'cli') {
            if (executeCliCallback) {
              const res = executeCliCallback(arg);
              if (res) output.push(res);
            }
          }
        }

        // Record event in history
        const historyEntry: EemHistoryEntry = {
          appletName: applet.name,
          eventType: 'cli',
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          triggeredBy: trimmedCmd,
          actionsRun: actionsExecuted
        };
        router.eemHistory.unshift(historyEntry);
        if (router.eemHistory.length > 20) {
          router.eemHistory.pop();
        }
      }
    }

    return { intercepted, suppressCli, output };
  }

  /**
   * Generates a streaming telemetry snapshot according to MDT subscription settings.
   */
  static generateTelemetrySnapshot(router: Router, subId: number): any {
    const sub = router.mdtSubscriptions.get(subId);
    if (!sub) return null;

    let payload: any = {};

    if (sub.filterXpath.includes('interfaces-state') || sub.filterXpath.includes('interfaces')) {
      const ifStats = Array.from(router.interfaces.values()).map(intf => ({
        name: intf.name,
        operStatus: intf.status,
        adminStatus: intf.isShutdown ? 'down' : 'up',
        inOctets: Math.floor(Math.random() * 500000 + 100000),
        outOctets: Math.floor(Math.random() * 450000 + 90000),
        inErrors: 0,
        outErrors: 0
      }));
      payload = { interfaces: ifStats };
    } else if (sub.filterXpath.includes('native')) {
      payload = {
        hostname: router.hostname,
        version: router.osVersion,
        cpuUtilizationPercent: 12,
        memoryUsedBytes: 104857600
      };
    } else {
      payload = {
        xpath: sub.filterXpath,
        data: 'telemetry-stream-active'
      };
    }

    if (sub.encoding === 'encode-xml') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<notification xmlns="urn:ietf:params:xml:ns:netconf:notification:1.0">
  <eventTime>${new Date().toISOString()}</eventTime>
  <push-update xmlns="urn:ietf:params:xml:ns:yang:ietf-yang-push">
    <subscription-id>${sub.id}</subscription-id>
    <datastore-contents>
      <data path="${sub.filterXpath}">${JSON.stringify(payload)}</data>
    </datastore-contents>
  </push-update>
</notification>`;
    }

    // Default: encode-kvgpb (Key-Value Google Protocol Buffer simulated in JSON structure)
    return {
      nodeIdStr: router.hostname,
      subscriptionIdStr: sub.id.toString(),
      encoding: 'encode-kvgpb',
      path: sub.filterXpath,
      msgTimestamp: Date.now(),
      dataGpbkv: [
        {
          timestamp: Date.now(),
          fields: Object.entries(payload).map(([k, v]) => ({
            name: k,
            valString: typeof v === 'object' ? JSON.stringify(v) : String(v)
          }))
        }
      ]
    };
  }

  /**
   * Diagnostic Renderers for CLI show commands.
   */
  static renderShowRestconfStatus(router: Router): string {
    const lines = [
      'RESTCONF Protocol Status:',
      `  State               : ${router.restconfEnabled ? 'Enabled' : 'Disabled'}`,
      '  Protocol Version    : RFC 8040 (YANG 1.1)',
      '  Transport           : HTTPS / TLS 1.3',
      '  HTTP Port           : 443',
      '  Root URL            : /restconf',
      '  Data Root           : /restconf/data',
      '  Operations Root     : /restconf/operations',
      '  YANG Models Loaded  : 4',
      '    - Cisco-IOS-XE-native (2023-11-01)',
      '    - ietf-interfaces (2018-02-20)',
      '    - ietf-ip (2018-02-22)',
      '    - ietf-yang-library (2019-01-04)'
    ];
    return lines.join('\n');
  }

  static renderShowNetconfYangStatus(router: Router): string {
    const lines = [
      'NETCONF-YANG Protocol Status:',
      `  State               : ${router.netconfEnabled ? 'Enabled' : 'Disabled'}`,
      '  Protocol Version    : RFC 6241 (NETCONF 1.1)',
      '  Transport           : SSHv2',
      '  SSH Port            : 830',
      `  Active Sessions     : ${router.netconfSessions.length}`,
      '  Candidate Datastore : Not supported',
      '  Running Datastore   : Supported (Direct writable)'
    ];
    return lines.join('\n');
  }

  static renderShowNetconfYangSessions(router: Router): string {
    if (router.netconfSessions.length === 0) {
      return 'No active NETCONF-YANG sessions';
    }

    const lines = [
      'Session ID  User      Client IP        Protocol  Login Time',
      '----------  --------  ---------------  --------  -------------------------'
    ];
    for (const sess of router.netconfSessions) {
      lines.push(
        `${sess.sessionId.toString().padEnd(12)}${sess.username.padEnd(10)}${sess.clientIp.padEnd(17)}${sess.protocol.padEnd(10)}${sess.loginTime}`
      );
    }
    return lines.join('\n');
  }

  static renderShowEemRegistered(router: Router): string {
    if (router.eemApplets.size === 0) {
      return 'No EEM applets registered';
    }

    const lines = ['Registered EEM Policies:', '-------------------------'];
    for (const applet of router.eemApplets.values()) {
      lines.push(`Applet Name: ${applet.name}`);
      if (applet.event) {
        if (applet.event.type === 'cli') {
          lines.push(`  Event Type : CLI pattern "${applet.event.pattern}" (sync: ${applet.event.sync ? 'yes' : 'no'})`);
        } else if (applet.event.type === 'syslog') {
          lines.push(`  Event Type : Syslog pattern "${applet.event.pattern}"`);
        } else if (applet.event.type === 'timer') {
          lines.push(`  Event Type : Timer watchdog (${applet.event.timeSec}s)`);
        }
      } else {
        lines.push('  Event Type : None');
      }

      lines.push('  Actions    :');
      if (applet.actions.length === 0) {
        lines.push('    (none)');
      } else {
        const sorted = [...applet.actions].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
        for (const act of sorted) {
          lines.push(`    ${act.label} ${act.type} ${act.type === 'syslog' ? 'msg' : 'command'} "${act.argument || act.message || act.command || ''}"`);
        }
      }
      lines.push('');
    }
    return lines.join('\n').trim();
  }

  static renderShowEemHistory(router: Router): string {
    if (router.eemHistory.length === 0) {
      return 'No EEM history events recorded';
    }

    const lines = [
      'Time      Applet Name         Type  Triggered By          Actions Run',
      '--------  ------------------  ----  --------------------  --------------------'
    ];

    for (const h of router.eemHistory) {
      const timeStr = h.timestamp.padEnd(10);
      const nameStr = h.appletName.padEnd(20);
      const typeStr = h.eventType.padEnd(6);
      const trigStr = (h.triggeredBy.length > 20 ? h.triggeredBy.slice(0, 17) + '...' : h.triggeredBy).padEnd(22);
      const actStr = h.actionsRun.join(', ');
      lines.push(`${timeStr}${nameStr}${typeStr}${trigStr}${actStr}`);
    }
    return lines.join('\n');
  }

  static renderShowMdtSubscriptions(router: Router, subId?: number): string {
    if (router.mdtSubscriptions.size === 0) {
      return 'No telemetry subscriptions configured';
    }

    if (subId !== undefined) {
      const sub = router.mdtSubscriptions.get(subId);
      if (!sub) return `Telemetry subscription ${subId} not found`;

      const lines = [
        `Telemetry Subscription: ${sub.id}`,
        `  Filter XPath       : ${sub.filterXpath}`,
        `  Stream             : ${sub.stream}`,
        `  Encoding           : ${sub.encoding}`,
        `  Source Address     : ${sub.sourceAddress || '0.0.0.0'}`,
        `  Update Policy      : ${sub.updatePolicy.type === 'periodic' ? `Periodic (${sub.updatePolicy.periodCentiseconds} centiseconds)` : 'On-Change'}`,
        '  Receivers          :'
      ];
      if (sub.receivers.length === 0) {
        lines.push('    (none)');
      } else {
        for (const rx of sub.receivers) {
          lines.push(`    - Address: ${rx.address}:${rx.port} [${rx.protocol.toUpperCase()}]`);
        }
      }
      return lines.join('\n');
    }

    const lines = [
      'Sub ID  State   Type      Filter XPath                             Encoding      Stream',
      '------  ------  --------  ---------------------------------------  ------------  ------------'
    ];

    for (const sub of router.mdtSubscriptions.values()) {
      const idStr = sub.id.toString().padEnd(8);
      const stateStr = 'Active'.padEnd(8);
      const typeStr = (sub.updatePolicy.type === 'periodic' ? `${sub.updatePolicy.periodCentiseconds}cs` : 'on-change').padEnd(10);
      const xpathStr = (sub.filterXpath.length > 39 ? sub.filterXpath.slice(0, 36) + '...' : sub.filterXpath).padEnd(41);
      const encStr = sub.encoding.padEnd(14);
      const streamStr = sub.stream;
      lines.push(`${idStr}${stateStr}${typeStr}${xpathStr}${encStr}${streamStr}`);
    }
    return lines.join('\n');
  }

  static renderShowTelemetryConnection(router: Router): string {
    const rxList: { id: number; address: string; port: number; protocol: string }[] = [];
    for (const sub of router.mdtSubscriptions.values()) {
      for (const rx of sub.receivers) {
        rxList.push({ id: sub.id, address: rx.address, port: rx.port, protocol: rx.protocol });
      }
    }

    if (rxList.length === 0) {
      return 'No active telemetry receiver connections';
    }

    const lines = [
      'Sub ID  Peer Address     Port   Protocol  State       Sent Packets',
      '------  ---------------  -----  --------  ----------  ------------'
    ];

    for (const r of rxList) {
      lines.push(
        `${r.id.toString().padEnd(8)}${r.address.padEnd(17)}${r.port.toString().padEnd(7)}${r.protocol.toUpperCase().padEnd(10)}${'CONNECTED'.padEnd(12)}42`
      );
    }
    return lines.join('\n');
  }
}
