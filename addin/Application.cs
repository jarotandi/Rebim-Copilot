using System;
using System.Windows.Controls;
using Autodesk.Revit.UI;
using Autodesk.Revit.DB;
using Newtonsoft.Json;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// ReBIM Copilot Add-in entry point for Revit 2025
    /// Implements IExternalApplication for startup/shutdown lifecycle
    /// </summary>
    public class Application : IExternalApplication
    {
        private static readonly string AppDataPath = 
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        private static readonly string LogPath = 
            System.IO.Path.Combine(AppDataPath, "ReBIM", "Copilot", "logs");
        
        private IpcServer _ipcServer;
        private DockablePane _pane;

        public Result OnStartup(UIControlledApplication application)
        {
            try
            {
                // Initialize logging
                System.IO.Directory.CreateDirectory(LogPath);
                Log("ReBIM Copilot Add-in starting...");

                // Create ribbon panel
                RibbonPanel panel = application.CreateRibbonPanel("ReBIM Copilot");
                
                // Add Open Copilot button
                PushButtonData openBtnData = new PushButtonData(
                    "OpenReBIMCopilot",
                    "Open Copilot",
                    typeof(Application).Assembly.Location,
                    "ReBIM.Revit.Addin.OpenCopilotCommand");
                panel.AddItem(openBtnData);

                // Add Diagnostics button
                PushButtonData diagBtnData = new PushButtonData(
                    "ReBIMDiagnostics",
                    "Diagnostics",
                    typeof(Application).Assembly.Location,
                    "ReBIM.Revit.Addin.DiagnosticsCommand");
                panel.AddItem(diagBtnData);

                // Start IPC server
                _ipcServer = new IpcServer();
                _ipcServer.Start();
                Log("IPC server started");

                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                Log($"Startup error: {ex.Message}");
                return Result.Failed;
            }
        }

        public Result OnShutdown(UIControlledApplication application)
        {
            try
            {
                Log("ReBIM Copilot Add-in shutting down...");
                _ipcServer?.Stop();
                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                Log($"Shutdown error: {ex.Message}");
                return Result.Failed;
            }
        }

        private static void Log(string message)
        {
            string logFile = System.IO.Path.Combine(LogPath, 
                $"rebim_{DateTime.Now:yyyyMMdd}.log");
            string entry = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}{Environment.NewLine}";
            System.IO.File.AppendAllText(logFile, entry);
        }
    }
}
