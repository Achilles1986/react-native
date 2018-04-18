// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.devsupport;

import android.util.Pair;
import android.view.View;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.Nullable;

@ReactModule(name = JSDevSupport.MODULE_NAME)
public class JSDevSupport extends ReactContextBaseJavaModule {

  static final String MODULE_NAME = "JSDevSupport";

  public static final int ERROR_CODE_EXCEPTION = 0;
  public static final int ERROR_CODE_VIEW_NOT_FOUND = 1;

  @Nullable
  private volatile DevSupportCallback mCurrentCallback = null;

  public interface JSDevSupportModule extends JavaScriptModule {
    void getJSHierarchy(int reactTag);
  }

  public JSDevSupport(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  public interface DevSupportCallback {

    void onSuccess(String data);

    void onFailure(int errorCode, Exception error);
  }

  /**
   * Notifies the callback with either the JS hierarchy of the deepest leaf from the given root view
   * or with an error.
   */
  public synchronized void computeDeepestJSHierarchy(View root, DevSupportCallback callback) {
    final Pair<View, Integer> deepestPairView = ViewHierarchyUtil.getDeepestLeaf(root);
    View deepestView = deepestPairView.first;
    Integer tagId = deepestView.getId();
    getJSHierarchy(tagId, callback);
  }

  public synchronized void getJSHierarchy(int reactTag, DevSupportCallback callback) {
    JSDevSupportModule
        jsDevSupportModule = getReactApplicationContext().getJSModule(JSDevSupportModule.class);
    if (jsDevSupportModule == null) {
      callback.onFailure(ERROR_CODE_EXCEPTION, new JSCHeapCapture.CaptureException(MODULE_NAME +
        " module not registered."));
      return;
    }
    mCurrentCallback = callback;
    jsDevSupportModule.getJSHierarchy(reactTag);
  }

  @SuppressWarnings("unused")
  @ReactMethod
  public synchronized void onSuccess(String data) {
    if (mCurrentCallback != null) {
      mCurrentCallback.onSuccess(data);
    }
  }

  @SuppressWarnings("unused")
  @ReactMethod
  public synchronized void onFailure(int errorCode, String error) {
    if (mCurrentCallback != null) {
      mCurrentCallback.onFailure(errorCode, new RuntimeException(error));
    }
  }

  @Override
  public Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<>();
    constants.put("ERROR_CODE_EXCEPTION", ERROR_CODE_EXCEPTION);
    constants.put("ERROR_CODE_VIEW_NOT_FOUND", ERROR_CODE_VIEW_NOT_FOUND);
    return constants;
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

}
