// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>

#include <folly/dynamic.h>

#include "Bridge.h"
#include "ModuleRegistry.h"
#include "NativeModule.h"

namespace facebook {
namespace react {

class JSExecutorFactory;

struct InstanceCallback {
  virtual ~InstanceCallback() {}
  virtual void onBatchComplete() = 0;
  virtual void incrementPendingJSCalls() = 0;
  virtual void decrementPendingJSCalls() = 0;
  virtual void onNativeException(const std::string& what) = 0;
  virtual ExecutorToken createExecutorToken() = 0;
};

class Instance {
 public:
  ~Instance();
  void initializeBridge(
    std::unique_ptr<InstanceCallback> callback,
    std::shared_ptr<JSExecutorFactory> jsef,
    std::shared_ptr<MessageQueueThread> jsQueue,
    std::unique_ptr<MessageQueueThread> nativeQueue,
    std::shared_ptr<ModuleRegistry> moduleRegistry,
    folly::dynamic jsModuleDescriptions);
  void loadScriptFromString(const std::string& string, const std::string& sourceURL);
  void loadScriptFromFile(const std::string& filename, const std::string& sourceURL);
  void loadUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    const std::string& startupScript,
    const std::string& startupScriptSourceURL);
  bool supportsProfiling();
  void startProfiler(const std::string& title);
  void stopProfiler(const std::string& title, const std::string& filename);
  void setGlobalVariable(const std::string& propName, const std::string& jsonValue);
  void callJSFunction(ExecutorToken token, const std::string& module, const std::string& method,
                      folly::dynamic&& params, const std::string& tracingName);
  void callJSCallback(ExecutorToken token, uint64_t callbackId, folly::dynamic&& params);
  MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int moduleId, unsigned int methodId, folly::dynamic&& args);
  ExecutorToken getMainExecutorToken();

 private:
  class BridgeCallbackImpl;

  void callNativeModules(ExecutorToken token, const std::string& calls, bool isEndOfBatch);

  std::unique_ptr<InstanceCallback> callback_;
  std::shared_ptr<ModuleRegistry> moduleRegistry_;
  // TODO #10487027: clean up the ownership of this.
  std::shared_ptr<MessageQueueThread> jsQueue_;
  std::unique_ptr<MessageQueueThread> nativeQueue_;

  std::unique_ptr<Bridge> bridge_;
};

}
}
