/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('../packager/babelRegisterOnly')([
  /private-cli\/src/,
  /local-cli/
]);

var bundle = require('./bundle/bundle');
var childProcess = require('child_process');
var Config = require('./util/Config');
var defaultConfig = require('./default.config');
var dependencies = require('./dependencies/dependencies');
var generate = require('./generate/generate');
var library = require('./library/library');
var link = require('./library/link');
var path = require('path');
var Promise = require('promise');
var runAndroid = require('./runAndroid/runAndroid');
var runIOS = require('./runIOS/runIOS');
var server = require('./server/server');
var TerminalAdapter = require('yeoman-environment/lib/adapter.js');
var yeoman = require('yeoman-environment');
var unbundle = require('./bundle/unbundle');
var upgrade = require('./upgrade/upgrade');

var fs = require('fs');
var gracefulFs = require('graceful-fs');

// graceful-fs helps on getting an error when we run out of file
// descriptors. When that happens it will enqueue the operation and retry it.
gracefulFs.gracefulify(fs);

var documentedCommands = {
  'start': [server, 'starts the webserver'],
  'bundle': [bundle, 'builds the javascript bundle for offline use'],
  'unbundle': [unbundle, 'builds javascript as "unbundle" for offline use'],
  'new-library': [library, 'generates a native library bridge'],
  'link': [link, 'Adds a third-party library to your project. Example: react-native link awesome-camera'],
  'android': [generateWrapper, 'generates an Android project for your app'],
  'run-android': [runAndroid, 'builds your app and starts it on a connected Android emulator or device'],
  'run-ios': [runIOS, 'builds your app and starts it on iOS simulator'],
  'upgrade': [upgrade, 'upgrade your app\'s template files to the latest version; run this after ' +
                       'updating the react-native version in your package.json and running npm install']
};

var exportedCommands = {dependencies: dependencies};
Object.keys(documentedCommands).forEach(function(command) {
  exportedCommands[command] = documentedCommands[command][0];
});

var undocumentedCommands = {
  'init': [printInitWarning, ''],
};

var commands = Object.assign({}, documentedCommands, undocumentedCommands);

/**
 * Parses the command line and runs a command of the CLI.
 */
function run() {
  var args = process.argv.slice(2);
  if (args.length === 0) {
    printUsage();
  }

  const setupEnvScript = /^win/.test(process.platform)
    ? 'setup_env.bat'
    : 'setup_env.sh';
  childProcess.execFileSync(path.join(__dirname, setupEnvScript));

  var command = commands[args[0]];
  if (!command) {
    console.error('Command `%s` unrecognized', args[0]);
    printUsage();
    return;
  }

  command[0](args, Config.get(__dirname, defaultConfig)).done();
}

function generateWrapper(args, config) {
  return generate([
    '--platform', 'android',
    '--project-path', process.cwd(),
    '--project-name', JSON.parse(
      fs.readFileSync('package.json', 'utf8')
    ).name
  ], config);
}

function printUsage() {
  console.log([
    'Usage: react-native <command>',
    '',
    'Commands:'
  ].concat(Object.keys(documentedCommands).map(function(name) {
    return '  - ' + name + ': ' + documentedCommands[name][1];
  })).join('\n'));
  process.exit(1);
}

// The user should never get here because projects are inited by
// using `react-native-cli` from outside a project directory.
function printInitWarning() {
  return Promise.resolve().then(function() {
    console.log([
      'Looks like React Native project already exists in the current',
      'folder. Run this command from a different folder or remove node_modules/react-native'
    ].join('\n'));
    process.exit(1);
  });
}

class CreateSuppressingTerminalAdapter extends TerminalAdapter {
  constructor() {
    super();
    // suppress 'create' output generated by yeoman
    this.log.create = function() {};
  }
}

/**
 * Creates the template for a React Native project given the provided
 * parameters:
 *   - projectDir: templates will be copied here.
 *   - argsOrName: project name or full list of custom arguments to pass to the
 *                 generator.
 */
function init(projectDir, argsOrName) {
  console.log('Setting up new React Native app in ' + projectDir);
  var env = yeoman.createEnv(
    undefined,
    undefined,
    new CreateSuppressingTerminalAdapter()
  );

  env.register(
    require.resolve(path.join(__dirname, 'generator')),
    'react:app'
  );

  // argv is for instance
  // ['node', 'react-native', 'init', 'AwesomeApp', '--verbose']
  // args should be ['AwesomeApp', '--verbose']
  var args = Array.isArray(argsOrName)
    ? argsOrName
    : [argsOrName].concat(process.argv.slice(4));

  var generator = env.create('react:app', {args: args});
  generator.destinationRoot(projectDir);
  generator.run();
}

if (require.main === module) {
  run();
}

module.exports = {
  run: run,
  init: init,
  commands: exportedCommands
};
