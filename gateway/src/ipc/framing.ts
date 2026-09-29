/**
 * RCP-02 Length-Prefixed Framing
 * [4-byte unsigned big-endian payload length][UTF-8 JSON bytes]
 */

export const MAX_FRAME_BYTES = 65536;

/**
 * Encode a frame with length prefix
 */
export function encodeFrame(data: Buffer): Buffer {
  if (data.length > MAX_FRAME_BYTES) {
    throw new Error(`Frame too large: ${data.length} > ${MAX_FRAME_BYTES}`);
  }

  const frame = Buffer.alloc(4 + data.length);
  frame.writeUInt32BE(data.length, 0);
  data.copy(frame, 4);
  return frame;
}

/**
 * Try to decode a frame from buffer
 * Returns null if incomplete, or the frame data
 */
export function tryDecodeFrame(buffer: Buffer): { data: Buffer; remaining: Buffer } | null {
  if (buffer.length < 4) return null;

  const length = buffer.readUInt32BE(0);

  if (length === 0) {
    throw new Error('Invalid frame: zero length');
  }

  if (length > MAX_FRAME_BYTES) {
    throw new Error(`Frame too large: ${length} > ${MAX_FRAME_BYTES}`);
  }

  if (buffer.length < 4 + length) return null;

  const data = buffer.subarray(4, 4 + length);
  const remaining = buffer.subarray(4 + length);

  return { data, remaining };
}

/**
 * Encode JSON string to frame
 */
export function encodeJsonFrame(json: string): Buffer {
  return encodeFrame(Buffer.from(json, 'utf-8'));
}

/**
 * Decode frame to JSON string
 */
export function decodeJsonFrame(data: Buffer): string {
  return data.toString('utf-8');
}
