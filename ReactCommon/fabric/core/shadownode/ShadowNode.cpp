/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNode.h"

#include <string>

#include <fabric/debug/DebugStringConvertible.h>
#include <fabric/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

SharedShadowNodeSharedList ShadowNode::emptySharedShadowNodeSharedList() {
  static const auto emptySharedShadowNodeSharedList = std::make_shared<SharedShadowNodeList>();
  return emptySharedShadowNodeSharedList;
}

#pragma mark - Constructors

ShadowNode::ShadowNode(
  const ShadowNodeFragment &fragment,
  const ShadowNodeCloneFunction &cloneFunction
):
  tag_(fragment.tag),
  rootTag_(fragment.rootTag),
  props_(fragment.props),
  eventEmitter_(fragment.eventEmitter),
  children_(std::make_shared<SharedShadowNodeList>(*fragment.children)),
  cloneFunction_(cloneFunction),
  revision_(1) {}

ShadowNode::ShadowNode(
  const SharedShadowNode &sourceShadowNode,
  const ShadowNodeFragment &fragment
):
  tag_(fragment.tag ?: sourceShadowNode->tag_),
  rootTag_(fragment.rootTag ?: sourceShadowNode->rootTag_),
  props_(fragment.props ?: sourceShadowNode->props_),
  eventEmitter_(fragment.eventEmitter ?: sourceShadowNode->eventEmitter_),
  children_(std::make_shared<SharedShadowNodeList>(*(fragment.children ?: sourceShadowNode->children_))),
  localData_(fragment.localData ?: sourceShadowNode->localData_),
  cloneFunction_(sourceShadowNode->cloneFunction_),
  revision_(sourceShadowNode->revision_ + 1) {}

UnsharedShadowNode ShadowNode::clone(const ShadowNodeFragment &fragment) const {
  assert(cloneFunction_);
  return cloneFunction_(shared_from_this(), fragment);
}

#pragma mark - Getters

SharedShadowNodeSharedList ShadowNode::getChildren() const {
  return children_;
}

SharedProps ShadowNode::getProps() const {
  return props_;
}

SharedEventEmitter ShadowNode::getEventEmitter() const {
  return eventEmitter_;
}

Tag ShadowNode::getTag() const {
  return tag_;
}

Tag ShadowNode::getRootTag() const {
  return rootTag_;
}

SharedLocalData ShadowNode::getLocalData() const {
  return localData_;
}

void ShadowNode::sealRecursive() const {
  if (getSealed()) {
    return;
  }

  seal();

  props_->seal();

  for (auto child : *children_) {
    child->sealRecursive();
  }
}

#pragma mark - Mutating Methods

void ShadowNode::appendChild(const SharedShadowNode &child) {
  ensureUnsealed();

  auto nonConstChildren = std::const_pointer_cast<SharedShadowNodeList>(children_);
  nonConstChildren->push_back(child);
}

void ShadowNode::replaceChild(const SharedShadowNode &oldChild, const SharedShadowNode &newChild, int suggestedIndex) {
  ensureUnsealed();

  auto nonConstChildren = std::const_pointer_cast<SharedShadowNodeList>(children_);

  if (suggestedIndex != -1 && suggestedIndex < nonConstChildren->size()) {
    if (nonConstChildren->at(suggestedIndex) == oldChild) {
      (*nonConstChildren)[suggestedIndex] = newChild;
      return;
    }
  }

  std::replace(nonConstChildren->begin(), nonConstChildren->end(), oldChild, newChild);
}

void ShadowNode::setLocalData(const SharedLocalData &localData) {
  ensureUnsealed();
  localData_ = localData;
}

#pragma mark - Equality

bool ShadowNode::operator==(const ShadowNode& rhs) const {
  // Note: Child nodes are not considered as part of instance's value
  // and/or identity.
  return
    tag_ == rhs.tag_ &&
    rootTag_ == rhs.rootTag_ &&
    props_ == rhs.props_ &&
    eventEmitter_ == rhs.eventEmitter_ &&
    localData_ == rhs.localData_;
}

bool ShadowNode::operator!=(const ShadowNode& rhs) const {
  return !(*this == rhs);
}

#pragma mark - DebugStringConvertible

std::string ShadowNode::getDebugName() const {
  return getComponentName();
}

std::string ShadowNode::getDebugValue() const {
  return "r" + folly::to<std::string>(revision_) + (getSealed() ? "/sealed" : "");
}

SharedDebugStringConvertibleList ShadowNode::getDebugChildren() const {
  SharedDebugStringConvertibleList debugChildren = {};

  for (auto child : *children_) {
    auto debugChild = std::dynamic_pointer_cast<const DebugStringConvertible>(child);
    if (debugChild) {
      debugChildren.push_back(debugChild);
    }
  }

  return debugChildren;
}

SharedDebugStringConvertibleList ShadowNode::getDebugProps() const {
  return
    props_->getDebugProps() +
    SharedDebugStringConvertibleList {
      debugStringConvertibleItem("tag", folly::to<std::string>(tag_))
    };
}

} // namespace react
} // namespace facebook
