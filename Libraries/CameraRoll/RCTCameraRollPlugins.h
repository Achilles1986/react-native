/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated by an internal plugin build system
 */

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER

// FB Internal: Plugins.h is autogenerated by the build system.
#import "Plugins.h"

#else

// OSS-compatibility layer

#import <Foundation/Foundation.h>

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wreturn-type-c-linkage"

#ifdef __cplusplus
extern "C" {
#endif

// RCTTurboModuleManagerDelegate should call this to resolve module classes.
Class RCTCameraRollClassProvider(const char *name);

// Lookup functions
Class RCTAssetsLibraryRequestHandlerCls(void) __attribute__((used));
Class RCTCameraRollManagerCls(void) __attribute__((used));
Class RCTImagePickerManagerCls(void) __attribute__((used));
Class RCTPhotoLibraryImageLoaderCls(void) __attribute__((used));

#ifdef __cplusplus
}
#endif

#pragma GCC diagnostic pop

#endif // RN_DISABLE_OSS_PLUGIN_HEADER
