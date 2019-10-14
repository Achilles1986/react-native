/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {ViewProps} from '../View/ViewPropTypes';
import type {SyntheticEvent} from '../../Types/CoreEventTypes';

type CheckBoxEvent = SyntheticEvent<
  $ReadOnly<{|
    target: number,
    value: boolean,
  |}>,
>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  /**
   * Used in case the props change removes the component.
   */
  onChange?: ?(event: CheckBoxEvent) => mixed,

  /**
   * Invoked with the new value when the value changes.
   */
  onValueChange?: ?(value: boolean) => mixed,

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: ?string,

  on?: ?boolean,
  enabled?: boolean,
  tintColors: {|true: ?number, false: ?number|} | typeof undefined,
|}>;

const AndroidCheckBoxNativeComponent: HostComponent<NativeProps> = requireNativeComponent<NativeProps>(
  'AndroidCheckBox',
);

module.exports = AndroidCheckBoxNativeComponent;
