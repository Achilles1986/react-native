// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cstdint>
#include <functional>
#include <memory>
#include <unordered_map>
#include <utility>

#include <cxxreact/JSModulesUnbundle.h>
#include <jschelpers/noncopyable.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

class RN_EXPORT RAMBundleRegistry : noncopyable {
public:
  using unique_ram_bundle = std::unique_ptr<JSModulesUnbundle>;
  constexpr static uint32_t MAIN_BUNDLE_ID = 0;

  static std::unique_ptr<RAMBundleRegistry> singleBundleRegistry(unique_ram_bundle mainBundle);
  static std::unique_ptr<RAMBundleRegistry> multipleBundlesRegistry(unique_ram_bundle mainBundle, std::function<unique_ram_bundle(uint32_t)> factory);

  RAMBundleRegistry(RAMBundleRegistry&&) = default;
  RAMBundleRegistry& operator=(RAMBundleRegistry&&) = default;

  JSModulesUnbundle::Module getModule(uint32_t bundleId, uint32_t moduleId);
  virtual ~RAMBundleRegistry() {};
private:
  explicit RAMBundleRegistry(unique_ram_bundle mainBundle, std::function<unique_ram_bundle(uint32_t)> factory = {});
  JSModulesUnbundle *getBundle(uint32_t bundleId) const;

  std::function<unique_ram_bundle(uint32_t)> m_factory;
  std::unordered_map<uint32_t, unique_ram_bundle> m_bundles;
};

}  // namespace react
}  // namespace facebook
