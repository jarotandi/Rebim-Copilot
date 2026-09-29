using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text.Json;

namespace ReBIM.Revit.Addin.Bridge
{
    /// <summary>
    /// Runtime descriptor for RCP-02 Revit add-in instance
    /// Published to %LOCALAPPDATA%\ReBIM\Copilot\runtime\
    /// </summary>
    public class RuntimeDescriptor
    {
        public int BridgeVersion { get; set; }
        public int ProcessId { get; set; }
        public string PipeName { get; set; }
        public string Token { get; set; }
        public string StartedAtUtc { get; set; }
        public string AddinVersion { get; set; }
    }

    /// <summary>
    /// Discovery service for RCP-02 runtime descriptors
    /// </summary>
    public static class BridgeDiscovery
    {
        private static readonly string RuntimeDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "ReBIM", "Copilot", "runtime");

        /// <summary>
        /// Get the runtime directory path
        /// </summary>
        public static string GetRuntimeDirectory()
        {
            return RuntimeDirectory;
        }

        /// <summary>
        /// Ensure runtime directory exists
        /// </summary>
        public static void EnsureRuntimeDirectory()
        {
            if (!Directory.Exists(RuntimeDirectory))
            {
                Directory.CreateDirectory(RuntimeDirectory);
            }
        }

        /// <summary>
        /// Generate a cryptographically random token (256 bits)
        /// </summary>
        public static string GenerateToken()
        {
            using (var rng = RandomNumberGenerator.Create())
            {
                byte[] tokenBytes = new byte[32]; // 256 bits
                rng.GetBytes(tokenBytes);
                return Convert.ToBase64String(tokenBytes)
                    .Replace("+", "-")
                    .Replace("/", "_")
                    .Replace("=", "");
            }
        }

        /// <summary>
        /// Generate a unique pipe name for this instance
        /// </summary>
        public static string GeneratePipeName(int processId)
        {
            string nonce = Guid.NewGuid().ToString("N").Substring(0, 8);
            return $"rebim-copilot-revit-{processId}-{nonce}";
        }

        /// <summary>
        /// Create and publish a runtime descriptor
        /// </summary>
        public static RuntimeDescriptor PublishDescriptor(int processId, string pipeName, string token, string addinVersion)
        {
            EnsureRuntimeDirectory();

            var descriptor = new RuntimeDescriptor
            {
                BridgeVersion = BridgeProtocol.Version,
                ProcessId = processId,
                PipeName = pipeName,
                Token = token,
                StartedAtUtc = DateTime.UtcNow.ToString("o"),
                AddinVersion = addinVersion
            };

            string fileName = $"revit-{processId}-{Guid.NewGuid():N}.json";
            string filePath = Path.Combine(RuntimeDirectory, fileName);

            // Write atomically
            string tempFile = filePath + ".tmp";
            string json = JsonSerializer.Serialize(descriptor, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(tempFile, json);
            File.Move(tempFile, filePath);

            return descriptor;
        }

        /// <summary>
        /// Remove a runtime descriptor
        /// </summary>
        public static void RemoveDescriptor(string pipeName)
        {
            try
            {
                if (!Directory.Exists(RuntimeDirectory)) return;

                foreach (string file in Directory.GetFiles(RuntimeDirectory, "revit-*.json"))
                {
                    try
                    {
                        string json = File.ReadAllText(file);
                        var descriptor = JsonSerializer.Deserialize<RuntimeDescriptor>(json);
                        if (descriptor?.PipeName == pipeName)
                        {
                            File.Delete(file);
                            break;
                        }
                    }
                    catch { /* ignore malformed descriptors */ }
                }
            }
            catch { /* best effort cleanup */ }
        }

        /// <summary>
        /// Discover valid runtime descriptors
        /// </summary>
        public static List<RuntimeDescriptor> DiscoverValidDescriptors()
        {
            var validDescriptors = new List<RuntimeDescriptor>();

            try
            {
                if (!Directory.Exists(RuntimeDirectory)) return validDescriptors;

                foreach (string file in Directory.GetFiles(RuntimeDirectory, "revit-*.json"))
                {
                    try
                    {
                        string json = File.ReadAllText(file);
                        var descriptor = JsonSerializer.Deserialize<RuntimeDescriptor>(json);

                        if (descriptor == null) continue;
                        if (descriptor.BridgeVersion != BridgeProtocol.Version) continue;
                        if (descriptor.ProcessId <= 0) continue;
                        if (string.IsNullOrEmpty(descriptor.PipeName)) continue;
                        if (string.IsNullOrEmpty(descriptor.Token)) continue;

                        // Check if process is still running
                        if (!IsProcessRunning(descriptor.ProcessId)) continue;

                        validDescriptors.Add(descriptor);
                    }
                    catch { /* ignore malformed descriptors */ }
                }
            }
            catch { /* return empty list on error */ }

            return validDescriptors;
        }

        /// <summary>
        /// Check if a process is running
        /// </summary>
        private static bool IsProcessRunning(int processId)
        {
            try
            {
                var process = Process.GetProcessById(processId);
                return !process.HasExited;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Resolve a single descriptor based on processId or fail closed
        /// </summary>
        public static RuntimeDescriptor ResolveDescriptor(int? targetProcessId = null)
        {
            var descriptors = DiscoverValidDescriptors();

            if (descriptors.Count == 0)
            {
                throw new Exception("No valid RCP-02 Revit instance found");
            }

            if (targetProcessId.HasValue)
            {
                var match = descriptors.FirstOrDefault(d => d.ProcessId == targetProcessId.Value);
                if (match == null)
                {
                    throw new Exception($"Revit instance with PID {targetProcessId.Value} not found");
                }
                return match;
            }

            if (descriptors.Count > 1)
            {
                throw new Exception("Multiple RCP-02 Revit instances found. Please specify a processId.");
            }

            return descriptors[0];
        }
    }
}
