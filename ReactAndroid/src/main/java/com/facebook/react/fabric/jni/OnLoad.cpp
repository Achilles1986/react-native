/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/fbjni.h>

#include "Binding.h"
#include "ComponentFactory.h"
#include "ComponentNameResolverManager.h"
#include "CoreComponentsRegistry.h"
#include "EventBeatManager.h"
#include "EventEmitterWrapper.h"
#include "StateWrapperImpl.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::Binding::registerNatives();
    facebook::react::EventBeatManager::registerNatives();
    facebook::react::EventEmitterWrapper::registerNatives();
    facebook::react::StateWrapperImpl::registerNatives();
    facebook::react::ComponentFactory::registerNatives();
    facebook::react::ComponentNameResolverManager::registerNatives();
    facebook::react::CoreComponentsRegistry::registerNatives();
  });
}
