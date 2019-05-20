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

const Blob = require('../Blob/Blob');
const EventTarget = require('event-target-shim');
const NativeEventEmitter = require('../EventEmitter/NativeEventEmitter');
const BlobManager = require('../Blob/BlobManager');
const NativeModules = require('../BatchedBridge/NativeModules');
const Platform = require('../Utilities/Platform');
const WebSocketEvent = require('./WebSocketEvent');

const base64 = require('base64-js');
const binaryToBase64 = require('../Utilities/binaryToBase64');
const invariant = require('invariant');

const {WebSocketModule} = NativeModules;

import type EventSubscription from '../vendor/emitter/EventSubscription';

type ArrayBufferView =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | DataView;

type BinaryType = 'blob' | 'arraybuffer';

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

const CLOSE_NORMAL = 1000;

const WEBSOCKET_EVENTS = ['close', 'error', 'message', 'open'];

let nextWebSocketId = 0;

/**
 * Browser-compatible WebSockets implementation.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
 * See https://github.com/websockets/ws
 */
class WebSocket extends EventTarget(...WEBSOCKET_EVENTS) {
  static CONNECTING = CONNECTING;
  static OPEN = OPEN;
  static CLOSING = CLOSING;
  static CLOSED = CLOSED;

  CONNECTING: number = CONNECTING;
  OPEN: number = OPEN;
  CLOSING: number = CLOSING;
  CLOSED: number = CLOSED;

  _socketId: number;
  _eventEmitter: NativeEventEmitter;
  _subscriptions: Array<EventSubscription>;
  _binaryType: ?BinaryType;

  onclose: ?Function;
  onerror: ?Function;
  onmessage: ?Function;
  onopen: ?Function;

  bufferedAmount: number;
  extension: ?string;
  protocol: ?string;
  readyState: number = CONNECTING;
  url: ?string;

  constructor(
    url: string,
    protocols: ?string | ?Array<string>,
    options: ?{headers?: {origin?: string}},
  ) {
    super();
    if (typeof protocols === 'string') {
      protocols = [protocols];
    }

    const {headers = {}, ...unrecognized} = options || {};

    // Preserve deprecated backwards compatibility for the 'origin' option
    /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.68 was deployed. To see the error delete this
     * comment and run Flow. */
    if (unrecognized && typeof unrecognized.origin === 'string') {
      console.warn(
        'Specifying `origin` as a WebSocket connection option is deprecated. Include it under `headers` instead.',
      );
      /* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This
       * comment suppresses an error found when Flow v0.54 was deployed. To see
       * the error delete this comment and run Flow. */
      headers.origin = unrecognized.origin;
      /* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This
       * comment suppresses an error found when Flow v0.54 was deployed. To see
       * the error delete this comment and run Flow. */
      delete unrecognized.origin;
    }

    // Warn about and discard anything else
    if (Object.keys(unrecognized).length > 0) {
      console.warn(
        'Unrecognized WebSocket connection option(s) `' +
          Object.keys(unrecognized).join('`, `') +
          '`. ' +
          'Did you mean to put these under `headers`?',
      );
    }

    if (!Array.isArray(protocols)) {
      protocols = null;
    }

    this._eventEmitter = new NativeEventEmitter(WebSocketModule);
    this._socketId = nextWebSocketId++;
    this._registerEvents();
    WebSocketModule.connect(url, protocols, {headers}, this._socketId);
  }

  get binaryType(): ?BinaryType {
    return this._binaryType;
  }

  set binaryType(binaryType: BinaryType): void {
    if (binaryType !== 'blob' && binaryType !== 'arraybuffer') {
      throw new Error("binaryType must be either 'blob' or 'arraybuffer'");
    }
    if (this._binaryType === 'blob' || binaryType === 'blob') {
      invariant(
        BlobManager.isAvailable,
        'Native module BlobModule is required for blob support',
      );
      if (binaryType === 'blob') {
        BlobManager.addWebSocketHandler(this._socketId);
      } else {
        BlobManager.removeWebSocketHandler(this._socketId);
      }
    }
    this._binaryType = binaryType;
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === this.CLOSING || this.readyState === this.CLOSED) {
      return;
    }

    this.readyState = this.CLOSING;
    this._close(code, reason);
  }

  send(data: string | ArrayBuffer | ArrayBufferView | Blob): void {
    if (this.readyState === this.CONNECTING) {
      throw new Error('INVALID_STATE_ERR');
    }

    if (data instanceof Blob) {
      invariant(
        BlobManager.isAvailable,
        'Native module BlobModule is required for blob support',
      );
      BlobManager.sendOverSocket(data, this._socketId);
      return;
    }

    if (typeof data === 'string') {
      WebSocketModule.send(data, this._socketId);
      return;
    }

    if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
      WebSocketModule.sendBinary(binaryToBase64(data), this._socketId);
      return;
    }

    throw new Error('Unsupported data type');
  }

  ping(): void {
    if (this.readyState === this.CONNECTING) {
      throw new Error('INVALID_STATE_ERR');
    }

    WebSocketModule.ping(this._socketId);
  }

  _close(code?: number, reason?: string): void {
    // See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
    const statusCode = typeof code === 'number' ? code : CLOSE_NORMAL;
    const closeReason = typeof reason === 'string' ? reason : '';
    WebSocketModule.close(statusCode, closeReason, this._socketId);

    if (BlobManager.isAvailable && this._binaryType === 'blob') {
      BlobManager.removeWebSocketHandler(this._socketId);
    }
  }

  _unregisterEvents(): void {
    this._subscriptions.forEach(e => e.remove());
    this._subscriptions = [];
  }

  _registerEvents(): void {
    this._subscriptions = [
      this._eventEmitter.addListener('websocketMessage', ev => {
        if (ev.id !== this._socketId) {
          return;
        }
        let data = ev.data;
        switch (ev.type) {
          case 'binary':
            data = base64.toByteArray(ev.data).buffer;
            break;
          case 'blob':
            data = BlobManager.createFromOptions(ev.data);
            break;
        }
        this.dispatchEvent(new WebSocketEvent('message', {data}));
      }),
      this._eventEmitter.addListener('websocketOpen', ev => {
        if (ev.id !== this._socketId) {
          return;
        }
        this.readyState = this.OPEN;
        this.dispatchEvent(new WebSocketEvent('open'));
      }),
      this._eventEmitter.addListener('websocketClosed', ev => {
        if (ev.id !== this._socketId) {
          return;
        }
        this.readyState = this.CLOSED;
        this.dispatchEvent(
          new WebSocketEvent('close', {
            code: ev.code,
            reason: ev.reason,
          }),
        );
        this._unregisterEvents();
        this.close();
      }),
      this._eventEmitter.addListener('websocketFailed', ev => {
        if (ev.id !== this._socketId) {
          return;
        }
        this.readyState = this.CLOSED;
        this.dispatchEvent(
          new WebSocketEvent('error', {
            message: ev.message,
          }),
        );
        this.dispatchEvent(
          new WebSocketEvent('close', {
            message: ev.message,
          }),
        );
        this._unregisterEvents();
        this.close();
      }),
    ];
  }
}

module.exports = WebSocket;
