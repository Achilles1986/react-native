/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageManager.h"

#import <react/debug/SystraceSection.h>
#import <react/utils/SharedFunction.h>

#import <React/RCTImageLoader.h>
#import <react/imagemanager/ImageResponse.h>
#import <react/imagemanager/ImageResponseObserver.h>

#import "RCTImagePrimitivesConversions.h"

using namespace facebook::react;

@implementation RCTImageManager {
  RCTImageLoader *_imageLoader;
}

- (instancetype)initWithImageLoader:(RCTImageLoader *)imageLoader {
  if (self = [super init]) {
    _imageLoader = imageLoader;
  }

  return self;
}

- (ImageRequest)requestImage:(ImageSource)imageSource
{
  SystraceSection s("RCTImageManager::requestImage");

  auto imageRequest = ImageRequest(imageSource);
  auto weakObserverCoordinator =
      (std::weak_ptr<const ImageResponseObserverCoordinator>)imageRequest.getSharedObserverCoordinator();

  auto sharedCancelationFunction = SharedFunction<>();
  imageRequest.setCancelationFunction(sharedCancelationFunction);

  /*
   * Even if an image is being loaded asynchronously on some other background thread, some other preparation
   * work (such as creating an `NSURLRequest` object and some obscure logic inside `RCTImageLoader`) can take a couple
   * of milliseconds, so we have to offload this to a separate thread. `ImageRequest` can be created as part of the
   * layout process, so it must be highly performant.
   */
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSURLRequest *request = NSURLRequestFromImageSource(imageSource);

    auto completionBlock = ^(NSError *error, UIImage *image) {
      auto observerCoordinator = weakObserverCoordinator.lock();
      if (!observerCoordinator) {
        return;
      }

      if (image && !error) {
        auto imageResponse = ImageResponse(std::shared_ptr<void>((__bridge_retained void *)image, CFRelease));
        observerCoordinator->nativeImageResponseComplete(std::move(imageResponse));
      } else {
        observerCoordinator->nativeImageResponseFailed();
      }
    };

    auto progressBlock = ^(int64_t progress, int64_t total) {
      auto observerCoordinator = weakObserverCoordinator.lock();
      if (!observerCoordinator) {
        return;
      }

      observerCoordinator->nativeImageResponseProgress(progress / (float)total);
    };

    RCTImageLoaderCancellationBlock cancelationBlock =
        [self->_imageLoader loadImageWithURLRequest:request
                                               size:CGSizeMake(imageSource.size.width, imageSource.size.height)
                                              scale:imageSource.scale
                                            clipped:YES
                                         resizeMode:RCTResizeModeStretch
                                      progressBlock:progressBlock
                                   partialLoadBlock:nil
                                    completionBlock:completionBlock];

    sharedCancelationFunction.assign([cancelationBlock]() { cancelationBlock(); });
  });

  return imageRequest;
}

@end
