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

import type {RNTesterModuleInfo} from '../types/RNTesterTypes';

const Components: Array<RNTesterModuleInfo> = [
  {
    key: 'ActivityIndicatorExample',
    category: 'UI',
    module: require('../examples/ActivityIndicator/ActivityIndicatorExample'),
  },
  {
    key: 'ButtonExample',
    category: 'UI',
    module: require('../examples/Button/ButtonExample'),
  },
  {
    key: 'FlatListExampleIndex',
    module: require('../examples/FlatList/FlatListExampleIndex').default,
    category: 'ListView',
    supportsTVOS: true,
  },
  {
    key: 'FlatList-withSeparators',
    module: require('../examples/FlatList/FlatList-withSeparators'),
    category: 'ListView',
  },
  {
    key: 'FlatList-onViewableItemsChanged',
    module: require('../examples/FlatList/FlatList-onViewableItemsChanged'),
    category: 'ListView',
  },
  {
    key: 'FlatList-onEndReached',
    module: require('../examples/FlatList/FlatList-onEndReached'),
    category: 'ListView',
  },
  {
    key: 'ImageExample',
    category: 'Basic',
    module: require('../examples/Image/ImageExample'),
  },
  {
    key: 'JSResponderHandlerExample',
    module: require('../examples/JSResponderHandlerExample/JSResponderHandlerExample'),
  },
  {
    key: 'KeyboardAvoidingViewExample',
    module: require('../examples/KeyboardAvoidingView/KeyboardAvoidingViewExample'),
  },
  {
    key: 'ModalExample',
    category: 'UI',
    module: require('../examples/Modal/ModalExample'),
  },
  {
    key: 'MultiColumnExample',
    category: 'ListView',
    module: require('../examples/MultiColumn/MultiColumnExample'),
  },
  {
    key: 'NewAppScreenExample',
    module: require('../examples/NewAppScreen/NewAppScreenExample'),
  },
  {
    key: 'PressableExample',
    category: 'UI',
    module: require('../examples/Pressable/PressableExample'),
  },
  {
    key: 'RefreshControlExample',
    module: require('../examples/RefreshControl/RefreshControlExample'),
  },
  {
    key: 'ScrollViewExample',
    category: 'Basic',
    module: require('../examples/ScrollView/ScrollViewExample'),
  },
  {
    key: 'ScrollViewSimpleExample',
    category: 'Basic',
    module: require('../examples/ScrollView/ScrollViewSimpleExample'),
  },
  {
    key: 'ScrollViewAnimatedExample',
    category: 'Basic',
    module: require('../examples/ScrollView/ScrollViewAnimatedExample'),
  },
  {
    key: 'SectionListExample',
    category: 'ListView',
    module: require('../examples/SectionList/SectionListIndex'),
  },
  {
    key: 'StatusBarExample',
    category: 'UI',
    module: require('../examples/StatusBar/StatusBarExample'),
  },
  {
    key: 'SwipeableCardExample',
    category: 'UI',
    module: require('../examples/SwipeableCardExample/SwipeableCardExample'),
  },
  {
    key: 'SwitchExample',
    category: 'UI',
    module: require('../examples/Switch/SwitchExample'),
  },
  {
    key: 'TextExample',
    category: 'Basic',
    module: require('../examples/Text/TextExample'),
  },
  {
    key: 'TextInputExample',
    category: 'Basic',
    module: require('../examples/TextInput/TextInputExample'),
  },
  {
    key: 'TouchableExample',
    category: 'UI',
    module: require('../examples/Touchable/TouchableExample'),
  },
  {
    key: 'ViewExample',
    category: 'Basic',
    module: require('../examples/View/ViewExample'),
  },
];

const APIs: Array<RNTesterModuleInfo> = [
  {
    key: 'AccessibilityExample',
    category: 'Basic',
    module: require('../examples/Accessibility/AccessibilityExample'),
  },
  {
    key: 'AccessibilityAndroidExample',
    category: 'Android',
    module: require('../examples/Accessibility/AccessibilityAndroidExample'),
  },
  {
    key: 'AlertExample',
    category: 'UI',
    module: require('../examples/Alert/AlertExample'),
  },
  {
    key: 'AnimatedIndex',
    category: 'UI',
    module: require('../examples/Animated/AnimatedIndex').default,
  },
  {
    key: 'Animation - GratuitousAnimation',
    category: 'UI',
    module: require('../examples/AnimatedGratuitousApp/AnExApp'),
  },
  {
    key: 'AppearanceExample',
    category: 'UI',
    module: require('../examples/Appearance/AppearanceExample'),
  },
  {
    key: 'AppStateExample',
    category: 'Basic',
    module: require('../examples/AppState/AppStateExample'),
  },
  {
    key: 'BorderExample',
    category: 'UI',
    module: require('../examples/Border/BorderExample'),
  },
  {
    key: 'CrashExample',
    category: 'Basic',
    module: require('../examples/Crash/CrashExample'),
  },
  {
    key: 'DevSettings',
    category: 'Basic',
    module: require('../examples/DevSettings/DevSettingsExample'),
  },
  {
    key: 'Dimensions',
    category: 'UI',
    module: require('../examples/Dimensions/DimensionsExample'),
  },
  {
    key: 'LayoutEventsExample',
    category: 'UI',
    module: require('../examples/Layout/LayoutEventsExample'),
  },
  {
    key: 'LinkingExample',
    category: 'Basic',
    module: require('../examples/Linking/LinkingExample'),
  },
  {
    key: 'LayoutAnimationExample',
    category: 'UI',
    module: require('../examples/Layout/LayoutAnimationExample'),
  },
  {
    key: 'LayoutExample',
    category: 'UI',
    module: require('../examples/Layout/LayoutExample'),
  },
  {
    key: 'NativeAnimationsExample',
    category: 'UI',
    module: require('../examples/NativeAnimation/NativeAnimationsExample'),
  },
  {
    key: 'OrientationChangeExample',
    category: 'UI',
    module: require('../examples/OrientationChange/OrientationChangeExample'),
  },
  {
    key: 'PanResponderExample',
    category: 'Basic',
    module: require('../examples/PanResponder/PanResponderExample'),
  },
  {
    key: 'PermissionsExampleAndroid',
    category: 'Android',
    module: require('../examples/PermissionsAndroid/PermissionsExample'),
  },
  {
    key: 'PlatformColorExample',
    category: 'UI',
    module: require('../examples/PlatformColor/PlatformColorExample'),
  },
  {
    key: 'PointerEventsExample',
    category: 'Basic',
    module: require('../examples/PointerEvents/PointerEventsExample'),
  },
  {
    key: 'RTLExample',
    category: 'Basic',
    module: require('../examples/RTL/RTLExample'),
  },
  {
    key: 'ShareExample',
    category: 'Basic',
    module: require('../examples/Share/ShareExample'),
  },
  {
    key: 'TimerExample',
    category: 'UI',
    module: require('../examples/Timer/TimerExample'),
  },
  {
    key: 'ToastAndroidExample',
    category: 'Android',
    module: require('../examples/ToastAndroid/ToastAndroidExample'),
  },
  {
    key: 'TransformExample',
    category: 'UI',
    module: require('../examples/Transform/TransformExample'),
  },
  {
    key: 'VibrationExample',
    category: 'Basic',
    module: require('../examples/Vibration/VibrationExample'),
  },
  {
    key: 'WebSocketExample',
    category: 'Basic',
    module: require('../examples/WebSocket/WebSocketExample'),
  },
  {
    key: 'XHRExample',
    category: 'Basic',
    module: require('../examples/XHR/XHRExample'),
  },
];

if (global.__turboModuleProxy) {
  APIs.push({
    key: 'TurboModuleExample',
    category: 'Basic',
    module: require('../examples/TurboModule/TurboModuleExample'),
  });
}

const Modules: any = {};

APIs.concat(Components).forEach(Example => {
  Modules[Example.key] = Example.module;
});

const RNTesterList = {
  APIs,
  Components,
  Modules,
};

module.exports = RNTesterList;
