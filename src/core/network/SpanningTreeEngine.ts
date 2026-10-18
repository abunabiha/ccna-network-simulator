/**
 * SpanningTreeEngine.ts
 * Mesin kalkulasi Spanning Tree Protocol (STP / RSTP / MSTP) untuk Cisco Switch
 * Menghitung:
 * 1. Bridge ID (Priority + System ID Extension / VLAN + MAC Address)
 * 2. Pemilihan Root Bridge (Lowest Bridge ID)
 * 3. Pemilihan Root Port (Lowest Root Path Cost to Root)
 * 4. Pemilihan Designated Port vs Alternate/Blocking Port (Pencegahan Loop Layer 2)
 * 5. Fitur PortFast, BPDU Guard, BPDU Filter, dan Root Guard
 */

import { Device } from '../devices/Device';
import { Switch } from '../devices/Switch';
import { StpPortStatus } from '../../types/network';

export interface SwitchStpState {
  switchId: string;
  hostname: string;
  vlanId: number;
  bridgePriority: number;
  sysIdExt: number;
  totalBridgePriority: number;
  bridgeMac: string;
  isRoot: boolean;
  rootBridgeMac: string;
  rootBridgePriority: number;
  rootPathCost: number;
  rootPort: string | null;
  ports: StpPortStatus[];
}

export class SpanningTreeEngine {
  /**
   * Menentukan default STP Cost berdasarkan kecepatan antarmuka (IEEE 802.1D / 802.1w)
   */
  static getDefaultPortCost(ifaceName: string, speed?: string): number {
    const lowerName = ifaceName.toLowerCase();
    if (speed) {
      if (speed.includes('10000') || speed.includes('10G')) return 2;
      if (speed.includes('1000') || speed.includes('1G')) return 4;
      if (speed.includes('100')) return 19;
      if (speed.includes('10')) return 100;
    }
    if (lowerName.startsWith('ten') || lowerName.startsWith('te')) return 2;
    if (lowerName.startsWith('gigabit') || lowerName.startsWith('gi')) return 4;
    if (lowerName.startsWith('fast') || lowerName.startsWith('fa')) return 19;
    return 19;
  }

  /**
   * Mendapatkan Base MAC address dari sebuah switch
   */
  static getBaseMac(sw: Switch): string {
    const vl1 = sw.interfaces.get('Vlan1');
    if (vl1 && vl1.macAddress) return vl1.macAddress;
    const firstIface = Array.from(sw.interfaces.values())[0];
    if (firstIface && firstIface.macAddress) return firstIface.macAddress;
    return `0002.ba00.${sw.id.slice(-4).padStart(4, '0')}`;
  }

  /**
   * Mengambil nomor port dari nama antarmuka untuk port priority
   */
  static getPortNumber(ifaceName: string): number {
    const match = ifaceName.match(/\/(\d+)$/);
    if (match) return parseInt(match[1], 10);
    const numMatch = ifaceName.match(/(\d+)$/);
    if (numMatch) return parseInt(numMatch[1], 10);
    return 1;
  }

  /**
   * Melakukan kalkulasi Spanning Tree lengkap pada topologi untuk VLAN tertentu
   */
  static calculateStp(allDevices: Device[], vlanId: number = 1): Map<string, SwitchStpState> {
    const resultMap = new Map<string, SwitchStpState>();
    const switches = allDevices.filter(d => d instanceof Switch) as Switch[];

    if (switches.length === 0) return resultMap;

    // 1. Hitung Bridge ID masing-masing switch
    interface SwBridgeMeta {
      sw: Switch;
      basePriority: number;
      sysIdExt: number;
      totalPriority: number;
      mac: string;
      bridgeIdString: string;
    }

    const bridgeMetas: SwBridgeMeta[] = switches.map(sw => {
      const basePri = sw.stpPriorities?.get(vlanId) ?? 32768;
      const totalPri = basePri + vlanId;
      const mac = this.getBaseMac(sw);
      const bridgeIdString = `${totalPri.toString().padStart(6, '0')}.${mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase()}`;
      return {
        sw,
        basePriority: basePri,
        sysIdExt: vlanId,
        totalPriority: totalPri,
        mac,
        bridgeIdString
      };
    });

    // 2. Pemilihan Root Bridge: switch dengan bridgeIdString terkecil
    bridgeMetas.sort((a, b) => a.bridgeIdString.localeCompare(b.bridgeIdString));
    const rootMeta = bridgeMetas[0];

    // 3. Bangun Graf Koneksi antar switch
    interface InterSwitchEdge {
      srcSwId: string;
      srcPort: string;
      dstSwId: string;
      dstPort: string;
      cost: number;
    }

    const switchEdges: InterSwitchEdge[] = [];
    const swIdSet = new Set(switches.map(s => s.id));

    for (const sw of switches) {
      for (const iface of sw.interfaces.values()) {
        if (iface.isShutdown || iface.status !== 'up') continue;
        if (!iface.connectedDeviceId || !iface.connectedPort) continue;

        if (swIdSet.has(iface.connectedDeviceId)) {
          const cost = iface.stpCost || this.getDefaultPortCost(iface.name, iface.speed);
          switchEdges.push({
            srcSwId: sw.id,
            srcPort: iface.name,
            dstSwId: iface.connectedDeviceId,
            dstPort: iface.connectedPort,
            cost
          });
        }
      }
    }

    // 4. Hitung Root Path Cost dan Root Port menggunakan Dijkstra dari Root Bridge
    const rootPathCosts = new Map<string, number>();
    const rootPorts = new Map<string, string | null>();
    rootPathCosts.set(rootMeta.sw.id, 0);
    rootPorts.set(rootMeta.sw.id, null);

    // Antrian prioritas Dijkstra
    const unvisited = new Set(switches.map(s => s.id));
    const distances = new Map<string, number>();
    for (const s of switches) {
      distances.set(s.id, s.id === rootMeta.sw.id ? 0 : Infinity);
    }

    while (unvisited.size > 0) {
      // Pilih simpul yang belum dikunjungi dengan jarak terpendek
      let currentSwId: string | null = null;
      let minDistance = Infinity;
      for (const swId of unvisited) {
        const d = distances.get(swId)!;
        if (d < minDistance) {
          minDistance = d;
          currentSwId = swId;
        }
      }

      if (!currentSwId || minDistance === Infinity) break;
      unvisited.delete(currentSwId);

      // Periksa tetangga
      const outgoing = switchEdges.filter(e => e.srcSwId === currentSwId);
      for (const edge of outgoing) {
        if (unvisited.has(edge.dstSwId)) {
          const newDist = minDistance + edge.cost;
          const currentNeighborDist = distances.get(edge.dstSwId)!;
          if (newDist < currentNeighborDist) {
            distances.set(edge.dstSwId, newDist);
            rootPathCosts.set(edge.dstSwId, newDist);
            rootPorts.set(edge.dstSwId, edge.dstPort); // Port pada tetangga yang menerima path
          }
        }
      }
    }

    // 5. Tentukan Status & Role setiap antarmuka pada setiap Switch
    for (const meta of bridgeMetas) {
      const sw = meta.sw;
      const isRoot = sw.id === rootMeta.sw.id;
      const myRootPathCost = distances.get(sw.id) ?? (isRoot ? 0 : 19);
      const myRootPort = rootPorts.get(sw.id) || null;
      const portStatuses: StpPortStatus[] = [];

      for (const iface of sw.interfaces.values()) {
        // Lewati antarmuka SVI (Vlan)
        if (iface.name.startsWith('Vlan')) continue;

        const portNum = this.getPortNumber(iface.name);
        const prio = iface.stpPortPriority || 128;
        const cost = iface.stpCost || this.getDefaultPortCost(iface.name, iface.speed);
        let role: 'Root' | 'Desg' | 'Altn' | 'Back' | 'Disa' = 'Desg';
        let status: 'FWD' | 'BLK' | 'LRN' | 'LIS' | 'DSB' = 'FWD';
        let typeStr = iface.stpPortFast ? 'P2p Edge' : 'P2p';

        if (iface.isShutdown || iface.status !== 'up') {
          role = 'Disa';
          status = 'DSB';
        } else if (!iface.connectedDeviceId) {
          // Port aktif tapi belum tersambung kabel
          role = 'Desg';
          status = 'FWD';
        } else if (!swIdSet.has(iface.connectedDeviceId)) {
          // Terhubung ke Host, Server, Cloud, atau Router (Edge / Access)
          role = 'Desg';
          status = 'FWD';
          typeStr = iface.stpPortFast ? 'P2p Edge' : 'P2p';
        } else {
          // Terhubung ke Switch lain (Inter-switch link)
          if (isRoot) {
            // Pada Root Bridge, seluruh port inter-switch aktif adalah Designated Port
            role = 'Desg';
            status = 'FWD';
          } else if (iface.name === myRootPort) {
            // Ini adalah Root Port dari switch ini
            role = 'Root';
            status = 'FWD';
          } else {
            // Redundant Link antar switch: putuskan siapa Designated dan siapa Alternate (Blocking)
            const peerSwId = iface.connectedDeviceId;
            const peerDist = distances.get(peerSwId) ?? Infinity;
            const peerMeta = bridgeMetas.find(m => m.sw.id === peerSwId);

            if (myRootPathCost < peerDist) {
              // Kita memiliki path cost lebih rendah -> Kita Designated
              role = 'Desg';
              status = 'FWD';
            } else if (myRootPathCost > peerDist) {
              // Tetangga memiliki path cost lebih rendah -> Kita Alternate (Blocking)
              role = 'Altn';
              status = 'BLK';
            } else {
              // Path cost sama: tie-breaker berdasarkan Bridge ID
              if (meta.bridgeIdString.localeCompare(peerMeta?.bridgeIdString || '') < 0) {
                role = 'Desg';
                status = 'FWD';
              } else {
                role = 'Altn';
                status = 'BLK';
              }
            }
          }
        }

        // Terapkan ke interface object
        iface.stpRole = role;
        iface.stpState = status === 'FWD' ? 'forwarding' : status === 'BLK' ? 'blocking' : 'disabled';

        portStatuses.push({
          portName: iface.shortName || iface.name,
          role,
          status,
          cost,
          priority: prio,
          portNumber: portNum,
          type: typeStr
        });
      }

      resultMap.set(sw.id, {
        switchId: sw.id,
        hostname: sw.hostname,
        vlanId,
        bridgePriority: meta.basePriority,
        sysIdExt: meta.sysIdExt,
        totalBridgePriority: meta.totalPriority,
        bridgeMac: meta.mac,
        isRoot,
        rootBridgeMac: rootMeta.mac,
        rootBridgePriority: rootMeta.totalPriority,
        rootPathCost: myRootPathCost,
        rootPort: myRootPort,
        ports: portStatuses
      });
    }

    return resultMap;
  }

  /**
   * Format output otentik Cisco IOS: 'show spanning-tree'
   */
  static renderShowSpanningTree(switchDev: Switch, allDevices: Device[], vlanId: number = 1): string {
    const stpMap = this.calculateStp(allDevices, vlanId);
    const myState = stpMap.get(switchDev.id);

    if (!myState) {
      return `% Spanning tree instance not found for VLAN ${vlanId}.`;
    }

    const protoName = switchDev.spanningTreeMode === 'rapid-pvst' ? 'rstp' : switchDev.spanningTreeMode === 'mst' ? 'mstp' : 'ieee';
    const vlanStr = `VLAN${vlanId.toString().padStart(4, '0')}`;

    const lines: string[] = [
      vlanStr,
      `  Spanning tree enabled protocol ${protoName}`
    ];

    // Root ID block
    lines.push(`  Root ID    Priority    ${myState.rootBridgePriority}`);
    lines.push(`             Address     ${myState.rootBridgeMac}`);
    if (myState.isRoot) {
      lines.push(`             This bridge is the root`);
      lines.push(`             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec`);
    } else {
      lines.push(`             Cost        ${myState.rootPathCost}`);
      lines.push(`             Port        ${myState.rootPort ? (switchDev.interfaces.get(myState.rootPort)?.shortName || myState.rootPort) : 'None'}`);
      lines.push(`             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec`);
    }

    lines.push('');

    // Bridge ID block
    lines.push(`  Bridge ID  Priority    ${myState.totalBridgePriority}  (priority ${myState.bridgePriority} sys-id-ext ${myState.sysIdExt})`);
    lines.push(`             Address     ${myState.bridgeMac}`);
    lines.push(`             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec`);
    lines.push(`             Aging Time  300 sec`);

    lines.push('');
    lines.push('Interface           Role Sts Cost      Prio.Nbr Type');
    lines.push('------------------- ---- --- --------- -------- --------------------------------');

    for (const p of myState.ports) {
      const portCol = p.portName.padEnd(19);
      const roleCol = p.role.padEnd(4);
      const stsCol = p.status.padEnd(3);
      const costCol = p.cost.toString().padEnd(9);
      const prioCol = `${p.priority}.${p.portNumber}`.padEnd(8);
      lines.push(`${portCol} ${roleCol} ${stsCol} ${costCol} ${prioCol} ${p.type}`);
    }

    return lines.join('\n');
  }

  /**
   * Format output otentik Cisco IOS: 'show spanning-tree summary'
   */
  static renderShowSpanningTreeSummary(switchDev: Switch, allDevices: Device[]): string {
    const stpMap = this.calculateStp(allDevices, 1);
    const myState = stpMap.get(switchDev.id);

    const isPvst = switchDev.spanningTreeMode === 'pvst';
    const isRapid = switchDev.spanningTreeMode === 'rapid-pvst';

    let blockingCount = 0;
    let forwardingCount = 0;
    if (myState) {
      for (const p of myState.ports) {
        if (p.status === 'BLK') blockingCount++;
        if (p.status === 'FWD') forwardingCount++;
      }
    }

    return [
      `Switch is in ${isRapid ? 'rapid-pvst' : isPvst ? 'pvst' : 'mst'} mode`,
      `Root bridge for: ${myState?.isRoot ? 'VLAN0001' : 'none'}`,
      `Extended system ID           is enabled`,
      `Portfast Default             is disabled`,
      `PortFast BPDU Guard Default  is disabled`,
      `Portfast BPDU Filter Default is disabled`,
      `Loopguard Default            is disabled`,
      `EtherChannel misconfig guard is enabled`,
      `UplinkFast                   is disabled`,
      `BackboneFast                 is disabled`,
      `Configured Pathcost method used is short`,
      ``,
      `Name                   Blocking Listening Learning Forwarding STP Active`,
      `---------------------- -------- --------- -------- ---------- ----------`,
      `VLAN0001                      ${blockingCount}         0        0          ${forwardingCount}          ${blockingCount + forwardingCount}`,
      `---------------------- -------- --------- -------- ---------- ----------`,
      `1 operational IEEE spanning-tree domain`
    ].join('\n');
  }

  /**
   * Format output otentik Cisco IOS: 'show spanning-tree root'
   */
  static renderShowSpanningTreeRoot(switchDev: Switch, allDevices: Device[]): string {
    const stpMap = this.calculateStp(allDevices, 1);
    const myState = stpMap.get(switchDev.id);

    return [
      `                                        Root    Hello Max Fwd`,
      `Vlan                   Root ID          Cost    Time  Age Dly  Root Port`,
      `---------------- -------------------- --------- ----- --- ---  ----------------`,
      `VLAN0001         ${myState?.rootBridgePriority.toString().padStart(5)} ${myState?.rootBridgeMac}         ${myState?.rootPathCost.toString().padStart(2)}     2   20  15  ${myState?.rootPort ? (switchDev.interfaces.get(myState.rootPort)?.shortName || myState.rootPort) : '-'}`
    ].join('\n');
  }
}
