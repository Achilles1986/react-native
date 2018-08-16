/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTView.h>

@class RCTWKWebView;

@protocol RCTWKWebViewDelegate <NSObject>
@end

@interface RCTWKWebView : RCTView

@property (nonatomic, weak) id<RCTWKWebViewDelegate> delegate;
@property (nonatomic, copy) NSDictionary *source;
@property (nonatomic, assign) BOOL messagingEnabled;
@property (nonatomic, copy) NSString *injectedJavaScript;
@property (nonatomic, assign) BOOL scrollEnabled;
@property (nonatomic, assign) CGFloat decelerationRate;

- (void)postMessage:(NSString *)message;
- (void)injectJavaScript:(NSString *)script;
- (void)goForward;
- (void)goBack;

@end
