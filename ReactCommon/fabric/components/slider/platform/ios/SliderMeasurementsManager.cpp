/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SliderMeasurementsManager.h"

namespace facebook {
namespace react {

const bool SliderMeasurementsManager::shouldMeasureSlider() const {
  return false;
}

Size SliderMeasurementsManager::measure(
    LayoutConstraints layoutConstraints) const {
  assert(false); // should never reach this point
  return {};
}

} // namespace react
} // namespace facebook
