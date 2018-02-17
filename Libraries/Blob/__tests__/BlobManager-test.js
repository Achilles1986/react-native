/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */
'use strict';

jest.setMock('NativeModules', {
  BlobModule: require('../__mocks__/BlobModule'),
});

var Blob = require('Blob');
var BlobManager = require('BlobManager');

describe('BlobManager', function() {
  it('should create blob from parts', () => {
    const blob = BlobManager.createFromParts([], {type: 'text/html'});
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/html');
  });
});
