/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {SchemaType} from '../../CodegenSchema';

type FilesOutput = Map<string, string>;

const {getModules} = require('./Utils');

const ModuleClassDeclarationTemplate = ({
  hasteModuleName,
}: $ReadOnly<{hasteModuleName: string}>) => {
  return `/**
 * JNI C++ class for module '${hasteModuleName}'
 */
class JSI_EXPORT ${hasteModuleName}SpecJSI : public JavaTurboModule {
public:
  ${hasteModuleName}SpecJSI(const JavaTurboModule::InitParams &params);
};
`;
};

const HeaderFileTemplate = ({
  modules,
  libraryName,
}: $ReadOnly<{modules: string, libraryName: string}>) => {
  return `
/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * ${'@'}generated by codegen project: GenerateModuleJniH.js
 */

#pragma once

#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>
#include <jsi/jsi.h>

namespace facebook {
namespace react {

${modules}

std::shared_ptr<TurboModule> ${libraryName}_ModuleProvider(const std::string moduleName, const JavaTurboModule::InitParams &params);

} // namespace react
} // namespace facebook
`;
};

// Note: this Android.mk template includes dependencies for both NativeModule and components.
const AndroidMkTemplate = ({libraryName}: $ReadOnly<{libraryName: string}>) => {
  return `# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_codegen_${libraryName}

LOCAL_C_INCLUDES := $(LOCAL_PATH)

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp) $(wildcard $(LOCAL_PATH)/react/renderer/components/${libraryName}/*.cpp)

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH) $(LOCAL_PATH)/react/renderer/components/${libraryName}

LOCAL_SHARED_LIBRARIES := libfbjni \
  libfolly_runtime \
  libglog \
  libjsi \
  libreact_codegen_rncore \
  libreact_debug \
  libreact_nativemodule_core \
  libreact_render_core \
  libreact_render_debug \
  libreact_render_graphics \
  librrc_view \
  libturbomodulejsijni \
  libyoga

LOCAL_CFLAGS := \\
  -DLOG_TAG=\\"ReactNative\\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++17 -Wall

include $(BUILD_SHARED_LIBRARY)
`;
};

// Note: this CMakeLists.txt template includes dependencies for both NativeModule and components.
const CMakeListsTemplate = ({
  libraryName,
}: $ReadOnly<{libraryName: string}>) => {
  return `# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB react_codegen_SRCS CONFIGURE_DEPENDS *.cpp react/renderer/components/${libraryName}/*.cpp)

add_library(
  react_codegen_${libraryName}
  SHARED
  \${react_codegen_SRCS}
)

target_include_directories(react_codegen_${libraryName} PUBLIC . react/renderer/components/${libraryName})

target_link_libraries(
  react_codegen_${libraryName}
  fbjni
  folly_runtime
  glog
  ${libraryName !== 'rncore' ? 'react_codegen_rncore' : ''}
  react_debug
  react_nativemodule_core
  react_render_core
  react_render_debug
  react_render_graphics
  rrc_view
  turbomodulejsijni
  yoga
)

target_compile_options(
  react_codegen_${libraryName}
  PRIVATE
  -DLOG_TAG=\\"ReactNative\\"
  -fexceptions
  -frtti
  -std=c++17
  -Wall
)
`;
};

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
    assumeNonnull: boolean = false,
  ): FilesOutput {
    const nativeModules = getModules(schema);
    const modules = Object.keys(nativeModules)
      .filter(hasteModuleName => {
        const module = nativeModules[hasteModuleName];
        return !(
          module.excludedPlatforms != null &&
          module.excludedPlatforms.includes('android')
        );
      })
      .sort()
      .map(hasteModuleName => ModuleClassDeclarationTemplate({hasteModuleName}))
      .join('\n');

    const fileName = `${libraryName}.h`;
    const replacedTemplate = HeaderFileTemplate({
      modules: modules,
      libraryName: libraryName.replace(/-/g, '_'),
    });
    return new Map([
      [`jni/${fileName}`, replacedTemplate],
      [
        'jni/Android.mk',
        AndroidMkTemplate({
          libraryName: libraryName,
        }),
      ],
      ['jni/CMakeLists.txt', CMakeListsTemplate({libraryName: libraryName})],
    ]);
  },
};
