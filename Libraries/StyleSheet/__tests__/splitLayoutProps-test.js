/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const splitLayoutProps = require('../splitLayoutProps');

test('splits style objects', () => {
  const style = {width: 10, margin: 20, padding: 30};
  const {outer, inner} = splitLayoutProps(style);
  expect(outer).toMatchInlineSnapshot(`
    Object {
      "margin": 20,
      "width": 10,
    }
  `);
  expect(inner).toMatchInlineSnapshot(`
    Object {
      "padding": 30,
    }
  `);
});

test('does not copy values to both returned objects', () => {
  const style = {marginVertical: 5, paddingHorizontal: 10};
  const {outer, inner} = splitLayoutProps(style);
  expect(outer).toMatchInlineSnapshot(`
    Object {
      "marginVertical": 5,
    }
  `);
  expect(inner).toMatchInlineSnapshot(`
    Object {
      "paddingHorizontal": 10,
    }
  `);
});
