/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @noflow
 * @providesModule ReactNativeFiber-prod
 */
"use strict";

var invariant = require("fbjs/lib/invariant"), ExceptionsManager = require("ExceptionsManager"), emptyObject = require("fbjs/lib/emptyObject"), react = require("react"), shallowEqual = require("fbjs/lib/shallowEqual"), deepDiffer = require("deepDiffer"), flattenStyle = require("flattenStyle"), TextInputState = require("TextInputState"), UIManager = require("UIManager");

require("deepFreezeAndThrowOnMutationInDev");

var warning = require("fbjs/lib/warning");

require("InitializeCore");

var RCTEventEmitter = require("RCTEventEmitter"), emptyFunction = require("fbjs/lib/emptyFunction"), defaultShowDialog = function(capturedError) {
    return !0;
}, showDialog = defaultShowDialog;

function logCapturedError(capturedError) {
    if (!1 !== showDialog(capturedError)) {
        var error = capturedError.error;
        console.error(error);
    }
}

var injection = {
    injectDialog: function(fn) {
        invariant(showDialog === defaultShowDialog, "The custom dialog was already injected."), 
        invariant("function" == typeof fn, "Injected showDialog() must be a function."), 
        showDialog = fn;
    }
}, logCapturedError_1 = logCapturedError, ReactFiberErrorLogger = {
    injection: injection,
    logCapturedError: logCapturedError_1
}, ReactErrorUtils = {
    _caughtError: null,
    _hasCaughtError: !1,
    _rethrowError: null,
    _hasRethrowError: !1,
    injection: {
        injectErrorUtils: function(injectedErrorUtils) {
            invariant("function" == typeof injectedErrorUtils.invokeGuardedCallback, "Injected invokeGuardedCallback() must be a function."), 
            invokeGuardedCallback = injectedErrorUtils.invokeGuardedCallback;
        }
    },
    invokeGuardedCallback: function(name, func, context, a, b, c, d, e, f) {
        invokeGuardedCallback.apply(ReactErrorUtils, arguments);
    },
    invokeGuardedCallbackAndCatchFirstError: function(name, func, context, a, b, c, d, e, f) {
        if (ReactErrorUtils.invokeGuardedCallback.apply(this, arguments), ReactErrorUtils.hasCaughtError()) {
            var error = ReactErrorUtils.clearCaughtError();
            ReactErrorUtils._hasRethrowError || (ReactErrorUtils._hasRethrowError = !0, ReactErrorUtils._rethrowError = error);
        }
    },
    rethrowCaughtError: function() {
        return rethrowCaughtError.apply(ReactErrorUtils, arguments);
    },
    hasCaughtError: function() {
        return ReactErrorUtils._hasCaughtError;
    },
    clearCaughtError: function() {
        if (ReactErrorUtils._hasCaughtError) {
            var error = ReactErrorUtils._caughtError;
            return ReactErrorUtils._caughtError = null, ReactErrorUtils._hasCaughtError = !1, 
            error;
        }
        invariant(!1, "clearCaughtError was called but no error was captured. This error " + "is likely caused by a bug in React. Please file an issue.");
    }
}, invokeGuardedCallback = function(name, func, context, a, b, c, d, e, f) {
    ReactErrorUtils._hasCaughtError = !1, ReactErrorUtils._caughtError = null;
    var funcArgs = Array.prototype.slice.call(arguments, 3);
    try {
        func.apply(context, funcArgs);
    } catch (error) {
        ReactErrorUtils._caughtError = error, ReactErrorUtils._hasCaughtError = !0;
    }
}, rethrowCaughtError = function() {
    if (ReactErrorUtils._hasRethrowError) {
        var error = ReactErrorUtils._rethrowError;
        throw ReactErrorUtils._rethrowError = null, ReactErrorUtils._hasRethrowError = !1, 
        error;
    }
}, ReactErrorUtils_1 = ReactErrorUtils, ComponentTree, injection$1 = {
    injectComponentTree: function(Injected) {
        ComponentTree = Injected;
    }
};

function isEndish(topLevelType) {
    return "topMouseUp" === topLevelType || "topTouchEnd" === topLevelType || "topTouchCancel" === topLevelType;
}

function isMoveish(topLevelType) {
    return "topMouseMove" === topLevelType || "topTouchMove" === topLevelType;
}

function isStartish(topLevelType) {
    return "topMouseDown" === topLevelType || "topTouchStart" === topLevelType;
}

function executeDispatch(event, simulated, listener, inst) {
    var type = event.type || "unknown-event";
    event.currentTarget = EventPluginUtils.getNodeFromInstance(inst), ReactErrorUtils_1.invokeGuardedCallbackAndCatchFirstError(type, listener, void 0, event), 
    event.currentTarget = null;
}

function executeDispatchesInOrder(event, simulated) {
    var dispatchListeners = event._dispatchListeners, dispatchInstances = event._dispatchInstances;
    if (Array.isArray(dispatchListeners)) for (var i = 0; i < dispatchListeners.length && !event.isPropagationStopped(); i++) executeDispatch(event, simulated, dispatchListeners[i], dispatchInstances[i]); else dispatchListeners && executeDispatch(event, simulated, dispatchListeners, dispatchInstances);
    event._dispatchListeners = null, event._dispatchInstances = null;
}

function executeDispatchesInOrderStopAtTrueImpl(event) {
    var dispatchListeners = event._dispatchListeners, dispatchInstances = event._dispatchInstances;
    if (Array.isArray(dispatchListeners)) {
        for (var i = 0; i < dispatchListeners.length && !event.isPropagationStopped(); i++) if (dispatchListeners[i](event, dispatchInstances[i])) return dispatchInstances[i];
    } else if (dispatchListeners && dispatchListeners(event, dispatchInstances)) return dispatchInstances;
    return null;
}

function executeDispatchesInOrderStopAtTrue(event) {
    var ret = executeDispatchesInOrderStopAtTrueImpl(event);
    return event._dispatchInstances = null, event._dispatchListeners = null, ret;
}

function executeDirectDispatch(event) {
    var dispatchListener = event._dispatchListeners, dispatchInstance = event._dispatchInstances;
    invariant(!Array.isArray(dispatchListener), "executeDirectDispatch(...): Invalid `event`."), 
    event.currentTarget = dispatchListener ? EventPluginUtils.getNodeFromInstance(dispatchInstance) : null;
    var res = dispatchListener ? dispatchListener(event) : null;
    return event.currentTarget = null, event._dispatchListeners = null, event._dispatchInstances = null, 
    res;
}

function hasDispatches(event) {
    return !!event._dispatchListeners;
}

var EventPluginUtils = {
    isEndish: isEndish,
    isMoveish: isMoveish,
    isStartish: isStartish,
    executeDirectDispatch: executeDirectDispatch,
    executeDispatchesInOrder: executeDispatchesInOrder,
    executeDispatchesInOrderStopAtTrue: executeDispatchesInOrderStopAtTrue,
    hasDispatches: hasDispatches,
    getFiberCurrentPropsFromNode: function(node) {
        return ComponentTree.getFiberCurrentPropsFromNode(node);
    },
    getInstanceFromNode: function(node) {
        return ComponentTree.getInstanceFromNode(node);
    },
    getNodeFromInstance: function(node) {
        return ComponentTree.getNodeFromInstance(node);
    },
    injection: injection$1
}, EventPluginUtils_1 = EventPluginUtils, fiberHostComponent = null, ReactControlledComponentInjection = {
    injectFiberControlledHostComponent: function(hostComponentImpl) {
        fiberHostComponent = hostComponentImpl;
    }
}, restoreTarget = null, restoreQueue = null;

function restoreStateOfTarget(target) {
    var internalInstance = EventPluginUtils_1.getInstanceFromNode(target);
    if (internalInstance) {
        if ("number" == typeof internalInstance.tag) {
            invariant(fiberHostComponent && "function" == typeof fiberHostComponent.restoreControlledState, "Fiber needs to be injected to handle a fiber target for controlled " + "events. This error is likely caused by a bug in React. Please file an issue.");
            var props = EventPluginUtils_1.getFiberCurrentPropsFromNode(internalInstance.stateNode);
            return void fiberHostComponent.restoreControlledState(internalInstance.stateNode, internalInstance.type, props);
        }
        invariant("function" == typeof internalInstance.restoreControlledState, "The internal instance must be a React host component. " + "This error is likely caused by a bug in React. Please file an issue."), 
        internalInstance.restoreControlledState();
    }
}

var ReactControlledComponent = {
    injection: ReactControlledComponentInjection,
    enqueueStateRestore: function(target) {
        restoreTarget ? restoreQueue ? restoreQueue.push(target) : restoreQueue = [ target ] : restoreTarget = target;
    },
    restoreStateIfNeeded: function() {
        if (restoreTarget) {
            var target = restoreTarget, queuedTargets = restoreQueue;
            if (restoreTarget = null, restoreQueue = null, restoreStateOfTarget(target), queuedTargets) for (var i = 0; i < queuedTargets.length; i++) restoreStateOfTarget(queuedTargets[i]);
        }
    }
}, ReactControlledComponent_1 = ReactControlledComponent, stackBatchedUpdates = function(fn, a, b, c, d, e) {
    return fn(a, b, c, d, e);
}, fiberBatchedUpdates = function(fn, bookkeeping) {
    return fn(bookkeeping);
};

function performFiberBatchedUpdates(fn, bookkeeping) {
    return fiberBatchedUpdates(fn, bookkeeping);
}

function batchedUpdates(fn, bookkeeping) {
    return stackBatchedUpdates(performFiberBatchedUpdates, fn, bookkeeping);
}

var isNestingBatched = !1;

function batchedUpdatesWithControlledComponents(fn, bookkeeping) {
    if (isNestingBatched) return batchedUpdates(fn, bookkeeping);
    isNestingBatched = !0;
    try {
        return batchedUpdates(fn, bookkeeping);
    } finally {
        isNestingBatched = !1, ReactControlledComponent_1.restoreStateIfNeeded();
    }
}

var ReactGenericBatchingInjection = {
    injectStackBatchedUpdates: function(_batchedUpdates) {
        stackBatchedUpdates = _batchedUpdates;
    },
    injectFiberBatchedUpdates: function(_batchedUpdates) {
        fiberBatchedUpdates = _batchedUpdates;
    }
}, ReactGenericBatching = {
    batchedUpdates: batchedUpdatesWithControlledComponents,
    injection: ReactGenericBatchingInjection
}, ReactGenericBatching_1 = ReactGenericBatching;

function ReactNativeFiberErrorDialog(capturedError) {
    var componentStack = capturedError.componentStack, error = capturedError.error, errorToHandle = void 0;
    if (error instanceof Error) {
        var message = error.message, name = error.name, summary = message ? name + ": " + message : name;
        errorToHandle = error;
        try {
            errorToHandle.message = summary + "\n\nThis error is located at:" + componentStack;
        } catch (e) {}
    } else errorToHandle = "string" == typeof error ? new Error(error + "\n\nThis error is located at:" + componentStack) : new Error("Unspecified error at:" + componentStack);
    return ExceptionsManager.handleException(errorToHandle, !1), !1;
}

var showDialog$1 = ReactNativeFiberErrorDialog, ReactNativeFiberErrorDialog_1 = {
    showDialog: showDialog$1
}, REACT_PORTAL_TYPE = "function" == typeof Symbol && Symbol.for && Symbol.for("react.portal") || 60106, createPortal = function(children, containerInfo, implementation) {
    var key = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : null;
    return {
        $$typeof: REACT_PORTAL_TYPE,
        key: null == key ? null : "" + key,
        children: children,
        containerInfo: containerInfo,
        implementation: implementation
    };
}, isPortal = function(object) {
    return "object" == typeof object && null !== object && object.$$typeof === REACT_PORTAL_TYPE;
}, REACT_PORTAL_TYPE_1 = REACT_PORTAL_TYPE, ReactPortal = {
    createPortal: createPortal,
    isPortal: isPortal,
    REACT_PORTAL_TYPE: REACT_PORTAL_TYPE_1
}, instanceCache = {}, instanceProps = {};

function getRenderedHostOrTextFromComponent(component) {
    for (var rendered; rendered = component._renderedComponent; ) component = rendered;
    return component;
}

function precacheNode(inst, tag) {
    var nativeInst = getRenderedHostOrTextFromComponent(inst);
    instanceCache[tag] = nativeInst;
}

function precacheFiberNode(hostInst, tag) {
    instanceCache[tag] = hostInst;
}

function uncacheNode(inst) {
    var tag = inst._rootNodeID;
    tag && delete instanceCache[tag];
}

function uncacheFiberNode(tag) {
    delete instanceCache[tag], delete instanceProps[tag];
}

function getInstanceFromTag(tag) {
    return instanceCache[tag] || null;
}

function getTagFromInstance(inst) {
    var tag = "number" != typeof inst.tag ? inst._rootNodeID : inst.stateNode._nativeTag;
    return invariant(tag, "All native instances should have a tag."), tag;
}

function getFiberCurrentPropsFromNode(stateNode) {
    return instanceProps[stateNode._nativeTag] || null;
}

function updateFiberProps(tag, props) {
    instanceProps[tag] = props;
}

var ReactNativeComponentTree = {
    getClosestInstanceFromNode: getInstanceFromTag,
    getInstanceFromNode: getInstanceFromTag,
    getNodeFromInstance: getTagFromInstance,
    precacheFiberNode: precacheFiberNode,
    precacheNode: precacheNode,
    uncacheFiberNode: uncacheFiberNode,
    uncacheNode: uncacheNode,
    getFiberCurrentPropsFromNode: getFiberCurrentPropsFromNode,
    updateFiberProps: updateFiberProps
}, ReactNativeComponentTree_1 = ReactNativeComponentTree, commonjsGlobal = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {}, ReactFeatureFlags = {
    disableNewFiberFeatures: !1,
    enableAsyncSubtreeAPI: !1
}, ReactFeatureFlags_1 = ReactFeatureFlags, ReactTypeOfSideEffect = {
    NoEffect: 0,
    PerformedWork: 1,
    Placement: 2,
    Update: 4,
    PlacementAndUpdate: 6,
    Deletion: 8,
    ContentReset: 16,
    Callback: 32,
    Err: 64,
    Ref: 128
}, ReactPriorityLevel = {
    NoWork: 0,
    SynchronousPriority: 1,
    TaskPriority: 2,
    HighPriority: 3,
    LowPriority: 4,
    OffscreenPriority: 5
}, ReactTypeOfWork = {
    IndeterminateComponent: 0,
    FunctionalComponent: 1,
    ClassComponent: 2,
    HostRoot: 3,
    HostPortal: 4,
    HostComponent: 5,
    HostText: 6,
    CoroutineComponent: 7,
    CoroutineHandlerPhase: 8,
    YieldComponent: 9,
    Fragment: 10
}, CallbackEffect = ReactTypeOfSideEffect.Callback, NoWork = ReactPriorityLevel.NoWork, SynchronousPriority = ReactPriorityLevel.SynchronousPriority, TaskPriority = ReactPriorityLevel.TaskPriority, ClassComponent = ReactTypeOfWork.ClassComponent, HostRoot = ReactTypeOfWork.HostRoot;

function comparePriority(a, b) {
    return a !== TaskPriority && a !== SynchronousPriority || b !== TaskPriority && b !== SynchronousPriority ? a === NoWork && b !== NoWork ? -255 : a !== NoWork && b === NoWork ? 255 : a - b : 0;
}

function createUpdateQueue() {
    return {
        first: null,
        last: null,
        hasForceUpdate: !1,
        callbackList: null
    };
}

function cloneUpdate(update) {
    return {
        priorityLevel: update.priorityLevel,
        partialState: update.partialState,
        callback: update.callback,
        isReplace: update.isReplace,
        isForced: update.isForced,
        isTopLevelUnmount: update.isTopLevelUnmount,
        next: null
    };
}

function insertUpdateIntoQueue(queue, update, insertAfter, insertBefore) {
    null !== insertAfter ? insertAfter.next = update : (update.next = queue.first, queue.first = update), 
    null !== insertBefore ? update.next = insertBefore : queue.last = update;
}

function findInsertionPosition(queue, update) {
    var priorityLevel = update.priorityLevel, insertAfter = null, insertBefore = null;
    if (null !== queue.last && comparePriority(queue.last.priorityLevel, priorityLevel) <= 0) insertAfter = queue.last; else for (insertBefore = queue.first; null !== insertBefore && comparePriority(insertBefore.priorityLevel, priorityLevel) <= 0; ) insertAfter = insertBefore, 
    insertBefore = insertBefore.next;
    return insertAfter;
}

function ensureUpdateQueues(fiber) {
    var alternateFiber = fiber.alternate, queue1 = fiber.updateQueue;
    null === queue1 && (queue1 = fiber.updateQueue = createUpdateQueue());
    var queue2 = void 0;
    return null !== alternateFiber ? null === (queue2 = alternateFiber.updateQueue) && (queue2 = alternateFiber.updateQueue = createUpdateQueue()) : queue2 = null, 
    [ queue1, queue2 !== queue1 ? queue2 : null ];
}

function insertUpdate(fiber, update) {
    var _ensureUpdateQueues = ensureUpdateQueues(fiber), queue1 = _ensureUpdateQueues[0], queue2 = _ensureUpdateQueues[1], insertAfter1 = findInsertionPosition(queue1, update), insertBefore1 = null !== insertAfter1 ? insertAfter1.next : queue1.first;
    if (null === queue2) return insertUpdateIntoQueue(queue1, update, insertAfter1, insertBefore1), 
    null;
    var insertAfter2 = findInsertionPosition(queue2, update), insertBefore2 = null !== insertAfter2 ? insertAfter2.next : queue2.first;
    if (insertUpdateIntoQueue(queue1, update, insertAfter1, insertBefore1), insertBefore1 === insertBefore2 && null !== insertBefore1 || insertAfter1 === insertAfter2 && null !== insertAfter1) return null === insertAfter2 && (queue2.first = update), 
    null === insertBefore2 && (queue2.last = null), null;
    var update2 = cloneUpdate(update);
    return insertUpdateIntoQueue(queue2, update2, insertAfter2, insertBefore2), update2;
}

function addUpdate(fiber, partialState, callback, priorityLevel) {
    insertUpdate(fiber, {
        priorityLevel: priorityLevel,
        partialState: partialState,
        callback: callback,
        isReplace: !1,
        isForced: !1,
        isTopLevelUnmount: !1,
        next: null
    });
}

var addUpdate_1 = addUpdate;

function addReplaceUpdate(fiber, state, callback, priorityLevel) {
    insertUpdate(fiber, {
        priorityLevel: priorityLevel,
        partialState: state,
        callback: callback,
        isReplace: !0,
        isForced: !1,
        isTopLevelUnmount: !1,
        next: null
    });
}

var addReplaceUpdate_1 = addReplaceUpdate;

function addForceUpdate(fiber, callback, priorityLevel) {
    insertUpdate(fiber, {
        priorityLevel: priorityLevel,
        partialState: null,
        callback: callback,
        isReplace: !1,
        isForced: !0,
        isTopLevelUnmount: !1,
        next: null
    });
}

var addForceUpdate_1 = addForceUpdate;

function getUpdatePriority(fiber) {
    var updateQueue = fiber.updateQueue;
    return null === updateQueue ? NoWork : fiber.tag !== ClassComponent && fiber.tag !== HostRoot ? NoWork : null !== updateQueue.first ? updateQueue.first.priorityLevel : NoWork;
}

var getUpdatePriority_1 = getUpdatePriority;

function addTopLevelUpdate$1(fiber, partialState, callback, priorityLevel) {
    var isTopLevelUnmount = null === partialState.element, update = {
        priorityLevel: priorityLevel,
        partialState: partialState,
        callback: callback,
        isReplace: !1,
        isForced: !1,
        isTopLevelUnmount: isTopLevelUnmount,
        next: null
    }, update2 = insertUpdate(fiber, update);
    if (isTopLevelUnmount) {
        var _ensureUpdateQueues2 = ensureUpdateQueues(fiber), queue1 = _ensureUpdateQueues2[0], queue2 = _ensureUpdateQueues2[1];
        null !== queue1 && null !== update.next && (update.next = null, queue1.last = update), 
        null !== queue2 && null !== update2 && null !== update2.next && (update2.next = null, 
        queue2.last = update);
    }
}

var addTopLevelUpdate_1 = addTopLevelUpdate$1;

function getStateFromUpdate(update, instance, prevState, props) {
    var partialState = update.partialState;
    if ("function" == typeof partialState) {
        return partialState.call(instance, prevState, props);
    }
    return partialState;
}

function beginUpdateQueue(current, workInProgress, queue, instance, prevState, props, priorityLevel) {
    if (null !== current && current.updateQueue === queue) {
        var currentQueue = queue;
        queue = workInProgress.updateQueue = {
            first: currentQueue.first,
            last: currentQueue.last,
            callbackList: null,
            hasForceUpdate: !1
        };
    }
    for (var callbackList = queue.callbackList, hasForceUpdate = queue.hasForceUpdate, state = prevState, dontMutatePrevState = !0, update = queue.first; null !== update && comparePriority(update.priorityLevel, priorityLevel) <= 0; ) {
        queue.first = update.next, null === queue.first && (queue.last = null);
        var _partialState = void 0;
        update.isReplace ? (state = getStateFromUpdate(update, instance, state, props), 
        dontMutatePrevState = !0) : (_partialState = getStateFromUpdate(update, instance, state, props)) && (state = dontMutatePrevState ? Object.assign({}, state, _partialState) : Object.assign(state, _partialState), 
        dontMutatePrevState = !1), update.isForced && (hasForceUpdate = !0), null === update.callback || update.isTopLevelUnmount && null !== update.next || (callbackList = null !== callbackList ? callbackList : [], 
        callbackList.push(update.callback), workInProgress.effectTag |= CallbackEffect), 
        update = update.next;
    }
    return queue.callbackList = callbackList, queue.hasForceUpdate = hasForceUpdate, 
    null !== queue.first || null !== callbackList || hasForceUpdate || (workInProgress.updateQueue = null), 
    state;
}

var beginUpdateQueue_1 = beginUpdateQueue;

function commitCallbacks(finishedWork, queue, context) {
    var callbackList = queue.callbackList;
    if (null !== callbackList) {
        queue.callbackList = null;
        for (var i = 0; i < callbackList.length; i++) {
            var _callback = callbackList[i];
            invariant("function" == typeof _callback, "Invalid argument passed as callback. Expected a function. Instead " + "received: %s", _callback), 
            _callback.call(context);
        }
    }
}

var commitCallbacks_1 = commitCallbacks, ReactFiberUpdateQueue = {
    addUpdate: addUpdate_1,
    addReplaceUpdate: addReplaceUpdate_1,
    addForceUpdate: addForceUpdate_1,
    getUpdatePriority: getUpdatePriority_1,
    addTopLevelUpdate: addTopLevelUpdate_1,
    beginUpdateQueue: beginUpdateQueue_1,
    commitCallbacks: commitCallbacks_1
};

function getComponentName$1(instanceOrFiber) {
    if ("function" == typeof instanceOrFiber.getName) {
        return instanceOrFiber.getName();
    }
    if ("number" == typeof instanceOrFiber.tag) {
        var fiber = instanceOrFiber, type = fiber.type;
        if ("string" == typeof type) return type;
        if ("function" == typeof type) return type.displayName || type.name;
    }
    return null;
}

var getComponentName_1 = getComponentName$1, ReactInstanceMap = {
    remove: function(key) {
        key._reactInternalInstance = void 0;
    },
    get: function(key) {
        return key._reactInternalInstance;
    },
    has: function(key) {
        return void 0 !== key._reactInternalInstance;
    },
    set: function(key, value) {
        key._reactInternalInstance = value;
    }
}, ReactInstanceMap_1 = ReactInstanceMap, ReactInternals = react.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, ReactGlobalSharedState = {
    ReactCurrentOwner: ReactInternals.ReactCurrentOwner
}, ReactGlobalSharedState_1 = ReactGlobalSharedState, HostComponent$1 = ReactTypeOfWork.HostComponent, HostRoot$2 = ReactTypeOfWork.HostRoot, HostPortal = ReactTypeOfWork.HostPortal, HostText = ReactTypeOfWork.HostText, NoEffect = ReactTypeOfSideEffect.NoEffect, Placement = ReactTypeOfSideEffect.Placement, MOUNTING = 1, MOUNTED = 2, UNMOUNTED = 3;

function isFiberMountedImpl(fiber) {
    var node = fiber;
    if (fiber.alternate) for (;node.return; ) node = node.return; else {
        if ((node.effectTag & Placement) !== NoEffect) return MOUNTING;
        for (;node.return; ) if (node = node.return, (node.effectTag & Placement) !== NoEffect) return MOUNTING;
    }
    return node.tag === HostRoot$2 ? MOUNTED : UNMOUNTED;
}

var isFiberMounted$1 = function(fiber) {
    return isFiberMountedImpl(fiber) === MOUNTED;
}, isMounted = function(component) {
    var fiber = ReactInstanceMap_1.get(component);
    return !!fiber && isFiberMountedImpl(fiber) === MOUNTED;
};

function assertIsMounted(fiber) {
    invariant(isFiberMountedImpl(fiber) === MOUNTED, "Unable to find node on an unmounted component.");
}

function findCurrentFiberUsingSlowPath(fiber) {
    var alternate = fiber.alternate;
    if (!alternate) {
        var state = isFiberMountedImpl(fiber);
        return invariant(state !== UNMOUNTED, "Unable to find node on an unmounted component."), 
        state === MOUNTING ? null : fiber;
    }
    for (var a = fiber, b = alternate; !0; ) {
        var parentA = a.return, parentB = parentA ? parentA.alternate : null;
        if (!parentA || !parentB) break;
        if (parentA.child === parentB.child) {
            for (var child = parentA.child; child; ) {
                if (child === a) return assertIsMounted(parentA), fiber;
                if (child === b) return assertIsMounted(parentA), alternate;
                child = child.sibling;
            }
            invariant(!1, "Unable to find node on an unmounted component.");
        }
        if (a.return !== b.return) a = parentA, b = parentB; else {
            for (var didFindChild = !1, _child = parentA.child; _child; ) {
                if (_child === a) {
                    didFindChild = !0, a = parentA, b = parentB;
                    break;
                }
                if (_child === b) {
                    didFindChild = !0, b = parentA, a = parentB;
                    break;
                }
                _child = _child.sibling;
            }
            if (!didFindChild) {
                for (_child = parentB.child; _child; ) {
                    if (_child === a) {
                        didFindChild = !0, a = parentB, b = parentA;
                        break;
                    }
                    if (_child === b) {
                        didFindChild = !0, b = parentB, a = parentA;
                        break;
                    }
                    _child = _child.sibling;
                }
                invariant(didFindChild, "Child was not found in either parent set. This indicates a bug " + "in React related to the return pointer. Please file an issue.");
            }
        }
        invariant(a.alternate === b, "Return fibers should always be each others' alternates. " + "This error is likely caused by a bug in React. Please file an issue.");
    }
    return invariant(a.tag === HostRoot$2, "Unable to find node on an unmounted component."), 
    a.stateNode.current === a ? fiber : alternate;
}

var findCurrentFiberUsingSlowPath_1 = findCurrentFiberUsingSlowPath, findCurrentHostFiber$1 = function(parent) {
    var currentParent = findCurrentFiberUsingSlowPath(parent);
    if (!currentParent) return null;
    for (var node = currentParent; !0; ) {
        if (node.tag === HostComponent$1 || node.tag === HostText) return node;
        if (node.child) node.child.return = node, node = node.child; else {
            if (node === currentParent) return null;
            for (;!node.sibling; ) {
                if (!node.return || node.return === currentParent) return null;
                node = node.return;
            }
            node.sibling.return = node.return, node = node.sibling;
        }
    }
    return null;
}, findCurrentHostFiberWithNoPortals$1 = function(parent) {
    var currentParent = findCurrentFiberUsingSlowPath(parent);
    if (!currentParent) return null;
    for (var node = currentParent; !0; ) {
        if (node.tag === HostComponent$1 || node.tag === HostText) return node;
        if (node.child && node.tag !== HostPortal) node.child.return = node, node = node.child; else {
            if (node === currentParent) return null;
            for (;!node.sibling; ) {
                if (!node.return || node.return === currentParent) return null;
                node = node.return;
            }
            node.sibling.return = node.return, node = node.sibling;
        }
    }
    return null;
}, ReactFiberTreeReflection = {
    isFiberMounted: isFiberMounted$1,
    isMounted: isMounted,
    findCurrentFiberUsingSlowPath: findCurrentFiberUsingSlowPath_1,
    findCurrentHostFiber: findCurrentHostFiber$1,
    findCurrentHostFiberWithNoPortals: findCurrentHostFiberWithNoPortals$1
}, valueStack = [], index = -1, createCursor$1 = function(defaultValue) {
    return {
        current: defaultValue
    };
}, isEmpty = function() {
    return -1 === index;
}, pop$1 = function(cursor, fiber) {
    index < 0 || (cursor.current = valueStack[index], valueStack[index] = null, index--);
}, push$1 = function(cursor, value, fiber) {
    index++, valueStack[index] = cursor.current, cursor.current = value;
}, reset = function() {
    for (;index > -1; ) valueStack[index] = null, index--;
}, ReactFiberStack = {
    createCursor: createCursor$1,
    isEmpty: isEmpty,
    pop: pop$1,
    push: push$1,
    reset: reset
}, isFiberMounted = ReactFiberTreeReflection.isFiberMounted, ClassComponent$1 = ReactTypeOfWork.ClassComponent, HostRoot$1 = ReactTypeOfWork.HostRoot, createCursor = ReactFiberStack.createCursor, pop = ReactFiberStack.pop, push = ReactFiberStack.push, contextStackCursor = createCursor(emptyObject), didPerformWorkStackCursor = createCursor(!1), previousContext = emptyObject;

function getUnmaskedContext(workInProgress) {
    return isContextProvider$1(workInProgress) ? previousContext : contextStackCursor.current;
}

var getUnmaskedContext_1 = getUnmaskedContext;

function cacheContext(workInProgress, unmaskedContext, maskedContext) {
    var instance = workInProgress.stateNode;
    instance.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext, instance.__reactInternalMemoizedMaskedChildContext = maskedContext;
}

var cacheContext_1 = cacheContext, getMaskedContext = function(workInProgress, unmaskedContext) {
    var type = workInProgress.type, contextTypes = type.contextTypes;
    if (!contextTypes) return emptyObject;
    var instance = workInProgress.stateNode;
    if (instance && instance.__reactInternalMemoizedUnmaskedChildContext === unmaskedContext) return instance.__reactInternalMemoizedMaskedChildContext;
    var context = {};
    for (var key in contextTypes) context[key] = unmaskedContext[key];
    return instance && cacheContext(workInProgress, unmaskedContext, context), context;
}, hasContextChanged = function() {
    return didPerformWorkStackCursor.current;
};

function isContextConsumer(fiber) {
    return fiber.tag === ClassComponent$1 && null != fiber.type.contextTypes;
}

var isContextConsumer_1 = isContextConsumer;

function isContextProvider$1(fiber) {
    return fiber.tag === ClassComponent$1 && null != fiber.type.childContextTypes;
}

var isContextProvider_1 = isContextProvider$1;

function popContextProvider(fiber) {
    isContextProvider$1(fiber) && (pop(didPerformWorkStackCursor, fiber), pop(contextStackCursor, fiber));
}

var popContextProvider_1 = popContextProvider, pushTopLevelContextObject = function(fiber, context, didChange) {
    invariant(null == contextStackCursor.cursor, "Unexpected context found on stack. " + "This error is likely caused by a bug in React. Please file an issue."), 
    push(contextStackCursor, context, fiber), push(didPerformWorkStackCursor, didChange, fiber);
};

function processChildContext$1(fiber, parentContext, isReconciling) {
    var instance = fiber.stateNode, childContextTypes = fiber.type.childContextTypes;
    if ("function" != typeof instance.getChildContext) return parentContext;
    var childContext = void 0;
    childContext = instance.getChildContext();
    for (var contextKey in childContext) invariant(contextKey in childContextTypes, '%s.getChildContext(): key "%s" is not defined in childContextTypes.', getComponentName_1(fiber) || "Unknown", contextKey);
    return Object.assign({}, parentContext, childContext);
}

var processChildContext_1 = processChildContext$1, pushContextProvider = function(workInProgress) {
    if (!isContextProvider$1(workInProgress)) return !1;
    var instance = workInProgress.stateNode, memoizedMergedChildContext = instance && instance.__reactInternalMemoizedMergedChildContext || emptyObject;
    return previousContext = contextStackCursor.current, push(contextStackCursor, memoizedMergedChildContext, workInProgress), 
    push(didPerformWorkStackCursor, didPerformWorkStackCursor.current, workInProgress), 
    !0;
}, invalidateContextProvider = function(workInProgress, didChange) {
    var instance = workInProgress.stateNode;
    if (invariant(instance, "Expected to have an instance by this point. " + "This error is likely caused by a bug in React. Please file an issue."), 
    didChange) {
        var mergedContext = processChildContext$1(workInProgress, previousContext, !0);
        instance.__reactInternalMemoizedMergedChildContext = mergedContext, pop(didPerformWorkStackCursor, workInProgress), 
        pop(contextStackCursor, workInProgress), push(contextStackCursor, mergedContext, workInProgress), 
        push(didPerformWorkStackCursor, didChange, workInProgress);
    } else pop(didPerformWorkStackCursor, workInProgress), push(didPerformWorkStackCursor, didChange, workInProgress);
}, resetContext = function() {
    previousContext = emptyObject, contextStackCursor.current = emptyObject, didPerformWorkStackCursor.current = !1;
}, findCurrentUnmaskedContext$1 = function(fiber) {
    invariant(isFiberMounted(fiber) && fiber.tag === ClassComponent$1, "Expected subtree parent to be a mounted class component. " + "This error is likely caused by a bug in React. Please file an issue.");
    for (var node = fiber; node.tag !== HostRoot$1; ) {
        if (isContextProvider$1(node)) return node.stateNode.__reactInternalMemoizedMergedChildContext;
        var parent = node.return;
        invariant(parent, "Found unexpected detached subtree parent. " + "This error is likely caused by a bug in React. Please file an issue."), 
        node = parent;
    }
    return node.stateNode.context;
}, ReactFiberContext = {
    getUnmaskedContext: getUnmaskedContext_1,
    cacheContext: cacheContext_1,
    getMaskedContext: getMaskedContext,
    hasContextChanged: hasContextChanged,
    isContextConsumer: isContextConsumer_1,
    isContextProvider: isContextProvider_1,
    popContextProvider: popContextProvider_1,
    pushTopLevelContextObject: pushTopLevelContextObject,
    processChildContext: processChildContext_1,
    pushContextProvider: pushContextProvider,
    invalidateContextProvider: invalidateContextProvider,
    resetContext: resetContext,
    findCurrentUnmaskedContext: findCurrentUnmaskedContext$1
}, ReactTypeOfInternalContext = {
    NoContext: 0,
    AsyncUpdates: 1
}, IndeterminateComponent = ReactTypeOfWork.IndeterminateComponent, ClassComponent$3 = ReactTypeOfWork.ClassComponent, HostRoot$3 = ReactTypeOfWork.HostRoot, HostComponent$2 = ReactTypeOfWork.HostComponent, HostText$1 = ReactTypeOfWork.HostText, HostPortal$1 = ReactTypeOfWork.HostPortal, CoroutineComponent = ReactTypeOfWork.CoroutineComponent, YieldComponent = ReactTypeOfWork.YieldComponent, Fragment = ReactTypeOfWork.Fragment, NoWork$1 = ReactPriorityLevel.NoWork, NoContext = ReactTypeOfInternalContext.NoContext, NoEffect$1 = ReactTypeOfSideEffect.NoEffect, createFiber = function(tag, key, internalContextTag) {
    return {
        tag: tag,
        key: key,
        type: null,
        stateNode: null,
        return: null,
        child: null,
        sibling: null,
        index: 0,
        ref: null,
        pendingProps: null,
        memoizedProps: null,
        updateQueue: null,
        memoizedState: null,
        internalContextTag: internalContextTag,
        effectTag: NoEffect$1,
        nextEffect: null,
        firstEffect: null,
        lastEffect: null,
        pendingWorkPriority: NoWork$1,
        alternate: null
    };
};

function shouldConstruct(Component) {
    return !(!Component.prototype || !Component.prototype.isReactComponent);
}

var createWorkInProgress = function(current, renderPriority) {
    var workInProgress = current.alternate;
    return null === workInProgress ? (workInProgress = createFiber(current.tag, current.key, current.internalContextTag), 
    workInProgress.type = current.type, workInProgress.stateNode = current.stateNode, 
    workInProgress.alternate = current, current.alternate = workInProgress) : (workInProgress.effectTag = NoWork$1, 
    workInProgress.nextEffect = null, workInProgress.firstEffect = null, workInProgress.lastEffect = null), 
    workInProgress.pendingWorkPriority = renderPriority, workInProgress.child = current.child, 
    workInProgress.memoizedProps = current.memoizedProps, workInProgress.memoizedState = current.memoizedState, 
    workInProgress.updateQueue = current.updateQueue, workInProgress.sibling = current.sibling, 
    workInProgress.index = current.index, workInProgress.ref = current.ref, workInProgress;
}, createHostRootFiber$1 = function() {
    return createFiber(HostRoot$3, null, NoContext);
}, createFiberFromElement = function(element, internalContextTag, priorityLevel) {
    var owner = null, fiber = createFiberFromElementType(element.type, element.key, internalContextTag, owner);
    return fiber.pendingProps = element.props, fiber.pendingWorkPriority = priorityLevel, 
    fiber;
}, createFiberFromFragment = function(elements, internalContextTag, priorityLevel) {
    var fiber = createFiber(Fragment, null, internalContextTag);
    return fiber.pendingProps = elements, fiber.pendingWorkPriority = priorityLevel, 
    fiber;
}, createFiberFromText = function(content, internalContextTag, priorityLevel) {
    var fiber = createFiber(HostText$1, null, internalContextTag);
    return fiber.pendingProps = content, fiber.pendingWorkPriority = priorityLevel, 
    fiber;
};

function createFiberFromElementType(type, key, internalContextTag, debugOwner) {
    var fiber = void 0;
    if ("function" == typeof type) fiber = shouldConstruct(type) ? createFiber(ClassComponent$3, key, internalContextTag) : createFiber(IndeterminateComponent, key, internalContextTag), 
    fiber.type = type; else if ("string" == typeof type) fiber = createFiber(HostComponent$2, key, internalContextTag), 
    fiber.type = type; else if ("object" == typeof type && null !== type && "number" == typeof type.tag) fiber = type; else {
        var info = "";
        invariant(!1, "Element type is invalid: expected a string (for built-in components) " + "or a class/function (for composite components) but got: %s.%s", null == type ? type : typeof type, info);
    }
    return fiber;
}

var createFiberFromElementType_1 = createFiberFromElementType, createFiberFromHostInstanceForDeletion = function() {
    var fiber = createFiber(HostComponent$2, null, NoContext);
    return fiber.type = "DELETED", fiber;
}, createFiberFromCoroutine = function(coroutine, internalContextTag, priorityLevel) {
    var fiber = createFiber(CoroutineComponent, coroutine.key, internalContextTag);
    return fiber.type = coroutine.handler, fiber.pendingProps = coroutine, fiber.pendingWorkPriority = priorityLevel, 
    fiber;
}, createFiberFromYield = function(yieldNode, internalContextTag, priorityLevel) {
    return createFiber(YieldComponent, null, internalContextTag);
}, createFiberFromPortal = function(portal, internalContextTag, priorityLevel) {
    var fiber = createFiber(HostPortal$1, portal.key, internalContextTag);
    return fiber.pendingProps = portal.children || [], fiber.pendingWorkPriority = priorityLevel, 
    fiber.stateNode = {
        containerInfo: portal.containerInfo,
        implementation: portal.implementation
    }, fiber;
}, largerPriority = function(p1, p2) {
    return p1 !== NoWork$1 && (p2 === NoWork$1 || p2 > p1) ? p1 : p2;
}, ReactFiber = {
    createWorkInProgress: createWorkInProgress,
    createHostRootFiber: createHostRootFiber$1,
    createFiberFromElement: createFiberFromElement,
    createFiberFromFragment: createFiberFromFragment,
    createFiberFromText: createFiberFromText,
    createFiberFromElementType: createFiberFromElementType_1,
    createFiberFromHostInstanceForDeletion: createFiberFromHostInstanceForDeletion,
    createFiberFromCoroutine: createFiberFromCoroutine,
    createFiberFromYield: createFiberFromYield,
    createFiberFromPortal: createFiberFromPortal,
    largerPriority: largerPriority
}, createHostRootFiber = ReactFiber.createHostRootFiber, createFiberRoot$1 = function(containerInfo) {
    var uninitializedFiber = createHostRootFiber(), root = {
        current: uninitializedFiber,
        containerInfo: containerInfo,
        isScheduled: !1,
        nextScheduledRoot: null,
        context: null,
        pendingContext: null
    };
    return uninitializedFiber.stateNode = root, root;
}, ReactFiberRoot = {
    createFiberRoot: createFiberRoot$1
}, describeComponentFrame = function(name, source, ownerName) {
    return "\n    in " + (name || "Unknown") + (source ? " (at " + source.fileName.replace(/^.*[\\\/]/, "") + ":" + source.lineNumber + ")" : ownerName ? " (created by " + ownerName + ")" : "");
}, IndeterminateComponent$1 = ReactTypeOfWork.IndeterminateComponent, FunctionalComponent = ReactTypeOfWork.FunctionalComponent, ClassComponent$5 = ReactTypeOfWork.ClassComponent, HostComponent$4 = ReactTypeOfWork.HostComponent;

function describeFiber(fiber) {
    switch (fiber.tag) {
      case IndeterminateComponent$1:
      case FunctionalComponent:
      case ClassComponent$5:
      case HostComponent$4:
        var owner = fiber._debugOwner, source = fiber._debugSource, name = getComponentName_1(fiber), ownerName = null;
        return owner && (ownerName = getComponentName_1(owner)), describeComponentFrame(name, source, ownerName);

      default:
        return "";
    }
}

function getStackAddendumByWorkInProgressFiber$1(workInProgress) {
    var info = "", node = workInProgress;
    do {
        info += describeFiber(node), node = node.return;
    } while (node);
    return info;
}

var ReactFiberComponentTreeHook = {
    getStackAddendumByWorkInProgressFiber: getStackAddendumByWorkInProgressFiber$1
}, REACT_COROUTINE_TYPE$1, REACT_YIELD_TYPE$1;

"function" == typeof Symbol && Symbol.for ? (REACT_COROUTINE_TYPE$1 = Symbol.for("react.coroutine"), 
REACT_YIELD_TYPE$1 = Symbol.for("react.yield")) : (REACT_COROUTINE_TYPE$1 = 60104, 
REACT_YIELD_TYPE$1 = 60105);

var createCoroutine = function(children, handler, props) {
    var key = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : null;
    return {
        $$typeof: REACT_COROUTINE_TYPE$1,
        key: null == key ? null : "" + key,
        children: children,
        handler: handler,
        props: props
    };
}, createYield = function(value) {
    return {
        $$typeof: REACT_YIELD_TYPE$1,
        value: value
    };
}, isCoroutine = function(object) {
    return "object" == typeof object && null !== object && object.$$typeof === REACT_COROUTINE_TYPE$1;
}, isYield = function(object) {
    return "object" == typeof object && null !== object && object.$$typeof === REACT_YIELD_TYPE$1;
}, REACT_YIELD_TYPE_1 = REACT_YIELD_TYPE$1, REACT_COROUTINE_TYPE_1 = REACT_COROUTINE_TYPE$1, ReactCoroutine = {
    createCoroutine: createCoroutine,
    createYield: createYield,
    isCoroutine: isCoroutine,
    isYield: isYield,
    REACT_YIELD_TYPE: REACT_YIELD_TYPE_1,
    REACT_COROUTINE_TYPE: REACT_COROUTINE_TYPE_1
}, REACT_COROUTINE_TYPE = ReactCoroutine.REACT_COROUTINE_TYPE, REACT_YIELD_TYPE = ReactCoroutine.REACT_YIELD_TYPE, REACT_PORTAL_TYPE$1 = ReactPortal.REACT_PORTAL_TYPE, createWorkInProgress$2 = ReactFiber.createWorkInProgress, createFiberFromElement$1 = ReactFiber.createFiberFromElement, createFiberFromFragment$1 = ReactFiber.createFiberFromFragment, createFiberFromText$1 = ReactFiber.createFiberFromText, createFiberFromCoroutine$1 = ReactFiber.createFiberFromCoroutine, createFiberFromYield$1 = ReactFiber.createFiberFromYield, createFiberFromPortal$1 = ReactFiber.createFiberFromPortal, isArray = Array.isArray, FunctionalComponent$2 = ReactTypeOfWork.FunctionalComponent, ClassComponent$7 = ReactTypeOfWork.ClassComponent, HostText$3 = ReactTypeOfWork.HostText, HostPortal$4 = ReactTypeOfWork.HostPortal, CoroutineComponent$2 = ReactTypeOfWork.CoroutineComponent, YieldComponent$2 = ReactTypeOfWork.YieldComponent, Fragment$2 = ReactTypeOfWork.Fragment, NoEffect$2 = ReactTypeOfSideEffect.NoEffect, Placement$3 = ReactTypeOfSideEffect.Placement, Deletion$1 = ReactTypeOfSideEffect.Deletion, ITERATOR_SYMBOL = "function" == typeof Symbol && Symbol.iterator, FAUX_ITERATOR_SYMBOL = "@@iterator", REACT_ELEMENT_TYPE = "function" == typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103;

function getIteratorFn(maybeIterable) {
    if (null === maybeIterable || void 0 === maybeIterable) return null;
    var iteratorFn = ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
    return "function" == typeof iteratorFn ? iteratorFn : null;
}

function coerceRef(current, element) {
    var mixedRef = element.ref;
    if (null !== mixedRef && "function" != typeof mixedRef) {
        if (element._owner) {
            var owner = element._owner, inst = void 0;
            if (owner) if ("number" == typeof owner.tag) {
                var ownerFiber = owner;
                invariant(ownerFiber.tag === ClassComponent$7, "Stateless function components cannot have refs."), 
                inst = ownerFiber.stateNode;
            } else inst = owner.getPublicInstance();
            invariant(inst, "Missing owner for string ref %s. This error is likely caused by a " + "bug in React. Please file an issue.", mixedRef);
            var stringRef = "" + mixedRef;
            if (null !== current && null !== current.ref && current.ref._stringRef === stringRef) return current.ref;
            var ref = function(value) {
                var refs = inst.refs === emptyObject ? inst.refs = {} : inst.refs;
                null === value ? delete refs[stringRef] : refs[stringRef] = value;
            };
            return ref._stringRef = stringRef, ref;
        }
        invariant("string" == typeof mixedRef, "Expected ref to be a function or a string."), 
        invariant(element._owner, "Element ref was specified as a string (%s) but no owner was " + "set. You may have multiple copies of React loaded. " + "(details: https://fb.me/react-refs-must-have-owner).", mixedRef);
    }
    return mixedRef;
}

function throwOnInvalidObjectType(returnFiber, newChild) {
    if ("textarea" !== returnFiber.type) {
        invariant(!1, "Objects are not valid as a React child (found: %s).%s", "[object Object]" === Object.prototype.toString.call(newChild) ? "object with keys {" + Object.keys(newChild).join(", ") + "}" : newChild, "");
    }
}

function ChildReconciler(shouldClone, shouldTrackSideEffects) {
    function deleteChild(returnFiber, childToDelete) {
        if (shouldTrackSideEffects) {
            if (!shouldClone) {
                if (null === childToDelete.alternate) return;
                childToDelete = childToDelete.alternate;
            }
            var last = returnFiber.lastEffect;
            null !== last ? (last.nextEffect = childToDelete, returnFiber.lastEffect = childToDelete) : returnFiber.firstEffect = returnFiber.lastEffect = childToDelete, 
            childToDelete.nextEffect = null, childToDelete.effectTag = Deletion$1;
        }
    }
    function deleteRemainingChildren(returnFiber, currentFirstChild) {
        if (!shouldTrackSideEffects) return null;
        for (var childToDelete = currentFirstChild; null !== childToDelete; ) deleteChild(returnFiber, childToDelete), 
        childToDelete = childToDelete.sibling;
        return null;
    }
    function mapRemainingChildren(returnFiber, currentFirstChild) {
        for (var existingChildren = new Map(), existingChild = currentFirstChild; null !== existingChild; ) null !== existingChild.key ? existingChildren.set(existingChild.key, existingChild) : existingChildren.set(existingChild.index, existingChild), 
        existingChild = existingChild.sibling;
        return existingChildren;
    }
    function useFiber(fiber, priority) {
        if (shouldClone) {
            var clone = createWorkInProgress$2(fiber, priority);
            return clone.index = 0, clone.sibling = null, clone;
        }
        return fiber.pendingWorkPriority = priority, fiber.effectTag = NoEffect$2, fiber.index = 0, 
        fiber.sibling = null, fiber;
    }
    function placeChild(newFiber, lastPlacedIndex, newIndex) {
        if (newFiber.index = newIndex, !shouldTrackSideEffects) return lastPlacedIndex;
        var current = newFiber.alternate;
        if (null !== current) {
            var oldIndex = current.index;
            return oldIndex < lastPlacedIndex ? (newFiber.effectTag = Placement$3, lastPlacedIndex) : oldIndex;
        }
        return newFiber.effectTag = Placement$3, lastPlacedIndex;
    }
    function placeSingleChild(newFiber) {
        return shouldTrackSideEffects && null === newFiber.alternate && (newFiber.effectTag = Placement$3), 
        newFiber;
    }
    function updateTextNode(returnFiber, current, textContent, priority) {
        if (null === current || current.tag !== HostText$3) {
            var created = createFiberFromText$1(textContent, returnFiber.internalContextTag, priority);
            return created.return = returnFiber, created;
        }
        var existing = useFiber(current, priority);
        return existing.pendingProps = textContent, existing.return = returnFiber, existing;
    }
    function updateElement(returnFiber, current, element, priority) {
        if (null === current || current.type !== element.type) {
            var created = createFiberFromElement$1(element, returnFiber.internalContextTag, priority);
            return created.ref = coerceRef(current, element), created.return = returnFiber, 
            created;
        }
        var existing = useFiber(current, priority);
        return existing.ref = coerceRef(current, element), existing.pendingProps = element.props, 
        existing.return = returnFiber, existing;
    }
    function updateCoroutine(returnFiber, current, coroutine, priority) {
        if (null === current || current.tag !== CoroutineComponent$2) {
            var created = createFiberFromCoroutine$1(coroutine, returnFiber.internalContextTag, priority);
            return created.return = returnFiber, created;
        }
        var existing = useFiber(current, priority);
        return existing.pendingProps = coroutine, existing.return = returnFiber, existing;
    }
    function updateYield(returnFiber, current, yieldNode, priority) {
        if (null === current || current.tag !== YieldComponent$2) {
            var created = createFiberFromYield$1(yieldNode, returnFiber.internalContextTag, priority);
            return created.type = yieldNode.value, created.return = returnFiber, created;
        }
        var existing = useFiber(current, priority);
        return existing.type = yieldNode.value, existing.return = returnFiber, existing;
    }
    function updatePortal(returnFiber, current, portal, priority) {
        if (null === current || current.tag !== HostPortal$4 || current.stateNode.containerInfo !== portal.containerInfo || current.stateNode.implementation !== portal.implementation) {
            var created = createFiberFromPortal$1(portal, returnFiber.internalContextTag, priority);
            return created.return = returnFiber, created;
        }
        var existing = useFiber(current, priority);
        return existing.pendingProps = portal.children || [], existing.return = returnFiber, 
        existing;
    }
    function updateFragment(returnFiber, current, fragment, priority) {
        if (null === current || current.tag !== Fragment$2) {
            var created = createFiberFromFragment$1(fragment, returnFiber.internalContextTag, priority);
            return created.return = returnFiber, created;
        }
        var existing = useFiber(current, priority);
        return existing.pendingProps = fragment, existing.return = returnFiber, existing;
    }
    function createChild(returnFiber, newChild, priority) {
        if ("string" == typeof newChild || "number" == typeof newChild) {
            var created = createFiberFromText$1("" + newChild, returnFiber.internalContextTag, priority);
            return created.return = returnFiber, created;
        }
        if ("object" == typeof newChild && null !== newChild) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                var _created = createFiberFromElement$1(newChild, returnFiber.internalContextTag, priority);
                return _created.ref = coerceRef(null, newChild), _created.return = returnFiber, 
                _created;

              case REACT_COROUTINE_TYPE:
                var _created2 = createFiberFromCoroutine$1(newChild, returnFiber.internalContextTag, priority);
                return _created2.return = returnFiber, _created2;

              case REACT_YIELD_TYPE:
                var _created3 = createFiberFromYield$1(newChild, returnFiber.internalContextTag, priority);
                return _created3.type = newChild.value, _created3.return = returnFiber, _created3;

              case REACT_PORTAL_TYPE$1:
                var _created4 = createFiberFromPortal$1(newChild, returnFiber.internalContextTag, priority);
                return _created4.return = returnFiber, _created4;
            }
            if (isArray(newChild) || getIteratorFn(newChild)) {
                var _created5 = createFiberFromFragment$1(newChild, returnFiber.internalContextTag, priority);
                return _created5.return = returnFiber, _created5;
            }
            throwOnInvalidObjectType(returnFiber, newChild);
        }
        return null;
    }
    function updateSlot(returnFiber, oldFiber, newChild, priority) {
        var key = null !== oldFiber ? oldFiber.key : null;
        if ("string" == typeof newChild || "number" == typeof newChild) return null !== key ? null : updateTextNode(returnFiber, oldFiber, "" + newChild, priority);
        if ("object" == typeof newChild && null !== newChild) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return newChild.key === key ? updateElement(returnFiber, oldFiber, newChild, priority) : null;

              case REACT_COROUTINE_TYPE:
                return newChild.key === key ? updateCoroutine(returnFiber, oldFiber, newChild, priority) : null;

              case REACT_YIELD_TYPE:
                return null === key ? updateYield(returnFiber, oldFiber, newChild, priority) : null;

              case REACT_PORTAL_TYPE$1:
                return newChild.key === key ? updatePortal(returnFiber, oldFiber, newChild, priority) : null;
            }
            if (isArray(newChild) || getIteratorFn(newChild)) return null !== key ? null : updateFragment(returnFiber, oldFiber, newChild, priority);
            throwOnInvalidObjectType(returnFiber, newChild);
        }
        return null;
    }
    function updateFromMap(existingChildren, returnFiber, newIdx, newChild, priority) {
        if ("string" == typeof newChild || "number" == typeof newChild) {
            return updateTextNode(returnFiber, existingChildren.get(newIdx) || null, "" + newChild, priority);
        }
        if ("object" == typeof newChild && null !== newChild) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return updateElement(returnFiber, existingChildren.get(null === newChild.key ? newIdx : newChild.key) || null, newChild, priority);

              case REACT_COROUTINE_TYPE:
                return updateCoroutine(returnFiber, existingChildren.get(null === newChild.key ? newIdx : newChild.key) || null, newChild, priority);

              case REACT_YIELD_TYPE:
                return updateYield(returnFiber, existingChildren.get(newIdx) || null, newChild, priority);

              case REACT_PORTAL_TYPE$1:
                return updatePortal(returnFiber, existingChildren.get(null === newChild.key ? newIdx : newChild.key) || null, newChild, priority);
            }
            if (isArray(newChild) || getIteratorFn(newChild)) {
                return updateFragment(returnFiber, existingChildren.get(newIdx) || null, newChild, priority);
            }
            throwOnInvalidObjectType(returnFiber, newChild);
        }
        return null;
    }
    function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, priority) {
        for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, lastPlacedIndex = 0, newIdx = 0, nextOldFiber = null; null !== oldFiber && newIdx < newChildren.length; newIdx++) {
            oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
            var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], priority);
            if (null === newFiber) {
                null === oldFiber && (oldFiber = nextOldFiber);
                break;
            }
            shouldTrackSideEffects && oldFiber && null === newFiber.alternate && deleteChild(returnFiber, oldFiber), 
            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx), null === previousNewFiber ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber, 
            previousNewFiber = newFiber, oldFiber = nextOldFiber;
        }
        if (newIdx === newChildren.length) return deleteRemainingChildren(returnFiber, oldFiber), 
        resultingFirstChild;
        if (null === oldFiber) {
            for (;newIdx < newChildren.length; newIdx++) {
                var _newFiber = createChild(returnFiber, newChildren[newIdx], priority);
                _newFiber && (lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx), 
                null === previousNewFiber ? resultingFirstChild = _newFiber : previousNewFiber.sibling = _newFiber, 
                previousNewFiber = _newFiber);
            }
            return resultingFirstChild;
        }
        for (var existingChildren = mapRemainingChildren(returnFiber, oldFiber); newIdx < newChildren.length; newIdx++) {
            var _newFiber2 = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx], priority);
            _newFiber2 && (shouldTrackSideEffects && null !== _newFiber2.alternate && existingChildren.delete(null === _newFiber2.key ? newIdx : _newFiber2.key), 
            lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx), null === previousNewFiber ? resultingFirstChild = _newFiber2 : previousNewFiber.sibling = _newFiber2, 
            previousNewFiber = _newFiber2);
        }
        return shouldTrackSideEffects && existingChildren.forEach(function(child) {
            return deleteChild(returnFiber, child);
        }), resultingFirstChild;
    }
    function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildrenIterable, priority) {
        var iteratorFn = getIteratorFn(newChildrenIterable);
        invariant("function" == typeof iteratorFn, "An object is not an iterable. This error is likely caused by a bug in " + "React. Please file an issue.");
        var newChildren = iteratorFn.call(newChildrenIterable);
        invariant(null != newChildren, "An iterable object provided no iterator.");
        for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, lastPlacedIndex = 0, newIdx = 0, nextOldFiber = null, step = newChildren.next(); null !== oldFiber && !step.done; newIdx++, 
        step = newChildren.next()) {
            oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
            var newFiber = updateSlot(returnFiber, oldFiber, step.value, priority);
            if (null === newFiber) {
                oldFiber || (oldFiber = nextOldFiber);
                break;
            }
            shouldTrackSideEffects && oldFiber && null === newFiber.alternate && deleteChild(returnFiber, oldFiber), 
            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx), null === previousNewFiber ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber, 
            previousNewFiber = newFiber, oldFiber = nextOldFiber;
        }
        if (step.done) return deleteRemainingChildren(returnFiber, oldFiber), resultingFirstChild;
        if (null === oldFiber) {
            for (;!step.done; newIdx++, step = newChildren.next()) {
                var _newFiber3 = createChild(returnFiber, step.value, priority);
                null !== _newFiber3 && (lastPlacedIndex = placeChild(_newFiber3, lastPlacedIndex, newIdx), 
                null === previousNewFiber ? resultingFirstChild = _newFiber3 : previousNewFiber.sibling = _newFiber3, 
                previousNewFiber = _newFiber3);
            }
            return resultingFirstChild;
        }
        for (var existingChildren = mapRemainingChildren(returnFiber, oldFiber); !step.done; newIdx++, 
        step = newChildren.next()) {
            var _newFiber4 = updateFromMap(existingChildren, returnFiber, newIdx, step.value, priority);
            null !== _newFiber4 && (shouldTrackSideEffects && null !== _newFiber4.alternate && existingChildren.delete(null === _newFiber4.key ? newIdx : _newFiber4.key), 
            lastPlacedIndex = placeChild(_newFiber4, lastPlacedIndex, newIdx), null === previousNewFiber ? resultingFirstChild = _newFiber4 : previousNewFiber.sibling = _newFiber4, 
            previousNewFiber = _newFiber4);
        }
        return shouldTrackSideEffects && existingChildren.forEach(function(child) {
            return deleteChild(returnFiber, child);
        }), resultingFirstChild;
    }
    function reconcileSingleTextNode(returnFiber, currentFirstChild, textContent, priority) {
        if (null !== currentFirstChild && currentFirstChild.tag === HostText$3) {
            deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
            var existing = useFiber(currentFirstChild, priority);
            return existing.pendingProps = textContent, existing.return = returnFiber, existing;
        }
        deleteRemainingChildren(returnFiber, currentFirstChild);
        var created = createFiberFromText$1(textContent, returnFiber.internalContextTag, priority);
        return created.return = returnFiber, created;
    }
    function reconcileSingleElement(returnFiber, currentFirstChild, element, priority) {
        for (var key = element.key, child = currentFirstChild; null !== child; ) {
            if (child.key === key) {
                if (child.type === element.type) {
                    deleteRemainingChildren(returnFiber, child.sibling);
                    var existing = useFiber(child, priority);
                    return existing.ref = coerceRef(child, element), existing.pendingProps = element.props, 
                    existing.return = returnFiber, existing;
                }
                deleteRemainingChildren(returnFiber, child);
                break;
            }
            deleteChild(returnFiber, child), child = child.sibling;
        }
        var created = createFiberFromElement$1(element, returnFiber.internalContextTag, priority);
        return created.ref = coerceRef(currentFirstChild, element), created.return = returnFiber, 
        created;
    }
    function reconcileSingleCoroutine(returnFiber, currentFirstChild, coroutine, priority) {
        for (var key = coroutine.key, child = currentFirstChild; null !== child; ) {
            if (child.key === key) {
                if (child.tag === CoroutineComponent$2) {
                    deleteRemainingChildren(returnFiber, child.sibling);
                    var existing = useFiber(child, priority);
                    return existing.pendingProps = coroutine, existing.return = returnFiber, existing;
                }
                deleteRemainingChildren(returnFiber, child);
                break;
            }
            deleteChild(returnFiber, child), child = child.sibling;
        }
        var created = createFiberFromCoroutine$1(coroutine, returnFiber.internalContextTag, priority);
        return created.return = returnFiber, created;
    }
    function reconcileSingleYield(returnFiber, currentFirstChild, yieldNode, priority) {
        var child = currentFirstChild;
        if (null !== child) {
            if (child.tag === YieldComponent$2) {
                deleteRemainingChildren(returnFiber, child.sibling);
                var existing = useFiber(child, priority);
                return existing.type = yieldNode.value, existing.return = returnFiber, existing;
            }
            deleteRemainingChildren(returnFiber, child);
        }
        var created = createFiberFromYield$1(yieldNode, returnFiber.internalContextTag, priority);
        return created.type = yieldNode.value, created.return = returnFiber, created;
    }
    function reconcileSinglePortal(returnFiber, currentFirstChild, portal, priority) {
        for (var key = portal.key, child = currentFirstChild; null !== child; ) {
            if (child.key === key) {
                if (child.tag === HostPortal$4 && child.stateNode.containerInfo === portal.containerInfo && child.stateNode.implementation === portal.implementation) {
                    deleteRemainingChildren(returnFiber, child.sibling);
                    var existing = useFiber(child, priority);
                    return existing.pendingProps = portal.children || [], existing.return = returnFiber, 
                    existing;
                }
                deleteRemainingChildren(returnFiber, child);
                break;
            }
            deleteChild(returnFiber, child), child = child.sibling;
        }
        var created = createFiberFromPortal$1(portal, returnFiber.internalContextTag, priority);
        return created.return = returnFiber, created;
    }
    function reconcileChildFibers(returnFiber, currentFirstChild, newChild, priority) {
        var disableNewFiberFeatures = ReactFeatureFlags_1.disableNewFiberFeatures, isObject = "object" == typeof newChild && null !== newChild;
        if (isObject) if (disableNewFiberFeatures) switch (newChild.$$typeof) {
          case REACT_ELEMENT_TYPE:
            return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, priority));

          case REACT_PORTAL_TYPE$1:
            return placeSingleChild(reconcileSinglePortal(returnFiber, currentFirstChild, newChild, priority));
        } else switch (newChild.$$typeof) {
          case REACT_ELEMENT_TYPE:
            return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, priority));

          case REACT_COROUTINE_TYPE:
            return placeSingleChild(reconcileSingleCoroutine(returnFiber, currentFirstChild, newChild, priority));

          case REACT_YIELD_TYPE:
            return placeSingleChild(reconcileSingleYield(returnFiber, currentFirstChild, newChild, priority));

          case REACT_PORTAL_TYPE$1:
            return placeSingleChild(reconcileSinglePortal(returnFiber, currentFirstChild, newChild, priority));
        }
        if (disableNewFiberFeatures) switch (returnFiber.tag) {
          case ClassComponent$7:
            var Component = returnFiber.type;
            invariant(null === newChild || !1 === newChild, "%s.render(): A valid React element (or null) must be returned. " + "You may have returned undefined, an array or some other " + "invalid object.", Component.displayName || Component.name || "Component");
            break;

          case FunctionalComponent$2:
            var _Component = returnFiber.type;
            invariant(null === newChild || !1 === newChild, "%s(...): A valid React element (or null) must be returned. " + "You may have returned undefined, an array or some other " + "invalid object.", _Component.displayName || _Component.name || "Component");
        }
        if ("string" == typeof newChild || "number" == typeof newChild) return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, "" + newChild, priority));
        if (isArray(newChild)) return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, priority);
        if (getIteratorFn(newChild)) return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, priority);
        if (isObject && throwOnInvalidObjectType(returnFiber, newChild), !disableNewFiberFeatures && void 0 === newChild) switch (returnFiber.tag) {
          case ClassComponent$7:
          case FunctionalComponent$2:
            var _Component2 = returnFiber.type;
            invariant(!1, "%s(...): Nothing was returned from render. This usually means a " + "return statement is missing. Or, to render nothing, " + "return null.", _Component2.displayName || _Component2.name || "Component");
        }
        return deleteRemainingChildren(returnFiber, currentFirstChild);
    }
    return reconcileChildFibers;
}

var reconcileChildFibers$1 = ChildReconciler(!0, !0), reconcileChildFibersInPlace$1 = ChildReconciler(!1, !0), mountChildFibersInPlace$1 = ChildReconciler(!1, !1), cloneChildFibers$1 = function(current, workInProgress) {
    if (invariant(null === current || workInProgress.child === current.child, "Resuming work not yet implemented."), 
    null !== workInProgress.child) {
        var currentChild = workInProgress.child, newChild = createWorkInProgress$2(currentChild, currentChild.pendingWorkPriority);
        for (newChild.pendingProps = currentChild.pendingProps, workInProgress.child = newChild, 
        newChild.return = workInProgress; null !== currentChild.sibling; ) currentChild = currentChild.sibling, 
        newChild = newChild.sibling = createWorkInProgress$2(currentChild, currentChild.pendingWorkPriority), 
        newChild.pendingProps = currentChild.pendingProps, newChild.return = workInProgress;
        newChild.sibling = null;
    }
}, ReactChildFiber = {
    reconcileChildFibers: reconcileChildFibers$1,
    reconcileChildFibersInPlace: reconcileChildFibersInPlace$1,
    mountChildFibersInPlace: mountChildFibersInPlace$1,
    cloneChildFibers: cloneChildFibers$1
}, Update$1 = ReactTypeOfSideEffect.Update, AsyncUpdates$1 = ReactTypeOfInternalContext.AsyncUpdates, cacheContext$1 = ReactFiberContext.cacheContext, getMaskedContext$2 = ReactFiberContext.getMaskedContext, getUnmaskedContext$2 = ReactFiberContext.getUnmaskedContext, isContextConsumer$1 = ReactFiberContext.isContextConsumer, addUpdate$1 = ReactFiberUpdateQueue.addUpdate, addReplaceUpdate$1 = ReactFiberUpdateQueue.addReplaceUpdate, addForceUpdate$1 = ReactFiberUpdateQueue.addForceUpdate, beginUpdateQueue$2 = ReactFiberUpdateQueue.beginUpdateQueue, _require5 = ReactFiberContext, hasContextChanged$2 = _require5.hasContextChanged, isMounted$1 = ReactFiberTreeReflection.isMounted, ReactFiberClassComponent = function(scheduleUpdate, getPriorityContext, memoizeProps, memoizeState) {
    var updater = {
        isMounted: isMounted$1,
        enqueueSetState: function(instance, partialState, callback) {
            var fiber = ReactInstanceMap_1.get(instance), priorityLevel = getPriorityContext(fiber, !1);
            callback = void 0 === callback ? null : callback, addUpdate$1(fiber, partialState, callback, priorityLevel), 
            scheduleUpdate(fiber, priorityLevel);
        },
        enqueueReplaceState: function(instance, state, callback) {
            var fiber = ReactInstanceMap_1.get(instance), priorityLevel = getPriorityContext(fiber, !1);
            callback = void 0 === callback ? null : callback, addReplaceUpdate$1(fiber, state, callback, priorityLevel), 
            scheduleUpdate(fiber, priorityLevel);
        },
        enqueueForceUpdate: function(instance, callback) {
            var fiber = ReactInstanceMap_1.get(instance), priorityLevel = getPriorityContext(fiber, !1);
            callback = void 0 === callback ? null : callback, addForceUpdate$1(fiber, callback, priorityLevel), 
            scheduleUpdate(fiber, priorityLevel);
        }
    };
    function checkShouldComponentUpdate(workInProgress, oldProps, newProps, oldState, newState, newContext) {
        if (null === oldProps || null !== workInProgress.updateQueue && workInProgress.updateQueue.hasForceUpdate) return !0;
        var instance = workInProgress.stateNode, type = workInProgress.type;
        if ("function" == typeof instance.shouldComponentUpdate) {
            return instance.shouldComponentUpdate(newProps, newState, newContext);
        }
        return !type.prototype || !type.prototype.isPureReactComponent || (!shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState));
    }
    function resetInputPointers(workInProgress, instance) {
        instance.props = workInProgress.memoizedProps, instance.state = workInProgress.memoizedState;
    }
    function adoptClassInstance(workInProgress, instance) {
        instance.updater = updater, workInProgress.stateNode = instance, ReactInstanceMap_1.set(instance, workInProgress);
    }
    function constructClassInstance(workInProgress, props) {
        var ctor = workInProgress.type, unmaskedContext = getUnmaskedContext$2(workInProgress), needsContext = isContextConsumer$1(workInProgress), context = needsContext ? getMaskedContext$2(workInProgress, unmaskedContext) : emptyObject, instance = new ctor(props, context);
        return adoptClassInstance(workInProgress, instance), needsContext && cacheContext$1(workInProgress, unmaskedContext, context), 
        instance;
    }
    function callComponentWillMount(workInProgress, instance) {
        var oldState = instance.state;
        instance.componentWillMount(), oldState !== instance.state && updater.enqueueReplaceState(instance, instance.state, null);
    }
    function callComponentWillReceiveProps(workInProgress, instance, newProps, newContext) {
        var oldState = instance.state;
        instance.componentWillReceiveProps(newProps, newContext), instance.state !== oldState && updater.enqueueReplaceState(instance, instance.state, null);
    }
    function mountClassInstance(workInProgress, priorityLevel) {
        var current = workInProgress.alternate, instance = workInProgress.stateNode, state = instance.state || null, props = workInProgress.pendingProps;
        invariant(props, "There must be pending props for an initial mount. This error is " + "likely caused by a bug in React. Please file an issue.");
        var unmaskedContext = getUnmaskedContext$2(workInProgress);
        if (instance.props = props, instance.state = state, instance.refs = emptyObject, 
        instance.context = getMaskedContext$2(workInProgress, unmaskedContext), ReactFeatureFlags_1.enableAsyncSubtreeAPI && null != workInProgress.type && null != workInProgress.type.prototype && !0 === workInProgress.type.prototype.unstable_isAsyncReactComponent && (workInProgress.internalContextTag |= AsyncUpdates$1), 
        "function" == typeof instance.componentWillMount) {
            callComponentWillMount(workInProgress, instance);
            var updateQueue = workInProgress.updateQueue;
            null !== updateQueue && (instance.state = beginUpdateQueue$2(current, workInProgress, updateQueue, instance, state, props, priorityLevel));
        }
        "function" == typeof instance.componentDidMount && (workInProgress.effectTag |= Update$1);
    }
    function updateClassInstance(current, workInProgress, priorityLevel) {
        var instance = workInProgress.stateNode;
        resetInputPointers(workInProgress, instance);
        var oldProps = workInProgress.memoizedProps, newProps = workInProgress.pendingProps;
        newProps || (newProps = oldProps, invariant(null != newProps, "There should always be pending or memoized props. This error is " + "likely caused by a bug in React. Please file an issue."));
        var oldContext = instance.context, newUnmaskedContext = getUnmaskedContext$2(workInProgress), newContext = getMaskedContext$2(workInProgress, newUnmaskedContext);
        "function" != typeof instance.componentWillReceiveProps || oldProps === newProps && oldContext === newContext || callComponentWillReceiveProps(workInProgress, instance, newProps, newContext);
        var oldState = workInProgress.memoizedState, newState = void 0;
        if (newState = null !== workInProgress.updateQueue ? beginUpdateQueue$2(current, workInProgress, workInProgress.updateQueue, instance, oldState, newProps, priorityLevel) : oldState, 
        !(oldProps !== newProps || oldState !== newState || hasContextChanged$2() || null !== workInProgress.updateQueue && workInProgress.updateQueue.hasForceUpdate)) return "function" == typeof instance.componentDidUpdate && (oldProps === current.memoizedProps && oldState === current.memoizedState || (workInProgress.effectTag |= Update$1)), 
        !1;
        var shouldUpdate = checkShouldComponentUpdate(workInProgress, oldProps, newProps, oldState, newState, newContext);
        return shouldUpdate ? ("function" == typeof instance.componentWillUpdate && instance.componentWillUpdate(newProps, newState, newContext), 
        "function" == typeof instance.componentDidUpdate && (workInProgress.effectTag |= Update$1)) : ("function" == typeof instance.componentDidUpdate && (oldProps === current.memoizedProps && oldState === current.memoizedState || (workInProgress.effectTag |= Update$1)), 
        memoizeProps(workInProgress, newProps), memoizeState(workInProgress, newState)), 
        instance.props = newProps, instance.state = newState, instance.context = newContext, 
        shouldUpdate;
    }
    return {
        adoptClassInstance: adoptClassInstance,
        constructClassInstance: constructClassInstance,
        mountClassInstance: mountClassInstance,
        updateClassInstance: updateClassInstance
    };
}, mountChildFibersInPlace = ReactChildFiber.mountChildFibersInPlace, reconcileChildFibers = ReactChildFiber.reconcileChildFibers, reconcileChildFibersInPlace = ReactChildFiber.reconcileChildFibersInPlace, cloneChildFibers = ReactChildFiber.cloneChildFibers, beginUpdateQueue$1 = ReactFiberUpdateQueue.beginUpdateQueue, getMaskedContext$1 = ReactFiberContext.getMaskedContext, getUnmaskedContext$1 = ReactFiberContext.getUnmaskedContext, hasContextChanged$1 = ReactFiberContext.hasContextChanged, pushContextProvider$1 = ReactFiberContext.pushContextProvider, pushTopLevelContextObject$1 = ReactFiberContext.pushTopLevelContextObject, invalidateContextProvider$1 = ReactFiberContext.invalidateContextProvider, IndeterminateComponent$2 = ReactTypeOfWork.IndeterminateComponent, FunctionalComponent$1 = ReactTypeOfWork.FunctionalComponent, ClassComponent$6 = ReactTypeOfWork.ClassComponent, HostRoot$5 = ReactTypeOfWork.HostRoot, HostComponent$5 = ReactTypeOfWork.HostComponent, HostText$2 = ReactTypeOfWork.HostText, HostPortal$3 = ReactTypeOfWork.HostPortal, CoroutineComponent$1 = ReactTypeOfWork.CoroutineComponent, CoroutineHandlerPhase = ReactTypeOfWork.CoroutineHandlerPhase, YieldComponent$1 = ReactTypeOfWork.YieldComponent, Fragment$1 = ReactTypeOfWork.Fragment, NoWork$3 = ReactPriorityLevel.NoWork, OffscreenPriority$1 = ReactPriorityLevel.OffscreenPriority, PerformedWork$1 = ReactTypeOfSideEffect.PerformedWork, Placement$2 = ReactTypeOfSideEffect.Placement, ContentReset$1 = ReactTypeOfSideEffect.ContentReset, Err$1 = ReactTypeOfSideEffect.Err, Ref$1 = ReactTypeOfSideEffect.Ref, ReactCurrentOwner$2 = ReactGlobalSharedState_1.ReactCurrentOwner, ReactFiberBeginWork = function(config, hostContext, hydrationContext, scheduleUpdate, getPriorityContext) {
    var shouldSetTextContent = config.shouldSetTextContent, useSyncScheduling = config.useSyncScheduling, shouldDeprioritizeSubtree = config.shouldDeprioritizeSubtree, pushHostContext = hostContext.pushHostContext, pushHostContainer = hostContext.pushHostContainer, enterHydrationState = hydrationContext.enterHydrationState, resetHydrationState = hydrationContext.resetHydrationState, tryToClaimNextHydratableInstance = hydrationContext.tryToClaimNextHydratableInstance, _ReactFiberClassCompo = ReactFiberClassComponent(scheduleUpdate, getPriorityContext, memoizeProps, memoizeState), adoptClassInstance = _ReactFiberClassCompo.adoptClassInstance, constructClassInstance = _ReactFiberClassCompo.constructClassInstance, mountClassInstance = _ReactFiberClassCompo.mountClassInstance, updateClassInstance = _ReactFiberClassCompo.updateClassInstance;
    function reconcileChildren(current, workInProgress, nextChildren) {
        reconcileChildrenAtPriority(current, workInProgress, nextChildren, workInProgress.pendingWorkPriority);
    }
    function reconcileChildrenAtPriority(current, workInProgress, nextChildren, priorityLevel) {
        null === current ? workInProgress.child = mountChildFibersInPlace(workInProgress, workInProgress.child, nextChildren, priorityLevel) : current.child === workInProgress.child ? workInProgress.child = reconcileChildFibers(workInProgress, workInProgress.child, nextChildren, priorityLevel) : workInProgress.child = reconcileChildFibersInPlace(workInProgress, workInProgress.child, nextChildren, priorityLevel);
    }
    function updateFragment(current, workInProgress) {
        var nextChildren = workInProgress.pendingProps;
        if (hasContextChanged$1()) null === nextChildren && (nextChildren = workInProgress.memoizedProps); else if (null === nextChildren || workInProgress.memoizedProps === nextChildren) return bailoutOnAlreadyFinishedWork(current, workInProgress);
        return reconcileChildren(current, workInProgress, nextChildren), memoizeProps(workInProgress, nextChildren), 
        workInProgress.child;
    }
    function markRef(current, workInProgress) {
        var ref = workInProgress.ref;
        null === ref || current && current.ref === ref || (workInProgress.effectTag |= Ref$1);
    }
    function updateFunctionalComponent(current, workInProgress) {
        var fn = workInProgress.type, nextProps = workInProgress.pendingProps, memoizedProps = workInProgress.memoizedProps;
        if (hasContextChanged$1()) null === nextProps && (nextProps = memoizedProps); else if (null === nextProps || memoizedProps === nextProps) return bailoutOnAlreadyFinishedWork(current, workInProgress);
        var nextChildren, unmaskedContext = getUnmaskedContext$1(workInProgress), context = getMaskedContext$1(workInProgress, unmaskedContext);
        return nextChildren = fn(nextProps, context), workInProgress.effectTag |= PerformedWork$1, 
        reconcileChildren(current, workInProgress, nextChildren), memoizeProps(workInProgress, nextProps), 
        workInProgress.child;
    }
    function updateClassComponent(current, workInProgress, priorityLevel) {
        var hasContext = pushContextProvider$1(workInProgress), shouldUpdate = void 0;
        return null === current ? workInProgress.stateNode ? invariant(!1, "Resuming work not yet implemented.") : (constructClassInstance(workInProgress, workInProgress.pendingProps), 
        mountClassInstance(workInProgress, priorityLevel), shouldUpdate = !0) : shouldUpdate = updateClassInstance(current, workInProgress, priorityLevel), 
        finishClassComponent(current, workInProgress, shouldUpdate, hasContext);
    }
    function finishClassComponent(current, workInProgress, shouldUpdate, hasContext) {
        if (markRef(current, workInProgress), !shouldUpdate) return hasContext && invalidateContextProvider$1(workInProgress, !1), 
        bailoutOnAlreadyFinishedWork(current, workInProgress);
        var instance = workInProgress.stateNode;
        ReactCurrentOwner$2.current = workInProgress;
        var nextChildren = void 0;
        return nextChildren = instance.render(), workInProgress.effectTag |= PerformedWork$1, 
        reconcileChildren(current, workInProgress, nextChildren), memoizeState(workInProgress, instance.state), 
        memoizeProps(workInProgress, instance.props), hasContext && invalidateContextProvider$1(workInProgress, !0), 
        workInProgress.child;
    }
    function updateHostRoot(current, workInProgress, priorityLevel) {
        var root = workInProgress.stateNode;
        root.pendingContext ? pushTopLevelContextObject$1(workInProgress, root.pendingContext, root.pendingContext !== root.context) : root.context && pushTopLevelContextObject$1(workInProgress, root.context, !1), 
        pushHostContainer(workInProgress, root.containerInfo);
        var updateQueue = workInProgress.updateQueue;
        if (null !== updateQueue) {
            var prevState = workInProgress.memoizedState, state = beginUpdateQueue$1(current, workInProgress, updateQueue, null, prevState, null, priorityLevel);
            if (prevState === state) return resetHydrationState(), bailoutOnAlreadyFinishedWork(current, workInProgress);
            var element = state.element;
            return null !== current && null !== current.child || !enterHydrationState(workInProgress) ? (resetHydrationState(), 
            reconcileChildren(current, workInProgress, element)) : (workInProgress.effectTag |= Placement$2, 
            workInProgress.child = mountChildFibersInPlace(workInProgress, workInProgress.child, element, priorityLevel)), 
            memoizeState(workInProgress, state), workInProgress.child;
        }
        return resetHydrationState(), bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
    function updateHostComponent(current, workInProgress, renderPriority) {
        pushHostContext(workInProgress), null === current && tryToClaimNextHydratableInstance(workInProgress);
        var type = workInProgress.type, memoizedProps = workInProgress.memoizedProps, nextProps = workInProgress.pendingProps;
        null === nextProps && (nextProps = memoizedProps, invariant(null !== nextProps, "We should always have pending or current props. This error is " + "likely caused by a bug in React. Please file an issue."));
        var prevProps = null !== current ? current.memoizedProps : null;
        if (hasContextChanged$1()) ; else if (null === nextProps || memoizedProps === nextProps) return bailoutOnAlreadyFinishedWork(current, workInProgress);
        var nextChildren = nextProps.children;
        return shouldSetTextContent(type, nextProps) ? nextChildren = null : prevProps && shouldSetTextContent(type, prevProps) && (workInProgress.effectTag |= ContentReset$1), 
        markRef(current, workInProgress), renderPriority !== OffscreenPriority$1 && !useSyncScheduling && shouldDeprioritizeSubtree(type, nextProps) ? (workInProgress.pendingWorkPriority = OffscreenPriority$1, 
        null) : (reconcileChildren(current, workInProgress, nextChildren), memoizeProps(workInProgress, nextProps), 
        workInProgress.child);
    }
    function updateHostText(current, workInProgress) {
        null === current && tryToClaimNextHydratableInstance(workInProgress);
        var nextProps = workInProgress.pendingProps;
        return null === nextProps && (nextProps = workInProgress.memoizedProps), memoizeProps(workInProgress, nextProps), 
        null;
    }
    function mountIndeterminateComponent(current, workInProgress, priorityLevel) {
        invariant(null === current, "An indeterminate component should never have mounted. This error is " + "likely caused by a bug in React. Please file an issue.");
        var value, fn = workInProgress.type, props = workInProgress.pendingProps, unmaskedContext = getUnmaskedContext$1(workInProgress), context = getMaskedContext$1(workInProgress, unmaskedContext);
        if (value = fn(props, context), workInProgress.effectTag |= PerformedWork$1, "object" == typeof value && null !== value && "function" == typeof value.render) {
            workInProgress.tag = ClassComponent$6;
            var hasContext = pushContextProvider$1(workInProgress);
            return adoptClassInstance(workInProgress, value), mountClassInstance(workInProgress, priorityLevel), 
            finishClassComponent(current, workInProgress, !0, hasContext);
        }
        return workInProgress.tag = FunctionalComponent$1, reconcileChildren(current, workInProgress, value), 
        memoizeProps(workInProgress, props), workInProgress.child;
    }
    function updateCoroutineComponent(current, workInProgress) {
        var nextCoroutine = workInProgress.pendingProps;
        hasContextChanged$1() ? null === nextCoroutine && (nextCoroutine = current && current.memoizedProps, 
        invariant(null !== nextCoroutine, "We should always have pending or current props. This error is " + "likely caused by a bug in React. Please file an issue.")) : null !== nextCoroutine && workInProgress.memoizedProps !== nextCoroutine || (nextCoroutine = workInProgress.memoizedProps);
        var nextChildren = nextCoroutine.children, priorityLevel = workInProgress.pendingWorkPriority;
        return null === current ? workInProgress.stateNode = mountChildFibersInPlace(workInProgress, workInProgress.stateNode, nextChildren, priorityLevel) : current.child === workInProgress.child ? workInProgress.stateNode = reconcileChildFibers(workInProgress, workInProgress.stateNode, nextChildren, priorityLevel) : workInProgress.stateNode = reconcileChildFibersInPlace(workInProgress, workInProgress.stateNode, nextChildren, priorityLevel), 
        memoizeProps(workInProgress, nextCoroutine), workInProgress.stateNode;
    }
    function updatePortalComponent(current, workInProgress) {
        pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
        var priorityLevel = workInProgress.pendingWorkPriority, nextChildren = workInProgress.pendingProps;
        if (hasContextChanged$1()) null === nextChildren && (nextChildren = current && current.memoizedProps, 
        invariant(null != nextChildren, "We should always have pending or current props. This error is " + "likely caused by a bug in React. Please file an issue.")); else if (null === nextChildren || workInProgress.memoizedProps === nextChildren) return bailoutOnAlreadyFinishedWork(current, workInProgress);
        return null === current ? (workInProgress.child = reconcileChildFibersInPlace(workInProgress, workInProgress.child, nextChildren, priorityLevel), 
        memoizeProps(workInProgress, nextChildren)) : (reconcileChildren(current, workInProgress, nextChildren), 
        memoizeProps(workInProgress, nextChildren)), workInProgress.child;
    }
    function bailoutOnAlreadyFinishedWork(current, workInProgress) {
        return cloneChildFibers(current, workInProgress), workInProgress.child;
    }
    function bailoutOnLowPriority(current, workInProgress) {
        switch (workInProgress.tag) {
          case ClassComponent$6:
            pushContextProvider$1(workInProgress);
            break;

          case HostPortal$3:
            pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
        }
        return null;
    }
    function memoizeProps(workInProgress, nextProps) {
        workInProgress.memoizedProps = nextProps;
    }
    function memoizeState(workInProgress, nextState) {
        workInProgress.memoizedState = nextState;
    }
    function beginWork(current, workInProgress, priorityLevel) {
        if (workInProgress.pendingWorkPriority === NoWork$3 || workInProgress.pendingWorkPriority > priorityLevel) return bailoutOnLowPriority(current, workInProgress);
        switch (workInProgress.tag) {
          case IndeterminateComponent$2:
            return mountIndeterminateComponent(current, workInProgress, priorityLevel);

          case FunctionalComponent$1:
            return updateFunctionalComponent(current, workInProgress);

          case ClassComponent$6:
            return updateClassComponent(current, workInProgress, priorityLevel);

          case HostRoot$5:
            return updateHostRoot(current, workInProgress, priorityLevel);

          case HostComponent$5:
            return updateHostComponent(current, workInProgress, priorityLevel);

          case HostText$2:
            return updateHostText(current, workInProgress);

          case CoroutineHandlerPhase:
            workInProgress.tag = CoroutineComponent$1;

          case CoroutineComponent$1:
            return updateCoroutineComponent(current, workInProgress);

          case YieldComponent$1:
            return null;

          case HostPortal$3:
            return updatePortalComponent(current, workInProgress);

          case Fragment$1:
            return updateFragment(current, workInProgress);

          default:
            invariant(!1, "Unknown unit of work tag. This error is likely caused by a bug in " + "React. Please file an issue.");
        }
    }
    function beginFailedWork(current, workInProgress, priorityLevel) {
        switch (workInProgress.tag) {
          case ClassComponent$6:
            pushContextProvider$1(workInProgress);
            break;

          case HostRoot$5:
            var root = workInProgress.stateNode;
            pushHostContainer(workInProgress, root.containerInfo);
            break;

          default:
            invariant(!1, "Invalid type of work. This error is likely caused by a bug in React. " + "Please file an issue.");
        }
        if (workInProgress.effectTag |= Err$1, null === current ? workInProgress.child = null : workInProgress.child !== current.child && (workInProgress.child = current.child), 
        workInProgress.pendingWorkPriority === NoWork$3 || workInProgress.pendingWorkPriority > priorityLevel) return bailoutOnLowPriority(current, workInProgress);
        if (workInProgress.firstEffect = null, workInProgress.lastEffect = null, reconcileChildrenAtPriority(current, workInProgress, null, priorityLevel), 
        workInProgress.tag === ClassComponent$6) {
            var instance = workInProgress.stateNode;
            workInProgress.memoizedProps = instance.props, workInProgress.memoizedState = instance.state;
        }
        return workInProgress.child;
    }
    return {
        beginWork: beginWork,
        beginFailedWork: beginFailedWork
    };
}, reconcileChildFibers$2 = ReactChildFiber.reconcileChildFibers, popContextProvider$2 = ReactFiberContext.popContextProvider, IndeterminateComponent$3 = ReactTypeOfWork.IndeterminateComponent, FunctionalComponent$3 = ReactTypeOfWork.FunctionalComponent, ClassComponent$8 = ReactTypeOfWork.ClassComponent, HostRoot$6 = ReactTypeOfWork.HostRoot, HostComponent$6 = ReactTypeOfWork.HostComponent, HostText$4 = ReactTypeOfWork.HostText, HostPortal$5 = ReactTypeOfWork.HostPortal, CoroutineComponent$3 = ReactTypeOfWork.CoroutineComponent, CoroutineHandlerPhase$1 = ReactTypeOfWork.CoroutineHandlerPhase, YieldComponent$3 = ReactTypeOfWork.YieldComponent, Fragment$3 = ReactTypeOfWork.Fragment, Placement$4 = ReactTypeOfSideEffect.Placement, Ref$2 = ReactTypeOfSideEffect.Ref, Update$2 = ReactTypeOfSideEffect.Update, OffscreenPriority$2 = ReactPriorityLevel.OffscreenPriority, ReactFiberCompleteWork = function(config, hostContext, hydrationContext) {
    var createInstance = config.createInstance, createTextInstance = config.createTextInstance, appendInitialChild = config.appendInitialChild, finalizeInitialChildren = config.finalizeInitialChildren, prepareUpdate = config.prepareUpdate, getRootHostContainer = hostContext.getRootHostContainer, popHostContext = hostContext.popHostContext, getHostContext = hostContext.getHostContext, popHostContainer = hostContext.popHostContainer, prepareToHydrateHostInstance = hydrationContext.prepareToHydrateHostInstance, prepareToHydrateHostTextInstance = hydrationContext.prepareToHydrateHostTextInstance, popHydrationState = hydrationContext.popHydrationState;
    function markUpdate(workInProgress) {
        workInProgress.effectTag |= Update$2;
    }
    function markRef(workInProgress) {
        workInProgress.effectTag |= Ref$2;
    }
    function appendAllYields(yields, workInProgress) {
        var node = workInProgress.stateNode;
        for (node && (node.return = workInProgress); null !== node; ) {
            if (node.tag === HostComponent$6 || node.tag === HostText$4 || node.tag === HostPortal$5) invariant(!1, "A coroutine cannot have host component children."); else if (node.tag === YieldComponent$3) yields.push(node.type); else if (null !== node.child) {
                node.child.return = node, node = node.child;
                continue;
            }
            for (;null === node.sibling; ) {
                if (null === node.return || node.return === workInProgress) return;
                node = node.return;
            }
            node.sibling.return = node.return, node = node.sibling;
        }
    }
    function moveCoroutineToHandlerPhase(current, workInProgress) {
        var coroutine = workInProgress.memoizedProps;
        invariant(coroutine, "Should be resolved by now. This error is likely caused by a bug in " + "React. Please file an issue."), 
        workInProgress.tag = CoroutineHandlerPhase$1;
        var yields = [];
        appendAllYields(yields, workInProgress);
        var fn = coroutine.handler, props = coroutine.props, nextChildren = fn(props, yields), currentFirstChild = null !== current ? current.child : null, priority = workInProgress.pendingWorkPriority;
        return workInProgress.child = reconcileChildFibers$2(workInProgress, currentFirstChild, nextChildren, priority), 
        workInProgress.child;
    }
    function appendAllChildren(parent, workInProgress) {
        for (var node = workInProgress.child; null !== node; ) {
            if (node.tag === HostComponent$6 || node.tag === HostText$4) appendInitialChild(parent, node.stateNode); else if (node.tag === HostPortal$5) ; else if (null !== node.child) {
                node = node.child;
                continue;
            }
            if (node === workInProgress) return;
            for (;null === node.sibling; ) {
                if (null === node.return || node.return === workInProgress) return;
                node = node.return;
            }
            node = node.sibling;
        }
    }
    function completeWork(current, workInProgress, renderPriority) {
        var newProps = workInProgress.pendingProps;
        switch (null === newProps ? newProps = workInProgress.memoizedProps : workInProgress.pendingWorkPriority === OffscreenPriority$2 && renderPriority !== OffscreenPriority$2 || (workInProgress.pendingProps = null), 
        workInProgress.tag) {
          case FunctionalComponent$3:
            return null;

          case ClassComponent$8:
            return popContextProvider$2(workInProgress), null;

          case HostRoot$6:
            var fiberRoot = workInProgress.stateNode;
            return fiberRoot.pendingContext && (fiberRoot.context = fiberRoot.pendingContext, 
            fiberRoot.pendingContext = null), null !== current && null !== current.child || (popHydrationState(workInProgress), 
            workInProgress.effectTag &= ~Placement$4), null;

          case HostComponent$6:
            popHostContext(workInProgress);
            var rootContainerInstance = getRootHostContainer(), type = workInProgress.type;
            if (null !== current && null != workInProgress.stateNode) {
                var oldProps = current.memoizedProps, instance = workInProgress.stateNode, currentHostContext = getHostContext(), updatePayload = prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, currentHostContext);
                workInProgress.updateQueue = updatePayload, updatePayload && markUpdate(workInProgress), 
                current.ref !== workInProgress.ref && markRef(workInProgress);
            } else {
                if (!newProps) return invariant(null !== workInProgress.stateNode, "We must have new props for new mounts. This error is likely " + "caused by a bug in React. Please file an issue."), 
                null;
                var _currentHostContext = getHostContext();
                if (popHydrationState(workInProgress)) prepareToHydrateHostInstance(workInProgress, rootContainerInstance) && markUpdate(workInProgress); else {
                    var _instance = createInstance(type, newProps, rootContainerInstance, _currentHostContext, workInProgress);
                    appendAllChildren(_instance, workInProgress), finalizeInitialChildren(_instance, type, newProps, rootContainerInstance) && markUpdate(workInProgress), 
                    workInProgress.stateNode = _instance;
                }
                null !== workInProgress.ref && markRef(workInProgress);
            }
            return null;

          case HostText$4:
            var newText = newProps;
            if (current && null != workInProgress.stateNode) {
                current.memoizedProps !== newText && markUpdate(workInProgress);
            } else {
                if ("string" != typeof newText) return invariant(null !== workInProgress.stateNode, "We must have new props for new mounts. This error is likely " + "caused by a bug in React. Please file an issue."), 
                null;
                var _rootContainerInstance = getRootHostContainer(), _currentHostContext2 = getHostContext();
                popHydrationState(workInProgress) ? prepareToHydrateHostTextInstance(workInProgress) && markUpdate(workInProgress) : workInProgress.stateNode = createTextInstance(newText, _rootContainerInstance, _currentHostContext2, workInProgress);
            }
            return null;

          case CoroutineComponent$3:
            return moveCoroutineToHandlerPhase(current, workInProgress);

          case CoroutineHandlerPhase$1:
            return workInProgress.tag = CoroutineComponent$3, null;

          case YieldComponent$3:
          case Fragment$3:
            return null;

          case HostPortal$5:
            return markUpdate(workInProgress), popHostContainer(workInProgress), null;

          case IndeterminateComponent$3:
            invariant(!1, "An indeterminate component should have become determinate before " + "completing. This error is likely caused by a bug in React. Please " + "file an issue.");

          default:
            invariant(!1, "Unknown unit of work tag. This error is likely caused by a bug in " + "React. Please file an issue.");
        }
    }
    return {
        completeWork: completeWork
    };
}, warning$11, onCommitFiberRoot = null, onCommitFiberUnmount = null, hasLoggedError = !1;

function catchErrors(fn) {
    return function(arg) {
        try {
            return fn(arg);
        } catch (err) {
            1 || hasLoggedError || (hasLoggedError = !0, warning$11(!1, "React DevTools encountered an error: %s", err));
        }
    };
}

function injectInternals$1(internals) {
    if ("undefined" == typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) return !1;
    var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook.supportsFiber) return !0;
    try {
        var rendererID = hook.inject(internals);
        onCommitFiberRoot = catchErrors(function(root) {
            return hook.onCommitFiberRoot(rendererID, root);
        }), onCommitFiberUnmount = catchErrors(function(fiber) {
            return hook.onCommitFiberUnmount(rendererID, fiber);
        });
    } catch (err) {}
    return !0;
}

function onCommitRoot$1(root) {
    "function" == typeof onCommitFiberRoot && onCommitFiberRoot(root);
}

function onCommitUnmount$1(fiber) {
    "function" == typeof onCommitFiberUnmount && onCommitFiberUnmount(fiber);
}

var injectInternals_1 = injectInternals$1, onCommitRoot_1 = onCommitRoot$1, onCommitUnmount_1 = onCommitUnmount$1, ReactFiberDevToolsHook = {
    injectInternals: injectInternals_1,
    onCommitRoot: onCommitRoot_1,
    onCommitUnmount: onCommitUnmount_1
}, ClassComponent$9 = ReactTypeOfWork.ClassComponent, HostRoot$7 = ReactTypeOfWork.HostRoot, HostComponent$7 = ReactTypeOfWork.HostComponent, HostText$5 = ReactTypeOfWork.HostText, HostPortal$6 = ReactTypeOfWork.HostPortal, CoroutineComponent$4 = ReactTypeOfWork.CoroutineComponent, commitCallbacks$1 = ReactFiberUpdateQueue.commitCallbacks, onCommitUnmount = ReactFiberDevToolsHook.onCommitUnmount, Placement$5 = ReactTypeOfSideEffect.Placement, Update$3 = ReactTypeOfSideEffect.Update, Callback$1 = ReactTypeOfSideEffect.Callback, ContentReset$2 = ReactTypeOfSideEffect.ContentReset, ReactFiberCommitWork = function(config, captureError) {
    var commitMount = config.commitMount, commitUpdate = config.commitUpdate, resetTextContent = config.resetTextContent, commitTextUpdate = config.commitTextUpdate, appendChild = config.appendChild, appendChildToContainer = config.appendChildToContainer, insertBefore = config.insertBefore, insertInContainerBefore = config.insertInContainerBefore, removeChild = config.removeChild, removeChildFromContainer = config.removeChildFromContainer, getPublicInstance = config.getPublicInstance;
    function safelyCallComponentWillUnmount(current, instance) {
        try {
            instance.componentWillUnmount();
        } catch (unmountError) {
            captureError(current, unmountError);
        }
    }
    function safelyDetachRef(current) {
        var ref = current.ref;
        if (null !== ref) {
            try {
                ref(null);
            } catch (refError) {
                captureError(current, refError);
            }
        }
    }
    function getHostParentFiber(fiber) {
        for (var parent = fiber.return; null !== parent; ) {
            if (isHostParent(parent)) return parent;
            parent = parent.return;
        }
        invariant(!1, "Expected to find a host parent. This error is likely caused by a bug " + "in React. Please file an issue.");
    }
    function isHostParent(fiber) {
        return fiber.tag === HostComponent$7 || fiber.tag === HostRoot$7 || fiber.tag === HostPortal$6;
    }
    function getHostSibling(fiber) {
        var node = fiber;
        siblings: for (;!0; ) {
            for (;null === node.sibling; ) {
                if (null === node.return || isHostParent(node.return)) return null;
                node = node.return;
            }
            for (node.sibling.return = node.return, node = node.sibling; node.tag !== HostComponent$7 && node.tag !== HostText$5; ) {
                if (node.effectTag & Placement$5) continue siblings;
                if (null === node.child || node.tag === HostPortal$6) continue siblings;
                node.child.return = node, node = node.child;
            }
            if (!(node.effectTag & Placement$5)) return node.stateNode;
        }
    }
    function commitPlacement(finishedWork) {
        var parentFiber = getHostParentFiber(finishedWork), parent = void 0, isContainer = void 0;
        switch (parentFiber.tag) {
          case HostComponent$7:
            parent = parentFiber.stateNode, isContainer = !1;
            break;

          case HostRoot$7:
          case HostPortal$6:
            parent = parentFiber.stateNode.containerInfo, isContainer = !0;
            break;

          default:
            invariant(!1, "Invalid host parent fiber. This error is likely caused by a bug " + "in React. Please file an issue.");
        }
        parentFiber.effectTag & ContentReset$2 && (resetTextContent(parent), parentFiber.effectTag &= ~ContentReset$2);
        for (var before = getHostSibling(finishedWork), node = finishedWork; !0; ) {
            if (node.tag === HostComponent$7 || node.tag === HostText$5) before ? isContainer ? insertInContainerBefore(parent, node.stateNode, before) : insertBefore(parent, node.stateNode, before) : isContainer ? appendChildToContainer(parent, node.stateNode) : appendChild(parent, node.stateNode); else if (node.tag === HostPortal$6) ; else if (null !== node.child) {
                node.child.return = node, node = node.child;
                continue;
            }
            if (node === finishedWork) return;
            for (;null === node.sibling; ) {
                if (null === node.return || node.return === finishedWork) return;
                node = node.return;
            }
            node.sibling.return = node.return, node = node.sibling;
        }
    }
    function commitNestedUnmounts(root) {
        for (var node = root; !0; ) if (commitUnmount(node), null === node.child || node.tag === HostPortal$6) {
            if (node === root) return;
            for (;null === node.sibling; ) {
                if (null === node.return || node.return === root) return;
                node = node.return;
            }
            node.sibling.return = node.return, node = node.sibling;
        } else node.child.return = node, node = node.child;
    }
    function unmountHostComponents(current) {
        for (var node = current, currentParentIsValid = !1, currentParent = void 0, currentParentIsContainer = void 0; !0; ) {
            if (!currentParentIsValid) {
                var parent = node.return;
                findParent: for (;!0; ) {
                    switch (invariant(null !== parent, "Expected to find a host parent. This error is likely caused by " + "a bug in React. Please file an issue."), 
                    parent.tag) {
                      case HostComponent$7:
                        currentParent = parent.stateNode, currentParentIsContainer = !1;
                        break findParent;

                      case HostRoot$7:
                      case HostPortal$6:
                        currentParent = parent.stateNode.containerInfo, currentParentIsContainer = !0;
                        break findParent;
                    }
                    parent = parent.return;
                }
                currentParentIsValid = !0;
            }
            if (node.tag === HostComponent$7 || node.tag === HostText$5) commitNestedUnmounts(node), 
            currentParentIsContainer ? removeChildFromContainer(currentParent, node.stateNode) : removeChild(currentParent, node.stateNode); else if (node.tag === HostPortal$6) {
                if (currentParent = node.stateNode.containerInfo, null !== node.child) {
                    node.child.return = node, node = node.child;
                    continue;
                }
            } else if (commitUnmount(node), null !== node.child) {
                node.child.return = node, node = node.child;
                continue;
            }
            if (node === current) return;
            for (;null === node.sibling; ) {
                if (null === node.return || node.return === current) return;
                node = node.return, node.tag === HostPortal$6 && (currentParentIsValid = !1);
            }
            node.sibling.return = node.return, node = node.sibling;
        }
    }
    function commitDeletion(current) {
        unmountHostComponents(current), current.return = null, current.child = null, current.alternate && (current.alternate.child = null, 
        current.alternate.return = null);
    }
    function commitUnmount(current) {
        switch ("function" == typeof onCommitUnmount && onCommitUnmount(current), current.tag) {
          case ClassComponent$9:
            safelyDetachRef(current);
            var instance = current.stateNode;
            return void ("function" == typeof instance.componentWillUnmount && safelyCallComponentWillUnmount(current, instance));

          case HostComponent$7:
            return void safelyDetachRef(current);

          case CoroutineComponent$4:
            return void commitNestedUnmounts(current.stateNode);

          case HostPortal$6:
            return void unmountHostComponents(current);
        }
    }
    function commitWork(current, finishedWork) {
        switch (finishedWork.tag) {
          case ClassComponent$9:
            return;

          case HostComponent$7:
            var instance = finishedWork.stateNode;
            if (null != instance) {
                var newProps = finishedWork.memoizedProps, oldProps = null !== current ? current.memoizedProps : newProps, type = finishedWork.type, updatePayload = finishedWork.updateQueue;
                finishedWork.updateQueue = null, null !== updatePayload && commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork);
            }
            return;

          case HostText$5:
            invariant(null !== finishedWork.stateNode, "This should have a text node initialized. This error is likely " + "caused by a bug in React. Please file an issue.");
            var textInstance = finishedWork.stateNode, newText = finishedWork.memoizedProps, oldText = null !== current ? current.memoizedProps : newText;
            return void commitTextUpdate(textInstance, oldText, newText);

          case HostRoot$7:
          case HostPortal$6:
            return;

          default:
            invariant(!1, "This unit of work tag should not have side-effects. This error is " + "likely caused by a bug in React. Please file an issue.");
        }
    }
    function commitLifeCycles(current, finishedWork) {
        switch (finishedWork.tag) {
          case ClassComponent$9:
            var instance = finishedWork.stateNode;
            if (finishedWork.effectTag & Update$3) if (null === current) instance.componentDidMount(); else {
                var prevProps = current.memoizedProps, prevState = current.memoizedState;
                instance.componentDidUpdate(prevProps, prevState);
            }
            return void (finishedWork.effectTag & Callback$1 && null !== finishedWork.updateQueue && commitCallbacks$1(finishedWork, finishedWork.updateQueue, instance));

          case HostRoot$7:
            var updateQueue = finishedWork.updateQueue;
            if (null !== updateQueue) {
                var _instance = finishedWork.child && finishedWork.child.stateNode;
                commitCallbacks$1(finishedWork, updateQueue, _instance);
            }
            return;

          case HostComponent$7:
            var _instance2 = finishedWork.stateNode;
            if (null === current && finishedWork.effectTag & Update$3) {
                var type = finishedWork.type, props = finishedWork.memoizedProps;
                commitMount(_instance2, type, props, finishedWork);
            }
            return;

          case HostText$5:
          case HostPortal$6:
            return;

          default:
            invariant(!1, "This unit of work tag should not have side-effects. This error is " + "likely caused by a bug in React. Please file an issue.");
        }
    }
    function commitAttachRef(finishedWork) {
        var ref = finishedWork.ref;
        if (null !== ref) {
            var instance = finishedWork.stateNode;
            switch (finishedWork.tag) {
              case HostComponent$7:
                ref(getPublicInstance(instance));
                break;

              default:
                ref(instance);
            }
        }
    }
    function commitDetachRef(current) {
        var currentRef = current.ref;
        null !== currentRef && currentRef(null);
    }
    return {
        commitPlacement: commitPlacement,
        commitDeletion: commitDeletion,
        commitWork: commitWork,
        commitLifeCycles: commitLifeCycles,
        commitAttachRef: commitAttachRef,
        commitDetachRef: commitDetachRef
    };
}, createCursor$2 = ReactFiberStack.createCursor, pop$2 = ReactFiberStack.pop, push$2 = ReactFiberStack.push, NO_CONTEXT = {}, ReactFiberHostContext = function(config) {
    var getChildHostContext = config.getChildHostContext, getRootHostContext = config.getRootHostContext, contextStackCursor = createCursor$2(NO_CONTEXT), contextFiberStackCursor = createCursor$2(NO_CONTEXT), rootInstanceStackCursor = createCursor$2(NO_CONTEXT);
    function requiredContext(c) {
        return invariant(c !== NO_CONTEXT, "Expected host context to exist. This error is likely caused by a bug " + "in React. Please file an issue."), 
        c;
    }
    function getRootHostContainer() {
        return requiredContext(rootInstanceStackCursor.current);
    }
    function pushHostContainer(fiber, nextRootInstance) {
        push$2(rootInstanceStackCursor, nextRootInstance, fiber);
        var nextRootContext = getRootHostContext(nextRootInstance);
        push$2(contextFiberStackCursor, fiber, fiber), push$2(contextStackCursor, nextRootContext, fiber);
    }
    function popHostContainer(fiber) {
        pop$2(contextStackCursor, fiber), pop$2(contextFiberStackCursor, fiber), pop$2(rootInstanceStackCursor, fiber);
    }
    function getHostContext() {
        return requiredContext(contextStackCursor.current);
    }
    function pushHostContext(fiber) {
        var rootInstance = requiredContext(rootInstanceStackCursor.current), context = requiredContext(contextStackCursor.current), nextContext = getChildHostContext(context, fiber.type, rootInstance);
        context !== nextContext && (push$2(contextFiberStackCursor, fiber, fiber), push$2(contextStackCursor, nextContext, fiber));
    }
    function popHostContext(fiber) {
        contextFiberStackCursor.current === fiber && (pop$2(contextStackCursor, fiber), 
        pop$2(contextFiberStackCursor, fiber));
    }
    function resetHostContainer() {
        contextStackCursor.current = NO_CONTEXT, rootInstanceStackCursor.current = NO_CONTEXT;
    }
    return {
        getHostContext: getHostContext,
        getRootHostContainer: getRootHostContainer,
        popHostContainer: popHostContainer,
        popHostContext: popHostContext,
        pushHostContainer: pushHostContainer,
        pushHostContext: pushHostContext,
        resetHostContainer: resetHostContainer
    };
}, HostComponent$8 = ReactTypeOfWork.HostComponent, HostText$6 = ReactTypeOfWork.HostText, HostRoot$8 = ReactTypeOfWork.HostRoot, Deletion$2 = ReactTypeOfSideEffect.Deletion, Placement$6 = ReactTypeOfSideEffect.Placement, createFiberFromHostInstanceForDeletion$1 = ReactFiber.createFiberFromHostInstanceForDeletion, ReactFiberHydrationContext = function(config) {
    var shouldSetTextContent = config.shouldSetTextContent, canHydrateInstance = config.canHydrateInstance, canHydrateTextInstance = config.canHydrateTextInstance, getNextHydratableSibling = config.getNextHydratableSibling, getFirstHydratableChild = config.getFirstHydratableChild, hydrateInstance = config.hydrateInstance, hydrateTextInstance = config.hydrateTextInstance, didNotHydrateInstance = config.didNotHydrateInstance, didNotFindHydratableInstance = config.didNotFindHydratableInstance, didNotFindHydratableTextInstance = config.didNotFindHydratableTextInstance;
    if (!(canHydrateInstance && canHydrateTextInstance && getNextHydratableSibling && getFirstHydratableChild && hydrateInstance && hydrateTextInstance && didNotHydrateInstance && didNotFindHydratableInstance && didNotFindHydratableTextInstance)) return {
        enterHydrationState: function() {
            return !1;
        },
        resetHydrationState: function() {},
        tryToClaimNextHydratableInstance: function() {},
        prepareToHydrateHostInstance: function() {
            invariant(!1, "Expected prepareToHydrateHostInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue.");
        },
        prepareToHydrateHostTextInstance: function() {
            invariant(!1, "Expected prepareToHydrateHostTextInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue.");
        },
        popHydrationState: function(fiber) {
            return !1;
        }
    };
    var hydrationParentFiber = null, nextHydratableInstance = null, isHydrating = !1;
    function enterHydrationState(fiber) {
        var parentInstance = fiber.stateNode.containerInfo;
        return nextHydratableInstance = getFirstHydratableChild(parentInstance), hydrationParentFiber = fiber, 
        isHydrating = !0, !0;
    }
    function deleteHydratableInstance(returnFiber, instance) {
        var childToDelete = createFiberFromHostInstanceForDeletion$1();
        childToDelete.stateNode = instance, childToDelete.return = returnFiber, childToDelete.effectTag = Deletion$2, 
        null !== returnFiber.lastEffect ? (returnFiber.lastEffect.nextEffect = childToDelete, 
        returnFiber.lastEffect = childToDelete) : returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
    }
    function insertNonHydratedInstance(returnFiber, fiber) {
        fiber.effectTag |= Placement$6;
    }
    function canHydrate(fiber, nextInstance) {
        switch (fiber.tag) {
          case HostComponent$8:
            var type = fiber.type, props = fiber.pendingProps;
            return canHydrateInstance(nextInstance, type, props);

          case HostText$6:
            var text = fiber.pendingProps;
            return canHydrateTextInstance(nextInstance, text);

          default:
            return !1;
        }
    }
    function tryToClaimNextHydratableInstance(fiber) {
        if (isHydrating) {
            var nextInstance = nextHydratableInstance;
            if (!nextInstance) return insertNonHydratedInstance(hydrationParentFiber, fiber), 
            isHydrating = !1, void (hydrationParentFiber = fiber);
            if (!canHydrate(fiber, nextInstance)) {
                if (!(nextInstance = getNextHydratableSibling(nextInstance)) || !canHydrate(fiber, nextInstance)) return insertNonHydratedInstance(hydrationParentFiber, fiber), 
                isHydrating = !1, void (hydrationParentFiber = fiber);
                deleteHydratableInstance(hydrationParentFiber, nextHydratableInstance);
            }
            fiber.stateNode = nextInstance, hydrationParentFiber = fiber, nextHydratableInstance = getFirstHydratableChild(nextInstance);
        }
    }
    function prepareToHydrateHostInstance(fiber, rootContainerInstance) {
        var instance = fiber.stateNode, updatePayload = hydrateInstance(instance, fiber.type, fiber.memoizedProps, rootContainerInstance, fiber);
        return fiber.updateQueue = updatePayload, null !== updatePayload;
    }
    function prepareToHydrateHostTextInstance(fiber) {
        var textInstance = fiber.stateNode;
        return hydrateTextInstance(textInstance, fiber.memoizedProps, fiber);
    }
    function popToNextHostParent(fiber) {
        for (var parent = fiber.return; null !== parent && parent.tag !== HostComponent$8 && parent.tag !== HostRoot$8; ) parent = parent.return;
        hydrationParentFiber = parent;
    }
    function popHydrationState(fiber) {
        if (fiber !== hydrationParentFiber) return !1;
        if (!isHydrating) return popToNextHostParent(fiber), isHydrating = !0, !1;
        var type = fiber.type;
        if (fiber.tag !== HostComponent$8 || "head" !== type && "body" !== type && !shouldSetTextContent(type, fiber.memoizedProps)) for (var nextInstance = nextHydratableInstance; nextInstance; ) deleteHydratableInstance(fiber, nextInstance), 
        nextInstance = getNextHydratableSibling(nextInstance);
        return popToNextHostParent(fiber), nextHydratableInstance = hydrationParentFiber ? getNextHydratableSibling(fiber.stateNode) : null, 
        !0;
    }
    function resetHydrationState() {
        hydrationParentFiber = null, nextHydratableInstance = null, isHydrating = !1;
    }
    return {
        enterHydrationState: enterHydrationState,
        resetHydrationState: resetHydrationState,
        tryToClaimNextHydratableInstance: tryToClaimNextHydratableInstance,
        prepareToHydrateHostInstance: prepareToHydrateHostInstance,
        prepareToHydrateHostTextInstance: prepareToHydrateHostTextInstance,
        popHydrationState: popHydrationState
    };
}, popContextProvider$1 = ReactFiberContext.popContextProvider, reset$1 = ReactFiberStack.reset, getStackAddendumByWorkInProgressFiber = ReactFiberComponentTreeHook.getStackAddendumByWorkInProgressFiber, logCapturedError$1 = ReactFiberErrorLogger.logCapturedError, ReactCurrentOwner$1 = ReactGlobalSharedState_1.ReactCurrentOwner, createWorkInProgress$1 = ReactFiber.createWorkInProgress, largerPriority$1 = ReactFiber.largerPriority, onCommitRoot = ReactFiberDevToolsHook.onCommitRoot, NoWork$2 = ReactPriorityLevel.NoWork, SynchronousPriority$1 = ReactPriorityLevel.SynchronousPriority, TaskPriority$1 = ReactPriorityLevel.TaskPriority, HighPriority = ReactPriorityLevel.HighPriority, LowPriority = ReactPriorityLevel.LowPriority, OffscreenPriority = ReactPriorityLevel.OffscreenPriority, AsyncUpdates = ReactTypeOfInternalContext.AsyncUpdates, PerformedWork = ReactTypeOfSideEffect.PerformedWork, Placement$1 = ReactTypeOfSideEffect.Placement, Update = ReactTypeOfSideEffect.Update, PlacementAndUpdate = ReactTypeOfSideEffect.PlacementAndUpdate, Deletion = ReactTypeOfSideEffect.Deletion, ContentReset = ReactTypeOfSideEffect.ContentReset, Callback = ReactTypeOfSideEffect.Callback, Err = ReactTypeOfSideEffect.Err, Ref = ReactTypeOfSideEffect.Ref, HostRoot$4 = ReactTypeOfWork.HostRoot, HostComponent$3 = ReactTypeOfWork.HostComponent, HostPortal$2 = ReactTypeOfWork.HostPortal, ClassComponent$4 = ReactTypeOfWork.ClassComponent, getUpdatePriority$1 = ReactFiberUpdateQueue.getUpdatePriority, _require14 = ReactFiberContext, resetContext$1 = _require14.resetContext, ReactFiberInstrumentation$1, timeHeuristicForUnitOfWork = 1, ReactFiberScheduler = function(config) {
    var hostContext = ReactFiberHostContext(config), hydrationContext = ReactFiberHydrationContext(config), popHostContainer = hostContext.popHostContainer, popHostContext = hostContext.popHostContext, resetHostContainer = hostContext.resetHostContainer, _ReactFiberBeginWork = ReactFiberBeginWork(config, hostContext, hydrationContext, scheduleUpdate, getPriorityContext), beginWork = _ReactFiberBeginWork.beginWork, beginFailedWork = _ReactFiberBeginWork.beginFailedWork, _ReactFiberCompleteWo = ReactFiberCompleteWork(config, hostContext, hydrationContext), completeWork = _ReactFiberCompleteWo.completeWork, _ReactFiberCommitWork = ReactFiberCommitWork(config, captureError), commitPlacement = _ReactFiberCommitWork.commitPlacement, commitDeletion = _ReactFiberCommitWork.commitDeletion, commitWork = _ReactFiberCommitWork.commitWork, commitLifeCycles = _ReactFiberCommitWork.commitLifeCycles, commitAttachRef = _ReactFiberCommitWork.commitAttachRef, commitDetachRef = _ReactFiberCommitWork.commitDetachRef, scheduleDeferredCallback = config.scheduleDeferredCallback, useSyncScheduling = config.useSyncScheduling, prepareForCommit = config.prepareForCommit, resetAfterCommit = config.resetAfterCommit, priorityContext = NoWork$2, isPerformingWork = !1, deadlineHasExpired = !1, isBatchingUpdates = !1, isUnbatchingUpdates = !1, nextUnitOfWork = null, nextPriorityLevel = NoWork$2, nextEffect = null, pendingCommit = null, nextScheduledRoot = null, lastScheduledRoot = null, isCallbackScheduled = !1, capturedErrors = null, failedBoundaries = null, commitPhaseBoundaries = null, firstUncaughtError = null, didFatal = !1, isCommitting = !1, isUnmounting = !1, NESTED_UPDATE_LIMIT = 1e3, nestedUpdateCount = 0;
    function resetContextStack() {
        reset$1(), resetContext$1(), resetHostContainer();
    }
    function resetNextUnitOfWork() {
        for (;null !== nextScheduledRoot && nextScheduledRoot.current.pendingWorkPriority === NoWork$2; ) {
            nextScheduledRoot.isScheduled = !1;
            var next = nextScheduledRoot.nextScheduledRoot;
            if (nextScheduledRoot.nextScheduledRoot = null, nextScheduledRoot === lastScheduledRoot) return nextScheduledRoot = null, 
            lastScheduledRoot = null, nextPriorityLevel = NoWork$2, null;
            nextScheduledRoot = next;
        }
        for (var root = nextScheduledRoot, highestPriorityRoot = null, highestPriorityLevel = NoWork$2; null !== root; ) root.current.pendingWorkPriority !== NoWork$2 && (highestPriorityLevel === NoWork$2 || highestPriorityLevel > root.current.pendingWorkPriority) && (highestPriorityLevel = root.current.pendingWorkPriority, 
        highestPriorityRoot = root), root = root.nextScheduledRoot;
        if (null !== highestPriorityRoot) return nextPriorityLevel = highestPriorityLevel, 
        resetContextStack(), void (nextUnitOfWork = createWorkInProgress$1(highestPriorityRoot.current, highestPriorityLevel));
        nextPriorityLevel = NoWork$2, nextUnitOfWork = null;
    }
    function commitAllHostEffects() {
        for (;null !== nextEffect; ) {
            var effectTag = nextEffect.effectTag;
            if (effectTag & ContentReset && config.resetTextContent(nextEffect.stateNode), effectTag & Ref) {
                var current = nextEffect.alternate;
                null !== current && commitDetachRef(current);
            }
            switch (effectTag & ~(Callback | Err | ContentReset | Ref | PerformedWork)) {
              case Placement$1:
                commitPlacement(nextEffect), nextEffect.effectTag &= ~Placement$1;
                break;

              case PlacementAndUpdate:
                commitPlacement(nextEffect), nextEffect.effectTag &= ~Placement$1;
                var _current = nextEffect.alternate;
                commitWork(_current, nextEffect);
                break;

              case Update:
                var _current2 = nextEffect.alternate;
                commitWork(_current2, nextEffect);
                break;

              case Deletion:
                isUnmounting = !0, commitDeletion(nextEffect), isUnmounting = !1;
            }
            nextEffect = nextEffect.nextEffect;
        }
    }
    function commitAllLifeCycles() {
        for (;null !== nextEffect; ) {
            var effectTag = nextEffect.effectTag;
            if (effectTag & (Update | Callback)) {
                var current = nextEffect.alternate;
                commitLifeCycles(current, nextEffect);
            }
            effectTag & Ref && commitAttachRef(nextEffect), effectTag & Err && commitErrorHandling(nextEffect);
            var next = nextEffect.nextEffect;
            nextEffect.nextEffect = null, nextEffect = next;
        }
    }
    function commitAllWork(finishedWork) {
        isCommitting = !0, pendingCommit = null;
        var root = finishedWork.stateNode;
        invariant(root.current !== finishedWork, "Cannot commit the same tree as before. This is probably a bug " + "related to the return field. This error is likely caused by a bug " + "in React. Please file an issue."), 
        nextPriorityLevel !== SynchronousPriority$1 && nextPriorityLevel !== TaskPriority$1 || nestedUpdateCount++, 
        ReactCurrentOwner$1.current = null;
        var firstEffect = void 0;
        for (finishedWork.effectTag > PerformedWork ? null !== finishedWork.lastEffect ? (finishedWork.lastEffect.nextEffect = finishedWork, 
        firstEffect = finishedWork.firstEffect) : firstEffect = finishedWork : firstEffect = finishedWork.firstEffect, 
        prepareForCommit(), nextEffect = firstEffect; null !== nextEffect; ) {
            var didError = !1, _error = void 0;
            try {
                commitAllHostEffects();
            } catch (e) {
                didError = !0, _error = e;
            }
            didError && (invariant(null !== nextEffect, "Should have next effect. This error is likely caused by a bug " + "in React. Please file an issue."), 
            captureError(nextEffect, _error), null !== nextEffect && (nextEffect = nextEffect.nextEffect));
        }
        for (resetAfterCommit(), root.current = finishedWork, nextEffect = firstEffect; null !== nextEffect; ) {
            var _didError = !1, _error2 = void 0;
            try {
                commitAllLifeCycles();
            } catch (e) {
                _didError = !0, _error2 = e;
            }
            _didError && (invariant(null !== nextEffect, "Should have next effect. This error is likely caused by a bug " + "in React. Please file an issue."), 
            captureError(nextEffect, _error2), null !== nextEffect && (nextEffect = nextEffect.nextEffect));
        }
        isCommitting = !1, "function" == typeof onCommitRoot && onCommitRoot(finishedWork.stateNode), 
        !1 && ReactFiberInstrumentation$1.debugTool && ReactFiberInstrumentation$1.debugTool.onCommitWork(finishedWork), 
        commitPhaseBoundaries && (commitPhaseBoundaries.forEach(scheduleErrorRecovery), 
        commitPhaseBoundaries = null), resetNextUnitOfWork();
    }
    function resetWorkPriority(workInProgress, renderPriority) {
        if (!(workInProgress.pendingWorkPriority !== NoWork$2 && workInProgress.pendingWorkPriority > renderPriority)) {
            for (var newPriority = getUpdatePriority$1(workInProgress), child = workInProgress.child; null !== child; ) newPriority = largerPriority$1(newPriority, child.pendingWorkPriority), 
            child = child.sibling;
            workInProgress.pendingWorkPriority = newPriority;
        }
    }
    function completeUnitOfWork(workInProgress) {
        for (;!0; ) {
            var current = workInProgress.alternate, next = completeWork(current, workInProgress, nextPriorityLevel), returnFiber = workInProgress.return, siblingFiber = workInProgress.sibling;
            if (resetWorkPriority(workInProgress, nextPriorityLevel), null !== next) return !1 && ReactFiberInstrumentation$1.debugTool && ReactFiberInstrumentation$1.debugTool.onCompleteWork(workInProgress), 
            next;
            if (null !== returnFiber) {
                null === returnFiber.firstEffect && (returnFiber.firstEffect = workInProgress.firstEffect), 
                null !== workInProgress.lastEffect && (null !== returnFiber.lastEffect && (returnFiber.lastEffect.nextEffect = workInProgress.firstEffect), 
                returnFiber.lastEffect = workInProgress.lastEffect);
                workInProgress.effectTag > PerformedWork && (null !== returnFiber.lastEffect ? returnFiber.lastEffect.nextEffect = workInProgress : returnFiber.firstEffect = workInProgress, 
                returnFiber.lastEffect = workInProgress);
            }
            if (!1 && ReactFiberInstrumentation$1.debugTool && ReactFiberInstrumentation$1.debugTool.onCompleteWork(workInProgress), 
            null !== siblingFiber) return siblingFiber;
            if (null === returnFiber) return pendingCommit = workInProgress, null;
            workInProgress = returnFiber;
        }
        return null;
    }
    function performUnitOfWork(workInProgress) {
        var current = workInProgress.alternate, next = beginWork(current, workInProgress, nextPriorityLevel);
        return !1 && ReactFiberInstrumentation$1.debugTool && ReactFiberInstrumentation$1.debugTool.onBeginWork(workInProgress), 
        null === next && (next = completeUnitOfWork(workInProgress)), ReactCurrentOwner$1.current = null, 
        next;
    }
    function performFailedUnitOfWork(workInProgress) {
        var current = workInProgress.alternate, next = beginFailedWork(current, workInProgress, nextPriorityLevel);
        return !1 && ReactFiberInstrumentation$1.debugTool && ReactFiberInstrumentation$1.debugTool.onBeginWork(workInProgress), 
        null === next && (next = completeUnitOfWork(workInProgress)), ReactCurrentOwner$1.current = null, 
        next;
    }
    function performDeferredWork(deadline) {
        performWork(OffscreenPriority, deadline);
    }
    function handleCommitPhaseErrors() {
        if (null !== capturedErrors && capturedErrors.size > 0 && nextPriorityLevel === TaskPriority$1) for (;null !== nextUnitOfWork && (null !== (nextUnitOfWork = hasCapturedError(nextUnitOfWork) ? performFailedUnitOfWork(nextUnitOfWork) : performUnitOfWork(nextUnitOfWork)) || (invariant(null !== pendingCommit, "Should have a pending commit. This error is likely caused by " + "a bug in React. Please file an issue."), 
        priorityContext = TaskPriority$1, commitAllWork(pendingCommit), priorityContext = nextPriorityLevel, 
        null !== capturedErrors && 0 !== capturedErrors.size && nextPriorityLevel === TaskPriority$1)); ) ;
    }
    function workLoop(minPriorityLevel, deadline) {
        if (null !== pendingCommit ? (priorityContext = TaskPriority$1, commitAllWork(pendingCommit), 
        handleCommitPhaseErrors()) : null === nextUnitOfWork && resetNextUnitOfWork(), !(nextPriorityLevel === NoWork$2 || nextPriorityLevel > minPriorityLevel)) {
            priorityContext = nextPriorityLevel;
            loop: do {
                if (nextPriorityLevel <= TaskPriority$1) for (;null !== nextUnitOfWork && !(null === (nextUnitOfWork = performUnitOfWork(nextUnitOfWork)) && (invariant(null !== pendingCommit, "Should have a pending commit. This error is likely caused by " + "a bug in React. Please file an issue."), 
                priorityContext = TaskPriority$1, commitAllWork(pendingCommit), priorityContext = nextPriorityLevel, 
                handleCommitPhaseErrors(), nextPriorityLevel === NoWork$2 || nextPriorityLevel > minPriorityLevel || nextPriorityLevel > TaskPriority$1)); ) ; else if (null !== deadline) for (;null !== nextUnitOfWork && !deadlineHasExpired; ) if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
                    if (null === (nextUnitOfWork = performUnitOfWork(nextUnitOfWork))) if (invariant(null !== pendingCommit, "Should have a pending commit. This error is likely caused by " + "a bug in React. Please file an issue."), 
                    deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
                        if (priorityContext = TaskPriority$1, commitAllWork(pendingCommit), priorityContext = nextPriorityLevel, 
                        handleCommitPhaseErrors(), nextPriorityLevel === NoWork$2 || nextPriorityLevel > minPriorityLevel || nextPriorityLevel < HighPriority) break;
                    } else deadlineHasExpired = !0;
                } else deadlineHasExpired = !0;
                switch (nextPriorityLevel) {
                  case SynchronousPriority$1:
                  case TaskPriority$1:
                    if (nextPriorityLevel <= minPriorityLevel) continue loop;
                    break loop;

                  case HighPriority:
                  case LowPriority:
                  case OffscreenPriority:
                    if (null === deadline) break loop;
                    if (!deadlineHasExpired && nextPriorityLevel <= minPriorityLevel) continue loop;
                    break loop;

                  case NoWork$2:
                    break loop;

                  default:
                    invariant(!1, "Switch statement should be exhuastive. " + "This error is likely caused by a bug in React. Please file an issue.");
                }
            } while (!0);
        }
    }
    function performWorkCatchBlock(failedWork, boundary, minPriorityLevel, deadline) {
        unwindContexts(failedWork, boundary), nextUnitOfWork = performFailedUnitOfWork(boundary), 
        workLoop(minPriorityLevel, deadline);
    }
    function performWork(minPriorityLevel, deadline) {
        invariant(!isPerformingWork, "performWork was called recursively. This error is likely caused " + "by a bug in React. Please file an issue."), 
        isPerformingWork = !0, nestedUpdateCount = 0;
        var previousPriorityContext = priorityContext, didError = !1, error = null;
        try {
            workLoop(minPriorityLevel, deadline);
        } catch (e) {
            didError = !0, error = e;
        }
        for (;didError; ) {
            if (didFatal) {
                firstUncaughtError = error;
                break;
            }
            var failedWork = nextUnitOfWork;
            if (null !== failedWork) {
                var boundary = captureError(failedWork, error);
                if (invariant(null !== boundary, "Should have found an error boundary. This error is likely " + "caused by a bug in React. Please file an issue."), 
                !didFatal) {
                    didError = !1, error = null;
                    try {
                        performWorkCatchBlock(failedWork, boundary, minPriorityLevel, deadline), error = null;
                    } catch (e) {
                        didError = !0, error = e;
                        continue;
                    }
                    break;
                }
            } else didFatal = !0;
        }
        priorityContext = previousPriorityContext, null !== deadline && (isCallbackScheduled = !1), 
        nextPriorityLevel > TaskPriority$1 && !isCallbackScheduled && (scheduleDeferredCallback(performDeferredWork), 
        isCallbackScheduled = !0);
        var errorToThrow = firstUncaughtError;
        if (isPerformingWork = !1, deadlineHasExpired = !1, didFatal = !1, firstUncaughtError = null, 
        capturedErrors = null, failedBoundaries = null, null !== errorToThrow) throw errorToThrow;
    }
    function captureError(failedWork, error) {
        ReactCurrentOwner$1.current = null;
        var boundary = null, errorBoundaryFound = !1, willRetry = !1, errorBoundaryName = null;
        if (failedWork.tag === HostRoot$4) boundary = failedWork, isFailedBoundary(failedWork) && (didFatal = !0); else for (var node = failedWork.return; null !== node && null === boundary; ) {
            if (node.tag === ClassComponent$4) {
                var instance = node.stateNode;
                "function" == typeof instance.componentDidCatch && (errorBoundaryFound = !0, errorBoundaryName = getComponentName_1(node), 
                boundary = node, willRetry = !0);
            } else node.tag === HostRoot$4 && (boundary = node);
            if (isFailedBoundary(node)) {
                if (isUnmounting) return null;
                if (null !== commitPhaseBoundaries && (commitPhaseBoundaries.has(node) || null !== node.alternate && commitPhaseBoundaries.has(node.alternate))) return null;
                boundary = null, willRetry = !1;
            }
            node = node.return;
        }
        if (null !== boundary) {
            null === failedBoundaries && (failedBoundaries = new Set()), failedBoundaries.add(boundary);
            var _componentStack = getStackAddendumByWorkInProgressFiber(failedWork), _componentName = getComponentName_1(failedWork);
            null === capturedErrors && (capturedErrors = new Map());
            var capturedError = {
                componentName: _componentName,
                componentStack: _componentStack,
                error: error,
                errorBoundary: errorBoundaryFound ? boundary.stateNode : null,
                errorBoundaryFound: errorBoundaryFound,
                errorBoundaryName: errorBoundaryName,
                willRetry: willRetry
            };
            capturedErrors.set(boundary, capturedError);
            try {
                logCapturedError$1(capturedError);
            } catch (e) {
                console.error(e);
            }
            return isCommitting ? (null === commitPhaseBoundaries && (commitPhaseBoundaries = new Set()), 
            commitPhaseBoundaries.add(boundary)) : scheduleErrorRecovery(boundary), boundary;
        }
        return null === firstUncaughtError && (firstUncaughtError = error), null;
    }
    function hasCapturedError(fiber) {
        return null !== capturedErrors && (capturedErrors.has(fiber) || null !== fiber.alternate && capturedErrors.has(fiber.alternate));
    }
    function isFailedBoundary(fiber) {
        return null !== failedBoundaries && (failedBoundaries.has(fiber) || null !== fiber.alternate && failedBoundaries.has(fiber.alternate));
    }
    function commitErrorHandling(effectfulFiber) {
        var capturedError = void 0;
        switch (null !== capturedErrors && (capturedError = capturedErrors.get(effectfulFiber), 
        capturedErrors.delete(effectfulFiber), null == capturedError && null !== effectfulFiber.alternate && (effectfulFiber = effectfulFiber.alternate, 
        capturedError = capturedErrors.get(effectfulFiber), capturedErrors.delete(effectfulFiber))), 
        invariant(null != capturedError, "No error for given unit of work. This error is likely caused by a " + "bug in React. Please file an issue."), 
        effectfulFiber.tag) {
          case ClassComponent$4:
            var instance = effectfulFiber.stateNode, info = {
                componentStack: capturedError.componentStack
            };
            return void instance.componentDidCatch(capturedError.error, info);

          case HostRoot$4:
            return void (null === firstUncaughtError && (firstUncaughtError = capturedError.error));

          default:
            invariant(!1, "Invalid type of work. This error is likely caused by a bug in " + "React. Please file an issue.");
        }
    }
    function unwindContexts(from, to) {
        for (var node = from; null !== node; ) {
            switch (node.tag) {
              case ClassComponent$4:
                popContextProvider$1(node);
                break;

              case HostComponent$3:
                popHostContext(node);
                break;

              case HostRoot$4:
              case HostPortal$2:
                popHostContainer(node);
            }
            if (node === to || node.alternate === to) break;
            node = node.return;
        }
    }
    function scheduleRoot(root, priorityLevel) {
        priorityLevel !== NoWork$2 && (root.isScheduled || (root.isScheduled = !0, lastScheduledRoot ? (lastScheduledRoot.nextScheduledRoot = root, 
        lastScheduledRoot = root) : (nextScheduledRoot = root, lastScheduledRoot = root)));
    }
    function scheduleUpdate(fiber, priorityLevel) {
        return scheduleUpdateImpl(fiber, priorityLevel, !1);
    }
    function scheduleUpdateImpl(fiber, priorityLevel, isErrorRecovery) {
        nestedUpdateCount > NESTED_UPDATE_LIMIT && (didFatal = !0, invariant(!1, "Maximum update depth exceeded. This can happen when a " + "component repeatedly calls setState inside componentWillUpdate or " + "componentDidUpdate. React limits the number of nested updates to " + "prevent infinite loops.")), 
        !isPerformingWork && priorityLevel <= nextPriorityLevel && (nextUnitOfWork = null);
        for (var node = fiber, shouldContinue = !0; null !== node && shouldContinue; ) {
            if (shouldContinue = !1, (node.pendingWorkPriority === NoWork$2 || node.pendingWorkPriority > priorityLevel) && (shouldContinue = !0, 
            node.pendingWorkPriority = priorityLevel), null !== node.alternate && (node.alternate.pendingWorkPriority === NoWork$2 || node.alternate.pendingWorkPriority > priorityLevel) && (shouldContinue = !0, 
            node.alternate.pendingWorkPriority = priorityLevel), null === node.return) {
                if (node.tag !== HostRoot$4) return;
                if (scheduleRoot(node.stateNode, priorityLevel), !isPerformingWork) switch (priorityLevel) {
                  case SynchronousPriority$1:
                    isUnbatchingUpdates ? performWork(SynchronousPriority$1, null) : performWork(TaskPriority$1, null);
                    break;

                  case TaskPriority$1:
                    invariant(isBatchingUpdates, "Task updates can only be scheduled as a nested update or " + "inside batchedUpdates.");
                    break;

                  default:
                    isCallbackScheduled || (scheduleDeferredCallback(performDeferredWork), isCallbackScheduled = !0);
                }
            }
            node = node.return;
        }
    }
    function getPriorityContext(fiber, forceAsync) {
        var priorityLevel = priorityContext;
        return priorityLevel === NoWork$2 && (priorityLevel = !useSyncScheduling || fiber.internalContextTag & AsyncUpdates || forceAsync ? LowPriority : SynchronousPriority$1), 
        priorityLevel === SynchronousPriority$1 && (isPerformingWork || isBatchingUpdates) ? TaskPriority$1 : priorityLevel;
    }
    function scheduleErrorRecovery(fiber) {
        scheduleUpdateImpl(fiber, TaskPriority$1, !0);
    }
    function performWithPriority(priorityLevel, fn) {
        var previousPriorityContext = priorityContext;
        priorityContext = priorityLevel;
        try {
            fn();
        } finally {
            priorityContext = previousPriorityContext;
        }
    }
    function batchedUpdates(fn, a) {
        var previousIsBatchingUpdates = isBatchingUpdates;
        isBatchingUpdates = !0;
        try {
            return fn(a);
        } finally {
            isBatchingUpdates = previousIsBatchingUpdates, isPerformingWork || isBatchingUpdates || performWork(TaskPriority$1, null);
        }
    }
    function unbatchedUpdates(fn) {
        var previousIsUnbatchingUpdates = isUnbatchingUpdates, previousIsBatchingUpdates = isBatchingUpdates;
        isUnbatchingUpdates = isBatchingUpdates, isBatchingUpdates = !1;
        try {
            return fn();
        } finally {
            isBatchingUpdates = previousIsBatchingUpdates, isUnbatchingUpdates = previousIsUnbatchingUpdates;
        }
    }
    function flushSync(batch) {
        var previousIsBatchingUpdates = isBatchingUpdates, previousPriorityContext = priorityContext;
        isBatchingUpdates = !0, priorityContext = SynchronousPriority$1;
        try {
            return batch();
        } finally {
            isBatchingUpdates = previousIsBatchingUpdates, priorityContext = previousPriorityContext, 
            invariant(!isPerformingWork, "flushSync was called from inside a lifecycle method. It cannot be " + "called when React is already rendering."), 
            performWork(TaskPriority$1, null);
        }
    }
    function deferredUpdates(fn) {
        var previousPriorityContext = priorityContext;
        priorityContext = LowPriority;
        try {
            return fn();
        } finally {
            priorityContext = previousPriorityContext;
        }
    }
    return {
        scheduleUpdate: scheduleUpdate,
        getPriorityContext: getPriorityContext,
        performWithPriority: performWithPriority,
        batchedUpdates: batchedUpdates,
        unbatchedUpdates: unbatchedUpdates,
        flushSync: flushSync,
        deferredUpdates: deferredUpdates
    };
}, getContextFiber = function(arg) {
    invariant(!1, "Missing injection for fiber getContextForSubtree");
};

function getContextForSubtree(parentComponent) {
    if (!parentComponent) return emptyObject;
    var instance = ReactInstanceMap_1.get(parentComponent);
    return "number" == typeof instance.tag ? getContextFiber(instance) : instance._processChildContext(instance._context);
}

getContextForSubtree._injectFiber = function(fn) {
    getContextFiber = fn;
};

var getContextForSubtree_1 = getContextForSubtree, addTopLevelUpdate = ReactFiberUpdateQueue.addTopLevelUpdate, findCurrentUnmaskedContext = ReactFiberContext.findCurrentUnmaskedContext, isContextProvider = ReactFiberContext.isContextProvider, processChildContext = ReactFiberContext.processChildContext, createFiberRoot = ReactFiberRoot.createFiberRoot, HostComponent = ReactTypeOfWork.HostComponent, findCurrentHostFiber = ReactFiberTreeReflection.findCurrentHostFiber, findCurrentHostFiberWithNoPortals = ReactFiberTreeReflection.findCurrentHostFiberWithNoPortals;

getContextForSubtree_1._injectFiber(function(fiber) {
    var parentContext = findCurrentUnmaskedContext(fiber);
    return isContextProvider(fiber) ? processChildContext(fiber, parentContext, !1) : parentContext;
});

var ReactFiberReconciler = function(config) {
    var getPublicInstance = config.getPublicInstance, _ReactFiberScheduler = ReactFiberScheduler(config), scheduleUpdate = _ReactFiberScheduler.scheduleUpdate, getPriorityContext = _ReactFiberScheduler.getPriorityContext, performWithPriority = _ReactFiberScheduler.performWithPriority, batchedUpdates = _ReactFiberScheduler.batchedUpdates, unbatchedUpdates = _ReactFiberScheduler.unbatchedUpdates, flushSync = _ReactFiberScheduler.flushSync, deferredUpdates = _ReactFiberScheduler.deferredUpdates;
    function scheduleTopLevelUpdate(current, element, callback) {
        var forceAsync = ReactFeatureFlags_1.enableAsyncSubtreeAPI && null != element && null != element.type && null != element.type.prototype && !0 === element.type.prototype.unstable_isAsyncReactComponent, priorityLevel = getPriorityContext(current, forceAsync), nextState = {
            element: element
        };
        callback = void 0 === callback ? null : callback, addTopLevelUpdate(current, nextState, callback, priorityLevel), 
        scheduleUpdate(current, priorityLevel);
    }
    return {
        createContainer: function(containerInfo) {
            return createFiberRoot(containerInfo);
        },
        updateContainer: function(element, container, parentComponent, callback) {
            var current = container.current, context = getContextForSubtree_1(parentComponent);
            null === container.context ? container.context = context : container.pendingContext = context, 
            scheduleTopLevelUpdate(current, element, callback);
        },
        performWithPriority: performWithPriority,
        batchedUpdates: batchedUpdates,
        unbatchedUpdates: unbatchedUpdates,
        deferredUpdates: deferredUpdates,
        flushSync: flushSync,
        getPublicRootInstance: function(container) {
            var containerFiber = container.current;
            if (!containerFiber.child) return null;
            switch (containerFiber.child.tag) {
              case HostComponent:
                return getPublicInstance(containerFiber.child.stateNode);

              default:
                return containerFiber.child.stateNode;
            }
        },
        findHostInstance: function(fiber) {
            var hostFiber = findCurrentHostFiber(fiber);
            return null === hostFiber ? null : hostFiber.stateNode;
        },
        findHostInstanceWithNoPortals: function(fiber) {
            var hostFiber = findCurrentHostFiberWithNoPortals(fiber);
            return null === hostFiber ? null : hostFiber.stateNode;
        }
    };
};

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
}

var objects = {}, uniqueID = 1, emptyObject$3 = {}, ReactNativePropRegistry = function() {
    function ReactNativePropRegistry() {
        _classCallCheck(this, ReactNativePropRegistry);
    }
    return ReactNativePropRegistry.register = function(object) {
        var id = ++uniqueID;
        return objects[id] = object, id;
    }, ReactNativePropRegistry.getByID = function(id) {
        if (!id) return emptyObject$3;
        var object = objects[id];
        return object || (console.warn("Invalid style with id `" + id + "`. Skipping ..."), 
        emptyObject$3);
    }, ReactNativePropRegistry;
}(), ReactNativePropRegistry_1 = ReactNativePropRegistry, emptyObject$2 = {}, removedKeys = null, removedKeyCount = 0;

function defaultDiffer(prevProp, nextProp) {
    return "object" != typeof nextProp || null === nextProp || deepDiffer(prevProp, nextProp);
}

function resolveObject(idOrObject) {
    return "number" == typeof idOrObject ? ReactNativePropRegistry_1.getByID(idOrObject) : idOrObject;
}

function restoreDeletedValuesInNestedArray(updatePayload, node, validAttributes) {
    if (Array.isArray(node)) for (var i = node.length; i-- && removedKeyCount > 0; ) restoreDeletedValuesInNestedArray(updatePayload, node[i], validAttributes); else if (node && removedKeyCount > 0) {
        var obj = resolveObject(node);
        for (var propKey in removedKeys) if (removedKeys[propKey]) {
            var nextProp = obj[propKey];
            if (void 0 !== nextProp) {
                var attributeConfig = validAttributes[propKey];
                if (attributeConfig) {
                    if ("function" == typeof nextProp && (nextProp = !0), void 0 === nextProp && (nextProp = null), 
                    "object" != typeof attributeConfig) updatePayload[propKey] = nextProp; else if ("function" == typeof attributeConfig.diff || "function" == typeof attributeConfig.process) {
                        var nextValue = "function" == typeof attributeConfig.process ? attributeConfig.process(nextProp) : nextProp;
                        updatePayload[propKey] = nextValue;
                    }
                    removedKeys[propKey] = !1, removedKeyCount--;
                }
            }
        }
    }
}

function diffNestedArrayProperty(updatePayload, prevArray, nextArray, validAttributes) {
    var i, minLength = prevArray.length < nextArray.length ? prevArray.length : nextArray.length;
    for (i = 0; i < minLength; i++) updatePayload = diffNestedProperty(updatePayload, prevArray[i], nextArray[i], validAttributes);
    for (;i < prevArray.length; i++) updatePayload = clearNestedProperty(updatePayload, prevArray[i], validAttributes);
    for (;i < nextArray.length; i++) updatePayload = addNestedProperty(updatePayload, nextArray[i], validAttributes);
    return updatePayload;
}

function diffNestedProperty(updatePayload, prevProp, nextProp, validAttributes) {
    return updatePayload || prevProp !== nextProp ? prevProp && nextProp ? Array.isArray(prevProp) || Array.isArray(nextProp) ? Array.isArray(prevProp) && Array.isArray(nextProp) ? diffNestedArrayProperty(updatePayload, prevProp, nextProp, validAttributes) : Array.isArray(prevProp) ? diffProperties(updatePayload, flattenStyle(prevProp), resolveObject(nextProp), validAttributes) : diffProperties(updatePayload, resolveObject(prevProp), flattenStyle(nextProp), validAttributes) : diffProperties(updatePayload, resolveObject(prevProp), resolveObject(nextProp), validAttributes) : nextProp ? addNestedProperty(updatePayload, nextProp, validAttributes) : prevProp ? clearNestedProperty(updatePayload, prevProp, validAttributes) : updatePayload : updatePayload;
}

function addNestedProperty(updatePayload, nextProp, validAttributes) {
    if (!nextProp) return updatePayload;
    if (!Array.isArray(nextProp)) return addProperties(updatePayload, resolveObject(nextProp), validAttributes);
    for (var i = 0; i < nextProp.length; i++) updatePayload = addNestedProperty(updatePayload, nextProp[i], validAttributes);
    return updatePayload;
}

function clearNestedProperty(updatePayload, prevProp, validAttributes) {
    if (!prevProp) return updatePayload;
    if (!Array.isArray(prevProp)) return clearProperties(updatePayload, resolveObject(prevProp), validAttributes);
    for (var i = 0; i < prevProp.length; i++) updatePayload = clearNestedProperty(updatePayload, prevProp[i], validAttributes);
    return updatePayload;
}

function diffProperties(updatePayload, prevProps, nextProps, validAttributes) {
    var attributeConfig, nextProp, prevProp;
    for (var propKey in nextProps) if (attributeConfig = validAttributes[propKey]) if (prevProp = prevProps[propKey], 
    nextProp = nextProps[propKey], "function" == typeof nextProp && (nextProp = !0, 
    "function" == typeof prevProp && (prevProp = !0)), void 0 === nextProp && (nextProp = null, 
    void 0 === prevProp && (prevProp = null)), removedKeys && (removedKeys[propKey] = !1), 
    updatePayload && void 0 !== updatePayload[propKey]) {
        if ("object" != typeof attributeConfig) updatePayload[propKey] = nextProp; else if ("function" == typeof attributeConfig.diff || "function" == typeof attributeConfig.process) {
            var nextValue = "function" == typeof attributeConfig.process ? attributeConfig.process(nextProp) : nextProp;
            updatePayload[propKey] = nextValue;
        }
    } else if (prevProp !== nextProp) if ("object" != typeof attributeConfig) defaultDiffer(prevProp, nextProp) && ((updatePayload || (updatePayload = {}))[propKey] = nextProp); else if ("function" == typeof attributeConfig.diff || "function" == typeof attributeConfig.process) {
        var shouldUpdate = void 0 === prevProp || ("function" == typeof attributeConfig.diff ? attributeConfig.diff(prevProp, nextProp) : defaultDiffer(prevProp, nextProp));
        shouldUpdate && (nextValue = "function" == typeof attributeConfig.process ? attributeConfig.process(nextProp) : nextProp, 
        (updatePayload || (updatePayload = {}))[propKey] = nextValue);
    } else removedKeys = null, removedKeyCount = 0, updatePayload = diffNestedProperty(updatePayload, prevProp, nextProp, attributeConfig), 
    removedKeyCount > 0 && updatePayload && (restoreDeletedValuesInNestedArray(updatePayload, nextProp, attributeConfig), 
    removedKeys = null);
    for (propKey in prevProps) void 0 === nextProps[propKey] && (attributeConfig = validAttributes[propKey]) && (updatePayload && void 0 !== updatePayload[propKey] || void 0 !== (prevProp = prevProps[propKey]) && ("object" != typeof attributeConfig || "function" == typeof attributeConfig.diff || "function" == typeof attributeConfig.process ? ((updatePayload || (updatePayload = {}))[propKey] = null, 
    removedKeys || (removedKeys = {}), removedKeys[propKey] || (removedKeys[propKey] = !0, 
    removedKeyCount++)) : updatePayload = clearNestedProperty(updatePayload, prevProp, attributeConfig)));
    return updatePayload;
}

function addProperties(updatePayload, props, validAttributes) {
    return diffProperties(updatePayload, emptyObject$2, props, validAttributes);
}

function clearProperties(updatePayload, prevProps, validAttributes) {
    return diffProperties(updatePayload, prevProps, emptyObject$2, validAttributes);
}

var ReactNativeAttributePayload = {
    create: function(props, validAttributes) {
        return addProperties(null, props, validAttributes);
    },
    diff: function(prevProps, nextProps, validAttributes) {
        return diffProperties(null, prevProps, nextProps, validAttributes);
    }
}, ReactNativeAttributePayload_1 = ReactNativeAttributePayload;

function mountSafeCallback$1(context, callback) {
    return function() {
        if (callback) {
            if ("boolean" == typeof context.__isMounted) {
                if (!context.__isMounted) return;
            } else if ("function" == typeof context.isMounted && !context.isMounted()) return;
            return callback.apply(context, arguments);
        }
    };
}

function throwOnStylesProp(component, props) {
    if (void 0 !== props.styles) {
        var owner = component._owner || null, name = component.constructor.displayName, msg = "`styles` is not a supported property of `" + name + "`, did " + "you mean `style` (singular)?";
        throw owner && owner.constructor && owner.constructor.displayName && (msg += "\n\nCheck the `" + owner.constructor.displayName + "` parent " + " component."), 
        new Error(msg);
    }
}

function warnForStyleProps$1(props, validAttributes) {
    for (var key in validAttributes.style) validAttributes[key] || void 0 === props[key] || console.error("You are setting the style `{ " + key + ": ... }` as a prop. You " + "should nest it in a style object. " + "E.g. `{ style: { " + key + ": ... } }`");
}

var NativeMethodsMixinUtils = {
    mountSafeCallback: mountSafeCallback$1,
    throwOnStylesProp: throwOnStylesProp,
    warnForStyleProps: warnForStyleProps$1
};

function _classCallCheck$1(instance, Constructor) {
    if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
}

var mountSafeCallback = NativeMethodsMixinUtils.mountSafeCallback, ReactNativeFiberHostComponent = function() {
    function ReactNativeFiberHostComponent(tag, viewConfig) {
        _classCallCheck$1(this, ReactNativeFiberHostComponent), this._nativeTag = tag, this._children = [], 
        this.viewConfig = viewConfig;
    }
    return ReactNativeFiberHostComponent.prototype.blur = function() {
        TextInputState.blurTextInput(this._nativeTag);
    }, ReactNativeFiberHostComponent.prototype.focus = function() {
        TextInputState.focusTextInput(this._nativeTag);
    }, ReactNativeFiberHostComponent.prototype.measure = function(callback) {
        UIManager.measure(this._nativeTag, mountSafeCallback(this, callback));
    }, ReactNativeFiberHostComponent.prototype.measureInWindow = function(callback) {
        UIManager.measureInWindow(this._nativeTag, mountSafeCallback(this, callback));
    }, ReactNativeFiberHostComponent.prototype.measureLayout = function(relativeToNativeNode, onSuccess, onFail) {
        UIManager.measureLayout(this._nativeTag, relativeToNativeNode, mountSafeCallback(this, onFail), mountSafeCallback(this, onSuccess));
    }, ReactNativeFiberHostComponent.prototype.setNativeProps = function(nativeProps) {
        var updatePayload = ReactNativeAttributePayload_1.create(nativeProps, this.viewConfig.validAttributes);
        UIManager.updateView(this._nativeTag, this.viewConfig.uiViewClassName, updatePayload);
    }, ReactNativeFiberHostComponent;
}(), ReactNativeFiberHostComponent_1 = ReactNativeFiberHostComponent, INITIAL_TAG_COUNT = 1, ReactNativeTagHandles = {
    tagsStartAt: INITIAL_TAG_COUNT,
    tagCount: INITIAL_TAG_COUNT,
    allocateTag: function() {
        for (;this.reactTagIsNativeTopRootID(ReactNativeTagHandles.tagCount); ) ReactNativeTagHandles.tagCount++;
        var tag = ReactNativeTagHandles.tagCount;
        return ReactNativeTagHandles.tagCount++, tag;
    },
    assertRootTag: function(tag) {
        invariant(this.reactTagIsNativeTopRootID(tag), "Expect a native root tag, instead got %s", tag);
    },
    reactTagIsNativeTopRootID: function(reactTag) {
        return reactTag % 10 == 1;
    }
}, ReactNativeTagHandles_1 = ReactNativeTagHandles, viewConfigs = new Map(), ReactNativeViewConfigRegistry = {
    register: function(viewConfig) {
        var name = viewConfig.uiViewClassName;
        return invariant(!viewConfigs.has(name), "Tried to register two views with the same name %s", name), 
        viewConfigs.set(name, viewConfig), name;
    },
    get: function(name) {
        var config = viewConfigs.get(name);
        return invariant(config, "View config not found for name %s", name), config;
    }
}, ReactNativeViewConfigRegistry_1 = ReactNativeViewConfigRegistry, precacheFiberNode$1 = ReactNativeComponentTree_1.precacheFiberNode, uncacheFiberNode$1 = ReactNativeComponentTree_1.uncacheFiberNode, updateFiberProps$1 = ReactNativeComponentTree_1.updateFiberProps;

function recursivelyUncacheFiberNode(node) {
    "number" == typeof node ? uncacheFiberNode$1(node) : (uncacheFiberNode$1(node._nativeTag), 
    node._children.forEach(recursivelyUncacheFiberNode));
}

var NativeRenderer = ReactFiberReconciler({
    appendChild: function(parentInstance, child) {
        var childTag = "number" == typeof child ? child : child._nativeTag, children = parentInstance._children, index = children.indexOf(child);
        index >= 0 ? (children.splice(index, 1), children.push(child), UIManager.manageChildren(parentInstance._nativeTag, [ index ], [ children.length - 1 ], [], [], [])) : (children.push(child), 
        UIManager.manageChildren(parentInstance._nativeTag, [], [], [ childTag ], [ children.length - 1 ], []));
    },
    appendChildToContainer: function(parentInstance, child) {
        var childTag = "number" == typeof child ? child : child._nativeTag;
        UIManager.setChildren(parentInstance, [ childTag ]);
    },
    appendInitialChild: function(parentInstance, child) {
        parentInstance._children.push(child);
    },
    commitTextUpdate: function(textInstance, oldText, newText) {
        UIManager.updateView(textInstance, "RCTRawText", {
            text: newText
        });
    },
    commitMount: function(instance, type, newProps, internalInstanceHandle) {},
    commitUpdate: function(instance, updatePayloadTODO, type, oldProps, newProps, internalInstanceHandle) {
        var viewConfig = instance.viewConfig;
        updateFiberProps$1(instance._nativeTag, newProps);
        var updatePayload = ReactNativeAttributePayload_1.diff(oldProps, newProps, viewConfig.validAttributes);
        UIManager.updateView(instance._nativeTag, viewConfig.uiViewClassName, updatePayload);
    },
    createInstance: function(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
        var tag = ReactNativeTagHandles_1.allocateTag(), viewConfig = ReactNativeViewConfigRegistry_1.get(type), updatePayload = ReactNativeAttributePayload_1.create(props, viewConfig.validAttributes);
        UIManager.createView(tag, viewConfig.uiViewClassName, rootContainerInstance, updatePayload);
        var component = new ReactNativeFiberHostComponent_1(tag, viewConfig);
        return precacheFiberNode$1(internalInstanceHandle, tag), updateFiberProps$1(tag, props), 
        component;
    },
    createTextInstance: function(text, rootContainerInstance, hostContext, internalInstanceHandle) {
        var tag = ReactNativeTagHandles_1.allocateTag();
        return UIManager.createView(tag, "RCTRawText", rootContainerInstance, {
            text: text
        }), precacheFiberNode$1(internalInstanceHandle, tag), tag;
    },
    finalizeInitialChildren: function(parentInstance, type, props, rootContainerInstance) {
        if (0 === parentInstance._children.length) return !1;
        var nativeTags = parentInstance._children.map(function(child) {
            return "number" == typeof child ? child : child._nativeTag;
        });
        return UIManager.setChildren(parentInstance._nativeTag, nativeTags), !1;
    },
    getRootHostContext: function() {
        return emptyObject;
    },
    getChildHostContext: function() {
        return emptyObject;
    },
    getPublicInstance: function(instance) {
        return instance;
    },
    insertBefore: function(parentInstance, child, beforeChild) {
        var children = parentInstance._children, index = children.indexOf(child);
        if (index >= 0) {
            children.splice(index, 1);
            var beforeChildIndex = children.indexOf(beforeChild);
            children.splice(beforeChildIndex, 0, child), UIManager.manageChildren(parentInstance._nativeTag, [ index ], [ beforeChildIndex ], [], [], []);
        } else {
            var _beforeChildIndex = children.indexOf(beforeChild);
            children.splice(_beforeChildIndex, 0, child);
            var childTag = "number" == typeof child ? child : child._nativeTag;
            UIManager.manageChildren(parentInstance._nativeTag, [], [], [ childTag ], [ _beforeChildIndex ], []);
        }
    },
    insertInContainerBefore: function(parentInstance, child, beforeChild) {
        invariant("number" != typeof parentInstance, "Container does not support insertBefore operation");
    },
    prepareForCommit: function() {},
    prepareUpdate: function(instance, type, oldProps, newProps, rootContainerInstance, hostContext) {
        return emptyObject;
    },
    removeChild: function(parentInstance, child) {
        recursivelyUncacheFiberNode(child);
        var children = parentInstance._children, index = children.indexOf(child);
        children.splice(index, 1), UIManager.manageChildren(parentInstance._nativeTag, [], [], [], [], [ index ]);
    },
    removeChildFromContainer: function(parentInstance, child) {
        recursivelyUncacheFiberNode(child), UIManager.manageChildren(parentInstance, [], [], [], [], [ 0 ]);
    },
    resetAfterCommit: function() {},
    resetTextContent: function(instance) {},
    shouldDeprioritizeSubtree: function(type, props) {
        return !1;
    },
    scheduleDeferredCallback: commonjsGlobal.requestIdleCallback,
    shouldSetTextContent: function(type, props) {
        return !1;
    },
    useSyncScheduling: !0
}), ReactNativeFiberRenderer = NativeRenderer, getInspectorDataForViewTag = void 0;

getInspectorDataForViewTag = function() {
    invariant(!1, "getInspectorDataForViewTag() is not available in production");
};

var ReactNativeFiberInspector = {
    getInspectorDataForViewTag: getInspectorDataForViewTag
}, ReactVersion = "16.0.0-beta.5", ReactNativeFeatureFlags = require("ReactNativeFeatureFlags"), injectedFindNode = ReactNativeFeatureFlags.useFiber ? function(fiber) {
    return ReactNativeFiberRenderer.findHostInstance(fiber);
} : function(instance) {
    return instance;
};

function findNodeHandle(componentOrHandle) {
    if (null == componentOrHandle) return null;
    if ("number" == typeof componentOrHandle) return componentOrHandle;
    var component = componentOrHandle, internalInstance = ReactInstanceMap_1.get(component);
    return internalInstance ? injectedFindNode(internalInstance) : component || (invariant("object" == typeof component && ("_rootNodeID" in component || "_nativeTag" in component) || null != component.render && "function" == typeof component.render, "findNodeHandle(...): Argument is not a component " + "(type: %s, keys: %s)", typeof component, Object.keys(component)), 
    void invariant(!1, "findNodeHandle(...): Unable to find node handle for unmounted " + "component."));
}

var findNodeHandle_1 = findNodeHandle, findNumericNodeHandleFiber = function(componentOrHandle) {
    var instance = findNodeHandle_1(componentOrHandle);
    return null == instance || "number" == typeof instance ? instance : instance._nativeTag;
}, eventPluginOrder = null, namesToPlugins = {};

function recomputePluginOrdering() {
    if (eventPluginOrder) for (var pluginName in namesToPlugins) {
        var pluginModule = namesToPlugins[pluginName], pluginIndex = eventPluginOrder.indexOf(pluginName);
        if (invariant(pluginIndex > -1, "EventPluginRegistry: Cannot inject event plugins that do not exist in " + "the plugin ordering, `%s`.", pluginName), 
        !EventPluginRegistry.plugins[pluginIndex]) {
            invariant(pluginModule.extractEvents, "EventPluginRegistry: Event plugins must implement an `extractEvents` " + "method, but `%s` does not.", pluginName), 
            EventPluginRegistry.plugins[pluginIndex] = pluginModule;
            var publishedEvents = pluginModule.eventTypes;
            for (var eventName in publishedEvents) invariant(publishEventForPlugin(publishedEvents[eventName], pluginModule, eventName), "EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.", eventName, pluginName);
        }
    }
}

function publishEventForPlugin(dispatchConfig, pluginModule, eventName) {
    invariant(!EventPluginRegistry.eventNameDispatchConfigs.hasOwnProperty(eventName), "EventPluginHub: More than one plugin attempted to publish the same " + "event name, `%s`.", eventName), 
    EventPluginRegistry.eventNameDispatchConfigs[eventName] = dispatchConfig;
    var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
    if (phasedRegistrationNames) {
        for (var phaseName in phasedRegistrationNames) if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
            var phasedRegistrationName = phasedRegistrationNames[phaseName];
            publishRegistrationName(phasedRegistrationName, pluginModule, eventName);
        }
        return !0;
    }
    return !!dispatchConfig.registrationName && (publishRegistrationName(dispatchConfig.registrationName, pluginModule, eventName), 
    !0);
}

function publishRegistrationName(registrationName, pluginModule, eventName) {
    invariant(!EventPluginRegistry.registrationNameModules[registrationName], "EventPluginHub: More than one plugin attempted to publish the same " + "registration name, `%s`.", registrationName), 
    EventPluginRegistry.registrationNameModules[registrationName] = pluginModule, EventPluginRegistry.registrationNameDependencies[registrationName] = pluginModule.eventTypes[eventName].dependencies;
}

var EventPluginRegistry = {
    plugins: [],
    eventNameDispatchConfigs: {},
    registrationNameModules: {},
    registrationNameDependencies: {},
    possibleRegistrationNames: null,
    injectEventPluginOrder: function(injectedEventPluginOrder) {
        invariant(!eventPluginOrder, "EventPluginRegistry: Cannot inject event plugin ordering more than " + "once. You are likely trying to load more than one copy of React."), 
        eventPluginOrder = Array.prototype.slice.call(injectedEventPluginOrder), recomputePluginOrdering();
    },
    injectEventPluginsByName: function(injectedNamesToPlugins) {
        var isOrderingDirty = !1;
        for (var pluginName in injectedNamesToPlugins) if (injectedNamesToPlugins.hasOwnProperty(pluginName)) {
            var pluginModule = injectedNamesToPlugins[pluginName];
            namesToPlugins.hasOwnProperty(pluginName) && namesToPlugins[pluginName] === pluginModule || (invariant(!namesToPlugins[pluginName], "EventPluginRegistry: Cannot inject two different event plugins " + "using the same name, `%s`.", pluginName), 
            namesToPlugins[pluginName] = pluginModule, isOrderingDirty = !0);
        }
        isOrderingDirty && recomputePluginOrdering();
    }
}, EventPluginRegistry_1 = EventPluginRegistry;

function accumulateInto(current, next) {
    return invariant(null != next, "accumulateInto(...): Accumulated items must not be null or undefined."), 
    null == current ? next : Array.isArray(current) ? Array.isArray(next) ? (current.push.apply(current, next), 
    current) : (current.push(next), current) : Array.isArray(next) ? [ current ].concat(next) : [ current, next ];
}

var accumulateInto_1 = accumulateInto;

function forEachAccumulated(arr, cb, scope) {
    Array.isArray(arr) ? arr.forEach(cb, scope) : arr && cb.call(scope, arr);
}

var forEachAccumulated_1 = forEachAccumulated, eventQueue = null, executeDispatchesAndRelease = function(event, simulated) {
    event && (EventPluginUtils_1.executeDispatchesInOrder(event, simulated), event.isPersistent() || event.constructor.release(event));
}, executeDispatchesAndReleaseSimulated = function(e) {
    return executeDispatchesAndRelease(e, !0);
}, executeDispatchesAndReleaseTopLevel = function(e) {
    return executeDispatchesAndRelease(e, !1);
};

function isInteractive(tag) {
    return "button" === tag || "input" === tag || "select" === tag || "textarea" === tag;
}

function shouldPreventMouseEvent(name, type, props) {
    switch (name) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
        return !(!props.disabled || !isInteractive(type));

      default:
        return !1;
    }
}

var EventPluginHub = {
    injection: {
        injectEventPluginOrder: EventPluginRegistry_1.injectEventPluginOrder,
        injectEventPluginsByName: EventPluginRegistry_1.injectEventPluginsByName
    },
    getListener: function(inst, registrationName) {
        var listener;
        if ("number" == typeof inst.tag) {
            var stateNode = inst.stateNode;
            if (!stateNode) return null;
            var props = EventPluginUtils_1.getFiberCurrentPropsFromNode(stateNode);
            if (!props) return null;
            if (listener = props[registrationName], shouldPreventMouseEvent(registrationName, inst.type, props)) return null;
        } else {
            var currentElement = inst._currentElement;
            if ("string" == typeof currentElement || "number" == typeof currentElement) return null;
            if (!inst._rootNodeID) return null;
            var _props = currentElement.props;
            if (listener = _props[registrationName], shouldPreventMouseEvent(registrationName, currentElement.type, _props)) return null;
        }
        return invariant(!listener || "function" == typeof listener, "Expected %s listener to be a function, instead got type %s", registrationName, typeof listener), 
        listener;
    },
    extractEvents: function(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        for (var events, plugins = EventPluginRegistry_1.plugins, i = 0; i < plugins.length; i++) {
            var possiblePlugin = plugins[i];
            if (possiblePlugin) {
                var extractedEvents = possiblePlugin.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget);
                extractedEvents && (events = accumulateInto_1(events, extractedEvents));
            }
        }
        return events;
    },
    enqueueEvents: function(events) {
        events && (eventQueue = accumulateInto_1(eventQueue, events));
    },
    processEventQueue: function(simulated) {
        var processingEventQueue = eventQueue;
        eventQueue = null, simulated ? forEachAccumulated_1(processingEventQueue, executeDispatchesAndReleaseSimulated) : forEachAccumulated_1(processingEventQueue, executeDispatchesAndReleaseTopLevel), 
        invariant(!eventQueue, "processEventQueue(): Additional events were enqueued while processing " + "an event queue. Support for this has not yet been implemented."), 
        ReactErrorUtils_1.rethrowCaughtError();
    }
}, EventPluginHub_1 = EventPluginHub, HostComponent$10 = ReactTypeOfWork.HostComponent;

function getParent(inst) {
    if (void 0 !== inst._hostParent) return inst._hostParent;
    if ("number" == typeof inst.tag) {
        do {
            inst = inst.return;
        } while (inst && inst.tag !== HostComponent$10);
        if (inst) return inst;
    }
    return null;
}

function getLowestCommonAncestor(instA, instB) {
    for (var depthA = 0, tempA = instA; tempA; tempA = getParent(tempA)) depthA++;
    for (var depthB = 0, tempB = instB; tempB; tempB = getParent(tempB)) depthB++;
    for (;depthA - depthB > 0; ) instA = getParent(instA), depthA--;
    for (;depthB - depthA > 0; ) instB = getParent(instB), depthB--;
    for (var depth = depthA; depth--; ) {
        if (instA === instB || instA === instB.alternate) return instA;
        instA = getParent(instA), instB = getParent(instB);
    }
    return null;
}

function isAncestor(instA, instB) {
    for (;instB; ) {
        if (instA === instB || instA === instB.alternate) return !0;
        instB = getParent(instB);
    }
    return !1;
}

function getParentInstance(inst) {
    return getParent(inst);
}

function traverseTwoPhase(inst, fn, arg) {
    for (var path = []; inst; ) path.push(inst), inst = getParent(inst);
    var i;
    for (i = path.length; i-- > 0; ) fn(path[i], "captured", arg);
    for (i = 0; i < path.length; i++) fn(path[i], "bubbled", arg);
}

function traverseEnterLeave(from, to, fn, argFrom, argTo) {
    for (var common = from && to ? getLowestCommonAncestor(from, to) : null, pathFrom = []; from && from !== common; ) pathFrom.push(from), 
    from = getParent(from);
    for (var pathTo = []; to && to !== common; ) pathTo.push(to), to = getParent(to);
    var i;
    for (i = 0; i < pathFrom.length; i++) fn(pathFrom[i], "bubbled", argFrom);
    for (i = pathTo.length; i-- > 0; ) fn(pathTo[i], "captured", argTo);
}

var ReactTreeTraversal = {
    isAncestor: isAncestor,
    getLowestCommonAncestor: getLowestCommonAncestor,
    getParentInstance: getParentInstance,
    traverseTwoPhase: traverseTwoPhase,
    traverseEnterLeave: traverseEnterLeave
}, getListener = EventPluginHub_1.getListener;

function listenerAtPhase(inst, event, propagationPhase) {
    var registrationName = event.dispatchConfig.phasedRegistrationNames[propagationPhase];
    return getListener(inst, registrationName);
}

function accumulateDirectionalDispatches(inst, phase, event) {
    var listener = listenerAtPhase(inst, event, phase);
    listener && (event._dispatchListeners = accumulateInto_1(event._dispatchListeners, listener), 
    event._dispatchInstances = accumulateInto_1(event._dispatchInstances, inst));
}

function accumulateTwoPhaseDispatchesSingle(event) {
    event && event.dispatchConfig.phasedRegistrationNames && ReactTreeTraversal.traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
}

function accumulateTwoPhaseDispatchesSingleSkipTarget(event) {
    if (event && event.dispatchConfig.phasedRegistrationNames) {
        var targetInst = event._targetInst, parentInst = targetInst ? ReactTreeTraversal.getParentInstance(targetInst) : null;
        ReactTreeTraversal.traverseTwoPhase(parentInst, accumulateDirectionalDispatches, event);
    }
}

function accumulateDispatches(inst, ignoredDirection, event) {
    if (inst && event && event.dispatchConfig.registrationName) {
        var registrationName = event.dispatchConfig.registrationName, listener = getListener(inst, registrationName);
        listener && (event._dispatchListeners = accumulateInto_1(event._dispatchListeners, listener), 
        event._dispatchInstances = accumulateInto_1(event._dispatchInstances, inst));
    }
}

function accumulateDirectDispatchesSingle(event) {
    event && event.dispatchConfig.registrationName && accumulateDispatches(event._targetInst, null, event);
}

function accumulateTwoPhaseDispatches(events) {
    forEachAccumulated_1(events, accumulateTwoPhaseDispatchesSingle);
}

function accumulateTwoPhaseDispatchesSkipTarget(events) {
    forEachAccumulated_1(events, accumulateTwoPhaseDispatchesSingleSkipTarget);
}

function accumulateEnterLeaveDispatches(leave, enter, from, to) {
    ReactTreeTraversal.traverseEnterLeave(from, to, accumulateDispatches, leave, enter);
}

function accumulateDirectDispatches(events) {
    forEachAccumulated_1(events, accumulateDirectDispatchesSingle);
}

var EventPropagators = {
    accumulateTwoPhaseDispatches: accumulateTwoPhaseDispatches,
    accumulateTwoPhaseDispatchesSkipTarget: accumulateTwoPhaseDispatchesSkipTarget,
    accumulateDirectDispatches: accumulateDirectDispatches,
    accumulateEnterLeaveDispatches: accumulateEnterLeaveDispatches
}, EventPropagators_1 = EventPropagators, EVENT_POOL_SIZE = 10, shouldBeReleasedProperties = [ "dispatchConfig", "_targetInst", "nativeEvent", "isDefaultPrevented", "isPropagationStopped", "_dispatchListeners", "_dispatchInstances" ], EventInterface = {
    type: null,
    target: null,
    currentTarget: emptyFunction.thatReturnsNull,
    eventPhase: null,
    bubbles: null,
    cancelable: null,
    timeStamp: function(event) {
        return event.timeStamp || Date.now();
    },
    defaultPrevented: null,
    isTrusted: null
};

function SyntheticEvent(dispatchConfig, targetInst, nativeEvent, nativeEventTarget) {
    this.dispatchConfig = dispatchConfig, this._targetInst = targetInst, this.nativeEvent = nativeEvent;
    var Interface = this.constructor.Interface;
    for (var propName in Interface) if (Interface.hasOwnProperty(propName)) {
        var normalize = Interface[propName];
        normalize ? this[propName] = normalize(nativeEvent) : "target" === propName ? this.target = nativeEventTarget : this[propName] = nativeEvent[propName];
    }
    var defaultPrevented = null != nativeEvent.defaultPrevented ? nativeEvent.defaultPrevented : !1 === nativeEvent.returnValue;
    return this.isDefaultPrevented = defaultPrevented ? emptyFunction.thatReturnsTrue : emptyFunction.thatReturnsFalse, 
    this.isPropagationStopped = emptyFunction.thatReturnsFalse, this;
}

Object.assign(SyntheticEvent.prototype, {
    preventDefault: function() {
        this.defaultPrevented = !0;
        var event = this.nativeEvent;
        event && (event.preventDefault ? event.preventDefault() : "unknown" != typeof event.returnValue && (event.returnValue = !1), 
        this.isDefaultPrevented = emptyFunction.thatReturnsTrue);
    },
    stopPropagation: function() {
        var event = this.nativeEvent;
        event && (event.stopPropagation ? event.stopPropagation() : "unknown" != typeof event.cancelBubble && (event.cancelBubble = !0), 
        this.isPropagationStopped = emptyFunction.thatReturnsTrue);
    },
    persist: function() {
        this.isPersistent = emptyFunction.thatReturnsTrue;
    },
    isPersistent: emptyFunction.thatReturnsFalse,
    destructor: function() {
        var Interface = this.constructor.Interface;
        for (var propName in Interface) this[propName] = null;
        for (var i = 0; i < shouldBeReleasedProperties.length; i++) this[shouldBeReleasedProperties[i]] = null;
    }
}), SyntheticEvent.Interface = EventInterface, SyntheticEvent.augmentClass = function(Class, Interface) {
    var Super = this, E = function() {};
    E.prototype = Super.prototype;
    var prototype = new E();
    Object.assign(prototype, Class.prototype), Class.prototype = prototype, Class.prototype.constructor = Class, 
    Class.Interface = Object.assign({}, Super.Interface, Interface), Class.augmentClass = Super.augmentClass, 
    addEventPoolingTo(Class);
}, addEventPoolingTo(SyntheticEvent);

var SyntheticEvent_1 = SyntheticEvent;

function getPooledEvent(dispatchConfig, targetInst, nativeEvent, nativeInst) {
    var EventConstructor = this;
    if (EventConstructor.eventPool.length) {
        var instance = EventConstructor.eventPool.pop();
        return EventConstructor.call(instance, dispatchConfig, targetInst, nativeEvent, nativeInst), 
        instance;
    }
    return new EventConstructor(dispatchConfig, targetInst, nativeEvent, nativeInst);
}

function releasePooledEvent(event) {
    var EventConstructor = this;
    invariant(event instanceof EventConstructor, "Trying to release an event instance  into a pool of a different type."), 
    event.destructor(), EventConstructor.eventPool.length < EVENT_POOL_SIZE && EventConstructor.eventPool.push(event);
}

function addEventPoolingTo(EventConstructor) {
    EventConstructor.eventPool = [], EventConstructor.getPooled = getPooledEvent, EventConstructor.release = releasePooledEvent;
}

var customBubblingEventTypes = UIManager.customBubblingEventTypes, customDirectEventTypes = UIManager.customDirectEventTypes, allTypesByEventName = {};

for (var bubblingTypeName in customBubblingEventTypes) allTypesByEventName[bubblingTypeName] = customBubblingEventTypes[bubblingTypeName];

for (var directTypeName in customDirectEventTypes) warning(!customBubblingEventTypes[directTypeName], "Event cannot be both direct and bubbling: %s", directTypeName), 
allTypesByEventName[directTypeName] = customDirectEventTypes[directTypeName];

var ReactNativeBridgeEventPlugin = {
    eventTypes: Object.assign({}, customBubblingEventTypes, customDirectEventTypes),
    extractEvents: function(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        var bubbleDispatchConfig = customBubblingEventTypes[topLevelType], directDispatchConfig = customDirectEventTypes[topLevelType], event = SyntheticEvent_1.getPooled(bubbleDispatchConfig || directDispatchConfig, targetInst, nativeEvent, nativeEventTarget);
        if (bubbleDispatchConfig) EventPropagators_1.accumulateTwoPhaseDispatches(event); else {
            if (!directDispatchConfig) return null;
            EventPropagators_1.accumulateDirectDispatches(event);
        }
        return event;
    }
}, ReactNativeBridgeEventPlugin_1 = ReactNativeBridgeEventPlugin;

function runEventQueueInBatch(events) {
    EventPluginHub_1.enqueueEvents(events), EventPluginHub_1.processEventQueue(!1);
}

var ReactEventEmitterMixin = {
    handleTopLevel: function(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        runEventQueueInBatch(EventPluginHub_1.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget));
    }
}, ReactEventEmitterMixin_1 = ReactEventEmitterMixin, EMPTY_NATIVE_EVENT = {}, touchSubsequence = function(touches, indices) {
    for (var ret = [], i = 0; i < indices.length; i++) ret.push(touches[indices[i]]);
    return ret;
}, removeTouchesAtIndices = function(touches, indices) {
    for (var rippedOut = [], temp = touches, i = 0; i < indices.length; i++) {
        var index = indices[i];
        rippedOut.push(touches[index]), temp[index] = null;
    }
    for (var fillAt = 0, j = 0; j < temp.length; j++) {
        var cur = temp[j];
        null !== cur && (temp[fillAt++] = cur);
    }
    return temp.length = fillAt, rippedOut;
}, ReactNativeEventEmitter = Object.assign({}, ReactEventEmitterMixin_1, {
    registrationNames: EventPluginRegistry_1.registrationNameModules,
    getListener: EventPluginHub_1.getListener,
    _receiveRootNodeIDEvent: function(rootNodeID, topLevelType, nativeEventParam) {
        var nativeEvent = nativeEventParam || EMPTY_NATIVE_EVENT, inst = ReactNativeComponentTree_1.getInstanceFromNode(rootNodeID);
        ReactGenericBatching_1.batchedUpdates(function() {
            ReactNativeEventEmitter.handleTopLevel(topLevelType, inst, nativeEvent, nativeEvent.target);
        });
    },
    receiveEvent: function(tag, topLevelType, nativeEventParam) {
        var rootNodeID = tag;
        ReactNativeEventEmitter._receiveRootNodeIDEvent(rootNodeID, topLevelType, nativeEventParam);
    },
    receiveTouches: function(eventTopLevelType, touches, changedIndices) {
        for (var changedTouches = "topTouchEnd" === eventTopLevelType || "topTouchCancel" === eventTopLevelType ? removeTouchesAtIndices(touches, changedIndices) : touchSubsequence(touches, changedIndices), jj = 0; jj < changedTouches.length; jj++) {
            var touch = changedTouches[jj];
            touch.changedTouches = changedTouches, touch.touches = touches;
            var nativeEvent = touch, rootNodeID = null, target = nativeEvent.target;
            null !== target && void 0 !== target && (target < ReactNativeTagHandles_1.tagsStartAt || (rootNodeID = target)), 
            ReactNativeEventEmitter._receiveRootNodeIDEvent(rootNodeID, eventTopLevelType, nativeEvent);
        }
    }
}), ReactNativeEventEmitter_1 = ReactNativeEventEmitter, ReactNativeEventPluginOrder = [ "ResponderEventPlugin", "ReactNativeBridgeEventPlugin" ], ReactNativeEventPluginOrder_1 = ReactNativeEventPluginOrder, ReactNativeGlobalResponderHandler = {
    onChange: function(from, to, blockNativeResponder) {
        if (null !== to) {
            var tag = "number" != typeof to.tag ? to._rootNodeID : to.stateNode._nativeTag;
            UIManager.setJSResponder(tag, blockNativeResponder);
        } else UIManager.clearJSResponder();
    }
}, ReactNativeGlobalResponderHandler_1 = ReactNativeGlobalResponderHandler, ResponderEventInterface = {
    touchHistory: function(nativeEvent) {
        return null;
    }
};

function ResponderSyntheticEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
    return SyntheticEvent_1.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticEvent_1.augmentClass(ResponderSyntheticEvent, ResponderEventInterface);

var ResponderSyntheticEvent_1 = ResponderSyntheticEvent, isEndish$2 = EventPluginUtils_1.isEndish, isMoveish$2 = EventPluginUtils_1.isMoveish, isStartish$2 = EventPluginUtils_1.isStartish, warning$15, MAX_TOUCH_BANK = 20, touchBank = [], touchHistory = {
    touchBank: touchBank,
    numberActiveTouches: 0,
    indexOfSingleActiveTouch: -1,
    mostRecentTimeStamp: 0
};

function timestampForTouch(touch) {
    return touch.timeStamp || touch.timestamp;
}

function createTouchRecord(touch) {
    return {
        touchActive: !0,
        startPageX: touch.pageX,
        startPageY: touch.pageY,
        startTimeStamp: timestampForTouch(touch),
        currentPageX: touch.pageX,
        currentPageY: touch.pageY,
        currentTimeStamp: timestampForTouch(touch),
        previousPageX: touch.pageX,
        previousPageY: touch.pageY,
        previousTimeStamp: timestampForTouch(touch)
    };
}

function resetTouchRecord(touchRecord, touch) {
    touchRecord.touchActive = !0, touchRecord.startPageX = touch.pageX, touchRecord.startPageY = touch.pageY, 
    touchRecord.startTimeStamp = timestampForTouch(touch), touchRecord.currentPageX = touch.pageX, 
    touchRecord.currentPageY = touch.pageY, touchRecord.currentTimeStamp = timestampForTouch(touch), 
    touchRecord.previousPageX = touch.pageX, touchRecord.previousPageY = touch.pageY, 
    touchRecord.previousTimeStamp = timestampForTouch(touch);
}

function getTouchIdentifier(_ref) {
    var identifier = _ref.identifier;
    return invariant(null != identifier, "Touch object is missing identifier."), warning$15(identifier <= MAX_TOUCH_BANK, "Touch identifier %s is greater than maximum supported %s which causes " + "performance issues backfilling array locations for all of the indices.", identifier, MAX_TOUCH_BANK), 
    identifier;
}

function recordTouchStart(touch) {
    var identifier = getTouchIdentifier(touch), touchRecord = touchBank[identifier];
    touchRecord ? resetTouchRecord(touchRecord, touch) : touchBank[identifier] = createTouchRecord(touch), 
    touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
}

function recordTouchMove(touch) {
    var touchRecord = touchBank[getTouchIdentifier(touch)];
    touchRecord ? (touchRecord.touchActive = !0, touchRecord.previousPageX = touchRecord.currentPageX, 
    touchRecord.previousPageY = touchRecord.currentPageY, touchRecord.previousTimeStamp = touchRecord.currentTimeStamp, 
    touchRecord.currentPageX = touch.pageX, touchRecord.currentPageY = touch.pageY, 
    touchRecord.currentTimeStamp = timestampForTouch(touch), touchHistory.mostRecentTimeStamp = timestampForTouch(touch)) : console.error("Cannot record touch move without a touch start.\n" + "Touch Move: %s\n", "Touch Bank: %s", printTouch(touch), printTouchBank());
}

function recordTouchEnd(touch) {
    var touchRecord = touchBank[getTouchIdentifier(touch)];
    touchRecord ? (touchRecord.touchActive = !1, touchRecord.previousPageX = touchRecord.currentPageX, 
    touchRecord.previousPageY = touchRecord.currentPageY, touchRecord.previousTimeStamp = touchRecord.currentTimeStamp, 
    touchRecord.currentPageX = touch.pageX, touchRecord.currentPageY = touch.pageY, 
    touchRecord.currentTimeStamp = timestampForTouch(touch), touchHistory.mostRecentTimeStamp = timestampForTouch(touch)) : console.error("Cannot record touch end without a touch start.\n" + "Touch End: %s\n", "Touch Bank: %s", printTouch(touch), printTouchBank());
}

function printTouch(touch) {
    return JSON.stringify({
        identifier: touch.identifier,
        pageX: touch.pageX,
        pageY: touch.pageY,
        timestamp: timestampForTouch(touch)
    });
}

function printTouchBank() {
    var printed = JSON.stringify(touchBank.slice(0, MAX_TOUCH_BANK));
    return touchBank.length > MAX_TOUCH_BANK && (printed += " (original size: " + touchBank.length + ")"), 
    printed;
}

var ResponderTouchHistoryStore = {
    recordTouchTrack: function(topLevelType, nativeEvent) {
        if (isMoveish$2(topLevelType)) nativeEvent.changedTouches.forEach(recordTouchMove); else if (isStartish$2(topLevelType)) nativeEvent.changedTouches.forEach(recordTouchStart), 
        touchHistory.numberActiveTouches = nativeEvent.touches.length, 1 === touchHistory.numberActiveTouches && (touchHistory.indexOfSingleActiveTouch = nativeEvent.touches[0].identifier); else if (isEndish$2(topLevelType) && (nativeEvent.changedTouches.forEach(recordTouchEnd), 
        touchHistory.numberActiveTouches = nativeEvent.touches.length, 1 === touchHistory.numberActiveTouches)) for (var i = 0; i < touchBank.length; i++) {
            var touchTrackToCheck = touchBank[i];
            if (null != touchTrackToCheck && touchTrackToCheck.touchActive) {
                touchHistory.indexOfSingleActiveTouch = i;
                break;
            }
        }
    },
    touchHistory: touchHistory
}, ResponderTouchHistoryStore_1 = ResponderTouchHistoryStore;

function accumulate(current, next) {
    return invariant(null != next, "accumulate(...): Accumulated items must be not be null or undefined."), 
    null == current ? next : Array.isArray(current) ? current.concat(next) : Array.isArray(next) ? [ current ].concat(next) : [ current, next ];
}

var accumulate_1 = accumulate, isStartish$1 = EventPluginUtils_1.isStartish, isMoveish$1 = EventPluginUtils_1.isMoveish, isEndish$1 = EventPluginUtils_1.isEndish, executeDirectDispatch$1 = EventPluginUtils_1.executeDirectDispatch, hasDispatches$1 = EventPluginUtils_1.hasDispatches, executeDispatchesInOrderStopAtTrue$1 = EventPluginUtils_1.executeDispatchesInOrderStopAtTrue, responderInst = null, trackedTouchCount = 0, previousActiveTouches = 0, changeResponder = function(nextResponderInst, blockHostResponder) {
    var oldResponderInst = responderInst;
    responderInst = nextResponderInst, null !== ResponderEventPlugin.GlobalResponderHandler && ResponderEventPlugin.GlobalResponderHandler.onChange(oldResponderInst, nextResponderInst, blockHostResponder);
}, eventTypes = {
    startShouldSetResponder: {
        phasedRegistrationNames: {
            bubbled: "onStartShouldSetResponder",
            captured: "onStartShouldSetResponderCapture"
        }
    },
    scrollShouldSetResponder: {
        phasedRegistrationNames: {
            bubbled: "onScrollShouldSetResponder",
            captured: "onScrollShouldSetResponderCapture"
        }
    },
    selectionChangeShouldSetResponder: {
        phasedRegistrationNames: {
            bubbled: "onSelectionChangeShouldSetResponder",
            captured: "onSelectionChangeShouldSetResponderCapture"
        }
    },
    moveShouldSetResponder: {
        phasedRegistrationNames: {
            bubbled: "onMoveShouldSetResponder",
            captured: "onMoveShouldSetResponderCapture"
        }
    },
    responderStart: {
        registrationName: "onResponderStart"
    },
    responderMove: {
        registrationName: "onResponderMove"
    },
    responderEnd: {
        registrationName: "onResponderEnd"
    },
    responderRelease: {
        registrationName: "onResponderRelease"
    },
    responderTerminationRequest: {
        registrationName: "onResponderTerminationRequest"
    },
    responderGrant: {
        registrationName: "onResponderGrant"
    },
    responderReject: {
        registrationName: "onResponderReject"
    },
    responderTerminate: {
        registrationName: "onResponderTerminate"
    }
};

function setResponderAndExtractTransfer(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var shouldSetEventType = isStartish$1(topLevelType) ? eventTypes.startShouldSetResponder : isMoveish$1(topLevelType) ? eventTypes.moveShouldSetResponder : "topSelectionChange" === topLevelType ? eventTypes.selectionChangeShouldSetResponder : eventTypes.scrollShouldSetResponder, bubbleShouldSetFrom = responderInst ? ReactTreeTraversal.getLowestCommonAncestor(responderInst, targetInst) : targetInst, skipOverBubbleShouldSetFrom = bubbleShouldSetFrom === responderInst, shouldSetEvent = ResponderSyntheticEvent_1.getPooled(shouldSetEventType, bubbleShouldSetFrom, nativeEvent, nativeEventTarget);
    shouldSetEvent.touchHistory = ResponderTouchHistoryStore_1.touchHistory, skipOverBubbleShouldSetFrom ? EventPropagators_1.accumulateTwoPhaseDispatchesSkipTarget(shouldSetEvent) : EventPropagators_1.accumulateTwoPhaseDispatches(shouldSetEvent);
    var wantsResponderInst = executeDispatchesInOrderStopAtTrue$1(shouldSetEvent);
    if (shouldSetEvent.isPersistent() || shouldSetEvent.constructor.release(shouldSetEvent), 
    !wantsResponderInst || wantsResponderInst === responderInst) return null;
    var extracted, grantEvent = ResponderSyntheticEvent_1.getPooled(eventTypes.responderGrant, wantsResponderInst, nativeEvent, nativeEventTarget);
    grantEvent.touchHistory = ResponderTouchHistoryStore_1.touchHistory, EventPropagators_1.accumulateDirectDispatches(grantEvent);
    var blockHostResponder = !0 === executeDirectDispatch$1(grantEvent);
    if (responderInst) {
        var terminationRequestEvent = ResponderSyntheticEvent_1.getPooled(eventTypes.responderTerminationRequest, responderInst, nativeEvent, nativeEventTarget);
        terminationRequestEvent.touchHistory = ResponderTouchHistoryStore_1.touchHistory, 
        EventPropagators_1.accumulateDirectDispatches(terminationRequestEvent);
        var shouldSwitch = !hasDispatches$1(terminationRequestEvent) || executeDirectDispatch$1(terminationRequestEvent);
        if (terminationRequestEvent.isPersistent() || terminationRequestEvent.constructor.release(terminationRequestEvent), 
        shouldSwitch) {
            var terminateEvent = ResponderSyntheticEvent_1.getPooled(eventTypes.responderTerminate, responderInst, nativeEvent, nativeEventTarget);
            terminateEvent.touchHistory = ResponderTouchHistoryStore_1.touchHistory, EventPropagators_1.accumulateDirectDispatches(terminateEvent), 
            extracted = accumulate_1(extracted, [ grantEvent, terminateEvent ]), changeResponder(wantsResponderInst, blockHostResponder);
        } else {
            var rejectEvent = ResponderSyntheticEvent_1.getPooled(eventTypes.responderReject, wantsResponderInst, nativeEvent, nativeEventTarget);
            rejectEvent.touchHistory = ResponderTouchHistoryStore_1.touchHistory, EventPropagators_1.accumulateDirectDispatches(rejectEvent), 
            extracted = accumulate_1(extracted, rejectEvent);
        }
    } else extracted = accumulate_1(extracted, grantEvent), changeResponder(wantsResponderInst, blockHostResponder);
    return extracted;
}

function canTriggerTransfer(topLevelType, topLevelInst, nativeEvent) {
    return topLevelInst && ("topScroll" === topLevelType && !nativeEvent.responderIgnoreScroll || trackedTouchCount > 0 && "topSelectionChange" === topLevelType || isStartish$1(topLevelType) || isMoveish$1(topLevelType));
}

function noResponderTouches(nativeEvent) {
    var touches = nativeEvent.touches;
    if (!touches || 0 === touches.length) return !0;
    for (var i = 0; i < touches.length; i++) {
        var activeTouch = touches[i], target = activeTouch.target;
        if (null !== target && void 0 !== target && 0 !== target) {
            var targetInst = EventPluginUtils_1.getInstanceFromNode(target);
            if (ReactTreeTraversal.isAncestor(responderInst, targetInst)) return !1;
        }
    }
    return !0;
}

var ResponderEventPlugin = {
    _getResponder: function() {
        return responderInst;
    },
    eventTypes: eventTypes,
    extractEvents: function(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        if (isStartish$1(topLevelType)) trackedTouchCount += 1; else if (isEndish$1(topLevelType)) {
            if (!(trackedTouchCount >= 0)) return console.error("Ended a touch event which was not counted in `trackedTouchCount`."), 
            null;
            trackedTouchCount -= 1;
        }
        ResponderTouchHistoryStore_1.recordTouchTrack(topLevelType, nativeEvent);
        var extracted = canTriggerTransfer(topLevelType, targetInst, nativeEvent) ? setResponderAndExtractTransfer(topLevelType, targetInst, nativeEvent, nativeEventTarget) : null, isResponderTouchStart = responderInst && isStartish$1(topLevelType), isResponderTouchMove = responderInst && isMoveish$1(topLevelType), isResponderTouchEnd = responderInst && isEndish$1(topLevelType), incrementalTouch = isResponderTouchStart ? eventTypes.responderStart : isResponderTouchMove ? eventTypes.responderMove : isResponderTouchEnd ? eventTypes.responderEnd : null;
        if (incrementalTouch) {
            var gesture = ResponderSyntheticEvent_1.getPooled(incrementalTouch, responderInst, nativeEvent, nativeEventTarget);
            gesture.touchHistory = ResponderTouchHistoryStore_1.touchHistory, EventPropagators_1.accumulateDirectDispatches(gesture), 
            extracted = accumulate_1(extracted, gesture);
        }
        var isResponderTerminate = responderInst && "topTouchCancel" === topLevelType, isResponderRelease = responderInst && !isResponderTerminate && isEndish$1(topLevelType) && noResponderTouches(nativeEvent), finalTouch = isResponderTerminate ? eventTypes.responderTerminate : isResponderRelease ? eventTypes.responderRelease : null;
        if (finalTouch) {
            var finalEvent = ResponderSyntheticEvent_1.getPooled(finalTouch, responderInst, nativeEvent, nativeEventTarget);
            finalEvent.touchHistory = ResponderTouchHistoryStore_1.touchHistory, EventPropagators_1.accumulateDirectDispatches(finalEvent), 
            extracted = accumulate_1(extracted, finalEvent), changeResponder(null);
        }
        var numberActiveTouches = ResponderTouchHistoryStore_1.touchHistory.numberActiveTouches;
        return ResponderEventPlugin.GlobalInteractionHandler && numberActiveTouches !== previousActiveTouches && ResponderEventPlugin.GlobalInteractionHandler.onChange(numberActiveTouches), 
        previousActiveTouches = numberActiveTouches, extracted;
    },
    GlobalResponderHandler: null,
    GlobalInteractionHandler: null,
    injection: {
        injectGlobalResponderHandler: function(GlobalResponderHandler) {
            ResponderEventPlugin.GlobalResponderHandler = GlobalResponderHandler;
        },
        injectGlobalInteractionHandler: function(GlobalInteractionHandler) {
            ResponderEventPlugin.GlobalInteractionHandler = GlobalInteractionHandler;
        }
    }
}, ResponderEventPlugin_1 = ResponderEventPlugin;

RCTEventEmitter.register(ReactNativeEventEmitter_1), EventPluginHub_1.injection.injectEventPluginOrder(ReactNativeEventPluginOrder_1), 
EventPluginUtils_1.injection.injectComponentTree(ReactNativeComponentTree_1), ResponderEventPlugin_1.injection.injectGlobalResponderHandler(ReactNativeGlobalResponderHandler_1), 
EventPluginHub_1.injection.injectEventPluginsByName({
    ResponderEventPlugin: ResponderEventPlugin_1,
    ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin_1
});

var DevOnlyStubShim = null;

function _classCallCheck$2(instance, Constructor) {
    if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
}

function _possibleConstructorReturn(self, call) {
    if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return !call || "object" != typeof call && "function" != typeof call ? self : call;
}

function _inherits(subClass, superClass) {
    if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            enumerable: !1,
            writable: !0,
            configurable: !0
        }
    }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass);
}

var ReactNativeFeatureFlags$1 = require("ReactNativeFeatureFlags"), mountSafeCallback$2 = NativeMethodsMixinUtils.mountSafeCallback, findNumericNodeHandle = ReactNativeFeatureFlags$1.useFiber ? findNumericNodeHandleFiber : DevOnlyStubShim, ReactNativeComponent = function(_React$Component) {
    _inherits(ReactNativeComponent, _React$Component);
    function ReactNativeComponent() {
        return _classCallCheck$2(this, ReactNativeComponent), _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
    }
    return ReactNativeComponent.prototype.blur = function() {
        TextInputState.blurTextInput(findNumericNodeHandle(this));
    }, ReactNativeComponent.prototype.focus = function() {
        TextInputState.focusTextInput(findNumericNodeHandle(this));
    }, ReactNativeComponent.prototype.measure = function(callback) {
        UIManager.measure(findNumericNodeHandle(this), mountSafeCallback$2(this, callback));
    }, ReactNativeComponent.prototype.measureInWindow = function(callback) {
        UIManager.measureInWindow(findNumericNodeHandle(this), mountSafeCallback$2(this, callback));
    }, ReactNativeComponent.prototype.measureLayout = function(relativeToNativeNode, onSuccess, onFail) {
        UIManager.measureLayout(findNumericNodeHandle(this), relativeToNativeNode, mountSafeCallback$2(this, onFail), mountSafeCallback$2(this, onSuccess));
    }, ReactNativeComponent.prototype.setNativeProps = function(nativeProps) {
        injectedSetNativeProps(this, nativeProps);
    }, ReactNativeComponent;
}(react.Component);

function setNativePropsFiber(componentOrHandle, nativeProps) {
    var maybeInstance = void 0;
    try {
        maybeInstance = findNodeHandle_1(componentOrHandle);
    } catch (error) {}
    if (null != maybeInstance) {
        var viewConfig = maybeInstance.viewConfig, updatePayload = ReactNativeAttributePayload_1.create(nativeProps, viewConfig.validAttributes);
        UIManager.updateView(maybeInstance._nativeTag, viewConfig.uiViewClassName, updatePayload);
    }
}

function setNativePropsStack(componentOrHandle, nativeProps) {
    var maybeInstance = findNodeHandle_1(componentOrHandle);
    if (null != maybeInstance) {
        var viewConfig = void 0;
        if (void 0 !== maybeInstance.viewConfig) viewConfig = maybeInstance.viewConfig; else if (void 0 !== maybeInstance._instance && void 0 !== maybeInstance._instance.viewConfig) viewConfig = maybeInstance._instance.viewConfig; else {
            for (;void 0 !== maybeInstance._renderedComponent; ) maybeInstance = maybeInstance._renderedComponent;
            viewConfig = maybeInstance.viewConfig;
        }
        var tag = "function" == typeof maybeInstance.getHostNode ? maybeInstance.getHostNode() : maybeInstance._rootNodeID, updatePayload = ReactNativeAttributePayload_1.create(nativeProps, viewConfig.validAttributes);
        UIManager.updateView(tag, viewConfig.uiViewClassName, updatePayload);
    }
}

var injectedSetNativeProps = void 0;

injectedSetNativeProps = ReactNativeFeatureFlags$1.useFiber ? setNativePropsFiber : setNativePropsStack;

var ReactNativeComponent_1 = ReactNativeComponent, ReactNativeFeatureFlags$2 = require("ReactNativeFeatureFlags"), mountSafeCallback$3 = NativeMethodsMixinUtils.mountSafeCallback, findNumericNodeHandle$1 = ReactNativeFeatureFlags$2.useFiber ? findNumericNodeHandleFiber : DevOnlyStubShim, NativeMethodsMixin = {
    measure: function(callback) {
        UIManager.measure(findNumericNodeHandle$1(this), mountSafeCallback$3(this, callback));
    },
    measureInWindow: function(callback) {
        UIManager.measureInWindow(findNumericNodeHandle$1(this), mountSafeCallback$3(this, callback));
    },
    measureLayout: function(relativeToNativeNode, onSuccess, onFail) {
        UIManager.measureLayout(findNumericNodeHandle$1(this), relativeToNativeNode, mountSafeCallback$3(this, onFail), mountSafeCallback$3(this, onSuccess));
    },
    setNativeProps: function(nativeProps) {
        injectedSetNativeProps$1(this, nativeProps);
    },
    focus: function() {
        TextInputState.focusTextInput(findNumericNodeHandle$1(this));
    },
    blur: function() {
        TextInputState.blurTextInput(findNumericNodeHandle$1(this));
    }
};

function setNativePropsFiber$1(componentOrHandle, nativeProps) {
    var maybeInstance = void 0;
    try {
        maybeInstance = findNodeHandle_1(componentOrHandle);
    } catch (error) {}
    if (null != maybeInstance) {
        var viewConfig = maybeInstance.viewConfig, updatePayload = ReactNativeAttributePayload_1.create(nativeProps, viewConfig.validAttributes);
        UIManager.updateView(maybeInstance._nativeTag, viewConfig.uiViewClassName, updatePayload);
    }
}

function setNativePropsStack$1(componentOrHandle, nativeProps) {
    var maybeInstance = findNodeHandle_1(componentOrHandle);
    if (null != maybeInstance) {
        var viewConfig = void 0;
        if (void 0 !== maybeInstance.viewConfig) viewConfig = maybeInstance.viewConfig; else if (void 0 !== maybeInstance._instance && void 0 !== maybeInstance._instance.viewConfig) viewConfig = maybeInstance._instance.viewConfig; else {
            for (;void 0 !== maybeInstance._renderedComponent; ) maybeInstance = maybeInstance._renderedComponent;
            viewConfig = maybeInstance.viewConfig;
        }
        var tag = "function" == typeof maybeInstance.getHostNode ? maybeInstance.getHostNode() : maybeInstance._rootNodeID, updatePayload = ReactNativeAttributePayload_1.create(nativeProps, viewConfig.validAttributes);
        UIManager.updateView(tag, viewConfig.uiViewClassName, updatePayload);
    }
}

var injectedSetNativeProps$1 = void 0;

injectedSetNativeProps$1 = ReactNativeFeatureFlags$2.useFiber ? setNativePropsFiber$1 : setNativePropsStack$1;

var NativeMethodsMixin_1 = NativeMethodsMixin, TouchHistoryMath = {
    centroidDimension: function(touchHistory, touchesChangedAfter, isXAxis, ofCurrent) {
        var touchBank = touchHistory.touchBank, total = 0, count = 0, oneTouchData = 1 === touchHistory.numberActiveTouches ? touchHistory.touchBank[touchHistory.indexOfSingleActiveTouch] : null;
        if (null !== oneTouchData) oneTouchData.touchActive && oneTouchData.currentTimeStamp > touchesChangedAfter && (total += ofCurrent && isXAxis ? oneTouchData.currentPageX : ofCurrent && !isXAxis ? oneTouchData.currentPageY : !ofCurrent && isXAxis ? oneTouchData.previousPageX : oneTouchData.previousPageY, 
        count = 1); else for (var i = 0; i < touchBank.length; i++) {
            var touchTrack = touchBank[i];
            if (null !== touchTrack && void 0 !== touchTrack && touchTrack.touchActive && touchTrack.currentTimeStamp >= touchesChangedAfter) {
                var toAdd;
                toAdd = ofCurrent && isXAxis ? touchTrack.currentPageX : ofCurrent && !isXAxis ? touchTrack.currentPageY : !ofCurrent && isXAxis ? touchTrack.previousPageX : touchTrack.previousPageY, 
                total += toAdd, count++;
            }
        }
        return count > 0 ? total / count : TouchHistoryMath.noCentroid;
    },
    currentCentroidXOfTouchesChangedAfter: function(touchHistory, touchesChangedAfter) {
        return TouchHistoryMath.centroidDimension(touchHistory, touchesChangedAfter, !0, !0);
    },
    currentCentroidYOfTouchesChangedAfter: function(touchHistory, touchesChangedAfter) {
        return TouchHistoryMath.centroidDimension(touchHistory, touchesChangedAfter, !1, !0);
    },
    previousCentroidXOfTouchesChangedAfter: function(touchHistory, touchesChangedAfter) {
        return TouchHistoryMath.centroidDimension(touchHistory, touchesChangedAfter, !0, !1);
    },
    previousCentroidYOfTouchesChangedAfter: function(touchHistory, touchesChangedAfter) {
        return TouchHistoryMath.centroidDimension(touchHistory, touchesChangedAfter, !1, !1);
    },
    currentCentroidX: function(touchHistory) {
        return TouchHistoryMath.centroidDimension(touchHistory, 0, !0, !0);
    },
    currentCentroidY: function(touchHistory) {
        return TouchHistoryMath.centroidDimension(touchHistory, 0, !1, !0);
    },
    noCentroid: -1
}, TouchHistoryMath_1 = TouchHistoryMath, createReactNativeComponentClassFiber = function(viewConfig) {
    return ReactNativeViewConfigRegistry_1.register(viewConfig);
}, createReactNativeComponentClassFiber_1 = createReactNativeComponentClassFiber, ReactNativeFeatureFlags$3 = require("ReactNativeFeatureFlags"), createReactNativeComponentClass = ReactNativeFeatureFlags$3.useFiber ? createReactNativeComponentClassFiber_1 : DevOnlyStubShim, ReactNativeFeatureFlags$4 = require("ReactNativeFeatureFlags"), findNumericNodeHandle$2 = ReactNativeFeatureFlags$4.useFiber ? findNumericNodeHandleFiber : DevOnlyStubShim;

function takeSnapshot(view, options) {
    return "number" != typeof view && "window" !== view && (view = findNumericNodeHandle$2(view) || "window"), 
    UIManager.__takeSnapshot(view, options);
}

var takeSnapshot_1 = takeSnapshot, injectInternals = ReactFiberDevToolsHook.injectInternals;

ReactGenericBatching_1.injection.injectFiberBatchedUpdates(ReactNativeFiberRenderer.batchedUpdates);

var roots = new Map();

ReactFiberErrorLogger.injection.injectDialog(ReactNativeFiberErrorDialog_1.showDialog);

var ReactNativeFiber = {
    NativeComponent: ReactNativeComponent_1,
    findNodeHandle: findNumericNodeHandleFiber,
    render: function(element, containerTag, callback) {
        var root = roots.get(containerTag);
        return root || (root = ReactNativeFiberRenderer.createContainer(containerTag), roots.set(containerTag, root)), 
        ReactNativeFiberRenderer.updateContainer(element, root, null, callback), ReactNativeFiberRenderer.getPublicRootInstance(root);
    },
    unmountComponentAtNode: function(containerTag) {
        var root = roots.get(containerTag);
        root && ReactNativeFiberRenderer.updateContainer(null, root, null, function() {
            roots.delete(containerTag);
        });
    },
    unmountComponentAtNodeAndRemoveContainer: function(containerTag) {
        ReactNativeFiber.unmountComponentAtNode(containerTag), UIManager.removeRootView(containerTag);
    },
    unstable_createPortal: function(children, containerTag) {
        var key = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : null;
        return ReactPortal.createPortal(children, containerTag, null, key);
    },
    unstable_batchedUpdates: ReactGenericBatching_1.batchedUpdates,
    flushSync: ReactNativeFiberRenderer.flushSync,
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
        NativeMethodsMixin: NativeMethodsMixin_1,
        ReactGlobalSharedState: ReactGlobalSharedState_1,
        ReactNativeComponentTree: ReactNativeComponentTree_1,
        ReactNativePropRegistry: ReactNativePropRegistry_1,
        TouchHistoryMath: TouchHistoryMath_1,
        createReactNativeComponentClass: createReactNativeComponentClass,
        takeSnapshot: takeSnapshot_1
    }
};

injectInternals({
    findFiberByHostInstance: ReactNativeComponentTree_1.getClosestInstanceFromNode,
    findHostInstanceByFiber: ReactNativeFiberRenderer.findHostInstance,
    getInspectorDataForViewTag: ReactNativeFiberInspector.getInspectorDataForViewTag,
    bundleType: 0,
    version: ReactVersion
});

var ReactNativeFiberEntry = ReactNativeFiber;

module.exports = ReactNativeFiberEntry;
