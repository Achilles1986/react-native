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

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactModuleWithSpec;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;

public abstract class NativeAsyncStorageSpec extends ReactContextBaseJavaModule implements ReactModuleWithSpec, TurboModule {
  public NativeAsyncStorageSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @ReactMethod
  public abstract void clear(Callback callback);

  @ReactMethod
  public abstract void getAllKeys(Callback callback);

  @ReactMethod
  public abstract void multiGet(ReadableArray keys, Callback callback);

  @ReactMethod
  public abstract void multiMerge(ReadableArray kvPairs, Callback callback);

  @ReactMethod
  public abstract void multiRemove(ReadableArray keys, Callback callback);

  @ReactMethod
  public abstract void multiSet(ReadableArray kvPairs, Callback callback);
}
