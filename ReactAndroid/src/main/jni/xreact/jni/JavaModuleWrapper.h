// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxreact/NativeModule.h>
#include <fb/fbjni.h>
#include <folly/Optional.h>

#include "MethodInvoker.h"

namespace facebook {
namespace react {

class Instance;

struct JMethodDescriptor : public jni::JavaClass<JMethodDescriptor> {
  static constexpr auto kJavaDescriptor =
    "Lcom/facebook/react/cxxbridge/JavaModuleWrapper$MethodDescriptor;";

  jni::local_ref<JReflectMethod::javaobject> getMethod() const;
  std::string getSignature() const;
  std::string getName() const;
  std::string getType() const;
};

struct JavaModuleWrapper : jni::JavaClass<JavaModuleWrapper> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/cxxbridge/JavaModuleWrapper;";

  jni::local_ref<JBaseJavaModule::javaobject> getModule() {
    static auto getModule = javaClassStatic()->getMethod<JBaseJavaModule::javaobject()>("getModule");
    return getModule(self());
  }

  jni::local_ref<jni::JList<JMethodDescriptor::javaobject>::javaobject> getMethodDescriptors() {
    static auto getMethods = getClass()
      ->getMethod<jni::JList<JMethodDescriptor::javaobject>::javaobject()>("getMethodDescriptors");
    return getMethods(self());
  }
};

class JavaNativeModule : public NativeModule {
 public:
  JavaNativeModule(
    std::weak_ptr<Instance> instance,
    jni::alias_ref<JavaModuleWrapper::javaobject> wrapper)
  : instance_(std::move(instance)), wrapper_(make_global(wrapper)) {}

  std::string getName() override;
  folly::dynamic getConstants() override;
  std::vector<MethodDescriptor> getMethods() override;
  bool supportsWebWorkers() override;
  void invoke(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) override;
  MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) override;

 private:
  std::weak_ptr<Instance> instance_;
  jni::global_ref<JavaModuleWrapper::javaobject> wrapper_;
  std::vector<folly::Optional<MethodInvoker>> syncMethods_;
};

// Experimental new implementation that uses direct method invocation
class NewJavaNativeModule : public NativeModule {
 public:
  NewJavaNativeModule(
    std::weak_ptr<Instance> instance,
    jni::alias_ref<JavaModuleWrapper::javaobject> wrapper);

  std::string getName() override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  bool supportsWebWorkers() override;
  void invoke(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) override;
  MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) override;

 private:
  std::weak_ptr<Instance> instance_;
  jni::global_ref<JavaModuleWrapper::javaobject> wrapper_;
  jni::global_ref<JBaseJavaModule::javaobject> module_;
  std::vector<MethodInvoker> methods_;
  std::vector<MethodDescriptor> methodDescriptors_;

  MethodCallResult invokeInner(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params);
};

}}
