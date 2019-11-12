/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

('use strict');

import LogBoxLog from './LogBoxLog';
import {parseLogBoxException} from './parseLogBoxLog';
import type {LogLevel} from './LogBoxLog';
import type {Message, Category, ComponentStack} from './parseLogBoxLog';
import parseErrorStack from '../../Core/Devtools/parseErrorStack';
import type {ExceptionData} from '../../Core/NativeExceptionsManager';
import type {ExtendedError} from '../../Core/Devtools/parseErrorStack';

export type LogBoxLogs = Set<LogBoxLog>;
export type LogData = $ReadOnly<{|
  level: LogLevel,
  message: Message,
  category: Category,
  componentStack: ComponentStack,
|}>;

export type Observer = (
  $ReadOnly<{|
    logs: LogBoxLogs,
    isDisabled: boolean,
    selectedLogIndex: number,
  |}>,
) => void;

export type IgnorePattern = string | RegExp;

export type Subscription = $ReadOnly<{|
  unsubscribe: () => void,
|}>;

type WarningInfo = {|
  finalFormat: string,
  forceDialogImmediately: boolean,
  suppressDialog_LEGACY: boolean,
  suppressCompletely: boolean,
  monitorEvent: string | null,
  monitorListVersion: number,
  monitorSampleRate: number,
|};

type WarningFilter = (format: string) => WarningInfo;

const observers: Set<{observer: Observer}> = new Set();
const ignorePatterns: Set<IgnorePattern> = new Set();
let logs: LogBoxLogs = new Set();
let updateTimeout = null;
let _isDisabled = false;
let _selectedIndex = -1;

let warningFilter: WarningFilter = function(format) {
  return {
    finalFormat: format,
    forceDialogImmediately: false,
    suppressDialog_LEGACY: false,
    suppressCompletely: false,
    monitorEvent: 'unknown',
    monitorListVersion: 0,
    monitorSampleRate: 1,
  };
};

const LOGBOX_ERROR_MESSAGE =
  'An error was thrown when attempting to render log messages via LogBox.';

function getNextState() {
  const logArray = Array.from(logs);
  let index = logArray.length - 1;
  while (index >= 0) {
    // The latest syntax error is selected and displayed before all other logs.
    if (logArray[index].level === 'syntax') {
      return {
        logs,
        isDisabled: _isDisabled,
        selectedLogIndex: index,
      };
    }
    index -= 1;
  }

  return {
    logs,
    isDisabled: _isDisabled,
    selectedLogIndex: _selectedIndex,
  };
}

export function reportLogBoxError(
  error: ExtendedError,
  componentStack?: string,
): void {
  const ExceptionsManager = require('../../Core/ExceptionsManager');

  error.forceRedbox = true;
  error.message = `${LOGBOX_ERROR_MESSAGE}\n\n${error.message}`;
  if (componentStack != null) {
    error.componentStack = componentStack;
  }
  ExceptionsManager.handleException(error, /* isFatal */ true);
}

export function isLogBoxErrorMessage(message: string): boolean {
  return typeof message === 'string' && message.includes(LOGBOX_ERROR_MESSAGE);
}

export function isMessageIgnored(message: string): boolean {
  for (const pattern of ignorePatterns) {
    if (
      (pattern instanceof RegExp && pattern.test(message)) ||
      (typeof pattern === 'string' && message.includes(pattern))
    ) {
      return true;
    }
  }
  return false;
}

function handleUpdate(): void {
  if (updateTimeout == null) {
    updateTimeout = setImmediate(() => {
      updateTimeout = null;
      const nextState = getNextState();
      observers.forEach(({observer}) => observer(nextState));
    });
  }
}

function appendNewLog(newLog) {
  // We don't want to store these logs because they trigger a
  // state update whenever we add them to the store, which is
  // expensive to noisy logs. If we later want to display these
  // we will store them in a different state object.
  if (isMessageIgnored(newLog.message.content)) {
    return;
  }

  // If the next log has the same category as the previous one
  // then we want to roll it up into the last log in the list
  // by incrementing the count (simar to how Chrome does it).
  const lastLog = Array.from(logs).pop();
  if (lastLog && lastLog.category === newLog.category) {
    lastLog.incrementCount();
    handleUpdate();
    return;
  }

  if (newLog.level === 'fatal') {
    // If possible, to avoid jank, we don't want to open the error before
    // it's symbolicated. To do that, we optimistically wait for
    // sybolication for up to a second before adding the log.
    const OPTIMISTIC_WAIT_TIME = 1000;

    let addPendingLog = () => {
      logs.add(newLog);
      if (_selectedIndex <= 0) {
        _selectedIndex = logs.size - 1;
      }
      handleUpdate();
      addPendingLog = null;
    };

    const optimisticTimeout = setTimeout(() => {
      if (addPendingLog) {
        addPendingLog();
      }
    }, OPTIMISTIC_WAIT_TIME);

    newLog.symbolicate(status => {
      if (addPendingLog && status !== 'PENDING') {
        addPendingLog();
        clearTimeout(optimisticTimeout);
      }
    });
  } else {
    logs.add(newLog);
    handleUpdate();
  }
}

export function addLog(log: LogData): void {
  const errorForStackTrace = new Error();

  // Parsing logs are expensive so we schedule this
  // otherwise spammy logs would pause rendering.
  setImmediate(() => {
    try {
      // TODO: Use Error.captureStackTrace on Hermes
      const stack = parseErrorStack(errorForStackTrace);

      appendNewLog(
        new LogBoxLog(
          log.level,
          log.message,
          stack,
          log.category,
          log.componentStack,
        ),
      );
    } catch (error) {
      reportLogBoxError(error);
    }
  });
}

export function addException(error: ExceptionData): void {
  // Parsing logs are expensive so we schedule this
  // otherwise spammy logs would pause rendering.
  setImmediate(() => {
    try {
      const {
        category,
        message,
        codeFrame,
        componentStack,
        stack,
        level,
      } = parseLogBoxException(error);

      appendNewLog(
        new LogBoxLog(
          level,
          message,
          stack,
          category,
          componentStack != null ? componentStack : [],
          codeFrame,
        ),
      );
    } catch (loggingError) {
      reportLogBoxError(loggingError);
    }
  });
}

export function symbolicateLogNow(log: LogBoxLog) {
  log.symbolicate(() => {
    handleUpdate();
  });
}
export function retrySymbolicateLogNow(log: LogBoxLog) {
  log.retrySymbolicate(() => {
    handleUpdate();
  });
}

export function symbolicateLogLazy(log: LogBoxLog) {
  log.symbolicate();
}

export function clear(): void {
  const newLogs = Array.from(logs).filter(log => log.level === 'syntax');
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
    handleUpdate();
  }
}

export function setSelectedLog(index: number): void {
  _selectedIndex = index;
  handleUpdate();
}

export function clearWarnings(): void {
  const newLogs = Array.from(logs).filter(log => log.level !== 'warn');
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
    handleUpdate();
  }
}

export function clearErrors(): void {
  const newLogs = Array.from(logs).filter(
    log => log.level !== 'error' && log.level !== 'fatal',
  );
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
    handleUpdate();
  }
}

export function clearSyntaxErrors(): void {
  const newLogs = Array.from(logs).filter(log => log.level !== 'syntax');
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
    handleUpdate();
  }
}

export function dismiss(log: LogBoxLog): void {
  if (logs.has(log)) {
    logs.delete(log);
    handleUpdate();
  }
}

export function setWarningFilter(filter: WarningFilter): void {
  warningFilter = filter;
}

export function checkWarningFilter(format: string): WarningInfo {
  return warningFilter(format);
}

export function addIgnorePatterns(
  patterns: $ReadOnlyArray<IgnorePattern>,
): void {
  // The same pattern may be added multiple times, but adding a new pattern
  // can be expensive so let's find only the ones that are new.
  const newPatterns = patterns.filter((pattern: IgnorePattern) => {
    if (pattern instanceof RegExp) {
      for (const existingPattern of ignorePatterns.entries()) {
        if (
          existingPattern instanceof RegExp &&
          existingPattern.toString() === pattern.toString()
        ) {
          return false;
        }
      }
      return true;
    }
    return !ignorePatterns.has(pattern);
  });

  if (newPatterns.length === 0) {
    return;
  }
  for (const pattern of newPatterns) {
    ignorePatterns.add(pattern);

    // We need to recheck all of the existing logs.
    // This allows adding an ignore pattern anywhere in the codebase.
    // Without this, if you ignore a pattern after the a log is created,
    // then we would keep showing the log.
    logs = new Set(
      Array.from(logs).filter(log => !isMessageIgnored(log.message.content)),
    );
  }
  handleUpdate();
}

export function setDisabled(value: boolean): void {
  if (value === _isDisabled) {
    return;
  }
  _isDisabled = value;
  handleUpdate();
}

export function isDisabled(): boolean {
  return _isDisabled;
}

export function observe(observer: Observer): Subscription {
  const subscription = {observer};
  observers.add(subscription);

  observer(getNextState());

  return {
    unsubscribe(): void {
      observers.delete(subscription);
    },
  };
}
