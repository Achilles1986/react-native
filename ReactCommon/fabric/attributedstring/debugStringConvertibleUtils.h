/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/debug/debugStringConvertibleUtils.h>
#include <fabric/attributedstring/textValuesConversions.h>

namespace facebook {
namespace react {

DEBUG_STRING_CONVERTIBLE_TEMPLATE(EllipsizeMode, stringFromEllipsizeMode)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(FontWeight, stringFromFontWeight)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(FontStyle, stringFromFontStyle)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(FontVariant, stringFromFontVariant)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(TextAlignment, stringFromTextAlignment)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(WritingDirection, stringFromWritingDirection)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(TextDecorationLineType, stringFromTextDecorationLineType)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(TextDecorationLineStyle, stringFromTextDecorationLineStyle)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(TextDecorationLinePattern, stringFromTextDecorationLinePattern)

} // namespace react
} // namespace facebook
