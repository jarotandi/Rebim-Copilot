using System;
using System.Text;
using Autodesk.Revit.UI;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// Command to show diagnostics information
    /// </summary>
    public class DiagnosticsCommand : IExternalCommand
    {
        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            try
            {
                UIDocument uidoc = commandData.Application.ActiveUIDocument;
                if (uidoc == null)
                {
                    return Result.Failed;
                }

                var sb = new StringBuilder();
                sb.AppendLine("=== ReBIM Copilot Diagnostics ===");
                sb.AppendLine();
                sb.AppendLine($"Revit Version: {commandData.Application.Application.VersionName}");
                sb.AppendLine($"Document: {uidoc.Document.Title}");
                sb.AppendLine($"Active View: {uidoc.ActiveView?.Name}");
                sb.AppendLine();
                sb.AppendLine("IPC Status: " + (IpcServer.IsRunning ? "Running" : "Stopped"));
                sb.AppendLine();
                sb.AppendLine("Press OK to copy to clipboard.");

                TaskDialog dialog = new TaskDialog("ReBIM Copilot Diagnostics");
                dialog.MainContent = sb.ToString();
                dialog.CommonButtons = TaskDialogCommonButtons.Ok;
                
                if (dialog.Show() == TaskDialogResult.Ok)
                {
                    System.Windows.Clipboard.SetText(sb.ToString());
                }

                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                message = ex.Message;
                return Result.Failed;
            }
        }
    }
}
