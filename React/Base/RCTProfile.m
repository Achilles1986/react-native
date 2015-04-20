/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTProfile.h"

#import <mach/mach.h>

#import <UIKit/UIKit.h>

#import "RCTLog.h"
#import "RCTUtils.h"

#if DEBUG

#pragma mark - Prototypes

NSNumber *RCTProfileTimestamp(NSTimeInterval);
NSString *RCTProfileMemory(vm_size_t);
NSDictionary *RCTProfileGetMemoryUsage(void);

#pragma mark - Constants

NSString const *RCTProfileTraceEvents = @"traceEvents";
NSString const *RCTProfileSamples = @"samples";

#pragma mark - Variables

NSDictionary *RCTProfileInfo;
NSUInteger RCTProfileEventID = 0;
NSMutableDictionary *RCTProfileOngoingEvents;
NSTimeInterval RCTProfileStartTime;

#pragma mark - Macros

#define RCTProfileAddEvent(type, props...) \
[RCTProfileInfo[type] addObject:@{ \
  @"pid": @([[NSProcessInfo processInfo] processIdentifier]), \
  @"tid": RCTThreadName([NSThread currentThread]), \
  props \
}];

#define CHECK(...) \
if (!RCTProfileIsProfiling()) { \
  return __VA_ARGS__; \
}

#pragma mark - Private Helpers

NSNumber *RCTProfileTimestamp(NSTimeInterval timestamp)
{
  return @((timestamp - RCTProfileStartTime) * 1e6);
}

NSString *RCTProfileMemory(vm_size_t memory)
{
  double mem = ((double)memory) / 1024 / 1024;
  return [NSString stringWithFormat:@"%.2lfmb", mem];
}

NSDictionary *RCTProfileGetMemoryUsage(void)
{
  CHECK(@{});
  struct task_basic_info info;
  mach_msg_type_number_t size = sizeof(info);
  kern_return_t kerr = task_info(mach_task_self(),
                                 TASK_BASIC_INFO,
                                 (task_info_t)&info,
                                 &size);
  if( kerr == KERN_SUCCESS ) {
    return @{
      @"suspend_count": @(info.suspend_count),
      @"virtual_size": RCTProfileMemory(info.virtual_size),
      @"resident_size": RCTProfileMemory(info.resident_size),
    };
  } else {
    return @{};
  }
}

#pragma mark - Public Functions

BOOL RCTProfileIsProfiling(void)
{
  return RCTProfileInfo != nil;
}

void RCTProfileInit(void)
{
  RCTProfileStartTime = CACurrentMediaTime();
  RCTProfileOngoingEvents = [[NSMutableDictionary alloc] init];
  RCTProfileInfo = @{
    RCTProfileTraceEvents: [[NSMutableArray alloc] init],
    RCTProfileSamples: [[NSMutableArray alloc] init],
  };
}

NSString *RCTProfileEnd(void)
{
  NSString *log = RCTJSONStringify(RCTProfileInfo, NULL);
  RCTProfileEventID = 0;
  RCTProfileInfo = nil;
  RCTProfileOngoingEvents = nil;
  return log;
}

NSNumber *_RCTProfileBeginEvent(void)
{
  CHECK(@0);
  NSNumber *eventID = @(++RCTProfileEventID);
  RCTProfileOngoingEvents[eventID] = RCTProfileTimestamp(CACurrentMediaTime());
  return eventID;
}

void _RCTProfileEndEvent(NSNumber *eventID, NSString *name, NSString *categories, id args)
{
  CHECK();
  NSNumber *startTimestamp = RCTProfileOngoingEvents[eventID];
  if (!startTimestamp) {
    return;
  }

  NSNumber *endTimestamp = RCTProfileTimestamp(CACurrentMediaTime());

  RCTProfileAddEvent(RCTProfileTraceEvents,
    @"name": name,
    @"cat": categories,
    @"ph": @"X",
    @"ts": startTimestamp,
    @"dur": @(endTimestamp.doubleValue - startTimestamp.doubleValue),
    @"args": args ?: @[],
  );
  [RCTProfileOngoingEvents removeObjectForKey:eventID];
}

void RCTProfileImmediateEvent(NSString *name, NSTimeInterval timestamp, NSString *scope)
{
  CHECK();
  RCTProfileAddEvent(RCTProfileTraceEvents,
    @"name": name,
    @"ts": RCTProfileTimestamp(timestamp),
    @"scope": scope,
    @"ph": @"i",
    @"args": RCTProfileGetMemoryUsage(),
  );
}

#endif
