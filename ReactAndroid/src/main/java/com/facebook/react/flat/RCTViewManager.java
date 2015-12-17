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
 * ViewManager that creates instances of RCTView.
 */
/* package */ final class RCTViewManager extends FlatViewManager {

  @Override
  public String getName() {
    return "RCTView";
  }

  @Override
  public RCTView createShadowNodeInstance() {
    return new RCTView();
  }

  @Override
  public Class<RCTView> getShadowNodeClass() {
    return RCTView.class;
  }
}
