using System;
using Autodesk.Revit.UI;
using Autodesk.Revit.DB;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// ReBIM Copilot Add-in entry point for Revit 2025
    /// Implements IExternalApplication for startup/shutdown lifecycle
    /// </summary>
    public class Application : IExternalApplication
    {
        // Stable GUIDs - DO NOT CHANGE
        public static readonly string AddInId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
        public static readonly string DockablePaneId = "f9e8d7c6-b5a4-4f3e-2d1c-0b9a8f7e6d5c";

        private DockablePane _dockablePane;

        public Result OnStartup(UIControlledApplication application)
        {
            try
            {
                Logger.Info("ReBIM Copilot Add-in starting...");

                // Create ribbon tab "ReBIM"
                RibbonPanel panel = application.CreateRibbonPanel("ReBIM", "ReBIM Copilot");
                Logger.Info("Ribbon panel created: ReBIM Copilot");

                // Add Open Copilot button
                PushButtonData openBtnData = new PushButtonData(
                    "OpenReBIMCopilot",
                    "Open Copilot",
                    typeof(Application).Assembly.Location,
                    "ReBIM.Revit.Addin.OpenCopilotCommand");
                panel.AddItem(openBtnData);
                Logger.Info("Open Copilot button added");

                // Add Diagnostics button
                PushButtonData diagBtnData = new PushButtonData(
                    "ReBIMDiagnostics",
                    "Diagnostics",
                    typeof(Application).Assembly.Location,
                    "ReBIM.Revit.Addin.DiagnosticsCommand");
                panel.AddItem(diagBtnData);
                Logger.Info("Diagnostics button added");

                // Register DockablePane
                _dockablePane = application.RegisterDockablePane(
                    new DockablePaneId(new Guid(DockablePaneId)),
                    "ReBIM Copilot",
                    new DockablePaneProvider());
                Logger.Info("DockablePane registered");

                Logger.Info("ReBIM Copilot Add-in started successfully");
                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                Logger.Error("Startup failed", ex);
                return Result.Failed;
            }
        }

        public Result OnShutdown(UIControlledApplication application)
        {
            try
            {
                Logger.Info("ReBIM Copilot Add-in shutting down...");
                
                // DockablePane is automatically unregistered by Revit
                _dockablePane = null;
                
                Logger.Info("ReBIM Copilot Add-in shutdown complete");
                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                Logger.Error("Shutdown failed", ex);
                return Result.Failed;
            }
        }
    }
}
