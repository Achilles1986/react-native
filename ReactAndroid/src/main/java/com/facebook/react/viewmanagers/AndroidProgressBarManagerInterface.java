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

public interface AndroidProgressBarManagerInterface<T extends View> {
  void setStyleAttr(T view, @Nullable String value);
  void setTypeAttr(T view, @Nullable String value);
  void setIndeterminate(T view, boolean value);
  void setProgress(T view, float value);
  void setAnimating(T view, boolean value);
  void setColor(T view, @Nullable Integer value);
  void setTestID(T view, @Nullable String value);
}
