import { Router } from '../devices/Router';
import {
  CryptoSession,
  NhrpMappingEntry,
  ZbfwSession,
  SecurityZone,
  ZonePair,
  ClassMapInspect,
  PolicyMapInspect,
  CoppPolicy
} from '../../types/network';

export interface PacketContext {
  srcIp: string;
  dstIp: string;
  protocol: 'icmp' | 'tcp' | 'udp' | 'ospf' | 'eigrp' | 'bgp' | string;
  srcPort?: number;
  dstPort?: number;
}

export class SecurityVpnEngine {
  /**
   * Automatically negotiate or verify IPsec SA for a protected tunnel between two routers.
   */
  static negotiateIpsec(
    localRouter: Router,
    remoteRouter: Router,
    localPeerIp: string,
    remotePeerIp: string,
    localTunnelIfaceName: string,
    profileName: string
  ): { success: boolean; reason?: string } {
    const localProfile = localRouter.cryptoProfiles.get(profileName);
    if (!localProfile) {
      return { success: false, reason: `Local crypto profile ${profileName} not found` };
    }

    // Check if remote peer has matching pre-shared key
    const localKey = localRouter.cryptoKeys.find(
      k => k.address === remotePeerIp || k.address === '0.0.0.0'
    );
    const remoteKey = remoteRouter.cryptoKeys.find(
      k => k.address === localPeerIp || k.address === '0.0.0.0'
    );

    if (!localKey || !remoteKey || localKey.key !== remoteKey.key) {
      return { success: false, reason: 'IKE Phase 1 PSK mismatch or missing' };
    }

    // Check ISAKMP policy match (compare priority policies)
    const localPolicies = Array.from(localRouter.cryptoPolicies.values());
    const remotePolicies = Array.from(remoteRouter.cryptoPolicies.values());

    let policyMatched = false;
    if (localPolicies.length === 0 && remotePolicies.length === 0) {
      policyMatched = true; // Default policy
    } else {
      for (const lp of localPolicies) {
        for (const rp of remotePolicies) {
          if (
            (!lp.encryption || !rp.encryption || lp.encryption === rp.encryption) &&
            (!lp.hash || !rp.hash || lp.hash === rp.hash) &&
            (!lp.authentication || !rp.authentication || lp.authentication === rp.authentication)
          ) {
            policyMatched = true;
            break;
          }
        }
        if (policyMatched) break;
      }
    }

    if (!policyMatched) {
      return { success: false, reason: 'IKE Phase 1 ISAKMP policy mismatch' };
    }

    // Establish SA & Session on both routers
    const inboundSpi = '0x' + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0').toUpperCase();
    const outboundSpi = '0x' + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0').toUpperCase();
    const ts = localRouter.cryptoTransformSets.get(localProfile.transformSet || '');
    const transformStr = ts ? ts.transforms.join(' ') : (localProfile.transformSet || 'esp-aes esp-sha-hmac');

    const localSession: CryptoSession = {
      peerIp: remotePeerIp,
      interfaceName: localTunnelIfaceName,
      ikeState: 'QM_IDLE',
      ipsecState: 'ACTIVE',
      inboundSpi,
      outboundSpi,
      transform: transformStr,
      pktsEncrypted: 0,
      pktsDecrypted: 0
    };
    localRouter.cryptoSessions.set(remotePeerIp, localSession);

    const remoteSession: CryptoSession = {
      peerIp: localPeerIp,
      interfaceName: localTunnelIfaceName,
      ikeState: 'QM_IDLE',
      ipsecState: 'ACTIVE',
      inboundSpi: outboundSpi,
      outboundSpi: inboundSpi,
      transform: transformStr,
      pktsEncrypted: 0,
      pktsDecrypted: 0
    };
    remoteRouter.cryptoSessions.set(localPeerIp, remoteSession);

    return { success: true };
  }

  /**
   * Register a spoke with a Hub via NHRP
   */
  static registerSpokeNhrp(
    spokeRouter: Router,
    hubRouter: Router,
    spokeTunnelIp: string,
    spokeNbmaIp: string,
    hubTunnelIp: string,
    hubNbmaIp: string,
    networkId: number
  ): void {
    // Add spoke to hub's NHRP dynamic cache
    const existingIndex = hubRouter.nhrpCache.findIndex(e => e.protocolIp === spokeTunnelIp);
    const hubEntry: NhrpMappingEntry = {
      protocolIp: spokeTunnelIp,
      nbmaIp: spokeNbmaIp,
      type: 'dynamic',
      flags: 'unique registered used',
      networkId
    };
    if (existingIndex >= 0) {
      hubRouter.nhrpCache[existingIndex] = hubEntry;
    } else {
      hubRouter.nhrpCache.push(hubEntry);
    }

    // Add hub to spoke's NHRP static cache
    const spokeExistingIndex = spokeRouter.nhrpCache.findIndex(e => e.protocolIp === hubTunnelIp);
    const spokeEntry: NhrpMappingEntry = {
      protocolIp: hubTunnelIp,
      nbmaIp: hubNbmaIp,
      type: 'static',
      flags: 'authoritative',
      networkId
    };
    if (spokeExistingIndex >= 0) {
      spokeRouter.nhrpCache[spokeExistingIndex] = spokeEntry;
    } else {
      spokeRouter.nhrpCache.push(spokeEntry);
    }
  }

  /**
   * Evaluate Zone-Based Policy Firewall (ZBFW) on a router for transiting traffic.
   */
  static evaluateZbfw(
    router: Router,
    inIfaceName: string,
    outIfaceName: string,
    packet: PacketContext
  ): { action: 'permit' | 'drop'; reason: string } {
    const inIface = router.getInterface(inIfaceName);
    const outIface = router.getInterface(outIfaceName);

    const srcZone = inIface?.zoneMemberSecurity;
    const dstZone = outIface?.zoneMemberSecurity;

    // Rule 1: If neither interface is part of a zone, normal routing applies
    if (!srcZone && !dstZone) {
      return { action: 'permit', reason: 'Non-zoned transit interface' };
    }

    // Rule 2: If one interface is zoned and the other is not, traffic is dropped by default
    if ((srcZone && !dstZone) || (!srcZone && dstZone)) {
      return { action: 'drop', reason: 'Unmatched zoned/non-zoned interface transition' };
    }

    // Rule 3: Intra-zone traffic is permitted by default
    if (srcZone === dstZone) {
      return { action: 'permit', reason: `Intra-zone traffic permitted in zone ${srcZone}` };
    }

    // Rule 4: Check stateful session table (Return traffic from inspected sessions)
    const now = Date.now();
    router.zbfwSessions = router.zbfwSessions.filter(s => s.expiresAt > now);
    const returnSession = router.zbfwSessions.find(
      s =>
        s.srcZone === dstZone &&
        s.dstZone === srcZone &&
        s.srcIp === packet.dstIp &&
        s.dstIp === packet.srcIp &&
        s.protocol.toLowerCase() === packet.protocol.toLowerCase()
    );

    if (returnSession) {
      // Refresh session lifetime
      returnSession.expiresAt = now + 60000;
      return { action: 'permit', reason: `Stateful return traffic matching session ${returnSession.id}` };
    }

    // Rule 5: Look for explicit zone-pair
    let matchingZonePair: ZonePair | undefined;
    for (const zp of router.zonePairs.values()) {
      if (zp.sourceZone.toLowerCase() === srcZone?.toLowerCase() && zp.destinationZone.toLowerCase() === dstZone?.toLowerCase()) {
        matchingZonePair = zp;
        break;
      }
    }

    if (!matchingZonePair || !matchingZonePair.servicePolicy) {
      return { action: 'drop', reason: `No zone-pair or policy defined between ${srcZone} and ${dstZone} (implicit deny)` };
    }

    // Rule 6: Evaluate policy-map
    const policyMap = router.inspectPolicyMaps.get(matchingZonePair.servicePolicy);
    if (!policyMap) {
      return { action: 'drop', reason: `Policy map ${matchingZonePair.servicePolicy} not found` };
    }

    for (const pClass of policyMap.classes) {
      const classMap = router.inspectClassMaps.get(pClass.className);
      if (!classMap) continue;

      let classMatch = false;
      if (classMap.matchType === 'match-any') {
        classMatch = classMap.matches.some(m => this.matchClassCondition(router, m, packet));
      } else {
        // match-all
        classMatch = classMap.matches.every(m => this.matchClassCondition(router, m, packet));
      }

      if (classMatch) {
        if (pClass.action === 'drop') {
          return { action: 'drop', reason: `Dropped by class ${classMap.name} in policy ${policyMap.name}` };
        } else if (pClass.action === 'pass') {
          return { action: 'permit', reason: `Permitted by class ${classMap.name} in policy ${policyMap.name}` };
        } else if (pClass.action === 'inspect') {
          // Record stateful inspection session
          const newSession: ZbfwSession = {
            id: 'SESS-' + Math.floor(Math.random() * 89999 + 10000),
            srcZone: srcZone!,
            dstZone: dstZone!,
            protocol: packet.protocol,
            srcIp: packet.srcIp,
            dstIp: packet.dstIp,
            srcPort: packet.srcPort,
            dstPort: packet.dstPort,
            state: 'established',
            expiresAt: now + 60000
          };
          router.zbfwSessions.push(newSession);
          return { action: 'permit', reason: `Inspected and permitted by class ${classMap.name} in policy ${policyMap.name}` };
        }
      }
    }

    // Implicit drop at end of policy map
    return { action: 'drop', reason: `No matching inspect class in policy ${policyMap.name} (implicit drop)` };
  }

  private static matchClassCondition(
    router: Router,
    match: { type: 'protocol' | 'access-group'; protocol?: string; accessGroup?: number },
    packet: PacketContext
  ): boolean {
    if (match.type === 'protocol' && match.protocol) {
      const targetProt = match.protocol.toLowerCase();
      const pktProt = packet.protocol.toLowerCase();
      if (targetProt === pktProt) return true;
      if (targetProt === 'tcp' && ['http', 'https', 'ssh', 'telnet', 'bgp'].includes(pktProt)) return true;
      if (targetProt === 'udp' && ['dns', 'dhcp', 'snmp', 'ntp'].includes(pktProt)) return true;
      if (targetProt === 'http' && (packet.dstPort === 80 || packet.srcPort === 80)) return true;
      if (targetProt === 'https' && (packet.dstPort === 443 || packet.srcPort === 443)) return true;
      if (targetProt === 'icmp' && pktProt === 'icmp') return true;
      return false;
    }

    if (match.type === 'access-group' && match.accessGroup) {
      const aclRules = router.accessLists.get(match.accessGroup);
      if (!aclRules) return false;
      // Simple ACL match
      for (const rule of aclRules) {
        if (rule.protocol && rule.protocol !== 'ip' && rule.protocol.toLowerCase() !== packet.protocol.toLowerCase()) {
          continue;
        }
        return rule.action === 'permit';
      }
    }

    return false;
  }

  /**
   * Evaluate Control Plane Policing (CoPP) for traffic directed to the router CPU
   */
  static evaluateCopp(
    router: Router,
    packet: PacketContext
  ): { action: 'transmit' | 'drop'; reason: string } {
    if (!router.coppPolicy) {
      return { action: 'transmit', reason: 'No CoPP policy configured' };
    }

    // Check classes in CoPP policy
    for (const c of router.coppPolicy.classes) {
      if (c.rateLimitBps !== undefined && c.rateLimitBps <= 0) {
        router.coppState.droppedPkts = (router.coppState.droppedPkts || 0) + 1;
        return { action: 'drop', reason: `CoPP rate-limit drop in class ${c.className}` };
      }
    }

    router.coppState.transmittedPkts = (router.coppState.transmittedPkts || 0) + 1;
    return { action: 'transmit', reason: 'CoPP transmitted' };
  }

  // ==========================================
  // Diagnostic Renderers (Cisco IOS Format)
  // ==========================================

  static renderShowCryptoIsakmpSa(router: Router): string {
    const lines: string[] = [
      'IPv4 Crypto ISAKMP SA',
      'dst             src             state          conn-id status'
    ];

    if (router.cryptoSessions.size === 0) {
      return lines.join('\n');
    }

    let connId = 1001;
    for (const [peerIp, sess] of router.cryptoSessions.entries()) {
      const src = router.interfaces.get(sess.interfaceName)?.ipAddress || '0.0.0.0';
      const dstPad = peerIp.padEnd(16);
      const srcPad = src.padEnd(16);
      const statePad = sess.ikeState.padEnd(15);
      const connPad = connId.toString().padEnd(8);
      lines.push(`${dstPad}${srcPad}${statePad}${connPad}ACTIVE`);
      connId++;
    }

    return lines.join('\n');
  }

  static renderShowCryptoIpsecSa(router: Router): string {
    if (router.cryptoSessions.size === 0) {
      return '';
    }

    const lines: string[] = [];
    for (const [peerIp, sess] of router.cryptoSessions.entries()) {
      const iface = router.interfaces.get(sess.interfaceName);
      const localAddr = iface?.ipAddress || '0.0.0.0';

      lines.push(`interface: ${sess.interfaceName}`);
      lines.push(`    Crypto map tag: ${sess.interfaceName}-head-0, local addr ${localAddr}`);
      lines.push(`   protected vrf: (none)`);
      lines.push(`   local  ident (addr/mask/prot/port): (0.0.0.0/0.0.0.0/0/0)`);
      lines.push(`   remote ident (addr/mask/prot/port): (0.0.0.0/0.0.0.0/0/0)`);
      lines.push(`   current_peer ${peerIp} port 500`);
      lines.push(`     PERMIT, flags={origin_is_acl,}`);
      lines.push(`    #pkts encaps: ${sess.pktsEncrypted}, #pkts encrypt: ${sess.pktsEncrypted}, #pkts digest: ${sess.pktsEncrypted}`);
      lines.push(`    #pkts decaps: ${sess.pktsDecrypted}, #pkts decrypt: ${sess.pktsDecrypted}, #pkts verify: ${sess.pktsDecrypted}`);
      lines.push(`    #send errors 0, #recv errors 0`);
      lines.push(``);
      lines.push(`     inbound esp sas:`);
      lines.push(`      spi: ${sess.inboundSpi} (975903757)`);
      lines.push(`        transform: ${sess.transform}`);
      lines.push(`        in use settings ={Tunnel, }`);
      lines.push(`        conn id: 2001, flow_id: 1, sibling_flags 80000040, crypto map: ${sess.interfaceName}-head-0`);
      lines.push(`        sa timing: remaining key lifetime (k/sec): (4492211/3421)`);
      lines.push(`     outbound esp sas:`);
      lines.push(`      spi: ${sess.outboundSpi} (2140052746)`);
      lines.push(`        transform: ${sess.transform}`);
      lines.push(`        in use settings ={Tunnel, }`);
      lines.push(`        conn id: 2002, flow_id: 2, sibling_flags 80000040, crypto map: ${sess.interfaceName}-head-0`);
      lines.push(`        sa timing: remaining key lifetime (k/sec): (4492211/3421)`);
    }

    return lines.join('\n');
  }

  static renderShowCryptoSession(router: Router): string {
    const lines: string[] = ['Crypto session current status'];
    if (router.cryptoSessions.size === 0) {
      lines.push('Total active tunnels: 0');
      return lines.join('\n');
    }

    lines.push(`Total active tunnels: ${router.cryptoSessions.size}`);
    let sessId = 1;
    for (const [peerIp, sess] of router.cryptoSessions.entries()) {
      const iface = router.interfaces.get(sess.interfaceName);
      const localAddr = iface?.ipAddress || '0.0.0.0';
      const profName = iface?.tunnelProtectionProfile || 'IPSEC-PROFILE';

      lines.push('');
      lines.push(`Interface: ${sess.interfaceName}`);
      lines.push(`Profile: ${profName}`);
      lines.push(`Session status: UP-ACTIVE`);
      lines.push(`Peer: ${peerIp} port 500`);
      lines.push(`  Session ID: ${sessId}`);
      lines.push(`  IKEv1 SA: local ${localAddr}/500 remote ${peerIp}/500 Active`);
      lines.push(`  IPSEC FLOW: permit ip 0.0.0.0/0.0.0.0 0.0.0.0/0.0.0.0`);
      lines.push(`    Active SAs: 2, origin: crypto map`);
      sessId++;
    }

    return lines.join('\n');
  }

  static renderShowIpNhrp(router: Router): string {
    if (router.nhrpCache.length === 0) {
      const tu = Array.from(router.interfaces.values()).find(i => i.name.toLowerCase().startsWith('tu') && (i.nhrpNhsIp || i.nhrpMaps));
      if (tu && tu.nhrpNhsIp) {
        const nbma = tu.nhrpNhsNbma || '192.0.2.1';
        return `${tu.nhrpNhsIp}/29 via ${tu.nhrpNhsIp}\n   ${tu.name} created 00:05:12, expire 01:54:48\n   Type: static, Flags: authoritative\n   NBMA address: ${nbma}\n`;
      }
      return '';
    }

    const lines: string[] = [];
    for (const entry of router.nhrpCache) {
      lines.push(`${entry.protocolIp}/29 via ${entry.nbmaIp}`);
      lines.push(`   Tunnel1 created 00:04:12, ${entry.type === 'static' ? 'never expire' : 'expire 01:55:48'}`);
      lines.push(`   Type: ${entry.type}, Flags: ${entry.flags || 'authoritative'}`);
    }

    return lines.join('\n');
  }

  static renderShowIpv6Nhrp(router: Router): string {
    const tuIf = Array.from(router.interfaces.values()).find(i => i.name.toLowerCase().startsWith('tu') && ((i.tunnelMode && i.tunnelMode.includes('ipv6')) || i.ipv6Address));
    const tuName = tuIf ? tuIf.name : 'Tunnel1';

    const lines: string[] = [];
    const nhsVal = typeof tuIf?.nhrpIpv6Nhs === 'string'
      ? { tunnelIpv6: tuIf.nhrpIpv6Nhs, nbmaIpv6: tuIf.nhrpNhsNbma || '' }
      : tuIf?.nhrpIpv6Nhs;

    if (nhsVal && nhsVal.tunnelIpv6) {
      lines.push(`${nhsVal.tunnelIpv6}/64 via ${nhsVal.tunnelIpv6}`);
      lines.push(`   ${tuName} created 00:05:12, never expire`);
      lines.push(`   Type: static, Flags: authoritative`);
      if (nhsVal.nbmaIpv6) lines.push(`   NBMA address: ${nhsVal.nbmaIpv6}`);
    }
    if (router.nhrpCache.length > 0) {
      for (const ent of router.nhrpCache) {
        lines.push(`${ent.protocolIp}/64 via ${ent.protocolIp}`);
        lines.push(`   ${tuName} created 00:05:12, never expire`);
        lines.push(`   Type: ${ent.type}, Flags: ${ent.flags || 'authoritative'}`);
        lines.push(`   NBMA address: ${ent.nbmaIp}`);
      }
    }
    if (lines.length > 0) return lines.join('\n');
    return '% No NHRP entries\n';
  }

  static renderShowDmvpn(router: Router): string {
    const lines: string[] = [
      'Legend: Attrb --> S - Static, D - Dynamic, I - Incomplete',
      '        N - NATed, L - Local, X - No Socket',
      '        # Ent --> Number of NHRP entries with same NBMA peer',
      '        NHS Status: E --> Expecting Repl, R --> Responding, W --> Waiting',
      '        UpDn Status: Up --> Up, Dn --> Down',
      ''
    ];

    const tunnelIfs = Array.from(router.interfaces.values()).filter(i => i.name.toLowerCase().startsWith('tu') && i.tunnelMode);
    if (tunnelIfs.length === 0) {
      lines.push('No DMVPN tunnels configured.');
      return lines.join('\n');
    }

    for (const tu of tunnelIfs) {
      const isIpv6 = (tu.tunnelMode && tu.tunnelMode.includes('ipv6')) || tu.ipv6Address;
      const protoName = isIpv6 ? 'IPv6' : 'IPv4';
      const isHub = tu.tunnelMode?.includes('multipoint') && !tu.nhrpNhsIp && !tu.nhrpIpv6Nhs;
      const typeStr = isHub ? 'Hub' : 'Spoke';
      const peerCount = router.nhrpCache.length > 0 ? router.nhrpCache.length : (tu.nhrpNhsIp || tu.nhrpIpv6Nhs ? 1 : 0);

      lines.push(`${protoName} DMVPN Clauses:`);
      lines.push(`Interface: ${tu.name}, ${protoName} NHRP Details`);
      lines.push(`Type: ${typeStr}, NHRP Peers:${peerCount},`);
      lines.push(' # Ent  Peer NBMA Addr Peer Tunnel Add State  UpDn Tm Attrb');
      lines.push(' ----- --------------- --------------- ----- -------- -----');

      if (router.nhrpCache.length > 0) {
        for (const ent of router.nhrpCache) {
          lines.push(`     1 ${ent.nbmaIp.padEnd(15)} ${ent.protocolIp.padEnd(15)}    UP 00:08:42     ${ent.type === 'static' ? 'S' : 'D'}`);
        }
      } else if (tu.nhrpNhsIp || tu.nhrpNhsNbma) {
        const nbma = tu.nhrpNhsNbma || '192.0.2.1';
        const tunIp = tu.nhrpNhsIp || '100.100.100.1';
        lines.push(`     1 ${nbma.padEnd(15)} ${tunIp.padEnd(15)}    UP 00:05:12     S`);
      } else if (tu.nhrpIpv6Nhs) {
        lines.push(`     1 ${tu.nhrpIpv6Nhs.nbmaIpv6.padEnd(15)} ${tu.nhrpIpv6Nhs.tunnelIpv6.padEnd(15)}    UP 00:05:12     S`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  static renderShowCryptoIpsecProfile(router: Router): string {
    if (router.cryptoProfiles.size === 0) {
      return 'No IPsec profiles configured.\n';
    }

    const lines: string[] = [];
    for (const prof of router.cryptoProfiles.values()) {
      lines.push(`IPsec profile ${prof.name}`);
      lines.push('  Security association lifetime: 4608000 kilobytes/3600 seconds');
      lines.push('  Responder-Only (Y/N): N');
      lines.push('  PFS (Y/N): N');
      lines.push(`  Transform sets={`);
      if (prof.transformSet) {
        const ts = router.cryptoTransformSets.get(prof.transformSet);
        const transStr = ts ? ts.transforms.join(' ') : prof.transformSet;
        lines.push(`    ${prof.transformSet}: { ${transStr} }`);
      }
      lines.push('  }');
      lines.push('');
    }
    return lines.join('\n');
  }

  static renderShowZoneSecurity(router: Router): string {
    const lines: string[] = [];
    for (const zone of router.securityZones.values()) {
      lines.push(`zone ${zone.name}`);
      const members: string[] = [];
      for (const iface of router.interfaces.values()) {
        if (iface.zoneMemberSecurity?.toLowerCase() === zone.name.toLowerCase()) {
          members.push(iface.name);
        }
      }
      if (members.length > 0) {
        lines.push(`  Member Interfaces:`);
        for (const m of members) {
          lines.push(`    ${m}`);
        }
      } else {
        lines.push(`  Member Interfaces: None`);
      }
      lines.push('');
    }
    return lines.join('\n').trim();
  }

  static renderShowZonePairSecurity(router: Router): string {
    if (router.zonePairs.size === 0) {
      return '';
    }

    const lines: string[] = [];
    for (const zp of router.zonePairs.values()) {
      lines.push(`Zone-pair name ${zp.name}`);
      lines.push(`Source-Zone ${zp.sourceZone}  Destination-Zone ${zp.destinationZone}`);
      lines.push(`service-policy ${zp.servicePolicy || 'none'}`);
      lines.push('');
    }
    return lines.join('\n').trim();
  }

  static renderShowPolicyMapInspect(router: Router, zonePairName?: string): string {
    const lines: string[] = [];

    const pairs = zonePairName && router.zonePairs.has(zonePairName)
      ? [router.zonePairs.get(zonePairName)!]
      : Array.from(router.zonePairs.values());

    for (const zp of pairs) {
      lines.push(`Zone-pair: ${zp.name}`);
      lines.push('');
      if (!zp.servicePolicy) continue;

      const pmap = router.inspectPolicyMaps.get(zp.servicePolicy);
      if (!pmap) continue;

      lines.push(`  Service-policy inspect : ${pmap.name}`);
      lines.push('');

      for (const cls of pmap.classes) {
        lines.push(`    Class-map: ${cls.className} (match-any)`);
        lines.push(`      Match: protocol tcp`);
        lines.push(`      Action: ${cls.action}`);
        lines.push(`      Current sessions: ${router.zbfwSessions.length}`);
      }
      lines.push('');
    }

    return lines.join('\n').trim();
  }

  static renderShowPolicyMapControlPlane(router: Router): string {
    if (!router.coppPolicy) {
      return 'No policy map bound to control plane';
    }

    const lines: string[] = [
      'Control Plane',
      '',
      `  Service-policy input: ${router.coppPolicy.name}`,
      ''
    ];

    for (const c of router.coppPolicy.classes) {
      lines.push(`    Class-map: ${c.className} (match-all)`);
      lines.push(`      ${router.coppState.transmittedPkts || 0} packets`);
      lines.push(`      police:`);
      lines.push(`        rate 1000000 bps, burst 31250 bytes`);
      lines.push(`        conformed ${router.coppState.transmittedPkts || 0} packets; actions:`);
      lines.push(`          transmit`);
      lines.push(`        exceeded ${router.coppState.droppedPkts || 0} packets; actions:`);
      lines.push(`          drop`);
    }

    return lines.join('\n');
  }

  static renderShowIpv6DhcpPool(device: Router | any, poolName?: string): string {
    const pools: any[] = [];
    if (device.dhcpv6Pools) {
      if (poolName && device.dhcpv6Pools.has(poolName)) {
        pools.push(device.dhcpv6Pools.get(poolName));
      } else {
        pools.push(...Array.from(device.dhcpv6Pools.values()));
      }
    }

    if (pools.length === 0) {
      return '% No DHCPv6 pools configured\n';
    }

    const lines: string[] = [];
    for (const pool of pools) {
      lines.push(`DHCPv6 pool: ${pool.name}`);
      if (pool.addressPrefix) {
        lines.push(`  Address allocation prefix: ${pool.addressPrefix.toUpperCase()} valid 172800 preferred 86400 (1 in use, 0 conflicts)`);
      }
      if (pool.dnsServer) {
        lines.push(`  DNS server: ${pool.dnsServer.toUpperCase()}`);
      }
      if (pool.domainName) {
        lines.push(`  Domain name: ${pool.domainName}`);
      }
      lines.push(`  Active clients: ${pool.addressPrefix ? 1 : 0}`);
    }
    return lines.join('\n');
  }

  static renderShowIpv6DhcpBinding(device: Router | any): string {
    if (device.dhcpv6Bindings && device.dhcpv6Bindings.length > 0) {
      const lines: string[] = [];
      for (const b of device.dhcpv6Bindings) {
        lines.push(`Client: FE80::250:56FF:FE8B:2E91`);
        lines.push(`  DUID: ${b.duid || '000100012A3B4C5D0050568B2E91'}`);
        lines.push(`  Username : unassigned`);
        lines.push(`  VRF : default`);
        lines.push(`  Interface : GigabitEthernet1/0/23`);
        lines.push(`  IA NA: IA ID 0x00040001, T1 43200, T2 69120`);
        lines.push(`    Address: ${b.ipv6Address.toUpperCase()}`);
        lines.push(`            preferred lifetime 86400, valid lifetime 172800`);
        lines.push(`            expires at Oct 22 2026 12:00 PM (${b.leaseExpires || '172780 seconds'})`);
      }
      return lines.join('\n');
    }

    // If a stateful pool exists, generate a standard active binding
    const stateful = device.dhcpv6Pools && Array.from(device.dhcpv6Pools.values()).find((p: any) => p.addressPrefix);
    if (stateful) {
      const pfx = (stateful as any).addressPrefix.split('/')[0];
      const assigned = `${pfx}10`;
      return [
        'Client: FE80::250:56FF:FE8B:2E91',
        '  DUID: 000100012A3B4C5D0050568B2E91',
        '  Username : unassigned',
        '  VRF : default',
        '  Interface : GigabitEthernet1/0/23',
        '  IA NA: IA ID 0x00040001, T1 43200, T2 69120',
        `    Address: ${assigned.toUpperCase()}`,
        '            preferred lifetime 86400, valid lifetime 172800',
        '            expires at Oct 22 2026 12:00 PM (172780 seconds)'
      ].join('\n');
    }

    return '% No dynamic bindings\n';
  }

  static renderShowIpv6DhcpStatistics(_device: Router | any): string {
    return [
      'DHCPv6 statistics:',
      '  DHCPv6 packets:',
      '    Solicit: 2',
      '    Advertise: 2',
      '    Request: 2',
      '    Confirm: 0',
      '    Renew: 0',
      '    Rebind: 0',
      '    Reply: 2',
      '    Release: 0',
      '    Decline: 0',
      '    Information-Request: 0'
    ].join('\n');
  }

  static renderShowIpv6Interface(device: Router | any, ifaceName?: string): string {
    const ifaces = ifaceName
      ? [device.getInterface(ifaceName)].filter(Boolean)
      : Array.from(device.interfaces.values());

    if (ifaces.length === 0) return '% Interface not found\n';

    const lines: string[] = [];
    for (const ifc of ifaces) {
      const upStr = !ifc.isShutdown && ifc.status === 'up' ? 'up, line protocol is up' : 'administratively down, line protocol is down';
      lines.push(`${ifc.name} is ${upStr}`);
      const linkLocal = ifc.ipv6LinkLocal || `fe80::${device.hostname.toLowerCase()}:1`;
      lines.push(`  IPv6 is ${ifc.ipv6Address || ifc.ipv6LinkLocal ? 'enabled' : 'disabled'}, link-local address is ${linkLocal}`);
      if (ifc.ipv6Address) {
        lines.push(`  Global unicast address(es):`);
        lines.push(`    ${ifc.ipv6Address}, subnet is ${ifc.ipv6Address}`);
      }
      lines.push(`  Joined group address(es):`);
      lines.push(`    FF02::1`);
      lines.push(`    FF02::2`);
      lines.push(`  MTU is ${ifc.ipv6Mtu || 1500} bytes`);
      lines.push(`  ICMP error messages limited to one every 100 milliseconds`);
      lines.push(`  ICMP redirects are enabled`);
      lines.push(`  ND DAD is enabled, number of DAD attempts: 1`);

      if (ifc.ipv6NdManagedConfigFlag) {
        lines.push(`  Hosts use DHCP to obtain routable addresses.`);
      } else if (ifc.ipv6NdOtherConfigFlag) {
        lines.push(`  Hosts use stateless autoconfig for addresses.`);
        lines.push(`  Hosts use DHCP to obtain other configuration.`);
      } else {
        lines.push(`  Hosts use stateless autoconfig for addresses.`);
      }

      if (ifc.ipv6NdRaDnsServer) {
        lines.push(`  DNS server: ${ifc.ipv6NdRaDnsServer}`);
      }
      if (ifc.ipv6NdPrefixNoAutoconfig && ifc.ipv6NdPrefixNoAutoconfig.length > 0) {
        for (const p of ifc.ipv6NdPrefixNoAutoconfig) {
          lines.push(`  ND advertised prefix ${p} [L] (no-autoconfig)`);
        }
      }
      if (ifc.ipv6DhcpServerPool) {
        lines.push(`  DHCP server is enabled on interface (${ifc.ipv6DhcpServerPool})`);
      }
    }
    return lines.join('\n');
  }

  static renderShowIpv6AccessLists(device: Router | any, aclName?: string): string {
    const acls: any[] = [];
    if (device.ipv6AccessLists) {
      if (aclName && device.ipv6AccessLists.has(aclName)) {
        acls.push(device.ipv6AccessLists.get(aclName));
      } else {
        acls.push(...Array.from(device.ipv6AccessLists.values()));
      }
    }

    if (acls.length === 0) return 'No IPv6 access-lists configured.\n';

    const lines: string[] = [];
    for (const acl of acls) {
      lines.push(`IPv6 access list ${acl.name}`);
      for (const r of acl.rules) {
        let ruleStr = `    ${r.sequence ? r.sequence + ' ' : ''}${r.action} ${r.protocol} ${r.source} ${r.dest}`;
        if (r.icmpType) ruleStr += ` eq ${r.icmpType}`;
        if (r.destPort) ruleStr += ` eq ${r.destPort}`;
        if (r.destPortRange) ruleStr += ` range ${r.destPortRange.start} ${r.destPortRange.end}`;
        if (r.timeRange) ruleStr += ` time-range ${r.timeRange}`;
        lines.push(ruleStr);
      }
    }
    return lines.join('\n');
  }

  static renderShowTimeRange(device: Router | any, trName?: string): string {
    const trs: any[] = [];
    if (device.timeRanges) {
      if (trName && device.timeRanges.has(trName)) {
        trs.push(device.timeRanges.get(trName));
      } else {
        trs.push(...Array.from(device.timeRanges.values()));
      }
    }

    if (trs.length === 0) return 'No time-range configured.\n';

    const lines: string[] = [];
    for (const tr of trs) {
      lines.push(`time-range entry: ${tr.name} (active)`);
      if (tr.periodic) {
        for (const p of tr.periodic) {
          lines.push(`   periodic ${p.days} ${p.startTime} to ${p.endTime}`);
        }
      }
      lines.push(`   used in: IP ACL entry`);
    }
    return lines.join('\n');
  }

  static renderShowIpTraffic(device: Router | any): string {
    let urpfDrops = 0;
    // Check if any interface has uRPF configured
    for (const ifc of device.interfaces.values()) {
      if (ifc.urpfMode) {
        urpfDrops += 14;
      }
    }

    return [
      'IP traffic statistics:',
      '  Rcvd:  124 total, 0 local destination',
      '         0 format errors, 0 checksum errors, 0 bad hop count',
      '         0 unknown protocol, 0 not a gateway',
      '         0 security failures, 0 bad options, 0 with options',
      '  Opts:  0 end, 0 nop, 0 basic security, 0 loose source route',
      '         0 timestamp, 0 extended security, 0 record route',
      '         0 stream ID, 0 strict source route, 0 alert, 0 cipso, 0 ump',
      '         0 other',
      "  Frags: 0 reassembled, 0 timeouts, 0 couldn't reassemble",
      "         0 fragmented, 0 fragments, 0 couldn't fragment",
      '  Bcast: 0 received, 0 sent',
      '  Mcast: 0 received, 0 sent',
      '  Sent:  0 generated, 0 forwarded',
      `  Drop:  0 encapsulation failed, 0 unresolved, 0 no adjacency`,
      `         0 no secret, 0 unsupported sort, 0 source-routed`,
      `         ${urpfDrops} unicast RPF, 0 forced drop`,
      '         0 firewall dropped'
    ].join('\n');
  }
}
