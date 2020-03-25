/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {ComponentShape, SchemaType} from '../../CodegenSchema';
const {convertDefaultTypeToString, getImports} = require('./CppHelpers');

// File path -> contents
type FilesOutput = Map<string, string>;

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/::_LIBRARY_::/Props.h>
::_IMPORTS_::

namespace facebook {
namespace react {

::_COMPONENT_CLASSES_::

} // namespace react
} // namespace facebook
`;

const componentTemplate = `
::_CLASSNAME_::::::_CLASSNAME_::(
    const ::_CLASSNAME_:: &sourceProps,
    const RawProps &rawProps):::_EXTEND_CLASSES_::

    ::_PROPS_::
      {}
`.trim();

function generatePropsString(componentName: string, component: ComponentShape) {
  return component.props
    .map((prop) => {
      const defaultValue = convertDefaultTypeToString(componentName, prop);
      return `${prop.name}(convertRawProp(rawProps, "${prop.name}", sourceProps.${prop.name}, {${defaultValue}}))`;
    })
    .join(',\n' + '    ');
}

function getClassExtendString(component): string {
  const extendString =
    ' ' +
    component.extendsProps
      .map((extendProps) => {
        switch (extendProps.type) {
          case 'ReactNativeBuiltInType':
            switch (extendProps.knownTypeName) {
              case 'ReactNativeCoreViewProps':
                return 'ViewProps(sourceProps, rawProps)';
              default:
                (extendProps.knownTypeName: empty);
                throw new Error('Invalid knownTypeName');
            }
          default:
            (extendProps.type: empty);
            throw new Error('Invalid extended type');
        }
      })
      .join(', ') +
    `${component.props.length > 0 ? ',' : ''}`;

  return extendString;
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
  ): FilesOutput {
    const fileName = 'Props.cpp';
    const allImports: Set<string> = new Set([
      '#include <react/core/propsConversions.h>',
    ]);

    const componentProps = Object.keys(schema.modules)
      .map((moduleName) => {
        const components = schema.modules[moduleName].components;
        // No components in this module
        if (components == null) {
          return null;
        }

        return Object.keys(components)
          .filter((componentName) => {
            const component = components[componentName];
            return component.excludedPlatform !== 'iOS';
          })
          .map((componentName) => {
            const component = components[componentName];
            const newName = `${componentName}Props`;

            const propsString = generatePropsString(componentName, component);
            const extendString = getClassExtendString(component);

            const imports = getImports(component.props);
            imports.forEach(allImports.add, allImports);

            const replacedTemplate = componentTemplate
              .replace(/::_CLASSNAME_::/g, newName)
              .replace('::_EXTEND_CLASSES_::', extendString)
              .replace('::_PROPS_::', propsString);

            return replacedTemplate;
          })
          .join('\n');
      })
      .filter(Boolean)
      .join('\n');

    const replacedTemplate = template
      .replace(/::_COMPONENT_CLASSES_::/g, componentProps)
      .replace('::_LIBRARY_::', libraryName)
      .replace(
        '::_IMPORTS_::',

        Array.from(allImports).sort().join('\n').trim(),
      );

    return new Map([[fileName, replacedTemplate]]);
  },
};
