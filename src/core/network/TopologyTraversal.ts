/**
 * TopologyTraversal.ts
 * Mesin penelusuran topologi Layer 2 (Broadcast Domain) dan Layer 3 (Hop-by-Hop Routing)
 * Memastikan perilaku jaringan sesuai dengan prinsip Cisco CCNA:
 * 1. Router membatasi Broadcast Domain (DHCP Discover tidak menembus router tanpa IP helper).
 * 2. Paket antar-subnet harus melewati Default Gateway yang berada di subnet yang sama.
 * 3. Router perantara harus memiliki antarmuka aktif, alamat IP, dan tabel routing yang valid.
 */

import { Device } from '../devices/Device';
import { Router } from '../devices/Router';
import { Switch } from '../devices/Switch';
import { Host } from '../devices/Host';
import { SubnetUtils } from './Subnet';
import { DhcpPool } from '../../types/network';
import { RoutingProtocolEngine } from './RoutingProtocolEngine';
import { FhrpEngine } from './FhrpEngine';
import { PolicyEngine } from './PolicyEngine';
import { SecurityVpnEngine } from './SecurityVpnEngine';

export interface L2Endpoint {
  device: Device;
  interfaceName: string;
}

export interface DhcpLeaseResult {
  success: boolean;
  ipAddress: string;
  subnetMask: string;
  defaultGateway: string;
  dnsServer: string;
  serverIp?: string;
  error?: string;
}

export interface ReachabilityResult {
  isReachable: boolean;
  icmpType: 'reply' | 'dest-host-unreachable' | 'dest-net-unreachable' | 'timed-out';
  respondingIp?: string;
  hops?: string[];
  reason?: string;
}

export class TopologyTraversal {
  /**
   * Mengembalikan semua endpoint (perangkat dan port) yang berada di dalam
   * Broadcast Domain Layer 2 yang sama dari antarmuka awal perangkat.
   * Switch meneruskan broadcast ke seluruh port aktif, sedangkan Router membatasinya.
   */
  static getL2BroadcastDomain(device: Device, ifaceName: string, allDevices: Device[]): L2Endpoint[] {
    const endpoints: L2Endpoint[] = [];
    const visitedSwitches = new Set<string>();

    const iface = device.interfaces.get(ifaceName) || Array.from(device.interfaces.values())[0];
    if (!iface) return endpoints;

    // Cari perangkat yang terhubung langsung pada port ini
    let directPeerId = iface.connectedDeviceId;
    let directPeerPort = iface.connectedPort;

    if (!directPeerId) {
      for (const d of allDevices) {
        if (d.id === device.id) continue;
        for (const p of d.interfaces.values()) {
          if (
            p.connectedDeviceId === device.id &&
            (p.connectedPort === iface.name || p.connectedPort === iface.shortName)
          ) {
            directPeerId = d.id;
            directPeerPort = p.name;
            break;
          }
        }
        if (directPeerId) break;
      }
    }

    if (!directPeerId) return endpoints;

    const directPeer = allDevices.find(d => d.id === directPeerId);
    if (!directPeer) return endpoints;

    const isSwitchDev = (d: Device) => d instanceof Switch || (d as any).deviceType === 'switch' || (d as any).deviceType === 'switch-l3';

    if (isSwitchDev(directPeer)) {
      // Telusuri domain broadcast switch (Layer 2)
      const queue: Switch[] = [directPeer as Switch];
      visitedSwitches.add(directPeer.id);

      while (queue.length > 0) {
        const sw = queue.shift()!;
        for (const swIface of sw.interfaces.values()) {
          if (swIface.isShutdown || swIface.stpState === 'blocking') continue;
          if (swIface.connectedDeviceId) {
            if (swIface.connectedDeviceId === device.id) continue;

            const neighbor = allDevices.find(d => d.id === swIface.connectedDeviceId);
            if (!neighbor) continue;

            if (isSwitchDev(neighbor)) {
              if (!visitedSwitches.has(neighbor.id)) {
                visitedSwitches.add(neighbor.id);
                queue.push(neighbor as Switch);
              }
            } else {
              // Router, Host, Server, Cloud: berhenti di sini (ujung L2 domain)
              endpoints.push({
                device: neighbor,
                interfaceName: swIface.connectedPort || ''
              });
            }
          }
        }
      }
    } else {
      // Koneksi langsung point-to-point ke Router, Host, Server, atau Cloud
      endpoints.push({
        device: directPeer,
        interfaceName: directPeerPort || ''
      });
    }

    return endpoints;
  }

  /**
   * Menjalankan proses permohonan DHCP Discover -> Offer -> Request -> Ack untuk Host (PC)
   * Hanya mencari server DHCP yang berada di dalam L2 Broadcast Domain lokal.
   */
  static acquireHostDhcp(host: Host, allDevices: Device[]): DhcpLeaseResult {
    const endpoints = this.getL2BroadcastDomain(host, 'FastEthernet0', allDevices);

    // 1. Cek apakah ada Router atau L3 Switch di domain broadcast lokal yang memiliki DHCP pool
    for (const ep of endpoints) {
      if (
        ep.device instanceof Router || 
        (ep.device as any).deviceType === 'router' || 
        (ep.device as any).deviceType === 'switch-l3' || 
        (ep.device instanceof Switch && ep.device.isLayer3)
      ) {
        const routerDev = ep.device as Router | Switch;
        const targetIfaceName = ep.interfaceName;
        const routerIface = routerDev.interfaces.get(targetIfaceName) ||
          Array.from(routerDev.interfaces.values()).find(
            i => i.connectedDeviceId === host.id || (ep.interfaceName && (i.name === ep.interfaceName || i.shortName === ep.interfaceName))
          );

        if (routerIface && !routerIface.isShutdown && routerIface.ipAddress && routerIface.subnetMask) {
          const routerNet = SubnetUtils.getNetworkAddress(routerIface.ipAddress, routerIface.subnetMask);

          for (const pool of routerDev.dhcpPools.values()) {
            if (pool.network && pool.mask) {
              const poolNet = SubnetUtils.getNetworkAddress(pool.network, pool.mask);
              if (poolNet === routerNet) {
                // Alokasikan IP dari pool ini
                const assignedIp = this.allocateHostIpFromPool(pool, routerDev, allDevices);
                if (assignedIp) {
                  const gw = pool.defaultRouter || routerIface.ipAddress;
                  const dns = pool.dnsServer || '8.8.8.8';
                  return {
                    success: true,
                    ipAddress: assignedIp,
                    subnetMask: pool.mask,
                    defaultGateway: gw,
                    dnsServer: dns,
                    serverIp: routerIface.ipAddress
                  };
                }
              }
            }
          }
        }
      }
    }

    // 2. Cek apakah ada Cloud (LiveHostBridge) di domain broadcast lokal
    for (const ep of endpoints) {
      if (ep.device.deviceType === 'cloud') {
        const cloudHost = ep.device as Host;
        const gw = cloudHost.defaultGateway || cloudHost.ipAddress || '192.168.1.1';
        const mask = cloudHost.subnetMask || '255.255.255.0';
        const dns = cloudHost.dnsServer || '8.8.8.8';

        const netBase = SubnetUtils.getNetworkAddress(gw, mask);
        const prefixParts = netBase.split('.');
        const prefix = `${prefixParts[0]}.${prefixParts[1]}.${prefixParts[2]}`;

        const usedIps = new Set<string>();
        usedIps.add(gw);
        usedIps.add(cloudHost.ipAddress);
        for (const d of allDevices) {
          if (d instanceof Host && d.ipAddress && d.id !== host.id) usedIps.add(d.ipAddress);
          for (const ifc of d.interfaces.values()) {
            if (ifc.ipAddress) usedIps.add(ifc.ipAddress);
          }
        }

        let assignedIp = `${prefix}.105`;
        if (usedIps.has(assignedIp)) {
          let octet = 106;
          while (octet < 250 && usedIps.has(`${prefix}.${octet}`)) octet++;
          assignedIp = `${prefix}.${octet}`;
        }

        return {
          success: true,
          ipAddress: assignedIp,
          subnetMask: mask,
          defaultGateway: gw,
          dnsServer: dns,
          serverIp: gw
        };
      }
    }

    // 3. Cek apakah ada Server DHCP khusus di domain broadcast lokal
    for (const ep of endpoints) {
      if (ep.device.deviceType === 'server') {
        const srv = ep.device as Host;
        if (srv.ipAddress && srv.subnetMask) {
          const gw = srv.defaultGateway || srv.ipAddress;
          const mask = srv.subnetMask;
          const netBase = SubnetUtils.getNetworkAddress(srv.ipAddress, mask);
          const prefixParts = netBase.split('.');
          const prefix = `${prefixParts[0]}.${prefixParts[1]}.${prefixParts[2]}`;
          const assignedIp = `${prefix}.100`;
          return {
            success: true,
            ipAddress: assignedIp,
            subnetMask: mask,
            defaultGateway: gw,
            dnsServer: srv.dnsServer || '8.8.8.8',
            serverIp: srv.ipAddress
          };
        }
      }
    }

    // 4. Tidak ada DHCP Server di broadcast domain lokal -> APIPA (Automatic Private IP Addressing)
    const randHost = Math.floor(Math.random() * 200 + 10);
    const apipaIp = `169.254.${Math.floor(Math.random() * 200 + 1)}.${randHost}`;
    return {
      success: false,
      ipAddress: apipaIp,
      subnetMask: '255.255.0.0',
      defaultGateway: '0.0.0.0',
      dnsServer: '',
      error: 'DHCP failed. APIPA is being used. Tidak ada server DHCP aktif di segmen broadcast lokal ini.'
    };
  }

  private static allocateHostIpFromPool(
    pool: DhcpPool,
    serverDevice: Device,
    allDevices: Device[]
  ): string | null {
    const netLong = SubnetUtils.ipToLong(pool.network);
    const maskLong = SubnetUtils.ipToLong(pool.mask);
    const totalHosts = (~maskLong >>> 0) - 1;

    const excludedList: string[] = [];
    if (serverDevice instanceof Router || serverDevice instanceof Switch) {
      for (const exc of serverDevice.dhcpExcludedAddresses) {
        const parts = exc.split(/\s+/);
        if (parts.length === 1) {
          excludedList.push(parts[0]);
        } else if (parts.length === 2) {
          const start = SubnetUtils.ipToLong(parts[0]);
          const end = SubnetUtils.ipToLong(parts[1]);
          for (let ip = start; ip <= end; ip++) {
            excludedList.push(SubnetUtils.longToIp(ip));
          }
        }
      }
    }
    if (pool.defaultRouter) excludedList.push(pool.defaultRouter);

    const usedIps = new Set<string>(excludedList);
    for (const d of allDevices) {
      if (d instanceof Host && d.ipAddress) usedIps.add(d.ipAddress);
      for (const ifc of d.interfaces.values()) {
        if (ifc.ipAddress) usedIps.add(ifc.ipAddress);
      }
    }

    // Alokasikan host IP pertama yang bebas
    for (let i = 1; i <= Math.min(totalHosts, 254); i++) {
      const candidate = SubnetUtils.longToIp((netLong + i) >>> 0);
      if (!usedIps.has(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Evaluasi rute paket ICMP/IP hop-by-hop dari PC ke IP tujuan
   */
  static evaluateHostReachability(
    sourceHost: Host,
    destIp: string,
    allDevices: Device[]
  ): ReachabilityResult {
    // 0. Converge dynamic routing protocols and FHRP state
    RoutingProtocolEngine.convergeRoutingProtocols(allDevices);
    FhrpEngine.convergeFhrp(allDevices);

    // 1. Validasi IP lokal pengirim
    if (!sourceHost.ipAddress || sourceHost.ipAddress === '0.0.0.0' || sourceHost.ipAddress.startsWith('169.254.')) {
      return {
        isReachable: false,
        icmpType: 'dest-host-unreachable',
        reason: 'IP address host pengirim belum dikonfigurasi atau sedang menggunakan APIPA.'
      };
    }

    // 2. Loopback atau IP sendiri
    if (destIp === sourceHost.ipAddress || destIp === '127.0.0.1') {
      return { isReachable: true, icmpType: 'reply', respondingIp: destIp, hops: [destIp] };
    }

    const endpoints = this.getL2BroadcastDomain(sourceHost, 'FastEthernet0', allDevices);

    // 3. Tujuan berada di Subnet Lokal yang sama
    if (sourceHost.subnetMask && SubnetUtils.isSameSubnet(sourceHost.ipAddress, destIp, sourceHost.subnetMask)) {
      for (const ep of endpoints) {
        if (ep.device instanceof Host && ep.device.ipAddress === destIp) {
          const targetMac = ep.device.interfaces.get('FastEthernet0')?.macAddress || '0050.7966.6800';
          const sourceMac = sourceHost.interfaces.get('FastEthernet0')?.macAddress || '0050.7966.6801';
          sourceHost.addArpEntry({
            ipAddress: destIp,
            macAddress: targetMac,
            interfaceName: 'FastEthernet0',
            type: 'dynamic',
            age: 0
          });
          ep.device.addArpEntry({
            ipAddress: sourceHost.ipAddress,
            macAddress: sourceMac,
            interfaceName: 'FastEthernet0',
            type: 'dynamic',
            age: 0
          });
          return { isReachable: true, icmpType: 'reply', respondingIp: destIp, hops: [destIp] };
        }
        for (const ifc of ep.device.interfaces.values()) {
          if (!ifc.isShutdown && ifc.status === 'up') {
            const isHsrpActive = ifc.hsrp?.virtualIp === destIp && ifc.hsrp.state === 'Active';
            const isVrrpMaster = ifc.vrrp?.virtualIp === destIp && ifc.vrrp.state === 'Master';
            if (ifc.ipAddress === destIp || isHsrpActive || isVrrpMaster) {
              const targetMac = (isHsrpActive && ifc.hsrp?.virtualMac) || (isVrrpMaster && ifc.vrrp?.virtualMac) || ifc.macAddress;
              const sourceMac = sourceHost.interfaces.get('FastEthernet0')?.macAddress || '0050.7966.6801';
              sourceHost.addArpEntry({
                ipAddress: destIp,
                macAddress: targetMac,
                interfaceName: 'FastEthernet0',
                type: 'dynamic',
                age: 0
              });
              ep.device.addArpEntry({
                ipAddress: sourceHost.ipAddress,
                macAddress: sourceMac,
                interfaceName: ifc.name,
                type: 'ARPA',
                age: 0
              });
              return { isReachable: true, icmpType: 'reply', respondingIp: destIp, hops: [destIp] };
            }
          }
        }
      }
      return {
        isReachable: false,
        icmpType: 'dest-host-unreachable',
        reason: 'Host tujuan tidak ditemukan di segmen broadcast lokal (ARP timeout).'
      };
    }

    // 4. Tujuan berada di Subnet Berbeda / Remote / Internet
    if (!sourceHost.defaultGateway || sourceHost.defaultGateway === '0.0.0.0') {
      return {
        isReachable: false,
        icmpType: 'dest-host-unreachable',
        reason: 'Default gateway tidak dikonfigurasi pada host.'
      };
    }

    // Validasi apakah default gateway berada di subnet yang sama dengan host
    if (!SubnetUtils.isSameSubnet(sourceHost.ipAddress, sourceHost.defaultGateway, sourceHost.subnetMask)) {
      return {
        isReachable: false,
        icmpType: 'dest-host-unreachable',
        reason: `Default gateway (${sourceHost.defaultGateway}) tidak berada di subnet yang sama dengan host.`
      };
    }

    // Cari perangkat gateway di broadcast domain lokal
    let gatewayEndpoint: L2Endpoint | undefined;
    for (const ep of endpoints) {
      for (const ifc of ep.device.interfaces.values()) {
        if (ifc.ipAddress === sourceHost.defaultGateway && !ifc.isShutdown && ifc.status === 'up') {
          gatewayEndpoint = ep;
          break;
        }
      }
      if (gatewayEndpoint) break;
      if (ep.device instanceof Host && ep.device.ipAddress === sourceHost.defaultGateway) {
        gatewayEndpoint = ep;
        break;
      }
    }

    // Jika tidak ditemukan secara fisik, periksa FHRP Virtual Gateway (HSRP / VRRP)
    if (!gatewayEndpoint) {
      const fhrpRes = FhrpEngine.resolveVirtualGateway(sourceHost.defaultGateway, allDevices);
      if (fhrpRes) {
        gatewayEndpoint = {
          device: fhrpRes.activeDevice,
          interfaceName: fhrpRes.activeInterface.name
        };
      }
    }

    if (!gatewayEndpoint) {
      return {
        isReachable: false,
        icmpType: 'dest-host-unreachable',
        reason: `Default gateway (${sourceHost.defaultGateway}) tidak dapat dijangkau di jaringan fisik lokal (antarmuka router down atau tidak terhubung).`
      };
    }

    // Dynamic ARP learning between sourceHost and default gateway router/switch
    const gwIface = gatewayEndpoint.device.getInterface(gatewayEndpoint.interfaceName) ||
      Array.from(gatewayEndpoint.device.interfaces.values()).find(i => i.ipAddress === sourceHost.defaultGateway);
    let gwMac = gwIface?.macAddress || '0001.96a1.0001';

    // Periksa apakah gateway menggunakan FHRP virtual MAC
    if (gwIface?.hsrp && gwIface.hsrp.virtualIp === sourceHost.defaultGateway) {
      gwMac = gwIface.hsrp.virtualMac || (gwIface.hsrp.version === 2
        ? `0000.0c9f.f${gwIface.hsrp.group.toString(16).padStart(3, '0')}`
        : `0000.0c07.ac${gwIface.hsrp.group.toString(16).padStart(2, '0')}`);
    } else if (gwIface?.vrrp && gwIface.vrrp.virtualIp === sourceHost.defaultGateway) {
      gwMac = gwIface.vrrp.virtualMac || `0000.5e00.01${gwIface.vrrp.group.toString(16).padStart(2, '0')}`;
    }

    const sourceMac = sourceHost.interfaces.get('FastEthernet0')?.macAddress || '0050.7966.6801';

    sourceHost.addArpEntry({
      ipAddress: sourceHost.defaultGateway,
      macAddress: gwMac,
      interfaceName: 'FastEthernet0',
      type: 'dynamic',
      age: 0
    });
    gatewayEndpoint.device.addArpEntry({
      ipAddress: sourceHost.ipAddress,
      macAddress: sourceMac,
      interfaceName: gwIface?.name || gatewayEndpoint.interfaceName,
      type: 'ARPA',
      age: 0
    });

    const gwDevice = gatewayEndpoint.device;

    // Jika Gateway adalah Cloud Bridge langsung (tanpa perantara router)
    if (gwDevice.deviceType === 'cloud') {
      return { isReachable: true, icmpType: 'reply', respondingIp: destIp, hops: [sourceHost.defaultGateway, destIp] };
    }

    // Jika Gateway adalah Router
    if (gwDevice instanceof Router || (gwDevice instanceof Switch && gwDevice.isLayer3)) {
      const router = gwDevice as Router;

      // 1. Cek Policy-Based Routing (PBR) pada antarmuka masuk gateway (gwIface)
      let pbrNextHop: string | undefined;
      if (gwIface?.ipPolicyRouteMap && router.routeMaps && router.routeMaps.has(gwIface.ipPolicyRouteMap)) {
        const rmap = router.routeMaps.get(gwIface.ipPolicyRouteMap)!;
        const candidate = {
          network: sourceHost.ipAddress,
          mask: '255.255.255.255',
          cidr: 32
        };
        const pbrRes = PolicyEngine.evaluateRouteMap(rmap, candidate, router);
        if (pbrRes.permitted) {
          if (pbrRes.setIpNextHopTrack) {
            const trk = router.trackObjects?.get(pbrRes.setIpNextHopTrack.trackId);
            if (trk && trk.state === 'UP') {
              pbrNextHop = pbrRes.setIpNextHopTrack.nextHop;
            }
          } else if (pbrRes.setIpNextHop) {
            pbrNextHop = pbrRes.setIpNextHop;
          }
        }
      }

      // Tentukan exit interface awal
      let exitIface: any = undefined;
      let targetForwardIp: string = destIp;

      if (pbrNextHop) {
        targetForwardIp = pbrNextHop;
        for (const ifc of router.interfaces.values()) {
          if (!ifc.isShutdown && ifc.status === 'up' && ifc.ipAddress && ifc.subnetMask) {
            if (SubnetUtils.isSameSubnet(ifc.ipAddress, pbrNextHop, ifc.subnetMask)) {
              exitIface = ifc;
              break;
            }
          }
        }
        if (!exitIface) {
          const rHop = router.lookupRoute(pbrNextHop);
          if (rHop) {
            exitIface = rHop.exitInterface ? router.interfaces.get(rHop.exitInterface) : undefined;
            if (!exitIface && rHop.nextHop) {
              for (const ifc of router.interfaces.values()) {
                if (!ifc.isShutdown && ifc.status === 'up' && ifc.ipAddress && ifc.subnetMask) {
                  if (SubnetUtils.isSameSubnet(ifc.ipAddress, rHop.nextHop, ifc.subnetMask)) {
                    exitIface = ifc;
                    break;
                  }
                }
              }
            }
          }
        }
      }

      const incomingVrf = gwIface?.vrf;

      if (!exitIface) {
        const route = router.lookupRoute(destIp, incomingVrf);
        if (!route) {
          const vrfMsg = incomingVrf ? ` di tabel VRF ${incomingVrf}` : '';
          return {
            isReachable: false,
            icmpType: 'dest-net-unreachable',
            respondingIp: sourceHost.defaultGateway,
            reason: `Router (${router.hostname}) tidak memiliki rute${vrfMsg} (atau default route 0.0.0.0/0) ke jaringan tujuan ${destIp}.`
          };
        }

        exitIface = route.exitInterface ? router.interfaces.get(route.exitInterface) : undefined;
        if (!exitIface && route.nextHop) {
          for (const ifc of router.interfaces.values()) {
            if (!ifc.isShutdown && ifc.status === 'up' && ifc.ipAddress && ifc.subnetMask) {
              if (SubnetUtils.isSameSubnet(ifc.ipAddress, route.nextHop, ifc.subnetMask)) {
                exitIface = ifc;
                break;
              }
            }
          }
        }
      }

      if (!exitIface || exitIface.isShutdown || exitIface.status !== 'up') {
        return {
          isReachable: false,
          icmpType: 'timed-out',
          reason: `Antarmuka keluar router (${exitIface?.name || 'unknown'}) tidak dapat ditentukan, berstatus shutdown, atau down.`
        };
      }

      if (!exitIface.ipAddress) {
        return {
          isReachable: false,
          icmpType: 'timed-out',
          reason: `Antarmuka keluar router (${exitIface.name}) belum memiliki konfigurasi alamat IP.`
        };
      }

      let currentRouter = router;
      let currentExitIface = exitIface;
      const visitedRouters = new Set<string>([router.id]);
      const hops: string[] = [sourceHost.defaultGateway];

      while (currentRouter && currentExitIface) {
        if (currentExitIface.isShutdown || currentExitIface.status !== 'up') {
          return {
            isReachable: false,
            icmpType: 'timed-out',
            reason: `Antarmuka keluar router (${currentExitIface.name}) berstatus shutdown atau down.`
          };
        }

        // ZBFW Evaluation on ingress -> egress transition
        if (gwIface && currentRouter === router) {
          const zbfwRes = SecurityVpnEngine.evaluateZbfw(currentRouter, gwIface.name, currentExitIface.name, {
            srcIp: sourceHost.ipAddress,
            dstIp: destIp,
            protocol: 'icmp'
          });
          if (zbfwRes.action === 'drop') {
            return {
              isReachable: false,
              icmpType: 'timed-out',
              reason: zbfwRes.reason
            };
          }
        }

        // Handle Tunnel Interface Forwarding (GRE / GRE over IPsec / DMVPN)
        if (currentExitIface.name.startsWith('Tunnel') || currentExitIface.name.startsWith('Tu')) {
          let remoteUnderlayIp = currentExitIface.tunnelDestination;
          if (!remoteUnderlayIp && currentExitIface.nhrpMaps) {
            const map = currentExitIface.nhrpMaps.find((m: { protocolIp?: string; nbmaIp: string }) => m.protocolIp === targetForwardIp);
            if (map) remoteUnderlayIp = map.nbmaIp;
          }
          if (!remoteUnderlayIp && currentRouter.nhrpCache) {
            const cacheEntry = currentRouter.nhrpCache.find(e => e.protocolIp === targetForwardIp);
            if (cacheEntry) remoteUnderlayIp = cacheEntry.nbmaIp;
          }

          if (!remoteUnderlayIp) {
            return {
              isReachable: false,
              icmpType: 'timed-out',
              reason: `Tunnel destination or NHRP mapping not found on ${currentExitIface.name} for target ${targetForwardIp}`
            };
          }

          // Locate remote router by underlay IP
          let remoteRouter: Router | null = null;
          for (const d of allDevices) {
            if (d instanceof Router && d.id !== currentRouter.id) {
              for (const ifc of d.interfaces.values()) {
                if (ifc.ipAddress === remoteUnderlayIp) {
                  remoteRouter = d;
                  break;
                }
              }
              if (remoteRouter) break;
            }
          }

          if (!remoteRouter) {
            return {
              isReachable: false,
              icmpType: 'dest-host-unreachable',
              reason: `Underlay destination ${remoteUnderlayIp} unreachable for tunnel ${currentExitIface.name}`
            };
          }

          // IPsec Protection SA verification / negotiation
          if (currentExitIface.tunnelProtectionProfile) {
            let localUnderlayIp = currentExitIface.tunnelSource;
            if (localUnderlayIp && currentRouter.interfaces.has(localUnderlayIp)) {
              localUnderlayIp = currentRouter.interfaces.get(localUnderlayIp)?.ipAddress;
            }
            if (!localUnderlayIp) {
              const phys = Array.from(currentRouter.interfaces.values()).find(i => !i.name.startsWith('Tu') && !i.name.startsWith('Lo') && i.ipAddress);
              localUnderlayIp = phys?.ipAddress;
            }
            const ipsecRes = SecurityVpnEngine.negotiateIpsec(
              currentRouter,
              remoteRouter,
              localUnderlayIp || '0.0.0.0',
              remoteUnderlayIp,
              currentExitIface.name,
              currentExitIface.tunnelProtectionProfile
            );
            if (!ipsecRes.success) {
              return {
                isReachable: false,
                icmpType: 'timed-out',
                reason: `IPsec SA negotiation failed on ${currentExitIface.name}: ${ipsecRes.reason}`
              };
            }
          }

          // Remote tunnel interface on remote router
          let remoteTunnelIface = Array.from(remoteRouter.interfaces.values()).find(
            i => (i.name.startsWith('Tu') || i.name.startsWith('Tunnel')) &&
                 i.ipAddress &&
                 currentExitIface.subnetMask &&
                 SubnetUtils.isSameSubnet(currentExitIface.ipAddress, i.ipAddress, currentExitIface.subnetMask)
          );
          if (!remoteTunnelIface) {
            remoteTunnelIface = Array.from(remoteRouter.interfaces.values()).find(
              i => i.name.startsWith('Tu') || i.name.startsWith('Tunnel')
            );
          }

          // Target reached on remote router interface
          if (Array.from(remoteRouter.interfaces.values()).some(i => i.ipAddress === destIp)) {
            // Check CoPP on remote router
            const coppRes = SecurityVpnEngine.evaluateCopp(remoteRouter, {
              srcIp: sourceHost.ipAddress,
              dstIp: destIp,
              protocol: 'icmp'
            });
            if (coppRes.action === 'drop') {
              return {
                isReachable: false,
                icmpType: 'timed-out',
                reason: coppRes.reason
              };
            }
            return {
              isReachable: true,
              icmpType: 'reply',
              respondingIp: destIp,
              hops: [...hops, currentExitIface.ipAddress || '', destIp]
            };
          }

          visitedRouters.add(remoteRouter.id);
          hops.push(remoteTunnelIface?.ipAddress || remoteUnderlayIp);

          const remoteRoute = remoteRouter.lookupRoute(destIp);
          if (!remoteRoute) {
            return {
              isReachable: false,
              icmpType: 'dest-net-unreachable',
              respondingIp: remoteTunnelIface?.ipAddress || remoteUnderlayIp,
              reason: `Remote router ${remoteRouter.hostname} has no route to ${destIp}`
            };
          }

          let remoteExit = remoteRoute.exitInterface ? remoteRouter.interfaces.get(remoteRoute.exitInterface) : undefined;
          if (!remoteExit && remoteRoute.nextHop) {
            for (const ifc of remoteRouter.interfaces.values()) {
              if (!ifc.isShutdown && ifc.status === 'up' && ifc.ipAddress && ifc.subnetMask) {
                if (SubnetUtils.isSameSubnet(ifc.ipAddress, remoteRoute.nextHop, ifc.subnetMask)) {
                  remoteExit = ifc;
                  break;
                }
              }
            }
          }

          if (!remoteExit) {
            return {
              isReachable: false,
              icmpType: 'timed-out',
              reason: `Remote router ${remoteRouter.hostname} exit interface not found`
            };
          }

          // Check ZBFW on remote router
          if (remoteTunnelIface) {
            const zbfwRes = SecurityVpnEngine.evaluateZbfw(remoteRouter, remoteTunnelIface.name, remoteExit.name, {
              srcIp: sourceHost.ipAddress,
              dstIp: destIp,
              protocol: 'icmp'
            });
            if (zbfwRes.action === 'drop') {
              return {
                isReachable: false,
                icmpType: 'timed-out',
                reason: zbfwRes.reason
              };
            }
          }

          currentRouter = remoteRouter;
          currentExitIface = remoteExit;
          targetForwardIp = destIp;
          continue;
        }

        const exitEndpoints = this.getL2BroadcastDomain(currentRouter, currentExitIface.name, allDevices);

        // Cek apakah segmen keluar terhubung ke LiveHostBridge (Internet)
        const hasLiveBridge = exitEndpoints.some(ep => ep.device.deviceType === 'cloud');
        if (hasLiveBridge) {
          return {
            isReachable: true,
            icmpType: 'reply',
            respondingIp: destIp,
            hops: [...hops, currentExitIface.ipAddress || '', destIp]
          };
        }

        // Cek apakah tujuan berada di segmen keluar router (LAN lain / Host / Router interface)
        for (const ep of exitEndpoints) {
          if (ep.device instanceof Host && ep.device.ipAddress === destIp) {
            const remoteMac = ep.device.interfaces.get('FastEthernet0')?.macAddress || '0050.7966.6800';
            currentRouter.addArpEntry({
              ipAddress: destIp,
              macAddress: remoteMac,
              interfaceName: currentExitIface.name,
              type: 'ARPA',
              age: 0
            });
            ep.device.addArpEntry({
              ipAddress: currentExitIface.ipAddress || '',
              macAddress: currentExitIface.macAddress,
              interfaceName: 'FastEthernet0',
              type: 'dynamic',
              age: 0
            });
            return { isReachable: true, icmpType: 'reply', respondingIp: destIp, hops: [...hops, destIp] };
          }
          for (const ifc of ep.device.interfaces.values()) {
            if (ifc.ipAddress === destIp && !ifc.isShutdown && ifc.status === 'up') {
              currentRouter.addArpEntry({
                ipAddress: destIp,
                macAddress: ifc.macAddress,
                interfaceName: currentExitIface.name,
                type: 'ARPA',
                age: 0
              });
              ep.device.addArpEntry({
                ipAddress: currentExitIface.ipAddress || '',
                macAddress: currentExitIface.macAddress,
                interfaceName: ifc.name,
                type: 'ARPA',
                age: 0
              });
              return { isReachable: true, icmpType: 'reply', respondingIp: destIp, hops: [...hops, destIp] };
            }
          }
        }

        // Jika tujuan bukan host/interface di segmen ini, cari router next hop
        let nextHopRouter: Router | Switch | null = null;
        let nextHopIfaceOnNextRouter: any = null;

        for (const ep of exitEndpoints) {
          if (
            (ep.device instanceof Router || (ep.device instanceof Switch && ep.device.isLayer3)) &&
            !visitedRouters.has(ep.device.id)
          ) {
            const rDev = ep.device as Router | Switch;
            for (const rIfc of rDev.interfaces.values()) {
              if (
                !rIfc.isShutdown &&
                rIfc.status === 'up' &&
                rIfc.ipAddress &&
                (rIfc.ipAddress === targetForwardIp ||
                 (currentExitIface.subnetMask && SubnetUtils.isSameSubnet(currentExitIface.ipAddress, rIfc.ipAddress, currentExitIface.subnetMask)))
              ) {
                nextHopRouter = rDev;
                nextHopIfaceOnNextRouter = rIfc;
                break;
              }
            }
            if (nextHopRouter) break;
          }
        }

        if (!nextHopRouter) {
          return {
            isReachable: false,
            icmpType: 'timed-out',
            reason: `Paket diteruskan keluar ${currentExitIface.name}, tetapi tidak ada respon dari next-hop.`
          };
        }

        visitedRouters.add(nextHopRouter.id);
        if (nextHopIfaceOnNextRouter?.ipAddress) {
          hops.push(nextHopIfaceOnNextRouter.ipAddress);
        }

        const nextVrf = nextHopIfaceOnNextRouter?.vrf;
        const nextRoute = (nextHopRouter as Router).lookupRoute(destIp, nextVrf);
        if (!nextRoute) {
          const vrfMsg = nextVrf ? ` di tabel VRF ${nextVrf}` : '';
          return {
            isReachable: false,
            icmpType: 'dest-net-unreachable',
            respondingIp: nextHopIfaceOnNextRouter?.ipAddress || currentExitIface.ipAddress,
            reason: `Router (${nextHopRouter.hostname}) tidak memiliki rute${vrfMsg} ke jaringan tujuan ${destIp}.`
          };
        }

        let nextExit = nextRoute.exitInterface ? nextHopRouter.interfaces.get(nextRoute.exitInterface) : undefined;
        if (!nextExit && nextRoute.nextHop) {
          for (const ifc of nextHopRouter.interfaces.values()) {
            if (!ifc.isShutdown && ifc.status === 'up' && ifc.ipAddress && ifc.subnetMask) {
              if (SubnetUtils.isSameSubnet(ifc.ipAddress, nextRoute.nextHop, ifc.subnetMask)) {
                nextExit = ifc;
                break;
              }
            }
          }
        }

        if (!nextExit) {
          return {
            isReachable: false,
            icmpType: 'timed-out',
            reason: `Antarmuka keluar router (${nextHopRouter.hostname}) tidak dapat ditentukan.`
          };
        }

        currentRouter = nextHopRouter as Router;
        currentExitIface = nextExit;
        targetForwardIp = destIp;

        if (visitedRouters.size > 15) {
          return {
            isReachable: false,
            icmpType: 'timed-out',
            reason: 'TTL expired in transit (routing loop terdeteksi).'
          };
        }
      }
    }

    return {
      isReachable: false,
      icmpType: 'dest-host-unreachable',
      reason: 'Gateway yang ditunjuk bukan perangkat perute (bukan router).'
    };
  }
}
