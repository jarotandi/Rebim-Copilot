using System;
using System.Threading.Tasks;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;

namespace ReBIM.Revit.Addin
{
    /// <summary>
    /// ExternalEvent handler for thread-safe Revit API access
    /// All Revit API calls must be marshalled through this handler
    /// </summary>
    public class ExternalEventHandler : IExternalEventHandler
    {
        private TaskCompletionSource<object> _tcs;
        private Func<UIApplication, object> _action;

        public static ExternalEvent Handler { get; private set; }

        public static void Initialize()
        {
            Handler = ExternalEvent.Create(new ExternalEventHandler());
        }

        public void Execute(UIApplication app)
        {
            try
            {
                RevitContext.UIApplication = app;
                var result = _action?.Invoke(app);
                _tcs?.TrySetResult(result);
            }
            catch (Exception ex)
            {
                _tcs?.TrySetException(ex);
            }
        }

        public string GetName()
        {
            return "ReBIM Copilot External Event";
        }

        /// <summary>
        /// Execute an action in the Revit API context
        /// </summary>
        public static async Task<T> ExecuteAsync<T>(Func<UIApplication, object> action)
        {
            if (Handler == null)
            {
                throw new InvalidOperationException("ExternalEvent handler not initialized");
            }

            var handler = new ExternalEventHandler
            {
                _action = action,
                _tcs = new TaskCompletionSource<object>()
            };

            Handler.Raise();

            var result = await handler._tcs.Task;
            return (T)result;
        }
    }
}
