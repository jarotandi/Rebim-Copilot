using System;
using System.Windows;
using System.Windows.Controls;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// ReBIM Copilot Sidebar UI
    /// RCP-01: Non-functional shell placeholder
    /// Live BIM context and AI integration will be implemented in later RCP stages
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
                Logger.Info("Sidebar loaded (RCP-01 shell mode)");
            }
            catch (Exception ex)
            {
                Logger.Error("Failed to load sidebar", ex);
            }
        }
    }
}
