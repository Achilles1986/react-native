/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const buildBundle = require('./buildBundle');
const bundleCommandLineArgs = require('./bundleCommandLineArgs');
const parseCommandLine = require('../util/parseCommandLine');
const outputBundle = require('./output/bundle');
const outputPrepack = require('./output/prepack');

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function bundle(argv, config) {
  const args = parseCommandLine(bundleCommandLineArgs, argv);
  const output = args.prepack ? outputPrepack : outputBundle;
  return buildBundle(args, config, output);
}

module.exports = bundle;
