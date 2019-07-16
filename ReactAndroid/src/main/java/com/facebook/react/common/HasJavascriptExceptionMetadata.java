/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.common;

import javax.annotation.Nullable;

/** A JS exception carrying metadata. */
public interface HasJavascriptExceptionMetadata {

  @Nullable
  String getExtraDataAsJson();
}
