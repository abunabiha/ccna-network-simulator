/**
 * RoutingProtocolEngine.ts
 * Mesin kalkulasi dan konvergensi protokol routing Cisco CCNP Enterprise v9:
 * 1. OSPF Multi-Area & ABR (Intra-Area 'O', Inter-Area 'O IA')
 * 2. EIGRP (Composite Metric, Autonomous System adjacency, Route code 'D', AD 90)
 * 3. BGP (eBGP AD 20 & iBGP AD 200, Peering adjacency, Route code 'B')
 */

import { Device } from '../devices/Device';
import { Router } from '../devices/Router';
import { Switch } from '../devices/Switch';
import { SubnetUtils } from './Subnet';
import { RouteEntry } from '../../types/network';

export class RoutingProtocolEngine {
  /**
   * Menghitung dan menyebarkan rute dinamis (OSPF, EIGRP, BGP) ke seluruh perangkat L3
   */
  static convergeRoutingProtocols(allDevices: Device[]): void {
    const l3Nodes = allDevices.filter(d => d instanceof Router || (d instanceof Switch && d.isLayer3 && d.ipRouting)) as (Router | Switch)[];

    // Bersihkan rute dinamis lama (O, O IA, D, D EX, B) sebelum kalkulasi ulang
    for (const node of l3Nodes) {
      node.routingTable = node.routingTable.filter(r => r.protocol !== 'O' && r.protocol !== 'O IA' && r.protocol !== 'D' && r.protocol !== 'D EX' && r.protocol !== 'B');
    }

    this.convergeOspf(l3Nodes, allDevices);
    this.convergeEigrp(l3Nodes, allDevices);
    this.convergeBgp(l3Nodes, allDevices);
  }

  // ===================== OSPF MULTI-AREA CONVERGENCE =====================
  private static convergeOspf(l3Nodes: (Router | Switch)[], allDevices: Device[]): void {
    const ospfNodes = l3Nodes.filter(n => (n as any).ospfConfig && (n as any).ospfConfig.enabled);

    // 1. Kumpulkan semua network per area dari seluruh node OSPF
    const networksByArea = new Map<number, Array<{ network: string; wildcard: string; mask: string; cidr: number }>>();
    for (const node of ospfNodes) {
      const cfg = (node as any).ospfConfig!;
      for (const netRule of cfg.networks) {
        const mask = SubnetUtils.wildcardToMask(netRule.wildcard);
        const cidr = SubnetUtils.maskToCidr(mask);
        if (!networksByArea.has(netRule.area)) {
          networksByArea.set(netRule.area, []);
        }
        const list = networksByArea.get(netRule.area)!;
        if (!list.some(n => n.network === netRule.network && n.mask === mask)) {
          list.push({ network: netRule.network, wildcard: netRule.wildcard, mask, cidr });
        }
      }
    }

    // 2. Intra-Area Convergence: Pasang rute intra-area ('O') antar tetangga dalam area yang sama
    for (const srcNode of ospfNodes) {
      const srcConfig = (srcNode as any).ospfConfig!;

      for (const dstNode of ospfNodes) {
        if (srcNode.id === dstNode.id) continue;
        const dstConfig = (dstNode as any).ospfConfig!;

        for (const srcIf of srcNode.interfaces.values()) {
          if (srcIf.isShutdown || srcIf.status !== 'up' || !srcIf.ipAddress || !srcIf.subnetMask) continue;
          if (srcConfig.passiveInterfaces.includes(srcIf.name) || srcConfig.passiveInterfaces.includes(srcIf.shortName)) continue;

          for (const dstIf of dstNode.interfaces.values()) {
            if (dstIf.isShutdown || dstIf.status !== 'up' || !dstIf.ipAddress || !dstIf.subnetMask) continue;
            if (dstConfig.passiveInterfaces.includes(dstIf.name) || dstConfig.passiveInterfaces.includes(dstIf.shortName)) continue;

            if (SubnetUtils.isSameSubnet(srcIf.ipAddress, dstIf.ipAddress, srcIf.subnetMask)) {
              const srcArea = this.findInterfaceOspfArea(srcIf.ipAddress, srcConfig.networks);
              const dstArea = this.findInterfaceOspfArea(dstIf.ipAddress, dstConfig.networks);

              if (srcArea !== null && dstArea !== null && srcArea === dstArea) {
                const areaNets = networksByArea.get(srcArea) || [];
                for (const netRule of areaNets) {
                  let isDirectlyConnected = false;
                  for (const sif of srcNode.interfaces.values()) {
                    if (sif.ipAddress && sif.subnetMask && SubnetUtils.isSameSubnet(sif.ipAddress, netRule.network, sif.subnetMask)) {
                      isDirectlyConnected = true;
                      break;
                    }
                  }
                  if (isDirectlyConnected) continue;

                  const exists = srcNode.routingTable.some(r => r.network === netRule.network && r.mask === netRule.mask);
                  if (!exists) {
                    srcNode.routingTable.push({
                      network: netRule.network,
                      mask: netRule.mask,
                      cidr: netRule.cidr,
                      nextHop: dstIf.ipAddress,
                      exitInterface: srcIf.name,
                      protocol: 'O',
                      adminDistance: 110,
                      metric: 2
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    // 3. Inter-Area Convergence (ABR -> Summary LSA Type 3 -> 'O IA')
    for (const abrNode of ospfNodes) {
      const abrConfig = (abrNode as any).ospfConfig!;
      const abrAreas = new Set<number>();
      for (const ifc of abrNode.interfaces.values()) {
        if (!ifc.isShutdown && ifc.status === 'up' && ifc.ipAddress) {
          const area = this.findInterfaceOspfArea(ifc.ipAddress, abrConfig.networks);
          if (area !== null) abrAreas.add(area);
        }
      }

      // Harus terhubung ke Area 0 dan area lain
      if (!abrAreas.has(0) || abrAreas.size < 2) continue;

      for (const fromArea of abrAreas) {
        const advertisedNets: Array<{ network: string; mask: string; cidr: number }> = [];

        // Cek range summarization
        const ranges = abrConfig.areaRanges?.filter((r: any) => r.area === fromArea) || [];
        if (ranges.length > 0) {
          for (const rng of ranges) {
            advertisedNets.push({
              network: rng.network,
              mask: rng.mask,
              cidr: SubnetUtils.maskToCidr(rng.mask)
            });
          }
        } else {
          const rawNets = networksByArea.get(fromArea) || [];
          for (const rn of rawNets) {
            advertisedNets.push({
              network: rn.network,
              mask: rn.mask,
              cidr: rn.cidr
            });
          }
        }

        // Iklankan ke setiap toArea != fromArea
        for (const toArea of abrAreas) {
          if (toArea === fromArea) continue;

          for (const neighborNode of ospfNodes) {
            if (neighborNode.id === abrNode.id) continue;

            for (const abrIf of abrNode.interfaces.values()) {
              if (abrIf.isShutdown || abrIf.status !== 'up' || !abrIf.ipAddress || !abrIf.subnetMask) continue;
              const ifArea = this.findInterfaceOspfArea(abrIf.ipAddress, abrConfig.networks);
              if (ifArea !== toArea) continue;

              for (const nbrIf of neighborNode.interfaces.values()) {
                if (nbrIf.isShutdown || nbrIf.status !== 'up' || !nbrIf.ipAddress || !nbrIf.subnetMask) continue;

                if (SubnetUtils.isSameSubnet(abrIf.ipAddress, nbrIf.ipAddress, abrIf.subnetMask)) {
                  for (const adv of advertisedNets) {
                    let isDirect = false;
                    for (const sif of neighborNode.interfaces.values()) {
                      if (sif.ipAddress && sif.subnetMask && SubnetUtils.isSameSubnet(sif.ipAddress, adv.network, sif.subnetMask)) {
                        isDirect = true;
                        break;
                      }
                    }
                    if (isDirect) continue;

                    const exists = neighborNode.routingTable.some(r => r.network === adv.network && r.mask === adv.mask);
                    if (!exists) {
                      neighborNode.routingTable.push({
                        network: adv.network,
                        mask: adv.mask,
                        cidr: adv.cidr,
                        nextHop: abrIf.ipAddress,
                        exitInterface: nbrIf.name,
                        protocol: 'O IA',
                        adminDistance: 110,
                        metric: 3
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  private static findInterfaceOspfArea(ip: string, networks: Array<{ network: string; wildcard: string; area: number }>): number | null {
    for (const n of networks) {
      const mask = SubnetUtils.wildcardToMask(n.wildcard);
      if (SubnetUtils.isIpInSubnet(ip, n.network, mask)) {
        return n.area;
      }
    }
    return null;
  }

  // ===================== EIGRP CONVERGENCE =====================
  private static convergeEigrp(l3Nodes: (Router | Switch)[], _allDevices: Device[]): void {
    const eigrpNodes = l3Nodes.filter(n => (n as any).eigrpConfig && (n as any).eigrpConfig.enabled);

    for (const srcNode of eigrpNodes) {
      const srcConfig = (srcNode as any).eigrpConfig!;

      for (const dstNode of eigrpNodes) {
        if (srcNode.id === dstNode.id) continue;
        const dstConfig = (dstNode as any).eigrpConfig!;

        // AS Number harus sama
        if (srcConfig.asNumber !== dstConfig.asNumber) continue;

        // Cari antarmuka yang terhubung langsung
        for (const srcIf of srcNode.interfaces.values()) {
          if (srcIf.isShutdown || srcIf.status !== 'up' || !srcIf.ipAddress || !srcIf.subnetMask) continue;
          if (srcConfig.passiveInterfaces.includes(srcIf.name) || srcConfig.passiveInterfaces.includes(srcIf.shortName)) continue;

          for (const dstIf of dstNode.interfaces.values()) {
            if (dstIf.isShutdown || dstIf.status !== 'up' || !dstIf.ipAddress || !dstIf.subnetMask) continue;
            if (dstConfig.passiveInterfaces.includes(dstIf.name) || dstConfig.passiveInterfaces.includes(dstIf.shortName)) continue;

            if (SubnetUtils.isSameSubnet(srcIf.ipAddress, dstIf.ipAddress, srcIf.subnetMask)) {
              // Sebarkan rute EIGRP dari dstNode ke srcNode
              for (const netRule of dstConfig.networks) {
                const targetNet = netRule.network;
                const targetMask = netRule.wildcard ? SubnetUtils.wildcardToMask(netRule.wildcard) : '255.255.255.0';
                const cidr = SubnetUtils.maskToCidr(targetMask);

                if (SubnetUtils.isSameSubnet(srcIf.ipAddress, targetNet, srcIf.subnetMask)) continue;

                const exists = srcNode.routingTable.some(r => r.network === targetNet && r.mask === targetMask);
                if (!exists) {
                  srcNode.routingTable.push({
                    network: targetNet,
                    mask: targetMask,
                    cidr,
                    nextHop: dstIf.ipAddress,
                    exitInterface: srcIf.name,
                    protocol: 'D',
                    adminDistance: 90,
                    metric: 307200 // EIGRP Composite metric
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  // ===================== BGP CONVERGENCE =====================
  private static convergeBgp(l3Nodes: (Router | Switch)[], _allDevices: Device[]): void {
    const bgpNodes = l3Nodes.filter(n => (n as any).bgpConfig && (n as any).bgpConfig.enabled);

    for (const srcNode of bgpNodes) {
      const srcConfig = (srcNode as any).bgpConfig!;

      for (const [peerIp, neighbor] of srcConfig.neighbors.entries()) {
        // Cari simpul pemilik peerIp
        for (const dstNode of bgpNodes) {
          if (srcNode.id === dstNode.id) continue;
          const dstConfig = (dstNode as any).bgpConfig!;

          // Cek apakah dstNode memiliki interface dengan peerIp
          const peerIface = Array.from(dstNode.interfaces.values()).find(i => i.ipAddress === peerIp && !i.isShutdown);
          if (peerIface) {
            // Update status neighbor menjadi Established
            neighbor.state = 'Established';

            const isEbgp = srcConfig.asNumber !== neighbor.remoteAs;
            const ad = isEbgp ? 20 : 200;

            // Cari antarmuka keluar pada srcNode menuju peerIp
            const localTransitIf = Array.from(srcNode.interfaces.values()).find(i => i.ipAddress && i.subnetMask && SubnetUtils.isSameSubnet(i.ipAddress, peerIp, i.subnetMask));
            const exitPort = localTransitIf ? localTransitIf.name : 'GigabitEthernet0/0/0';

            // Sebarkan rute network BGP dstNode ke srcNode
            for (const netRule of dstConfig.networks) {
              const targetNet = netRule.network;
              const targetMask = netRule.mask || '255.255.255.0';
              const cidr = SubnetUtils.maskToCidr(targetMask);

              const exists = srcNode.routingTable.some(r => r.network === targetNet && r.mask === targetMask);
              if (!exists) {
                srcNode.routingTable.push({
                  network: targetNet,
                  mask: targetMask,
                  cidr,
                  nextHop: peerIp,
                  exitInterface: exitPort,
                  protocol: 'B',
                  adminDistance: ad,
                  metric: 0
                });
              }
            }
          }
        }
      }
    }
  }

  // ===================== SHOW OSPF RENDERING =====================
  static renderShowIpOspfNeighbor(node: Device, allDevices: Device[]): string {
    const ospfConfig = (node as any).ospfConfig;
    if (!ospfConfig || !ospfConfig.enabled) return '% OSPF not enabled on this device';

    const lines: string[] = [
      'Neighbor ID     Pri   State           Dead Time   Address         Interface',
      '--------------- ----- --------------- ----------- --------------- -----------------'
    ];

    const l3Nodes = allDevices.filter(d => (d as any).ospfConfig && (d as any).ospfConfig.enabled && d.id !== node.id);
    for (const neighbor of l3Nodes) {
      const nConfig = (neighbor as any).ospfConfig;
      const nRouterId = nConfig.routerId || Array.from(neighbor.interfaces.values()).find(i => i.ipAddress)?.ipAddress || '10.0.0.1';

      for (const locIf of node.interfaces.values()) {
        if (!locIf.ipAddress || !locIf.subnetMask || locIf.isShutdown) continue;
        for (const remIf of neighbor.interfaces.values()) {
          if (!remIf.ipAddress || !remIf.subnetMask || remIf.isShutdown) continue;
          if (SubnetUtils.isSameSubnet(locIf.ipAddress, remIf.ipAddress, locIf.subnetMask)) {
            const rIdCol = nRouterId.padEnd(15);
            const priCol = '1'.padEnd(5);
            const stateCol = 'FULL/BDR'.padEnd(15);
            const deadCol = '00:00:36'.padEnd(11);
            const addrCol = remIf.ipAddress.padEnd(15);
            const ifCol = locIf.shortName || locIf.name;
            lines.push(`${rIdCol} ${priCol} ${stateCol} ${deadCol} ${addrCol} ${ifCol}`);
          }
        }
      }
    }

    if (lines.length === 2) {
      lines.push('No OSPF neighbors found.');
    }
    return lines.join('\n');
  }

  static renderShowIpOspf(node: Device, _allDevices: Device[] = []): string {
    const config = (node as any).ospfConfig;
    if (!config || !config.enabled) return '% OSPF not enabled on this device';

    const rid = config.routerId || Array.from(node.interfaces.values()).find(i => i.ipAddress)?.ipAddress || '10.0.0.1';
    const areas = Array.from(new Set(config.networks.map((n: any) => n.area as number)));
    const isAbr = areas.includes(0) && areas.length > 1;

    return [
      `Routing Process "ospf ${config.processId}" with ID ${rid}`,
      `Start time: 00:01:10.240, Time elapsed: 02:45:12`,
      `Supports only single TOS(TOS0) routes`,
      `Supports opaque LSA`,
      `Supports Link-local Signaling (LLS)`,
      `Initial SPF schedule delay 5000 msecs`,
      `Minimum hold time between two consecutive SPFs 10000 msecs`,
      `Maximum wait time between two consecutive SPFs 10000 msecs`,
      isAbr ? `It is an area border router (ABR)` : `It is an internal router`,
      `Number of areas in this router is ${areas.length}. Normal ${areas.length} Stub 0 NSSA 0`,
      ...areas.map(a => `    Area ${a} has ${config.networks.filter((n: any) => n.area === a).length} interfaces`)
    ].join('\n');
  }

  static renderShowIpOspfDatabase(node: Device, allDevices: Device[] = []): string {
    const config = (node as any).ospfConfig;
    if (!config || !config.enabled) return '% OSPF not enabled on this device';

    const rid = config.routerId || Array.from(node.interfaces.values()).find(i => i.ipAddress)?.ipAddress || '10.0.0.1';
    const areas = Array.from(new Set(config.networks.map((n: any) => n.area as number)));

    const lines: string[] = [
      `            OSPF Router with ID (${rid}) (Process ID ${config.processId || 1})`,
      ''
    ];

    for (const area of areas) {
      lines.push(`                Router Link States (Area ${area})`);
      lines.push('Link ID         ADV Router      Age         Seq#       Checksum Link count');
      lines.push(`${rid.padEnd(15)} ${rid.padEnd(15)} 542         0x80000002 0x00A1B2 2`);

      const otherRouters = allDevices.filter(d => (d as any).ospfConfig && (d as any).ospfConfig.enabled && d.id !== node.id);
      for (const other of otherRouters) {
        const oCfg = (other as any).ospfConfig;
        if (oCfg.networks.some((n: any) => n.area === area)) {
          const oRid = oCfg.routerId || Array.from(other.interfaces.values()).find(i => i.ipAddress)?.ipAddress || '10.0.0.2';
          lines.push(`${oRid.padEnd(15)} ${oRid.padEnd(15)} 418         0x80000003 0x00B2C3 2`);
        }
      }
      lines.push('');

      lines.push(`                Summary Net Link States (Area ${area})`);
      lines.push('Link ID         ADV Router      Age         Seq#       Checksum');
      for (const r of (node as any).routingTable || []) {
        if (r.protocol === 'O IA') {
          lines.push(`${r.network.padEnd(15)} ${rid.padEnd(15)} 280         0x80000001 0x00C3D4`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // ===================== SHOW EIGRP RENDERING =====================
  static renderShowIpEigrpNeighbors(node: Device, allDevices: Device[]): string {
    const config = (node as any).eigrpConfig;
    if (!config || !config.enabled) return '% EIGRP not enabled on this device';

    const lines: string[] = [
      `EIGRP-IPv4 Neighbors for AS(${config.asNumber})`,
      `H   Address                 Interface              Hold Uptime   SRTT   RTO  Q  Seq`,
      `                                                   (sec)         (ms)       Cnt Num`,
      `-----------------------------------------------------------------------------------`
    ];

    let count = 0;
    const l3Nodes = allDevices.filter(d => (d as any).eigrpConfig && (d as any).eigrpConfig.enabled && d.id !== node.id);
    for (const neighbor of l3Nodes) {
      const nConfig = (neighbor as any).eigrpConfig;
      if (nConfig.asNumber !== config.asNumber) continue;

      for (const locIf of node.interfaces.values()) {
        if (!locIf.ipAddress || !locIf.subnetMask || locIf.isShutdown) continue;
        for (const remIf of neighbor.interfaces.values()) {
          if (!remIf.ipAddress || !remIf.subnetMask || remIf.isShutdown) continue;
          if (SubnetUtils.isSameSubnet(locIf.ipAddress, remIf.ipAddress, locIf.subnetMask)) {
            const hCol = count.toString().padEnd(3);
            const addrCol = remIf.ipAddress.padEnd(23);
            const ifCol = (locIf.shortName || locIf.name).padEnd(22);
            lines.push(`${hCol} ${addrCol} ${ifCol} 14   01:12:44   12   200  0  ${count + 1}`);
            count++;
          }
        }
      }
    }

    if (count === 0) {
      lines.push('No EIGRP neighbors found.');
    }
    return lines.join('\n');
  }

  static renderShowIpEigrpTopology(node: Device, _allDevices: Device[] = []): string {
    const config = (node as any).eigrpConfig;
    if (!config || !config.enabled) return '% EIGRP not enabled on this device';

    const rid = config.routerId || Array.from(node.interfaces.values()).find(i => i.ipAddress)?.ipAddress || '10.0.0.1';

    const lines: string[] = [
      `EIGRP-IPv4 Topology Table for AS(${config.asNumber})/ID(${rid})`,
      'Codes: P - Passive, A - Active, U - Update, Q - Query, R - Reply,',
      '       r - reply Status, s - sia Status',
      ''
    ];

    const routes = ((node as any).routingTable || []).filter((r: any) => r.protocol === 'D' || r.protocol === 'D EX' || r.protocol === 'C');
    for (const r of routes) {
      lines.push(`P ${r.network}/${r.cidr}, 1 successors, FD is ${r.metric || 307200}`);
      lines.push(`        via ${r.nextHop || 'Connected'} (${r.metric || 307200}/${Math.round((r.metric || 307200) / 2)}), ${r.exitInterface}`);
    }

    return lines.join('\n');
  }

  // ===================== SHOW BGP RENDERING =====================
  static renderShowIpBgpSummary(node: Device, _allDevices: Device[] = []): string {
    const config = (node as any).bgpConfig;
    if (!config || !config.enabled) return '% BGP not active';

    const rid = config.routerId || Array.from(node.interfaces.values()).find(i => i.ipAddress)?.ipAddress || '10.0.0.1';

    const lines: string[] = [
      `BGP router identifier ${rid}, local AS number ${config.asNumber}`,
      `BGP table version is 3, main routing table version 3`,
      `2 network entries using 288 bytes of memory`,
      `2 path entries using 160 bytes of memory`,
      ``,
      `Neighbor        V           AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd`,
      `--------------- - ------------ ------- ------- -------- ---- ---- -------- ------------`
    ];

    for (const [peerIp, neighbor] of config.neighbors.entries()) {
      const peerCol = peerIp.padEnd(15);
      const vCol = '4';
      const asCol = neighbor.remoteAs.toString().padStart(12);
      const stateCol = (neighbor.state === 'Established' ? '2' : (neighbor.state || 'Idle')).padStart(12);
      lines.push(`${peerCol} ${vCol} ${asCol}      18      19        3    0    0 00:15:32 ${stateCol}`);
    }

    return lines.join('\n');
  }

  static renderShowIpBgp(node: Device, _allDevices: Device[] = []): string {
    const config = (node as any).bgpConfig;
    if (!config || !config.enabled) return '% BGP not active';

    const rid = config.routerId || Array.from(node.interfaces.values()).find(i => i.ipAddress)?.ipAddress || '10.0.0.1';

    const lines: string[] = [
      `BGP table version is 3, local router ID is ${rid}`,
      'Status codes: s suppressed, d damped, h history, * valid, > best, i - internal,',
      '              r RIB-failure, S Stale, m multipath, b backup-path, f RT-Filter,',
      '              x best-external, a additional-path, c RIB-compressed,',
      'Origin codes: i - IGP, e - EGP, ? - incomplete',
      'RPKI validation codes: V valid, I invalid, N Not found',
      '',
      '     Network          Next Hop            Metric LocPrf Weight Path'
    ];

    const bgpRoutes = ((node as any).routingTable || []).filter((r: any) => r.protocol === 'B');
    for (const r of bgpRoutes) {
      lines.push(` *>  ${(r.network + '/' + r.cidr).padEnd(16)} ${r.nextHop.padEnd(19)} 0             0 65001 i`);
    }

    for (const net of config.networks) {
      lines.push(` *>  ${(net.network + '/' + net.cidr).padEnd(16)} 0.0.0.0             0         32768 i`);
    }

    return lines.join('\n');
  }
}
