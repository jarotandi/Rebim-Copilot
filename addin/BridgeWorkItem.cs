using System;
using System.Threading;
using System.Threading.Tasks;

namespace ReBIM.Revit.Addin.Bridge
{
    /// <summary>
    /// Work item for the bounded bridge queue
    /// </summary>
    public class BridgeWorkItem
    {
        public string RequestId { get; }
        public string Operation { get; }
        public DateTime CreatedAt { get; }
        public DateTime Deadline { get; }
        public TaskCompletionSource<BridgeResponse> CompletionSource { get; }
        public bool IsCompleted => CompletionSource.Task.IsCompleted;

        public BridgeWorkItem(string requestId, string operation, int timeoutMs)
        {
            RequestId = requestId;
            Operation = operation;
            CreatedAt = DateTime.UtcNow;
            Deadline = CreatedAt.AddMilliseconds(timeoutMs);
            CompletionSource = new TaskCompletionSource<BridgeResponse>();
        }

        /// <summary>
        /// Check if this work item has expired
        /// </summary>
        public bool IsExpired()
        {
            return DateTime.UtcNow > Deadline;
        }

        /// <summary>
        /// Try to set the result
        /// </summary>
        public bool TrySetResult(BridgeResponse response)
        {
            return CompletionSource.TrySetResult(response);
        }

        /// <summary>
        /// Try to set an exception
        /// </summary>
        public bool TrySetException(Exception ex)
        {
            return CompletionSource.TrySetException(ex);
        }
    }
}
