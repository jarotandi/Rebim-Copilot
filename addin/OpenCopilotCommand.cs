using System;
using Autodesk.Revit.UI;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// Command to open ReBIM Copilot DockablePane
    /// </summary>
    public class OpenCopilotCommand : IExternalCommand
    {
        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            try
            {
                Logger.Info("Open Copilot command executed");

                UIDocument uidoc = commandData.Application.ActiveUIDocument;
                if (uidoc == null)
                {
                    return Result.Failed;
                }

                // Find and show the DockablePane
                DockablePane pane = new DockablePaneId(new Guid(Application.DockablePaneId));
                DockablePane dockablePane = uidoc.GetDockablePane(pane);

                if (dockablePane != null)
                {
                    dockablePane.Show();
                    Logger.Info("DockablePane shown");
                }
                else
                {
                    Logger.Warning("DockablePane not found");
                }

                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                Logger.Error("Open Copilot command failed", ex);
                message = ex.Message;
                return Result.Failed;
            }
        }
    }
}
