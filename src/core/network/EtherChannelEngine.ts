/**
 * EtherChannelEngine.ts
 * Mesin kalkulasi dan negosiasi Link Aggregation (EtherChannel) Cisco IOS
 * Mendukung:
 * 1. LACP (IEEE 802.3ad): mode active & passive
 * 2. PAgP (Cisco Proprietary): mode desirable & auto
 * 3. Static EtherChannel: mode on
 * 4. Format 'show etherchannel summary' & 'show etherchannel port-channel' otentik Cisco
 */

import { Device } from '../devices/Device';
import { Switch } from '../devices/Switch';

export interface EtherChannelMemberPort {
  name: string;
  shortName: string;
  flag: 'P' | 's' | 'D' | 'w' | 'I'; // P: Bundled, s: Suspended, D: Down, w: Waiting, I: Standalone
}

export interface EtherChannelBundleResult {
  groupId: number;
  poName: string;
  protocol: 'LACP' | 'PAgP' | '-';
  status: 'SU' | 'SD' | 'RU' | 'RD'; // S=L2, R=L3, U=In use, D=Down
  ports: EtherChannelMemberPort[];
}

export class EtherChannelEngine {
  /**
   * Evaluasi seluruh channel-group yang aktif pada switch
   */
  static evaluateBundles(switchDev: Switch, allDevices: Device[]): EtherChannelBundleResult[] {
    const results: EtherChannelBundleResult[] = [];
    const groupIds = new Set<number>();

    // Temukan seluruh channel-group ID yang terkonfigurasi pada port switch ini
    for (const iface of switchDev.interfaces.values()) {
      if (iface.channelGroup) {
        groupIds.add(iface.channelGroup);
      }
    }

    for (const gid of Array.from(groupIds).sort((a, b) => a - b)) {
      const memberIfaces = Array.from(switchDev.interfaces.values()).filter(i => i.channelGroup === gid);
      if (memberIfaces.length === 0) continue;

      const firstMode = memberIfaces[0].channelMode || 'on';
      let proto: 'LACP' | 'PAgP' | '-' = '-';
      if (firstMode === 'active' || firstMode === 'passive') proto = 'LACP';
      else if (firstMode === 'desirable' || firstMode === 'auto') proto = 'PAgP';
      else proto = '-';

      // Pastikan interface Port-channel<gid> terdaftar pada switch
      const poName = `Port-channel${gid}`;
      if (!switchDev.interfaces.has(poName)) {
        const baseMac = Array.from(switchDev.interfaces.values())[0]?.macAddress || '0002.ba00.0001';
        switchDev.addInterface({
          name: poName,
          shortName: `Po${gid}`,
          macAddress: baseMac,
          status: 'up',
          isShutdown: false,
          switchportMode: memberIfaces[0].switchportMode || 'access',
          accessVlan: memberIfaces[0].accessVlan || 1,
          trunkAllowedVlans: memberIfaces[0].trunkAllowedVlans || Array.from({ length: 4094 }, (_, idx) => idx + 1),
          nativeVlan: memberIfaces[0].nativeVlan || 1
        });
      }

      const poIface = switchDev.interfaces.get(poName);
      const isLayer3 = poIface?.switchportMode === 'none';

      // Evaluasi masing-masing member port terhadap ujung seberang (peer)
      const evaluatedMembers: EtherChannelMemberPort[] = [];
      let anyBundled = false;

      for (const iface of memberIfaces) {
        const short = iface.shortName || iface.name;
        if (iface.isShutdown || iface.status !== 'up' || !iface.connectedDeviceId || !iface.connectedPort) {
          evaluatedMembers.push({ name: iface.name, shortName: short, flag: 'D' });
          continue;
        }

        const peerDev = allDevices.find(d => d.id === iface.connectedDeviceId);
        const peerIface = peerDev?.interfaces.get(iface.connectedPort);

        if (!peerDev || !peerIface || peerIface.isShutdown || peerIface.status !== 'up') {
          evaluatedMembers.push({ name: iface.name, shortName: short, flag: 'D' });
          continue;
        }

        // Cek mode negosiasi
        const localMode = iface.channelMode || 'on';
        const peerMode = peerIface.channelMode;

        let bundled = false;

        if (localMode === 'on' && peerMode === 'on') {
          // Static EtherChannel
          bundled = true;
        } else if (localMode === 'active' || localMode === 'passive') {
          // LACP: minimal salah satu sisi harus 'active'
          if (peerMode === 'active' || (localMode === 'active' && peerMode === 'passive')) {
            bundled = true;
          }
        } else if (localMode === 'desirable' || localMode === 'auto') {
          // PAgP: minimal salah satu sisi harus 'desirable'
          if (peerMode === 'desirable' || (localMode === 'desirable' && peerMode === 'auto')) {
            bundled = true;
          }
        }

        if (bundled) {
          anyBundled = true;
          evaluatedMembers.push({ name: iface.name, shortName: short, flag: 'P' });
        } else {
          evaluatedMembers.push({ name: iface.name, shortName: short, flag: 's' }); // Suspended
        }
      }

      const poStatus = `${isLayer3 ? 'R' : 'S'}${anyBundled ? 'U' : 'D'}` as 'SU' | 'SD' | 'RU' | 'RD';

      // Update status interface Port-channel
      if (poIface) {
        poIface.status = anyBundled ? 'up' : 'down';
      }

      results.push({
        groupId: gid,
        poName: `Po${gid}`,
        protocol: proto,
        status: poStatus,
        ports: evaluatedMembers
      });
    }

    return results;
  }

  /**
   * Format otentik Cisco IOS: 'show etherchannel summary'
   */
  static renderShowEtherchannelSummary(switchDev: Switch, allDevices: Device[], targetGid?: number): string {
    const bundles = this.evaluateBundles(switchDev, allDevices);
    const filtered = typeof targetGid === 'number' ? bundles.filter(b => b.groupId === targetGid) : bundles;

    const lines: string[] = [
      'Flags:  D - down        P - bundled in port-channel',
      '        I - stand-alone s - suspended',
      '        H - Hot-standby (LACP only)',
      '        R - Layer3      S - Layer2',
      '        U - in use      N - not in use, dot1q-security',
      '        f - failed to allocate aggregator',
      '',
      '        M - not in use, minimum links not met',
      '        m - not in use, port not aggregated due to minimum links not met',
      '        u - unsuitable for bundling',
      '        w - waiting to be aggregated',
      '        d - default port',
      '',
      `Number of channel-groups in use: ${filtered.length}`,
      `Number of aggregators:           ${filtered.length}`,
      '',
      'Group  Port-channel  Protocol    Ports',
      '------+-------------+-----------+-----------------------------------------------'
    ];

    if (filtered.length === 0) {
      lines.push('No channel groups configured.');
      return lines.join('\n');
    }

    for (const b of filtered) {
      const gidCol = b.groupId.toString().padEnd(6);
      const poCol = `${b.poName}(${b.status})`.padEnd(14);
      const protoCol = b.protocol.padEnd(12);
      const portsCol = b.ports.map(p => `${p.shortName}(${p.flag})`).join('    ');

      lines.push(`${gidCol} ${poCol}${protoCol}${portsCol}`);
    }

    return lines.join('\n');
  }

  /**
   * Format otentik Cisco IOS: 'show etherchannel port-channel'
   */
  static renderShowEtherchannelPortChannel(switchDev: Switch, allDevices: Device[]): string {
    const bundles = this.evaluateBundles(switchDev, allDevices);
    if (bundles.length === 0) {
      return 'No EtherChannels configured.';
    }

    const lines: string[] = [];
    for (const b of bundles) {
      lines.push(`                Port-channels in the group: `);
      lines.push(`                --------------------------- `);
      lines.push(`Port-channel: ${b.poName}    (Primary Aggregator)`);
      lines.push(`------------`);
      lines.push(`Age of the Port-channel   = 0d:01h:15m:00s`);
      lines.push(`Logical slot/port   = 16/0          Number of ports = ${b.ports.length}`);
      lines.push(`HotStandBy port = null `);
      lines.push(`Port state          = Port-channel Ag-Inuse `);
      lines.push(`Protocol            =   ${b.protocol}`);
      lines.push(`Port security       = Disabled`);
      lines.push(``);
      lines.push(`Ports in the group:`);
      lines.push(`-------------------`);
      for (const p of b.ports) {
        lines.push(`Port: ${p.shortName}   Status: ${p.flag === 'P' ? 'Bundled' : p.flag === 's' ? 'Suspended' : 'Down'}`);
      }
      lines.push(``);
    }

    return lines.join('\n');
  }
}
