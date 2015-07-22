/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextField.h"

#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"
#import "UIView+React.h"

@implementation RCTTextField
{
  RCTEventDispatcher *_eventDispatcher;
  NSMutableArray *_reactSubviews;
  BOOL _jsRequestingFirstResponder;
  NSInteger _nativeEventCount;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {
    RCTAssert(eventDispatcher, @"eventDispatcher is a required parameter");
    _eventDispatcher = eventDispatcher;
    [self addTarget:self action:@selector(_textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [self addTarget:self action:@selector(_textFieldBeginEditing) forControlEvents:UIControlEventEditingDidBegin];
    [self addTarget:self action:@selector(_textFieldEndEditing) forControlEvents:UIControlEventEditingDidEnd];
    [self addTarget:self action:@selector(_textFieldSubmitEditing) forControlEvents:UIControlEventEditingDidEndOnExit];
    _reactSubviews = [[NSMutableArray alloc] init];
    self.delegate = self;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(-initWithCoder:(NSCoder *)aDecoder)

- (BOOL)textField:(UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  if (_maxLength == nil || [string isEqualToString:@"\n"]) {  // Make sure forms can be submitted via return
    return YES;
  }
  NSUInteger allowedLength = _maxLength.integerValue - textField.text.length + range.length;
  if (string.length > allowedLength) {
    if (string.length > 1) {
      // Truncate the input string so the result is exactly maxLength
      NSString *limitedString = [string substringToIndex:allowedLength];
      NSMutableString *newString = textField.text.mutableCopy;
      [newString replaceCharactersInRange:range withString:limitedString];
      textField.text = newString;
      // Collapse selection at end of insert to match normal paste behavior
      UITextPosition *insertEnd = [textField positionFromPosition:textField.beginningOfDocument
                                                          offset:(range.location + allowedLength)];
      textField.selectedTextRange = [textField textRangeFromPosition:insertEnd toPosition:insertEnd];
      [self _textFieldDidChange];
    }
    return NO;
  } else {
    return YES;
  }
}

- (void)setText:(NSString *)text
{
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![text isEqualToString:self.text]) {
    UITextRange *selection = self.selectedTextRange;
    [super setText:text];
    self.selectedTextRange = selection; // maintain cursor position/selection - this is robust to out of bounds
  } else if (eventLag > RCTTextUpdateLagWarningThreshold) {
    RCTLogWarn(@"Native TextInput(%@) is %ld events ahead of JS - try to make your JS faster.", self.text, (long)eventLag);
  }
}

static void RCTUpdatePlaceholder(RCTTextField *self)
{
  if (self.placeholder.length > 0 && self.placeholderTextColor) {
    self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder
                                                                 attributes:@{
                                                                              NSForegroundColorAttributeName : self.placeholderTextColor
                                                                              }];
  } else if (self.placeholder.length) {
    self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder];
  }
}

- (void)setPlaceholderTextColor:(UIColor *)placeholderTextColor
{
  _placeholderTextColor = placeholderTextColor;
  RCTUpdatePlaceholder(self);
}

- (void)setPlaceholder:(NSString *)placeholder
{
  super.placeholder = placeholder;
  RCTUpdatePlaceholder(self);
}

- (NSArray *)reactSubviews
{
  // TODO: do we support subviews of textfield in React?
  // In any case, we should have a better approach than manually
  // maintaining array in each view subclass like this
  return _reactSubviews;
}

- (void)removeReactSubview:(UIView *)subview
{
  // TODO: this is a bit broken - if the TextField inserts any of
  // its own views below or between React's, the indices won't match
  [_reactSubviews removeObject:subview];
  [subview removeFromSuperview];
}

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  // TODO: this is a bit broken - if the TextField inserts any of
  // its own views below or between React's, the indices won't match
  [_reactSubviews insertObject:view atIndex:atIndex];
  [super insertSubview:view atIndex:atIndex];
}

- (CGRect)caretRectForPosition:(UITextPosition *)position
{
  if (_caretHidden) {
    return CGRectZero;
  }
  return [super caretRectForPosition:position];
}

- (CGRect)textRectForBounds:(CGRect)bounds
{
  CGRect rect = [super textRectForBounds:bounds];
  return UIEdgeInsetsInsetRect(rect, _contentInset);
}

- (CGRect)editingRectForBounds:(CGRect)bounds
{
  return [self textRectForBounds:bounds];
}

- (void)setAutoCorrect:(BOOL)autoCorrect
{
  self.autocorrectionType = (autoCorrect ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo);
}

- (BOOL)autoCorrect
{
  return self.autocorrectionType == UITextAutocorrectionTypeYes;
}

- (void)_textFieldDidChange
{
  _nativeEventCount++;
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeChange
                                 reactTag:self.reactTag
                                     text:self.text
                               eventCount:_nativeEventCount];
}

- (void)_textFieldEndEditing
{
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeEnd
                                 reactTag:self.reactTag
                                     text:self.text
                               eventCount:_nativeEventCount];
}
- (void)_textFieldSubmitEditing
{
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeSubmit
                                 reactTag:self.reactTag
                                     text:self.text
                               eventCount:_nativeEventCount];
}

- (void)_textFieldBeginEditing
{
  if (_selectTextOnFocus) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self selectAll:nil];
    });
  }
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeFocus
                                 reactTag:self.reactTag
                                     text:self.text
                               eventCount:_nativeEventCount];
}

- (BOOL)becomeFirstResponder
{
  _jsRequestingFirstResponder = YES;
  BOOL result = [super becomeFirstResponder];
  _jsRequestingFirstResponder = NO;
  return result;
}

- (BOOL)resignFirstResponder
{
  BOOL result = [super resignFirstResponder];
  if (result)
  {
    [_eventDispatcher sendTextEventWithType:RCTTextEventTypeBlur
                                   reactTag:self.reactTag
                                       text:self.text
                                 eventCount:_nativeEventCount];
  }
  return result;
}

- (BOOL)canBecomeFirstResponder
{
  return _jsRequestingFirstResponder;
}

@end
