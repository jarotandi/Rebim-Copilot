using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// HTTP client for communicating with ReBIM Copilot Gateway
    /// </summary>
    public class GatewayClient
    {
        private readonly HttpClient _httpClient;
        private string _baseUrl = "http://localhost:3000";

        public event EventHandler<string> OnMessageReceived;
        public event EventHandler<ContextInfo> OnContextUpdated;

        public GatewayClient()
        {
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromMinutes(5);
        }

        public async Task ConnectAsync()
        {
            // Check if gateway is running
            var response = await _httpClient.GetAsync($"{_baseUrl}/health");
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception("Gateway not available");
            }
        }

        public async Task<string> SendPromptAsync(string prompt, string mode)
        {
            var request = new
            {
                prompt,
                mode,
                context = new { }
            };

            var json = JsonConvert.SerializeObject(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/chat", content);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadAsStringAsync();
            var chatResponse = JsonConvert.DeserializeObject<ChatResponse>(result);

            return chatResponse?.Response ?? "No response";
        }

        public async Task<ContextInfo> GetContextAsync()
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/context");
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ContextInfo>(result);
        }

        public class ChatResponse
        {
            [JsonProperty("response")]
            public string Response { get; set; }

            [JsonProperty("toolCalls")]
            public object[] ToolCalls { get; set; }
        }
    }
}
