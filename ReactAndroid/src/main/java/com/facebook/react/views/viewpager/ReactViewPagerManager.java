/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.viewpager;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.AndroidViewPagerManagerDelegate;
import com.facebook.react.viewmanagers.AndroidViewPagerManagerInterface;
import java.util.Map;

/** Instance of {@link ViewManager} that provides native {@link ViewPager} view. */
@ReactModule(name = ReactViewPagerManager.REACT_CLASS)
public class ReactViewPagerManager extends ViewGroupManager<ReactViewPager>
    implements AndroidViewPagerManagerInterface<ReactViewPager> {

  public static final String REACT_CLASS = "AndroidViewPager";

  public static final int COMMAND_SET_PAGE = 1;
  public static final int COMMAND_SET_PAGE_WITHOUT_ANIMATION = 2;

  private final ViewManagerDelegate<ReactViewPager> mDelegate;

  public ReactViewPagerManager() {
    mDelegate = new AndroidViewPagerManagerDelegate<>(this);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactViewPager createViewInstance(ThemedReactContext reactContext) {
    return new ReactViewPager(reactContext);
  }

  @Override
  @ReactProp(name = "scrollEnabled", defaultBoolean = true)
  public void setScrollEnabled(ReactViewPager viewPager, boolean value) {
    viewPager.setScrollEnabled(value);
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return true;
  }

  @Override
  public Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
        PageScrollEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScroll"),
        PageScrollStateChangedEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onPageScrollStateChanged"),
        PageSelectedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageSelected"));
  }

  @Override
  public Map<String, Integer> getCommandsMap() {
    return MapBuilder.of(
        "setPage", COMMAND_SET_PAGE, "setPageWithoutAnimation", COMMAND_SET_PAGE_WITHOUT_ANIMATION);
  }

  @Override
  public void receiveCommand(
      ReactViewPager viewPager, int commandType, @Nullable ReadableArray args) {
    Assertions.assertNotNull(viewPager);
    Assertions.assertNotNull(args);
    switch (commandType) {
      case COMMAND_SET_PAGE:
        {
          viewPager.setCurrentItemFromJs(args.getInt(0), true);
          return;
        }
      case COMMAND_SET_PAGE_WITHOUT_ANIMATION:
        {
          viewPager.setCurrentItemFromJs(args.getInt(0), false);
          return;
        }
      default:
        throw new IllegalArgumentException(
            String.format(
                "Unsupported command %d received by %s.", commandType, getClass().getSimpleName()));
    }
  }

  @Override
  public void receiveCommand(
      ReactViewPager viewPager, String commandType, @Nullable ReadableArray args) {
    Assertions.assertNotNull(viewPager);
    Assertions.assertNotNull(args);
    switch (commandType) {
      case "setPage":
        {
          viewPager.setCurrentItemFromJs(args.getInt(0), true);
          return;
        }
      case "setPageWithoutAnimation":
        {
          viewPager.setCurrentItemFromJs(args.getInt(0), false);
          return;
        }
      default:
        throw new IllegalArgumentException(
            String.format(
                "Unsupported command %d received by %s.", commandType, getClass().getSimpleName()));
    }
  }

  @Override
  public void addView(ReactViewPager parent, View child, int index) {
    parent.addViewToAdapter(child, index);
  }

  @Override
  public int getChildCount(ReactViewPager parent) {
    return parent.getViewCountInAdapter();
  }

  @Override
  public View getChildAt(ReactViewPager parent, int index) {
    return parent.getViewFromAdapter(index);
  }

  @Override
  public void removeViewAt(ReactViewPager parent, int index) {
    parent.removeViewFromAdapter(index);
  }

  @Override
  @ReactProp(name = "pageMargin", defaultInt = 0)
  public void setPageMargin(ReactViewPager pager, int margin) {
    pager.setPageMargin((int) PixelUtil.toPixelFromDIP(margin));
  }

  @Override
  @ReactProp(name = "peekEnabled", defaultBoolean = false)
  public void setPeekEnabled(ReactViewPager pager, boolean peekEnabled) {
    pager.setClipToPadding(!peekEnabled);
  }

  @Override
  public void setInitialPage(ReactViewPager view, int value) {}

  @Override
  public void setKeyboardDismissMode(ReactViewPager view, @Nullable String value) {}

  @Override
  public void setPage(ReactViewPager view, int page) {
    view.setCurrentItemFromJs(page, true);
  }

  @Override
  public void setPageWithoutAnimation(ReactViewPager view, int page) {
    view.setCurrentItemFromJs(page, false);
  }

  @Override
  public ViewManagerDelegate<ReactViewPager> getDelegate() {
    return mDelegate;
  }
}
