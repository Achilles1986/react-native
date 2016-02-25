/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

/**
 * Root node of the shadow node hierarchy. Currently, the only node that can actually map to a View.
 */
/* package */ final class FlatRootShadowNode extends FlatShadowNode {

  /* package */ FlatRootShadowNode() {
    forceMountToView();
    signalBackingViewIsCreated();
  }

  /**
   * Returns true when this CSSNode tree needs to be re-laid out. If true, FlatUIImplementation
   * will request LayoutEngine to perform a layout pass to update node boundaries. This is used
   * to avoid unnecessary node updates.
   */
  /* package */ boolean needsLayout() {
    return isDirty();
  }
}
