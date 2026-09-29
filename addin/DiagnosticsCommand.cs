using System;
using System.Text;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.UI;
using Autodesk.Revit.DB;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// Command to show diagnostics information
    /// </summary>
    [Transaction(TransactionMode.Manual)]
    public class DiagnosticsCommand : IExternalCommand
    {
        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            try
            {
                Logger.Info("Diagnostics command executed");

                UIDocument uidoc = commandData.Application.ActiveUIDocument;
                
                var sb = new StringBuilder();
                sb.AppendLine("=== ReBIM Copilot Diagnostics ===");
                sb.AppendLine();
                sb.AppendLine($"ReBIM Copilot Version: {typeof(Application).Assembly.GetName().Version}");
                sb.AppendLine($"Revit Version: {commandData.Application.Application.VersionName}");
                sb.AppendLine($"Revit Build: {commandData.Application.Application.VersionBuild}");
                sb.AppendLine();
                
                if (uidoc != null)
                {
                    sb.AppendLine($"Active Document: {uidoc.Document.Title}");
                    sb.AppendLine($"Active View: {uidoc.ActiveView?.Name ?? "None"}");
                }
                else
                {
                    sb.AppendLine("Active Document: No active document");
                    sb.AppendLine("Active View: None");
                }
                
                sb.AppendLine();
                sb.AppendLine("Add-in Status: Loaded");
                sb.AppendLine("DockablePane: Registered");
                sb.AppendLine("IPC: Not implemented — RCP-02");

                TaskDialog dialog = new TaskDialog("ReBIM Copilot Diagnostics");
                dialog.MainContent = sb.ToString();
                dialog.CommonButtons = TaskDialogCommonButtons.Ok;
                
                dialog.Show();

                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                Logger.Error("Diagnostics command failed", ex);
                message = ex.Message;
                return Result.Failed;
            }
        }
    }
}
