using System;
using System.IO;
using System.IO.Pipes;
using System.Security.AccessControl;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace ReBIM.Revit.Addin.Bridge
{
    /// <summary>
    /// Named Pipe server for RCP-02 bridge
    /// LOCAL ONLY - no TCP fallback
    /// </summary>
    public class BridgeNamedPipeServer
    {
        private readonly BridgeRuntime _runtime;
        private readonly string _pipeName;
        private readonly string _token;
        private NamedPipeServerStream _pipeServer;
        private CancellationTokenSource _cts;
        private Task _listenerTask;
        private bool _isAuthenticated;

        public BridgeNamedPipeServer(BridgeRuntime runtime, string pipeName, string token)
        {
            _runtime = runtime;
            _pipeName = pipeName;
            _token = token;
        }

        /// <summary>
        /// Start the named pipe server
        /// </summary>
        public void Start()
        {
            _cts = new CancellationTokenSource();
            _listenerTask = Task.Run(() => ListenAsync(_cts.Token));
            Logger.Info($"Named Pipe server started: {_pipeName}");
        }

        /// <summary>
        /// Stop the named pipe server
        /// </summary>
        public void Stop()
        {
            _cts?.Cancel();
            _pipeServer?.Dispose();
            Logger.Info("Named Pipe server stopped");
        }

        private async Task ListenAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested && !_runtime.IsStopping)
            {
                try
                {
                    _pipeServer = new NamedPipeServerStream(
                        _pipeName,
                        PipeDirection.InOut,
                        1,
                        PipeTransmissionMode.Byte,
                        PipeOptions.Asynchronous | PipeOptions.CurrentUserOnly,
                        BridgeProtocol.MaxFrameBytes,
                        BridgeProtocol.MaxFrameBytes);

                    await _pipeServer.WaitForConnectionAsync(ct);
                    _isAuthenticated = false;

                    _ = HandleClientAsync(_pipeServer, ct);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Logger.Error("Named Pipe server error", ex);
                }
            }
        }

        private async Task HandleClientAsync(NamedPipeServerStream pipe, CancellationToken ct)
        {
            try
            {
                var buffer = new byte[BridgeProtocol.MaxFrameBytes];
                var frameBuffer = new MemoryStream();

                while (pipe.IsConnected && !ct.IsCancellationRequested)
                {
                    int bytesRead = await pipe.ReadAsync(buffer, 0, buffer.Length, ct);
                    if (bytesRead == 0) break;

                    frameBuffer.Write(buffer, 0, bytesRead);

                    // Process complete frames
                    while (TryReadFrame(frameBuffer, out byte[] frameData))
                    {
                        var response = await ProcessFrame(frameData);
                        byte[] responseFrame = EncodeFrame(response);
                        await pipe.WriteAsync(responseFrame, 0, responseFrame.Length, ct);
                    }
                }
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                Logger.Error("Client handling error", ex);
            }
        }

        /// <summary>
        /// Try to read a complete length-prefixed frame from buffer
        /// </summary>
        private bool TryReadFrame(MemoryStream buffer, out byte[] frameData)
        {
            frameData = null;
            if (buffer.Length < 4) return false;

            byte[] data = buffer.ToArray();
            int length = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];

            if (length == 0 || length > BridgeProtocol.MaxFrameBytes)
            {
                throw new Exception(BridgeProtocol.FrameTooLarge);
            }

            if (buffer.Length < 4 + length) return false;

            frameData = new byte[length];
            Array.Copy(data, 4, frameData, 0, length);

            // Compact buffer
            long remaining = buffer.Length - 4 - length;
            buffer.SetLength(0);
            if (remaining > 0)
            {
                buffer.Write(data, 4 + length, (int)remaining);
            }

            return true;
        }

        /// <summary>
        /// Process a frame and return response JSON
        /// </summary>
        private async Task<byte[]> ProcessFrame(byte[] frameData)
        {
            try
            {
                string json = Encoding.UTF8.GetString(frameData);
                var request = JsonSerializer.Deserialize<BridgeRequest>(json);

                if (request == null)
                {
                    return EncodeResponse(new BridgeResponse
                    {
                        BridgeVersion = BridgeProtocol.Version,
                        RequestId = null,
                        Ok = false,
                        Error = new BridgeError { Code = BridgeProtocol.MalformedFrame, Message = "Malformed request" }
                    });
                }

                // Authentication check
                if (request.Operation != BridgeOperations.Authenticate && !_isAuthenticated)
                {
                    return EncodeResponse(new BridgeResponse
                    {
                        BridgeVersion = BridgeProtocol.Version,
                        RequestId = request.RequestId,
                        Ok = false,
                        Error = new BridgeError { Code = BridgeProtocol.AuthRequired, Message = "Authentication required" }
                    });
                }

                // Process operation
                BridgeResponse response;
                switch (request.Operation)
                {
                    case BridgeOperations.Authenticate:
                        response = ProcessAuthenticate(request);
                        break;
                    case BridgeOperations.Ping:
                        response = ProcessPing(request);
                        break;
                    case BridgeOperations.ContextProbe:
                        response = await ProcessContextProbeRequest(request);
                        break;
                    default:
                        response = new BridgeResponse
                        {
                            BridgeVersion = BridgeProtocol.Version,
                            RequestId = request.RequestId,
                            Ok = false,
                            Error = new BridgeError { Code = BridgeProtocol.UnsupportedOperation, Message = $"Operation '{request.Operation}' is not supported" }
                        };
                        break;
                }

                return EncodeResponse(response);
            }
            catch (Exception ex)
            {
                return EncodeResponse(new BridgeResponse
                {
                    BridgeVersion = BridgeProtocol.Version,
                    RequestId = null,
                    Ok = false,
                    Error = new BridgeError { Code = BridgeProtocol.InternalError, Message = ex.Message }
                });
            }
        }

        private BridgeResponse ProcessAuthenticate(BridgeRequest request)
        {
            if (string.IsNullOrEmpty(request.Token))
            {
                return new BridgeResponse
                {
                    BridgeVersion = BridgeProtocol.Version,
                    RequestId = request.RequestId,
                    Ok = false,
                    Error = new BridgeError { Code = BridgeProtocol.AuthFailed, Message = "Token required" }
                };
            }

            // Constant-time comparison
            if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(request.Token),
                Encoding.UTF8.GetBytes(_token)))
            {
                return new BridgeResponse
                {
                    BridgeVersion = BridgeProtocol.Version,
                    RequestId = request.RequestId,
                    Ok = false,
                    Error = new BridgeError { Code = BridgeProtocol.AuthFailed, Message = "Invalid token" }
                };
            }

            _isAuthenticated = true;
            return new BridgeResponse
            {
                BridgeVersion = BridgeProtocol.Version,
                RequestId = request.RequestId,
                Ok = true,
                Result = new { status = "authenticated" }
            };
        }

        private BridgeResponse ProcessPing(BridgeRequest request)
        {
            return new BridgeResponse
            {
                BridgeVersion = BridgeProtocol.Version,
                RequestId = request.RequestId,
                Ok = true,
                Result = new { status = "ok" }
            };
        }

        private async Task<BridgeResponse> ProcessContextProbeRequest(BridgeRequest request)
        {
            // Enqueue work item for ExternalEvent processing
            var workItem = new BridgeWorkItem(request.RequestId, BridgeOperations.ContextProbe, BridgeProtocol.ContextProbeTimeoutMs);

            if (!_runtime.EnqueueWork(workItem))
            {
                return new BridgeResponse
                {
                    BridgeVersion = BridgeProtocol.Version,
                    RequestId = request.RequestId,
                    Ok = false,
                    Error = new BridgeError { Code = BridgeProtocol.QueueFull, Message = "Queue is full" }
                };
            }

            // Wait for completion with timeout
            try
            {
                var response = await workItem.CompletionSource.Task
                    .WaitAsync(TimeSpan.FromMilliseconds(BridgeProtocol.ContextProbeTimeoutMs));

                return response;
            }
            catch (TimeoutException)
            {
                return new BridgeResponse
                {
                    BridgeVersion = BridgeProtocol.Version,
                    RequestId = request.RequestId,
                    Ok = false,
                    Error = new BridgeError { Code = BridgeProtocol.RequestTimeout, Message = "Request timed out" }
                };
            }
        }

        private byte[] EncodeResponse(BridgeResponse response)
        {
            string json = JsonSerializer.Serialize(response);
            return EncodeFrame(Encoding.UTF8.GetBytes(json));
        }

        private byte[] EncodeFrame(byte[] data)
        {
            byte[] frame = new byte[4 + data.Length];
            frame[0] = (byte)(data.Length >> 24);
            frame[1] = (byte)(data.Length >> 16);
            frame[2] = (byte)(data.Length >> 8);
            frame[3] = (byte)data.Length;
            Array.Copy(data, 0, frame, 4, data.Length);
            return frame;
        }
    }
}
