/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/mounting/SurfaceTelemetry.h>
#include <react/renderer/mounting/TransactionTelemetry.h>

namespace facebook {
namespace react {

/*
 * Encapsulates all artifacts of `ShadowTree` commit (or a series of them),
 * particularly list of mutations and meta-data associated with the commit.
 * Movable and copyable, but moving is strongly encouraged.
 * Beware: A moved-from object of this type has unspecified value and accessing
 * that is UB (Undefined Behaviour).
 */
class MountingTransaction final {
 public:
  /*
   * A Number (or revision) grows continuously starting from `1`. Value `0`
   * represents the state before the very first transaction happens.
   */
  using Number = int64_t;

  /*
   * Copying a list of `ShadowViewMutation` is expensive, so the constructor
   * accepts it as rvalue reference to discourage copying.
   */
  MountingTransaction(
      SurfaceId surfaceId,
      Number number,
      ShadowViewMutationList &&mutations,
      TransactionTelemetry telemetry);

  /*
   * Copy semantic.
   * Copying of MountingTransaction is expensive, so copy-constructor is
   * explicit and copy-assignment is deleted to prevent accidental copying.
   */
  explicit MountingTransaction(const MountingTransaction &mountingTransaction) =
      default;
  MountingTransaction &operator=(const MountingTransaction &other) = delete;

  /*
   * Move semantic.
   */
  MountingTransaction(MountingTransaction &&mountingTransaction) noexcept =
      default;
  MountingTransaction &operator=(MountingTransaction &&other) = default;

  /*
   * Returns a list of mutations that represent the transaction. The list can be
   * empty (theoretically).
   */
  ShadowViewMutationList const &getMutations() const &;
  ShadowViewMutationList getMutations() &&;

  /*
   * Returns telemetry associated with this transaction.
   */
  TransactionTelemetry const &getTelemetry() const;

  /*
   * Returns the id of the surface that the transaction belongs to.
   */
  SurfaceId getSurfaceId() const;

  /*
   * Returns a sequential number of the particular transaction.
   */
  Number getNumber() const;

 private:
  SurfaceId surfaceId_;
  Number number_;
  ShadowViewMutationList mutations_;
  TransactionTelemetry telemetry_;
};

} // namespace react
} // namespace facebook
