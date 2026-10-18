import { useNetworkStore } from '../src/store/useNetworkStore';
import { SubnetUtils } from '../src/core/network/Subnet';
import { Host } from '../src/core/devices/Host';

async function testHostConfig() {
  console.log('--- TEST 1: SubnetUtils.getDefaultSubnetMask ---');
  console.assert(SubnetUtils.getDefaultSubnetMask('10.0.0.1') === '255.0.0.0', 'Class A should be 255.0.0.0');
  console.assert(SubnetUtils.getDefaultSubnetMask('172.16.1.1') === '255.255.0.0', 'Class B should be 255.255.0.0');
  console.assert(SubnetUtils.getDefaultSubnetMask('192.168.1.10') === '255.255.255.0', 'Class C should be 255.255.255.0');
  console.log('✓ SubnetUtils.getDefaultSubnetMask passed');

  console.log('--- TEST 2: useNetworkStore.addDevice and updateHostConfig ---');
  const store = useNetworkStore.getState();
  const pc = store.addDevice('pc', 300, 300);
  console.assert(pc !== undefined, 'PC should be created');
  console.log(`Created PC with ID: ${pc.id}, hostname: ${pc.hostname}`);

  // Test updating host config visually
  store.updateHostConfig(pc.id, {
    isDhcp: false,
    ipAddress: '192.168.10.50',
    subnetMask: '255.255.255.0',
    defaultGateway: '192.168.10.1',
    dnsServer: '8.8.8.8'
  });

  const updatedDevs = useNetworkStore.getState().devices;
  const updatedPc = updatedDevs.find(d => d.id === pc.id) as Host;
  console.assert(updatedPc.ipAddress === '192.168.10.50', 'IP should be updated to 192.168.10.50');
  console.assert(updatedPc.subnetMask === '255.255.255.0', 'Subnet mask should be 255.255.255.0');
  console.assert(updatedPc.defaultGateway === '192.168.10.1', 'Default gateway should be 192.168.10.1');

  const ifc = updatedPc.interfaces.get('FastEthernet0');
  console.assert(ifc?.ipAddress === '192.168.10.50', 'Interface FastEthernet0 IP should match host IP');
  console.assert(ifc?.status === 'up', 'Interface FastEthernet0 status should be up');
  console.log('✓ updateHostConfig updated Host model and interface correctly');

  console.log('--- TEST 3: PC CLI ipconfig reflects visual config ---');
  const cliRes = updatedPc.executeCli('ipconfig /all', { deviceId: pc.id, mode: 'user-exec' }, updatedDevs);
  console.log(cliRes.output);
  console.assert(cliRes.output.includes('192.168.10.50'), 'CLI output should include updated IP');
  console.assert(cliRes.output.includes('192.168.10.1'), 'CLI output should include default gateway');
  console.log('✓ PC CLI ipconfig reflects visual config perfectly');

  console.log('\nALL HOST CONFIG TESTS PASSED!');
}

testHostConfig().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
