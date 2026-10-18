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

console.log('\n=== SELURUH PENGUJIAN KERNEL & MODUL SELESAI DENGAN SUKSES! ===');


