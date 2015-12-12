/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.graphics.Bitmap;

import com.facebook.common.executors.UiThreadImmediateExecutorService;
import com.facebook.common.references.CloseableReference;
import com.facebook.datasource.DataSource;
import com.facebook.datasource.DataSubscriber;
import com.facebook.imagepipeline.core.ImagePipeline;
import com.facebook.imagepipeline.core.ImagePipelineFactory;
import com.facebook.imagepipeline.image.CloseableBitmap;
import com.facebook.imagepipeline.image.CloseableImage;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.infer.annotation.Assertions;

/**
 * Helper class for DrawImage that helps manage fetch requests through ImagePipeline.
 *
 * Request states this class can be in:
 * 1) mDataSource == null, mImageRef == null : request has not be started, was canceled or failed.
 * 2) mDataSource != null, mImageRef == null : request is in progress.
 * 3) mDataSource == null, mImageRef != null : request successfully finished.
 * 4) mDataSource != null, mImageRef != null : invalid state (should never happen)
 */
/* package */ final class BitmapRequestHelper
    implements DataSubscriber<CloseableReference<CloseableImage>> {

  private final ImageRequest mImageRequest;
  private final DrawImageWithPipeline mDrawImage;
  private @Nullable DataSource<CloseableReference<CloseableImage>> mDataSource;
  private @Nullable CloseableReference<CloseableImage> mImageRef;
  private int mAttachCounter;

  /* package */ BitmapRequestHelper(ImageRequest imageRequest, DrawImageWithPipeline drawImage) {
    mImageRequest = imageRequest;
    mDrawImage = drawImage;
  }

  /* package */ void attach() {
    mAttachCounter++;
    if (mAttachCounter != 1) {
      // this is a secondary attach, ignore it, only updating Bitmap boundaries if needed.
      Bitmap bitmap = getBitmap();
      if (bitmap != null) {
        mDrawImage.updateBounds(bitmap);
      }
      return;
    }

    Assertions.assertCondition(mDataSource == null);
    Assertions.assertCondition(mImageRef == null);

    // Submit the request
    ImagePipeline imagePipeline = ImagePipelineFactory.getInstance().getImagePipeline();
    mDataSource = imagePipeline.fetchDecodedImage(mImageRequest, RCTImageView.getCallerContext());
    mDataSource.subscribe(this, UiThreadImmediateExecutorService.getInstance());
  }

  /**
   * Returns whether detach() was primary, false otherwise.
   */
  /* package */ void detach() {
    --mAttachCounter;
    if (mAttachCounter != 0) {
      // this is a secondary detach, ignore it
      return;
    }

    if (mDataSource != null) {
      mDataSource.close();
      mDataSource = null;
    }

    if (mImageRef != null) {
      mImageRef.close();
      mImageRef = null;
    }
  }

  /**
   * Returns an unsafe bitmap reference. Do not assign the result of this method to anything other
   * than a local variable, or it will no longer work with the reference count goes to zero.
   */
  /* package */ @Nullable Bitmap getBitmap() {
    if (mImageRef == null) {
      return null;
    }

    CloseableImage closeableImage = mImageRef.get();
    if (!(closeableImage instanceof CloseableBitmap)) {
      mImageRef.close();
      mImageRef = null;
      return null;
    }

    return ((CloseableBitmap) closeableImage).getUnderlyingBitmap();
  }

  @Override
  public void onNewResult(DataSource<CloseableReference<CloseableImage>> dataSource) {
    if (!dataSource.isFinished()) {
      // only interested in final image, no need to close the dataSource
      return;
    }

    try {
      if (mDataSource != dataSource) {
        // Shouldn't ever happen, but let's be safe (dataSource got closed by callback still fired?)
        return;
      }

      mDataSource = null;

      CloseableReference<CloseableImage> imageReference = dataSource.getResult();
      if (imageReference == null) {
        // Shouldn't ever happen, but let's be safe (dataSource got closed by callback still fired?)
        return;
      }

      CloseableImage image = imageReference.get();
      if (!(image instanceof CloseableBitmap)) {
        // only bitmaps are supported
        imageReference.close();
        return;
      }

      mImageRef = imageReference;

      Bitmap bitmap = getBitmap();
      if (bitmap == null) {
        // Shouldn't ever happen, but let's be safe.
        return;
      }

      // now that we have the Bitmap, DrawImage can finally initialize its
      // tranformation matrix to satisfy requested ScaleType.
      mDrawImage.updateBounds(bitmap);
    } finally {
      dataSource.close();
    }
  }

  @Override
  public void onFailure(DataSource<CloseableReference<CloseableImage>> dataSource) {
    if (mDataSource != dataSource) {
      // Should always be the case, but let's be safe.
      mDataSource = null;
    }

    dataSource.close();
  }

  @Override
  public void onCancellation(DataSource<CloseableReference<CloseableImage>> dataSource) {
  }

  @Override
  public void onProgressUpdate(DataSource<CloseableReference<CloseableImage>> dataSource) {
  }
}
