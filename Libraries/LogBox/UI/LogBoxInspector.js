/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import LogBoxInspectorCodeFrame from './LogBoxInspectorCodeFrame';
import * as React from 'react';
import ScrollView from '../../Components/ScrollView/ScrollView';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Modal from '../../Modal/Modal';
import * as LogBoxData from '../Data/LogBoxData';
import Keyboard from '../../Components/Keyboard/Keyboard';
import LogBoxInspectorFooter from './LogBoxInspectorFooter';
import LogBoxInspectorMessageHeader from './LogBoxInspectorMessageHeader';
import LogBoxInspectorReactFrames from './LogBoxInspectorReactFrames';
import LogBoxInspectorStackFrames from './LogBoxInspectorStackFrames';
import LogBoxInspectorHeader from './LogBoxInspectorHeader';
import * as LogBoxStyle from './LogBoxStyle';

import type LogBoxLog, {LogLevel} from '../Data/LogBoxLog';

type Props = $ReadOnly<{|
  onDismiss: () => void,
  onChangeSelectedIndex: (index: number) => void,
  onMinimize: () => void,
  logs: $ReadOnlyArray<LogBoxLog>,
  selectedIndex: number,
  fatalType?: ?LogLevel,
|}>;

function LogBoxInspector(props: Props): React.Node {
  const {logs, selectedIndex} = props;

  const log = logs[selectedIndex];
  React.useEffect(() => {
    LogBoxData.symbolicateLogNow(log);
  }, [log]);

  React.useEffect(() => {
    // Optimistically symbolicate the last and next logs.
    if (logs.length > 1) {
      const selected = selectedIndex;
      const lastIndex = logs.length - 1;
      const prevIndex = selected - 1 < 0 ? lastIndex : selected - 1;
      const nextIndex = selected + 1 > lastIndex ? 0 : selected + 1;
      LogBoxData.symbolicateLogLazy(logs[prevIndex]);
      LogBoxData.symbolicateLogLazy(logs[nextIndex]);
    }
  }, [logs, selectedIndex]);

  React.useEffect(() => {
    Keyboard.dismiss();
  }, []);

  function _handleRetry() {
    LogBoxData.retrySymbolicateLogNow(log);
  }

  if (log == null) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      visible
      statusBarTranslucent
      supportedOrientations={['portrait']}
      presentationStyle="overFullScreen">
      <LogBoxInspectorHeader
        onSelectIndex={props.onChangeSelectedIndex}
        selectedIndex={selectedIndex}
        total={logs.length}
        level={log.level}
      />
      <LogBoxInspectorBody log={log} onRetry={_handleRetry} />
      <LogBoxInspectorFooter
        onDismiss={props.onDismiss}
        onMinimize={props.onMinimize}
        level={log.level}
      />
    </Modal>
  );
}

const headerTitleMap = {
  warn: 'Warning',
  error: 'Error',
  fatal: 'Exception',
  syntax: 'Syntax Error',
  component: 'Component Exception',
};

function LogBoxInspectorBody(props) {
  const [collapsed, setCollapsed] = React.useState(true);

  React.useEffect(() => {
    setCollapsed(true);
  }, [props.log]);

  const headerTitle =
    headerTitleMap[props.log.isComponentError ? 'component' : props.log.level];

  if (collapsed) {
    return (
      <>
        <LogBoxInspectorMessageHeader
          collapsed={collapsed}
          onPress={() => setCollapsed(!collapsed)}
          message={props.log.message}
          level={props.log.level}
          title={headerTitle}
        />
        <ScrollView style={styles.scrollBody}>
          <LogBoxInspectorCodeFrame codeFrame={props.log.codeFrame} />
          <LogBoxInspectorReactFrames log={props.log} />
          <LogBoxInspectorStackFrames log={props.log} onRetry={props.onRetry} />
        </ScrollView>
      </>
    );
  }
  return (
    <ScrollView style={styles.scrollBody}>
      <LogBoxInspectorMessageHeader
        collapsed={collapsed}
        onPress={() => setCollapsed(!collapsed)}
        message={props.log.message}
        level={props.log.level}
        title={headerTitle}
      />
      <LogBoxInspectorCodeFrame codeFrame={props.log.codeFrame} />
      <LogBoxInspectorReactFrames log={props.log} />
      <LogBoxInspectorStackFrames log={props.log} onRetry={props.onRetry} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollBody: {
    backgroundColor: LogBoxStyle.getBackgroundColor(0.9),
    flex: 1,
  },
});

export default LogBoxInspector;
