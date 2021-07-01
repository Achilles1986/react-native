/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const React = require('react');
const {Platform} = require('react-native');
const RNTesterBlock = require('./RNTesterBlock');
const RNTesterExampleFilter = require('./RNTesterExampleFilter');

const invariant = require('invariant');
import ExamplePage from './ExamplePage';
import type {
  RNTesterModule,
  RNTesterModuleExample,
} from '../types/RNTesterTypes';

type Props = {
  module: RNTesterModule,
  example?: ?RNTesterModuleExample,
  onExampleCardPress: (exampleName: string) => mixed,
};

function getExampleTitle(title, platform) {
  return platform != null ? `${title} (${platform} only)` : title;
}

export default function RNTesterModuleContainer(props: Props): React.Node {
  const {module, example} = props;
  const renderExample = (e, i) => {
    // Filter platform-specific es
    const {description, platform} = e;
    let {title} = e;
    if (platform != null && Platform.OS !== platform) {
      return null;
    }
    return (
      <RNTesterBlock
        key={i}
        title={getExampleTitle(title, platform)}
        description={description}>
        {e.render()}
      </RNTesterBlock>
    );
  };

  if (module.simpleExampleContainer) {
    invariant(
      module.examples.length === 1,
      'If noExampleContainer is specified, only one example is allowed',
    );
    return (
      <ExamplePage
        title={module.title}
        description={module.description}
        android={!module.platform || module.platform === 'android'}
        ios={!module.platform || module.platform === 'ios'}
        documentationURL={module.documentationURL}
        category={module.category}>
        {module.examples[0].render()}
      </ExamplePage>
    );
  }

  if (module.examples.length === 1) {
    return (
      <ExamplePage
        title={module.testTitle || module.title}
        description={module.description}
        android={!module.platform || module.platform === 'android'}
        ios={!module.platform || module.platform === 'ios'}
        documentationURL={module.documentationURL}
        category={module.category}>
        {module.examples[0].render()}
      </ExamplePage>
    );
  }

  const filter = ({example: e, filterRegex}) => filterRegex.test(e.title);

  const sections = [
    {
      data: module.examples,
      title: 'EXAMPLES',
      key: 'e',
    },
  ];

  return (
    <ExamplePage
      title={module.title}
      description={module.description}
      android={!module.platform || module.platform === 'android'}
      ios={!module.platform || module.platform === 'ios'}
      documentationURL={module.documentationURL}
      category={module.category}>
      {module.showIndividualExamples === true && example != null ? (
        <RNTesterBlock
          key={example.name}
          title={getExampleTitle(example.title, example.platform)}
          description={example.description}>
          {example.render()}
        </RNTesterBlock>
      ) : (
        <RNTesterExampleFilter
          testID="example_search"
          page="examples_page"
          hideFilterPills={true}
          sections={sections}
          filter={filter}
          render={({filteredSections}) =>
            filteredSections[0].data.map(renderExample)
          }
        />
      )}
    </ExamplePage>
  );
}
