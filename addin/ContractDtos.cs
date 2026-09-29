using System.Collections.Generic;
using Newtonsoft.Json;

namespace ReBIM.Revit.Addin
{
    public static class ReBIMProtocol
    {
        public const string Version = "0.1.0";
    }

    public sealed class CopilotCommandEnvelope
    {
        [JsonProperty("protocolVersion")]
        public string ProtocolVersion { get; set; } = ReBIMProtocol.Version;

        [JsonProperty("requestId")]
        public string RequestId { get; set; }

        [JsonProperty("host")]
        public string Host { get; set; } = "revit";

        [JsonProperty("command")]
        public string Command { get; set; }

        [JsonProperty("contextRevision")]
        public string ContextRevision { get; set; }

        [JsonProperty("arguments")]
        public IDictionary<string, object> Arguments { get; set; }
            = new Dictionary<string, object>();
    }

    public sealed class CopilotErrorEnvelope
    {
        [JsonProperty("code")]
        public string Code { get; set; }

        [JsonProperty("message")]
        public string Message { get; set; }

        [JsonProperty("hint")]
        public string Hint { get; set; }

        [JsonProperty("details")]
        public object Details { get; set; }
    }

    public sealed class CopilotResultEnvelope
    {
        [JsonProperty("protocolVersion")]
        public string ProtocolVersion { get; set; } = ReBIMProtocol.Version;

        [JsonProperty("requestId")]
        public string RequestId { get; set; }

        [JsonProperty("ok")]
        public bool Ok { get; set; }

        [JsonProperty("result")]
        public object Result { get; set; }

        [JsonProperty("error")]
        public CopilotErrorEnvelope Error { get; set; }
    }
}
