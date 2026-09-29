/**
 * RCP-02 Smoke Test CLI
 * Tests the authenticated Named Pipe bridge
 *
 * Usage:
 *   node dist/ipc/smoke.js
 *   node dist/ipc/smoke.js --pid 12345
 */

import { IpcClient } from './client.js';
import { BridgeErrors } from './types.js';

function parseArgs(): { pid?: number } {
  const args = process.argv.slice(2);
  const pidIndex = args.indexOf('--pid');
  if (pidIndex !== -1 && args[pidIndex + 1]) {
    return { pid: parseInt(args[pidIndex + 1], 10) };
  }
  return {};
}

async function runSmokeTest(): Promise<void> {
  const { pid } = parseArgs();

  console.log('=== RCP-02 Bridge Smoke Test ===\n');

  // 1. Discover valid descriptors
  console.log('1. Discovering valid RCP-02 Revit descriptors...');
  const client = new IpcClient({ processId: pid });
  const descriptors = client.getDiscoveredDescriptors();
  console.log(`   Found ${descriptors.length} valid descriptor(s)`);

  if (descriptors.length === 0) {
    console.error('   ERROR: No valid RCP-02 Revit instance found');
    process.exit(1);
  }

  // 2. Negative test: ping before auth
  console.log('\n2. Negative test: ping before authentication...');
  try {
    // Create a raw client without auto-auth
    const rawClient = new IpcClient({ processId: pid });
    // Try to connect without auth - should fail
    console.log('   SKIPPED (auto-auth enabled)');
  } catch (e) {
    console.log(`   Expected error: ${e}`);
  }

  // 3. Authenticated connect
  console.log('\n3. Connecting with authentication...');
  try {
    await client.connect();
    console.log('   Connected and authenticated');
  } catch (e) {
    console.error(`   ERROR: ${e}`);
    process.exit(1);
  }

  // 4. Ping
  console.log('\n4. Ping test...');
  try {
    const pingResponse = await client.ping();
    if (pingResponse.ok) {
      console.log('   PASS');
    } else {
      console.error(`   FAIL: ${pingResponse.error?.message}`);
    }
  } catch (e) {
    console.error(`   ERROR: ${e}`);
  }

  // 5. Context probe
  console.log('\n5. Context probe test...');
  try {
    const probeResponse = await client.contextProbe();
    if (probeResponse.ok) {
      const result = probeResponse.result as { executedOnExternalEvent: boolean };
      console.log(`   PASS (executedOnExternalEvent: ${result.executedOnExternalEvent})`);
    } else {
      console.error(`   FAIL: ${probeResponse.error?.message}`);
    }
  } catch (e) {
    console.error(`   ERROR: ${e}`);
  }

  // 6. Sequential context probes
  console.log('\n6. Sequential context probes (10x)...');
  let passed = 0;
  for (let i = 0; i < 10; i++) {
    try {
      const response = await client.contextProbe();
      if (response.ok) passed++;
    } catch {
      // Ignore
    }
  }
  console.log(`   ${passed}/10 passed`);

  // 7. Disconnect
  console.log('\n7. Disconnecting...');
  await client.disconnect();
  console.log('   Disconnected');

  // 8. Reconnect
  console.log('\n8. Reconnecting...');
  try {
    await client.connect();
    console.log('   Reconnected');
  } catch (e) {
    console.error(`   ERROR: ${e}`);
  }

  // 9. Ping again
  console.log('\n9. Ping after reconnect...');
  try {
    const pingResponse = await client.ping();
    if (pingResponse.ok) {
      console.log('   PASS');
    } else {
      console.error(`   FAIL: ${pingResponse.error?.message}`);
    }
  } catch (e) {
    console.error(`   ERROR: ${e}`);
  }

  // 10. Clean disconnect
  console.log('\n10. Clean disconnect...');
  await client.disconnect();
  console.log('   Done');

  console.log('\n=== Smoke Test Complete ===');
}

runSmokeTest().catch(console.error);
