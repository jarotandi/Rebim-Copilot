using System.Text.Json;
using System.Text.Json.Serialization;

namespace ReBIM.Revit.Addin.Bridge
{
    /// <summary>
    /// Canonical JSON configuration for RCP-02 bridge protocol
    /// Uses camelCase to match TypeScript wire format
    /// </summary>
    public static class BridgeJson
    {
        public static readonly JsonSerializerOptions Options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.Never,
        };

        /// <summary>
        /// Serialize an object to JSON string
        /// </summary>
        public static string Serialize<T>(T value)
        {
            return JsonSerializer.Serialize(value, Options);
        }

        /// <summary>
        /// Deserialize JSON string to object
        /// </summary>
        public static T Deserialize<T>(string json)
        {
            return JsonSerializer.Deserialize<T>(json, Options);
        }

        /// <summary>
        /// Deserialize JSON string to object (nullable)
        /// </summary>
        public static T? DeserializeOrNull<T>(string json)
        {
            return JsonSerializer.Deserialize<T>(json, Options);
        }
    }
}
