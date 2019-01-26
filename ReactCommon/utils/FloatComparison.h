/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
 
#pragma once
 
namespace facebook {
namespace react {
 
inline bool floatEquality (float a, float b, float epsilon = 0.005f) {
  return (std::isnan(a) && std::isnan(b)) || (!std::isnan(a) && !std::isnan(b) && fabs(a - b) < epsilon);
}

} // namespace react
} // namespace facebook
