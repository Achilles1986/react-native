/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import InteractionManager from '../Interaction/InteractionManager';
import Platform from '../Utilities/Platform';
import NativeLinking from './NativeLinking';
import invariant from 'invariant';

/**
 * `Linking` gives you a general interface to interact with both incoming
 * and outgoing app links.
 *
 * See https://reactnative.dev/docs/linking.html
 */
class Linking extends NativeEventEmitter {
  constructor() {
    super(NativeLinking);
  }

  /**
   * Add a handler to Linking changes by listening to the `url` event type
   * and providing the handler
   *
   * See https://reactnative.dev/docs/linking.html#addeventlistener
   */
  addEventListener<T>(type: string, handler: T) {
    this.addListener(type, handler);
  }

  /**
   * Remove a handler by passing the `url` event type and the handler.
   *
   * See https://reactnative.dev/docs/linking.html#removeeventlistener
   */
  removeEventListener<T>(type: string, handler: T) {
    this.removeListener(type, handler);
  }

  /**
   * Try to open the given `url` with any of the installed apps.
   *
   * See https://reactnative.dev/docs/linking.html#openurl
   */
  openURL(url: string): Promise<void> {
    this._validateURL(url);
    return NativeLinking.openURL(url);
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   *
   * See https://reactnative.dev/docs/linking.html#canopenurl
   */
  canOpenURL(url: string): Promise<boolean> {
    this._validateURL(url);
    return NativeLinking.canOpenURL(url);
  }

  /**
   * Open app settings.
   *
   * See https://reactnative.dev/docs/linking.html#opensettings
   */
  openSettings(): Promise<void> {
    return NativeLinking.openSettings();
  }

  /**
   * If the app launch was triggered by an app link,
   * it will give the link url, otherwise it will give `null`
   *
   * See https://reactnative.dev/docs/linking.html#getinitialurl
   */
  getInitialURL(): Promise<?string> {
    return Platform.OS === 'android'
      ? InteractionManager.runAfterInteractions().then(() =>
          NativeLinking.getInitialURL(),
        )
      : NativeLinking.getInitialURL();
  }

  /*
   * Launch an Android intent with extras (optional)
   *
   * @platform android
   *
   * See https://reactnative.dev/docs/linking.html#sendintent
   */
  sendIntent(
    action: string,
    extras?: Array<{
      key: string,
      value: string | number | boolean,
      ...
    }>,
  ): Promise<void> {
    if (Platform.OS === 'android') {
      return NativeLinking.sendIntent(action, extras);
    } else {
      return new Promise((resolve, reject) => reject(new Error('Unsupported')));
    }
  }

  _validateURL(url: string) {
    invariant(
      typeof url === 'string',
      'Invalid URL: should be a string. Was: ' + url,
    );
    invariant(url, 'Invalid URL: cannot be empty');
  }
}

module.exports = (new Linking(): Linking);
