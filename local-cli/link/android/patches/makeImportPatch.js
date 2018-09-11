/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = function makeImportPatch(packageImportPath) {
  return {
    pattern: 'import com.facebook.react.ReactApplication;',
    patch: '\n' + packageImportPath,
  };
};
