import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App';
import { useNetworkStore } from '../src/store/useNetworkStore';

try {
  console.log('--- 1. Testing renderToString of App in default state ---');
  const html1 = renderToString(<App />);
  console.log(`✓ Render default state success! HTML length: ${html1.length} chars`);

  console.log('\n--- 2. Testing renderToString in Free Sandbox Mode (0 devices) ---');
  useNetworkStore.getState().loadLab('ccna-lab-sandbox');
  const html2 = renderToString(<App />);
  console.log(`✓ Render Free Sandbox Mode success! HTML length: ${html2.length} chars`);

  console.log('\n--- 3. Testing renderToString with 10 added devices of all types ---');
  const types = ['router', 'switch', 'switch-l3', 'pc', 'server', 'cloud'] as const;
  for (let i = 0; i < 10; i++) {
    useNetworkStore.getState().addDevice(types[i % types.length], 200 + i * 50, 200 + i * 30);
  }
  const html3 = renderToString(<App />);
  console.log(`✓ Render 10 devices success! HTML length: ${html3.length} chars`);

  console.log('\n=== ALL RENDER TESTS PASSED 100% WITHOUT ERROR! ===');
  process.exit(0);
} catch (err) {
  console.error('Render test failed:', err);
  process.exit(1);
}
