using System;
using Autodesk.Revit.UI;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// Command to open ReBIM Copilot sidebar
    /// </summary>
    public class OpenCopilotCommand : IExternalCommand
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

                    // Show sidebar panel
                    // In real implementation, this would show the dockable pane
                    TaskDialog.Show("ReBIM Copilot", "Sidebar opened!");
                    
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
