/**
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*
* @generated by codegen project: GeneratePropsJavaInterface.js
*/

package com.facebook.react.viewmanagers;

import android.view.View;
import androidx.annotation.Nullable;

public interface AndroidDrawerLayoutManagerInterface<T extends View> {
  void setKeyboardDismissMode(T view, @Nullable String value);
  void setDrawerBackgroundColor(T view, @Nullable Integer value);
  void setDrawerPosition(T view, @Nullable String value);
  void setDrawerWidth(T view, @Nullable Float value);
  void setDrawerLockMode(T view, @Nullable String value);
  void setStatusBarBackgroundColor(T view, @Nullable Integer value);
  void openDrawer(T view);
  void closeDrawer(T view);
}
