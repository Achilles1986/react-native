/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfacePresenter.h"

#import <React/RCTAssert.h>
#import <React/RCTCxxExceptionManager.h>
#import <React/RCTScheduler.h>
#import <React/RCTMountingManager.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTMountingManagerDelegate.h>
#import <React/RCTSurfaceRegistry.h>
#import <React/RCTComponentViewRegistry.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTSurfaceView+Internal.h>

using namespace facebook::react;

@interface RCTSurfacePresenter () <RCTSchedulerDelegate, RCTMountingManagerDelegate>
@end

@implementation RCTSurfacePresenter {
  std::shared_ptr<ExceptionManager> _exceptionManager;
  RCTScheduler *_scheduler;
  RCTMountingManager *_mountingManager;
  RCTBridge *_bridge;
  RCTBridge *_batchedBridge;
  RCTSurfaceRegistry *_surfaceRegistry;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;

    _exceptionManager = std::make_shared<RCTCxxExceptionManager>();

    _scheduler = [[RCTScheduler alloc] init];
    _scheduler.delegate = self;

    _surfaceRegistry = [[RCTSurfaceRegistry alloc] init];
    _mountingManager = [[RCTMountingManager alloc] init];
    _mountingManager.delegate = self;
  }

  return self;
}

- (std::shared_ptr<ExceptionManager>)exceptionManager
{
  return _exceptionManager;
}

- (void)schedulerDidComputeMutationInstructions:(facebook::react::TreeMutationInstructionList)instructions rootTag:(ReactTag)rootTag
{
  [_mountingManager mutateComponentViewTreeWithMutationInstructions:instructions
                                                            rootTag:rootTag];
}

- (void)schedulerDidRequestPreliminaryViewAllocationWithComponentName:(NSString *)componentName
{
  // TODO: To be implemeted.
}

#pragma mark - Internal Surface-dedicated Interface

- (void)registerSurface:(RCTFabricSurface *)surface
{
  [_surfaceRegistry registerSurface:surface];
  [_scheduler registerRootTag:surface.rootViewTag.integerValue];
  [self runSurface:surface];

  // FIXME: Mutation instruction MUST produce instruction for root node.
  [_mountingManager.componentViewRegistry dequeueComponentViewWithName:@"Root" tag:surface.rootViewTag.integerValue];
}

- (void)unregisterSurface:(RCTFabricSurface *)surface
{
  [self stopSurface:surface];
  [_scheduler unregisterRootTag:surface.rootViewTag.integerValue];
  [_surfaceRegistry unregisterSurface:surface];
}

- (void)runSurface:(RCTFabricSurface *)surface
{
  NSDictionary *applicationParameters = @{
    @"rootTag": surface.rootViewTag,
    @"initialProps": surface.properties,
  };

  [_batchedBridge enqueueJSCall:@"AppRegistry" method:@"runApplication" args:@[surface.moduleName, applicationParameters] completion:NULL];
}

- (void)stopSurface:(RCTFabricSurface *)surface
{
  [_batchedBridge enqueueJSCall:@"AppRegistry" method:@"unmountApplicationComponentAtRootTag" args:@[surface.rootViewTag] completion:NULL];
}

#pragma mark - RCTMountingManagerDelegate

- (void)mountingManager:(RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ReactTag)rootTag
{
  RCTIsMainQueue();
  // TODO: Propagate state change to Surface.
}

- (void)mountingManager:(RCTMountingManager *)mountingManager didMountComponentsWithRootTag:(ReactTag)rootTag
{
  RCTIsMainQueue();
  RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:rootTag];

  // FIXME: Implement proper state propagation mechanism.
  [surface _setStage:RCTSurfaceStageSurfaceDidInitialRendering];
  [surface _setStage:RCTSurfaceStageSurfaceDidInitialLayout];
  [surface _setStage:RCTSurfaceStageSurfaceDidInitialMounting];

  UIView *rootComponentView = [_mountingManager.componentViewRegistry componentViewByTag:rootTag];

  // FIXME: Remove this.
  rootComponentView.frame = CGRectMake(0, 0, 400, 400);

  surface.view.rootView = (RCTSurfaceRootView *)rootComponentView;
}

@end

@implementation RCTSurfacePresenter (Deprecated)

- (std::shared_ptr<FabricUIManager>)uiManager_DO_NOT_USE
{
  return _scheduler.uiManager_DO_NOT_USE;
}

- (std::shared_ptr<facebook::react::ExceptionManager>)exceptionManager_DO_NOT_USE
{
  return _exceptionManager;
}

@end

@implementation RCTBridge (RCTSurfacePresenter)

- (RCTSurfacePresenter *)surfacePresenter
{
  return [self jsBoundExtraModuleForClass:[RCTSurfacePresenter class]];
}

@end
