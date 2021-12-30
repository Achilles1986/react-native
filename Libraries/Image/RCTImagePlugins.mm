/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated by an internal plugin build system
 */

#ifndef RN_DISABLE_OSS_PLUGIN_HEADER

// OSS-compatibility layer

#import "RCTImagePlugins.h"

#import <string>
#import <unordered_map>

Class RCTImageClassProvider(const char *name) {
  // Intentionally leak to avoid crashing after static destructors are run.
  static const auto sCoreModuleClassMap = new const std::unordered_map<std::string, Class (*)(void)>{
    {"GIFImageDecoder", RCTGIFImageDecoderCls},
    {"ImageEditingManager", RCTImageEditingManagerCls},
    {"ImageLoader", RCTImageLoaderCls},
    {"ImageStoreManager", RCTImageStoreManagerCls},
    {"LocalAssetImageLoader", RCTLocalAssetImageLoaderCls},
  };

  auto p = sCoreModuleClassMap->find(name);
  if (p != sCoreModuleClassMap->end()) {
    auto classFunc = p->second;
    return classFunc();
  }
  return nil;
}

#endif // RN_DISABLE_OSS_PLUGIN_HEADER
