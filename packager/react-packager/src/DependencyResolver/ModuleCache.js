'use strict';

const AssetModule = require('./AssetModule');
const Package = require('./Package');
const Module = require('./Module');
const path = require('path');

class ModuleCache {

  constructor(fastfs) {
    this._moduleCache = Object.create(null);
    this._packageCache = Object.create(null);
    this._fastfs = fastfs;
    fastfs.on('change', this._processFileChange.bind(this));
  }

  getModule(filePath) {
    filePath = path.resolve(filePath);
    if (!this._moduleCache[filePath]) {
      this._moduleCache[filePath] = new Module(filePath, this._fastfs, this);
    }
    return this._moduleCache[filePath];
  }

  getAssetModule(filePath) {
    filePath = path.resolve(filePath);
    if (!this._moduleCache[filePath]) {
      this._moduleCache[filePath] = new AssetModule(
        filePath,
        this._fastfs,
        this
      );
    }
    return this._moduleCache[filePath];
  }

  getPackage(filePath) {
    filePath = path.resolve(filePath);
    if (!this._packageCache[filePath]){
      this._packageCache[filePath] = new Package(filePath, this._fastfs);
    }
    return this._packageCache[filePath];
  }

  getPackageForModule(module) {
    // TODO(amasad): use ES6 Map.
    if (module.__package) {
      if (this._packageCache[module.__package]) {
        return this._packageCache[module.__package];
      } else {
        delete module.__package;
      }
    }

    const packagePath = this._fastfs.closest(module.path, 'package.json');

    if (!packagePath) {
      return null;
    }

    module.__package = packagePath;
    return this.getPackage(packagePath);
  }

  _processFileChange(type, filePath, root) {
    const absPath = path.join(root, filePath);
    delete this._moduleCache[absPath];
    delete this._packageCache[absPath];
  }
}

module.exports = ModuleCache;
