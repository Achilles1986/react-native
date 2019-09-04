/**
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*
* @generated by codegen project: GeneratePropsJavaDelegate.js
*/

package com.facebook.react.viewmanagers;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.uimanager.BaseViewManagerDelegate;
import com.facebook.react.uimanager.BaseViewManagerInterface;
import com.facebook.react.uimanager.LayoutShadowNode;

public class ActivityIndicatorViewManagerDelegate<T extends View, U extends BaseViewManagerInterface<T> & ActivityIndicatorViewManagerInterface<T>> extends BaseViewManagerDelegate<T, U> {
  public ActivityIndicatorViewManagerDelegate(U viewManager) {
    super(viewManager);
  }
  @Override
  public void setProperty(T view, String propName, @Nullable Object value) {
    switch (propName) {
      case "hidesWhenStopped":
        mViewManager.setHidesWhenStopped(view, value == null ? false : (boolean) value);
        break;
      case "animating":
        mViewManager.setAnimating(view, value == null ? false : (boolean) value);
        break;
      case "color":
        mViewManager.setColor(view, value == null ? null : ((Double) value).intValue());
        break;
      case "size":
        mViewManager.setSize(view, (String) value);
        break;
      default:
        super.setProperty(view, propName, value);
    }
  }
}
