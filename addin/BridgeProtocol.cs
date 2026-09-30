using System;

namespace ReBIM.Revit.Addin.Bridge
{
    /// <summary>
    /// Bridge protocol constants and types
    /// PRIVATE to RCP-02, NOT part of frozen RCP-00 semantic contract
    /// </summary>
    public static class BridgeProtocol
    {
        public const int Version = 1;
        public const int MaxFrameBytes = 65536;
        public const int MaxQueueSize = 32;
        public const int MaxBatchSize = 16;
        public const int ConnectTimeoutMs = 3000;
        public const int RequestTimeoutMs = 5000;
        public const int ContextProbeTimeoutMs = 5000;

        // Bridge error codes (NOT in frozen contracts)
        public const string AuthRequired = "AUTH_REQUIRED";
        public const string AuthFailed = "AUTH_FAILED";
        public const string MalformedFrame = "MALFORMED_FRAME";
        public const string FrameTooLarge = "FRAME_TOO_LARGE";
        public const string UnsupportedOperation = "UNSUPPORTED_OPERATION";
        public const string QueueFull = "QUEUE_FULL";
        public const string RequestTimeout = "REQUEST_TIMEOUT";
        public const string BridgeShuttingDown = "BRIDGE_SHUTTING_DOWN";
        public const string RevitContextBusy = "REVIT_CONTEXT_BUSY";
        public const string InternalError = "INTERNAL_ERROR";
        public const string AmbiguousRevitInstance = "AMBIGUOUS_REVIT_INSTANCE";
        public const string RevitInstanceNotFound = "REVIT_INSTANCE_NOT_FOUND";
    }

    /// <summary>
    /// Bridge operations allowed in RCP-02
    /// </summary>
    public static class BridgeOperations
    {
        public const string Authenticate = "authenticate";
        public const string Ping = "ping";
        public const string ContextProbe = "context_probe";
    }

    /// <summary>
    /// Enqueue result reasons
    /// </summary>
    public enum BridgeEnqueueResult
    {
        Accepted,
        QueueFull,
        ShuttingDown,
        RevitContextBusy
    }

    /// <summary>
    /// Bridge request frame
    /// </summary>
    public class BridgeRequest
    {
        public int BridgeVersion { get; set; }
        public string RequestId { get; set; }
        public string Operation { get; set; }
        public string Token { get; set; }
    }

    /// <summary>
    /// Bridge response frame
    /// </summary>
    public class BridgeResponse
    {
        public int BridgeVersion { get; set; }
        public string RequestId { get; set; }
        public bool Ok { get; set; }
        public object Result { get; set; }
        public BridgeError Error { get; set; }
    }

    /// <summary>
    /// Bridge error
    /// </summary>
    public class BridgeError
    {
        public string Code { get; set; }
        public string Message { get; set; }
    }

    /// <summary>
    /// Context probe result
    /// </summary>
    public class ContextProbeResult
    {
        public string RevitVersion { get; set; }
        public string RevitBuild { get; set; }
        public bool HasActiveDocument { get; set; }
        public bool ExecutedOnExternalEvent { get; set; }
    }
}
