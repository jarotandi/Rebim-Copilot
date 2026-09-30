using System;
using System.Threading;
using System.Threading.Tasks;

namespace ReBIM.Revit.Addin.Bridge
{
    public enum BridgeWorkItemState
    {
        Queued,
        Completed,
        Cancelled
    }

    /// <summary>
    /// Work item for the bounded bridge queue
    /// Uses RunContinuationsAsynchronously to avoid running pipe continuations on Revit UI thread
    /// </summary>
    public class BridgeWorkItem
    {
        public string RequestId { get; }
        public string Operation { get; }
        public DateTime CreatedAt { get; }
        public DateTime Deadline { get; }
        public TaskCompletionSource<BridgeResponse> CompletionSource { get; }
        public bool IsCompleted => CompletionSource.Task.IsCompleted;

        private BridgeWorkItemState _state;

        public BridgeWorkItemState State => _state;

        public BridgeWorkItem(string requestId, string operation, int timeoutMs)
        {
            RequestId = requestId;
            Operation = operation;
            CreatedAt = DateTime.UtcNow;
            Deadline = CreatedAt.AddMilliseconds(timeoutMs);
            _state = BridgeWorkItemState.Queued;
            CompletionSource = new TaskCompletionSource<BridgeResponse>(TaskCreationOptions.RunContinuationsAsynchronously);
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
            if (_state != BridgeWorkItemState.Queued) return false;
            _state = BridgeWorkItemState.Completed;
            return CompletionSource.TrySetResult(response);
        }

        /// <summary>
        /// Try to set an exception
        /// </summary>
        public bool TrySetException(Exception ex)
        {
            if (_state != BridgeWorkItemState.Queued) return false;
            _state = BridgeWorkItemState.Completed;
            return CompletionSource.TrySetException(ex);
        }

        /// <summary>
        /// Try to cancel this work item
        /// </summary>
        public bool TryCancel(BridgeResponse response)
        {
            if (_state != BridgeWorkItemState.Queued) return false;
            _state = BridgeWorkItemState.Cancelled;
            return CompletionSource.TrySetResult(response);
        }
    }
}
