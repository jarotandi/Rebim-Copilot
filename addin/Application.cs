using System;
using Autodesk.Revit.UI;
using Autodesk.Revit.DB;
using ReBIM.Revit.Addin.Bridge;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// ReBIM Copilot Add-in entry point for Revit 2025
    /// Implements IExternalApplication for startup/shutdown lifecycle
    /// </summary>
    public class Application : IExternalApplication
    {
        // FROZEN GUIDs - DO NOT CHANGE (generated 2026-09-29)
        public static readonly string AddInId = "e18ae9d3-e8f8-4ae9-b7ac-80467cad65c6";
        public static readonly string DockablePaneId = "d3b005f6-7e7b-4381-83ea-1c7415544db9";

        private BridgeRuntime _bridgeRuntime;

        public Result OnStartup(UIControlledApplication application)
        {
            try
            {
                Logger.Info("ReBIM Copilot Add-in starting...");

                // Create or find ribbon tab "ReBIM"
                try
                {
                    application.CreateRibbonTab("ReBIM");
                    Logger.Info("Ribbon tab 'ReBIM' created");
                }
                catch (System.ArgumentException)
                {
                    // Tab already exists - continue
                    Logger.Info("Ribbon tab 'ReBIM' already exists");
                }

                // Create ribbon panel
                RibbonPanel panel = application.CreateRibbonPanel("ReBIM", "ReBIM Copilot");
                Logger.Info("Ribbon panel created: ReBIM Copilot");

                // Add Open Copilot button
                PushButtonData openBtnData = new PushButtonData(
                    "OpenReBIMCopilot",
                    "Open Copilot",
                    typeof(Application).Assembly.Location,
                    "ReBIM.Revit.Addin.OpenCopilotCommand");
                PushButton openButton = panel.AddItem(openBtnData) as PushButton;
                if (openButton != null)
                {
                    openButton.Image = RibbonImageLoader.Load("Copilot16.png");
                    openButton.LargeImage = RibbonImageLoader.Load("Copilot32.png");
                    openButton.ToolTip = "Open ReBIM Copilot";
                    openButton.LongDescription = "Open the ReBIM Copilot dockable sidebar.";
                }
                Logger.Info("Open Copilot button added");

                // Add Diagnostics button
                PushButtonData diagBtnData = new PushButtonData(
                    "ReBIMDiagnostics",
                    "Diagnostics",
                    typeof(Application).Assembly.Location,
                    "ReBIM.Revit.Addin.DiagnosticsCommand");
                PushButton diagButton = panel.AddItem(diagBtnData) as PushButton;
                if (diagButton != null)
                {
                    diagButton.Image = RibbonImageLoader.Load("Diagnostics16.png");
                    diagButton.LargeImage = RibbonImageLoader.Load("Diagnostics32.png");
                    diagButton.ToolTip = "ReBIM Diagnostics";
                    diagButton.LongDescription = "Show ReBIM Copilot, Revit, document and runtime diagnostics.";
                }
                Logger.Info("Diagnostics button added");

                // Register DockablePane (do not assign to variable)
                application.RegisterDockablePane(
                    new DockablePaneId(new Guid(DockablePaneId)),
                    "ReBIM Copilot",
                    new DockablePaneProvider());
                Logger.Info("DockablePane registered");

                // Start RCP-02 bridge runtime
                _bridgeRuntime = new BridgeRuntime();
                _bridgeRuntime.Start();
                Logger.Info("RCP-02 bridge runtime started");

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

                // Stop bridge runtime
                _bridgeRuntime?.Stop();
                _bridgeRuntime = null;

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
