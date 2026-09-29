using System;
using System.IO;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// Simple file-based logger for ReBIM Copilot Add-in
    /// Logs to %LocalAppData%\ReBIM\Copilot\logs\
    /// </summary>
    public static class Logger
    {
        private static readonly string LogDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "ReBIM", "Copilot", "logs");

        private static readonly object LockObject = new object();

        static Logger()
        {
            try
            {
                if (!Directory.Exists(LogDirectory))
                {
                    Directory.CreateDirectory(LogDirectory);
                }
            }
            catch
            {
                // Best effort - if we can't create the log directory, we just won't log
            }
        }

        public static void Info(string message)
        {
            Log("INFO", message);
        }

        public static void Warning(string message)
        {
            Log("WARN", message);
        }

        public static void Error(string message, Exception ex = null)
        {
            string fullMessage = ex != null ? $"{message}: {ex.Message}" : message;
            Log("ERROR", fullMessage);
        }

        private static void Log(string level, string message)
        {
            try
            {
                lock (LockObject)
                {
                    string logFile = Path.Combine(LogDirectory, $"rebim_{DateTime.Now:yyyyMMdd}.log");
                    string entry = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [{level}] {message}{Environment.NewLine}";
                    File.AppendAllText(logFile, entry);
                }
            }
            catch
            {
                // Best effort logging - swallow exceptions
            }
        }
    }
}
