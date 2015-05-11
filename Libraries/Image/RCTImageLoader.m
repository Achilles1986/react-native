/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageLoader.h"

#import <AssetsLibrary/AssetsLibrary.h>
#import <Photos/PHAsset.h>
#import <Photos/PHFetchResult.h>
#import <Photos/PHImageManager.h>
#import <UIKit/UIKit.h>

#import "RCTConvert.h"
#import "RCTGIFImage.h"
#import "RCTImageDownloader.h"
#import "RCTLog.h"

static dispatch_queue_t RCTImageLoaderQueue(void)
{
  static dispatch_queue_t queue = NULL;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.rctImageLoader", DISPATCH_QUEUE_SERIAL);
    dispatch_set_target_queue(queue,
                              dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0));
  });

  return queue;
}

NSError *errorWithMessage(NSString *message)
{
  NSDictionary *errorInfo = @{NSLocalizedDescriptionKey: message};
  NSError *error = [[NSError alloc] initWithDomain:RCTErrorDomain code:0 userInfo:errorInfo];
  return error;
}

@implementation RCTImageLoader

+ (ALAssetsLibrary *)assetsLibrary
{
  static ALAssetsLibrary *assetsLibrary = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    assetsLibrary = [[ALAssetsLibrary alloc] init];
  });
  return assetsLibrary;
}

+ (void)loadImageWithTag:(NSString *)imageTag callback:(void (^)(NSError *error, id image))callback
{
  if ([imageTag hasPrefix:@"assets-library"]) {
    [[RCTImageLoader assetsLibrary] assetForURL:[NSURL URLWithString:imageTag] resultBlock:^(ALAsset *asset) {
      if (asset) {
        // ALAssetLibrary API is async and will be multi-threaded. Loading a few full
        // resolution images at once will spike the memory up to store the image data,
        // and might trigger memory warnings and/or OOM crashes.
        // To improve this, process the loaded asset in a serial queue.
        dispatch_async(RCTImageLoaderQueue(), ^{
          // Also make sure the image is released immediately after it's used so it
          // doesn't spike the memory up during the process.
          @autoreleasepool {
            ALAssetRepresentation *representation = [asset defaultRepresentation];
            ALAssetOrientation orientation = [representation orientation];
            UIImage *image = [UIImage imageWithCGImage:[representation fullResolutionImage] scale:1.0f orientation:(UIImageOrientation)orientation];
            callback(nil, image);
          }
        });
      } else {
        NSString *errorText = [NSString stringWithFormat:@"Failed to load asset at URL %@ with no error message.", imageTag];
        NSError *error = errorWithMessage(errorText);
        callback(error, nil);
      }
    } failureBlock:^(NSError *loadError) {
      NSString *errorText = [NSString stringWithFormat:@"Failed to load asset at URL %@.\niOS Error: %@", imageTag, loadError];
      NSError *error = errorWithMessage(errorText);
      callback(error, nil);
    }];
  } else if ([imageTag hasPrefix:@"ph://"]) {
    // Using PhotoKit for iOS 8+
    // 'ph://' prefix is used by FBMediaKit to differentiate between assets-library. It is prepended to the local ID so that it
    // is in the form of NSURL which is what assets-library is based on.
    // This means if we use any FB standard photo picker, we will get this prefix =(
    NSString *phAssetID = [imageTag substringFromIndex:[@"ph://" length]];
    PHFetchResult *results = [PHAsset fetchAssetsWithLocalIdentifiers:@[phAssetID] options:nil];
    if (results.count == 0) {
      NSString *errorText = [NSString stringWithFormat:@"Failed to fetch PHAsset with local identifier %@ with no error message.", phAssetID];
      NSError *error = errorWithMessage(errorText);
      callback(error, nil);
      return;
    }

    PHAsset *asset = [results firstObject];
    [[PHImageManager defaultManager] requestImageForAsset:asset targetSize:PHImageManagerMaximumSize contentMode:PHImageContentModeDefault options:nil resultHandler:^(UIImage *result, NSDictionary *info) {
      if (result) {
        callback(nil, result);
      } else {
        NSString *errorText = [NSString stringWithFormat:@"Failed to load PHAsset with local identifier %@ with no error message.", phAssetID];
        NSError *error = errorWithMessage(errorText);
        callback(error, nil);
        return;
      }
    }];
  } else if ([imageTag hasPrefix:@"http"]) {
    NSURL *url = [NSURL URLWithString:imageTag];
    if (!url) {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid URL: %@", imageTag];
      callback(errorWithMessage(errorMessage), nil);
      return;
    }
    [[RCTImageDownloader sharedInstance] downloadDataForURL:url block:^(NSData *data, NSError *error) {
      if (error) {
        callback(error, nil);
      } else {
        callback(nil, [UIImage imageWithData:data]);
      }
    }];
  } else if ([[imageTag pathExtension] caseInsensitiveCompare:@"gif"] == NSOrderedSame) {
    id image = RCTGIFImageWithFileURL([RCTConvert NSURL:imageTag]);
    if (image) {
      callback(nil, image);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Unable to load GIF image: %@", imageTag];
      NSError *error = errorWithMessage(errorMessage);
      callback(error, nil);
    }
  } else {
    UIImage *image = [RCTConvert UIImage:imageTag];
    if (image) {
      callback(nil, image);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Unrecognized tag protocol: %@", imageTag];
      NSError *error = errorWithMessage(errorMessage);
      callback(error, nil);
    }
  }
}

@end
