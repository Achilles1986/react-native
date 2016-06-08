// Copyright 2004-present Facebook. All Rights Reserved.

#include <folly/dynamic.h>
#include <fb/fbjni.h>
#include <fb/log.h>
#include <cxxreact/Executor.h>
#include <cxxreact/JSCExecutor.h>
#include <cxxreact/Platform.h>
#include <cxxreact/Value.h>
#include <react/jni/ReadableNativeArray.h>
#include "CatalystInstanceImpl.h"
#include "JavaScriptExecutorHolder.h"
#include "JSCPerfLogging.h"
#include "JSLoader.h"
#include "ModuleRegistryHolder.h"
#include "ProxyExecutor.h"
#include "WebWorkers.h"
#include "JCallback.h"

#include <string>

using namespace facebook::jni;

namespace facebook {
namespace react {

namespace {

static std::string getApplicationDir(const char* methodName) {
  // Get the Application Context object
  auto getApplicationClass = findClassLocal(
                              "com/facebook/react/common/ApplicationHolder");
  auto getApplicationMethod = getApplicationClass->getStaticMethod<jobject()>(
                              "getApplication",
                              "()Landroid/app/Application;"
                              );
  auto application = getApplicationMethod(getApplicationClass);

  // Get getCacheDir() from the context
  auto getDirMethod = findClassLocal("android/app/Application")
                       ->getMethod<jobject()>(methodName,
                                              "()Ljava/io/File;"
                                                  );
  auto dirObj = getDirMethod(application);

  // Call getAbsolutePath() on the returned File object
  auto getAbsolutePathMethod = findClassLocal("java/io/File")
                                ->getMethod<jstring()>("getAbsolutePath");
  return getAbsolutePathMethod(dirObj)->toStdString();
}

static std::string getApplicationCacheDir() {
  return getApplicationDir("getCacheDir");
}

static std::string getApplicationPersistentDir() {
  return getApplicationDir("getFilesDir");
}

static JSValueRef nativeLoggingHook(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  android_LogPriority logLevel = ANDROID_LOG_DEBUG;
  if (argumentCount > 1) {
    int level = (int) JSValueToNumber(ctx, arguments[1], NULL);
    // The lowest log level we get from JS is 0. We shift and cap it to be
    // in the range the Android logging method expects.
    logLevel = std::min(
        static_cast<android_LogPriority>(level + ANDROID_LOG_DEBUG),
        ANDROID_LOG_FATAL);
  }
  if (argumentCount > 0) {
    JSStringRef jsString = JSValueToStringCopy(ctx, arguments[0], NULL);
    String message = String::adopt(jsString);
    FBLOG_PRI(logLevel, "ReactNativeJS", "%s", message.str().c_str());
  }
  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativePerformanceNow(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  static const int64_t NANOSECONDS_IN_SECOND = 1000000000LL;
  static const int64_t NANOSECONDS_IN_MILLISECOND = 1000000LL;

  // This is equivalent to android.os.SystemClock.elapsedRealtime() in native
  struct timespec now;
  clock_gettime(CLOCK_MONOTONIC_RAW, &now);
  int64_t nano = now.tv_sec * NANOSECONDS_IN_SECOND + now.tv_nsec;
  return JSValueMakeNumber(ctx, (nano / (double)NANOSECONDS_IN_MILLISECOND));
}

class JSCJavaScriptExecutorHolder : public HybridClass<JSCJavaScriptExecutorHolder,
                                                       JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/cxxbridge/JSCJavaScriptExecutor;";

  static local_ref<jhybriddata> initHybrid(alias_ref<jclass>, ReadableNativeArray* jscConfigArray) {
    // See JSCJavaScriptExecutor.Factory() for the other side of this hack.
    folly::dynamic jscConfigMap = jscConfigArray->array[0];
    jscConfigMap["PersistentDirectory"] = getApplicationPersistentDir();
    return makeCxxInstance(
      std::make_shared<JSCExecutorFactory>(getApplicationCacheDir(), std::move(jscConfigMap)));
  }

  static void registerNatives() {
    registerHybrid({
      makeNativeMethod("initHybrid", JSCJavaScriptExecutorHolder::initHybrid),
    });
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};

struct JavaJSExecutor : public JavaClass<JavaJSExecutor> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/JavaJSExecutor;";
};

class ProxyJavaScriptExecutorHolder : public HybridClass<ProxyJavaScriptExecutorHolder,
                                                         JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/cxxbridge/ProxyJavaScriptExecutor;";

  static local_ref<jhybriddata> initHybrid(
    alias_ref<jclass>, alias_ref<JavaJSExecutor::javaobject> executorInstance) {
    return makeCxxInstance(
      std::make_shared<ProxyExecutorOneTimeFactory>(
        make_global(executorInstance)));
  }

  static void registerNatives() {
    registerHybrid({
      makeNativeMethod("initHybrid", ProxyJavaScriptExecutorHolder::initHybrid),
    });
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};


class JReactMarker : public JavaClass<JReactMarker> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/ReactMarker;";
  static void logMarker(const std::string& marker) {
    static auto cls = javaClassStatic();
    static auto meth = cls->getStaticMethod<void(std::string)>("logMarker");
    meth(cls, marker);
  }
};

}

extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
  return initialize(vm, [] {
    // Inject some behavior into react/
    ReactMarker::logMarker = JReactMarker::logMarker;
    WebWorkerUtil::createWebWorkerThread = WebWorkers::createWebWorkerThread;
    WebWorkerUtil::loadScriptFromAssets =
      [] (const std::string& assetName) {
        return loadScriptFromAssets(assetName);
      };
    WebWorkerUtil::loadScriptFromNetworkSync = WebWorkers::loadScriptFromNetworkSync;
    PerfLogging::installNativeHooks = addNativePerfLoggingHooks;
    JSNativeHooks::loggingHook = nativeLoggingHook;
    JSNativeHooks::nowHook = nativePerformanceNow;
    JSCJavaScriptExecutorHolder::registerNatives();
    ProxyJavaScriptExecutorHolder::registerNatives();
    CatalystInstanceImpl::registerNatives();
    ModuleRegistryHolder::registerNatives();
    CxxModuleWrapper::registerNatives();
    JCallbackImpl::registerNatives();
    registerJSLoaderNatives();
  });
}

}}
