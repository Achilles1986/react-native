/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTKeyCommands.h"

#import <UIKit/UIKit.h>

#import "RCTUtils.h"

@interface RCTKeyCommand : NSObject <NSCopying>

@property (nonatomic, strong) UIKeyCommand *keyCommand;
@property (nonatomic, copy) void (^block)(UIKeyCommand *);

@end

@implementation RCTKeyCommand

- (instancetype)initWithKeyCommand:(UIKeyCommand *)keyCommand
                             block:(void (^)(UIKeyCommand *))block
{
  if ((self = [super init])) {
    _keyCommand = keyCommand;
    _block = block ?: ^(__unused UIKeyCommand *cmd) {};
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-init)

- (id)copyWithZone:(__unused NSZone *)zone
{
  return self;
}

- (NSUInteger)hash
{
  return _keyCommand.input.hash ^ _keyCommand.modifierFlags;
}

- (BOOL)isEqual:(RCTKeyCommand *)object
{
  if (![object isKindOfClass:[RCTKeyCommand class]]) {
    return NO;
  }
  return [self matchesInput:object.keyCommand.input
                      flags:object.keyCommand.modifierFlags];
}

- (BOOL)matchesInput:(NSString *)input flags:(UIKeyModifierFlags)flags
{
  return [_keyCommand.input isEqual:input] && _keyCommand.modifierFlags == flags;
}

@end

@interface RCTKeyCommands ()

@property (nonatomic, strong) NSMutableSet *commands;

- (BOOL)RCT_handleKeyCommand:(UIKeyCommand *)key;

@end

@implementation UIApplication (RCTKeyCommands)

- (NSArray *)RCT_keyCommands
{
  NSSet *commands = [RCTKeyCommands sharedInstance].commands;
  return [[self RCT_keyCommands] arrayByAddingObjectsFromArray:
          [[commands valueForKeyPath:@"keyCommand"] allObjects]];
}

- (BOOL)RCT_sendAction:(SEL)action to:(id)target from:(id)sender forEvent:(UIEvent *)event
{
  if (action == @selector(RCT_handleKeyCommand:)) {
    return [[RCTKeyCommands sharedInstance] RCT_handleKeyCommand:sender];
  }
  return [self RCT_sendAction:action to:target from:sender forEvent:event];
}

@end

@implementation RCTKeyCommands

+ (void)initialize
{
  //swizzle UIApplication
  RCTSwapInstanceMethods([UIApplication class], @selector(keyCommands), @selector(RCT_keyCommands));
  RCTSwapInstanceMethods([UIApplication class], @selector(sendAction:to:from:forEvent:), @selector(RCT_sendAction:to:from:forEvent:));
}

+ (instancetype)sharedInstance
{
  static RCTKeyCommands *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[self alloc] init];
  });

  return sharedInstance;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _commands = [[NSMutableSet alloc] init];
  }
  return self;
}

- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *))block
{
  RCTAssertMainThread();

  if (input.length && flags) {

    // Workaround around the first cmd not working: http://openradar.appspot.com/19613391
    // You can register just the cmd key and do nothing. This ensures that
    // command-key modified commands will work first time.

    [self registerKeyCommandWithInput:@""
                        modifierFlags:flags
                               action:nil];
  }

  UIKeyCommand *command = [UIKeyCommand keyCommandWithInput:input
                                              modifierFlags:flags
                                                     action:@selector(RCT_handleKeyCommand:)];

  [_commands addObject:[[RCTKeyCommand alloc] initWithKeyCommand:command block:block]];
}

- (BOOL)RCT_handleKeyCommand:(UIKeyCommand *)key
{
  for (RCTKeyCommand *command in [RCTKeyCommands sharedInstance].commands) {
    if ([command.keyCommand.input isEqualToString:key.input] &&
        command.keyCommand.modifierFlags == key.modifierFlags) {
      command.block(key);
      return YES;
    }
  }
  return NO;
}

- (void)unregisterKeyCommandWithInput:(NSString *)input
                        modifierFlags:(UIKeyModifierFlags)flags
{
  RCTAssertMainThread();

  for (RCTKeyCommand *command in _commands.allObjects) {
    if ([command matchesInput:input flags:flags]) {
      [_commands removeObject:command];
      break;
    }
  }
}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input
                         modifierFlags:(UIKeyModifierFlags)flags
{
  RCTAssertMainThread();

  for (RCTKeyCommand *command in _commands) {
    if ([command matchesInput:input flags:flags]) {
      return YES;
    }
  }
  return NO;
}

@end
