/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import type {ImageSource} from '../../../../../Libraries/Image/ImageSource';
import type {
  PointValue,
  ColorValue,
} from '../../../../../Libraries/StyleSheet/StyleSheetTypes';
import type {
  Int32,
  Float,
  WithDefault,
} from '../../../../../Libraries/Types/CodegenTypes';
import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';
import type {NativeComponentType} from '../../../../../Libraries/Utilities/codegenNativeComponent';

type ObjectArrayPropType = $ReadOnly<{|
  array: $ReadOnlyArray<string>,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  objectProp?: $ReadOnly<{|
    stringProp?: WithDefault<string, ''>,
    booleanProp: boolean,
    floatProp: Float,
    intProp: Int32,
    stringEnumProp?: WithDefault<'small' | 'large', 'small'>,
    intEnumProp?: WithDefault<0 | 1, 0>,
  |}>,
  objectArrayProp: ObjectArrayPropType,
  objectPrimitiveRequiredProp: $ReadOnly<{|
    image: ImageSource,
    color?: ColorValue,
    point: ?PointValue,
  |}>,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'ObjectPropsNativeComponent',
): NativeComponentType<NativeProps>);
