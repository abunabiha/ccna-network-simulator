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

console.log('\n=== SELURUH PENGUJIAN KERNEL, MODUL, CCNP TAHAP 1, 2, & 3 SELESAI DENGAN SUKSES! ===');




