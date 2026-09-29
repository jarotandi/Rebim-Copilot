using System;
using System.IO.Pipes;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// IPC server scaffold for ReBIM Copilot.
    /// RCP-02 owns the production Named Pipe lifecycle, authentication handshake,
    /// framing, queueing, and ExternalEvent dispatch.
    /// </summary>
    public class IpcServer
    {
        private const string PipeName = "ReBIM_Copilot_Revit";
        private const int BufferSize = 65536;

        private CancellationTokenSource _cts;
        private Task _listenerTask;
        private string _sessionToken;

        public static bool IsRunning { get; private set; }

        public void Start()
        {
            if (IsRunning) return;

            _cts = new CancellationTokenSource();
            _sessionToken = GenerateSessionToken();
            _listenerTask = Task.Run(() => ListenAsync(_cts.Token));
            IsRunning = true;
        }

        public void Stop()
        {
            if (!IsRunning) return;

            _cts?.Cancel();
            _listenerTask?.Wait(TimeSpan.FromSeconds(5));
            IsRunning = false;
        }

        private async Task ListenAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                try
                {
                    await using var pipe = new NamedPipeServerStream(
                        PipeName,
                        PipeDirection.InOut,
                        1,
                        PipeTransmissionMode.Byte,
                        PipeOptions.Asynchronous,
                        BufferSize,
                        BufferSize);

                    await pipe.WaitForConnectionAsync(ct);

                    // RCP-02 will replace this one-request scaffold with framed,
                    // persistent request handling plus ExternalEvent dispatch.
                    await HandleClientAsync(pipe, ct);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch
                {
                    // Structured diagnostics are added in RCP-13.
                }
            }
        }

        private async Task HandleClientAsync(NamedPipeServerStream pipe, CancellationToken ct)
        {
            try
            {
                var buffer = new byte[BufferSize];
                int bytesRead = await pipe.ReadAsync(buffer, 0, BufferSize, ct);
                if (bytesRead <= 0) return;

                string requestJson = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                string responseJson = ProcessRequest(requestJson) + "\n";

                byte[] responseBytes = Encoding.UTF8.GetBytes(responseJson);
                await pipe.WriteAsync(responseBytes, 0, responseBytes.Length, ct);
                await pipe.FlushAsync(ct);
            }
            catch
            {
                // Structured diagnostics are added in RCP-13.
            }
        }

        private string ProcessRequest(string requestJson)
        {
            try
            {
                var request = JsonConvert.DeserializeObject<IpcRequest>(requestJson);

                if (request?.Token != _sessionToken)
                {
                    return CreateErrorResponse(
                        request?.RequestId,
                        "REBIM_PERMISSION_DENIED",
                        "Invalid session token");
                }

                // IMPORTANT: this direct execution path is scaffold-only.
                // RCP-02 must marshal every Revit API operation via ExternalEvent.
                var result = CommandHandler.Execute(request.Command, request.Parameters);
                return JsonConvert.SerializeObject(new IpcResponse
                {
                    RequestId = request.RequestId,
                    Ok = true,
                    Result = result
                });
            }
            catch (Exception ex)
            {
                return CreateErrorResponse(null, "REBIM_EXECUTION_FAILED", ex.Message);
            }
        }

        private string CreateErrorResponse(string requestId, string code, string message)
        {
            return JsonConvert.SerializeObject(new IpcResponse
            {
                RequestId = requestId,
                Ok = false,
                Error = new IpcError { Code = code, Message = message }
            });
        }

        private static string GenerateSessionToken()
        {
            return Guid.NewGuid().ToString("N");
        }
    }

    public class IpcRequest
    {
        public string RequestId { get; set; }
        public string Token { get; set; }
        public string Command { get; set; }
        public object Parameters { get; set; }
    }

    public class IpcResponse
    {
        public string RequestId { get; set; }
        public bool Ok { get; set; }
        public object Result { get; set; }
        public IpcError Error { get; set; }
    }

    public class IpcError
    {
        public string Code { get; set; }
        public string Message { get; set; }
    }
}
