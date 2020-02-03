/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <better/mutex.h>

#include <react/core/EventEmitter.h>
#include <react/core/ReactPrimitives.h>
#include <react/core/ShadowNodeFamilyFragment.h>

namespace facebook {
namespace react {

class ComponentDescriptor;
class ShadowNode;

/*
 * Represents all things that shadow nodes from the same family have in common.
 * To be used inside `ShadowNode` class *only*.
 */
class ShadowNodeFamily {
 public:
  using Shared = std::shared_ptr<ShadowNodeFamily const>;
  using Weak = std::weak_ptr<ShadowNodeFamily const>;

  using AncestorList = better::small_vector<
      std::pair<
          std::reference_wrapper<ShadowNode const> /* parentNode */,
          int /* childIndex */>,
      64>;

  ShadowNodeFamily(
      ShadowNodeFamilyFragment const &fragment,
      EventDispatcher::Weak eventDispatcher,
      ComponentDescriptor const &componentDescriptor);

  /*
   * Sets the parent.
   * This is not technically thread-safe, but practically it mutates the object
   * only once (and the model enforces that this first call is not concurrent).
   */
  void setParent(ShadowNodeFamily::Shared const &parent) const;

  /*
   * Returns a handle (or name) associated with the component.
   */
  ComponentHandle getComponentHandle() const;
  ComponentName getComponentName() const;

  /*
   * Returns a list of all ancestors of the node relative to the given ancestor.
   * The list starts from the given ancestor node and ends with the parent node
   * of `this` node. The elements of the list have a reference to some parent
   * node and an index of the child of the parent node.
   * Returns an empty array if there is no ancestor-descendant relationship.
   * Can be called from any thread.
   * The theoretical complexity of the algorithm is `O(ln(n))`. Use it wisely.
   */
  AncestorList getAncestors(ShadowNode const &ancestorShadowNode) const;

  SurfaceId getSurfaceId() const;

  /*
   * Sets and gets a state target.
   */
  const StateTarget &getTarget() const;
  void setTarget(StateTarget &&target) const;

  /*
   * Dispatches a state update with given priority.
   */
  void dispatchRawState(
      std::function<StateData::Shared()> &&stateData,
      EventPriority priority) const;

 private:
  friend ShadowNode;

  EventDispatcher::Weak eventDispatcher_;
  mutable StateTarget target_{}; // Protected by `mutex_`.
  mutable better::shared_mutex mutex_;

  /*
   * Deprecated.
   */
  Tag const tag_;

  /*
   * Identifier of a running Surface instance.
   */
  SurfaceId const surfaceId_;

  /*
   * `EventEmitter` associated with all nodes of the family.
   */
  SharedEventEmitter const eventEmitter_;

  /*
   * Reference to a concrete `ComponentDescriptor` that manages nodes of this
   * type.
   */
  ComponentDescriptor const &componentDescriptor_;

  /*
   * ComponentHandle and ComponentName must be stored (cached) inside the object
   * to allow retrieving these values without accessing a `ComponentDescriptor`
   * object (because it can be already deallocated).
   */
  ComponentHandle componentHandle_;
  ComponentName componentName_;

  /*
   * Points to a family of all parent nodes of all nodes of the family.
   */
  mutable ShadowNodeFamily::Weak parent_{};

  /*
   * Represents a case where `parent_` is `nullptr`.
   * For optimization purposes only.
   */
  mutable bool hasParent_{false};
};

} // namespace react
} // namespace facebook
