using System;
using System.Windows;
using System.Windows.Controls;
using Autodesk.Revit.UI;
using Autodesk.Revit.DB;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// ReBIM Copilot Sidebar UI
    /// Dockable panel with status display and chat interface
    /// RCP-01: Non-functional placeholders
    /// </summary>
    public partial class Sidebar : UserControl
    {
        public Sidebar()
        {
            InitializeComponent();
            Loaded += Sidebar_Loaded;
        }

        private void Sidebar_Loaded(object sender, RoutedEventArgs e)
        {
            try
            {
                Logger.Info("Sidebar loaded");
                UpdateContextDisplay();
            }
            catch (Exception ex)
            {
                Logger.Error("Failed to load sidebar", ex);
            }
        }

        private void UpdateContextDisplay()
        {
            try
            {
                // Get the active UIDocument
                UIDocument uidoc = GetActiveUIDocument();
                if (uidoc == null)
                {
                    ViewText.Text = "No active document";
                    SelectionText.Text = "No selection";
                    return;
                }

                // Update view info
                View activeView = uidoc.ActiveView;
                ViewText.Text = activeView?.Name ?? "No active view";

                // Update selection info
                var elementIds = uidoc.Selection.GetElementIds();
                SelectionText.Text = $"{elementIds.Count} element(s) selected";
            }
            catch (Exception ex)
            {
                Logger.Error("Failed to update context display", ex);
            }
        }

        private UIDocument GetActiveUIDocument()
        {
            try
            {
                // Get the Revit application from the dockable pane
                // This is a simplified approach for RCP-01
                return null; // Will be properly implemented in later RCP stages
            }
            catch
            {
                return null;
            }
        }

        private void SendButton_Click(object sender, RoutedEventArgs e)
        {
            // RCP-01: Non-functional placeholder
            // AI integration will be implemented in RCP-06+
            MessageBox.Show("AI integration will be available in RCP-06+", 
                          "ReBIM Copilot", 
                          MessageBoxButton.OK, 
                          MessageBoxImage.Information);
        }
    }
}
