using System;
using System.IO;
using System.IO.Pipes;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// Named Pipe IPC server for ReBIM Copilot
    /// Handles communication between Revit Add-in and AI Gateway
    /// </summary>
    public class IpcServer
    {
        private const string PipeName = "ReBIM_Copilot_Revit";
        private const int BufferSize = 65536;
        
        private CancellationTokenSource _cts;
        private Task _listenerTask;
        private string _sessionToken;

        public void Start()
        {
            _cts = new CancellationTokenSource();
            _sessionToken = GenerateSessionToken();
            _listenerTask = Task.Run(() => ListenAsync(_cts.Token));
        }

        public void Stop()
        {
            _cts?.Cancel();
            _listenerTask?.Wait(TimeSpan.FromSeconds(5));
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
                    _ = HandleClientAsync(pipe, ct);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    // Log error
                }
            }
        }

        private async Task HandleClientAsync(NamedPipeServerStream pipe, CancellationToken ct)
        {
            try
            {
                var buffer = new byte[BufferSize];
                var sb = new StringBuilder();

                int bytesRead;
                while ((bytesRead = await pipe.ReadAsync(buffer, 0, BufferSize, ct)) > 0)
                {
                    sb.Append(Encoding.UTF8.GetString(buffer, 0, bytesRead));
                }

                string requestJson = sb.ToString();
                string responseJson = ProcessRequest(requestJson);

                byte[] responseBytes = Encoding.UTF8.GetBytes(responseJson);
                await pipe.WriteAsync(responseBytes, 0, responseBytes.Length, ct);
            }
            catch (Exception ex)
            {
                // Log error
            }
        }

        private string ProcessRequest(string requestJson)
        {
            try
            {
                var request = JsonConvert.DeserializeObject<IpcRequest>(requestJson);
                
                // Validate session token
                if (request?.Token != _sessionToken)
                {
                    return CreateErrorResponse(request?.RequestId, "REBIM_PERMISSION_DENIED", 
                        "Invalid session token");
                }

                // Process command
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
