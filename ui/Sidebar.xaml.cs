using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Shapes;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// ReBIM Copilot Sidebar UI
    /// Dockable panel with chat interface and context display
    /// </summary>
    public partial class Sidebar : UserControl
    {
        private readonly GatewayClient _gatewayClient;
        private string _currentMode = "Ask";

        public Sidebar()
        {
            InitializeComponent();
            _gatewayClient = new GatewayClient();
            _gatewayClient.OnMessageReceived += OnMessageReceived;
            _gatewayClient.OnContextUpdated += OnContextUpdated;
            
            Loaded += Sidebar_Loaded;
        }

        private async void Sidebar_Loaded(object sender, RoutedEventArgs e)
        {
            await _gatewayClient.ConnectAsync();
            await RefreshContextAsync();
        }

        private async void SendButton_Click(object sender, RoutedEventArgs e)
        {
            await SendPromptAsync();
        }

        private async void PromptTextBox_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter && Keyboard.Modifiers != ModifierKeys.Shift)
            {
                e.Handled = true;
                await SendPromptAsync();
            }
        }

        private async System.Threading.Tasks.Task SendPromptAsync()
        {
            string prompt = PromptTextBox.Text.Trim();
            if (string.IsNullOrEmpty(prompt)) return;

            // Add user message to chat
            AddChatMessage("User", prompt, Brushes.LightBlue);
            PromptTextBox.Clear();

            // Show typing indicator
            AddChatMessage("AI", "Thinking...", Brushes.LightGreen);

            try
            {
                var response = await _gatewayClient.SendPromptAsync(prompt, _currentMode);
                // Remove typing indicator and add actual response
                RemoveLastMessage();
                AddChatMessage("AI", response, Brushes.LightGreen);
            }
            catch (Exception ex)
            {
                RemoveLastMessage();
                AddChatMessage("Error", ex.Message, Brushes.LightCoral);
            }
        }

        private void AddChatMessage(string sender, string message, Brush color)
        {
            var border = new Border
            {
                Background = new SolidColorBrush(Color.FromRgb(0x3C, 0x3C, 0x3C)),
                CornerRadius = new CornerRadius(5),
                Padding = new Thickness(10),
                Margin = new Thickness(0, 0, 0, 10)
            };

            var stackPanel = new StackPanel();
            
            var senderBlock = new TextBlock
            {
                Text = sender,
                Foreground = color,
                FontWeight = FontWeights.Bold,
                FontSize = 11,
                Margin = new Thickness(0, 0, 0, 5)
            };

            var messageBlock = new TextBlock
            {
                Text = message,
                Foreground = Brushes.White,
                TextWrapping = TextWrapping.Wrap,
                FontSize = 12
            };

            stackPanel.Children.Add(senderBlock);
            stackPanel.Children.Add(messageBlock);
            border.Child = stackPanel;

            ChatHistoryPanel.Children.Add(border);
        }

        private void RemoveLastMessage()
        {
            if (ChatHistoryPanel.Children.Count > 0)
            {
                ChatHistoryPanel.Children.RemoveAt(ChatHistoryPanel.Children.Count - 1);
            }
        }

        private void ModeComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (ModeComboBox.SelectedItem is ComboBoxItem item)
            {
                _currentMode = item.Content.ToString();
            }
        }

        private void OnMessageReceived(object sender, string message)
        {
            Dispatcher.Invoke(() =>
            {
                AddChatMessage("AI", message, Brushes.LightGreen);
            });
        }

        private void OnContextUpdated(object sender, ContextInfo context)
        {
            Dispatcher.Invoke(() =>
            {
                ViewChip.Text = $"View: {context.ViewName}";
                SelectionChip.Text = $"Selection: {context.SelectionCount}";
            });
        }

        private async System.Threading.Tasks.Task RefreshContextAsync()
        {
            try
            {
                var context = await _gatewayClient.GetContextAsync();
                OnContextUpdated(this, context);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to refresh context: {ex.Message}");
            }
        }
    }

    public class ContextInfo
    {
        public string ViewName { get; set; }
        public int SelectionCount { get; set; }
    }
}
