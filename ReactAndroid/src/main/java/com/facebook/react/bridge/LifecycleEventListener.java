/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

/**
 * Listener for receiving activity lifecycle events.
 *
 * When multiple activities share a react instance, only the most recent one's lifecycle events get
 * forwarded to listeners. Consider the following scenarios:
 *
 * 1. Navigating from Activity A to B will trigger two events: A#onHostPause and B#onHostResume. Any
 *    subsequent lifecycle events coming from Activity A, such as onHostDestroy, will be ignored.
 * 2. Navigating back from Activity B to Activity A will trigger the same events: B#onHostPause and
 *    A#onHostResume. Any subsequent events coming from Activity B, such as onHostDestroy, are
 *    ignored.
 * 3. Navigating back from Activity A to a non-React Activity or to the home screen will trigger two
 *    events: onHostPause and onHostDestroy.
 * 4. Navigating from Activity A to a non-React Activity B will trigger one event: onHostPause.
 *    Later, if Activity A is destroyed (e.g. because of resource contention), onHostDestroy is
 *    triggered.
 */
public interface LifecycleEventListener {

  /**
   * Called when host activity receives resume event (e.g. {@link Activity#onResume}. Always called
   * for the most current activity.
   */
  void onHostResume();

  /**
   * Called when host activity receives pause event (e.g. {@link Activity#onPause}. Always called
   * for the most current activity.
   */
  void onHostPause();

  /**
   * Called when host activity receives destroy event (e.g. {@link Activity#onDestroy}. Only called
   * for the last React activity to be destroyed.
   */
  void onHostDestroy();
}
