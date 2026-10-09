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
    throw new Error(message);
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
  let rawBuffer: Buffer = Buffer.alloc(0);

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for AUTH_REQUIRED'));
      }, 5000);

      rawSocket.on('connect', () => {
        const request = JSON.stringify({
          bridgeVersion: 1,
          requestId: 'test-unauth',
          operation: 'ping',
        });
        const frame = encodeFrame(Buffer.from(request, 'utf-8'));
        rawSocket.write(frame);
      });

      rawSocket.on('data', (data) => {
        rawBuffer = Buffer.concat([rawBuffer, data]);
        try {
          const result = tryDecodeFrame(rawBuffer);
          if (result) {
            rawBuffer = result.remaining;
            const response = JSON.parse(result.data.toString('utf-8'));
            assert(response.ok === false, 'Expected ok=false');
            assert(response.error?.code === BridgeErrors.AuthRequired, `Expected AUTH_REQUIRED, got ${response.error?.code}`);
            clearTimeout(timeout);
            resolve();
          }
        } catch (e) {
          clearTimeout(timeout);
          reject(e);
        }
      });

      rawSocket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  } finally {
    rawSocket.destroy();
  }

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

  // 5. Context probe with ExternalEvent assertion
  console.log('\n5. Context probe test...');
  const probeResponse = await client.contextProbe();
  assert(probeResponse.ok === true, 'Context probe failed');
  const probeResult = probeResponse.result as { executedOnExternalEvent: boolean; revitVersion: string; revitBuild: string; hasActiveDocument: boolean };
  assert(probeResult.executedOnExternalEvent === true, 'executedOnExternalEvent must be true');
  assert(typeof probeResult.revitVersion === 'string' && probeResult.revitVersion.length > 0, 'revitVersion must be non-empty');
  assert(typeof probeResult.revitBuild === 'string' && probeResult.revitBuild.length > 0, 'revitBuild must be non-empty');
  assert(typeof probeResult.hasActiveDocument === 'boolean', 'hasActiveDocument must be boolean');
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

  // 7. Burst test (8 concurrent) with ExternalEvent assertion
  console.log('\n7. Burst test (8 concurrent)...');
  const burstResults = await Promise.all(
    Array.from({ length: 8 }, () => client.contextProbe())
  );
  const burstOkCount = burstResults.filter(r => r.ok).length;
  assert(burstOkCount === 8, `Only ${burstOkCount}/8 burst ok`);
  const burstExternalEventCount = burstResults.filter(r => {
    const result = r.result as { executedOnExternalEvent: boolean };
    return result.executedOnExternalEvent === true;
  }).length;
  assert(burstExternalEventCount === 8, `Only ${burstExternalEventCount}/8 executedOnExternalEvent`);
  console.log(`   ${burstOkCount}/8 ok, ${burstExternalEventCount}/8 executedOnExternalEvent`);

  // 8. Durability loop (40 sequential) with ExternalEvent assertion
  console.log('\n8. Durability loop (40 sequential)...');
  let durabilityPassed = 0;
  let durabilityExternalEventPassed = 0;
  for (let i = 0; i < 40; i++) {
    const response = await client.contextProbe();
    if (response.ok) {
      durabilityPassed++;
      const result = response.result as { executedOnExternalEvent: boolean };
      if (result.executedOnExternalEvent === true) durabilityExternalEventPassed++;
    }
  }
  assert(durabilityPassed === 40, `Only ${durabilityPassed}/40 durability passed`);
  assert(durabilityExternalEventPassed === 40, `Only ${durabilityExternalEventPassed}/40 executedOnExternalEvent`);
  console.log(`   ${durabilityPassed}/40 ok, ${durabilityExternalEventPassed}/40 executedOnExternalEvent`);

  // 9. Same-client request timeout test (deterministic)
  console.log('\n9. Same-client request timeout test...');
  client.pauseInboundForTests();
  try {
    await client.contextProbe({ timeoutMs: 50 });
    assert(false, 'Expected timeout');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    assert(msg.includes('IPC request timeout'), `Expected IPC request timeout, got: ${msg}`);
    console.log('   PASS');
  } finally {
    client.resumeInboundForTests();
  }

  // 10. Pending count after timeout
  console.log('\n10. Pending count after timeout...');
  const pendingCount = client.getPendingRequestCountForTests();
  assert(pendingCount === 0, `Expected 0 pending, got ${pendingCount}`);
  console.log('   PASS');

  // 11. Ping after timeout
  console.log('\n11. Ping after timeout...');
  const postTimeoutPing = await client.ping();
  assert(postTimeoutPing.ok === true, 'Ping after timeout failed');
  console.log('   PASS');

  // 12. Normal context probe after timeout
  console.log('\n12. Normal context probe after timeout...');
  const postTimeoutProbe = await client.contextProbe();
  assert(postTimeoutProbe.ok === true, 'Context probe after timeout failed');
  const postTimeoutResult = postTimeoutProbe.result as { executedOnExternalEvent: boolean };
  assert(postTimeoutResult.executedOnExternalEvent === true, 'executedOnExternalEvent must be true after timeout');
  console.log('   PASS');

  // 13. Disconnect
  console.log('\n13. Disconnecting...');
  await client.disconnect();
  assert(!client.isConnectedToRevit(), 'Still connected after disconnect');
  console.log('   PASS');

  // 14. Reconnect with bounded retry/backoff
  console.log('\n14. Reconnecting...');
  const maxReconnectAttempts = 5;
  const baseDelayMs = 50;
  let reconnectSuccess = false;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxReconnectAttempts; attempt++) {
    try {
      await client.connect();
      if (client.isConnectedToRevit()) {
        console.log(`   PASS (attempt ${attempt})`);
        break;
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      const isTransient = e instanceof Error &&
        (e.message.includes('ENOENT') || e.message.includes('ECONNREFUSED'));
      if (attempt < maxReconnectAttempts && isTransient) {
        const delayMs = 50 * Math.pow(2, attempt - 1); // 50, 100, 200, 400
        console.log(`   Attempt ${attempt} failed (${e instanceof Error ? e.message : String(e)}), retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      } else {
        throw e;
      }
    }
  }
  assert(client.isConnectedToRevit(), 'Not connected after reconnect');
  console.log('   PASS');

  // 15. Ping after reconnect
  console.log('\n15. Ping after reconnect...');
  const pingResponse2 = await client.ping();
  assert(pingResponse2.ok === true, 'Ping after reconnect failed');
  console.log('   PASS');

  // 16. Final disconnect
  console.log('\n16. Final disconnect...');
  await client.disconnect();
  assert(!client.isConnectedToRevit(), 'Still connected after final disconnect');
  console.log('   PASS');

  console.log('\n=== Smoke Test Complete ===');
}

runSmokeTest().catch((e) => {
  console.error(`\nSMOKE TEST FAILED: ${e.message}`);
  process.exit(1);
});
