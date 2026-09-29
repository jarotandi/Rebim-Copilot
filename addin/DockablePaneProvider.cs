using System;
using System.Windows;
using System.Windows.Controls;
using Autodesk.Revit.UI;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// DockablePaneProvider for ReBIM Copilot sidebar
    /// Implements IDockablePaneProvider to create the sidebar UI
    /// </summary>
    public class DockablePaneProvider : IDockablePaneProvider
    {
        public void SetupDockablePane(DockablePaneProviderData data)
        {
            try
            {
                Logger.Info("Setting up DockablePane");

                // Create the sidebar UI
                var sidebar = new Sidebar();
                
                // Set as the frame content
                data.FrameworkElement = sidebar;

                // Configure dockable pane behavior
                data.InitialState = new DockablePaneState
                {
                    DockPosition = DockPosition.Tabbed,
                    TabBehind = DockablePanes.BuiltInDockablePanes.ProjectBrowser
                };

                Logger.Info("DockablePane setup complete");
            }
            catch (Exception ex)
            {
                Logger.Error("Failed to setup DockablePane", ex);
                
                // Fallback to simple UI if sidebar fails
                var fallback = new TextBlock
                {
                    Text = "ReBIM Copilot - Loading...",
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center
                };
                data.FrameworkElement = fallback;
            }
        }
    }
}
