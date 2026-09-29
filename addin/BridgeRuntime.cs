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

        public bool IsStopping => _isStopping;
        public string PipeName => _pipeName;

        public BridgeRuntime()
        {
            _handler = new BridgeExternalEventHandler(this);
            _externalEvent = ExternalEvent.Create(_handler);

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
            _isStopping = true;

            // Stop accepting new clients
            _pipeServer.Stop();

            // Remove runtime descriptor
            BridgeDiscovery.RemoveDescriptor(_pipeName);

            Logger.Info("Bridge runtime stopped");
        }

        /// <summary>
        /// Enqueue work item for ExternalEvent processing
        /// </summary>
        public bool EnqueueWork(BridgeWorkItem workItem)
        {
            if (_isStopping) return false;
            if (_handler.QueueSize >= BridgeProtocol.MaxQueueSize) return false;

            bool enqueued = _handler.EnqueueWork(workItem);
            if (enqueued)
            {
                _externalEvent.Raise();
            }
            return enqueued;
        }

        /// <summary>
        /// Schedule next ExternalEvent if more work remains
        /// </summary>
        public void ScheduleNextEvent()
        {
            if (!_isStopping)
            {
                _externalEvent.Raise();
            }
        }
    }
}
