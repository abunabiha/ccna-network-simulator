/**
 * FhrpEngine.ts
 * Mesin kalkulasi First Hop Redundancy Protocols (HSRP & VRRP) Cisco IOS
 * Mendukung:
 * 1. Cisco HSRP v1/v2 (Active, Standby, Listen state election, Preempt, Virtual MAC)
 * 2. VRRP v2/v3 (Master, Backup state election)
 * 3. Resolusi Virtual Gateway IP untuk transmisi data Host ke Active Gateway
 * 4. Format otentik Cisco 'show standby [brief]' & 'show vrrp [brief]'
 */

import { Device } from '../devices/Device';
import { Router } from '../devices/Router';
import { Switch } from '../devices/Switch';
import { SubnetUtils } from './Subnet';
import { InterfaceConfig } from '../../types/network';

export class FhrpEngine {
  /**
   * Evaluasi dan sinkronisasi status HSRP & VRRP pada seluruh perangkat di topologi
   */
  static evaluateFhrp(allDevices: Device[]): void {
    const l3Nodes = allDevices.filter(d => d instanceof Router || (d instanceof Switch && d.isLayer3));

    // Kumpulkan seluruh antarmuka yang mengaktifkan HSRP
    interface HsrpCandidate {
      node: Device;
      iface: InterfaceConfig;
      group: number;
      vip: string;
      priority: number;
      preempt: boolean;
      ipLong: number;
    }

    const hsrpGroups = new Map<string, HsrpCandidate[]>();

    for (const node of l3Nodes) {
      for (const iface of new Set(node.interfaces.values())) {
        if (iface.isShutdown || iface.status !== 'up' || !iface.ipAddress || !iface.subnetMask) continue;
        if (iface.hsrp) {
          const key = `${iface.hsrp.group}_${iface.hsrp.virtualIp}`;
          const candidate: HsrpCandidate = {
            node,
            iface,
            group: iface.hsrp.group,
            vip: iface.hsrp.virtualIp,
            priority: iface.hsrp.priority ?? 100,
            preempt: iface.hsrp.preempt ?? false,
            ipLong: SubnetUtils.ipToLong(iface.ipAddress)
          };
          const list = hsrpGroups.get(key) || [];
          list.push(candidate);
          hsrpGroups.set(key, list);
        }
      }
    }

    // Pemilihan Active & Standby untuk setiap HSRP group
    for (const candidates of hsrpGroups.values()) {
      // Urutkan berdasarkan prioritas tertinggi, jika sama urutkan berdasarkan IP tertinggi
      candidates.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.ipLong - a.ipLong;
      });

      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        if (i === 0) {
          c.iface.hsrp!.state = 'Active';
        } else if (i === 1) {
          c.iface.hsrp!.state = 'Standby';
        } else {
          c.iface.hsrp!.state = 'Listen';
        }
        c.iface.hsrp!.virtualMac = c.iface.hsrp!.version === 2
          ? `0000.0c9f.f${c.iface.hsrp!.group.toString(16).padStart(3, '0')}`
          : `0000.0c07.ac${c.iface.hsrp!.group.toString(16).padStart(2, '0')}`;
      }
    }

    // Evaluasi VRRP
    interface VrrpCandidate {
      node: Device;
      iface: InterfaceConfig;
      group: number;
      vip: string;
      priority: number;
      ipLong: number;
    }

    const vrrpGroups = new Map<string, VrrpCandidate[]>();

    for (const node of l3Nodes) {
      for (const iface of new Set(node.interfaces.values())) {
        if (iface.isShutdown || iface.status !== 'up' || !iface.ipAddress || !iface.subnetMask) continue;
        if (iface.vrrp) {
          const key = `${iface.vrrp.group}_${iface.vrrp.virtualIp}`;
          const candidate: VrrpCandidate = {
            node,
            iface,
            group: iface.vrrp.group,
            vip: iface.vrrp.virtualIp,
            priority: iface.vrrp.priority ?? 100,
            ipLong: SubnetUtils.ipToLong(iface.ipAddress)
          };
          const list = vrrpGroups.get(key) || [];
          list.push(candidate);
          vrrpGroups.set(key, list);
        }
      }
    }

    for (const candidates of vrrpGroups.values()) {
      candidates.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.ipLong - a.ipLong;
      });

      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        if (i === 0) {
          c.iface.vrrp!.state = 'Master';
        } else {
          c.iface.vrrp!.state = 'Backup';
        }
        c.iface.vrrp!.virtualMac = `0000.5e00.01${c.iface.vrrp!.group.toString(16).padStart(2, '0')}`;
      }
    }
  }

  /**
   * Alias untuk sinkronisasi FHRP seluruh topologi
   */
  static convergeFhrp(allDevices: Device[]): void {
    this.evaluateFhrp(allDevices);
  }

  /**
   * Mencari Router atau L3 Switch yang bertindak sebagai Active Gateway untuk Virtual IP tertentu
   */
  static resolveVirtualGateway(virtualIp: string, allDevices: Device[]): { node: Device; iface: InterfaceConfig; activeDevice: Device; activeInterface: InterfaceConfig } | null {
    this.evaluateFhrp(allDevices);

    for (const node of allDevices) {
      for (const iface of new Set(node.interfaces.values())) {
        if (iface.isShutdown || iface.status !== 'up') continue;
        if (iface.hsrp && iface.hsrp.virtualIp === virtualIp && iface.hsrp.state === 'Active') {
          return { node, iface, activeDevice: node, activeInterface: iface };
        }
        if (iface.vrrp && iface.vrrp.virtualIp === virtualIp && iface.vrrp.state === 'Master') {
          return { node, iface, activeDevice: node, activeInterface: iface };
        }
      }
    }
    return null;
  }

  // ===================== SHOW STANDBY RENDERING =====================
  static renderShowStandby(node: Device, allDevicesOrBrief?: Device[] | boolean, brief: boolean = false): string {
    let allDevices: Device[] = [];
    let isBrief = brief;
    if (Array.isArray(allDevicesOrBrief)) {
      allDevices = allDevicesOrBrief;
    } else if (typeof allDevicesOrBrief === 'boolean') {
      isBrief = allDevicesOrBrief;
    }
    this.evaluateFhrp(allDevices);

    const hsrpIfaces = Array.from(new Set(node.interfaces.values())).filter(i => i.hsrp);
    if (hsrpIfaces.length === 0) {
      return '% HSRP not configured on this device';
    }

    if (isBrief) {
      const lines: string[] = [
        '                     P indicates configured to preempt.',
        '                     |',
        'Interface   Grp  Pri P State   Active          Standby         Virtual IP',
        '----------- ---- --- - ------- --------------- --------------- ---------------'
      ];

      for (const ifc of hsrpIfaces) {
        const h = ifc.hsrp!;
        const ifCol = (ifc.shortName || ifc.name).padEnd(11);
        const grpCol = h.group.toString().padEnd(4);
        const priCol = (h.priority ?? 100).toString().padEnd(3);
        const pCol = h.preempt ? 'P' : ' ';
        const stateCol = (h.state || 'Init').padEnd(7);

        // Cari siapa yang active dan standby di grup ini
        let activeIp = h.state === 'Active' ? 'local' : 'unknown';
        let standbyIp = h.state === 'Standby' ? 'local' : 'unknown';

        for (const other of allDevices) {
          if (other.id === node.id) continue;
          for (const oIf of other.interfaces.values()) {
            if (oIf.hsrp && oIf.hsrp.group === h.group && oIf.hsrp.virtualIp === h.virtualIp) {
              if (oIf.hsrp.state === 'Active') activeIp = oIf.ipAddress || 'unknown';
              if (oIf.hsrp.state === 'Standby') standbyIp = oIf.ipAddress || 'unknown';
            }
          }
        }

        const actCol = activeIp.padEnd(15);
        const stdCol = standbyIp.padEnd(15);
        const vipCol = h.virtualIp;

        lines.push(`${ifCol} ${grpCol} ${priCol} ${pCol} ${stateCol} ${actCol} ${stdCol} ${vipCol}`);
      }

      return lines.join('\n');
    }

    // Detail format
    const blocks: string[] = [];
    for (const ifc of hsrpIfaces) {
      const h = ifc.hsrp!;
      const vMac = h.version === 2 ? `0000.0c9f.f${h.group.toString(16).padStart(3, '0')}` : `0000.0c07.ac${h.group.toString(16).padStart(2, '0')}`;
      blocks.push([
        `${ifc.name} - Group ${h.group} (version ${h.version || 1})`,
        `  State is ${h.state || 'Init'}`,
        `  Virtual IP address is ${h.virtualIp}`,
        `  Active virtual MAC address is ${vMac}`,
        `    Local virtual MAC address is ${vMac} (v${h.version || 1} default)`,
        `  Hello time 3 sec, hold time 10 sec`,
        `  Next hello sent in 1.452 secs`,
        `  Preemption is ${h.preempt ? 'enabled' : 'disabled'}`,
        `  Active router is ${h.state === 'Active' ? 'local' : 'remote'}`,
        `  Standby router is ${h.state === 'Standby' ? 'local' : 'remote'}`,
        `  Priority ${h.priority ?? 100} (default 100)`,
        `  Group name is "hsrp-${ifc.shortName}-${h.group}" (default)`
      ].join('\n'));
    }

    return blocks.join('\n\n');
  }

  // ===================== SHOW VRRP RENDERING =====================
  static renderShowVrrp(node: Device, allDevicesOrBrief?: Device[] | boolean, brief: boolean = false): string {
    let allDevices: Device[] = [];
    let isBrief = brief;
    if (Array.isArray(allDevicesOrBrief)) {
      allDevices = allDevicesOrBrief;
    } else if (typeof allDevicesOrBrief === 'boolean') {
      isBrief = allDevicesOrBrief;
    }
    this.evaluateFhrp(allDevices);

    const vrrpIfaces = Array.from(new Set(node.interfaces.values())).filter(i => i.vrrp);
    if (vrrpIfaces.length === 0) {
      return '% VRRP not configured on this device';
    }

    if (isBrief) {
      const lines: string[] = [
        'Interface          Grp Pri Time  Own Pre State   Master addr     Group addr',
        '------------------ --- --- ----- --- --- ------- --------------- ---------------'
      ];

      for (const ifc of vrrpIfaces) {
        const v = ifc.vrrp!;
        const ifCol = (ifc.shortName || ifc.name).padEnd(18);
        const grpCol = v.group.toString().padEnd(3);
        const priCol = (v.priority ?? 100).toString().padEnd(3);
        const timeCol = '3214 ';
        const ownCol = ' - ';
        const preCol = v.preempt ? ' Y ' : ' N ';
        const stateCol = (v.state || 'Init').padEnd(7);

        let masterIp = v.state === 'Master' ? (ifc.ipAddress || 'local') : 'unknown';
        for (const other of allDevices) {
          if (other.id === node.id) continue;
          for (const oIf of other.interfaces.values()) {
            if (oIf.vrrp && oIf.vrrp.group === v.group && oIf.vrrp.virtualIp === v.virtualIp) {
              if (oIf.vrrp.state === 'Master') masterIp = oIf.ipAddress || 'unknown';
            }
          }
        }

        const masterCol = masterIp.padEnd(15);
        lines.push(`${ifCol} ${grpCol} ${priCol} ${timeCol} ${ownCol} ${preCol} ${stateCol} ${masterCol} ${v.virtualIp}`);
      }

      return lines.join('\n');
    }

    const blocks: string[] = [];
    for (const ifc of vrrpIfaces) {
      const v = ifc.vrrp!;
      blocks.push([
        `${ifc.name} - Group ${v.group}`,
        `  State is ${v.state || 'Init'}`,
        `  Virtual IP address is ${v.virtualIp}`,
        `  Virtual MAC address is 0000.5e00.01${v.group.toString(16).padStart(2, '0')}`,
        `  Master Router is ${v.state === 'Master' ? ifc.ipAddress : 'remote'}, priority is ${v.priority ?? 100}`,
        `  Advertisement interval is 1.000 sec`,
        `  Preemption is ${v.preempt ? 'enabled' : 'disabled'}`,
        `  Priority is ${v.priority ?? 100}`
      ].join('\n'));
    }

    return blocks.join('\n\n');
  }
}
