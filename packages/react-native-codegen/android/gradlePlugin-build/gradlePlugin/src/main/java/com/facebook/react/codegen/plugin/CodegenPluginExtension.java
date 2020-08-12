/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.plugin;

import java.io.File;
import org.gradle.api.Project;

public class CodegenPluginExtension {
  // TODO: Remove beta.
  public String codegenJavaPackageName = "com.facebook.fbreact.specs.beta";
  public boolean enableCodegen;
  public File jsRootDir;
  public String[] nodeExecutableAndArgs = {"node"};
  public File reactNativeRootDir;

  public CodegenPluginExtension(Project project) {
    this.reactNativeRootDir = new File(project.getRootDir(), "node_modules/react-native");
  }

  public File codegenDir() {
    return new File(this.reactNativeRootDir, "packages/react-native-codegen");
  }

  public File codegenGenerateSchemaCLI() {
    return new File(this.codegenDir(), "lib/cli/combine/combine-js-to-schema-cli.js");
  }

  public File codegenGenerateNativeModuleSpecsCLI() {
    return new File(this.reactNativeRootDir, "scripts/generate-native-modules-specs-cli.js");
  }
}
