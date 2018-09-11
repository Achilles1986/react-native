/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@class RCTBridge;
@class RCTInputAccessoryViewContent;

@interface RCTInputAccessoryView : UIView

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@end
