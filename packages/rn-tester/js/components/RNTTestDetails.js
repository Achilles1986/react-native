/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {View, Text, StyleSheet, Button} from 'react-native';
import {type RNTesterTheme} from './RNTesterTheme';

function RNTTestDetails({
  test,
  description,
  expect,
  title,
  theme,
}: {
  test?: string,
  description?: string,
  expect?: string,
  title: string,
  theme: RNTesterTheme,
}): React.Node {
  const [collapsed, setCollapsed] = React.useState(false);

  const content =
    test != null ? (
      <>
        <View style={styles.section}>
          <Text style={styles.heading}>How to Test</Text>
          <Text style={styles.paragraph}>{test}</Text>
        </View>
        {expect != null && (
          <View style={styles.section}>
            <Text style={styles.heading}>Expectation</Text>
            <Text style={styles.paragraph}>{expect}</Text>
          </View>
        )}
      </>
    ) : description != null ? (
      <View style={styles.section}>
        <Text style={styles.heading}>Description</Text>
        <Text style={styles.paragraph}>{description}</Text>
      </View>
    ) : null;

  return (
    <View
      style={StyleSheet.compose(styles.container, {
        borderColor: theme.SeparatorColor,
      })}>
      <View style={styles.titleRow}>
        <Text
          numberOfLines={1}
          style={StyleSheet.compose(styles.title, {color: theme.LabelColor})}>
          {title}
        </Text>
        {content != null && (
          <Button
            title={collapsed ? 'Expand' : 'Collapse'}
            onPress={() => setCollapsed(!collapsed)}
            color={theme.LinkColor}
          />
        )}
      </View>
      {!collapsed ? content : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  heading: {
    fontSize: 16,
    color: 'grey',
    fontWeight: '500',
  },
  paragraph: {
    fontSize: 14,
  },
  section: {
    marginVertical: 4,
  },
  title: {
    fontSize: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default RNTTestDetails;
