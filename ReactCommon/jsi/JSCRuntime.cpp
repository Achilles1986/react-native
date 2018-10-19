//  Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
 // LICENSE file in the root directory of this source tree.

#include "JSCRuntime.h"

#include <JavaScriptCore/JavaScript.h>
#include <condition_variable>
#include <cstdlib>
#include <mutex>
#include <queue>
#include <sstream>
#include <thread>

#ifndef NDEBUG
#include <atomic>
#endif

namespace facebook {
namespace jsc {

namespace detail {
class ArgsConverter;
class ProtectionQueue;
} // namespace detail

class JSCRuntime;

struct Lock {
  void lock(const jsc::JSCRuntime&) const {}
  void unlock(const jsc::JSCRuntime&) const {}
};

class JSCRuntime : public jsi::Runtime {
 public:
  // Creates new context in new context group
  JSCRuntime();
  // Retains ctx
  JSCRuntime(JSGlobalContextRef ctx);
  ~JSCRuntime();

  void evaluateJavaScript(
      std::unique_ptr<const jsi::Buffer> buffer,
      const std::string& sourceURL) override;
  jsi::Object global() override;

  std::string description() override;

  bool isInspectable() override;

  void setDescription(const std::string& desc);

  // Please don't use the following two functions, only exposed for
  // integration efforts.
  JSGlobalContextRef getContext() {
    return ctx_;
  }

  // JSValueRef->JSValue (needs make.*Value so it must be member function)
  jsi::Value createValue(JSValueRef value) const;

  // Value->JSValueRef (similar to above)
  JSValueRef valueRef(const jsi::Value& value);

 protected:
  friend class detail::ArgsConverter;
  friend class detail::ProtectionQueue;
  class JSCStringValue final : public PointerValue {
#ifndef NDEBUG
    JSCStringValue(JSStringRef str, std::atomic<intptr_t>& counter);
#else
    JSCStringValue(JSStringRef str);
#endif
    ~JSCStringValue();

    void invalidate() override;

    JSStringRef str_;
#ifndef NDEBUG
    std::atomic<intptr_t>& counter_;
#endif
   protected:
    friend class JSCRuntime;
  };

  class JSCObjectValue final : public PointerValue {
#ifndef NDEBUG
    JSCObjectValue(
        JSGlobalContextRef ctx,
        detail::ProtectionQueue& pq,
        JSObjectRef obj,
        std::atomic<intptr_t>& counter);
#else
    JSCObjectValue(
        JSGlobalContextRef context,
        detail::ProtectionQueue& pq,
        JSObjectRef obj);
#endif
    ~JSCObjectValue();

    void invalidate() override;

    JSGlobalContextRef ctx_;
    JSObjectRef obj_;
    detail::ProtectionQueue& protectionQueue_;
#ifndef NDEBUG
    std::atomic<intptr_t>& counter_;
#endif
   protected:
    friend class JSCRuntime;
    friend class detail::ProtectionQueue;
  };

  PointerValue* cloneString(const Runtime::PointerValue* pv) override;
  PointerValue* cloneObject(const Runtime::PointerValue* pv) override;
  PointerValue* clonePropNameID(const Runtime::PointerValue* pv) override;

  jsi::PropNameID createPropNameIDFromAscii(const char* str, size_t length)
      override;
  jsi::PropNameID createPropNameIDFromUtf8(const uint8_t* utf8, size_t length)
      override;
  jsi::PropNameID createPropNameIDFromString(const jsi::String& str) override;
  std::string utf8(const jsi::PropNameID&) override;
  bool compare(const jsi::PropNameID&, const jsi::PropNameID&) override;

  jsi::String createStringFromAscii(const char* str, size_t length) override;
  jsi::String createStringFromUtf8(const uint8_t* utf8, size_t length) override;
  std::string utf8(const jsi::String&) override;

  jsi::Object createObject() override;
  jsi::Object createObject(std::shared_ptr<jsi::HostObject> ho) override;
  virtual std::shared_ptr<jsi::HostObject> getHostObject(
      const jsi::Object&) override;
  jsi::HostFunctionType& getHostFunction(const jsi::Function&) override;

  jsi::Value getProperty(const jsi::Object&, const jsi::String& name) override;
  jsi::Value getProperty(const jsi::Object&, const jsi::PropNameID& name)
      override;
  bool hasProperty(const jsi::Object&, const jsi::String& name) override;
  bool hasProperty(const jsi::Object&, const jsi::PropNameID& name) override;
  void setPropertyValue(
      jsi::Object&,
      const jsi::String& name,
      const jsi::Value& value) override;
  void setPropertyValue(
      jsi::Object&,
      const jsi::PropNameID& name,
      const jsi::Value& value) override;
  bool isArray(const jsi::Object&) const override;
  bool isArrayBuffer(const jsi::Object&) const override;
  bool isFunction(const jsi::Object&) const override;
  bool isHostObject(const jsi::Object&) const override;
  bool isHostFunction(const jsi::Function&) const override;
  jsi::Array getPropertyNames(const jsi::Object&) override;

  jsi::WeakObject createWeakObject(const jsi::Object&) override;
  jsi::Value lockWeakObject(const jsi::WeakObject&) override;

  jsi::Array createArray(size_t length) override;
  size_t size(const jsi::Array&) override;
  size_t size(const jsi::ArrayBuffer&) override;
  uint8_t* data(const jsi::ArrayBuffer&) override;
  jsi::Value getValueAtIndex(const jsi::Array&, size_t i) override;
  void setValueAtIndexImpl(jsi::Array&, size_t i, const jsi::Value& value)
      override;

  jsi::Function createFunctionFromHostFunction(
      const jsi::PropNameID& name,
      unsigned int paramCount,
      jsi::HostFunctionType func) override;
  jsi::Value call(
      const jsi::Function&,
      const jsi::Value& jsThis,
      const jsi::Value* args,
      size_t count) override;
  jsi::Value callAsConstructor(
      const jsi::Function&,
      const jsi::Value* args,
      size_t count) override;

  bool strictEquals(const jsi::String& a, const jsi::String& b) const override;
  bool strictEquals(const jsi::Object& a, const jsi::Object& b) const override;
  bool instanceOf(const jsi::Object& o, const jsi::Function& f) override;

 private:
  // Basically convenience casts
  static JSStringRef stringRef(const jsi::String& str);
  static JSStringRef stringRef(const jsi::PropNameID& sym);
  static JSObjectRef objectRef(const jsi::Object& obj);

  // Factory methods for creating String/Object
  jsi::String createString(JSStringRef stringRef) const;
  jsi::PropNameID createPropNameID(JSStringRef stringRef);
  jsi::Object createObject(JSObjectRef objectRef) const;

  // Used by factory methods and clone methods
  jsi::Runtime::PointerValue* makeStringValue(JSStringRef str) const;
  jsi::Runtime::PointerValue* makeObjectValue(JSObjectRef obj) const;

  void checkException(JSValueRef exc);
  void checkException(JSValueRef res, JSValueRef exc);
  void checkException(JSValueRef exc, const char* msg);
  void checkException(JSValueRef res, JSValueRef exc, const char* msg);

  JSGlobalContextRef ctx_;
  std::string desc_;
  // We make this a pointer so that we can control explicitly when it's deleted
  // namely before the context is released.
  mutable std::unique_ptr<detail::ProtectionQueue> protectionQueue_;
#ifndef NDEBUG
  mutable std::atomic<intptr_t> objectCounter_;
  mutable std::atomic<intptr_t> stringCounter_;
#endif
};

#if __has_builtin(__builtin_expect)
#define JSC_LIKELY(EXPR) __builtin_expect((bool)(EXPR), true)
#define JSC_UNLIKELY(EXPR) __builtin_expect((bool)(EXPR), false)
#else
#define JSC_LIKELY(EXPR) (EXPR)
#define JSC_UNLIKELY(EXPR) (EXPR)
#endif

#define JSC_ASSERT(x)          \
  do {                         \
    if (JSC_UNLIKELY(!!(x))) { \
      abort();                 \
    }                          \
  } while (0)

#if defined(__IPHONE_OS_VERSION_MIN_REQUIRED)
// This takes care of watch and tvos (due to backwards compatibility in
// Availability.h
#if __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_9_0
#define _JSC_FAST_IS_ARRAY
#endif
#endif
#if defined(__MAC_OS_X_VERSION_MIN_REQUIRED)
#if __MAC_OS_X_VERSION_MIN_REQUIRED >= __MAC_10_11
// Only one of these should be set for a build.  If somehow that's not
// true, this will be a compile-time error and it can be resolved when
// we understand why.
#define _JSC_FAST_IS_ARRAY
#endif
#endif

// JSStringRef utilities
namespace {
std::string JSStringToSTLString(JSStringRef str) {
  std::string result;
  size_t maxBytes = JSStringGetMaximumUTF8CStringSize(str);
  result.resize(maxBytes);
  size_t bytesWritten = JSStringGetUTF8CString(str, &result[0], maxBytes);
  // JSStringGetUTF8CString writes the null terminator, so we want to resize
  // to `bytesWritten - 1` so that `result` has the correct length.
  result.resize(bytesWritten - 1);
  return result;
}

JSStringRef getLengthString() {
  static JSStringRef length = JSStringCreateWithUTF8CString("length");
  return length;
}

JSStringRef getNameString() {
  static JSStringRef name = JSStringCreateWithUTF8CString("name");
  return name;
}

JSStringRef getFunctionString() {
  static JSStringRef func = JSStringCreateWithUTF8CString("Function");
  return func;
}

#if !defined(_JSC_FAST_IS_ARRAY)
JSStringRef getArrayString() {
  static JSStringRef array = JSStringCreateWithUTF8CString("Array");
  return array;
}

JSStringRef getIsArrayString() {
  static JSStringRef isArray = JSStringCreateWithUTF8CString("isArray");
  return isArray;
}
#endif
} // namespace

// std::string utility
namespace {
std::string to_string(void* value) {
  std::ostringstream ss;
  ss << value;
  return ss.str();
}
} // namespace

// UnprotectQueue
namespace detail {
class ProtectionQueue {
 public:
  ProtectionQueue()
      : shuttingDown_(false)
#ifndef NDEBUG
        ,
        didShutdown_ {
    false
  }
#endif
  , unprotectorThread_(&ProtectionQueue::unprotectThread, this) {}

  void shutdown() {
    {
      std::lock_guard<std::mutex> locker(mutex_);
      shuttingDown_ = true;
      notEmpty_.notify_one();
    }
    unprotectorThread_.join();
  }

  void push(JSCRuntime::JSCObjectValue* value) {
    std::lock_guard<std::mutex> locker(mutex_);
    assert(!didShutdown_);
    queue_.push(value);
    notEmpty_.notify_one();
  }

 private:
  // This this the function that runs in the background deleting (and thus
  // unprotecting JSObjectRefs as need be). This needs to be explicitly on a
  // separate thread so that we don't have the API lock when `JSValueUnprotect`
  // is called already (i.e. if we did this on the same thread that calls
  // invalidate() on an Object then we might be in the middle of a GC pass, and
  // already have the API lock).
  void unprotectThread() {
#if defined(__APPLE__)
    pthread_setname_np("jsc-protectionqueue-unprotectthread");
#endif

    std::unique_lock<std::mutex> locker(mutex_);
    while (!shuttingDown_ || !queue_.empty()) {
      if (queue_.empty()) {
        // This will wake up when shuttingDown_ becomes true
        notEmpty_.wait(locker);
      } else {
        JSCRuntime::JSCObjectValue* value = queue_.front();
        queue_.pop();
        // We need to drop the lock here since this calls JSValueUnprotect and
        // that may make another GC pass, which could call another finalizer
        // and thus attempt to push to this queue then, and deadlock.
        locker.unlock();
        delete value;
        locker.lock();
      }
    }
#ifndef NDEBUG
    didShutdown_ = true;
#endif
  }
  // Used to lock the queue_/shuttingDown_ ivars
  std::mutex mutex_;
  // Used to signal queue_ empty status changing
  std::condition_variable notEmpty_;
  // The actual underlying queue
  std::queue<JSCRuntime::JSCObjectValue*> queue_;
  // A flag dictating whether or not we need to stop all execution
  bool shuttingDown_;
#ifndef NDEBUG
  std::atomic<bool> didShutdown_;
#endif
  // The thread that dequeues and processes the queue. Note this is the last
  // member on purpose so the thread starts up after all state has been
  // properly initialized
  std::thread unprotectorThread_;
};
} // namespace detail

JSCRuntime::JSCRuntime()
    : JSCRuntime(JSGlobalContextCreateInGroup(nullptr, nullptr)) {
  JSGlobalContextRelease(ctx_);
}

JSCRuntime::JSCRuntime(JSGlobalContextRef ctx)
    : ctx_(JSGlobalContextRetain(ctx)),
      protectionQueue_(std::make_unique<detail::ProtectionQueue>())
#ifndef NDEBUG
      ,
      objectCounter_(0),
      stringCounter_(0)
#endif
{
}

JSCRuntime::~JSCRuntime() {
  protectionQueue_->shutdown();
#ifndef NDEBUG
  assert(
      objectCounter_ == 0 && "JSCRuntime destroyed with a dangling API object");
  assert(
      stringCounter_ == 0 && "JSCRuntime destroyed with a dangling API string");
#endif
  JSGlobalContextRelease(ctx_);
}

void JSCRuntime::evaluateJavaScript(
    std::unique_ptr<const jsi::Buffer> buffer,
    const std::string& sourceURL) {
  std::string tmp(
      reinterpret_cast<const char*>(buffer->data()), buffer->size());
  JSStringRef sourceRef = JSStringCreateWithUTF8CString(tmp.c_str());
  JSStringRef sourceURLRef = nullptr;
  if (!sourceURL.empty()) {
    sourceURLRef = JSStringCreateWithUTF8CString(sourceURL.c_str());
  }
  JSValueRef exc = nullptr;
  JSValueRef res =
      JSEvaluateScript(ctx_, sourceRef, nullptr, sourceURLRef, 0, &exc);
  JSStringRelease(sourceRef);
  if (sourceURLRef) {
    JSStringRelease(sourceURLRef);
  }
  checkException(res, exc);
}

jsi::Object JSCRuntime::global() {
  return createObject(JSContextGetGlobalObject(ctx_));
}

std::string JSCRuntime::description() {
  if (desc_.empty()) {
    desc_ = std::string("<JSCRuntime@") + to_string(this) + ">";
  }
  return desc_;
}

bool JSCRuntime::isInspectable() {
  return false;
}

#ifndef NDEBUG
JSCRuntime::JSCStringValue::JSCStringValue(
    JSStringRef str,
    std::atomic<intptr_t>& counter)
    : str_(JSStringRetain(str)), counter_(counter) {
  // Since std::atomic returns a copy instead of a reference when calling
  // operator+= we must do this explicitly in the constructor
  counter_ += 1;
}
#else
JSCRuntime::JSCStringValue::JSCStringValue(JSStringRef str)
    : str_(JSStringRetain(str)) {
}
#endif

void JSCRuntime::JSCStringValue::invalidate() {
  // JSI needs to be flexible enough to allow Runtime to act as a root in
  // hermes' case and just an interface in JSC's case. In hermes the
  // objects/strings must be tracked in a list so that they can be marked
  // on a GC sweep, while for JSC we want to immediately JSStringRelease once a
  // String is released, and queue a JSObjectRef to unprotected (see comment
  // on ProtectionQueue::unprotectThread above).
  //
  // In JSC's case these JSC{String,Object}Value objects are implicitly owned
  // by the {String,Object} objects, thus when a String/Object is destructed
  // the JSC{String,Object}Value should be released (again this has the caveat
  // that objects must be unprotected on a separate thread).
  //
  // Angery reaccs only
  delete this;
}

JSCRuntime::JSCStringValue::~JSCStringValue() {
#ifndef NDEBUG
  counter_ -= 1;
#endif
  JSStringRelease(str_);
}

JSCRuntime::JSCObjectValue::JSCObjectValue(
    JSGlobalContextRef ctx,
    detail::ProtectionQueue& pq,
    JSObjectRef obj
#ifndef NDEBUG
    ,
    std::atomic<intptr_t>& counter
#endif
    )
    : ctx_(ctx),
      obj_(obj),
      protectionQueue_(pq)
#ifndef NDEBUG
      ,
      counter_(counter)
#endif
{
  JSValueProtect(ctx_, obj_);
#ifndef NDEBUG
  counter_ += 1;
#endif
}

void JSCRuntime::JSCObjectValue::invalidate() {
  // See comment in JSCRuntime::JSCStringValue::invalidate as well as
  // on ProtectionQueue::unprotectThread.
  protectionQueue_.push(this);
}

JSCRuntime::JSCObjectValue::~JSCObjectValue() {
#ifndef NDEBUG
  counter_ -= 1;
#endif
  JSValueUnprotect(ctx_, obj_);
}

jsi::Runtime::PointerValue* JSCRuntime::cloneString(
    const jsi::Runtime::PointerValue* pv) {
  if (!pv) {
    return nullptr;
  }
  const JSCStringValue* string = static_cast<const JSCStringValue*>(pv);
  return makeStringValue(string->str_);
}

jsi::Runtime::PointerValue* JSCRuntime::cloneObject(
    const jsi::Runtime::PointerValue* pv) {
  if (!pv) {
    return nullptr;
  }
  const JSCObjectValue* object = static_cast<const JSCObjectValue*>(pv);
  assert(
      object->ctx_ == ctx_ &&
      "Don't try to clone an object backed by a different Runtime");
  return makeObjectValue(object->obj_);
}

jsi::Runtime::PointerValue* JSCRuntime::clonePropNameID(
    const jsi::Runtime::PointerValue* pv) {
  if (!pv) {
    return nullptr;
  }
  const JSCStringValue* string = static_cast<const JSCStringValue*>(pv);
  return makeStringValue(string->str_);
}

jsi::PropNameID JSCRuntime::createPropNameIDFromAscii(
    const char* str,
    size_t length) {
  // For system JSC this must is identical to a string
  std::string tmp(str, length);
  JSStringRef strRef = JSStringCreateWithUTF8CString(tmp.c_str());
  auto res = createPropNameID(strRef);
  JSStringRelease(strRef);
  return res;
}

jsi::PropNameID JSCRuntime::createPropNameIDFromUtf8(
    const uint8_t* utf8,
    size_t length) {
  std::string tmp(reinterpret_cast<const char*>(utf8), length);
  JSStringRef strRef = JSStringCreateWithUTF8CString(tmp.c_str());
  auto res = createPropNameID(strRef);
  JSStringRelease(strRef);
  return res;
}

jsi::PropNameID JSCRuntime::createPropNameIDFromString(const jsi::String& str) {
  return createPropNameID(stringRef(str));
}

std::string JSCRuntime::utf8(const jsi::PropNameID& sym) {
  return JSStringToSTLString(stringRef(sym));
}

bool JSCRuntime::compare(const jsi::PropNameID& a, const jsi::PropNameID& b) {
  return JSStringIsEqual(stringRef(a), stringRef(b));
}

jsi::String JSCRuntime::createStringFromAscii(const char* str, size_t length) {
  // Yes we end up double casting for semantic reasons (UTF8 contains ASCII,
  // not the other way around)
  return this->createStringFromUtf8(
      reinterpret_cast<const uint8_t*>(str), length);
}

jsi::String JSCRuntime::createStringFromUtf8(
    const uint8_t* str,
    size_t length) {
  std::string tmp(reinterpret_cast<const char*>(str), length);
  JSStringRef stringRef = JSStringCreateWithUTF8CString(tmp.c_str());
  return createString(stringRef);
}

std::string JSCRuntime::utf8(const jsi::String& str) {
  return JSStringToSTLString(stringRef(str));
}

jsi::Object JSCRuntime::createObject() {
  return createObject(static_cast<JSObjectRef>(nullptr));
}

// HostObject details
namespace detail {
struct HostObjectProxyBase {
  HostObjectProxyBase(
      JSCRuntime& rt,
      const std::shared_ptr<jsi::HostObject>& sho)
      : runtime(rt), hostObject(sho) {}

  JSCRuntime& runtime;
  std::shared_ptr<jsi::HostObject> hostObject;
};
} // namespace detail

namespace {
std::once_flag hostObjectClassOnceFlag;
JSClassRef hostObjectClass{};
} // namespace

jsi::Object JSCRuntime::createObject(std::shared_ptr<jsi::HostObject> ho) {
  struct HostObjectProxy : public detail::HostObjectProxyBase {
    static JSValueRef getProperty(
        JSContextRef ctx,
        JSObjectRef object,
        JSStringRef propertyName,
        JSValueRef* exception) {
      auto proxy = static_cast<HostObjectProxy*>(JSObjectGetPrivate(object));
      auto& rt = proxy->runtime;
      jsi::PropNameID sym = rt.createPropNameID(propertyName);
      jsi::Value ret;
      try {
        ret = proxy->hostObject->get(rt, sym);
      } catch (const jsi::JSError& error) {
        *exception = rt.valueRef(error.value());
        return JSValueMakeUndefined(ctx);
      } catch (const std::exception& ex) {
        auto excValue =
            rt.global()
                .getPropertyAsFunction(rt, "Error")
                .call(
                    rt,
                    std::string("Exception in HostObject::get: ") + ex.what());
        *exception = rt.valueRef(excValue);
        return JSValueMakeUndefined(ctx);
      } catch (...) {
        auto excValue =
            rt.global()
                .getPropertyAsFunction(rt, "Error")
                .call(rt, "Exception in HostObject::get: <unknown>");
        *exception = rt.valueRef(excValue);
        return JSValueMakeUndefined(ctx);
      }
      return rt.valueRef(ret);
    }

    static bool setProperty(
        JSContextRef ctx,
        JSObjectRef object,
        JSStringRef propName,
        JSValueRef value,
        JSValueRef* exception) {
      auto proxy = static_cast<HostObjectProxy*>(JSObjectGetPrivate(object));
      auto& rt = proxy->runtime;
      jsi::PropNameID sym = rt.createPropNameID(propName);
      try {
        proxy->hostObject->set(rt, sym, rt.createValue(value));
      } catch (const jsi::JSError& error) {
        *exception = rt.valueRef(error.value());
        return false;
      } catch (const std::exception& ex) {
        auto excValue =
            rt.global()
                .getPropertyAsFunction(rt, "Error")
                .call(
                    rt,
                    std::string("Exception in HostObject::set: ") + ex.what());
        *exception = rt.valueRef(excValue);
        return false;
      } catch (...) {
        auto excValue =
            rt.global()
                .getPropertyAsFunction(rt, "Error")
                .call(rt, "Exception in HostObject::set: <unknown>");
        *exception = rt.valueRef(excValue);
        return false;
      }
      return true;
    }

    // JSC does not provide means to communicate errors from this callback,
    // so the error handling strategy is very brutal - we'll just crash
    // due to noexcept.
    static void getPropertyNames(
        JSContextRef ctx,
        JSObjectRef object,
        JSPropertyNameAccumulatorRef propertyNames) noexcept {
      auto proxy = static_cast<HostObjectProxy*>(JSObjectGetPrivate(object));
      auto& rt = proxy->runtime;
      auto names = proxy->hostObject->getPropertyNames(rt);
      for (auto& name : names) {
        JSPropertyNameAccumulatorAddName(propertyNames, stringRef(name));
      }
    }

    static void finalize(JSObjectRef obj) {
      auto hostObject = static_cast<HostObjectProxy*>(JSObjectGetPrivate(obj));
      JSObjectSetPrivate(obj, nullptr);
      delete hostObject;
    }

    using HostObjectProxyBase::HostObjectProxyBase;
  };

  std::call_once(hostObjectClassOnceFlag, []() {
    JSClassDefinition hostObjectClassDef = kJSClassDefinitionEmpty;
    hostObjectClassDef.version = 0;
    hostObjectClassDef.attributes = kJSClassAttributeNoAutomaticPrototype;
    hostObjectClassDef.finalize = HostObjectProxy::finalize;
    hostObjectClassDef.getProperty = HostObjectProxy::getProperty;
    hostObjectClassDef.setProperty = HostObjectProxy::setProperty;
    hostObjectClassDef.getPropertyNames = HostObjectProxy::getPropertyNames;
    hostObjectClass = JSClassCreate(&hostObjectClassDef);
  });

  JSObjectRef obj =
      JSObjectMake(ctx_, hostObjectClass, new HostObjectProxy(*this, ho));
  return createObject(obj);
}

std::shared_ptr<jsi::HostObject> JSCRuntime::getHostObject(
    const jsi::Object& obj) {
  // We are guarenteed at this point to have isHostObject(obj) == true
  // so the private data should be HostObjectMetadata
  JSObjectRef object = objectRef(obj);
  auto metadata =
      static_cast<detail::HostObjectProxyBase*>(JSObjectGetPrivate(object));
  assert(metadata);
  return metadata->hostObject;
}

jsi::Value JSCRuntime::getProperty(
    const jsi::Object& obj,
    const jsi::String& name) {
  JSObjectRef objRef = objectRef(obj);
  JSValueRef exc = nullptr;
  JSValueRef res = JSObjectGetProperty(ctx_, objRef, stringRef(name), &exc);
  checkException(exc);
  return createValue(res);
}

jsi::Value JSCRuntime::getProperty(
    const jsi::Object& obj,
    const jsi::PropNameID& name) {
  JSObjectRef objRef = objectRef(obj);
  JSValueRef exc = nullptr;
  JSValueRef res = JSObjectGetProperty(ctx_, objRef, stringRef(name), &exc);
  checkException(exc);
  return createValue(res);
}

bool JSCRuntime::hasProperty(const jsi::Object& obj, const jsi::String& name) {
  JSObjectRef objRef = objectRef(obj);
  return JSObjectHasProperty(ctx_, objRef, stringRef(name));
}

bool JSCRuntime::hasProperty(
    const jsi::Object& obj,
    const jsi::PropNameID& name) {
  JSObjectRef objRef = objectRef(obj);
  return JSObjectHasProperty(ctx_, objRef, stringRef(name));
}

void JSCRuntime::setPropertyValue(
    jsi::Object& object,
    const jsi::PropNameID& name,
    const jsi::Value& value) {
  JSValueRef exc = nullptr;
  JSObjectSetProperty(
      ctx_,
      objectRef(object),
      stringRef(name),
      valueRef(value),
      kJSPropertyAttributeNone,
      &exc);
  checkException(exc);
}

void JSCRuntime::setPropertyValue(
    jsi::Object& object,
    const jsi::String& name,
    const jsi::Value& value) {
  JSValueRef exc = nullptr;
  JSObjectSetProperty(
      ctx_,
      objectRef(object),
      stringRef(name),
      valueRef(value),
      kJSPropertyAttributeNone,
      &exc);
  checkException(exc);
}

bool JSCRuntime::isArray(const jsi::Object& obj) const {
#if !defined(_JSC_FAST_IS_ARRAY)
  JSObjectRef global = JSContextGetGlobalObject(ctx_);
  JSStringRef arrayString = getArrayString();
  JSValueRef exc = nullptr;
  JSValueRef arrayCtorValue =
      JSObjectGetProperty(ctx_, global, arrayString, &exc);
  JSC_ASSERT(exc);
  JSObjectRef arrayCtor = JSValueToObject(ctx_, arrayCtorValue, &exc);
  JSC_ASSERT(exc);
  JSStringRef isArrayString = getIsArrayString();
  JSValueRef isArrayValue =
      JSObjectGetProperty(ctx_, arrayCtor, isArrayString, &exc);
  JSC_ASSERT(exc);
  JSObjectRef isArray = JSValueToObject(ctx_, isArrayValue, &exc);
  JSC_ASSERT(exc);
  JSValueRef arg = objectRef(obj);
  JSValueRef result =
      JSObjectCallAsFunction(ctx_, isArray, nullptr, 1, &arg, &exc);
  JSC_ASSERT(exc);
  return JSValueToBoolean(ctx_, result);
#else
  return JSValueIsArray(ctx_, objectRef(obj));
#endif
}

bool JSCRuntime::isArrayBuffer(const jsi::Object& /*obj*/) const {
  // TODO: T23270523 - This would fail on builds that use our custom JSC
  // auto typedArrayType = JSValueGetTypedArrayType(ctx_, objectRef(obj),
  // nullptr);  return typedArrayType == kJSTypedArrayTypeArrayBuffer;
  throw std::runtime_error("Unsupported");
}

uint8_t* JSCRuntime::data(const jsi::ArrayBuffer& /*obj*/) {
  // TODO: T23270523 - This would fail on builds that use our custom JSC
  // return static_cast<uint8_t*>(
  //    JSObjectGetArrayBufferBytesPtr(ctx_, objectRef(obj), nullptr));
  throw std::runtime_error("Unsupported");
}

size_t JSCRuntime::size(const jsi::ArrayBuffer& /*obj*/) {
  // TODO: T23270523 - This would fail on builds that use our custom JSC
  // return JSObjectGetArrayBufferByteLength(ctx_, objectRef(obj), nullptr);
  throw std::runtime_error("Unsupported");
}

bool JSCRuntime::isFunction(const jsi::Object& obj) const {
  return JSObjectIsFunction(ctx_, objectRef(obj));
}

bool JSCRuntime::isHostObject(const jsi::Object& obj) const {
  auto cls = hostObjectClass;
  return cls != nullptr && JSValueIsObjectOfClass(ctx_, objectRef(obj), cls);
}

// Very expensive
jsi::Array JSCRuntime::getPropertyNames(const jsi::Object& obj) {
  JSPropertyNameArrayRef names =
      JSObjectCopyPropertyNames(ctx_, objectRef(obj));
  size_t len = JSPropertyNameArrayGetCount(names);
  // Would be better if we could create an array with explicit elements
  auto result = createArray(len);
  for (size_t i = 0; i < len; i++) {
    JSStringRef str = JSPropertyNameArrayGetNameAtIndex(names, i);
    result.setValueAtIndex(*this, i, createString(str));
  }
  JSPropertyNameArrayRelease(names);
  return result;
}

jsi::WeakObject JSCRuntime::createWeakObject(const jsi::Object&) {
  throw std::logic_error("Not implemented");
}

jsi::Value JSCRuntime::lockWeakObject(const jsi::WeakObject&) {
  throw std::logic_error("Not implemented");
}

jsi::Array JSCRuntime::createArray(size_t length) {
  JSValueRef exc = nullptr;
  JSObjectRef obj = JSObjectMakeArray(ctx_, 0, nullptr, &exc);
  checkException(obj, exc);
  JSObjectSetProperty(
      ctx_,
      obj,
      getLengthString(),
      JSValueMakeNumber(ctx_, static_cast<double>(length)),
      0,
      &exc);
  checkException(exc);
  return createObject(obj).getArray(*this);
}

size_t JSCRuntime::size(const jsi::Array& arr) {
  return static_cast<size_t>(
      getProperty(arr, createPropNameID(getLengthString())).getNumber());
}

jsi::Value JSCRuntime::getValueAtIndex(const jsi::Array& arr, size_t i) {
  JSValueRef exc = nullptr;
  auto res = JSObjectGetPropertyAtIndex(ctx_, objectRef(arr), i, &exc);
  checkException(exc);
  return createValue(res);
}

void JSCRuntime::setValueAtIndexImpl(
    jsi::Array& arr,
    size_t i,
    const jsi::Value& value) {
  JSValueRef exc = nullptr;
  JSObjectSetPropertyAtIndex(ctx_, objectRef(arr), i, valueRef(value), &exc);
  checkException(exc);
}

namespace {
std::once_flag hostFunctionClassOnceFlag;
JSClassRef hostFunctionClass{};

class HostFunctionProxy {
 public:
  HostFunctionProxy(jsi::HostFunctionType hostFunction)
      : hostFunction_(hostFunction) {}

  jsi::HostFunctionType& getHostFunction() {
    return hostFunction_;
  }

 protected:
  jsi::HostFunctionType hostFunction_;
};
} // namespace

jsi::Function JSCRuntime::createFunctionFromHostFunction(
    const jsi::PropNameID& name,
    unsigned int paramCount,
    jsi::HostFunctionType func) {
  class HostFunctionMetadata : public HostFunctionProxy {
   public:
    static void initialize(JSContextRef ctx, JSObjectRef object) {
      // We need to set up the prototype chain properly here. In theory we
      // could set func.prototype.prototype = Function.prototype to get the
      // same result. Not sure which approach is better.
      HostFunctionMetadata* metadata =
          static_cast<HostFunctionMetadata*>(JSObjectGetPrivate(object));

      JSValueRef exc = nullptr;
      JSObjectSetProperty(
          ctx,
          object,
          getLengthString(),
          JSValueMakeNumber(ctx, metadata->argCount),
          kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontEnum |
              kJSPropertyAttributeDontDelete,
          &exc);
      if (exc) {
        // Silently fail to set length
        exc = nullptr;
      }

      JSStringRef name = nullptr;
      std::swap(metadata->name, name);
      JSObjectSetProperty(
          ctx,
          object,
          getNameString(),
          JSValueMakeString(ctx, name),
          kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontEnum |
              kJSPropertyAttributeDontDelete,
          &exc);
      JSStringRelease(name);
      if (exc) {
        // Silently fail to set name
        exc = nullptr;
      }

      JSObjectRef global = JSContextGetGlobalObject(ctx);
      JSValueRef value =
          JSObjectGetProperty(ctx, global, getFunctionString(), &exc);
      // If we don't have Function then something bad is going on.
      if (JSC_UNLIKELY(exc)) {
        abort();
      }
      JSObjectRef funcCtor = JSValueToObject(ctx, value, &exc);
      if (!funcCtor) {
        // We can't do anything if Function is not an object
        return;
      }
      JSValueRef funcProto = JSObjectGetPrototype(ctx, funcCtor);
      JSObjectSetPrototype(ctx, object, funcProto);
    }

    static JSValueRef makeError(JSCRuntime& rt, const std::string& desc) {
      jsi::Value value =
          rt.global().getPropertyAsFunction(rt, "Error").call(rt, desc);
      return rt.valueRef(value);
    }

    static JSValueRef call(
        JSContextRef ctx,
        JSObjectRef function,
        JSObjectRef thisObject,
        size_t argumentCount,
        const JSValueRef arguments[],
        JSValueRef* exception) {
      HostFunctionMetadata* metadata =
          static_cast<HostFunctionMetadata*>(JSObjectGetPrivate(function));
      JSCRuntime& rt = *(metadata->runtime);
      const unsigned maxStackArgCount = 8;
      jsi::Value stackArgs[maxStackArgCount];
      std::unique_ptr<jsi::Value[]> heapArgs;
      jsi::Value* args;
      if (argumentCount > maxStackArgCount) {
        heapArgs = std::make_unique<jsi::Value[]>(argumentCount);
        for (size_t i = 0; i < argumentCount; i++) {
          heapArgs[i] = rt.createValue(arguments[i]);
        }
        args = heapArgs.get();
      } else {
        for (size_t i = 0; i < argumentCount; i++) {
          stackArgs[i] = rt.createValue(arguments[i]);
        }
        args = stackArgs;
      }
      JSValueRef res;
      jsi::Value thisVal(rt.createObject(thisObject));
      try {
        res = rt.valueRef(
            metadata->hostFunction_(rt, thisVal, args, argumentCount));
      } catch (const jsi::JSError& error) {
        *exception = rt.valueRef(error.value());
        res = JSValueMakeUndefined(ctx);
      } catch (const std::exception& ex) {
        std::string exceptionString("Exception in HostFunction: ");
        exceptionString += ex.what();
        *exception = makeError(rt, exceptionString);
        res = JSValueMakeUndefined(ctx);
      } catch (...) {
        std::string exceptionString("Exception in HostFunction: <unknown>");
        *exception = makeError(rt, exceptionString);
        res = JSValueMakeUndefined(ctx);
      }
      return res;
    }

    static void finalize(JSObjectRef object) {
      HostFunctionMetadata* metadata =
          static_cast<HostFunctionMetadata*>(JSObjectGetPrivate(object));
      JSObjectSetPrivate(object, nullptr);
      delete metadata;
    }

    HostFunctionMetadata(
        JSCRuntime* rt,
        jsi::HostFunctionType hf,
        unsigned ac,
        JSStringRef n)
        : HostFunctionProxy(hf),
          runtime(rt),
          argCount(ac),
          name(JSStringRetain(n)) {}

    JSCRuntime* runtime;
    unsigned argCount;
    JSStringRef name;
  };

  std::call_once(hostFunctionClassOnceFlag, []() {
    JSClassDefinition functionClass = kJSClassDefinitionEmpty;
    functionClass.version = 0;
    functionClass.attributes = kJSClassAttributeNoAutomaticPrototype;
    functionClass.initialize = HostFunctionMetadata::initialize;
    functionClass.finalize = HostFunctionMetadata::finalize;
    functionClass.callAsFunction = HostFunctionMetadata::call;

    hostFunctionClass = JSClassCreate(&functionClass);
  });

  JSObjectRef funcRef = JSObjectMake(
      ctx_,
      hostFunctionClass,
      new HostFunctionMetadata(this, func, paramCount, stringRef(name)));
  return createObject(funcRef).getFunction(*this);
}

namespace detail {

class ArgsConverter {
 public:
  ArgsConverter(JSCRuntime& rt, const jsi::Value* args, size_t count) {
    JSValueRef* destination = inline_;
    if (count > maxStackArgs) {
      outOfLine_ = std::make_unique<JSValueRef[]>(count);
      destination = outOfLine_.get();
    }

    for (size_t i = 0; i < count; ++i) {
      destination[i] = rt.valueRef(args[i]);
    }
  }

  operator JSValueRef*() {
    return outOfLine_ ? outOfLine_.get() : inline_;
  }

 private:
  constexpr static unsigned maxStackArgs = 8;
  JSValueRef inline_[maxStackArgs];
  std::unique_ptr<JSValueRef[]> outOfLine_;
};
} // namespace detail

bool JSCRuntime::isHostFunction(const jsi::Function& obj) const {
  auto cls = hostFunctionClass;
  return cls != nullptr && JSValueIsObjectOfClass(ctx_, objectRef(obj), cls);
}

jsi::HostFunctionType& JSCRuntime::getHostFunction(const jsi::Function& obj) {
  // We know that isHostFunction(obj) is true here, so its safe to proceed
  auto proxy =
      static_cast<HostFunctionProxy*>(JSObjectGetPrivate(objectRef(obj)));
  return proxy->getHostFunction();
}

jsi::Value JSCRuntime::call(
    const jsi::Function& f,
    const jsi::Value& jsThis,
    const jsi::Value* args,
    size_t count) {
  JSValueRef exc = nullptr;
  auto res = JSObjectCallAsFunction(
      ctx_,
      objectRef(f),
      jsThis.isUndefined() ? nullptr : objectRef(jsThis.getObject(*this)),
      count,
      detail::ArgsConverter(*this, args, count),
      &exc);
  checkException(exc);
  return createValue(res);
}

jsi::Value JSCRuntime::callAsConstructor(
    const jsi::Function& f,
    const jsi::Value* args,
    size_t count) {
  JSValueRef exc = nullptr;
  auto res = JSObjectCallAsConstructor(
      ctx_,
      objectRef(f),
      count,
      detail::ArgsConverter(*this, args, count),
      &exc);
  checkException(exc);
  return createValue(res);
}

bool JSCRuntime::strictEquals(const jsi::String& a, const jsi::String& b)
    const {
  return JSStringIsEqual(stringRef(a), stringRef(b));
}

bool JSCRuntime::strictEquals(const jsi::Object& a, const jsi::Object& b)
    const {
  return objectRef(a) == objectRef(b);
}

bool JSCRuntime::instanceOf(const jsi::Object& o, const jsi::Function& f) {
  JSValueRef exc = nullptr;
  bool res =
      JSValueIsInstanceOfConstructor(ctx_, objectRef(o), objectRef(f), &exc);
  checkException(exc);
  return res;
}

namespace {
JSStringRef getEmptyString() {
  static JSStringRef empty = JSStringCreateWithUTF8CString("");
  return empty;
}
} // namespace

jsi::Runtime::PointerValue* JSCRuntime::makeStringValue(
    JSStringRef stringRef) const {
  if (!stringRef) {
    stringRef = getEmptyString();
  }
#ifndef NDEBUG
  return new JSCStringValue(stringRef, stringCounter_);
#else
  return new JSCStringValue(stringRef);
#endif
}

jsi::String JSCRuntime::createString(JSStringRef str) const {
  return make<jsi::String>(makeStringValue(str));
}

jsi::PropNameID JSCRuntime::createPropNameID(JSStringRef str) {
  return make<jsi::PropNameID>(makeStringValue(str));
}

jsi::Runtime::PointerValue* JSCRuntime::makeObjectValue(
    JSObjectRef objectRef) const {
  if (!objectRef) {
    objectRef = JSObjectMake(ctx_, nullptr, nullptr);
  }
#ifndef NDEBUG
  return new JSCObjectValue(ctx_, *protectionQueue_, objectRef, objectCounter_);
#else
  return new JSCObjectValue(ctx_, *protectionQueue_, objectRef);
#endif
}

jsi::Object JSCRuntime::createObject(JSObjectRef obj) const {
  return make<jsi::Object>(makeObjectValue(obj));
}

jsi::Value JSCRuntime::createValue(JSValueRef value) const {
  if (JSValueIsNumber(ctx_, value)) {
    return jsi::Value(JSValueToNumber(ctx_, value, nullptr));
  } else if (JSValueIsBoolean(ctx_, value)) {
    return jsi::Value(JSValueToBoolean(ctx_, value));
  } else if (JSValueIsNull(ctx_, value)) {
    return jsi::Value(nullptr);
  } else if (JSValueIsUndefined(ctx_, value)) {
    return jsi::Value();
  } else if (JSValueIsString(ctx_, value)) {
    JSStringRef str = JSValueToStringCopy(ctx_, value, nullptr);
    auto result = jsi::Value(createString(str));
    JSStringRelease(str);
    return result;
  } else if (JSValueIsObject(ctx_, value)) {
    JSObjectRef objRef = JSValueToObject(ctx_, value, nullptr);
    return jsi::Value(createObject(objRef));
  } else {
    // WHAT ARE YOU
    abort();
  }
}

JSValueRef JSCRuntime::valueRef(const jsi::Value& value) {
  // I would rather switch on value.kind_
  if (value.isUndefined()) {
    return JSValueMakeUndefined(ctx_);
  } else if (value.isNull()) {
    return JSValueMakeNull(ctx_);
  } else if (value.isBool()) {
    return JSValueMakeBoolean(ctx_, value.getBool());
  } else if (value.isNumber()) {
    return JSValueMakeNumber(ctx_, value.getNumber());
  } else if (value.isString()) {
    return JSValueMakeString(ctx_, stringRef(value.getString(*this)));
  } else if (value.isObject()) {
    return objectRef(value.getObject(*this));
  } else {
    // What are you?
    abort();
  }
}

JSStringRef JSCRuntime::stringRef(const jsi::String& str) {
  return static_cast<const JSCStringValue*>(getPointerValue(str))->str_;
}

JSStringRef JSCRuntime::stringRef(const jsi::PropNameID& sym) {
  return static_cast<const JSCStringValue*>(getPointerValue(sym))->str_;
}

JSObjectRef JSCRuntime::objectRef(const jsi::Object& obj) {
  return static_cast<const JSCObjectValue*>(getPointerValue(obj))->obj_;
}

void JSCRuntime::checkException(JSValueRef exc) {
  if (JSC_UNLIKELY(exc)) {
    throw jsi::JSError(*this, createValue(exc));
  }
}

void JSCRuntime::checkException(JSValueRef res, JSValueRef exc) {
  if (JSC_UNLIKELY(!res)) {
    throw jsi::JSError(*this, createValue(exc));
  }
}

void JSCRuntime::checkException(JSValueRef exc, const char* msg) {
  if (JSC_UNLIKELY(exc)) {
    throw jsi::JSError(std::string(msg), *this, createValue(exc));
  }
}

void JSCRuntime::checkException(
    JSValueRef res,
    JSValueRef exc,
    const char* msg) {
  if (JSC_UNLIKELY(!res)) {
    throw jsi::JSError(std::string(msg), *this, createValue(exc));
  }
}

std::unique_ptr<jsi::Runtime> makeJSCRuntime() {
  return std::make_unique<JSCRuntime>();
}

} // namespace jsc
} // namespace facebook
