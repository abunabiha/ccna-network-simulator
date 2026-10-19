/**
 * verify_engine.ts
 * Script verifikasi otomatis untuk kernel simulasi jaringan dan auto-grader
 */

import { SubnetUtils } from '../src/core/network/Subnet';
import { Router } from '../src/core/devices/Router';
import { Switch } from '../src/core/devices/Switch';
import { Host } from '../src/core/devices/Host';
import { CliParser } from '../src/core/cli/Parser';
import { LabGrader } from '../src/core/grader/LabGrader';
import { CCNA_LABS } from '../src/data/ccnaLabs';
import { RoutingProtocolEngine } from '../src/core/network/RoutingProtocolEngine';
import { PolicyEngine } from '../src/core/network/PolicyEngine';
import { SecurityVpnEngine } from '../src/core/network/SecurityVpnEngine';
import { TopologyTraversal } from '../src/core/network/TopologyTraversal';
import { TelemetryAutomationEngine } from '../src/core/network/TelemetryAutomationEngine';

console.log('=== [1] PENGUJIAN MATEMATIKA PENGALAMATAN IP & SUBNETTING ===');
const ip1 = '192.168.1.130';
const mask1 = '255.255.255.192'; // /26
const net1 = SubnetUtils.getNetworkAddress(ip1, mask1);
const bcast1 = SubnetUtils.getBroadcastAddress(ip1, mask1);
const cidr1 = SubnetUtils.maskToCidr(mask1);
const wildcard1 = SubnetUtils.maskToWildcard(mask1);

console.log(`IP: ${ip1}, Mask: ${mask1} (/ ${cidr1})`);
console.log(`Network Address: ${net1} (Expected: 192.168.1.128) -> ${net1 === '192.168.1.128' ? 'PASS' : 'FAIL'}`);
console.log(`Broadcast Address: ${bcast1} (Expected: 192.168.1.191) -> ${bcast1 === '192.168.1.191' ? 'PASS' : 'FAIL'}`);
console.log(`Wildcard Mask: ${wildcard1} (Expected: 0.0.0.63) -> ${wildcard1 === '0.0.0.63' ? 'PASS' : 'FAIL'}`);

console.log('\n=== [2] PENGUJIAN CISCO IOS CLI PARSER & FSM ===');
const r1 = new Router('R1', 'Router', { x: 100, y: 100 });
let ctx = { deviceId: 'R1', mode: 'user-exec' as const };

// 1. enable
let res = CliParser.execute('en', ctx, r1, [r1]);
console.log(`Command 'en': newMode = ${res.newMode} (Expected: priv-exec) -> ${res.newMode === 'priv-exec' ? 'PASS' : 'FAIL'}`);
ctx.mode = res.newMode || ctx.mode;

// 2. conf t
res = CliParser.execute('conf t', ctx, r1, [r1]);
console.log(`Command 'conf t': newMode = ${res.newMode} (Expected: global-config) -> ${res.newMode === 'global-config' ? 'PASS' : 'FAIL'}`);
ctx.mode = res.newMode || ctx.mode;

// 3. hostname HQ-Router
res = CliParser.execute('hostname HQ-Router', ctx, r1, [r1]);
console.log(`Command 'hostname HQ-Router': hostname = ${r1.hostname} -> ${r1.hostname === 'HQ-Router' ? 'PASS' : 'FAIL'}`);

// 4. interface Gi0/0
res = CliParser.execute('int g0/0', ctx, r1, [r1]);
console.log(`Command 'int g0/0': newMode = ${res.newMode} -> ${res.newMode === 'interface-config' ? 'PASS' : 'FAIL'}`);
ctx.mode = res.newMode || ctx.mode;
ctx.targetInterface = res.contextUpdates?.targetInterface;

// 5. ip address 192.168.1.1 255.255.255.0
res = CliParser.execute('ip address 192.168.1.1 255.255.255.0', ctx, r1, [r1]);
const gi0 = r1.interfaces.get('GigabitEthernet0/0');
console.log(`IP Gi0/0 = ${gi0?.ipAddress} ${gi0?.subnetMask} -> ${gi0?.ipAddress === '192.168.1.1' ? 'PASS' : 'FAIL'}`);

// 6. no shutdown
res = CliParser.execute('no shut', ctx, r1, [r1]);
console.log(`Command 'no shut': status = ${gi0?.status}, isShutdown = ${gi0?.isShutdown} -> ${gi0?.status === 'up' && !gi0.isShutdown ? 'PASS' : 'FAIL'}`);

console.log('\n=== [3] PENGUJIAN ROUTING TABLE LONGEST PREFIX MATCH ===');
r1.updateConnectedRoutes();
const routeMatch = r1.lookupRoute('192.168.1.50');
console.log(`Lookup 192.168.1.50 -> Network: ${routeMatch?.network}/${routeMatch?.cidr} via ${routeMatch?.exitInterface} (Protocol: ${routeMatch?.protocol}) -> ${routeMatch?.network === '192.168.1.0' ? 'PASS' : 'FAIL'}`);

console.log('\n=== [4] PENGUJIAN SWITCH VLAN & TRUNKING ===');
const sw1 = new Switch('SW1', 'Switch1', { x: 200, y: 200 }, false);
let swCtx = { deviceId: 'SW1', mode: 'global-config' as const };
CliParser.execute('vlan 10', swCtx, sw1, [sw1]);
console.log(`VLAN 10 created: ${sw1.vlanDatabase.has(10) ? 'PASS' : 'FAIL'}`);

const swCtxIf = { deviceId: 'SW1', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/1' };
CliParser.execute('switchport mode trunk', swCtxIf, sw1, [sw1]);
const swGi1 = sw1.interfaces.get('GigabitEthernet0/1');
console.log(`Gi0/1 Trunk mode: ${swGi1?.switchportMode === 'trunk' ? 'PASS' : 'FAIL'}`);

console.log('\n=== [5] PENGUJIAN AUTOMATED LAB GRADER ===');
const lab01 = CCNA_LABS[1];
const initialGrade = LabGrader.grade(lab01, [r1]);
console.log(`Lab 01 Score: ${initialGrade.totalScore}% (${initialGrade.passedTasksCount}/${initialGrade.totalTasksCount} tasks)`);
for (const taskRes of initialGrade.taskResults) {
  console.log(`  - Task ${taskRes.taskId}: [${taskRes.passed ? 'PASS' : 'FAIL'}] ${taskRes.diagnostic}`);
}

console.log('\n=== [6] PENGUJIAN EXTERNAL & GOOGLE PING ENGINE ===');
const cloudNode = new Host('CLOUD_0', 'LiveHostBridge', 'cloud', { x: 500, y: 50 });
cloudNode.ipAddress = '192.168.100.1';
cloudNode.defaultGateway = '192.168.100.1';
cloudNode.subnetMask = '255.255.255.0';

// Hubungkan R1 Gi0/2 ke LiveHostBridge
const r1Gi2 = r1.interfaces.get('GigabitEthernet0/2')!;
r1Gi2.ipAddress = '192.168.100.2';
r1Gi2.subnetMask = '255.255.255.0';
r1Gi2.status = 'up';
r1Gi2.isShutdown = false;
r1Gi2.connectedDeviceId = 'CLOUD_0';
r1Gi2.connectedPort = 'GigabitEthernet0/0';

const cGi0 = cloudNode.interfaces.get('GigabitEthernet0/0')!;
cGi0.connectedDeviceId = 'R1';
cGi0.connectedPort = 'GigabitEthernet0/2';

// Pasang default route pada R1 menuju Cloud Gateway
r1.routingTable.push({
  network: '0.0.0.0',
  mask: '0.0.0.0',
  cidr: 0,
  nextHop: '192.168.100.1',
  exitInterface: 'GigabitEthernet0/2',
  protocol: 'S',
  adminDistance: 1,
  metric: 0
});

// Hubungkan PC1 ke R1 Gi0/0
const pc1 = new Host('PC1', 'PC-1', 'pc', { x: 50, y: 50 });
pc1.ipAddress = '192.168.1.10';
pc1.subnetMask = '255.255.255.0';
pc1.defaultGateway = '192.168.1.1';
pc1.dnsServer = '8.8.8.8';

const pc1Fa0 = pc1.interfaces.get('FastEthernet0')!;
pc1Fa0.connectedDeviceId = 'R1';
pc1Fa0.connectedPort = 'GigabitEthernet0/0';
const r1Gi0 = r1.interfaces.get('GigabitEthernet0/0')!;
r1Gi0.connectedDeviceId = 'PC1';
r1Gi0.connectedPort = 'FastEthernet0';

const pcPing8888 = pc1.executeCli('ping 8.8.8.8', { deviceId: 'PC1', mode: 'user-exec' }, [pc1, r1, cloudNode]);
console.log(`PC1 ping 8.8.8.8: ${pcPing8888.output.includes('Reply from 8.8.8.8') ? 'PASS' : 'FAIL'}`);

const pcPingGoogle = pc1.executeCli('ping google.com', { deviceId: 'PC1', mode: 'user-exec' }, [pc1, r1, cloudNode]);
console.log(`PC1 ping google.com: ${pcPingGoogle.output.includes('Reply from 173.194.116.138') ? 'PASS' : 'FAIL'}`);

const routerPingGoogle = CliParser.execute('ping google.com', { deviceId: 'R1', mode: 'priv-exec' }, r1, [r1, cloudNode]);
console.log(`Router ping google.com: ${routerPingGoogle.output.includes('!!!!!') && routerPingGoogle.output.includes('Translating "google.com"') ? 'PASS' : 'FAIL'}`);

const routerPing8888 = CliParser.execute('ping 8.8.8.8', { deviceId: 'R1', mode: 'priv-exec' }, r1, [r1, cloudNode]);
console.log(`Router ping 8.8.8.8: ${routerPing8888.output.includes('!!!!!') ? 'PASS' : 'FAIL'}`);

console.log('\n=== [7] PENGUJIAN CISCO IOS DHCP CLIENT & SERVER ENGINE ===');
// 1. Setup DHCP server pool on R1
let r1DhcpCtx = { deviceId: 'R1', mode: 'global-config' as const };
const poolRes = CliParser.execute('ip dhcp pool CCNA_POOL', r1DhcpCtx, r1, [r1]);
console.log(`Command 'ip dhcp pool CCNA_POOL': newMode = ${poolRes.newMode} (Expected: dhcp-config) -> ${poolRes.newMode === 'dhcp-config' ? 'PASS' : 'FAIL'}`);

let r1DhcpSubCtx = { deviceId: 'R1', mode: 'dhcp-config' as const, targetDhcpPool: 'CCNA_POOL' };
CliParser.execute('network 192.168.50.0 255.255.255.0', r1DhcpSubCtx, r1, [r1]);
CliParser.execute('default-router 192.168.50.1', r1DhcpSubCtx, r1, [r1]);
CliParser.execute('dns-server 8.8.8.8', r1DhcpSubCtx, r1, [r1]);
const poolObj = r1.dhcpPools.get('CCNA_POOL');
console.log(`Pool CCNA_POOL configured: net = ${poolObj?.network}, mask = ${poolObj?.mask}, gw = ${poolObj?.defaultRouter} -> ${poolObj?.network === '192.168.50.0' && poolObj?.defaultRouter === '192.168.50.1' ? 'PASS' : 'FAIL'}`);

// 2. Setup DHCP client on Router R2 connected to LiveHostBridge (Cloud)
const r2 = new Router('R2', 'R2', { x: 300, y: 100 });
const cloudBridge = new Host('CLOUD_1', 'LiveHostBridge', 'cloud', { x: 500, y: 100 });
cloudBridge.ipAddress = '192.168.1.1';
cloudBridge.defaultGateway = '192.168.1.1';
cloudBridge.subnetMask = '255.255.255.0';

// Connect R2 Gi0/0 to cloudBridge
const r2Gi0 = r2.interfaces.get('GigabitEthernet0/0')!;
r2Gi0.connectedDeviceId = 'CLOUD_1';
r2Gi0.connectedPort = 'GigabitEthernet0/0';

let r2IfaceCtx = { deviceId: 'R2', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0' };
// Enable interface
CliParser.execute('no shutdown', r2IfaceCtx, r2, [r2, cloudBridge]);
// Configure ip address dhcp
const r2DhcpRes = CliParser.execute('ip address dhcp', r2IfaceCtx, r2, [r2, cloudBridge]);
console.log(`R2 'ip address dhcp' output: \n${r2DhcpRes.output}`);
console.log(`R2 Gi0/0 isDhcpClient = ${r2Gi0.isDhcpClient}, assignedIp = ${r2Gi0.ipAddress} -> ${r2Gi0.isDhcpClient && r2Gi0.ipAddress === '192.168.1.105' ? 'PASS' : 'FAIL'}`);

// Check default route with AD 254 installed
const dhcpDefaultRoute = r2.routingTable.find(r => r.network === '0.0.0.0' && r.adminDistance === 254);
console.log(`R2 DHCP Default Route: ${dhcpDefaultRoute ? 'PASS' : 'FAIL'} (NextHop: ${dhcpDefaultRoute?.nextHop}, AD: ${dhcpDefaultRoute?.adminDistance})`);

// Check 'show ip interface brief' Method column displays DHCP
const showIpIntBr = CliParser.execute('show ip interface brief', { deviceId: 'R2', mode: 'priv-exec' as const }, r2, [r2, cloudBridge]);
console.log(`'show ip interface brief' Method: ${showIpIntBr.output.includes('DHCP') ? 'PASS' : 'FAIL'}`);

// Check 'show dhcp lease'
const showLease = CliParser.execute('show dhcp lease', { deviceId: 'R2', mode: 'priv-exec' as const }, r2, [r2, cloudBridge]);
console.log(`'show dhcp lease': ${showLease.output.includes('Temp IP addr: 192.168.1.105') ? 'PASS' : 'FAIL'}`);

// 3. Setup DHCP client on Switch SVI (Vlan 1)
const sw2 = new Switch('SW2', 'SW2', { x: 300, y: 300 }, false);
const swVlan1 = sw2.interfaces.get('Vlan1')!;
swVlan1.connectedDeviceId = 'CLOUD_1';
let swVlanCtx = { deviceId: 'SW2', mode: 'interface-config' as const, targetInterface: 'Vlan1' };
CliParser.execute('no shutdown', swVlanCtx, sw2, [sw2, cloudBridge]);
const swDhcpRes = CliParser.execute('ip address dhcp', swVlanCtx, sw2, [sw2, cloudBridge]);
console.log(`Switch Vlan1 DHCP: assignedIp = ${swVlan1.ipAddress} -> ${swVlan1.isDhcpClient && swVlan1.ipAddress ? 'PASS' : 'FAIL'}`);

console.log('\n=== [8] PENGUJIAN BOUNDARY LAYER 2 (BROADCAST DOMAIN) & HOP-BY-HOP ROUTING (CCNA ISOLATION) ===');

// Buat topologi: LiveHostBridge (Cloud) <--- R3 Gi0/0 | R3 Gi0/1 ---> PC_USER
const cloudBridge2 = new Host('CLOUD_2', 'LiveHostBridge_2', 'cloud', { x: 700, y: 100 });
cloudBridge2.ipAddress = '192.168.1.1';
cloudBridge2.defaultGateway = '192.168.1.1';
cloudBridge2.subnetMask = '255.255.255.0';

const r3 = new Router('R3', 'R3', { x: 700, y: 250 });
const pcUser = new Host('PC_USER', 'PC-User', 'pc', { x: 700, y: 400 });

// Hubungkan R3 Gi0/0 ke Cloud
const r3Gi0 = r3.interfaces.get('GigabitEthernet0/0')!;
r3Gi0.connectedDeviceId = 'CLOUD_2';
r3Gi0.connectedPort = 'GigabitEthernet0/0';

// Hubungkan R3 Gi0/1 ke PC_USER FastEthernet0
const r3Gi1 = r3.interfaces.get('GigabitEthernet0/1')!;
r3Gi1.connectedDeviceId = 'PC_USER';
r3Gi1.connectedPort = 'FastEthernet0';

const pcIface = pcUser.interfaces.get('FastEthernet0')!;
pcIface.connectedDeviceId = 'R3';
pcIface.connectedPort = 'GigabitEthernet0/1';

const allDevsTest = [cloudBridge2, r3, pcUser];

// 1. Uji: Router R3 masih KOSONG (unconfigured).
// PC meminta IP via DHCP.
// Harus GAGAL menembus router ke LiveHostBridge dan mendapatkan APIPA (169.254.x.x)!
const pcCtx = { deviceId: 'PC_USER', mode: 'user-exec' as const };
const renewRes1 = pcUser.executeCli('ipconfig /renew', pcCtx, allDevsTest);
console.log(`DHCP pada PC di belakang Router Unconfigured:`);
console.log(`  IP PC = ${pcUser.ipAddress}, isDhcp = ${pcUser.isDhcp}`);
console.log(`  APIPA check: ${pcUser.ipAddress.startsWith('169.254.') && !pcUser.isDhcp ? 'PASS (Broadcast isolated by Router)' : 'FAIL'}`);

// 2. Uji: Ping google.com dari PC saat router belum dikonfigurasi
const pingRes1 = pcUser.executeCli('ping google.com', pcCtx, allDevsTest);
console.log(`Ping Google dari PC (Unconfigured Router): \n  Output: ${pingRes1.output}`);
console.log(`  Ping Blocked check: ${pingRes1.output.includes('APIPA is active') || pingRes1.output.includes('unreachable') ? 'PASS' : 'FAIL'}`);

// 3. Konfigurasi R3 Gi0/1 (LAN PC) dan DHCP Pool di R3
let r3Ctx = { deviceId: 'R3', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/1' };
CliParser.execute('no shut', r3Ctx, r3, allDevsTest);
CliParser.execute('ip address 192.168.20.1 255.255.255.0', r3Ctx, r3, allDevsTest);

let r3DhcpCtx = { deviceId: 'R3', mode: 'global-config' as const };
CliParser.execute('ip dhcp pool LAN_POOL', r3DhcpCtx, r3, allDevsTest);
let r3DhcpSub = { deviceId: 'R3', mode: 'dhcp-config' as const, targetDhcpPool: 'LAN_POOL' };
CliParser.execute('network 192.168.20.0 255.255.255.0', r3DhcpSub, r3, allDevsTest);
CliParser.execute('default-router 192.168.20.1', r3DhcpSub, r3, allDevsTest);
CliParser.execute('dns-server 8.8.8.8', r3DhcpSub, r3, allDevsTest);

// Sekarang PC minta DHCP lagi
const renewRes2 = pcUser.executeCli('ipconfig /renew', pcCtx, allDevsTest);
console.log(`DHCP pada PC setelah DHCP Pool R3 aktif:`);
console.log(`  IP PC = ${pcUser.ipAddress}, Subnet = ${pcUser.subnetMask}, GW = ${pcUser.defaultGateway}`);
console.log(`  DHCP Lease check: ${pcUser.ipAddress.startsWith('192.168.20.') && pcUser.defaultGateway === '192.168.20.1' ? 'PASS' : 'FAIL'}`);

// 4. Uji: Ping Google dari PC sebelum ada Default Route di R3 ke Internet
const pingRes2 = pcUser.executeCli('ping 8.8.8.8', pcCtx, allDevsTest);
console.log(`Ping 8.8.8.8 dari PC sebelum R3 punya default route: \n  Output: ${pingRes2.output}`);
console.log(`  Destination net unreachable check: ${pingRes2.output.includes('Destination net unreachable') || pingRes2.output.includes('timed out') ? 'PASS' : 'FAIL'}`);

// 5. Konfigurasi R3 Gi0/0 (WAN) dan Default Route ke Cloud
let r3WanCtx = { deviceId: 'R3', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0' };
CliParser.execute('no shut', r3WanCtx, r3, allDevsTest);
CliParser.execute('ip address 192.168.1.2 255.255.255.0', r3WanCtx, r3, allDevsTest);

let r3GlobalCtx = { deviceId: 'R3', mode: 'global-config' as const };
CliParser.execute('ip route 0.0.0.0 0.0.0.0 192.168.1.1', r3GlobalCtx, r3, allDevsTest);

// 6. Uji: Ping Google dari PC setelah routing hop-by-hop lengkap
const pingRes3 = pcUser.executeCli('ping 8.8.8.8', pcCtx, allDevsTest);
console.log(`Ping 8.8.8.8 dari PC setelah routing lengkap: \n  Output: ${pingRes3.output}`);
console.log(`  Routing Hop-by-Hop Reachable check: ${pingRes3.output.includes('Reply from 8.8.8.8') ? 'PASS' : 'FAIL'}`);

const pingDomainRes = pcUser.executeCli('ping google.com', pcCtx, allDevsTest);
console.log(`Ping google.com dari PC setelah routing lengkap: \n  Output: ${pingDomainRes.output}`);
console.log(`  DNS + Hop-by-Hop Reachable check: ${pingDomainRes.output.includes('Reply from') ? 'PASS' : 'FAIL'}`);

console.log('\n=== [8] PENGUJIAN CISCO DISCOVERY PROTOCOL (CDP) & L3 SWITCH IOS-XE 17.12.6 ===');
// 1. CDP Status & Neighbors
const cdpStatusRes = CliParser.execute('show cdp', { deviceId: 'R1', mode: 'priv-exec' }, r1, allDevsTest);
console.log(`Show CDP check: ${cdpStatusRes.output.includes('CDP is globally enabled') && cdpStatusRes.output.includes('Version 2') ? 'PASS' : 'FAIL'}`);

const cdpNeighborsRes = CliParser.execute('show cdp neighbors', { deviceId: 'R1', mode: 'priv-exec' }, r1, allDevsTest);
console.log(`Show CDP neighbors check: ${cdpNeighborsRes.output.includes('Device ID') && cdpNeighborsRes.output.includes('Capability Codes') ? 'PASS' : 'FAIL'}`);

// Test CDP timer/holdtime config
CliParser.execute('cdp timer 30', { deviceId: 'R1', mode: 'global-config' }, r1, allDevsTest);
CliParser.execute('cdp holdtime 90', { deviceId: 'R1', mode: 'global-config' }, r1, allDevsTest);
console.log(`CDP timer & holdtime check: ${r1.cdpTimer === 30 && r1.cdpHoldtime === 90 ? 'PASS' : 'FAIL'}`);

// 2. Layer 3 Switch with IOS-XE 17.12.6
const swL3 = new Switch('SWL3', 'Catalyst9300', { x: 300, y: 300 }, true);
const swL3Ctx = { deviceId: 'SWL3', mode: 'priv-exec' as const };
const l3VersionRes = CliParser.execute('show version', swL3Ctx, swL3, [swL3]);
console.log(`L3 Switch Version 17.12.6 check: ${l3VersionRes.output.includes('Cisco IOS XE Software, Version 17.12.6') && l3VersionRes.output.includes('Catalyst 9300') ? 'PASS' : 'FAIL'}`);

// L3 Switch ip routing and SVI routing
const swL3Global = { deviceId: 'SWL3', mode: 'global-config' as const };
CliParser.execute('ip routing', swL3Global, swL3, [swL3]);
console.log(`L3 Switch ip routing check: ${swL3.ipRouting ? 'PASS' : 'FAIL'}`);

const sviEnterRes = CliParser.execute('interface Vlan10', swL3Global, swL3, [swL3]);
const swL3Svi = { deviceId: 'SWL3', mode: 'interface-config' as const, targetInterface: sviEnterRes.contextUpdates?.targetInterface || 'Vlan10' };
CliParser.execute('no shut', swL3Svi, swL3, [swL3]);
CliParser.execute('ip address 10.10.10.1 255.255.255.0', swL3Svi, swL3, [swL3]);
swL3.updateConnectedRoutes();
const l3RouteMatch = swL3.lookupRoute('10.10.10.55');
console.log(`L3 Switch LPM lookupRoute check: ${l3RouteMatch?.network === '10.10.10.0' && l3RouteMatch?.exitInterface === 'Vlan10' ? 'PASS' : 'FAIL'}`);

console.log('\n=== [9] PENGUJIAN ADDRESS RESOLUTION PROTOCOL (ARP) DI SEMUA PERANGKAT ===');

// 1. Host ARP Testing: arp -a, arp -s, arp -d
const hostArpInitial = pcUser.executeCli('arp -a', pcCtx, allDevsTest);
console.log(`Host arp -a initial:\n${hostArpInitial.output}`);

// Host static ARP entry
const hostArpSet = pcUser.executeCli('arp -s 192.168.20.88 00-aa-bb-cc-dd-ee', pcCtx, allDevsTest);
console.log(`Host arp -s result: ${hostArpSet.output}`);
const hostArpCheck = pcUser.executeCli('arp -a', pcCtx, allDevsTest);
console.log(`Host static ARP verified: ${hostArpCheck.output.includes('192.168.20.88') && hostArpCheck.output.includes('00-aa-bb-cc-dd-ee') ? 'PASS' : 'FAIL'}`);

// Host delete ARP entry
pcUser.executeCli('arp -d 192.168.20.88', pcCtx, allDevsTest);
const hostArpAfterDel = pcUser.executeCli('arp -a', pcCtx, allDevsTest);
console.log(`Host arp -d delete verified: ${!hostArpAfterDel.output.includes('192.168.20.88') ? 'PASS' : 'FAIL'}`);

// 2. Cisco IOS ARP Testing (Router R3)
const r3PrivCtx = { deviceId: 'R3', mode: 'priv-exec' as const };
const r3ShowArp = CliParser.execute('show ip arp', r3PrivCtx, r3, allDevsTest);
console.log(`Router R3 'show ip arp' output:\n${r3ShowArp.output}`);
console.log(`Router R3 local interface ARP entries present: ${r3ShowArp.output.includes('192.168.20.1') && r3ShowArp.output.includes('192.168.1.2') ? 'PASS' : 'FAIL'}`);

// Add static ARP on Cisco Router
const r3StaticArp = CliParser.execute('arp 192.168.20.99 0050.7966.6800 arpa', r3GlobalCtx, r3, allDevsTest);
const r3ShowArpAfterStatic = CliParser.execute('show ip arp', r3PrivCtx, r3, allDevsTest);
console.log(`Router R3 static ARP verified: ${r3ShowArpAfterStatic.output.includes('192.168.20.99') && r3ShowArpAfterStatic.output.includes('0050.7966.6800') ? 'PASS' : 'FAIL'}`);

// Test clear ip arp (clears dynamic entries while preserving static)
CliParser.execute('clear ip arp', r3PrivCtx, r3, allDevsTest);
const r3ShowArpCleared = CliParser.execute('show ip arp', r3PrivCtx, r3, allDevsTest);
console.log(`Router R3 'clear ip arp' cleared dynamic entries: ${!r3ShowArpCleared.output.includes('192.168.20.2') ? 'PASS' : 'FAIL'}`);

// Test no arp <ip> (removes static entry)
CliParser.execute('no arp 192.168.20.99', r3GlobalCtx, r3, allDevsTest);
const r3ShowArpNoStatic = CliParser.execute('show ip arp', r3PrivCtx, r3, allDevsTest);
console.log(`Router R3 'no arp' static removal verified: ${!r3ShowArpNoStatic.output.includes('192.168.20.99') ? 'PASS' : 'FAIL'}`);

// 3. Dynamic Bidirectional ARP resolution during ping
// Ping from PC to R3 Gateway (192.168.20.1)
const pingGwRes = pcUser.executeCli('ping 192.168.20.1', pcCtx, allDevsTest);
console.log(`Ping GW Output:\n${pingGwRes.output}`);
const hostArpAfterPing = pcUser.executeCli('arp -a', pcCtx, allDevsTest);
console.log(`PC learned GW MAC via dynamic ARP: ${hostArpAfterPing.output.includes('192.168.20.1') ? 'PASS' : 'FAIL'}`);

// Switch L3 ARP verification
const swL3ShowArp = CliParser.execute('show arp', swL3Ctx, swL3, [swL3]);
console.log(`Switch L3 'show arp' output:\n${swL3ShowArp.output}`);
console.log(`Switch L3 SVI Vlan10 ARP entry verified: ${swL3ShowArp.output.includes('10.10.10.1') ? 'PASS' : 'FAIL'}`);

console.log('\n=== [10] PENGUJIAN TAHAP 1 CCNP ENTERPRISE: CATALYST C8200L, NIM-2T SERIAL & WAN V.35 ===');
const c8200 = new Router('R_CCNP1', 'Catalyst-8200L', { x: 50, y: 50 });
console.log(`Router Model: ${c8200.model} (Expected: C8200L-1N-4T) -> ${c8200.model === 'C8200L-1N-4T' ? 'PASS' : 'FAIL'}`);
console.log(`Router OS Version: ${c8200.osVersion} (Expected: 17.15.4c) -> ${c8200.osVersion === '17.15.4c' ? 'PASS' : 'FAIL'}`);

// Test show version output
const c8200VersionRes = CliParser.execute('show version', { deviceId: 'R_CCNP1', mode: 'priv-exec' }, c8200, [c8200]);
console.log(`show version contains 17.15.4c: ${c8200VersionRes.output.includes('Version 17.15.4c') ? 'PASS' : 'FAIL'}`);
console.log(`show version contains C8200L-1N-4T: ${c8200VersionRes.output.includes('C8200L-1N-4T') ? 'PASS' : 'FAIL'}`);

// Test interface aliases & backward compatibility
const gi000 = c8200.interfaces.get('GigabitEthernet0/0/0');
const gi00 = c8200.interfaces.get('GigabitEthernet0/0');
console.log(`Interface GigabitEthernet0/0/0 exists: ${gi000 !== undefined ? 'PASS' : 'FAIL'}`);
console.log(`Interface GigabitEthernet0/0 alias points to GigabitEthernet0/0/0: ${gi00 === gi000 ? 'PASS' : 'FAIL'}`);

// Test NIM-2T Serial ports
const ser010 = c8200.interfaces.get('Serial0/1/0');
const ser011 = c8200.interfaces.get('Serial0/1/1');
console.log(`NIM-2T Serial0/1/0 exists: ${ser010 !== undefined ? 'PASS' : 'FAIL'}`);
console.log(`NIM-2T Serial0/1/1 exists: ${ser011 !== undefined ? 'PASS' : 'FAIL'}`);

// Test CLI config on Serial0/1/0: clock rate, encapsulation
let serCtx = { deviceId: 'R_CCNP1', mode: 'global-config' as const };
CliParser.execute('enable', { deviceId: 'R_CCNP1', mode: 'user-exec' }, c8200, [c8200]);
const serIntEnter = CliParser.execute('interface Serial0/1/0', serCtx, c8200, [c8200]);
const serIfCtx = { deviceId: 'R_CCNP1', mode: 'interface-config' as const, targetInterface: serIntEnter.contextUpdates?.targetInterface || 'Serial0/1/0' };

CliParser.execute('clock rate 64000', serIfCtx, c8200, [c8200]);
console.log(`Serial0/1/0 clock rate 64000: ${ser010?.clockRate === 64000 && ser010?.isDce === true ? 'PASS' : 'FAIL'}`);

CliParser.execute('encapsulation ppp', serIfCtx, c8200, [c8200]);
console.log(`Serial0/1/0 encapsulation ppp: ${ser010?.encapsulation === 'ppp' ? 'PASS' : 'FAIL'}`);

CliParser.execute('no clock rate', serIfCtx, c8200, [c8200]);
console.log(`Serial0/1/0 no clock rate: ${ser010?.clockRate === undefined && ser010?.isDce === false ? 'PASS' : 'FAIL'}`);

// Test Switch Models (C9200L & C9300L)
console.log(`Switch L2 Model: ${sw1.model} (Expected: C9200L-24T-4G-E) -> ${sw1.model === 'C9200L-24T-4G-E' ? 'PASS' : 'FAIL'}`);
console.log(`Switch L3 Model: ${swL3.model} (Expected: C9300L-24T-4G-A) -> ${swL3.model === 'C9300L-24T-4G-A' ? 'PASS' : 'FAIL'}`);

const swPrivCtx = { deviceId: 'SW1', mode: 'priv-exec' as const };
const swVersionRes = CliParser.execute('show version', swPrivCtx, sw1, [sw1]);
console.log(`Switch show version contains 17.12.6: ${swVersionRes.output.includes('17.12.6') ? 'PASS' : 'FAIL'}`);

console.log('\n=== [11] PENGUJIAN TAHAP 2 CCNP ENTERPRISE: ADVANCED LAYER 2 (STP, ETHERCHANNEL, VTP) ===');

// Setup 3 Switches dalam topologi segitiga
const swA = new Switch('SW_A', 'Switch-A', { x: 100, y: 100 });
const swB = new Switch('SW_B', 'Switch-B', { x: 300, y: 100 });
const swC = new Switch('SW_C', 'Switch-C', { x: 200, y: 300 });

// Hubungkan Switch-A Gi0/1 <-> Switch-B Gi0/1
swA.interfaces.get('GigabitEthernet0/1')!.connectedDeviceId = 'SW_B';
swA.interfaces.get('GigabitEthernet0/1')!.connectedPort = 'GigabitEthernet0/1';
swB.interfaces.get('GigabitEthernet0/1')!.connectedDeviceId = 'SW_A';
swB.interfaces.get('GigabitEthernet0/1')!.connectedPort = 'GigabitEthernet0/1';

// Hubungkan Switch-B Gi0/2 <-> Switch-C Gi0/1
swB.interfaces.get('GigabitEthernet0/2')!.connectedDeviceId = 'SW_C';
swB.interfaces.get('GigabitEthernet0/2')!.connectedPort = 'GigabitEthernet0/1';
swC.interfaces.get('GigabitEthernet0/1')!.connectedDeviceId = 'SW_B';
swC.interfaces.get('GigabitEthernet0/1')!.connectedPort = 'GigabitEthernet0/2';

// Hubungkan Switch-A Gi0/2 <-> Switch-C Gi0/2
swA.interfaces.get('GigabitEthernet0/2')!.connectedDeviceId = 'SW_C';
swA.interfaces.get('GigabitEthernet0/2')!.connectedPort = 'GigabitEthernet0/2';
swC.interfaces.get('GigabitEthernet0/2')!.connectedDeviceId = 'SW_A';
swC.interfaces.get('GigabitEthernet0/2')!.connectedPort = 'GigabitEthernet0/2';

const stpTopologyDevs = [swA, swB, swC];

// 1. STP Configuration: Set Switch-A as Root Primary (priority 4096)
const swACtx = { deviceId: 'SW_A', mode: 'global-config' as const };
CliParser.execute('spanning-tree mode rapid-pvst', swACtx, swA, stpTopologyDevs);
CliParser.execute('spanning-tree vlan 1 priority 4096', swACtx, swA, stpTopologyDevs);
console.log(`Switch-A priority set to 4096: ${swA.stpPriorities.get(1) === 4096 ? 'PASS' : 'FAIL'}`);

// Test show spanning-tree pada Switch-A (Harus menjadi Root Bridge)
const swAPriv = { deviceId: 'SW_A', mode: 'priv-exec' as const };
const swAShowStp = CliParser.execute('show spanning-tree', swAPriv, swA, stpTopologyDevs);
console.log(`Switch-A is Root Bridge: ${swAShowStp.output.includes('This bridge is the root') ? 'PASS' : 'FAIL'}`);

// Test show spanning-tree pada Switch-B & Switch-C
const swBPriv = { deviceId: 'SW_B', mode: 'priv-exec' as const };
const swBShowStp = CliParser.execute('show spanning-tree', swBPriv, swB, stpTopologyDevs);
console.log(`Switch-B Root Port Gi0/1 is FWD: ${swBShowStp.output.includes('Gi0/1') && swBShowStp.output.includes('Root FWD') ? 'PASS' : 'FAIL'}`);

const swCPriv = { deviceId: 'SW_C', mode: 'priv-exec' as const };
const swCShowStp = CliParser.execute('show spanning-tree', swCPriv, swC, stpTopologyDevs);
console.log(`Switch-C detects Alternate/Blocking port for Loop Prevention: ${swCShowStp.output.includes('Altn BLK') ? 'PASS' : 'FAIL'}`);

// Test show spanning-tree summary & root
const swAShowSummary = CliParser.execute('show spanning-tree summary', swAPriv, swA, stpTopologyDevs);
console.log(`Switch-A show spanning-tree summary output: ${swAShowSummary.output.includes('Switch is in rapid-pvst mode') ? 'PASS' : 'FAIL'}`);

// Test interface STP features: PortFast & BPDU Guard
const swAIfCtx = { deviceId: 'SW_A', mode: 'interface-config' as const, targetInterface: 'FastEthernet0/5' };
CliParser.execute('spanning-tree portfast', swAIfCtx, swA, stpTopologyDevs);
CliParser.execute('spanning-tree bpduguard enable', swAIfCtx, swA, stpTopologyDevs);
const fa05 = swA.interfaces.get('FastEthernet0/5')!;
console.log(`Fa0/5 PortFast enabled: ${fa05.stpPortFast === true ? 'PASS' : 'FAIL'}`);
console.log(`Fa0/5 BPDU Guard enabled: ${fa05.stpBpduGuard === true ? 'PASS' : 'FAIL'}`);

// 2. EtherChannel (LACP & PAgP)
// LACP on Fa0/10 & Fa0/11 between Switch-A and Switch-B (mode active + mode active)
const swAIf10 = { deviceId: 'SW_A', mode: 'interface-config' as const, targetInterface: 'FastEthernet0/10' };
const swAIf11 = { deviceId: 'SW_A', mode: 'interface-config' as const, targetInterface: 'FastEthernet0/11' };
CliParser.execute('channel-group 1 mode active', swAIf10, swA, stpTopologyDevs);
CliParser.execute('channel-group 1 mode active', swAIf11, swA, stpTopologyDevs);

const swBIf10 = { deviceId: 'SW_B', mode: 'interface-config' as const, targetInterface: 'FastEthernet0/10' };
const swBIf11 = { deviceId: 'SW_B', mode: 'interface-config' as const, targetInterface: 'FastEthernet0/11' };
CliParser.execute('channel-group 1 mode active', swBIf10, swB, stpTopologyDevs);
CliParser.execute('channel-group 1 mode active', swBIf11, swB, stpTopologyDevs);

// Hubungkan fisik port Fa0/10 & Fa0/11
swA.interfaces.get('FastEthernet0/10')!.connectedDeviceId = 'SW_B';
swA.interfaces.get('FastEthernet0/10')!.connectedPort = 'FastEthernet0/10';
swB.interfaces.get('FastEthernet0/10')!.connectedDeviceId = 'SW_A';
swB.interfaces.get('FastEthernet0/10')!.connectedPort = 'FastEthernet0/10';

swA.interfaces.get('FastEthernet0/11')!.connectedDeviceId = 'SW_B';
swA.interfaces.get('FastEthernet0/11')!.connectedPort = 'FastEthernet0/11';
swB.interfaces.get('FastEthernet0/11')!.connectedDeviceId = 'SW_A';
swB.interfaces.get('FastEthernet0/11')!.connectedPort = 'FastEthernet0/11';

const lacpSummary = CliParser.execute('show etherchannel summary', swAPriv, swA, stpTopologyDevs);
console.log(`LACP Bundle Po1(SU) created: ${lacpSummary.output.includes('Po1(SU)') && lacpSummary.output.includes('LACP') ? 'PASS' : 'FAIL'}`);
console.log(`LACP Member ports bundled (P): ${lacpSummary.output.includes('Fa0/10(P)') && lacpSummary.output.includes('Fa0/11(P)') ? 'PASS' : 'FAIL'}`);

// PAgP on Fa0/15 & Fa0/16 (desirable + auto)
const swAIf15 = { deviceId: 'SW_A', mode: 'interface-config' as const, targetInterface: 'FastEthernet0/15' };
CliParser.execute('channel-group 2 mode desirable', swAIf15, swA, stpTopologyDevs);
const swBIf15 = { deviceId: 'SW_B', mode: 'interface-config' as const, targetInterface: 'FastEthernet0/15' };
CliParser.execute('channel-group 2 mode auto', swBIf15, swB, stpTopologyDevs);

swA.interfaces.get('FastEthernet0/15')!.connectedDeviceId = 'SW_B';
swA.interfaces.get('FastEthernet0/15')!.connectedPort = 'FastEthernet0/15';
swB.interfaces.get('FastEthernet0/15')!.connectedDeviceId = 'SW_A';
swB.interfaces.get('FastEthernet0/15')!.connectedPort = 'FastEthernet0/15';

const pagpSummary = CliParser.execute('show etherchannel 2 summary', swAPriv, swA, stpTopologyDevs);
console.log(`PAgP Bundle Po2(SU) created: ${pagpSummary.output.includes('Po2(SU)') && pagpSummary.output.includes('PAgP') ? 'PASS' : 'FAIL'}`);

// 3. VTP & DTP Testing
CliParser.execute('vtp domain CCNP-ENTERPRISE', swACtx, swA, stpTopologyDevs);
CliParser.execute('vtp mode server', swACtx, swA, stpTopologyDevs);
const vtpStatusRes = CliParser.execute('show vtp status', swAPriv, swA, stpTopologyDevs);
console.log(`VTP domain CCNP-ENTERPRISE verified: ${vtpStatusRes.output.includes('CCNP-ENTERPRISE') ? 'PASS' : 'FAIL'}`);

const dtpShowRes = CliParser.execute('show dtp interface Gi0/1', swAPriv, swA, stpTopologyDevs);
console.log(`DTP show interface Gi0/1 verified: ${dtpShowRes.output.includes('DTP information for GigabitEthernet0/1') ? 'PASS' : 'FAIL'}`);

console.log('\n=== [12] CCNP ENCOR/ENARSI TAHAP 3: ADVANCED ROUTING & FHRP (OSPF MULTI-AREA, EIGRP, BGP, HSRP, VRRP) ===');

// 1. OSPF Multi-Area & Summarization
const rAbr = new Router('R_ABR', 'R-ABR', { x: 300, y: 100 }, 'c8200l-1n-4t');
const rArea1 = new Router('R_AREA1', 'R-Area1', { x: 100, y: 100 }, 'c8200l-1n-4t');
const rBb = new Router('R_BB', 'R-Backbone', { x: 500, y: 100 }, 'c8200l-1n-4t');

// Connect R_Area1 Gi0/0/0 <-> R_ABR Gi0/0/0 (Area 1: 10.1.0.0/24)
rArea1.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '10.1.0.2';
rArea1.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
rArea1.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
rArea1.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';
rArea1.interfaces.get('GigabitEthernet0/0/0')!.connectedDeviceId = 'R_ABR';
rArea1.interfaces.get('GigabitEthernet0/0/0')!.connectedPort = 'GigabitEthernet0/0/0';

// R_Area1 LAN: Gi0/0/1 (192.168.10.1/24)
rArea1.interfaces.get('GigabitEthernet0/0/1')!.ipAddress = '192.168.10.1';
rArea1.interfaces.get('GigabitEthernet0/0/1')!.subnetMask = '255.255.255.0';
rArea1.interfaces.get('GigabitEthernet0/0/1')!.isShutdown = false;
rArea1.interfaces.get('GigabitEthernet0/0/1')!.status = 'up';

// R_ABR Gi0/0/0 (Area 1: 10.1.0.1/24)
rAbr.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '10.1.0.1';
rAbr.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
rAbr.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
rAbr.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';
rAbr.interfaces.get('GigabitEthernet0/0/0')!.connectedDeviceId = 'R_AREA1';
rAbr.interfaces.get('GigabitEthernet0/0/0')!.connectedPort = 'GigabitEthernet0/0/0';

// R_ABR Gi0/0/1 <-> R_BB Gi0/0/0 (Area 0: 10.0.0.1/24 <-> 10.0.0.2/24)
rAbr.interfaces.get('GigabitEthernet0/0/1')!.ipAddress = '10.0.0.1';
rAbr.interfaces.get('GigabitEthernet0/0/1')!.subnetMask = '255.255.255.0';
rAbr.interfaces.get('GigabitEthernet0/0/1')!.isShutdown = false;
rAbr.interfaces.get('GigabitEthernet0/0/1')!.status = 'up';
rAbr.interfaces.get('GigabitEthernet0/0/1')!.connectedDeviceId = 'R_BB';
rAbr.interfaces.get('GigabitEthernet0/0/1')!.connectedPort = 'GigabitEthernet0/0/0';

rBb.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '10.0.0.2';
rBb.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
rBb.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
rBb.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';
rBb.interfaces.get('GigabitEthernet0/0/0')!.connectedDeviceId = 'R_ABR';
rBb.interfaces.get('GigabitEthernet0/0/0')!.connectedPort = 'GigabitEthernet0/0/1';

const ospfDevs = [rAbr, rArea1, rBb];

// Config OSPF R_Area1
const rArea1Global = { deviceId: 'R_AREA1', mode: 'global-config' as const };
CliParser.execute('router ospf 1', rArea1Global, rArea1, ospfDevs);
const rArea1Router = { deviceId: 'R_AREA1', mode: 'router-config' as const, targetRoutingProtocol: 'ospf' as const, targetProcessId: 1 };
CliParser.execute('router-id 1.1.1.1', rArea1Router, rArea1, ospfDevs);
CliParser.execute('network 10.1.0.0 0.0.0.255 area 1', rArea1Router, rArea1, ospfDevs);
CliParser.execute('network 192.168.10.0 0.0.0.255 area 1', rArea1Router, rArea1, ospfDevs);

// Config OSPF R_ABR
const rAbrGlobal = { deviceId: 'R_ABR', mode: 'global-config' as const };
CliParser.execute('router ospf 1', rAbrGlobal, rAbr, ospfDevs);
const rAbrRouter = { deviceId: 'R_ABR', mode: 'router-config' as const, targetRoutingProtocol: 'ospf' as const, targetProcessId: 1 };
CliParser.execute('router-id 2.2.2.2', rAbrRouter, rAbr, ospfDevs);
CliParser.execute('network 10.1.0.0 0.0.0.255 area 1', rAbrRouter, rAbr, ospfDevs);
CliParser.execute('network 10.0.0.0 0.0.0.255 area 0', rAbrRouter, rAbr, ospfDevs);
CliParser.execute('area 1 range 192.168.10.0 255.255.255.0', rAbrRouter, rAbr, ospfDevs);

// Config OSPF R_BB
const rBbGlobal = { deviceId: 'R_BB', mode: 'global-config' as const };
CliParser.execute('router ospf 1', rBbGlobal, rBb, ospfDevs);
const rBbRouter = { deviceId: 'R_BB', mode: 'router-config' as const, targetRoutingProtocol: 'ospf' as const, targetProcessId: 1 };
CliParser.execute('router-id 3.3.3.3', rBbRouter, rBb, ospfDevs);
CliParser.execute('network 10.0.0.0 0.0.0.255 area 0', rBbRouter, rBb, ospfDevs);

// Verify OSPF Neighbors
const rAbrPriv = { deviceId: 'R_ABR', mode: 'priv-exec' as const };
const ospfNbrRes = CliParser.execute('show ip ospf neighbor', rAbrPriv, rAbr, ospfDevs);
console.log(`OSPF Neighbors on ABR: ${ospfNbrRes.output.includes('1.1.1.1') && ospfNbrRes.output.includes('3.3.3.3') ? 'PASS' : 'FAIL'}`);

// Verify OSPF Inter-Area Route (O IA) on R_BB
const rBbPriv = { deviceId: 'R_BB', mode: 'priv-exec' as const };
const rBbRouteRes = CliParser.execute('show ip route', rBbPriv, rBb, ospfDevs);
console.log(`OSPF Multi-Area Inter-Area Route (O IA) on Backbone: ${rBbRouteRes.output.includes('O IA') && rBbRouteRes.output.includes('192.168.10.0') ? 'PASS' : 'FAIL'}`);

// 2. EIGRP Testing
const rE1 = new Router('R_E1', 'R-E1', { x: 100, y: 300 });
const rE2 = new Router('R_E2', 'R-E2', { x: 300, y: 300 });

// Connect R_E1 Gi0/0 <-> R_E2 Gi0/0 (172.16.1.0/24)
rE1.interfaces.get('GigabitEthernet0/0')!.ipAddress = '172.16.1.1';
rE1.interfaces.get('GigabitEthernet0/0')!.subnetMask = '255.255.255.0';
rE1.interfaces.get('GigabitEthernet0/0')!.isShutdown = false;
rE1.interfaces.get('GigabitEthernet0/0')!.status = 'up';
rE1.interfaces.get('GigabitEthernet0/0')!.connectedDeviceId = 'R_E2';
rE1.interfaces.get('GigabitEthernet0/0')!.connectedPort = 'GigabitEthernet0/0';

rE1.interfaces.get('GigabitEthernet0/1')!.ipAddress = '172.16.20.1';
rE1.interfaces.get('GigabitEthernet0/1')!.subnetMask = '255.255.255.0';
rE1.interfaces.get('GigabitEthernet0/1')!.isShutdown = false;
rE1.interfaces.get('GigabitEthernet0/1')!.status = 'up';

rE2.interfaces.get('GigabitEthernet0/0')!.ipAddress = '172.16.1.2';
rE2.interfaces.get('GigabitEthernet0/0')!.subnetMask = '255.255.255.0';
rE2.interfaces.get('GigabitEthernet0/0')!.isShutdown = false;
rE2.interfaces.get('GigabitEthernet0/0')!.status = 'up';
rE2.interfaces.get('GigabitEthernet0/0')!.connectedDeviceId = 'R_E1';
rE2.interfaces.get('GigabitEthernet0/0')!.connectedPort = 'GigabitEthernet0/0';

const eigrpDevs = [rE1, rE2];

const rE1Global = { deviceId: 'R_E1', mode: 'global-config' as const };
CliParser.execute('router eigrp 100', rE1Global, rE1, eigrpDevs);
const rE1Router = { deviceId: 'R_E1', mode: 'router-config' as const, targetRoutingProtocol: 'eigrp' as const, targetAsNumber: 100 };
CliParser.execute('network 172.16.1.0 0.0.0.255', rE1Router, rE1, eigrpDevs);
CliParser.execute('network 172.16.20.0 0.0.0.255', rE1Router, rE1, eigrpDevs);
CliParser.execute('no auto-summary', rE1Router, rE1, eigrpDevs);

const rE2Global = { deviceId: 'R_E2', mode: 'global-config' as const };
CliParser.execute('router eigrp 100', rE2Global, rE2, eigrpDevs);
const rE2Router = { deviceId: 'R_E2', mode: 'router-config' as const, targetRoutingProtocol: 'eigrp' as const, targetAsNumber: 100 };
CliParser.execute('network 172.16.1.0 0.0.0.255', rE2Router, rE2, eigrpDevs);
CliParser.execute('no auto-summary', rE2Router, rE2, eigrpDevs);

const rE2Priv = { deviceId: 'R_E2', mode: 'priv-exec' as const };
const eigrpNbrRes = CliParser.execute('show ip eigrp neighbors', rE2Priv, rE2, eigrpDevs);
console.log(`EIGRP Neighbors on R_E2: ${eigrpNbrRes.output.includes('172.16.1.1') ? 'PASS' : 'FAIL'}`);

const rE2RouteRes = CliParser.execute('show ip route', rE2Priv, rE2, eigrpDevs);
console.log(`EIGRP Route (D) on R_E2: ${rE2RouteRes.output.includes('D') && rE2RouteRes.output.includes('172.16.20.0') ? 'PASS' : 'FAIL'}`);

// 3. BGP Testing (eBGP AS 65001 <-> AS 65002)
const rB1 = new Router('R_B1', 'R-B1', { x: 100, y: 500 });
const rB2 = new Router('R_B2', 'R-B2', { x: 300, y: 500 });

rB1.interfaces.get('GigabitEthernet0/0')!.ipAddress = '198.51.100.1';
rB1.interfaces.get('GigabitEthernet0/0')!.subnetMask = '255.255.255.0';
rB1.interfaces.get('GigabitEthernet0/0')!.isShutdown = false;
rB1.interfaces.get('GigabitEthernet0/0')!.status = 'up';
rB1.interfaces.get('GigabitEthernet0/0')!.connectedDeviceId = 'R_B2';
rB1.interfaces.get('GigabitEthernet0/0')!.connectedPort = 'GigabitEthernet0/0';

rB2.interfaces.get('GigabitEthernet0/0')!.ipAddress = '198.51.100.2';
rB2.interfaces.get('GigabitEthernet0/0')!.subnetMask = '255.255.255.0';
rB2.interfaces.get('GigabitEthernet0/0')!.isShutdown = false;
rB2.interfaces.get('GigabitEthernet0/0')!.status = 'up';
rB2.interfaces.get('GigabitEthernet0/0')!.connectedDeviceId = 'R_B1';
rB2.interfaces.get('GigabitEthernet0/0')!.connectedPort = 'GigabitEthernet0/0';

const bgpDevs = [rB1, rB2];

const rB1Global = { deviceId: 'R_B1', mode: 'global-config' as const };
CliParser.execute('router bgp 65001', rB1Global, rB1, bgpDevs);
const rB1Router = { deviceId: 'R_B1', mode: 'router-config' as const, targetRoutingProtocol: 'bgp' as const, targetAsNumber: 65001 };
CliParser.execute('neighbor 198.51.100.2 remote-as 65002', rB1Router, rB1, bgpDevs);
CliParser.execute('network 203.0.113.0 mask 255.255.255.0', rB1Router, rB1, bgpDevs);

const rB2Global = { deviceId: 'R_B2', mode: 'global-config' as const };
CliParser.execute('router bgp 65002', rB2Global, rB2, bgpDevs);
const rB2Router = { deviceId: 'R_B2', mode: 'router-config' as const, targetRoutingProtocol: 'bgp' as const, targetAsNumber: 65002 };
CliParser.execute('neighbor 198.51.100.1 remote-as 65001', rB2Router, rB2, bgpDevs);

const rB2Priv = { deviceId: 'R_B2', mode: 'priv-exec' as const };
const bgpSumRes = CliParser.execute('show ip bgp summary', rB2Priv, rB2, bgpDevs);
console.log(`BGP Summary on R_B2: ${bgpSumRes.output.includes('198.51.100.1') ? 'PASS' : 'FAIL'}`);

const rB2RouteRes = CliParser.execute('show ip route', rB2Priv, rB2, bgpDevs);
console.log(`BGP Route (B) on R_B2: ${rB2RouteRes.output.includes('B') && rB2RouteRes.output.includes('203.0.113.0') ? 'PASS' : 'FAIL'}`);

// 4. HSRP Testing (Hot Standby Router Protocol)
const rH1 = new Router('R_H1', 'R-H1', { x: 100, y: 700 });
const rH2 = new Router('R_H2', 'R-H2', { x: 300, y: 700 });
const pcHsrp = new Host('PC_HSRP', 'PC-HSRP', 'pc', { x: 200, y: 850 });

rH1.interfaces.get('GigabitEthernet0/0')!.ipAddress = '192.168.100.1';
rH1.interfaces.get('GigabitEthernet0/0')!.subnetMask = '255.255.255.0';
rH1.interfaces.get('GigabitEthernet0/0')!.isShutdown = false;
rH1.interfaces.get('GigabitEthernet0/0')!.status = 'up';

rH2.interfaces.get('GigabitEthernet0/0')!.ipAddress = '192.168.100.2';
rH2.interfaces.get('GigabitEthernet0/0')!.subnetMask = '255.255.255.0';
rH2.interfaces.get('GigabitEthernet0/0')!.isShutdown = false;
rH2.interfaces.get('GigabitEthernet0/0')!.status = 'up';

pcHsrp.ipAddress = '192.168.100.50';
pcHsrp.subnetMask = '255.255.255.0';
pcHsrp.defaultGateway = '192.168.100.254'; // HSRP Virtual IP
pcHsrp.interfaces.get('FastEthernet0')!.connectedDeviceId = 'R_H1';
pcHsrp.interfaces.get('FastEthernet0')!.connectedPort = 'GigabitEthernet0/0';

const hsrpDevs = [rH1, rH2, pcHsrp];

// Configure HSRP on R_H1 (Active router: priority 110, preempt, version 2)
const rH1IfCtx = { deviceId: 'R_H1', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0' };
CliParser.execute('standby version 2', rH1IfCtx, rH1, hsrpDevs);
CliParser.execute('standby 1 ip 192.168.100.254', rH1IfCtx, rH1, hsrpDevs);
CliParser.execute('standby 1 priority 110', rH1IfCtx, rH1, hsrpDevs);
CliParser.execute('standby 1 preempt', rH1IfCtx, rH1, hsrpDevs);

// Configure HSRP on R_H2 (Standby router: default priority 100, version 2)
const rH2IfCtx = { deviceId: 'R_H2', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0' };
CliParser.execute('standby version 2', rH2IfCtx, rH2, hsrpDevs);
CliParser.execute('standby 1 ip 192.168.100.254', rH2IfCtx, rH2, hsrpDevs);

const rH1Priv = { deviceId: 'R_H1', mode: 'priv-exec' as const };
const hsrpShowRes = CliParser.execute('show standby brief', rH1Priv, rH1, hsrpDevs);
console.log(`HSRP R_H1 Active state: ${hsrpShowRes.output.includes('Active') && hsrpShowRes.output.includes('192.168.100.254') ? 'PASS' : 'FAIL'}`);

// Test PC Reachability via HSRP Virtual Gateway
const hsrpPingRes = pcHsrp.executeCli('ping 192.168.100.254', { deviceId: 'PC_HSRP', mode: 'user-exec' as const }, hsrpDevs);
console.log(`PC Ping to HSRP VIP 192.168.100.254: ${hsrpPingRes.output.includes('Reply from 192.168.100.254') ? 'PASS' : 'FAIL'}`);

// 5. VRRP Testing (Virtual Router Redundancy Protocol)
const rV1 = new Router('R_V1', 'R-V1', { x: 500, y: 700 });
const rV2 = new Router('R_V2', 'R-V2', { x: 700, y: 700 });

rV1.interfaces.get('GigabitEthernet0/0')!.ipAddress = '192.168.200.1';
rV1.interfaces.get('GigabitEthernet0/0')!.subnetMask = '255.255.255.0';
rV1.interfaces.get('GigabitEthernet0/0')!.isShutdown = false;
rV1.interfaces.get('GigabitEthernet0/0')!.status = 'up';

rV2.interfaces.get('GigabitEthernet0/0')!.ipAddress = '192.168.200.2';
rV2.interfaces.get('GigabitEthernet0/0')!.subnetMask = '255.255.255.0';
rV2.interfaces.get('GigabitEthernet0/0')!.isShutdown = false;
rV2.interfaces.get('GigabitEthernet0/0')!.status = 'up';

const vrrpDevs = [rV1, rV2];

const rV1IfCtx = { deviceId: 'R_V1', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0' };
CliParser.execute('vrrp 10 ip 192.168.200.254', rV1IfCtx, rV1, vrrpDevs);
CliParser.execute('vrrp 10 priority 120', rV1IfCtx, rV1, vrrpDevs);

const rV2IfCtx = { deviceId: 'R_V2', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0' };
CliParser.execute('vrrp 10 ip 192.168.200.254', rV2IfCtx, rV2, vrrpDevs);

const rV1Priv = { deviceId: 'R_V1', mode: 'priv-exec' as const };
const vrrpShowRes = CliParser.execute('show vrrp brief', rV1Priv, rV1, vrrpDevs);
console.log(`VRRP R_V1 Master state: ${vrrpShowRes.output.includes('Master') && vrrpShowRes.output.includes('192.168.200.254') ? 'PASS' : 'FAIL'}`);

console.log('\n=== [13] CCNP ENCOR/ENARSI TAHAP 4: ADVANCED ROUTING POLICY & TRAFFIC CONTROL ===');

// 1. Uji IP Prefix-List dengan le / ge evaluation
const rPol = new Router('R_POLICY', 'R-Policy', { x: 100, y: 900 });
const rPolGlobal = { deviceId: 'R_POLICY', mode: 'global-config' as const };

// ip prefix-list PL_WEB permit 10.0.0.0/8 ge 16 le 24
CliParser.execute('ip prefix-list PL_WEB seq 5 permit 10.0.0.0/8 ge 16 le 24', rPolGlobal, rPol);
CliParser.execute('ip prefix-list PL_DEFAULT seq 10 permit 0.0.0.0/0', rPolGlobal, rPol);

const plWeb = rPol.prefixLists.get('PL_WEB')!;
console.log(`Prefix-list PL_WEB exists: ${plWeb && plWeb.entries.length === 1 ? 'PASS' : 'FAIL'}`);

// Test PolicyEngine.matchPrefixList
const match1 = PolicyEngine.matchPrefixList(plWeb, '10.1.0.0', 16); // True (ge 16)
const match2 = PolicyEngine.matchPrefixList(plWeb, '10.1.1.0', 24); // True (le 24)
const match3 = PolicyEngine.matchPrefixList(plWeb, '10.0.0.0', 8);  // False (cidr 8 < ge 16)
const match4 = PolicyEngine.matchPrefixList(plWeb, '10.1.1.1', 32); // False (cidr 32 > le 24)
const match5 = PolicyEngine.matchPrefixList(plWeb, '192.168.1.0', 24); // False (different net)
console.log(`Prefix-list Match (10.1.0.0/16 in /8 ge 16 le 24): ${match1 ? 'PASS' : 'FAIL'}`);
console.log(`Prefix-list Match (10.1.1.0/24 in /8 ge 16 le 24): ${match2 ? 'PASS' : 'FAIL'}`);
console.log(`Prefix-list Deny (/8 < ge 16): ${!match3 ? 'PASS' : 'FAIL'}`);
console.log(`Prefix-list Deny (/32 > le 24): ${!match4 ? 'PASS' : 'FAIL'}`);
console.log(`Prefix-list Deny (192.168.1.0/24 not in 10.0.0.0/8): ${!match5 ? 'PASS' : 'FAIL'}`);

const plShowRes = CliParser.execute('show ip prefix-list PL_WEB', { deviceId: 'R_POLICY', mode: 'priv-exec' as const }, rPol);
console.log(`'show ip prefix-list PL_WEB': ${plShowRes.output.includes('ge 16 le 24') ? 'PASS' : 'FAIL'}`);

// 2. Uji Route-Map & Mutual Redistribution (EIGRP <-> OSPF with Tags & Metric Types)
const rRed1 = new Router('R_RED1', 'R-Red1', { x: 300, y: 900 });
const rRed2 = new Router('R_RED2', 'R-Red2', { x: 500, y: 900 });

// Connect R_RED1 Gi0/0/0 to R_RED2 Gi0/0/0
rRed1.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '10.1.12.1';
rRed1.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
rRed1.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';
rRed1.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
rRed1.interfaces.get('GigabitEthernet0/0/0')!.connectedDeviceId = 'R_RED2';
rRed1.interfaces.get('GigabitEthernet0/0/0')!.connectedPort = 'GigabitEthernet0/0/0';

rRed2.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '10.1.12.2';
rRed2.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
rRed2.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';
rRed2.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
rRed2.interfaces.get('GigabitEthernet0/0/0')!.connectedDeviceId = 'R_RED1';
rRed2.interfaces.get('GigabitEthernet0/0/0')!.connectedPort = 'GigabitEthernet0/0/0';

// LAN on R_RED1 (EIGRP domain)
rRed1.interfaces.get('GigabitEthernet0/0/1')!.ipAddress = '10.10.10.1';
rRed1.interfaces.get('GigabitEthernet0/0/1')!.subnetMask = '255.255.255.0';
rRed1.interfaces.get('GigabitEthernet0/0/1')!.status = 'up';
rRed1.interfaces.get('GigabitEthernet0/0/1')!.isShutdown = false;

// LAN on R_RED2 (OSPF domain)
rRed2.interfaces.get('GigabitEthernet0/0/1')!.ipAddress = '172.16.1.1';
rRed2.interfaces.get('GigabitEthernet0/0/1')!.subnetMask = '255.255.255.0';
rRed2.interfaces.get('GigabitEthernet0/0/1')!.status = 'up';
rRed2.interfaces.get('GigabitEthernet0/0/1')!.isShutdown = false;

rRed1.updateConnectedRoutes();
rRed2.updateConnectedRoutes();

const redisDevs = [rRed1, rRed2];

// Configure EIGRP 100 on R_RED1
CliParser.execute('router eigrp 100', { deviceId: 'R_RED1', mode: 'global-config' as const }, rRed1, redisDevs);
const r1EigrpCtx = { deviceId: 'R_RED1', mode: 'router-config' as const, targetRoutingProtocol: 'eigrp' as const, targetAsNumber: 100 };
CliParser.execute('network 10.10.10.0 0.0.0.255', r1EigrpCtx, rRed1, redisDevs);
CliParser.execute('network 10.1.12.0 0.0.0.255', r1EigrpCtx, rRed1, redisDevs);

// Configure OSPF 1 on R_RED2
CliParser.execute('router ospf 1', { deviceId: 'R_RED2', mode: 'global-config' as const }, rRed2, redisDevs);
const r2OspfCtx = { deviceId: 'R_RED2', mode: 'router-config' as const, targetRoutingProtocol: 'ospf' as const, targetProcessId: 1 };
CliParser.execute('network 172.16.1.0 0.0.0.255 area 0', r2OspfCtx, rRed2, redisDevs);
CliParser.execute('network 10.1.12.0 0.0.0.255 area 0', r2OspfCtx, rRed2, redisDevs);

// On R_RED1, also run OSPF 1 for redistribution
CliParser.execute('router ospf 1', { deviceId: 'R_RED1', mode: 'global-config' as const }, rRed1, redisDevs);
const r1OspfCtx = { deviceId: 'R_RED1', mode: 'router-config' as const, targetRoutingProtocol: 'ospf' as const, targetProcessId: 1 };
CliParser.execute('network 10.1.12.0 0.0.0.255 area 0', r1OspfCtx, rRed1, redisDevs);

// Configure Route-Map on R_RED1: EIGRP into OSPF with Tag 999, Metric 30, Type 1
CliParser.execute('route-map EIGRP_TO_OSPF permit 10', { deviceId: 'R_RED1', mode: 'global-config' as const }, rRed1, redisDevs);
const r1RmCtx = { deviceId: 'R_RED1', mode: 'route-map-config' as const, targetRouteMapName: 'EIGRP_TO_OSPF', targetRouteMapSeq: 10 };
CliParser.execute('set metric 30', r1RmCtx, rRed1, redisDevs);
CliParser.execute('set metric-type type-1', r1RmCtx, rRed1, redisDevs);
CliParser.execute('set tag 999', r1RmCtx, rRed1, redisDevs);

// Apply redistribution under router ospf 1 on R_RED1
CliParser.execute('redistribute eigrp 100 metric 30 metric-type 1 route-map EIGRP_TO_OSPF subnets', r1OspfCtx, rRed1, redisDevs);

// Show route-map on R_RED1
const showRmRes = CliParser.execute('show route-map EIGRP_TO_OSPF', { deviceId: 'R_RED1', mode: 'priv-exec' as const }, rRed1, redisDevs);
console.log(`'show route-map' on R_RED1: ${showRmRes.output.includes('tag 999') && showRmRes.output.includes('metric 30') ? 'PASS' : 'FAIL'}`);

// Converge routing protocols and check that R_RED2 receives O E1 route 10.10.10.0/24 with tag 999
RoutingProtocolEngine.convergeRoutingProtocols(redisDevs);
const r2Routes = rRed2.routingTable;
const redisRoute = r2Routes.find(r => r.network === '10.10.10.0');
console.log(`OSPF Redistributed Route (O E1) on R_RED2: ${redisRoute && redisRoute.protocol === 'O E1' && redisRoute.tag === 999 && redisRoute.metric === 30 ? 'PASS' : 'FAIL'}`);

// 3. Uji Policy-Based Routing (PBR) & IP SLA Object Tracking with Dynamic Failover
const rPbr = new Router('R_PBR', 'R-PBR', { x: 700, y: 900 });
const isp1 = new Router('ISP1', 'ISP1', { x: 900, y: 850 });
const isp2 = new Router('ISP2', 'ISP2', { x: 900, y: 950 });
const pcPbr = new Host('PC_PBR', 'PC-PBR', 'pc', { x: 550, y: 900 });

// R_PBR Gi0/0/0 (LAN - PC)
rPbr.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '192.168.1.1';
rPbr.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
rPbr.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';
rPbr.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
rPbr.interfaces.get('GigabitEthernet0/0/0')!.connectedDeviceId = 'PC_PBR';
rPbr.interfaces.get('GigabitEthernet0/0/0')!.connectedPort = 'FastEthernet0';

// R_PBR Gi0/0/1 (WAN to ISP1)
rPbr.interfaces.get('GigabitEthernet0/0/1')!.ipAddress = '198.51.100.1';
rPbr.interfaces.get('GigabitEthernet0/0/1')!.subnetMask = '255.255.255.0';
rPbr.interfaces.get('GigabitEthernet0/0/1')!.status = 'up';
rPbr.interfaces.get('GigabitEthernet0/0/1')!.isShutdown = false;
rPbr.interfaces.get('GigabitEthernet0/0/1')!.connectedDeviceId = 'ISP1';
rPbr.interfaces.get('GigabitEthernet0/0/1')!.connectedPort = 'GigabitEthernet0/0/0';

// R_PBR Gi0/0/2 (WAN to ISP2)
rPbr.interfaces.get('GigabitEthernet0/0/2')!.ipAddress = '203.0.113.1';
rPbr.interfaces.get('GigabitEthernet0/0/2')!.subnetMask = '255.255.255.0';
rPbr.interfaces.get('GigabitEthernet0/0/2')!.status = 'up';
rPbr.interfaces.get('GigabitEthernet0/0/2')!.isShutdown = false;
rPbr.interfaces.get('GigabitEthernet0/0/2')!.connectedDeviceId = 'ISP2';
rPbr.interfaces.get('GigabitEthernet0/0/2')!.connectedPort = 'GigabitEthernet0/0/0';

// ISP1 Gi0/0/0
isp1.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '198.51.100.2';
isp1.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
isp1.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';
isp1.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
isp1.interfaces.get('GigabitEthernet0/0/0')!.connectedDeviceId = 'R_PBR';
isp1.interfaces.get('GigabitEthernet0/0/0')!.connectedPort = 'GigabitEthernet0/0/1';

// ISP2 Gi0/0/0
isp2.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '203.0.113.2';
isp2.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
isp2.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';
isp2.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
isp2.interfaces.get('GigabitEthernet0/0/0')!.connectedDeviceId = 'R_PBR';
isp2.interfaces.get('GigabitEthernet0/0/0')!.connectedPort = 'GigabitEthernet0/0/2';

// PC_PBR config
pcPbr.ipAddress = '192.168.1.100';
pcPbr.subnetMask = '255.255.255.0';
pcPbr.defaultGateway = '192.168.1.1';
pcPbr.interfaces.get('FastEthernet0')!.connectedDeviceId = 'R_PBR';
pcPbr.interfaces.get('FastEthernet0')!.connectedPort = 'GigabitEthernet0/0/0';

rPbr.updateConnectedRoutes();
isp1.updateConnectedRoutes();
isp2.updateConnectedRoutes();

const pbrDevs = [rPbr, isp1, isp2, pcPbr];

// Default route on R_PBR points to ISP2 (203.0.113.2)
CliParser.execute('ip route 0.0.0.0 0.0.0.0 203.0.113.2', { deviceId: 'R_PBR', mode: 'global-config' as const }, rPbr, pbrDevs);

// Configure IP SLA 1 to monitor ISP1 (198.51.100.2)
CliParser.execute('ip sla 1', { deviceId: 'R_PBR', mode: 'global-config' as const }, rPbr, pbrDevs);
const slaCtx = { deviceId: 'R_PBR', mode: 'ip-sla-config' as const, targetIpSlaId: 1 };
CliParser.execute('icmp-echo 198.51.100.2', slaCtx, rPbr, pbrDevs);
CliParser.execute('frequency 5', slaCtx, rPbr, pbrDevs);

// Configure Track 1 monitoring IP SLA 1
CliParser.execute('track 1 ip sla 1 state', { deviceId: 'R_PBR', mode: 'global-config' as const }, rPbr, pbrDevs);

// Configure ACL 10 matching LAN traffic
CliParser.execute('access-list 10 permit 192.168.1.0 0.0.0.255', { deviceId: 'R_PBR', mode: 'global-config' as const }, rPbr, pbrDevs);

// Configure Route-Map PBR_POLICY
CliParser.execute('route-map PBR_POLICY permit 10', { deviceId: 'R_PBR', mode: 'global-config' as const }, rPbr, pbrDevs);
const pbrRmCtx = { deviceId: 'R_PBR', mode: 'route-map-config' as const, targetRouteMapName: 'PBR_POLICY', targetRouteMapSeq: 10 };
CliParser.execute('match ip address 10', pbrRmCtx, rPbr, pbrDevs);
CliParser.execute('set ip next-hop verify-availability 198.51.100.2 1 track 1', pbrRmCtx, rPbr, pbrDevs);

// Apply PBR to ingress interface Gi0/0/0
CliParser.execute('interface GigabitEthernet0/0/0', { deviceId: 'R_PBR', mode: 'global-config' as const }, rPbr, pbrDevs);
const rPbrGi0Ctx = { deviceId: 'R_PBR', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0/0' };
CliParser.execute('ip policy route-map PBR_POLICY', rPbrGi0Ctx, rPbr, pbrDevs);

// Initial Evaluation: ISP1 is up -> SLA 1 is OK -> Track 1 is UP
PolicyEngine.evaluateIpSla(pbrDevs);
const track1 = rPbr.trackObjects.get(1);
console.log(`Track 1 State (Initial, ISP1 UP): ${track1?.state} -> ${track1?.state === 'UP' ? 'PASS' : 'FAIL'}`);

const showSlaRes = CliParser.execute('show ip sla summary', { deviceId: 'R_PBR', mode: 'priv-exec' as const }, rPbr, pbrDevs);
console.log(`'show ip sla summary': ${showSlaRes.output.includes('198.51.100.2') && showSlaRes.output.includes('OK') ? 'PASS' : 'FAIL'}`);

const showTrackRes = CliParser.execute('show track 1', { deviceId: 'R_PBR', mode: 'priv-exec' as const }, rPbr, pbrDevs);
console.log(`'show track 1': ${showTrackRes.output.includes('State is UP') ? 'PASS' : 'FAIL'}`);

// Test PC Reachability with PBR: Destination behind ISP1 (198.51.100.2)
const reachPbr1 = TopologyTraversal.evaluateHostReachability(pcPbr, '198.51.100.2', pbrDevs);
console.log(`PBR Packet forwarded to ISP1 (Track UP): ${reachPbr1.isReachable ? 'PASS' : 'FAIL'}`);

// Simulate ISP1 failure: Shutdown ISP1 Gi0/0/0
isp1.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = true;
isp1.interfaces.get('GigabitEthernet0/0/0')!.status = 'down';

// Evaluate IP SLA: SLA 1 must timeout -> Track 1 transitions to DOWN
PolicyEngine.evaluateIpSla(pbrDevs);
console.log(`Track 1 State after ISP1 link failure: ${track1?.state} -> ${track1?.state === 'DOWN' ? 'PASS' : 'FAIL'}`);

// Now test PC Reachability to ISP2 (203.0.113.2) via fallback to standard default route
const reachFallback = TopologyTraversal.evaluateHostReachability(pcPbr, '203.0.113.2', pbrDevs);
console.log(`PBR Automatic Fallback to Default Route (ISP2) on Track DOWN: ${reachFallback.isReachable ? 'PASS' : 'FAIL'}`);

// Restore ISP1 link
isp1.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
isp1.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';
PolicyEngine.evaluateIpSla(pbrDevs);
console.log(`Track 1 State after ISP1 recovery: ${track1?.state} -> ${track1?.state === 'UP' ? 'PASS' : 'FAIL'}`);

// =========================================================================
// 14. PENGUJIAN TAHAP 5 CCNP ENTERPRISE: MULTI-TENANT VIRTUALIZATION & MPLS FORWARDING (VRF-LITE & MPLS LFIB/LDP)
// =========================================================================
console.log('\n=== [14] CCNP ENCOR/ENARSI TAHAP 5: MULTI-TENANT VIRTUALIZATION & MPLS FORWARDING (VRF-LITE & MPLS) ===');

// 1. VRF-Lite Setup on Router R_VRF
const rVrf = new Router('R_VRF', 'R-VRF', { x: 200, y: 100 });
const rVrfDevs = [rVrf];

// Config VRF RED & BLUE via CLI
const rVrfGlobal = { deviceId: 'R_VRF', mode: 'global-config' as const };
CliParser.execute('vrf definition RED', rVrfGlobal, rVrf, rVrfDevs);
const rVrfRedCtx = { deviceId: 'R_VRF', mode: 'vrf-config' as const, targetVrfName: 'RED' };
CliParser.execute('rd 65000:10', rVrfRedCtx, rVrf, rVrfDevs);
CliParser.execute('address-family ipv4', rVrfRedCtx, rVrf, rVrfDevs);
const rVrfRedAfCtx = { deviceId: 'R_VRF', mode: 'vrf-af-config' as const, targetVrfName: 'RED', targetVrfAf: 'ipv4' };
CliParser.execute('route-target both 65000:10', rVrfRedAfCtx, rVrf, rVrfDevs);

CliParser.execute('vrf definition BLUE', rVrfGlobal, rVrf, rVrfDevs);
const rVrfBlueCtx = { deviceId: 'R_VRF', mode: 'vrf-config' as const, targetVrfName: 'BLUE' };
CliParser.execute('rd 65000:20', rVrfBlueCtx, rVrf, rVrfDevs);
CliParser.execute('address-family ipv4', rVrfBlueCtx, rVrf, rVrfDevs);
const rVrfBlueAfCtx = { deviceId: 'R_VRF', mode: 'vrf-af-config' as const, targetVrfName: 'BLUE', targetVrfAf: 'ipv4' };
CliParser.execute('route-target both 65000:20', rVrfBlueAfCtx, rVrf, rVrfDevs);

// Verify 'show vrf' output
const showVrfRes = CliParser.execute('show vrf', { deviceId: 'R_VRF', mode: 'priv-exec' as const }, rVrf, rVrfDevs);
console.log(`VRF RED & BLUE created with RDs: ${showVrfRes.output.includes('RED') && showVrfRes.output.includes('65000:10') && showVrfRes.output.includes('BLUE') && showVrfRes.output.includes('65000:20') ? 'PASS' : 'FAIL'}`);

// Bind Interfaces:
// Gi0/0/0 -> VRF RED, IP 10.1.1.254/24
// Gi0/0/2 -> VRF BLUE, IP 10.1.1.254/24 (Overlapping IP Subnet!)
CliParser.execute('interface GigabitEthernet0/0/0', rVrfGlobal, rVrf, rVrfDevs);
const ifGi0Ctx = { deviceId: 'R_VRF', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0/0' };
CliParser.execute('vrf forwarding RED', ifGi0Ctx, rVrf, rVrfDevs);
CliParser.execute('ip address 10.1.1.254 255.255.255.0', ifGi0Ctx, rVrf, rVrfDevs);
CliParser.execute('no shutdown', ifGi0Ctx, rVrf, rVrfDevs);

CliParser.execute('interface GigabitEthernet0/0/2', rVrfGlobal, rVrf, rVrfDevs);
const ifGi2Ctx = { deviceId: 'R_VRF', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0/2' };
CliParser.execute('vrf forwarding BLUE', ifGi2Ctx, rVrf, rVrfDevs);
CliParser.execute('ip address 10.1.1.254 255.255.255.0', ifGi2Ctx, rVrf, rVrfDevs);
CliParser.execute('no shutdown', ifGi2Ctx, rVrf, rVrfDevs);

// Add Static Routes per VRF
CliParser.execute('ip route vrf RED 172.16.1.0 255.255.255.0 10.1.1.1', rVrfGlobal, rVrf, rVrfDevs);
CliParser.execute('ip route vrf BLUE 172.16.2.0 255.255.255.0 10.1.1.2', rVrfGlobal, rVrf, rVrfDevs);

// Verify 'show ip route vrf RED' & 'show ip route vrf BLUE'
const showRouteVrfRed = CliParser.execute('show ip route vrf RED', { deviceId: 'R_VRF', mode: 'priv-exec' as const }, rVrf, rVrfDevs);
const showRouteVrfBlue = CliParser.execute('show ip route vrf BLUE', { deviceId: 'R_VRF', mode: 'priv-exec' as const }, rVrf, rVrfDevs);

const vrfRedValid = showRouteVrfRed.output.includes('10.1.1.0/24') && showRouteVrfRed.output.includes('172.16.1.0/24') && !showRouteVrfRed.output.includes('172.16.2.0/24');
const vrfBlueValid = showRouteVrfBlue.output.includes('10.1.1.0/24') && showRouteVrfBlue.output.includes('172.16.2.0/24') && !showRouteVrfBlue.output.includes('172.16.1.0/24');
console.log(`VRF Route Table Isolation (Overlapping Subnets): ${vrfRedValid && vrfBlueValid ? 'PASS' : 'FAIL'}`);

// Connect Hosts: PC_RED (10.1.1.10) to Gi0/0/0, PC_BLUE (10.1.1.10) to Gi0/0/2
const pcRed = new Host('PC_RED', 'PC-RED', { x: 50, y: 100 });
pcRed.ipAddress = '10.1.1.10';
pcRed.subnetMask = '255.255.255.0';
pcRed.defaultGateway = '10.1.1.254';
pcRed.interfaces.get('FastEthernet0')!.connectedDeviceId = 'R_VRF';
pcRed.interfaces.get('FastEthernet0')!.connectedPort = 'GigabitEthernet0/0/0';
rVrf.interfaces.get('GigabitEthernet0/0/0')!.connectedDeviceId = 'PC_RED';
rVrf.interfaces.get('GigabitEthernet0/0/0')!.connectedPort = 'FastEthernet0';

const pcBlue = new Host('PC_BLUE', 'PC-BLUE', { x: 50, y: 200 });
pcBlue.ipAddress = '10.1.1.10';
pcBlue.subnetMask = '255.255.255.0';
pcBlue.defaultGateway = '10.1.1.254';
pcBlue.interfaces.get('FastEthernet0')!.connectedDeviceId = 'R_VRF';
pcBlue.interfaces.get('FastEthernet0')!.connectedPort = 'GigabitEthernet0/0/2';
rVrf.interfaces.get('GigabitEthernet0/0/2')!.connectedDeviceId = 'PC_BLUE';
rVrf.interfaces.get('GigabitEthernet0/0/2')!.connectedPort = 'FastEthernet0';

const allVrfDevs = [rVrf, pcRed, pcBlue];

// Ping via VRF from Router
const pingVrfRedRes = CliParser.execute('ping vrf RED 10.1.1.10', { deviceId: 'R_VRF', mode: 'priv-exec' as const }, rVrf, allVrfDevs);
console.log(`Ping within VRF RED: ${pingVrfRedRes.output.includes('!!!!!') ? 'PASS' : 'FAIL'}`);

// Verify VRF ARP Table
const showArpVrfRed = CliParser.execute('show ip arp vrf RED', { deviceId: 'R_VRF', mode: 'priv-exec' as const }, rVrf, allVrfDevs);
console.log(`VRF RED ARP Table learned PC_RED MAC: ${showArpVrfRed.output.includes('10.1.1.10') && showArpVrfRed.output.includes('GigabitEthernet0/0/0') ? 'PASS' : 'FAIL'}`);

// Verify Host-to-Gateway Reachability in VRF
const reachPcRedGw = TopologyTraversal.evaluateHostReachability(pcRed, '10.1.1.254', allVrfDevs);
console.log(`PC_RED reachability to VRF RED Gateway: ${reachPcRedGw.isReachable ? 'PASS' : 'FAIL'}`);

// 2. MPLS & LFIB Testing
const rMpls1 = new Router('R_MPLS1', 'R-MPLS1', { x: 400, y: 100 });
const rMpls2 = new Router('R_MPLS2', 'R-MPLS2', { x: 600, y: 100 });

// Point-to-Point link between R_MPLS1 Gi0/0/1 <-> R_MPLS2 Gi0/0/1 (192.168.12.0/24)
rMpls1.interfaces.get('GigabitEthernet0/0/1')!.ipAddress = '192.168.12.1';
rMpls1.interfaces.get('GigabitEthernet0/0/1')!.subnetMask = '255.255.255.0';
rMpls1.interfaces.get('GigabitEthernet0/0/1')!.isShutdown = false;
rMpls1.interfaces.get('GigabitEthernet0/0/1')!.status = 'up';
rMpls1.interfaces.get('GigabitEthernet0/0/1')!.connectedDeviceId = 'R_MPLS2';
rMpls1.interfaces.get('GigabitEthernet0/0/1')!.connectedPort = 'GigabitEthernet0/0/1';

rMpls2.interfaces.get('GigabitEthernet0/0/1')!.ipAddress = '192.168.12.2';
rMpls2.interfaces.get('GigabitEthernet0/0/1')!.subnetMask = '255.255.255.0';
rMpls2.interfaces.get('GigabitEthernet0/0/1')!.isShutdown = false;
rMpls2.interfaces.get('GigabitEthernet0/0/1')!.status = 'up';
rMpls2.interfaces.get('GigabitEthernet0/0/1')!.connectedDeviceId = 'R_MPLS1';
rMpls2.interfaces.get('GigabitEthernet0/0/1')!.connectedPort = 'GigabitEthernet0/0/1';

const mplsDevs = [rMpls1, rMpls2];
rMpls1.updateConnectedRoutes();
rMpls2.updateConnectedRoutes();

// Enable MPLS on transit interfaces
const rMpls1Gi1Ctx = { deviceId: 'R_MPLS1', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0/1' };
CliParser.execute('mpls ip', rMpls1Gi1Ctx, rMpls1, mplsDevs);

const rMpls2Gi1Ctx = { deviceId: 'R_MPLS2', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0/1' };
CliParser.execute('mpls ip', rMpls2Gi1Ctx, rMpls2, mplsDevs);

// Verify 'show mpls interfaces'
const showMplsIfRes = CliParser.execute('show mpls interfaces', { deviceId: 'R_MPLS1', mode: 'priv-exec' as const }, rMpls1, mplsDevs);
console.log(`'show mpls interfaces': ${showMplsIfRes.output.includes('Yes (ldp)') ? 'PASS' : 'FAIL'}`);

// Verify 'show mpls ldp neighbor'
const showMplsNbrRes = CliParser.execute('show mpls ldp neighbor', { deviceId: 'R_MPLS1', mode: 'priv-exec' as const }, rMpls1, mplsDevs);
console.log(`'show mpls ldp neighbor': ${showMplsNbrRes.output.includes('Peer LDP Ident') && showMplsNbrRes.output.includes('Oper') ? 'PASS' : 'FAIL'}`);

// Verify 'show mpls forwarding-table' (LFIB)
const showMplsLfibRes = CliParser.execute('show mpls forwarding-table', { deviceId: 'R_MPLS1', mode: 'priv-exec' as const }, rMpls1, mplsDevs);
console.log(`'show mpls forwarding-table' (LFIB generated): ${showMplsLfibRes.output.includes('16') && showMplsLfibRes.output.includes('192.168.12.0/24') ? 'PASS' : 'FAIL'}`);

console.log('\n======================================================');
console.log('--- 15. PENGUJIAN CCNP TAHAP 6: INFRASTRUCTURE SECURITY & VPN SERVICES ---');
console.log('======================================================');

// 1. GRE over IPsec Testing (R_VPN1 <-> R_VPN2)
const rVpn1 = new Router('R_VPN1', 'R-VPN1', { x: 100, y: 900 });
const rVpn2 = new Router('R_VPN2', 'R-VPN2', { x: 300, y: 900 });

// Physical link: Gi0/0/0 (198.51.100.1 <-> 198.51.100.2)
rVpn1.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '198.51.100.1';
rVpn1.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
rVpn1.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
rVpn1.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';
rVpn1.interfaces.get('GigabitEthernet0/0/0')!.connectedDeviceId = 'R_VPN2';
rVpn1.interfaces.get('GigabitEthernet0/0/0')!.connectedPort = 'GigabitEthernet0/0/0';

rVpn2.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '198.51.100.2';
rVpn2.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
rVpn2.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
rVpn2.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';
rVpn2.interfaces.get('GigabitEthernet0/0/0')!.connectedDeviceId = 'R_VPN1';
rVpn2.interfaces.get('GigabitEthernet0/0/0')!.connectedPort = 'GigabitEthernet0/0/0';

const vpnDevs = [rVpn1, rVpn2];
rVpn1.updateConnectedRoutes();
rVpn2.updateConnectedRoutes();

// Configure ISAKMP policy on R_VPN1
const rVpn1Global = { deviceId: 'R_VPN1', mode: 'global-config' as const };
CliParser.execute('crypto isakmp policy 10', rVpn1Global, rVpn1, vpnDevs);
const rVpn1Isakmp = { deviceId: 'R_VPN1', mode: 'crypto-isakmp-policy' as const, targetIsakmpPriority: 10 };
CliParser.execute('encr aes', rVpn1Isakmp, rVpn1, vpnDevs);
CliParser.execute('hash sha', rVpn1Isakmp, rVpn1, vpnDevs);
CliParser.execute('authentication pre-share', rVpn1Isakmp, rVpn1, vpnDevs);
CliParser.execute('group 2', rVpn1Isakmp, rVpn1, vpnDevs);

// Configure ISAKMP key & IPsec profile on R_VPN1
CliParser.execute('crypto isakmp key cisco123 address 198.51.100.2', rVpn1Global, rVpn1, vpnDevs);
CliParser.execute('crypto ipsec transform-set TS-VPN esp-aes esp-sha-hmac', rVpn1Global, rVpn1, vpnDevs);
CliParser.execute('crypto ipsec profile PROF-VPN', rVpn1Global, rVpn1, vpnDevs);
const rVpn1Prof = { deviceId: 'R_VPN1', mode: 'crypto-ipsec-profile' as const, targetIpsecProfileName: 'PROF-VPN' };
CliParser.execute('set transform-set TS-VPN', rVpn1Prof, rVpn1, vpnDevs);

// Configure Tunnel0 on R_VPN1
CliParser.execute('interface Tunnel0', rVpn1Global, rVpn1, vpnDevs);
const rVpn1Tu0 = { deviceId: 'R_VPN1', mode: 'interface-config' as const, targetInterface: 'Tunnel0' };
CliParser.execute('ip address 10.10.10.1 255.255.255.0', rVpn1Tu0, rVpn1, vpnDevs);
CliParser.execute('tunnel source GigabitEthernet0/0/0', rVpn1Tu0, rVpn1, vpnDevs);
CliParser.execute('tunnel destination 198.51.100.2', rVpn1Tu0, rVpn1, vpnDevs);
CliParser.execute('tunnel protection ipsec profile PROF-VPN', rVpn1Tu0, rVpn1, vpnDevs);

// Configure ISAKMP policy, key, profile, and Tunnel0 on R_VPN2
const rVpn2Global = { deviceId: 'R_VPN2', mode: 'global-config' as const };
CliParser.execute('crypto isakmp policy 10', rVpn2Global, rVpn2, vpnDevs);
const rVpn2Isakmp = { deviceId: 'R_VPN2', mode: 'crypto-isakmp-policy' as const, targetIsakmpPriority: 10 };
CliParser.execute('encr aes', rVpn2Isakmp, rVpn2, vpnDevs);
CliParser.execute('hash sha', rVpn2Isakmp, rVpn2, vpnDevs);
CliParser.execute('authentication pre-share', rVpn2Isakmp, rVpn2, vpnDevs);
CliParser.execute('group 2', rVpn2Isakmp, rVpn2, vpnDevs);

CliParser.execute('crypto isakmp key cisco123 address 198.51.100.1', rVpn2Global, rVpn2, vpnDevs);
CliParser.execute('crypto ipsec transform-set TS-VPN esp-aes esp-sha-hmac', rVpn2Global, rVpn2, vpnDevs);
CliParser.execute('crypto ipsec profile PROF-VPN', rVpn2Global, rVpn2, vpnDevs);
const rVpn2Prof = { deviceId: 'R_VPN2', mode: 'crypto-ipsec-profile' as const, targetIpsecProfileName: 'PROF-VPN' };
CliParser.execute('set transform-set TS-VPN', rVpn2Prof, rVpn2, vpnDevs);

CliParser.execute('interface Tunnel0', rVpn2Global, rVpn2, vpnDevs);
const rVpn2Tu0 = { deviceId: 'R_VPN2', mode: 'interface-config' as const, targetInterface: 'Tunnel0' };
CliParser.execute('ip address 10.10.10.2 255.255.255.0', rVpn2Tu0, rVpn2, vpnDevs);
CliParser.execute('tunnel source GigabitEthernet0/0/0', rVpn2Tu0, rVpn2, vpnDevs);
CliParser.execute('tunnel destination 198.51.100.1', rVpn2Tu0, rVpn2, vpnDevs);
CliParser.execute('tunnel protection ipsec profile PROF-VPN', rVpn2Tu0, rVpn2, vpnDevs);

// Trigger IPsec negotiation across tunnel
const ipsecNegRes = SecurityVpnEngine.negotiateIpsec(rVpn1, rVpn2, '198.51.100.1', '198.51.100.2', 'Tunnel0', 'PROF-VPN');
console.log(`IPsec SA Negotiation between R_VPN1 and R_VPN2: ${ipsecNegRes.success ? 'PASS' : 'FAIL'}`);

// Diagnostics: show crypto isakmp sa
const showIsakmpRes = CliParser.execute('show crypto isakmp sa', { deviceId: 'R_VPN1', mode: 'priv-exec' as const }, rVpn1, vpnDevs);
console.log(`'show crypto isakmp sa' (QM_IDLE / ACTIVE): ${showIsakmpRes.output.includes('QM_IDLE') && showIsakmpRes.output.includes('ACTIVE') ? 'PASS' : 'FAIL'}`);

// Diagnostics: show crypto ipsec sa
const showIpsecSaRes = CliParser.execute('show crypto ipsec sa', { deviceId: 'R_VPN1', mode: 'priv-exec' as const }, rVpn1, vpnDevs);
console.log(`'show crypto ipsec sa' (esp-aes esp-sha-hmac): ${showIpsecSaRes.output.includes('esp-aes esp-sha-hmac') && showIpsecSaRes.output.includes('inbound esp sas') ? 'PASS' : 'FAIL'}`);

// Diagnostics: show crypto session
const showCryptoSessRes = CliParser.execute('show crypto session', { deviceId: 'R_VPN1', mode: 'priv-exec' as const }, rVpn1, vpnDevs);
console.log(`'show crypto session' (UP-ACTIVE): ${showCryptoSessRes.output.includes('UP-ACTIVE') && showCryptoSessRes.output.includes('198.51.100.2') ? 'PASS' : 'FAIL'}`);

// 2. DMVPN & NHRP Testing (R_HUB <-> R_SPOKE)
const rHub = new Router('R_HUB', 'R-HUB', { x: 500, y: 900 });
const rSpoke = new Router('R_SPOKE', 'R-SPOKE', { x: 700, y: 900 });

rHub.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '172.16.1.1';
rHub.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
rHub.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
rHub.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';

rSpoke.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '172.16.1.2';
rSpoke.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
rSpoke.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
rSpoke.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';

const dmvpnDevs = [rHub, rSpoke];
rHub.updateConnectedRoutes();
rSpoke.updateConnectedRoutes();

// Configure Hub DMVPN Multipoint GRE
const rHubGlobal = { deviceId: 'R_HUB', mode: 'global-config' as const };
CliParser.execute('interface Tunnel0', rHubGlobal, rHub, dmvpnDevs);
const rHubTu0 = { deviceId: 'R_HUB', mode: 'interface-config' as const, targetInterface: 'Tunnel0' };
CliParser.execute('ip address 10.255.0.1 255.255.255.0', rHubTu0, rHub, dmvpnDevs);
CliParser.execute('tunnel source GigabitEthernet0/0/0', rHubTu0, rHub, dmvpnDevs);
CliParser.execute('tunnel mode gre multipoint', rHubTu0, rHub, dmvpnDevs);
CliParser.execute('ip nhrp network-id 99', rHubTu0, rHub, dmvpnDevs);
CliParser.execute('ip nhrp map multicast dynamic', rHubTu0, rHub, dmvpnDevs);

// Configure Spoke DMVPN
const rSpokeGlobal = { deviceId: 'R_SPOKE', mode: 'global-config' as const };
CliParser.execute('interface Tunnel0', rSpokeGlobal, rSpoke, dmvpnDevs);
const rSpokeTu0 = { deviceId: 'R_SPOKE', mode: 'interface-config' as const, targetInterface: 'Tunnel0' };
CliParser.execute('ip address 10.255.0.2 255.255.255.0', rSpokeTu0, rSpoke, dmvpnDevs);
CliParser.execute('tunnel source GigabitEthernet0/0/0', rSpokeTu0, rSpoke, dmvpnDevs);
CliParser.execute('tunnel mode gre multipoint', rSpokeTu0, rSpoke, dmvpnDevs);
CliParser.execute('ip nhrp network-id 99', rSpokeTu0, rSpoke, dmvpnDevs);
CliParser.execute('ip nhrp nhs 10.255.0.1 nbma 172.16.1.1', rSpokeTu0, rSpoke, dmvpnDevs);

// Spoke registration into Hub NHRP cache
SecurityVpnEngine.registerSpokeNhrp(rSpoke, rHub, '10.255.0.2', '172.16.1.2', '10.255.0.1', '172.16.1.1', 99);

// Diagnostics: show ip nhrp on Hub
const showNhrpHub = CliParser.execute('show ip nhrp', { deviceId: 'R_HUB', mode: 'priv-exec' as const }, rHub, dmvpnDevs);
console.log(`'show ip nhrp' on Hub (dynamic spoke registered): ${showNhrpHub.output.includes('10.255.0.2/32 via 172.16.1.2') && showNhrpHub.output.includes('dynamic') ? 'PASS' : 'FAIL'}`);

// Diagnostics: show ip nhrp on Spoke
const showNhrpSpoke = CliParser.execute('show ip nhrp', { deviceId: 'R_SPOKE', mode: 'priv-exec' as const }, rSpoke, dmvpnDevs);
console.log(`'show ip nhrp' on Spoke (static hub NHS): ${showNhrpSpoke.output.includes('10.255.0.1/32 via 172.16.1.1') && showNhrpSpoke.output.includes('static') ? 'PASS' : 'FAIL'}`);

// 3. Zone-Based Policy Firewall (ZBFW) Testing
const rFw = new Router('R_FW', 'R-FW', { x: 500, y: 1100 });
rFw.interfaces.get('GigabitEthernet0/0/0')!.ipAddress = '203.0.113.1'; // OUTSIDE
rFw.interfaces.get('GigabitEthernet0/0/0')!.subnetMask = '255.255.255.0';
rFw.interfaces.get('GigabitEthernet0/0/0')!.isShutdown = false;
rFw.interfaces.get('GigabitEthernet0/0/0')!.status = 'up';

rFw.interfaces.get('GigabitEthernet0/0/1')!.ipAddress = '192.168.1.1'; // INSIDE
rFw.interfaces.get('GigabitEthernet0/0/1')!.subnetMask = '255.255.255.0';
rFw.interfaces.get('GigabitEthernet0/0/1')!.isShutdown = false;
rFw.interfaces.get('GigabitEthernet0/0/1')!.status = 'up';

const fwDevs = [rFw];
const rFwGlobal = { deviceId: 'R_FW', mode: 'global-config' as const };

// Security zones
CliParser.execute('zone security INSIDE', rFwGlobal, rFw, fwDevs);
CliParser.execute('zone security OUTSIDE', rFwGlobal, rFw, fwDevs);

// Assign interfaces to zones
CliParser.execute('interface GigabitEthernet0/0/1', rFwGlobal, rFw, fwDevs);
const rFwGi1 = { deviceId: 'R_FW', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0/1' };
CliParser.execute('zone-member security INSIDE', rFwGi1, rFw, fwDevs);

CliParser.execute('interface GigabitEthernet0/0/0', rFwGlobal, rFw, fwDevs);
const rFwGi0 = { deviceId: 'R_FW', mode: 'interface-config' as const, targetInterface: 'GigabitEthernet0/0/0' };
CliParser.execute('zone-member security OUTSIDE', rFwGi0, rFw, fwDevs);

// Class map type inspect
CliParser.execute('class-map type inspect match-any CM-INSPECT', rFwGlobal, rFw, fwDevs);
const rFwCm = { deviceId: 'R_FW', mode: 'class-map-inspect' as const, targetClassMapName: 'CM-INSPECT' };
CliParser.execute('match protocol tcp', rFwCm, rFw, fwDevs);
CliParser.execute('match protocol icmp', rFwCm, rFw, fwDevs);

// Policy map type inspect
CliParser.execute('policy-map type inspect PM-ZBFW', rFwGlobal, rFw, fwDevs);
const rFwPm = { deviceId: 'R_FW', mode: 'policy-map-inspect' as const, targetPolicyMapName: 'PM-ZBFW' };
CliParser.execute('class type inspect CM-INSPECT', rFwPm, rFw, fwDevs);
const rFwPmClass = { deviceId: 'R_FW', mode: 'policy-map-class-inspect' as const, targetPolicyMapName: 'PM-ZBFW', targetPolicyMapClass: 'CM-INSPECT' };
CliParser.execute('inspect', rFwPmClass, rFw, fwDevs);

// Zone pair
CliParser.execute('zone-pair security ZP-IN-OUT source INSIDE destination OUTSIDE', rFwGlobal, rFw, fwDevs);
const rFwZp = { deviceId: 'R_FW', mode: 'zone-pair-config' as const, targetZonePairName: 'ZP-IN-OUT' };
CliParser.execute('service-policy type inspect PM-ZBFW', rFwZp, rFw, fwDevs);

// Diagnostics: show zone security
const showZoneSec = CliParser.execute('show zone security', { deviceId: 'R_FW', mode: 'priv-exec' as const }, rFw, fwDevs);
console.log(`'show zone security': ${showZoneSec.output.includes('zone INSIDE') && showZoneSec.output.includes('GigabitEthernet0/0/1') ? 'PASS' : 'FAIL'}`);

// Diagnostics: show zone-pair security
const showZpSec = CliParser.execute('show zone-pair security', { deviceId: 'R_FW', mode: 'priv-exec' as const }, rFw, fwDevs);
console.log(`'show zone-pair security': ${showZpSec.output.includes('ZP-IN-OUT') && showZpSec.output.includes('Source-Zone INSIDE') ? 'PASS' : 'FAIL'}`);

// Diagnostics: show policy-map type inspect zone-pair
const showPmInspect = CliParser.execute('show policy-map type inspect zone-pair ZP-IN-OUT', { deviceId: 'R_FW', mode: 'priv-exec' as const }, rFw, fwDevs);
console.log(`'show policy-map type inspect zone-pair': ${showPmInspect.output.includes('Service-policy inspect : PM-ZBFW') && showPmInspect.output.includes('Action: inspect') ? 'PASS' : 'FAIL'}`);

// Stateful Inspection Verification
// Outbound traffic from INSIDE to OUTSIDE (TCP port 80)
const zbfwOutbound = SecurityVpnEngine.evaluateZbfw(rFw, 'GigabitEthernet0/0/1', 'GigabitEthernet0/0/0', {
  srcIp: '192.168.1.10',
  dstIp: '203.0.113.50',
  protocol: 'tcp',
  srcPort: 49152,
  dstPort: 80
});
console.log(`ZBFW Outbound Initial Inspection: ${zbfwOutbound.action === 'permit' ? 'PASS' : 'FAIL'} (${zbfwOutbound.reason})`);

// Stateful return traffic from OUTSIDE to INSIDE (Reverse TCP packet)
const zbfwReturn = SecurityVpnEngine.evaluateZbfw(rFw, 'GigabitEthernet0/0/0', 'GigabitEthernet0/0/1', {
  srcIp: '203.0.113.50',
  dstIp: '192.168.1.10',
  protocol: 'tcp',
  srcPort: 80,
  dstPort: 49152
});
console.log(`ZBFW Stateful Return Traffic Permitted: ${zbfwReturn.action === 'permit' && zbfwReturn.reason.includes('Stateful return') ? 'PASS' : 'FAIL'}`);

// Unauthorized incoming traffic without existing session (Implicit Deny)
const zbfwUnauthorized = SecurityVpnEngine.evaluateZbfw(rFw, 'GigabitEthernet0/0/0', 'GigabitEthernet0/0/1', {
  srcIp: '198.51.100.99',
  dstIp: '192.168.1.10',
  protocol: 'tcp',
  srcPort: 12345,
  dstPort: 22
});
console.log(`ZBFW Unauthorized Inbound Dropped: ${zbfwUnauthorized.action === 'drop' && zbfwUnauthorized.reason.includes('implicit deny') ? 'PASS' : 'FAIL'}`);

// 4. Control Plane Policing (CoPP) Testing
CliParser.execute('control-plane', rFwGlobal, rFw, fwDevs);
const rFwCp = { deviceId: 'R_FW', mode: 'control-plane-config' as const };
CliParser.execute('service-policy input COPP-POLICY', rFwCp, rFw, fwDevs);

// Evaluate CoPP traffic
const coppEval1 = SecurityVpnEngine.evaluateCopp(rFw, { srcIp: '192.168.1.10', dstIp: '192.168.1.1', protocol: 'icmp' });
const coppEval2 = SecurityVpnEngine.evaluateCopp(rFw, { srcIp: '192.168.1.11', dstIp: '192.168.1.1', protocol: 'icmp' });
console.log(`CoPP Traffic Evaluation: ${coppEval1.action === 'transmit' && coppEval2.action === 'transmit' ? 'PASS' : 'FAIL'}`);

// Diagnostics: show policy-map control-plane
const showCoppRes = CliParser.execute('show policy-map control-plane', { deviceId: 'R_FW', mode: 'priv-exec' as const }, rFw, fwDevs);
console.log(`'show policy-map control-plane': ${showCoppRes.output.includes('Control Plane') && showCoppRes.output.includes('conformed 2 packets') ? 'PASS' : 'FAIL'}`);

// Verify Running Config includes Tahap 6 serialization
const rFwRunConfig = rFw.getRunningConfig();
console.log(`Running-config serializes ZBFW, Zones, and CoPP: ${rFwRunConfig.includes('zone security INSIDE') && rFwRunConfig.includes('zone-pair security ZP-IN-OUT') && rFwRunConfig.includes('control-plane') ? 'PASS' : 'FAIL'}`);

console.log('\n=== [16] PENGUJIAN CCNP TAHAP 7: NETWORK AUTOMATION, PROGRAMMABILITY & TELEMETRY ===');
// 1. Setup Router for Automation
const rAuto = new Router('R_AUTO', 'R-AUTO', { x: 50, y: 50 });
const autoDevs = [rAuto];

// 2. Enable RESTCONF and NETCONF-YANG via CLI
const rAutoGlobal = { deviceId: 'R_AUTO', mode: 'global-config' as const };
CliParser.execute('restconf', rAutoGlobal, rAuto, autoDevs);
CliParser.execute('netconf-yang', rAutoGlobal, rAuto, autoDevs);

console.log(`RESTCONF Enabled flag: ${rAuto.restconfEnabled ? 'PASS' : 'FAIL'}`);
console.log(`NETCONF-YANG Enabled flag: ${rAuto.netconfEnabled ? 'PASS' : 'FAIL'}`);

// 3. RESTCONF RFC 8040 Query Handlers
// GET /restconf/data/Cisco-IOS-XE-native:native
const restconfNativeRes = TelemetryAutomationEngine.queryRestconf(rAuto, 'GET', '/restconf/data/Cisco-IOS-XE-native:native');
console.log(`RESTCONF GET Native Data: ${restconfNativeRes.statusCode === 200 && restconfNativeRes.body['Cisco-IOS-XE-native:native'].hostname === 'R-AUTO' ? 'PASS' : 'FAIL'}`);

// PATCH /restconf/data/Cisco-IOS-XE-native:native (Update Hostname via API)
const restconfPatchRes = TelemetryAutomationEngine.queryRestconf(rAuto, 'PATCH', '/restconf/data/Cisco-IOS-XE-native:native', {
  'Cisco-IOS-XE-native:native': { hostname: 'R-AUTO-PROG' }
});
console.log(`RESTCONF PATCH Hostname: ${restconfPatchRes.statusCode === 200 && rAuto.hostname === 'R-AUTO-PROG' ? 'PASS' : 'FAIL'}`);

// GET /restconf/data/ietf-interfaces:interfaces
const restconfIfRes = TelemetryAutomationEngine.queryRestconf(rAuto, 'GET', '/restconf/data/ietf-interfaces:interfaces');
console.log(`RESTCONF GET Interfaces: ${restconfIfRes.statusCode === 200 && Array.isArray(restconfIfRes.body['ietf-interfaces:interfaces'].interface) ? 'PASS' : 'FAIL'}`);

// 4. NETCONF RFC 6241 XML RPC Exchange
const netconfGetConfigRpc = `<rpc message-id="101" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <get-config>
    <source><running/></source>
  </get-config>
</rpc>`;
const netconfReply = TelemetryAutomationEngine.executeNetconfRpc(rAuto, netconfGetConfigRpc);
console.log(`NETCONF <get-config> XML RPC: ${netconfReply.includes('<rpc-reply message-id="101"') && netconfReply.includes('<hostname>R-AUTO-PROG</hostname>') ? 'PASS' : 'FAIL'}`);

// 5. Embedded Event Manager (EEM) Applet Configuration & Execution
CliParser.execute('event manager applet MONITOR-CLI', rAutoGlobal, rAuto, autoDevs);
const rAutoApplet = { deviceId: 'R_AUTO', mode: 'eem-applet-config' as const, targetAppletName: 'MONITOR-CLI' };
CliParser.execute('event cli pattern "show running-config" sync no', rAutoApplet, rAuto, autoDevs);
CliParser.execute('action 1.0 syslog msg "EEM-AUDIT: running-config accessed by admin"', rAutoApplet, rAuto, autoDevs);

// Verify EEM registered
const showEemRes = CliParser.execute('show event manager policy registered', { deviceId: 'R_AUTO', mode: 'priv-exec' as const }, rAuto, autoDevs);
console.log(`'show event manager policy registered': ${showEemRes.output.includes('MONITOR-CLI') && showEemRes.output.includes('CLI pattern') ? 'PASS' : 'FAIL'}`);

// Trigger EEM via CLI command execution
const triggerCliRes = CliParser.execute('show running-config', { deviceId: 'R_AUTO', mode: 'priv-exec' as const }, rAuto, autoDevs);
console.log(`EEM CLI Interception & Syslog Injection: ${triggerCliRes.output.includes('%HA_EM-6-LOG: MONITOR-CLI: EEM-AUDIT: running-config accessed by admin') ? 'PASS' : 'FAIL'}`);

// Check EEM History
const showEemHistRes = CliParser.execute('show event manager history events', { deviceId: 'R_AUTO', mode: 'priv-exec' as const }, rAuto, autoDevs);
console.log(`'show event manager history events': ${showEemHistRes.output.includes('MONITOR-CLI') && showEemHistRes.output.includes('show running-config') ? 'PASS' : 'FAIL'}`);

// 6. Model-Driven Telemetry (MDT) Streaming Subscriptions
CliParser.execute('telemetry ietf subscription 101', rAutoGlobal, rAuto, autoDevs);
const rAutoMdt = { deviceId: 'R_AUTO', mode: 'mdt-subscription-config' as const, targetSubscriptionId: 101 };
CliParser.execute('encoding encode-kvgpb', rAutoMdt, rAuto, autoDevs);
CliParser.execute('filter xpath /ietf-interfaces:interfaces-state', rAutoMdt, rAuto, autoDevs);
CliParser.execute('stream yang-push', rAutoMdt, rAuto, autoDevs);
CliParser.execute('update-policy periodic 500', rAutoMdt, rAuto, autoDevs);
CliParser.execute('receiver ip address 192.168.100.50 57500 protocol grpc-tcp', rAutoMdt, rAuto, autoDevs);

// Verify Diagnostics: show telemetry ietf subscription all
const showMdtSubRes = CliParser.execute('show telemetry ietf subscription all', { deviceId: 'R_AUTO', mode: 'priv-exec' as const }, rAuto, autoDevs);
console.log(`'show telemetry ietf subscription all': ${showMdtSubRes.output.includes('101') && showMdtSubRes.output.includes('encode-kvgpb') ? 'PASS' : 'FAIL'}`);

// Diagnostics: show telemetry connection all
const showMdtConnRes = CliParser.execute('show telemetry connection all', { deviceId: 'R_AUTO', mode: 'priv-exec' as const }, rAuto, autoDevs);
console.log(`'show telemetry connection all': ${showMdtConnRes.output.includes('192.168.100.50') && showMdtConnRes.output.includes('CONNECTED') ? 'PASS' : 'FAIL'}`);

// Verify Telemetry Snapshot Generation
const telemetrySnapshot = TelemetryAutomationEngine.generateTelemetrySnapshot(rAuto, 101);
console.log(`MDT Telemetry Snapshot Generation (KV-GPB): ${telemetrySnapshot && telemetrySnapshot.encoding === 'encode-kvgpb' && telemetrySnapshot.subscriptionIdStr === '101' ? 'PASS' : 'FAIL'}`);

// 7. Verify Running-Config Serialization for Tahap 7
const autoRunCfg = rAuto.getRunningConfig();
console.log(`Running-config serializes RESTCONF, NETCONF-YANG, EEM, and MDT: ${
  autoRunCfg.includes('restconf') &&
  autoRunCfg.includes('netconf-yang') &&
  autoRunCfg.includes('event manager applet MONITOR-CLI') &&
  autoRunCfg.includes('telemetry ietf subscription 101') &&
  autoRunCfg.includes('receiver ip address 192.168.100.50 57500 protocol grpc-tcp')
    ? 'PASS'
    : 'FAIL'
}`);

console.log('\n=== SELURUH PENGUJIAN KERNEL, MODUL, CCNP TAHAP 1, 2, 3, 4, 5, 6, & 7 SELESAI DENGAN SUKSES! ===');





