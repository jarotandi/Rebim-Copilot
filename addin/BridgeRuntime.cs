using System;
using System.Diagnostics;
using System.Threading;
using Autodesk.Revit.UI;

namespace ReBIM.Revit.Addin.Bridge
{
    /// <summary>
    /// Bridge runtime orchestrator for RCP-02
    /// Manages the single ExternalEvent, work queue, and pipe server
    /// </summary>
    public class BridgeRuntime
    {
        private readonly BridgeExternalEventHandler _handler;
        private readonly ExternalEvent _externalEvent;
        private readonly BridgeNamedPipeServer _pipeServer;
        private readonly string _pipeName;
        private readonly string _token;
        private volatile bool _isStopping;
        private readonly SemaphoreSlim _queueSemaphore;
        private bool _isDisposed;

        public bool IsStopping => _isStopping;
        public string PipeName => _pipeName;

        public BridgeRuntime()
        {
            _handler = new BridgeExternalEventHandler(this);
            _externalEvent = ExternalEvent.Create(_handler);
            _queueSemaphore = new SemaphoreSlim(BridgeProtocol.MaxQueueSize, BridgeProtocol.MaxQueueSize);

            int processId = Process.GetCurrentProcess().Id;
            _pipeName = BridgeDiscovery.GeneratePipeName(processId);
            _token = BridgeDiscovery.GenerateToken();

            _pipeServer = new BridgeNamedPipeServer(this, _pipeName, _token);
        }

        /// <summary>
        /// Start the bridge runtime
        /// </summary>
        public void Start()
        {
            _isStopping = false;

            // Publish runtime descriptor
            var descriptor = BridgeDiscovery.PublishDescriptor(
                Process.GetCurrentProcess().Id,
                _pipeName,
                _token,
                "0.1.0");

            Logger.Info($"Bridge runtime started. Pipe: {_pipeName}");

            // Start pipe server
            _pipeServer.Start();
        }

        /// <summary>
        /// Stop the bridge runtime
        /// </summary>
        public void Stop()
        {
            if (_isDisposed) return;
            _isStopping = true;

            // Stop accepting new clients
            _pipeServer.Stop();

            // Cancel all pending work items
            _handler.CancelPending();

            // Remove runtime descriptor
            BridgeDiscovery.RemoveDescriptor(_pipeName);

            // Dispose ExternalEvent and semaphore
            _externalEvent.Dispose();
            _queueSemaphore.Dispose();
            _isDisposed = true;

            Logger.Info("Bridge runtime stopped");
        }

        /// <summary>
        /// Enqueue work item for ExternalEvent processing
        /// Returns explicit result reason
        /// </summary>
        public BridgeEnqueueResult EnqueueWork(BridgeWorkItem workItem)
        {
            if (_isStopping)
            {
                return BridgeEnqueueResult.ShuttingDown;
            }

            // Try to acquire slot (non-blocking)
            if (!_queueSemaphore.Wait(0))
            {
                return BridgeEnqueueResult.QueueFull;
            }

            bool enqueued = _handler.EnqueueWork(workItem);
            if (!enqueued)
            {
                _queueSemaphore.Release();
                return BridgeEnqueueResult.ShuttingDown;
            }

            // Raise ExternalEvent and check result
            var raiseResult = _externalEvent.Raise();
            switch (raiseResult)
            {
                case ExternalEventRequest.Accepted:
                    return BridgeEnqueueResult.Accepted;

                case ExternalEventRequest.Pending:
                    // Event already pending, will process queued work
                    return BridgeEnqueueResult.Accepted;

                case ExternalEventRequest.Denied:
                case ExternalEventRequest.TimedOut:
                    // Definitive rejection - fail ALL pending work deterministically
                    // This ensures no orphan items and no permit leaks
                    _handler.CancelPending();
                    return BridgeEnqueueResult.RevitContextBusy;

                default:
                    // Unknown result - treat as rejection
                    _handler.CancelPending();
                    return BridgeEnqueueResult.RevitContextBusy;
            }
        }

        /// <summary>
        /// Release a queue slot (called when work item leaves queue)
        /// </summary>
        internal void ReleaseQueueSlot()
        {
            if (!_isDisposed)
            {
                _queueSemaphore.Release();
            }
        }

        /// <summary>
        /// Schedule next ExternalEvent if more work remains
        /// </summary>
        public void ScheduleNextEvent()
        {
            if (_isStopping) return;

            var raiseResult = _externalEvent.Raise();
            switch (raiseResult)
            {
                case ExternalEventRequest.Accepted:
                case ExternalEventRequest.Pending:
                    // Success or already pending - OK
                    break;

                case ExternalEventRequest.Denied:
                case ExternalEventRequest.TimedOut:
                    // Cannot schedule more events - fail remaining queued work
                    _handler.CancelPending();
                    break;
            }
        }
    }
}
