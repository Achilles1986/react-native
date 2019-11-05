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

import {TurboModuleRegistry, type TurboModule} from 'react-native';

export type String = string;
type CB = (value: String) => void;

export interface Spec extends TurboModule {
  +getValueWithCallback: (callback: (value: string) => void) => void;
  +getValueWithCallbackWithAlias: (c: CB) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
): Spec);
