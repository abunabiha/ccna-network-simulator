/**
 * PolicyEngine.ts
 * Mesin kalkulasi kebijakan perutean enterprise (Route-Map, IP Prefix-List, IP SLA, Object Tracking)
 * dan Policy-Based Routing (PBR) Cisco IOS-XE
 */

import { Device } from '../devices/Device';
import { Router } from '../devices/Router';
import { Switch } from '../devices/Switch';
import { Host } from '../devices/Host';
import { SubnetUtils } from './Subnet';
import { RouteMap, RouteMapClause, IpPrefixList, IpSlaConfig, TrackObject, RouteEntry } from '../../types/network';

export class PolicyEngine {
  /**
   * Evaluasi kecocokan subnet terhadap IP Prefix-List Cisco
   */
  static matchPrefixList(prefixList: IpPrefixList, network: string, cidr: number): boolean {
    const sortedEntries = [...prefixList.entries].sort((a, b) => a.seq - b.seq);

    for (const entry of sortedEntries) {
      const parts = entry.prefix.split('/');
      const baseIp = parts[0];
      const prefixLen = parseInt(parts[1], 10);
      const prefixMask = SubnetUtils.cidrToMask(prefixLen);

      // Cek apakah network candidate berada di dalam prefix base
      if (SubnetUtils.isIpInSubnet(network, baseIp, prefixMask)) {
        let lenMatched = true;

        if (entry.ge !== undefined && entry.le !== undefined) {
          lenMatched = cidr >= entry.ge && cidr <= entry.le;
        } else if (entry.ge !== undefined) {
          lenMatched = cidr >= entry.ge && cidr <= 32;
        } else if (entry.le !== undefined) {
          lenMatched = cidr >= prefixLen && cidr <= entry.le;
        } else {
          lenMatched = cidr === prefixLen;
        }

        if (lenMatched) {
          return entry.action === 'permit';
        }
      }
    }

    // Default implicit deny
    return false;
  }

  /**
   * Evaluasi Route-Map terhadap kandidat rute perutean
   */
  static evaluateRouteMap(
    routeMap: RouteMap,
    candidate: { network: string; mask: string; cidr: number; nextHop?: string; metric?: number; tag?: number },
    device: Router | Switch
  ): {
    permitted: boolean;
    setMetric?: number;
    setMetricType?: 'type-1' | 'type-2';
    setTag?: number;
    setIpNextHop?: string;
    setIpNextHopTrack?: { nextHop: string; trackId: number };
  } {
    const sortedClauses = [...routeMap.clauses].sort((a, b) => a.sequence - b.sequence);

    for (const clause of sortedClauses) {
      let matches = true;

      // 1. match ip address prefix-list
      if (clause.matchPrefixList) {
        const pl = device.prefixLists.get(clause.matchPrefixList);
        if (!pl || !this.matchPrefixList(pl, candidate.network, candidate.cidr)) {
          matches = false;
        }
      }

      // 2. match ip address (ACL)
      if (matches && clause.matchAcl !== undefined) {
        let aclMatched = false;
        if (device instanceof Router || device instanceof Switch) {
          const target = device as Router | Switch;
          let rules: any[] = [];
          if (typeof clause.matchAcl === 'number') {
            rules = target.accessLists.get(clause.matchAcl) || [];
          } else {
            const numAcl = parseInt(String(clause.matchAcl), 10);
            if (!isNaN(numAcl)) {
              rules = target.accessLists.get(numAcl) || [];
            } else if (target.namedAccessLists && target.namedAccessLists.has(String(clause.matchAcl))) {
              rules = target.namedAccessLists.get(String(clause.matchAcl))!.rules;
            }
          }
          for (const r of rules) {
            if (r.sourceIp === 'any') {
              aclMatched = r.action === 'permit';
              break;
            }
            const wildcard = r.sourceWildcard || '0.0.0.0';
            const mask = SubnetUtils.wildcardToMask(wildcard);
            if (SubnetUtils.isIpInSubnet(candidate.network, r.sourceIp, mask)) {
              aclMatched = r.action === 'permit';
              break;
            }
          }
        }
        if (!aclMatched) {
          matches = false;
        }
      }

      // 3. match tag
      if (matches && clause.matchTag !== undefined) {
        if (candidate.tag !== clause.matchTag) {
          matches = false;
        }
      }

      if (matches) {
        if (clause.action === 'permit') {
          return {
            permitted: true,
            setMetric: clause.setMetric,
            setMetricType: clause.setMetricType,
            setTag: clause.setTag,
            setIpNextHop: clause.setIpNextHop,
            setIpNextHopTrack: clause.setIpNextHopTrack
          };
        } else {
          return { permitted: false };
        }
      }
    }

    // Default implicit deny
    return { permitted: false };
  }

  /**
   * Sinkronisasi status IP SLA dan Object Tracking di seluruh perangkat
   */
  static evaluateIpSla(allDevices: Device[]): void {
    const l3Nodes = allDevices.filter(d => d instanceof Router || (d instanceof Switch && d.isLayer3)) as (Router | Switch)[];

    for (const node of l3Nodes) {
      for (const sla of node.ipSlas.values()) {
        let reachable = false;

        // 1. Cek apakah ada target di jaringan dengan IP tersebut yang aktif (atau cloud bridge)
        let targetExistsAndUp = false;
        for (const peer of allDevices) {
          if (peer.id === node.id) continue;
          if (peer.deviceType === 'cloud') {
            targetExistsAndUp = true;
            break;
          }
          if (peer instanceof Host && peer.ipAddress === sla.targetIp) {
            targetExistsAndUp = true;
            break;
          }
          for (const pIf of peer.interfaces.values()) {
            if (!pIf.isShutdown && pIf.status === 'up' && pIf.ipAddress === sla.targetIp) {
              targetExistsAndUp = true;
              break;
            }
          }
          if (targetExistsAndUp) break;
        }

        if (targetExistsAndUp) {
          // 2. Cek apakah node memiliki jalur keluar aktif menuju target IP
          // A. Terhubung langsung di interface lokal
          for (const ifc of node.interfaces.values()) {
            if (!ifc.isShutdown && ifc.status === 'up' && ifc.ipAddress && ifc.subnetMask) {
              if (SubnetUtils.isSameSubnet(ifc.ipAddress, sla.targetIp, ifc.subnetMask)) {
                reachable = true;
                break;
              }
            }
          }

          // B. Rute melalui routing table
          if (!reachable) {
            const r = node.lookupRoute(sla.targetIp);
            if (r) {
              let exitIf = r.exitInterface ? node.interfaces.get(r.exitInterface) : undefined;
              if (!exitIf && r.nextHop) {
                for (const ifc of node.interfaces.values()) {
                  if (!ifc.isShutdown && ifc.status === 'up' && ifc.ipAddress && ifc.subnetMask) {
                    if (SubnetUtils.isSameSubnet(ifc.ipAddress, r.nextHop, ifc.subnetMask)) {
                      exitIf = ifc;
                      break;
                    }
                  }
                }
              }
              if (exitIf && !exitIf.isShutdown && exitIf.status === 'up') {
                reachable = true;
              }
            }
          }
        }

        if (reachable) {
          sla.state = 'OK';
          sla.rtt = 2;
        } else {
          sla.state = 'Timeout';
          sla.rtt = undefined;
        }

        // Update track objects yang terikat pada SLA ini
        for (const trk of node.trackObjects.values()) {
          if (trk.slaId === sla.id) {
            trk.state = reachable ? 'UP' : 'DOWN';
          }
        }
      }
    }
  }

  /**
   * Format show route-map
   */
  static renderShowRouteMap(node: Device, mapName?: string): string {
    const dev = node as (Router | Switch);
    if (!dev.routeMaps || dev.routeMaps.size === 0) {
      return '% No route-maps configured';
    }

    const lines: string[] = [];
    const maps = mapName ? (dev.routeMaps.has(mapName) ? [dev.routeMaps.get(mapName)!] : []) : Array.from(dev.routeMaps.values());

    if (maps.length === 0) {
      return `% Route-map ${mapName} not found`;
    }

    for (const rm of maps) {
      for (const c of rm.clauses) {
        lines.push(`route-map ${rm.name}, ${c.action}, sequence ${c.sequence}`);
        lines.push('  Match clauses:');
        if (c.matchAcl) lines.push(`    ip address (access-lists): ${c.matchAcl}`);
        if (c.matchPrefixList) lines.push(`    ip address prefix-list ${c.matchPrefixList}`);
        if (c.matchTag !== undefined) lines.push(`    tag ${c.matchTag}`);
        if (c.matchInterface) lines.push(`    interface ${c.matchInterface}`);
        if (!c.matchAcl && !c.matchPrefixList && c.matchTag === undefined && !c.matchInterface) {
          lines.push('    (none)');
        }
        lines.push('  Set clauses:');
        if (c.setMetric !== undefined) lines.push(`    metric ${c.setMetric}`);
        if (c.setMetricType) lines.push(`    metric-type ${c.setMetricType}`);
        if (c.setTag !== undefined) lines.push(`    tag ${c.setTag}`);
        if (c.setIpNextHop) lines.push(`    ip next-hop ${c.setIpNextHop}`);
        if (c.setIpNextHopTrack) lines.push(`    ip next-hop verify-availability ${c.setIpNextHopTrack.nextHop} 1 track ${c.setIpNextHopTrack.trackId}`);
        if (c.setMetric === undefined && !c.setMetricType && c.setTag === undefined && !c.setIpNextHop && !c.setIpNextHopTrack) {
          lines.push('    (none)');
        }
        lines.push('  Policy routing matches: 0 packets, 0 bytes');
      }
    }

    return lines.join('\n');
  }

  /**
   * Format show ip prefix-list
   */
  static renderShowIpPrefixList(node: Device, listName?: string, detail: boolean = false): string {
    const dev = node as (Router | Switch);
    if (!dev.prefixLists || dev.prefixLists.size === 0) {
      return '% No prefix-lists configured';
    }

    const lines: string[] = [];
    const lists = listName ? (dev.prefixLists.has(listName) ? [dev.prefixLists.get(listName)!] : []) : Array.from(dev.prefixLists.values());

    if (lists.length === 0) {
      return `% Prefix-list ${listName} not found`;
    }

    for (const pl of lists) {
      lines.push(`ip prefix-list ${pl.name}: ${pl.entries.length} entries`);
      for (const e of pl.entries) {
        let desc = `   seq ${e.seq} ${e.action} ${e.prefix}`;
        if (e.ge !== undefined) desc += ` ge ${e.ge}`;
        if (e.le !== undefined) desc += ` le ${e.le}`;
        if (detail) desc += ` (hit count: 0, refcount: 1)`;
        lines.push(desc);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format show ip sla summary & statistics
   */
  static renderShowIpSla(node: Device, slaId?: number): string {
    const dev = node as (Router | Switch);
    if (!dev.ipSlas || dev.ipSlas.size === 0) {
      return '% No IP SLAs configured';
    }

    const slas = slaId ? (dev.ipSlas.has(slaId) ? [dev.ipSlas.get(slaId)!] : []) : Array.from(dev.ipSlas.values());
    if (slas.length === 0) {
      return `% IP SLA ${slaId} not found`;
    }

    const lines: string[] = [
      'IP SLAs Latest Operation Statistics',
      '==================================='
    ];

    for (const s of slas) {
      lines.push(`IPSLA operation id: ${s.id}`);
      lines.push(`    Type of operation: ${s.type}`);
      lines.push(`    Target IP: ${s.targetIp}`);
      lines.push(`    Latest RTT: ${s.rtt !== undefined ? `${s.rtt} milliseconds` : 'Timeout'}`);
      lines.push(`    Latest operation start time: 00:04:15`);
      lines.push(`    Latest operation return code: ${s.state}`);
      lines.push(`    Number of successes: ${s.state === 'OK' ? 12 : 0}`);
      lines.push(`    Number of failures: ${s.state === 'OK' ? 0 : 12}`);
      lines.push(`    Operation time to live: Forever`);
      lines.push('');
    }

    return lines.join('\n').trim();
  }

  /**
   * Format show track
   */
  static renderShowTrack(node: Device, trackId?: number): string {
    const dev = node as (Router | Switch);
    if (!dev.trackObjects || dev.trackObjects.size === 0) {
      return '% No tracking objects configured';
    }

    const tracks = trackId ? (dev.trackObjects.has(trackId) ? [dev.trackObjects.get(trackId)!] : []) : Array.from(dev.trackObjects.values());
    if (tracks.length === 0) {
      return `% Track ${trackId} not found`;
    }

    const lines: string[] = [];
    for (const t of tracks) {
      lines.push(`Track ${t.id}`);
      lines.push(`  IP SLA ${t.slaId} state`);
      lines.push(`  State is ${t.state}`);
      lines.push(`    1 change, last change 00:04:15`);
      lines.push(`  Latest operation return code: ${t.state === 'UP' ? 'OK' : 'Timeout'}`);
      lines.push(`  Latest RTT (millisecs) ${t.state === 'UP' ? 2 : 0}`);
      lines.push('  Tracked by:');
      lines.push('    Route-Map Policy Routing');
    }

    return lines.join('\n');
  }
}
