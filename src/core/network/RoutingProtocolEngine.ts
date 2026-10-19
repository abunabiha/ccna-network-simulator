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
import { PolicyEngine } from './PolicyEngine';

export class RoutingProtocolEngine {
  /**
   * Menghitung dan menyebarkan rute dinamis (OSPF, EIGRP, BGP) ke seluruh perangkat L3
   */
  static convergeRoutingProtocols(allDevices: Device[]): void {
    const l3Nodes = allDevices.filter(d => d instanceof Router || (d instanceof Switch && d.isLayer3 && d.ipRouting)) as (Router | Switch)[];

    // Bersihkan rute dinamis lama (O, O IA, O E1, O E2, D, D EX, B) sebelum kalkulasi ulang
    for (const node of l3Nodes) {
      node.routingTable = node.routingTable.filter(r => 
        r.protocol !== 'O' && 
        r.protocol !== 'O IA' && 
        r.protocol !== 'O E1' && 
        r.protocol !== 'O E2' && 
        r.protocol !== 'D' && 
        r.protocol !== 'D EX' && 
        r.protocol !== 'B'
      );
    }

    this.convergeOspf(l3Nodes, allDevices);
    this.convergeEigrp(l3Nodes, allDevices);
    this.convergeBgp(l3Nodes, allDevices);
    PolicyEngine.evaluateIpSla(allDevices);
    this.convergeRedistributions(l3Nodes, allDevices);
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

  // ===================== MUTUAL ROUTE REDISTRIBUTION =====================
  private static convergeRedistributions(l3Nodes: (Router | Switch)[], allDevices: Device[]): void {
    for (const node of l3Nodes) {
      // 1. OSPF Redistribution
      if (node.ospfConfig && node.ospfConfig.enabled && node.ospfConfig.redistributions) {
        for (const redist of node.ospfConfig.redistributions) {
          const proto = redist.protocol;
          const candidateRoutes: RouteEntry[] = [];

          if (proto === 'connected') {
            candidateRoutes.push(...node.routingTable.filter(r => r.protocol === 'C'));
          } else if (proto === 'static') {
            candidateRoutes.push(...node.routingTable.filter(r => r.protocol === 'S'));
          } else if (proto === 'eigrp') {
            candidateRoutes.push(...node.routingTable.filter(r => r.protocol === 'D' || r.protocol === 'D EX'));
            if (node.eigrpConfig && node.eigrpConfig.enabled) {
              for (const r of node.routingTable) {
                if (r.protocol === 'C') {
                  const isEigrpNet = node.eigrpConfig.networks.some(netRule => {
                    const mask = netRule.wildcard ? SubnetUtils.wildcardToMask(netRule.wildcard) : '255.255.255.0';
                    return SubnetUtils.isIpInSubnet(r.network, netRule.network, mask) || r.network === netRule.network;
                  });
                  if (isEigrpNet && !candidateRoutes.some(c => c.network === r.network && c.mask === r.mask)) {
                    candidateRoutes.push(r);
                  }
                }
              }
            }
          } else if (proto === 'bgp') {
            candidateRoutes.push(...node.routingTable.filter(r => r.protocol === 'B'));
          }

          for (const cand of candidateRoutes) {
            let permitted = true;
            let metric = redist.metric !== undefined ? redist.metric : 20;
            let metricType: 'O E1' | 'O E2' = (redist.metricType === '1' || redist.metricType === 'type-1') ? 'O E1' : 'O E2';
            let tag = cand.tag;

            if (redist.routeMap) {
              const rm = node.routeMaps?.get(redist.routeMap);
              if (rm) {
                const evalRes = PolicyEngine.evaluateRouteMap(rm, cand, node);
                permitted = evalRes.permitted;
                if (evalRes.setMetric !== undefined) metric = evalRes.setMetric;
                if (evalRes.setMetricType === 'type-1') metricType = 'O E1';
                if (evalRes.setMetricType === 'type-2') metricType = 'O E2';
                if (evalRes.setTag !== undefined) tag = evalRes.setTag;
              } else {
                permitted = false;
              }
            }

            if (permitted) {
              // Sebarkan rute OSPF External ke seluruh domain OSPF
              for (const ospfPeer of l3Nodes) {
                if (!ospfPeer.ospfConfig || !ospfPeer.ospfConfig.enabled) continue;

                // Jangan pasang pada node asal jika rute tersebut sudah ada di tabel routing
                if (ospfPeer.id === node.id) {
                  const hasLocal = ospfPeer.routingTable.some(r => r.network === cand.network && r.mask === cand.mask && (r.protocol === 'O E1' || r.protocol === 'O E2'));
                  if (!hasLocal) {
                    ospfPeer.routingTable.push({
                      network: cand.network,
                      mask: cand.mask,
                      cidr: cand.cidr,
                      nextHop: cand.nextHop || '0.0.0.0',
                      exitInterface: cand.exitInterface || 'Null0',
                      protocol: metricType,
                      adminDistance: 110,
                      metric,
                      tag
                    });
                  }
                  continue;
                }

                // Temukan antarmuka penghubung ke ASBR
                for (const pIf of ospfPeer.interfaces.values()) {
                  if (pIf.isShutdown || pIf.status !== 'up' || !pIf.ipAddress || !pIf.subnetMask) continue;
                  for (const nIf of node.interfaces.values()) {
                    if (nIf.isShutdown || nIf.status !== 'up' || !nIf.ipAddress || !nIf.subnetMask) continue;

                    if (SubnetUtils.isSameSubnet(pIf.ipAddress, nIf.ipAddress, pIf.subnetMask)) {
                      let isDirect = false;
                      for (const ifc of ospfPeer.interfaces.values()) {
                        if (ifc.ipAddress && ifc.subnetMask && SubnetUtils.isSameSubnet(ifc.ipAddress, cand.network, ifc.subnetMask)) {
                          isDirect = true;
                          break;
                        }
                      }
                      if (isDirect) continue;

                      const exIdx = ospfPeer.routingTable.findIndex(r => r.network === cand.network && r.mask === cand.mask);
                      if (exIdx >= 0) {
                        if (ospfPeer.routingTable[exIdx].protocol === 'O E1' || ospfPeer.routingTable[exIdx].protocol === 'O E2') {
                          ospfPeer.routingTable[exIdx] = {
                            network: cand.network,
                            mask: cand.mask,
                            cidr: cand.cidr,
                            nextHop: nIf.ipAddress,
                            exitInterface: pIf.name,
                            protocol: metricType,
                            adminDistance: 110,
                            metric,
                            tag
                          };
                        }
                      } else {
                        ospfPeer.routingTable.push({
                          network: cand.network,
                          mask: cand.mask,
                          cidr: cand.cidr,
                          nextHop: nIf.ipAddress,
                          exitInterface: pIf.name,
                          protocol: metricType,
                          adminDistance: 110,
                          metric,
                          tag
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

      // 2. EIGRP Redistribution
      if (node.eigrpConfig && node.eigrpConfig.enabled && node.eigrpConfig.redistributions) {
        for (const redist of node.eigrpConfig.redistributions) {
          const proto = redist.protocol;
          const candidateRoutes: RouteEntry[] = [];

          if (proto === 'connected') {
            candidateRoutes.push(...node.routingTable.filter(r => r.protocol === 'C'));
          } else if (proto === 'static') {
            candidateRoutes.push(...node.routingTable.filter(r => r.protocol === 'S'));
          } else if (proto === 'ospf') {
            candidateRoutes.push(...node.routingTable.filter(r => r.protocol === 'O' || r.protocol === 'O IA' || r.protocol === 'O E1' || r.protocol === 'O E2'));
          } else if (proto === 'bgp') {
            candidateRoutes.push(...node.routingTable.filter(r => r.protocol === 'B'));
          }

          for (const cand of candidateRoutes) {
            let permitted = true;
            let metric = redist.metric !== undefined ? redist.metric : (redist.bandwidth && redist.delay ? Math.round(256 * (10000000 / redist.bandwidth + redist.delay)) : 307200);
            let tag = cand.tag;

            if (redist.routeMap) {
              const rm = node.routeMaps?.get(redist.routeMap);
              if (rm) {
                const evalRes = PolicyEngine.evaluateRouteMap(rm, cand, node);
                permitted = evalRes.permitted;
                if (evalRes.setMetric !== undefined) metric = evalRes.setMetric;
                if (evalRes.setTag !== undefined) tag = evalRes.setTag;
              } else {
                permitted = false;
              }
            }

            if (permitted) {
              for (const eigrpPeer of l3Nodes) {
                if (!eigrpPeer.eigrpConfig || !eigrpPeer.eigrpConfig.enabled) continue;
                if (eigrpPeer.eigrpConfig.asNumber !== node.eigrpConfig.asNumber) continue;

                if (eigrpPeer.id === node.id) {
                  const hasLocal = eigrpPeer.routingTable.some(r => r.network === cand.network && r.mask === cand.mask && r.protocol === 'D EX');
                  if (!hasLocal) {
                    eigrpPeer.routingTable.push({
                      network: cand.network,
                      mask: cand.mask,
                      cidr: cand.cidr,
                      nextHop: cand.nextHop || '0.0.0.0',
                      exitInterface: cand.exitInterface || 'Null0',
                      protocol: 'D EX',
                      adminDistance: 170,
                      metric,
                      tag
                    });
                  }
                  continue;
                }

                for (const pIf of eigrpPeer.interfaces.values()) {
                  if (pIf.isShutdown || pIf.status !== 'up' || !pIf.ipAddress || !pIf.subnetMask) continue;
                  for (const nIf of node.interfaces.values()) {
                    if (nIf.isShutdown || nIf.status !== 'up' || !nIf.ipAddress || !nIf.subnetMask) continue;

                    if (SubnetUtils.isSameSubnet(pIf.ipAddress, nIf.ipAddress, pIf.subnetMask)) {
                      let isDirect = false;
                      for (const ifc of eigrpPeer.interfaces.values()) {
                        if (ifc.ipAddress && ifc.subnetMask && SubnetUtils.isSameSubnet(ifc.ipAddress, cand.network, ifc.subnetMask)) {
                          isDirect = true;
                          break;
                        }
                      }
                      if (isDirect) continue;

                      const exists = eigrpPeer.routingTable.some(r => r.network === cand.network && r.mask === cand.mask && r.protocol === 'D EX');
                      if (!exists) {
                        eigrpPeer.routingTable.push({
                          network: cand.network,
                          mask: cand.mask,
                          cidr: cand.cidr,
                          nextHop: nIf.ipAddress,
                          exitInterface: pIf.name,
                          protocol: 'D EX',
                          adminDistance: 170,
                          metric,
                          tag
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

      // 3. BGP Redistribution
      if (node.bgpConfig && node.bgpConfig.enabled && node.bgpConfig.redistributions) {
        for (const redist of node.bgpConfig.redistributions) {
          const proto = redist.protocol;
          const candidateRoutes: RouteEntry[] = [];

          if (proto === 'connected') {
            candidateRoutes.push(...node.routingTable.filter(r => r.protocol === 'C'));
          } else if (proto === 'static') {
            candidateRoutes.push(...node.routingTable.filter(r => r.protocol === 'S'));
          } else if (proto === 'ospf') {
            candidateRoutes.push(...node.routingTable.filter(r => r.protocol === 'O' || r.protocol === 'O IA'));
          } else if (proto === 'eigrp') {
            candidateRoutes.push(...node.routingTable.filter(r => r.protocol === 'D'));
          }

          for (const cand of candidateRoutes) {
            let permitted = true;
            let metric = redist.metric !== undefined ? redist.metric : 0;
            let tag = cand.tag;

            if (redist.routeMap) {
              const rm = node.routeMaps?.get(redist.routeMap);
              if (rm) {
                const evalRes = PolicyEngine.evaluateRouteMap(rm, cand, node);
                permitted = evalRes.permitted;
                if (evalRes.setMetric !== undefined) metric = evalRes.setMetric;
                if (evalRes.setTag !== undefined) tag = evalRes.setTag;
              } else {
                permitted = false;
              }
            }

            if (permitted) {
              for (const bgpPeer of l3Nodes) {
                if (!bgpPeer.bgpConfig || !bgpPeer.bgpConfig.enabled) continue;
                if (bgpPeer.id === node.id) continue;

                for (const pIf of bgpPeer.interfaces.values()) {
                  if (pIf.isShutdown || pIf.status !== 'up' || !pIf.ipAddress || !pIf.subnetMask) continue;
                  for (const nIf of node.interfaces.values()) {
                    if (nIf.isShutdown || nIf.status !== 'up' || !nIf.ipAddress || !nIf.subnetMask) continue;

                    if (SubnetUtils.isSameSubnet(pIf.ipAddress, nIf.ipAddress, pIf.subnetMask)) {
                      let isDirect = false;
                      for (const ifc of bgpPeer.interfaces.values()) {
                        if (ifc.ipAddress && ifc.subnetMask && SubnetUtils.isSameSubnet(ifc.ipAddress, cand.network, ifc.subnetMask)) {
                          isDirect = true;
                          break;
                        }
                      }
                      if (isDirect) continue;

                      const isEbgp = node.bgpConfig.asNumber !== bgpPeer.bgpConfig.asNumber;
                      const adminDistance = isEbgp ? 20 : 200;

                      const exists = bgpPeer.routingTable.some(r => r.network === cand.network && r.mask === cand.mask && r.protocol === 'B');
                      if (!exists) {
                        bgpPeer.routingTable.push({
                          network: cand.network,
                          mask: cand.mask,
                          cidr: cand.cidr,
                          nextHop: nIf.ipAddress,
                          exitInterface: pIf.name,
                          protocol: 'B',
                          adminDistance,
                          metric,
                          tag
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
        const isLocPassive = config.passiveInterfaces?.includes(locIf.name) ||
                             config.passiveInterfaces?.includes(locIf.shortName) ||
                             (config.passiveInterfaceDefault && !config.passiveInterfaces?.some((p: string) => p === locIf.name || p === locIf.shortName));
        if (isLocPassive) continue;

        for (const remIf of neighbor.interfaces.values()) {
          if (!remIf.ipAddress || !remIf.subnetMask || remIf.isShutdown) continue;
          const isRemPassive = nConfig.passiveInterfaces?.includes(remIf.name) ||
                               nConfig.passiveInterfaces?.includes(remIf.shortName) ||
                               (nConfig.passiveInterfaceDefault && !nConfig.passiveInterfaces?.some((p: string) => p === remIf.name || p === remIf.shortName));
          if (isRemPassive) continue;

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

  static renderShowIpEigrpInterfaces(node: Device, _allDevices: Device[] = []): string {
    const config = (node as any).eigrpConfig;
    if (!config || !config.enabled) return '% EIGRP not enabled on this device';

    const lines: string[] = [
      `EIGRP-IPv4 Interfaces for AS(${config.asNumber})`,
      `                              Xmit Queue   PeerQ        Mean   Pacing Time   Multicast    Pending`,
      `Interface              Peers  Un/Reliable  Un/Reliable  SRTT   Un/Reliable   Flow Timer   Routes`,
      `------------------------------------------------------------------------------------------------`
    ];

    for (const iface of node.interfaces.values()) {
      if (!iface.ipAddress || iface.isShutdown) continue;
      const ifCol = (iface.shortName || iface.name).padEnd(22);
      lines.push(`${ifCol} 1        0/0          0/0          12        0/1           50           0`);
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

  static renderShowIpv6EigrpNeighbors(node: Device, allDevices: Device[]): string {
    const config = (node as any).eigrpV6Config;
    if (!config || !config.enabled) return '% EIGRP-IPv6 not enabled on this device';

    const lines: string[] = [
      `EIGRP-IPv6 Neighbors for AS(${config.asNumber})`,
      `H   Address                 Interface              Hold Uptime   SRTT   RTO  Q  Seq`,
      `                                                   (sec)         (ms)       Cnt Num`,
      `-----------------------------------------------------------------------------------`
    ];

    let count = 0;
    const l3Nodes = allDevices.filter(d => (d as any).eigrpV6Config && (d as any).eigrpV6Config.enabled && d.id !== node.id);
    for (const neighbor of l3Nodes) {
      const nConfig = (neighbor as any).eigrpV6Config;
      if (nConfig.asNumber !== config.asNumber) continue;

      for (const locIf of node.interfaces.values()) {
        if (!locIf.ipv6Address || locIf.isShutdown) continue;
        for (const remIf of neighbor.interfaces.values()) {
          if (!remIf.ipv6Address || remIf.isShutdown) continue;
          const locSub = locIf.ipv6Address.split('/')[0].split(':').slice(0, 4).join(':');
          const remSub = remIf.ipv6Address.split('/')[0].split(':').slice(0, 4).join(':');
          if (locSub === remSub) {
            const hCol = count.toString().padEnd(3);
            const addrCol = (remIf.ipv6Address.split('/')[0]).padEnd(23);
            const ifCol = (locIf.shortName || locIf.name).padEnd(22);
            lines.push(`${hCol} ${addrCol} ${ifCol} 14   00:45:12   15   200  0  ${count + 1}`);
            count++;
          }
        }
      }
    }

    if (count === 0) {
      lines.push('No EIGRP-IPv6 neighbors found.');
    }
    return lines.join('\n');
  }

  static renderShowIpv6EigrpInterfaces(node: Device, _allDevices: Device[] = []): string {
    const config = (node as any).eigrpV6Config;
    if (!config || !config.enabled) return '% EIGRP-IPv6 not enabled on this device';

    const lines: string[] = [
      `EIGRP-IPv6 Interfaces for AS(${config.asNumber})`,
      `                              Xmit Queue   PeerQ        Mean   Pacing Time   Multicast    Pending`,
      `Interface              Peers  Un/Reliable  Un/Reliable  SRTT   Un/Reliable   Flow Timer   Routes`,
      `------------------------------------------------------------------------------------------------`
    ];

    for (const iface of node.interfaces.values()) {
      if (!iface.ipv6Address || iface.isShutdown) continue;
      const ifCol = (iface.shortName || iface.name).padEnd(22);
      lines.push(`${ifCol} 1        0/0          0/0          12        0/1           50           0`);
    }

    return lines.join('\n');
  }

  static renderShowIpv6EigrpTopology(node: Device, _allDevices: Device[] = []): string {
    const config = (node as any).eigrpV6Config;
    if (!config || !config.enabled) return '% EIGRP-IPv6 not enabled on this device';

    const rid = config.routerId || '1.1.1.1';
    const lines: string[] = [
      `EIGRP-IPv6 Topology Table for AS(${config.asNumber})/ID(${rid})`,
      'Codes: P - Passive, A - Active, U - Update, Q - Query, R - Reply,',
      '       r - reply Status, s - sia Status',
      ''
    ];

    for (const iface of node.interfaces.values()) {
      if (!iface.ipv6Address || iface.isShutdown) continue;
      const prefix = iface.ipv6Address;
      lines.push(`P ${prefix}, 1 successors, FD is 1310720`);
      lines.push(`        via Connected, ${iface.shortName || iface.name}`);
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
