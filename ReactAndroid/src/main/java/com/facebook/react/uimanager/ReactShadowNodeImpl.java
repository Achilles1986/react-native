/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.uimanager;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.uimanager.annotations.ReactPropertyHolder;
import com.facebook.yoga.YogaAlign;
import com.facebook.yoga.YogaBaselineFunction;
import com.facebook.yoga.YogaConfig;
import com.facebook.yoga.YogaConstants;
import com.facebook.yoga.YogaDirection;
import com.facebook.yoga.YogaDisplay;
import com.facebook.yoga.YogaEdge;
import com.facebook.yoga.YogaFlexDirection;
import com.facebook.yoga.YogaJustify;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaNode;
import com.facebook.yoga.YogaOverflow;
import com.facebook.yoga.YogaPositionType;
import com.facebook.yoga.YogaValue;
import com.facebook.yoga.YogaWrap;
import java.util.ArrayList;
import java.util.Arrays;
import javax.annotation.Nullable;

/**
 * Base node class for representing virtual tree of React nodes. Shadow nodes are used primarily for
 * layouting therefore it extends {@link YogaNode} to allow that. They also help with handling
 * Common base subclass of {@link YogaNode} for all layout nodes for react-based view. It extends
 * {@link YogaNode} by adding additional capabilities.
 *
 * <p>Instances of this class receive property updates from JS via @{link UIManagerModule}.
 * Subclasses may use {@link #updateShadowNode} to persist some of the updated fields in the node
 * instance that corresponds to a particular view type.
 *
 * <p>Subclasses of {@link ReactShadowNodeImpl} should be created only from {@link ViewManager} that
 * corresponds to a certain type of native view. They will be updated and accessed only from JS
 * thread. Subclasses of {@link ViewManager} may choose to use base class {@link
 * ReactShadowNodeImpl} or custom subclass of it if necessary.
 *
 * <p>The primary use-case for {@link ReactShadowNodeImpl} nodes is to calculate layouting. Although
 * this might be extended. For some examples please refer to ARTGroupYogaNode or ReactTextYogaNode.
 *
 * <p>This class allows for the native view hierarchy to not be an exact copy of the hierarchy
 * received from JS by keeping track of both JS children (e.g. {@link #getChildCount()} and
 * separately native children (e.g. {@link #getNativeChildCount()}). See {@link
 * NativeViewHierarchyOptimizer} for more information.
 */
@ReactPropertyHolder
public class ReactShadowNodeImpl implements ReactShadowNode<ReactShadowNodeImpl> {

  private int mReactTag;
  private @Nullable String mViewClassName;
  private @Nullable ReactShadowNodeImpl mRootNode;
  private @Nullable ThemedReactContext mThemedContext;
  private boolean mShouldNotifyOnLayout;
  private boolean mNodeUpdated = true;
  private @Nullable ArrayList<ReactShadowNodeImpl> mChildren;
  private @Nullable ReactShadowNodeImpl mParent;

  // layout-only nodes
  private boolean mIsLayoutOnly;
  private int mTotalNativeChildren = 0;
  private @Nullable ReactShadowNodeImpl mNativeParent;
  private @Nullable ArrayList<ReactShadowNodeImpl> mNativeChildren;
  private int mScreenX;
  private int mScreenY;
  private int mScreenWidth;
  private int mScreenHeight;
  private final Spacing mDefaultPadding = new Spacing(0);
  private final float[] mPadding = new float[Spacing.ALL + 1];
  private final boolean[] mPaddingIsPercent = new boolean[Spacing.ALL + 1];
  private final YogaNode mYogaNode;
  private static YogaConfig sYogaConfig;

  public ReactShadowNodeImpl() {
    if (!isVirtual()) {
      YogaNode node = YogaNodePool.get().acquire();
      if (sYogaConfig == null) {
        sYogaConfig = new YogaConfig();
        sYogaConfig.setPointScaleFactor(0f);
        sYogaConfig.setUseLegacyStretchBehaviour(true);
      }
      if (node == null) {
        node = new YogaNode(sYogaConfig);
      }
      mYogaNode = node;
      Arrays.fill(mPadding, YogaConstants.UNDEFINED);
    } else {
      mYogaNode = null;
    }
  }

  /**
   * Nodes that return {@code true} will be treated as "virtual" nodes. That is, nodes that are not
   * mapped into native views (e.g. nested text node). By default this method returns {@code false}.
   */
  @Override
  public boolean isVirtual() {
    return false;
  }

  /**
   * Nodes that return {@code true} will be treated as a root view for the virtual nodes tree. It
   * means that {@link NativeViewHierarchyManager} will not try to perform {@code manageChildren}
   * operation on such views. Good example is {@code InputText} view that may have children {@code
   * Text} nodes but this whole hierarchy will be mapped to a single android {@link EditText} view.
   */
  @Override
  public boolean isVirtualAnchor() {
    return false;
  }

  /**
   * Nodes that return {@code true} will not manage (and and remove) child Yoga nodes. For example
   * {@link ReactTextInputShadowNode} or {@link ReactTextShadowNode} have child nodes, which do not
   * want Yoga to lay out, so in the eyes of Yoga it is a leaf node. Override this method in
   * subclass to enforce this requirement.
   */
  @Override
  public boolean isYogaLeafNode() {
    return isMeasureDefined();
  }

  @Override
  public final String getViewClass() {
    return Assertions.assertNotNull(mViewClassName);
  }

  @Override
  public final boolean hasUpdates() {
    return mNodeUpdated || hasNewLayout() || isDirty();
  }

  @Override
  public final void markUpdateSeen() {
    mNodeUpdated = false;
    if (hasNewLayout()) {
      markLayoutSeen();
    }
  }

  @Override
  public void markUpdated() {
    if (mNodeUpdated) {
      return;
    }
    mNodeUpdated = true;
    ReactShadowNodeImpl parent = getParent();
    if (parent != null) {
      parent.markUpdated();
    }
  }

  @Override
  public final boolean hasUnseenUpdates() {
    return mNodeUpdated;
  }

  @Override
  public void dirty() {
    if (!isVirtual()) {
      mYogaNode.dirty();
    }
  }

  @Override
  public final boolean isDirty() {
    return mYogaNode != null && mYogaNode.isDirty();
  }

  @Override
  public void addChildAt(ReactShadowNodeImpl child, int i) {
    if (child.getParent() != null) {
      throw new IllegalViewOperationException(
        "Tried to add child that already has a parent! Remove it from its parent first.");
    }
    if (mChildren == null) {
      mChildren = new ArrayList<ReactShadowNodeImpl>(4);
    }
    mChildren.add(i, child);
    child.mParent = this;

    // If a CSS node has measure defined, the layout algorithm will not visit its children. Even
    // more, it asserts that you don't add children to nodes with measure functions.
    if (mYogaNode != null && !isYogaLeafNode()) {
      YogaNode childYogaNode = child.mYogaNode;
      if (childYogaNode == null) {
        throw new RuntimeException(
            "Cannot add a child that doesn't have a YogaNode to a parent without a measure "
                + "function! (Trying to add a '"
                + child.getClass().getSimpleName()
                + "' to a '"
                + getClass().getSimpleName()
                + "')");
      }
      mYogaNode.addChildAt(childYogaNode, i);
    }
    markUpdated();

    int increase = child.isLayoutOnly() ? child.getTotalNativeChildren() : 1;
    mTotalNativeChildren += increase;

    updateNativeChildrenCountInParent(increase);
  }

  @Override
  public ReactShadowNodeImpl removeChildAt(int i) {
    if (mChildren == null) {
      throw new ArrayIndexOutOfBoundsException(
        "Index " + i + " out of bounds: node has no children");
    }
    ReactShadowNodeImpl removed = mChildren.remove(i);
    removed.mParent = null;

    if (mYogaNode != null && !isYogaLeafNode()) {
      mYogaNode.removeChildAt(i);
    }
    markUpdated();

    int decrease = removed.isLayoutOnly() ? removed.getTotalNativeChildren() : 1;
    mTotalNativeChildren -= decrease;
    updateNativeChildrenCountInParent(-decrease);
    return removed;
  }

  @Override
  public final int getChildCount() {
    return mChildren == null ? 0 : mChildren.size();
  }

  @Override
  public final ReactShadowNodeImpl getChildAt(int i) {
    if (mChildren == null) {
      throw new ArrayIndexOutOfBoundsException(
        "Index " + i + " out of bounds: node has no children");
    }
    return mChildren.get(i);
  }

  @Override
  public final int indexOf(ReactShadowNodeImpl child) {
    return mChildren == null ? -1 : mChildren.indexOf(child);
  }

  @Override
  public void removeAndDisposeAllChildren() {
    if (getChildCount() == 0) {
      return;
    }

    int decrease = 0;
    for (int i = getChildCount() - 1; i >= 0; i--) {
      if (mYogaNode != null && !isYogaLeafNode()) {
        mYogaNode.removeChildAt(i);
      }
      ReactShadowNodeImpl toRemove = getChildAt(i);
      toRemove.mParent = null;
      toRemove.dispose();

      decrease += toRemove.isLayoutOnly() ? toRemove.getTotalNativeChildren() : 1;
    }
    Assertions.assertNotNull(mChildren).clear();
    markUpdated();

    mTotalNativeChildren -= decrease;
    updateNativeChildrenCountInParent(-decrease);
  }

  private void updateNativeChildrenCountInParent(int delta) {
    if (mIsLayoutOnly) {
      ReactShadowNodeImpl parent = getParent();
      while (parent != null) {
        parent.mTotalNativeChildren += delta;
        if (!parent.isLayoutOnly()) {
          break;
        }
        parent = parent.getParent();
      }
    }
  }

  /**
   * This method will be called by {@link UIManagerModule} once per batch, before calculating
   * layout. Will be only called for nodes that are marked as updated with {@link #markUpdated()} or
   * require layouting (marked with {@link #dirty()}).
   */
  @Override
  public void onBeforeLayout() {}

  @Override
  public final void updateProperties(ReactStylesDiffMap props) {
    ViewManagerPropertyUpdater.updateProps(this, props);
    onAfterUpdateTransaction();
  }

  @Override
  public void onAfterUpdateTransaction() {
    // no-op
  }

  /**
   * Called after layout step at the end of the UI batch from {@link UIManagerModule}. May be used
   * to enqueue additional ui operations for the native view. Will only be called on nodes marked as
   * updated either with {@link #dirty()} or {@link #markUpdated()}.
   *
   * @param uiViewOperationQueue interface for enqueueing UI operations
   */
  @Override
  public void onCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue) {}

  /** @return true if layout (position or dimensions) changed, false otherwise. */
  @Override
  public boolean dispatchUpdates(
      float absoluteX,
      float absoluteY,
      UIViewOperationQueue uiViewOperationQueue,
      NativeViewHierarchyOptimizer nativeViewHierarchyOptimizer) {
    if (mNodeUpdated) {
      onCollectExtraUpdates(uiViewOperationQueue);
    }

    if (hasNewLayout()) {
      float layoutX = getLayoutX();
      float layoutY = getLayoutY();
      int newAbsoluteLeft = Math.round(absoluteX + layoutX);
      int newAbsoluteTop = Math.round(absoluteY + layoutY);
      int newAbsoluteRight = Math.round(absoluteX + layoutX + getLayoutWidth());
      int newAbsoluteBottom = Math.round(absoluteY + layoutY + getLayoutHeight());

      int newScreenX = Math.round(layoutX);
      int newScreenY = Math.round(layoutY);
      int newScreenWidth = newAbsoluteRight - newAbsoluteLeft;
      int newScreenHeight = newAbsoluteBottom - newAbsoluteTop;

      boolean layoutHasChanged =
          newScreenX != mScreenX
              || newScreenY != mScreenY
              || newScreenWidth != mScreenWidth
              || newScreenHeight != mScreenHeight;

      mScreenX = newScreenX;
      mScreenY = newScreenY;
      mScreenWidth = newScreenWidth;
      mScreenHeight = newScreenHeight;

      if (layoutHasChanged) {
        nativeViewHierarchyOptimizer.handleUpdateLayout(this);
      }

      return layoutHasChanged;
    } else {
      return false;
    }
  }

  @Override
  public final int getReactTag() {
    return mReactTag;
  }

  @Override
  public void setReactTag(int reactTag) {
    mReactTag = reactTag;
  }

  @Override
  public final ReactShadowNodeImpl getRootNode() {
    return Assertions.assertNotNull(mRootNode);
  }

  @Override
  public final void setRootNode(ReactShadowNodeImpl rootNode) {
    mRootNode = rootNode;
  }

  @Override
  public final void setViewClassName(String viewClassName) {
    mViewClassName = viewClassName;
  }

  @Override
  public final @Nullable ReactShadowNodeImpl getParent() {
    return mParent;
  }

  /**
   * Get the {@link ThemedReactContext} associated with this {@link ReactShadowNodeImpl}. This will
   * never change during the lifetime of a {@link ReactShadowNodeImpl} instance, but different
   * instances can have different contexts; don't cache any calculations based on theme values
   * globally.
   */
  @Override
  public final ThemedReactContext getThemedContext() {
    return Assertions.assertNotNull(mThemedContext);
  }

  @Override
  public void setThemedContext(ThemedReactContext themedContext) {
    mThemedContext = themedContext;
  }

  @Override
  public final boolean shouldNotifyOnLayout() {
    return mShouldNotifyOnLayout;
  }

  @Override
  public void calculateLayout() {
    mYogaNode.calculateLayout(YogaConstants.UNDEFINED, YogaConstants.UNDEFINED);
  }

  @Override
  public final boolean hasNewLayout() {
    return mYogaNode != null && mYogaNode.hasNewLayout();
  }

  @Override
  public final void markLayoutSeen() {
    if (mYogaNode != null) {
      mYogaNode.markLayoutSeen();
    }
  }

  /**
   * Adds a child that the native view hierarchy will have at this index in the native view
   * corresponding to this node.
   */
  @Override
  public final void addNativeChildAt(ReactShadowNodeImpl child, int nativeIndex) {
    Assertions.assertCondition(!mIsLayoutOnly);
    Assertions.assertCondition(!child.mIsLayoutOnly);

    if (mNativeChildren == null) {
      mNativeChildren = new ArrayList<>(4);
    }

    mNativeChildren.add(nativeIndex, child);
    child.mNativeParent = this;
  }

  @Override
  public final ReactShadowNodeImpl removeNativeChildAt(int i) {
    Assertions.assertNotNull(mNativeChildren);
    ReactShadowNodeImpl removed = mNativeChildren.remove(i);
    removed.mNativeParent = null;
    return removed;
  }

  @Override
  public final void removeAllNativeChildren() {
    if (mNativeChildren != null) {
      for (int i = mNativeChildren.size() - 1; i >= 0; i--) {
        mNativeChildren.get(i).mNativeParent = null;
      }
      mNativeChildren.clear();
    }
  }

  @Override
  public final int getNativeChildCount() {
    return mNativeChildren == null ? 0 : mNativeChildren.size();
  }

  @Override
  public final int indexOfNativeChild(ReactShadowNodeImpl nativeChild) {
    Assertions.assertNotNull(mNativeChildren);
    return mNativeChildren.indexOf(nativeChild);
  }

  @Override
  public final @Nullable ReactShadowNodeImpl getNativeParent() {
    return mNativeParent;
  }

  /**
   * Sets whether this node only contributes to the layout of its children without doing any drawing
   * or functionality itself.
   */
  @Override
  public final void setIsLayoutOnly(boolean isLayoutOnly) {
    Assertions.assertCondition(getParent() == null, "Must remove from no opt parent first");
    Assertions.assertCondition(mNativeParent == null, "Must remove from native parent first");
    Assertions.assertCondition(getNativeChildCount() == 0, "Must remove all native children first");
    mIsLayoutOnly = isLayoutOnly;
  }

  @Override
  public final boolean isLayoutOnly() {
    return mIsLayoutOnly;
  }

  @Override
  public final int getTotalNativeChildren() {
    return mTotalNativeChildren;
  }

  @Override
  public boolean isDescendantOf(ReactShadowNodeImpl ancestorNode) {
    ReactShadowNodeImpl parentNode = getParent();

    boolean isDescendant = false;

    while (parentNode != null) {
      if (parentNode == ancestorNode) {
        isDescendant = true;
        break;
      } else {
        parentNode = parentNode.getParent();
      }
    }

    return isDescendant;
  }

  /*
   * In some cases we need a way to specify some environmental data to shadow node
   * to improve layout (or do something similar), so {@code localData} serves these needs.
   * For example, any stateful embedded native views may benefit from this.
   * Have in mind that this data is not supposed to interfere with the state of
   * the shadow node.
   * Please respect one-directional data flow of React.
   * Use  {@link ReactUIManagerModule#setViewLocalData} to set this property
   * (to provide local/environmental data for a shadow node) from the main thread.
   */
  public void setLocalData(Object data) {}

  /**
   * Returns the offset within the native children owned by all layout-only nodes in the subtree
   * rooted at this node for the given child. Put another way, this returns the number of native
   * nodes (nodes not optimized out of the native tree) that are a) to the left (visited before by a
   * DFS) of the given child in the subtree rooted at this node and b) do not have a native parent
   * in this subtree (which means that the given child will be a sibling of theirs in the final
   * native hierarchy since they'll get attached to the same native parent).
   *
   * <p>Basically, a view might have children that have been optimized away by {@link
   * NativeViewHierarchyOptimizer}. Since those children will then add their native children to this
   * view, we now have ranges of native children that correspond to single unoptimized children. The
   * purpose of this method is to return the index within the native children that corresponds to
   * the **start** of the native children that belong to the given child. Also, note that all of the
   * children of a view might be optimized away, so this could return the same value for multiple
   * different children.
   *
   * <p>Example. Native children are represented by (N) where N is the no-opt child they came from.
   * If no children are optimized away it'd look like this: (0) (1) (2) (3) ... (n)
   *
   * <p>In case some children are optimized away, it might look like this: (0) (1) (1) (1) (3) (3)
   * (4)
   *
   * <p>In that case: getNativeOffsetForChild(Node 0) => 0 getNativeOffsetForChild(Node 1) => 1
   * getNativeOffsetForChild(Node 2) => 4 getNativeOffsetForChild(Node 3) => 4
   *
   * <p>getNativeOffsetForChild(Node 4) => 6
   */
  @Override
  public final int getNativeOffsetForChild(ReactShadowNodeImpl child) {
    int index = 0;
    boolean found = false;
    for (int i = 0; i < getChildCount(); i++) {
      ReactShadowNodeImpl current = getChildAt(i);
      if (child == current) {
        found = true;
        break;
      }
      index += (current.isLayoutOnly() ? current.getTotalNativeChildren() : 1);
    }
    if (!found) {
      throw new RuntimeException(
          "Child " + child.getReactTag() + " was not a child of " + mReactTag);
    }
    return index;
  }

  @Override
  public final float getLayoutX() {
    return mYogaNode.getLayoutX();
  }

  @Override
  public final float getLayoutY() {
    return mYogaNode.getLayoutY();
  }

  @Override
  public final float getLayoutWidth() {
    return mYogaNode.getLayoutWidth();
  }

  @Override
  public final float getLayoutHeight() {
    return mYogaNode.getLayoutHeight();
  }

  /** @return the x position of the corresponding view on the screen, rounded to pixels */
  @Override
  public int getScreenX() {
    return mScreenX;
  }

  /** @return the y position of the corresponding view on the screen, rounded to pixels */
  @Override
  public int getScreenY() {
    return mScreenY;
  }

  /** @return width corrected for rounding to pixels. */
  @Override
  public int getScreenWidth() {
    return mScreenWidth;
  }

  /** @return height corrected for rounding to pixels. */
  @Override
  public int getScreenHeight() {
    return mScreenHeight;
  }

  @Override
  public final YogaDirection getLayoutDirection() {
    return mYogaNode.getLayoutDirection();
  }

  @Override
  public void setLayoutDirection(YogaDirection direction) {
    mYogaNode.setDirection(direction);
  }

  @Override
  public final YogaValue getStyleWidth() {
    return mYogaNode.getWidth();
  }

  @Override
  public void setStyleWidth(float widthPx) {
    mYogaNode.setWidth(widthPx);
  }

  @Override
  public void setStyleWidthPercent(float percent) {
    mYogaNode.setWidthPercent(percent);
  }

  @Override
  public void setStyleWidthAuto() {
    mYogaNode.setWidthAuto();
  }

  @Override
  public void setStyleMinWidth(float widthPx) {
    mYogaNode.setMinWidth(widthPx);
  }

  @Override
  public void setStyleMinWidthPercent(float percent) {
    mYogaNode.setMinWidthPercent(percent);
  }

  @Override
  public void setStyleMaxWidth(float widthPx) {
    mYogaNode.setMaxWidth(widthPx);
  }

  @Override
  public void setStyleMaxWidthPercent(float percent) {
    mYogaNode.setMaxWidthPercent(percent);
  }

  @Override
  public final YogaValue getStyleHeight() {
    return mYogaNode.getHeight();
  }

  @Override
  public void setStyleHeight(float heightPx) {
    mYogaNode.setHeight(heightPx);
  }

  @Override
  public void setStyleHeightPercent(float percent) {
    mYogaNode.setHeightPercent(percent);
  }

  @Override
  public void setStyleHeightAuto() {
    mYogaNode.setHeightAuto();
  }

  @Override
  public void setStyleMinHeight(float widthPx) {
    mYogaNode.setMinHeight(widthPx);
  }

  @Override
  public void setStyleMinHeightPercent(float percent) {
    mYogaNode.setMinHeightPercent(percent);
  }

  @Override
  public void setStyleMaxHeight(float widthPx) {
    mYogaNode.setMaxHeight(widthPx);
  }

  @Override
  public void setStyleMaxHeightPercent(float percent) {
    mYogaNode.setMaxHeightPercent(percent);
  }

  @Override
  public void setFlex(float flex) {
    mYogaNode.setFlex(flex);
  }

  @Override
  public void setFlexGrow(float flexGrow) {
    mYogaNode.setFlexGrow(flexGrow);
  }

  @Override
  public void setFlexShrink(float flexShrink) {
    mYogaNode.setFlexShrink(flexShrink);
  }

  @Override
  public void setFlexBasis(float flexBasis) {
    mYogaNode.setFlexBasis(flexBasis);
  }

  @Override
  public void setFlexBasisAuto() {
    mYogaNode.setFlexBasisAuto();
  }

  @Override
  public void setFlexBasisPercent(float percent) {
    mYogaNode.setFlexBasisPercent(percent);
  }

  @Override
  public void setStyleAspectRatio(float aspectRatio) {
    mYogaNode.setAspectRatio(aspectRatio);
  }

  @Override
  public void setFlexDirection(YogaFlexDirection flexDirection) {
    mYogaNode.setFlexDirection(flexDirection);
  }

  @Override
  public void setFlexWrap(YogaWrap wrap) {
    mYogaNode.setWrap(wrap);
  }

  @Override
  public void setAlignSelf(YogaAlign alignSelf) {
    mYogaNode.setAlignSelf(alignSelf);
  }

  @Override
  public void setAlignItems(YogaAlign alignItems) {
    mYogaNode.setAlignItems(alignItems);
  }

  @Override
  public void setAlignContent(YogaAlign alignContent) {
    mYogaNode.setAlignContent(alignContent);
  }

  @Override
  public void setJustifyContent(YogaJustify justifyContent) {
    mYogaNode.setJustifyContent(justifyContent);
  }

  @Override
  public void setOverflow(YogaOverflow overflow) {
    mYogaNode.setOverflow(overflow);
  }

  @Override
  public void setDisplay(YogaDisplay display) {
    mYogaNode.setDisplay(display);
  }

  @Override
  public void setMargin(int spacingType, float margin) {
    mYogaNode.setMargin(YogaEdge.fromInt(spacingType), margin);
  }

  @Override
  public void setMarginPercent(int spacingType, float percent) {
    mYogaNode.setMarginPercent(YogaEdge.fromInt(spacingType), percent);
  }

  @Override
  public void setMarginAuto(int spacingType) {
    mYogaNode.setMarginAuto(YogaEdge.fromInt(spacingType));
  }

  @Override
  public final float getPadding(int spacingType) {
    return mYogaNode.getLayoutPadding(YogaEdge.fromInt(spacingType));
  }

  @Override
  public final YogaValue getStylePadding(int spacingType) {
    return mYogaNode.getPadding(YogaEdge.fromInt(spacingType));
  }

  @Override
  public void setDefaultPadding(int spacingType, float padding) {
    mDefaultPadding.set(spacingType, padding);
    updatePadding();
  }

  @Override
  public void setPadding(int spacingType, float padding) {
    mPadding[spacingType] = padding;
    mPaddingIsPercent[spacingType] = false;
    updatePadding();
  }

  @Override
  public void setPaddingPercent(int spacingType, float percent) {
    mPadding[spacingType] = percent;
    mPaddingIsPercent[spacingType] = !YogaConstants.isUndefined(percent);
    updatePadding();
  }

  private void updatePadding() {
    for (int spacingType = Spacing.LEFT; spacingType <= Spacing.ALL; spacingType++) {
      if (spacingType == Spacing.LEFT
          || spacingType == Spacing.RIGHT
          || spacingType == Spacing.START
          || spacingType == Spacing.END) {
        if (YogaConstants.isUndefined(mPadding[spacingType])
            && YogaConstants.isUndefined(mPadding[Spacing.HORIZONTAL])
            && YogaConstants.isUndefined(mPadding[Spacing.ALL])) {
          mYogaNode.setPadding(YogaEdge.fromInt(spacingType), mDefaultPadding.getRaw(spacingType));
          continue;
        }
      } else if (spacingType == Spacing.TOP || spacingType == Spacing.BOTTOM) {
        if (YogaConstants.isUndefined(mPadding[spacingType])
            && YogaConstants.isUndefined(mPadding[Spacing.VERTICAL])
            && YogaConstants.isUndefined(mPadding[Spacing.ALL])) {
          mYogaNode.setPadding(YogaEdge.fromInt(spacingType), mDefaultPadding.getRaw(spacingType));
          continue;
        }
      } else {
        if (YogaConstants.isUndefined(mPadding[spacingType])) {
          mYogaNode.setPadding(YogaEdge.fromInt(spacingType), mDefaultPadding.getRaw(spacingType));
          continue;
        }
      }

      if (mPaddingIsPercent[spacingType]) {
        mYogaNode.setPaddingPercent(YogaEdge.fromInt(spacingType), mPadding[spacingType]);
      } else {
        mYogaNode.setPadding(YogaEdge.fromInt(spacingType), mPadding[spacingType]);
      }
    }
  }

  @Override
  public void setBorder(int spacingType, float borderWidth) {
    mYogaNode.setBorder(YogaEdge.fromInt(spacingType), borderWidth);
  }

  @Override
  public void setPosition(int spacingType, float position) {
    mYogaNode.setPosition(YogaEdge.fromInt(spacingType), position);
  }

  @Override
  public void setPositionPercent(int spacingType, float percent) {
    mYogaNode.setPositionPercent(YogaEdge.fromInt(spacingType), percent);
  }

  @Override
  public void setPositionType(YogaPositionType positionType) {
    mYogaNode.setPositionType(positionType);
  }

  @Override
  public void setShouldNotifyOnLayout(boolean shouldNotifyOnLayout) {
    mShouldNotifyOnLayout = shouldNotifyOnLayout;
  }

  @Override
  public void setBaselineFunction(YogaBaselineFunction baselineFunction) {
    mYogaNode.setBaselineFunction(baselineFunction);
  }

  @Override
  public void setMeasureFunction(YogaMeasureFunction measureFunction) {
    if ((measureFunction == null ^ mYogaNode.isMeasureDefined()) && getChildCount() != 0) {
      throw new RuntimeException(
          "Since a node with a measure function does not add any native yoga children, it's "
              + "not safe to transition to/from having a measure function unless a node has no children");
    }
    mYogaNode.setMeasureFunction(measureFunction);
  }

  @Override
  public boolean isMeasureDefined() {
    return mYogaNode.isMeasureDefined();
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    toStringWithIndentation(sb, 0);
    return sb.toString();
  }

  private void toStringWithIndentation(StringBuilder result, int level) {
    // Spaces and tabs are dropped by IntelliJ logcat integration, so rely on __ instead.
    for (int i = 0; i < level; ++i) {
      result.append("__");
    }

    result.append(getClass().getSimpleName()).append(" ");
    if (mYogaNode != null) {
      result.append(getLayoutWidth()).append(",").append(getLayoutHeight());
    } else {
      result.append("(virtual node)");
    }
    result.append("\n");

    if (getChildCount() == 0) {
      return;
    }

    for (int i = 0; i < getChildCount(); i++) {
      getChildAt(i).toStringWithIndentation(result, level + 1);
    }
  }

  @Override
  public void dispose() {
    if (mYogaNode != null) {
      mYogaNode.reset();
      YogaNodePool.get().release(mYogaNode);
    }
  }
}
