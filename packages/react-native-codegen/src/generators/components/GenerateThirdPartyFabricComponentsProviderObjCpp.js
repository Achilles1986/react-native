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

import type {SchemaType} from '../../CodegenSchema';

// File path -> contents
type FilesOutput = Map<string, string>;

const FileTemplate = ({lookupMap}: {lookupMap: string}) => `
/**
 * ${'C'}opyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${'@'}generated by GenerateRCTThirdPartyFabricComponentsProviderCpp
 */

// OSS-compatibility layer

#import "RCTThirdPartyFabricComponentsProvider.h"

#import <string>
#import <unordered_map>

Class<RCTComponentViewProtocol> RCTThirdPartyFabricComponentsProvider(const char *name) {
  static std::unordered_map<std::string, Class (*)(void)> sFabricComponentsClassMap = {
${lookupMap}
  };

  auto p = sFabricComponentsClassMap.find(name);
  if (p != sFabricComponentsClassMap.end()) {
    auto classFunc = p->second;
    return classFunc();
  }
  return nil;
}
`;

const LookupMapTemplate = ({
  className,
  libraryName,
}: {
  className: string,
  libraryName: string,
}) => `
    {"${className}", ${className}Cls}, // ${libraryName}`;

module.exports = {
  generate(schemas: {[string]: SchemaType}): FilesOutput {
    const fileName = 'RCTThirdPartyFabricComponentsProvider.mm';

    const lookupMap = Object.keys(schemas)
      .map(libraryName => {
        const schema = schemas[libraryName];
        return Object.keys(schema.modules)
          .map(moduleName => {
            const module = schema.modules[moduleName];
            if (module.type !== 'Component') {
              return;
            }

            const {components} = module;
            // No components in this module
            if (components == null) {
              return null;
            }

            return Object.keys(components)
              .filter(componentName => {
                const component = components[componentName];
                return !(
                  component.excludedPlatforms &&
                  component.excludedPlatforms.includes('iOS')
                );
              })
              .map(componentName => {
                if (components[componentName].interfaceOnly === true) {
                  return;
                }
                const replacedTemplate = LookupMapTemplate({
                  className: componentName,
                  libraryName,
                });

                return replacedTemplate;
              });
          })
          .filter(Boolean);
      })
      .join('\n');

    const replacedTemplate = FileTemplate({lookupMap});

    return new Map([[fileName, replacedTemplate]]);
  },
};
