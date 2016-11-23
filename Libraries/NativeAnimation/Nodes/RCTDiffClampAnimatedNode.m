/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDiffClampAnimatedNode.h"

#import <React/RCTLog.h>

@implementation RCTDiffClampAnimatedNode
{
  NSNumber *_inputNodeTag;
  CGFloat _min;
  CGFloat _max;
  CGFloat _lastValue;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if (self = [super initWithTag:tag config:config]) {
    _inputNodeTag = config[@"input"];
    _min = [config[@"min"] floatValue];
    _max = [config[@"max"] floatValue];
  }

  return self;
}

- (void)onAttachedToNode:(RCTAnimatedNode *)parent
{
  [super onAttachedToNode:parent];

  self.value = _lastValue = [self inputNodeValue];
}

- (void)performUpdate
{
  [super performUpdate];

  CGFloat value = [self inputNodeValue];

  CGFloat diff = value - _lastValue;
  _lastValue = value;
  self.value = MIN(MAX(self.value + diff, _min), _max);
}

- (CGFloat)inputNodeValue
{
  RCTValueAnimatedNode *inputNode = (RCTValueAnimatedNode *)self.parentNodes[_inputNodeTag];
  if (![inputNode isKindOfClass:[RCTValueAnimatedNode class]]) {
    RCTLogError(@"Illegal node ID set as an input for Animated.DiffClamp node");
    return 0;
  }

  return inputNode.value;
}

@end
