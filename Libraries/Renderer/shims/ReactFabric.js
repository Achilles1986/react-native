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

import {BatchedBridge} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

// TODO @sema: Adjust types
import type {ReactNativeType} from './ReactNativeTypes';

let ReactFabric;

if (__DEV__) {
  ReactFabric = require('../implementations/ReactFabric-dev');
} else {
  ReactFabric = require('../implementations/ReactFabric-prod');
}

if (global.RN$Bridgeless) {
  // TODO T47525605 Clean this up once stopSurface has been added
  global.RN$stopSurface =
    ReactFabric.stopSurface ?? ReactFabric.unmountComponentAtNode;
} else {
  BatchedBridge.registerCallableModule('ReactFabric', ReactFabric);
}

module.exports = (ReactFabric: ReactNativeType);
