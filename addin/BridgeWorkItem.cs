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
    /// Thread-safe state transitions using Interlocked.CompareExchange
    /// </summary>
    public class BridgeWorkItem
    {
        public string RequestId { get; }
        public string Operation { get; set; }
        public DateTime CreatedAt { get; }
        public DateTime Deadline { get; }
        public TaskCompletionSource<BridgeResponse> CompletionSource { get; }
        public bool IsCompleted => CompletionSource.Task.IsCompleted;

        private int _state; // 0 = Queued, 1 = Completed, 2 = Cancelled

        public BridgeWorkItemState State => (BridgeWorkItemState)_state;

        public BridgeWorkItem(string requestId, string operation, int timeoutMs)
        {
            RequestId = requestId;
            Operation = operation;
            CreatedAt = DateTime.UtcNow;
            Deadline = CreatedAt.AddMilliseconds(timeoutMs);
            _state = 0; // Queued
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
        /// Try to set the result - atomically transitions Queued -> Completed
        /// </summary>
        public bool TrySetResult(BridgeResponse response)
        {
            // Atomic transition: only succeed if currently Queued (0)
            if (Interlocked.CompareExchange(ref _state, 1, 0) != 0)
            {
                return false;
            }
            return CompletionSource.TrySetResult(response);
        }

        /// <summary>
        /// Try to set an exception - atomically transitions Queued -> Completed
        /// </summary>
        public bool TrySetException(Exception ex)
        {
            // Atomic transition: only succeed if currently Queued (0)
            if (Interlocked.CompareExchange(ref _state, 1, 0) != 0)
            {
                return false;
            }
            return CompletionSource.TrySetException(ex);
        }

        /// <summary>
        /// Try to cancel this work item - atomically transitions Queued -> Cancelled
        /// </summary>
        public bool TryCancel(BridgeResponse response)
        {
            // Atomic transition: only succeed if currently Queued (0)
            if (Interlocked.CompareExchange(ref _state, 2, 0) != 0)
            {
                return false;
            }
            return CompletionSource.TrySetResult(response);
        }
    }
}
