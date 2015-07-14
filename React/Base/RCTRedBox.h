/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

@interface RCTRedBox : NSObject

+ (instancetype)sharedInstance;

- (void)showError:(NSError *)error;
- (void)showErrorMessage:(NSString *)message;
- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details;
- (void)showErrorMessage:(NSString *)message withStack:(NSArray *)stack;
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray *)stack;

- (void)setNextBackgroundColor:(UIColor *)color;

- (NSString *)currentErrorMessage;

- (void)dismiss;

@end
