/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

/*
 * @returns {bool} true if different, false if equal
 */
var deepDiffer = function(one: any, two: any, maxDepth: number = -1): bool {
  if (maxDepth === 0) {
    return true;
  }
  if (one === two) {
    // Short circuit on identical object references instead of traversing them.
    return false;
  }
  if ((typeof one === 'function') && (typeof two === 'function')) {
    // We consider all functions equal
    return false;
  }
  if ((typeof one !== 'object') || (one === null)) {
    // Primitives can be directly compared
    return one !== two;
  }
  if ((typeof two !== 'object') || (two === null)) {
    // We know they are different because the previous case would have triggered
    // otherwise.
    return true;
  }
  if (one.constructor !== two.constructor) {
    return true;
  }
  if (Array.isArray(one)) {
    // We know two is also an array because the constructors are equal
    var len = one.length;
    if (two.length !== len) {
      return true;
    }
    for (var ii = 0; ii < len; ii++) {
      if (deepDiffer(one[ii], two[ii], maxDepth - 1)) {
        return true;
      }
    }
  } else {
    for (var key in one) {
      if (deepDiffer(one[key], two[key], maxDepth - 1)) {
        return true;
      }
    }
    for (var twoKey in two) {
      // The only case we haven't checked yet is keys that are in two but aren't
      // in one, which means they are different.
      if (one[twoKey] === undefined && two[twoKey] !== undefined) {
        return true;
      }
    }
  }
  return false;
};

module.exports = deepDiffer;
