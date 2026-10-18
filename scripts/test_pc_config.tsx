import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { useNetworkStore } from '../src/store/useNetworkStore';
import { HostConfigModal } from '../src/components/devices/HostConfigModal';
import { Host } from '../src/core/devices/Host';

console.log('--- Testing Host IP Visual Configuration ---');

const store = useNetworkStore.getState();
let pc1 = store.devices.find(d => d.deviceType === 'pc') as Host;
if (!pc1) {
  pc1 = store.addDevice('pc', 300, 300) as Host;
}

console.log('1. Created/Found PC:', pc1.id, 'Hostname:', pc1.hostname, 'Initial IP:', pc1.ipAddress);

// Test rendering HostConfigModal
const renderedHtml = ReactDOMServer.renderToString(
  <HostConfigModal hostId={pc1.id} onClose={() => {}} />
);

if (!renderedHtml.includes('Desktop IP Configuration')) {
  throw new Error('HostConfigModal failed to render Desktop IP Configuration tab');
}
console.log('2. HostConfigModal SSR render success! Length:', renderedHtml.length, 'chars');

// Test updating config via store action (simulating user clicking Terapkan / Apply)
store.updateHostConfig(pc1.id, {
  isDhcp: false,
  ipAddress: '192.168.1.50',
  subnetMask: '255.255.255.0',
  defaultGateway: '192.168.1.1',
  dnsServer: '8.8.8.8'
});

const updatedPc1 = useNetworkStore.getState().devices.find(d => d.id === pc1.id) as Host;
console.log('3. Updated PC1 IP:', updatedPc1.ipAddress, 'Gateway:', updatedPc1.defaultGateway);

if (updatedPc1.ipAddress !== '192.168.1.50') {
  throw new Error(`Expected IP 192.168.1.50, but got ${updatedPc1.ipAddress}`);
}

// Test executing ipconfig command on PC1
const ctx = store.cliContexts[pc1.id] || { deviceId: pc1.id, mode: 'user-exec' };
const cliRes = updatedPc1.executeCli('ipconfig', ctx, store.devices);
console.log('4. PC1 ipconfig output:\n' + cliRes.output);

if (!cliRes.output.includes('192.168.1.50')) {
  throw new Error('ipconfig command did not reflect updated IP 192.168.1.50');
}

console.log('=== HOST CONFIGURATION VERIFICATION PASSED 100%! ===');
