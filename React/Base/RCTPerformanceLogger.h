/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTDefines.h"

typedef NS_ENUM(NSUInteger, RCTPLTag) {
  RCTPLScriptDownload = 0,
  RCTPLScriptExecution,
  RCTPLNativeModuleInit,
  RCTPLNativeModulePrepareConfig,
  RCTPLNativeModuleInjectConfig,
  RCTPLTTI,
  RCTPLBundleSize,
  RCTPLSize
};

RCT_EXTERN void RCTPerformanceLoggerStart(RCTPLTag tag);
RCT_EXTERN void RCTPerformanceLoggerEnd(RCTPLTag tag);
RCT_EXTERN void RCTPerformanceLoggerSet(RCTPLTag tag, int64_t value);
RCT_EXTERN NSArray<NSNumber *> *RCTPerformanceLoggerOutput(void);
RCT_EXTERN NSArray *RCTPerformanceLoggerLabels(void);
