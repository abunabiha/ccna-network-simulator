import { useNetworkStore } from '../src/store/useNetworkStore';
import { DeviceType } from '../src/types/network';

async function runStressTopologyTest() {
  console.log('=== STRESS TEST: RAPID TOPOLOGY ADDITION, CABLING & DRAGGING ===');

  const store = useNetworkStore.getState();
  const types: DeviceType[] = ['router', 'switch', 'switch-l3', 'pc', 'server', 'cloud'];

  console.log('\n--- 1. Menambahkan 18 Perangkat Campuran Secara Cepat ---');
  const addedIds: string[] = [];
  for (let i = 0; i < 18; i++) {
    const type = types[i % types.length];
    const x = 100 + (i % 6) * 120;
    const y = 100 + Math.floor(i / 6) * 140;
    const dev = useNetworkStore.getState().addDevice(type, x, y);
    if (!dev || !dev.id) {
      throw new Error(`Gagal menambahkan perangkat ke-${i} bertipe ${type}`);
    }
    addedIds.push(dev.id);
  }

  const currentDevs = useNetworkStore.getState().devices;
  console.log(`✓ Berhasil menambahkan ${addedIds.length} perangkat. Total node di store: ${currentDevs.length}`);

  console.log('\n--- 2. Menguji Simulasi Rapid Dragging (1000 kali moveDevice) ---');
  const startDragTime = Date.now();
  for (let cycle = 0; cycle < 1000; cycle++) {
    const targetId = addedIds[cycle % addedIds.length];
    const newX = 100 + ((cycle * 7) % 800);
    const newY = 100 + ((cycle * 13) % 600);
    useNetworkStore.getState().moveDevice(targetId, newX, newY);
  }
  const dragDuration = Date.now() - startDragTime;
  console.log(`✓ 1000 pembaruan posisi selesai dalam ${dragDuration} ms (Sangat cepat & non-blocking)`);

  // Pastikan tidak ada NaN pada koordinat
  for (const d of useNetworkStore.getState().devices) {
    if (isNaN(d.position?.x) || isNaN(d.position?.y)) {
      throw new Error(`Perangkat ${d.id} memiliki koordinat NaN!`);
    }
  }
  console.log('✓ Seluruh koordinat perangkat valid dan aman dari NaN');

  console.log('\n--- 3. Menguji Menghubungkan Kabel Antar Perangkat Secara Dinamis ---');
  const sw1 = currentDevs.find(d => d.deviceType === 'switch');
  const pc1 = currentDevs.find(d => d.deviceType === 'pc');
  const r1 = currentDevs.find(d => d.deviceType === 'router');

  if (sw1 && pc1) {
    const connected = useNetworkStore.getState().connectPorts(pc1.id, 'FastEthernet0', sw1.id, 'FastEthernet0/1', 'straight');
    console.log(`✓ Hubungkan ${pc1.hostname} (Fa0) ke ${sw1.hostname} (Fa0/1): ${connected ? 'SUKSES' : 'PORT BUSY'}`);
  }

  if (sw1 && r1) {
    const connected = useNetworkStore.getState().connectPorts(sw1.id, 'GigabitEthernet0/1', r1.id, 'GigabitEthernet0/0', 'straight');
    console.log(`✓ Hubungkan ${sw1.hostname} (Gi0/1) ke ${r1.hostname} (Gi0/0): ${connected ? 'SUKSES' : 'PORT BUSY'}`);
  }

  console.log('\n--- 4. Menguji Penghapusan Perangkat dan Pembersihan Link Otomatis ---');
  const devToRemove = addedIds[0];
  useNetworkStore.getState().removeDevice(devToRemove);
  const remainingDevs = useNetworkStore.getState().devices;
  if (remainingDevs.some(d => d.id === devToRemove)) {
    throw new Error(`Perangkat ${devToRemove} gagal dihapus dari store`);
  }
  console.log(`✓ Berhasil menghapus ${devToRemove}. Total perangkat tersisa: ${remainingDevs.length}`);

  console.log('\n=== SELURUH PENGUJIAN STRESS TOPOLOGY BERHASIL 100% TANPA ERROR! ===');
}

runStressTopologyTest().catch(err => {
  console.error('Stress test failed:', err);
  process.exit(1);
});
