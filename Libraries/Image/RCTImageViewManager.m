/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTImageViewManager.h>

#import <UIKit/UIKit.h>

#import <React/RCTConvert.h>
#import <React/RCTImageSource.h>

#import <React/RCTImageLoader.h>
#import <React/RCTImageShadowView.h>
#import <React/RCTImageView.h>

@implementation RCTImageViewManager

RCT_EXPORT_MODULE()

- (RCTShadowView *)shadowView
{
  return [RCTImageShadowView new];
}

- (UIView *)view
{
  return [[RCTImageView alloc] initWithBridge:self.bridge];
}

RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
RCT_EXPORT_VIEW_PROPERTY(onLoadStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onProgress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(resizeMode, RCTResizeMode)
RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<RCTImageSource *>);
RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[RCTImageView setTintColor:]`
  view.tintColor = [RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(RCTResponseSenderBlock)successBlock
                  errorBlock:(RCTResponseErrorBlock)errorBlock)
{
  [[self.bridge moduleForClass:[RCTImageLoader class]]
   getImageSizeForURLRequest:request
   block:^(NSError *error, CGSize size) {
     if (error) {
       errorBlock(error);
     } else {
       successBlock(@[@(size.width), @(size.height)]);
     }
   }];
}

RCT_EXPORT_METHOD(getSizeWithHeaders:(RCTImageSource *)source
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [[self.bridge moduleForClass:[RCTImageLoader class]]
   getImageSizeForURLRequest:source.request
   block:^(NSError *error, CGSize size) {
     if (error) {
       reject(@"E_GET_SIZE_FAILURE", nil, error);
       return;
     }
     resolve(@{@"width":@(size.width),@"height":@(size.height)});
   }];
}

RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  if (!request) {
    reject(@"E_INVALID_URI", @"Cannot prefetch an image for an empty URI", nil);
    return;
  }

  [[self.bridge moduleForClass:[RCTImageLoader class]]
   loadImageWithURLRequest:request
   callback:^(NSError *error, UIImage *image) {
     if (error) {
       reject(@"E_PREFETCH_FAILURE", nil, error);
       return;
     }
     resolve(@YES);
   }];
}

RCT_EXPORT_METHOD(queryCache:(NSArray *)requests
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  resolve([[self.bridge moduleForClass:[RCTImageLoader class]] getImageCacheStatus:requests]);
}

@end
