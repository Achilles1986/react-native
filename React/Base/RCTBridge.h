/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTBridgeModule.h"
#import "RCTDefines.h"
#import "RCTFrameUpdate.h"
#import "RCTInvalidating.h"
#import "RCTJavaScriptExecutor.h"

@class RCTBridge;
@class RCTEventDispatcher;

/**
 * This notification triggers a reload of all bridges currently running.
 */
extern NSString *const RCTReloadNotification;

/**
 * This notification fires when the bridge has finished loading.
 */
extern NSString *const RCTJavaScriptDidLoadNotification;

/**
 * This notification fires when the bridge failed to load.
 */
extern NSString *const RCTJavaScriptDidFailToLoadNotification;

/**
 * This block can be used to instantiate modules that require additional
 * init parameters, or additional configuration prior to being used.
 * The bridge will call this block to instatiate the modules, and will
 * be responsible for invalidating/releasing them when the bridge is destroyed.
 * For this reason, the block should always return new module instances, and
 * module instances should not be shared between bridges.
 */
typedef NSArray *(^RCTBridgeModuleProviderBlock)(void);

/**
 * This function returns the module name for a given class.
 */
RCT_EXTERN NSString *RCTBridgeModuleNameForClass(Class bridgeModuleClass);

/**
 * Async batched bridge used to communicate with the JavaScript application.
 */
@interface RCTBridge : NSObject <RCTInvalidating>

/**
 * The designated initializer. This creates a new bridge on top of the specified
 * executor. The bridge should then be used for all subsequent communication
 * with the JavaScript code running in the executor. Modules will be automatically
 * instantiated using the default contructor, but you can optionally pass in an
 * array of pre-initialized module instances if they require additional init
 * parameters or configuration.
 */
- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   moduleProvider:(RCTBridgeModuleProviderBlock)block
                    launchOptions:(NSDictionary *)launchOptions NS_DESIGNATED_INITIALIZER;

/**
 * This method is used to call functions in the JavaScript application context.
 * It is primarily intended for use by modules that require two-way communication
 * with the JavaScript code. Method should be registered using the
 * RCT_IMPORT_METHOD macro below. Attempting to call a method that has not been
 * registered will result in an error. Safe to call from any thread.
 */
- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args;

/**
 * This macro is used to register a JS method to be called via the enqueueJSCall
 * bridge method. You should place this macro inside any file that uses the
 * imported method. If a method has already been registered by another class, it
 * is not necessary to register it again, but it is good practice. Registering
 * the same method more than once will not result in an error.
 */
#define RCT_IMPORT_METHOD(module, method) \
__attribute__((used, section("__DATA,RCTImport"))) \
static const char *__rct_import_##module##_##method##__ = #module"."#method;

/**
 * URL of the script that was loaded into the bridge.
 */
@property (nonatomic, copy) NSURL *bundleURL;

@property (nonatomic, strong) Class executorClass;

/**
 * The event dispatcher is a wrapper around -enqueueJSCall:args: that provides a
 * higher-level interface for sending UI events such as touches and text input.
 *
 * NOTE: RCTEventDispatcher is now a bridge module, this is implemented as a
 * category but remains declared in the bridge to avoid breaking changes
 *
 * To be moved.
 */
@property (nonatomic, readonly) RCTEventDispatcher *eventDispatcher;

/**
 * A dictionary of all registered RCTBridgeModule instances, keyed by moduleName.
 */
@property (nonatomic, copy, readonly) NSDictionary *modules;

/**
 * The launch options that were used to initialize the bridge.
 */
@property (nonatomic, copy, readonly) NSDictionary *launchOptions;

/**
 * Use this to check if the bridge is currently loading.
 */
@property (nonatomic, readonly, getter=isLoading) BOOL loading;

/**
 * Reload the bundle and reset executor & modules. Safe to call from any thread.
 */
- (void)reload;

@end
