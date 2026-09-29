using System;
using System.Windows.Media.Imaging;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// Helper class for loading embedded ribbon icons
    /// </summary>
    public static class RibbonImageLoader
    {
        /// <summary>
        /// Load an embedded resource image by name
        /// </summary>
        /// <param name="resourceName">Resource name (e.g., "Copilot32.png")</param>
        /// <returns>ImageSource or null if loading fails</returns>
        public static BitmapImage Load(string resourceName)
        {
            try
            {
                string uriString = $"pack://application:,,,/ReBIM.Revit.Addin;component/Resources/{resourceName}";
                var uri = new Uri(uriString, UriKind.Absolute);
                var bitmap = new BitmapImage(uri);
                return bitmap;
            }
            catch (Exception ex)
            {
                Logger.Warning($"Failed to load ribbon image '{resourceName}': {ex.Message}");
                return null;
            }
        }
    }
}
