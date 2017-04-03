/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const Module = require('./Module');
const Package = require('./Package');

import type {PackageData, TransformedFile} from '../types.flow';

type GetClosestPackageFn = (filePath: string) => ?string;

module.exports = class ModuleCache {
  _getClosestPackage: GetClosestPackageFn;
  getTransformedFile: string => TransformedFile;
  modules: Map<string, Module>;
  packages: Map<string, Package>;

  constructor(
    getClosestPackage: GetClosestPackageFn,
    getTransformedFile: string => TransformedFile,
  ) {
    this._getClosestPackage = getClosestPackage;
    this.getTransformedFile = getTransformedFile;
    this.modules = new Map();
    this.packages = new Map();
  }

  getAssetModule(path: string) {
    return this.getModule(path);
  }

  getModule(path: string) {
    let m = this.modules.get(path);
    if (!m) {
      m = new Module(path, this, this.getTransformedFile(path));
      this.modules.set(path, m);
    }
    return m;
  }

  getPackage(path: string) {
    let p = this.packages.get(path);
    if (!p) {
      p = new Package(path, this.getPackageData(path));
      this.packages.set(path, p);
    }
    return p;
  }

  getPackageData(path: string): PackageData {
    const pkg = this.getTransformedFile(path).package;
    if (!pkg) {
        throw new Error(`"${path}" does not exist`);
    }
    return pkg;
  }

  getPackageOf(filePath: string) {
    const candidate = this._getClosestPackage(filePath);
    return candidate != null ? this.getPackage(candidate) : null;
  }
};
