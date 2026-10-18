/**
 * VrfEngine.ts
 * Mesin Virtual Routing and Forwarding (VRF-Lite) dan MPLS Forwarding (LFIB & LDP)
 * Sesuai Standar Cisco CCNP Enterprise v9 (ENCOR 350-401 & ENARSI 300-410).
 */

import { Device } from '../devices/Device';
import { Router } from '../devices/Router';
import { Switch } from '../devices/Switch';
import { VrfConfig, RouteEntry, MplsLabelEntry, MplsLdpNeighbor } from '../../types/network';
import { SubnetUtils } from './Subnet';

export class VrfEngine {
  /**
   * Mengambil atau membuat objek VrfConfig pada Router atau Switch L3
   */
  static getOrCreateVrf(device: Router | Switch, name: string): VrfConfig {
    if (!device.vrfInstances) {
      device.vrfInstances = new Map();
    }
    const cleanName = name.trim();
    let vrf = device.vrfInstances.get(cleanName);
    if (!vrf) {
      vrf = {
        name: cleanName,
        routeTargets: [],
        interfaces: [],
        routingTable: [],
        arpTable: new Map()
      };
      device.vrfInstances.set(cleanName, vrf);
    }
    return vrf;
  }

  /**
   * Menghapus VRF dan mereset antarmuka yang terikat
   */
  static removeVrf(device: Router | Switch, name: string): boolean {
    if (!device.vrfInstances || !device.vrfInstances.has(name)) return false;
    const vrf = device.vrfInstances.get(name)!;
    for (const ifName of vrf.interfaces) {
      const ifc = device.getInterface(ifName);
      if (ifc && ifc.vrf === name) {
        delete ifc.vrf;
      }
    }
    device.vrfInstances.delete(name);
    device.updateConnectedRoutes();
    return true;
  }

  /**
   * Mengikat antarmuka ke instans VRF (vrf forwarding <name>)
   */
  static assignInterfaceToVrf(device: Router | Switch, interfaceName: string, vrfName: string): boolean {
    const ifc = device.getInterface(interfaceName);
    if (!ifc) return false;

    const vrf = this.getOrCreateVrf(device, vrfName);

    // Hapus dari VRF lama jika ada
    if (ifc.vrf && ifc.vrf !== vrfName) {
      const oldVrf = device.vrfInstances.get(ifc.vrf);
      if (oldVrf) {
        oldVrf.interfaces = oldVrf.interfaces.filter(i => i !== ifc.name);
      }
    }

    ifc.vrf = vrf.name;
    if (!vrf.interfaces.includes(ifc.name)) {
      vrf.interfaces.push(ifc.name);
    }

    device.updateConnectedRoutes();
    return true;
  }

  /**
   * Melepas antarmuka dari VRF ke tabel perutean global (no vrf forwarding)
   */
  static unassignInterfaceFromVrf(device: Router | Switch, interfaceName: string): boolean {
    const ifc = device.getInterface(interfaceName);
    if (!ifc || !ifc.vrf) return false;

    const oldVrf = device.vrfInstances.get(ifc.vrf);
    if (oldVrf) {
      oldVrf.interfaces = oldVrf.interfaces.filter(i => i !== ifc.name);
    }

    delete ifc.vrf;
    device.updateConnectedRoutes();
    return true;
  }

  /**
   * Mengaktifkan MPLS pada antarmuka (mpls ip)
   */
  static enableMplsOnInterface(device: Router | Switch, interfaceName: string): boolean {
    const ifc = device.getInterface(interfaceName);
    if (!ifc) return false;
    ifc.mplsEnabled = true;
    device.mplsEnabled = true;
    if (!device.mplsInterfaces) {
      device.mplsInterfaces = new Set();
    }
    device.mplsInterfaces.add(ifc.name);
    return true;
  }

  /**
   * Menonaktifkan MPLS pada antarmuka (no mpls ip)
   */
  static disableMplsOnInterface(device: Router | Switch, interfaceName: string): boolean {
    const ifc = device.getInterface(interfaceName);
    if (!ifc) return false;
    ifc.mplsEnabled = false;
    if (device.mplsInterfaces) {
      device.mplsInterfaces.delete(ifc.name);
      if (device.mplsInterfaces.size === 0) {
        device.mplsEnabled = false;
      }
    }
    return true;
  }

  /**
   * Melakukan konvergensi LDP dan membangun tabel LFIB (Label Forwarding Information Base)
   */
  static convergeMpls(allDevices: Device[]): void {
    const mplsNodes = allDevices.filter(d => (d instanceof Router || (d instanceof Switch && d.isLayer3)) && d.mplsEnabled) as (Router | Switch)[];

    for (const node of mplsNodes) {
      node.lfib = [];
      let labelCounter = 16;

      // Alokasikan label lokal untuk setiap rute IGP / Connected
      const routesToLabel = node.routingTable.filter(r => r.network !== '0.0.0.0');
      for (const route of routesToLabel) {
        const inLabel = labelCounter++;
        let outLabel: number | 'Pop Label' | 'Untagged' = 'Pop Label';

        // Temukan peer next-hop jika ada
        if (route.nextHop) {
          // Cari perangkat peer yang memiliki IP nextHop
          let peerDev: (Router | Switch) | undefined;
          for (const other of mplsNodes) {
            if (other.id !== node.id) {
              for (const ifc of other.interfaces.values()) {
                if (ifc.ipAddress === route.nextHop && ifc.mplsEnabled) {
                  peerDev = other;
                  break;
                }
              }
            }
            if (peerDev) break;
          }

          if (peerDev) {
            // Jika peer memiliki rute lebih jauh untuk prefix yang sama, alokasikan label numerik (SWAP)
            const peerRoute = peerDev.routingTable.find(r => r.network === route.network && r.cidr === route.cidr);
            if (peerRoute && peerRoute.protocol !== 'C' && peerRoute.protocol !== 'L') {
              outLabel = 18; // Label dinamis downstream swap
            } else {
              outLabel = 'Pop Label'; // PHP (Penultimate Hop Popping)
            }
          }
        }

        const outIfaceName = route.exitInterface || 'GigabitEthernet0/0/1';
        node.lfib.push({
          inLabel,
          prefix: `${route.network}/${route.cidr}`,
          outLabel,
          nextHop: route.nextHop,
          outInterface: outIfaceName
        });
      }
    }
  }

  // ===================== DIAGNOSTIC RENDERERS =====================

  static renderShowVrf(device: Router | Switch): string {
    if (!device.vrfInstances || device.vrfInstances.size === 0) {
      return 'No VRFs configured.\n';
    }

    const lines: string[] = [];
    lines.push('Name                             Default RD          Protocols   Interfaces');
    for (const vrf of device.vrfInstances.values()) {
      const rd = vrf.rd ? vrf.rd.padEnd(20) : '<not set>'.padEnd(20);
      const name = vrf.name.padEnd(33);
      const ifaces = vrf.interfaces.join(', ');
      lines.push(`${name}${rd}ipv4        ${ifaces}`);
    }
    return lines.join('\n') + '\n';
  }

  static renderShowIpRouteVrf(device: Router | Switch, vrfName: string): string {
    const vrf = device.vrfInstances?.get(vrfName);
    if (!vrf) {
      return `% VRF ${vrfName} does not exist.\n`;
    }

    const lines: string[] = [
      `Routing Table: ${vrfName}`,
      'Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP',
      '       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area',
      '       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2',
      '       E1 - OSPF external type 1, E2 - OSPF external type 2',
      '       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2',
      '       ia - IS-IS inter area, * - candidate default, U - per-user static route',
      '       o - ODR, P - periodic downloaded static route, H - NHRP, l - LISP',
      '       a - application route',
      '       + - replicated route, % - next hop override',
      '',
      'Gateway of last resort is not set',
      ''
    ];

    if (vrf.routingTable.length === 0) {
      lines.push('% Network not in table');
      return lines.join('\n') + '\n';
    }

    for (const r of vrf.routingTable) {
      const protoCode = r.protocol.padEnd(8);
      if (r.protocol === 'C') {
        lines.push(`${protoCode} ${r.network}/${r.cidr} is directly connected, ${r.exitInterface || ''}`);
      } else if (r.protocol === 'L') {
        lines.push(`${protoCode} ${r.network}/${r.cidr} is directly connected, ${r.exitInterface || ''}`);
      } else if (r.protocol === 'S') {
        const next = r.exitInterface || `via ${r.nextHop}`;
        lines.push(`${protoCode} ${r.network}/${r.cidr} [${r.adminDistance}/${r.metric}] ${next}`);
      } else {
        const next = r.exitInterface || `via ${r.nextHop}`;
        lines.push(`${protoCode} ${r.network}/${r.cidr} [${r.adminDistance}/${r.metric}] ${next}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  static renderShowIpArpVrf(device: Router | Switch, vrfName: string): string {
    const vrf = device.vrfInstances?.get(vrfName);
    if (!vrf) {
      return `% VRF ${vrfName} does not exist.\n`;
    }

    const lines: string[] = [
      `Protocol  Address          Age (min)  Hardware Addr   Type   Interface`,
    ];

    const vrfIfSet = new Set(vrf.interfaces);
    for (const entry of device.arpTable) {
      if (vrfIfSet.has(entry.interfaceName)) {
        const proto = (entry.protocol || 'Internet').padEnd(9);
        const ip = entry.ipAddress.padEnd(16);
        const age = (entry.age !== undefined && entry.age !== 0 ? entry.age.toString() : '-').padEnd(10);
        const mac = entry.macAddress.padEnd(15);
        const type = (entry.type || 'ARPA').padEnd(6);
        lines.push(`${proto} ${ip} ${age} ${mac} ${type} ${entry.interfaceName}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  static renderShowMplsInterfaces(device: Router | Switch): string {
    const lines: string[] = [
      'Interface                  IP            Tunnel   Operational',
    ];

    for (const ifc of device.interfaces.values()) {
      if (ifc.mplsEnabled) {
        const ifName = ifc.name.padEnd(26);
        lines.push(`${ifName} Yes (ldp)     No       Yes`);
      }
    }

    if (lines.length === 1) {
      return 'MPLS not enabled on any interface.\n';
    }

    return lines.join('\n') + '\n';
  }

  static renderShowMplsLdpNeighbor(device: Router | Switch, allDevices: Device[]): string {
    if (!device.mplsEnabled) {
      return '% MPLS not enabled on this router.\n';
    }

    const lines: string[] = [];
    const localRouterId = device.mplsLdpRouterId ||
      Array.from(device.interfaces.values()).find(i => i.ipAddress && !i.isShutdown)?.ipAddress || '192.168.1.1';

    for (const ifc of device.interfaces.values()) {
      if (ifc.mplsEnabled && ifc.connectedDeviceId && ifc.connectedPort) {
        const peer = allDevices.find(d => d.id === ifc.connectedDeviceId);
        if (peer && (peer instanceof Router || (peer instanceof Switch && peer.isLayer3)) && peer.mplsEnabled) {
          const peerIface = peer.getInterface(ifc.connectedPort);
          if (peerIface && peerIface.mplsEnabled && peerIface.ipAddress) {
            const peerRouterId = peer.mplsLdpRouterId || peerIface.ipAddress;
            lines.push(`    Peer LDP Ident: ${peerRouterId}:0; Local LDP Ident ${localRouterId}:0`);
            lines.push(`        TCP connection: ${peerIface.ipAddress}.646 - ${ifc.ipAddress || '192.168.1.1'}.48291`);
            lines.push(`        State: Oper; Msgs sent/rcvd: 28/28; Downstream`);
            lines.push(`        Up time: 00:08:45`);
            lines.push(`        LDP Discovery Sources:`);
            lines.push(`          ${ifc.name}, Src IP addr: ${peerIface.ipAddress}`);
          }
        }
      }
    }

    if (lines.length === 0) {
      return 'No LDP neighbors found.\n';
    }

    return lines.join('\n') + '\n';
  }

  static renderShowMplsForwardingTable(device: Router | Switch): string {
    if (!device.mplsEnabled || !device.lfib || device.lfib.length === 0) {
      return 'Local  Outgoing    Prefix            Bytes Label   Outgoing   Next Hop\nLabel  Label       or Tunnel Id      Switched      interface\n';
    }

    const lines: string[] = [
      'Local  Outgoing    Prefix            Bytes Label   Outgoing   Next Hop',
      'Label  Label       or Tunnel Id      Switched      interface'
    ];

    for (const entry of device.lfib) {
      const inLbl = entry.inLabel.toString().padEnd(6);
      const outLbl = entry.outLabel.toString().padEnd(11);
      const pfx = entry.prefix.padEnd(17);
      const bytes = '0'.padEnd(13);
      const ifc = (entry.outInterface || 'Gi0/0/1').padEnd(10);
      const nh = entry.nextHop || 'Pop Label';
      lines.push(`${inLbl} ${outLbl} ${pfx} ${bytes} ${ifc} ${nh}`);
    }

    return lines.join('\n') + '\n';
  }
}
