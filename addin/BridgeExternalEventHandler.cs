using System;
using System.Collections.Concurrent;
using System.Threading;
using Autodesk.Revit.UI;

namespace ReBIM.Revit.Addin.Bridge
{
    /// <summary>
    /// ONE authoritative ExternalEvent handler for RCP-02 bridge
    /// All Revit API access is marshalled through this handler
    /// </summary>
    public class BridgeExternalEventHandler : IExternalEventHandler
    {
        private readonly BridgeRuntime _runtime;
        private readonly ConcurrentQueue<BridgeWorkItem> _workQueue;

        public BridgeExternalEventHandler(BridgeRuntime runtime)
        {
            _runtime = runtime;
            _workQueue = new ConcurrentQueue<BridgeWorkItem>();
        }

        /// <summary>
        /// Enqueue a work item for ExternalEvent processing
        /// </summary>
        public bool EnqueueWork(BridgeWorkItem workItem)
        {
            if (_runtime.IsStopping) return false;

            _workQueue.Enqueue(workItem);
            return true;
        }

        /// <summary>
        /// Get current queue size
        /// </summary>
        public int QueueSize => _workQueue.Count;

        /// <summary>
        /// Cancel all pending work items and release queue slots
        /// </summary>
        public void CancelPending()
        {
            while (_workQueue.TryDequeue(out var workItem))
            {
                workItem.TryCancel(new BridgeResponse
                {
                    BridgeVersion = BridgeProtocol.Version,
                    RequestId = workItem.RequestId,
                    Ok = false,
                    Error = new BridgeError
                    {
                        Code = BridgeProtocol.BridgeShuttingDown,
                        Message = "Bridge is shutting down"
                    }
                });
                _runtime.ReleaseQueueSlot();
            }
        }

        /// <summary>
        /// Execute is called by Revit when ExternalEvent.Raise() is invoked
        /// This runs on the Revit UI thread with valid API context
        /// </summary>
        public void Execute(UIApplication app)
        {
            try
            {
                // Drain queue in bounded batch
                int processed = 0;
                while (processed < BridgeProtocol.MaxBatchSize && _workQueue.TryDequeue(out var workItem))
                {
                    processed++;

                    try
                    {
                        // Skip already cancelled/completed items
                        if (workItem.State != BridgeWorkItemState.Queued)
                        {
                            continue;
                        }

                        // Check if expired
                        if (workItem.IsExpired())
                        {
                            workItem.TrySetResult(new BridgeResponse
                            {
                                BridgeVersion = BridgeProtocol.Version,
                                RequestId = workItem.RequestId,
                                Ok = false,
                                Error = new BridgeError
                                {
                                    Code = BridgeProtocol.RequestTimeout,
                                    Message = "Request timed out in queue"
                                }
                            });
                            continue;
                        }

                        // Process the work item
                        var response = ProcessWorkItem(app, workItem);
                        workItem.TrySetResult(response);
                    }
                    finally
                    {
                        // Always release queue slot exactly once
                        _runtime.ReleaseQueueSlot();
                    }
                }

                // Signal if more work remains
                if (!_workQueue.IsEmpty)
                {
                    _runtime.ScheduleNextEvent();
                }
            }
            catch (Exception ex)
            {
                Logger.Error("ExternalEvent execution failed", ex);
            }
        }

        /// <summary>
        /// Process a single work item in valid Revit API context
        /// </summary>
        private BridgeResponse ProcessWorkItem(UIApplication app, BridgeWorkItem workItem)
        {
            try
            {
                switch (workItem.Operation)
                {
                    case BridgeOperations.ContextProbe:
                        return ProcessContextProbe(app, workItem);
                    default:
                        return new BridgeResponse
                        {
                            BridgeVersion = BridgeProtocol.Version,
                            RequestId = workItem.RequestId,
                            Ok = false,
                            Error = new BridgeError
                            {
                                Code = BridgeProtocol.UnsupportedOperation,
                                Message = $"Operation '{workItem.Operation}' is not supported"
                            }
                        };
                }
            }
            catch (Exception ex)
            {
                return new BridgeResponse
                {
                    BridgeVersion = BridgeProtocol.Version,
                    RequestId = workItem.RequestId,
                    Ok = false,
                    Error = new BridgeError
                    {
                        Code = BridgeProtocol.InternalError,
                        Message = "Internal error"
                    }
                };
            }
        }

        /// <summary>
        /// Process context probe - returns bounded host diagnostics only
        /// </summary>
        private BridgeResponse ProcessContextProbe(UIApplication app, BridgeWorkItem workItem)
        {
            var result = new ContextProbeResult
            {
                RevitVersion = app.Application.VersionName,
                RevitBuild = app.Application.VersionBuild,
                HasActiveDocument = app.ActiveUIDocument != null,
                ExecutedOnExternalEvent = true
            };

            return new BridgeResponse
            {
                BridgeVersion = BridgeProtocol.Version,
                RequestId = workItem.RequestId,
                Ok = true,
                Result = result
            };
        }

        public string GetName() => "ReBIM Copilot RCP-02 Bridge ExternalEvent";
    }
}
