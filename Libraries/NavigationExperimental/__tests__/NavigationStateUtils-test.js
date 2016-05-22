/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow-broken
 */
'use strict';

jest
 .unmock('NavigationStateUtils');

var NavigationStateUtils = require('NavigationStateUtils');

var VALID_PARENT_STATES = [
  {routes: ['a','b'], index: 0},
  {routes: [{key: 'a'},{key: 'b', foo: 123}], index: 1},
  {routes: [{key: 'a'},{key: 'b'}], index: 0},
  {routes: [{key: 'a'},{key: 'b'}], index: 2},
];
var INVALID_PARENT_STATES = [
  'foo',
  {},
  {routes: [{key: 'a'}], index: 4},
  {routes: [{key: 'a'}], index: -1},
  {routes: [{key: 'a'}]},
  {routes: {key: 'foo'}},
  12,
  null,
  undefined,
  [],
];

describe('NavigationStateUtils', () => {

  it('identifies parents correctly with getParent', () => {
    for (var i = 0; i <= VALID_PARENT_STATES.length; i++) {
      var navState = VALID_PARENT_STATES[0];
      expect(NavigationStateUtils.getParent(navState)).toBe(navState);
    }
    for (var i = 0; i <= INVALID_PARENT_STATES.length; i++) {
      var navState = INVALID_PARENT_STATES[0];
      expect(NavigationStateUtils.getParent(navState)).toBe(null);
    }
  });

  it('can get routes', () => {
    var fooState = {key: 'foo'};
    var navState = {routes: [{key: 'foobar'}, fooState], index: 0};
    expect(NavigationStateUtils.get(navState, 'foo')).toBe(fooState);
    expect(NavigationStateUtils.get(navState, 'missing')).toBe(null);
  });
});
