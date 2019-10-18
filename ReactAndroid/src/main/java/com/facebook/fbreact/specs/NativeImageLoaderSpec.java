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

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactModuleWithSpec;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;

public abstract class NativeImageLoaderSpec extends ReactContextBaseJavaModule implements ReactModuleWithSpec, TurboModule {
  public NativeImageLoaderSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @ReactMethod
  public abstract void getSize(String uri, Promise promise);

  @ReactMethod
  public abstract void prefetchImage(String uri, Promise promise);

  @ReactMethod
  public abstract void queryCache(ReadableArray uris, Promise promise);

  @ReactMethod
  public abstract void getSizeWithHeaders(String uri, ReadableMap headers, Promise promise);
}
