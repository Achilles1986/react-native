/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.jstasks;

/**
 * Listener interface for task lifecycle events.
 */
public interface HeadlessJsTaskEventListener {

  /**
   * Called when a JS task is started, on the UI thread.
   *
   * @param taskId the unique identifier of this task instance
   */
  void onHeadlessJsTaskStart(int taskId);

  /**
   * Called when a JS task finishes (i.e. when
   * {@link HeadlessJsTaskSupportModule#notifyTaskFinished} is called, or when it times out), on the
   * UI thread.
   */
  void onHeadlessJsTaskFinish(int taskId);
}
