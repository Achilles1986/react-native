/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 *
 * <p>Generated by an internal genrule from Flow types.
 *
 * @generated
 * @nolint
 */

package com.facebook.fbreact.specs;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactModuleWithSpec;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;

public abstract class NativeRedBoxSpec extends ReactContextBaseJavaModule implements ReactModuleWithSpec, TurboModule {
  public NativeRedBoxSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @ReactMethod
  public abstract void setExtraData(ReadableMap extraData, String forIdentifier);

  @ReactMethod
  public abstract void dismiss();
}
