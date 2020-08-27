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
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;

public abstract class NativeImagePickerIOSSpec extends ReactContextBaseJavaModule implements ReactModuleWithSpec, TurboModule {
  public NativeImagePickerIOSSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @ReactMethod
  public abstract void canRecordVideos(Callback callback);

  @ReactMethod
  public abstract void canUseCamera(Callback callback);

  @ReactMethod
  public abstract void clearAllPendingVideos();

  @ReactMethod
  public abstract void openCameraDialog(ReadableMap config, Callback successCallback,
      Callback cancelCallback);

  @ReactMethod
  public abstract void openSelectDialog(ReadableMap config, Callback successCallback,
      Callback cancelCallback);

  @ReactMethod
  public abstract void removePendingVideo(String url);
}
