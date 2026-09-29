using System;
using System.Collections.Generic;
using System.Linq;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// Command handler registry for Revit API operations
    /// All Revit API calls must be marshalled through ExternalEvent
    /// </summary>
    public static class CommandHandler
    {
        private static readonly Dictionary<string, Func<UIApplication, object, object>> Handlers = 
            new Dictionary<string, Func<UIApplication, object, object>>
        {
            { "get_selection", GetSelection },
            { "get_active_view", GetActiveView },
            { "get_project_info", GetProjectInfo },
            { "get_element", GetElement },
            { "get_element_properties", GetElementProperties },
            { "find_elements", FindElements },
            { "set_parameter", SetParameter },
            { "ping", Ping }
        };

        public static object Execute(string command, object parameters)
        {
            if (!Handlers.ContainsKey(command))
            {
                throw new ArgumentException($"Unknown command: {command}");
            }

            // Get the active UIApplication
            UIApplication uiApp = GetUIApplication();
            if (uiApp == null)
            {
                throw new InvalidOperationException("Revit UI application not available");
            }

            return Handlers[command](uiApp, parameters);
        }

        private static UIApplication GetUIApplication()
        {
            // In real implementation, this would be stored from ExternalEvent
            // For POC, we use a static reference set during command execution
            return RevitContext.UIApplication;
        }

        private static object Ping(UIApplication uiApp, object parameters)
        {
            return new { status = "ok", timestamp = DateTime.UtcNow };
        }

        private static object GetSelection(UIApplication uiApp, object parameters)
        {
            UIDocument uidoc = uiApp.ActiveUIDocument;
            if (uidoc == null) return new { elements = new List<object>() };

            var selection = uidoc.Selection;
            var elementIds = selection.GetElementIds();

            var elements = new List<object>();
            foreach (ElementId id in elementIds)
            {
                Element elem = uidoc.Document.GetElement(id);
                if (elem == null) continue;

                elements.Add(new
                {
                    id = id.IntegerValue.ToString(),
                    category = elem.Category?.Name ?? "Unknown",
                    family = elem is FamilyInstance fi ? fi.Symbol.FamilyName : null,
                    type = elem.Name,
                    level = elem.LevelId.IntegerValue > 0 
                        ? uidoc.Document.GetElement(elem.LevelId)?.Name 
                        : null
                });
            }

            return new { elements };
        }

        private static object GetActiveView(UIApplication uiApp, object parameters)
        {
            UIDocument uidoc = uiApp.ActiveUIDocument;
            if (uidoc == null) return null;

            View view = uidoc.ActiveView;
            if (view == null) return null;

            return new
            {
                id = view.Id.IntegerValue.ToString(),
                name = view.Name,
                type = view.ViewType.ToString()
            };
        }

        private static object GetProjectInfo(UIApplication uiApp, object parameters)
        {
            UIDocument uidoc = uiApp.ActiveUIDocument;
            if (uidoc == null) return null;

            Document doc = uidoc.Document;
            ProjectInfo info = doc.ProjectInformation;

            return new
            {
                title = doc.Title,
                version = doc.Application.VersionName,
                projectName = info?.Name,
                projectNumber = info?.ProjectNumber,
                projectAddress = info?.ProjectAddress
            };
        }

        private static object GetElement(UIApplication uiApp, object parameters)
        {
            // Implementation for getting element by ID
            return new { };
        }

        private static object GetElementProperties(UIApplication uiApp, object parameters)
        {
            // Implementation for getting element properties
            return new { };
        }

        private static object FindElements(UIApplication uiApp, object parameters)
        {
            // Implementation for finding elements with filters
            return new { elements = new List<object>() };
        }

        private static object SetParameter(UIApplication uiApp, object parameters)
        {
            // Implementation for setting parameter with transaction
            // This would use ExternalEvent for thread safety
            return new { };
        }
    }

    /// <summary>
    /// Holds reference to UIApplication for command execution
    /// Set during ExternalEvent handling
    /// </summary>
    public static class RevitContext
    {
        public static UIApplication UIApplication { get; set; }
    }
}
