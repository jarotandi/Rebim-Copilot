/**
 * RCP-02 Smoke Test CLI
 * Tests the authenticated Named Pipe bridge
 *
 * Usage:
 *   node dist/ipc/smoke.js
 *   node dist/ipc/smoke.js --pid 12345
 */

import * as net from 'net';
import { IpcClient } from './client.js';
import { BridgeErrors } from './types.js';
import { encodeFrame, tryDecodeFrame } from './framing.js';
import { resolveDescriptor } from './discovery.js';

function parseArgs(): { pid?: number } {
  const args = process.argv.slice(2);
  const pidIndex = args.indexOf('--pid');
  if (pidIndex !== -1 && args[pidIndex + 1]) {
    return { pid: parseInt(args[pidIndex + 1], 10) };
  }
  return {};
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`   FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`   PASS`);
}

async function runSmokeTest(): Promise<void> {
  const { pid } = parseArgs();

  console.log('=== RCP-02 Bridge Smoke Test ===\n');

  // 1. Discover valid descriptors
  console.log('1. Discovering valid RCP-02 Revit descriptors...');
  const client = new IpcClient({ processId: pid });
  const descriptors = client.getDiscoveredDescriptors();
  console.log(`   Found ${descriptors.length} valid descriptor(s)`);
  assert(descriptors.length > 0, 'No valid RCP-02 Revit instance found');

  // 2. Negative test: ping before auth
  console.log('\n2. Negative test: ping before authentication...');
  const descriptor = resolveDescriptor(pid);
  const rawSocket = net.createConnection(`\\\\.\\pipe\\${descriptor.pipeName}`);

  await new Promise<void>((resolve, reject) => {
    rawSocket.on('connect', () => {
      // Send ping without auth
      const request = JSON.stringify({
        bridgeVersion: 1,
        requestId: 'test-unauth',
        operation: 'ping',
      });
      const frame = encodeFrame(Buffer.from(request, 'utf-8'));
      rawSocket.write(frame);
    });

    rawSocket.on('data', (data) => {
      try {
        const result = tryDecodeFrame(data);
        if (result) {
          const response = JSON.parse(result.data.toString('utf-8'));
          assert(response.ok === false, 'Expected ok=false');
          assert(response.error?.code === BridgeErrors.AuthRequired, `Expected AUTH_REQUIRED, got ${response.error?.code}`);
          rawSocket.end();
          resolve();
        }
      } catch (e) {
        reject(e);
      }
    });

    rawSocket.on('error', reject);
    setTimeout(() => reject(new Error('Timeout')), 5000);
  });

  // 3. Authenticated connect
  console.log('\n3. Connecting with authentication...');
  await client.connect();
  assert(client.isConnectedToRevit(), 'Not connected to Revit');
  console.log('   PASS');

  // 4. Ping
  console.log('\n4. Ping test...');
  const pingResponse = await client.ping();
  assert(pingResponse.ok === true, 'Ping failed');
  console.log('   PASS');

  // 5. Context probe
  console.log('\n5. Context probe test...');
  const probeResponse = await client.contextProbe();
  assert(probeResponse.ok === true, 'Context probe failed');
  console.log('   PASS');

  // 6. Sequential context probes
  console.log('\n6. Sequential context probes (10x)...');
  let passed = 0;
  for (let i = 0; i < 10; i++) {
    const response = await client.contextProbe();
    if (response.ok) passed++;
  }
  assert(passed === 10, `Only ${passed}/10 passed`);
  console.log(`   ${passed}/10 passed`);

  // 7. Disconnect
  console.log('\n7. Disconnecting...');
  await client.disconnect();
  assert(!client.isConnectedToRevit(), 'Still connected after disconnect');
  console.log('   PASS');

  // 8. Reconnect
  console.log('\n8. Reconnecting...');
  await client.connect();
  assert(client.isConnectedToRevit(), 'Not connected after reconnect');
  console.log('   PASS');

  // 9. Ping after reconnect
  console.log('\n9. Ping after reconnect...');
  const pingResponse2 = await client.ping();
  assert(pingResponse2.ok === true, 'Ping after reconnect failed');
  console.log('   PASS');

  // 10. Final disconnect
  console.log('\n10. Final disconnect...');
  await client.disconnect();
  assert(!client.isConnectedToRevit(), 'Still connected after final disconnect');
  console.log('   PASS');

  console.log('\n=== Smoke Test Complete ===');
}

runSmokeTest().catch((e) => {
  console.error(`\nSMOKE TEST FAILED: ${e.message}`);
  process.exit(1);
});
