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
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.BaseViewManagerDelegate;
import com.facebook.react.uimanager.LayoutShadowNode;

public class AndroidDrawerLayoutManagerDelegate<T extends View, U extends BaseViewManager<T, ? extends LayoutShadowNode> & AndroidDrawerLayoutManagerInterface<T>> extends BaseViewManagerDelegate<T, U> {
  public AndroidDrawerLayoutManagerDelegate(U viewManager) {
    super(viewManager);
  }
  @Override
  public void setProperty(T view, String propName, @Nullable Object value) {
    switch (propName) {
      case "keyboardDismissMode":
        mViewManager.setKeyboardDismissMode(view, (String) value);
        break;
      case "drawerBackgroundColor":
        mViewManager.setDrawerBackgroundColor(view, value == null ? null : ((Double) value).intValue());
        break;
      case "drawerPosition":
        mViewManager.setDrawerPosition(view, (String) value);
        break;
      case "drawerWidth":
        mViewManager.setDrawerWidth(view, value == null ? 0f : ((Double) value).floatValue());
        break;
      case "drawerLockMode":
        mViewManager.setDrawerLockMode(view, (String) value);
        break;
      case "statusBarBackgroundColor":
        mViewManager.setStatusBarBackgroundColor(view, value == null ? null : ((Double) value).intValue());
        break;
      default:
        super.setProperty(view, propName, value);
    }
  }

  public void receiveCommand(AndroidDrawerLayoutManagerInterface<T> viewManager, T view, String commandName, ReadableArray args) {
    switch (commandName) {
      case "openDrawer":
        viewManager.openDrawer(view);
        break;
      case "closeDrawer":
        viewManager.closeDrawer(view);
        break;
    }
  }
}
