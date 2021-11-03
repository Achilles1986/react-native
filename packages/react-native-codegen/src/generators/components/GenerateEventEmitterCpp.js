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

const {generateEventStructName} = require('./CppHelpers.js');

import type {
  ComponentShape,
  NamedShape,
  EventTypeAnnotation,
  SchemaType,
} from '../../CodegenSchema';

// File path -> contents
type FilesOutput = Map<string, string>;

type ComponentCollection = $ReadOnly<{
  [component: string]: ComponentShape,
  ...
}>;

const FileTemplate = ({
  events,
  libraryName,
}: {
  events: string,
  libraryName: string,
}) => `
/**
 * ${'C'}opyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${'@'}generated by codegen project: GenerateEventEmitterCpp.js
 */

#include <react/renderer/components/${libraryName}/EventEmitters.h>

namespace facebook {
namespace react {

${events}

} // namespace react
} // namespace facebook
`;

const ComponentTemplate = ({
  className,
  eventName,
  structName,
  dispatchEventName,
  implementation,
}: {
  className: string,
  eventName: string,
  structName: string,
  dispatchEventName: string,
  implementation: string,
}) =>
  `
void ${className}EventEmitter::${eventName}(${structName} event) const {
  dispatchEvent("${dispatchEventName}", [event=std::move(event)](jsi::Runtime &runtime) {
    ${implementation}
  });
}
`.trim();

const BasicComponentTemplate = ({
  className,
  eventName,
  dispatchEventName,
}: {
  className: string,
  eventName: string,
  dispatchEventName: string,
}) =>
  `
void ${className}EventEmitter::${eventName}() const {
  dispatchEvent("${dispatchEventName}");
}
`.trim();

function generateSetter(variableName, propertyName, propertyParts) {
  const trailingPeriod = propertyParts.length === 0 ? '' : '.';
  const eventChain = `event.${propertyParts.join(
    '.',
  )}${trailingPeriod}${propertyName});`;

  return `${variableName}.setProperty(runtime, "${propertyName}", ${eventChain}`;
}

function generateEnumSetter(variableName, propertyName, propertyParts) {
  const trailingPeriod = propertyParts.length === 0 ? '' : '.';
  const eventChain = `event.${propertyParts.join(
    '.',
  )}${trailingPeriod}${propertyName})`;

  return `${variableName}.setProperty(runtime, "${propertyName}", toString(${eventChain});`;
}

function generateSetters(
  parentPropertyName: string,
  properties: $ReadOnlyArray<NamedShape<EventTypeAnnotation>>,
  propertyParts: $ReadOnlyArray<string>,
): string {
  const propSetters = properties
    .map(eventProperty => {
      const {typeAnnotation} = eventProperty;
      switch (typeAnnotation.type) {
        case 'BooleanTypeAnnotation':
          return generateSetter(
            parentPropertyName,
            eventProperty.name,
            propertyParts,
          );
        case 'StringTypeAnnotation':
          return generateSetter(
            parentPropertyName,
            eventProperty.name,
            propertyParts,
          );
        case 'Int32TypeAnnotation':
          return generateSetter(
            parentPropertyName,
            eventProperty.name,
            propertyParts,
          );
        case 'DoubleTypeAnnotation':
          return generateSetter(
            parentPropertyName,
            eventProperty.name,
            propertyParts,
          );
        case 'FloatTypeAnnotation':
          return generateSetter(
            parentPropertyName,
            eventProperty.name,
            propertyParts,
          );
        case 'StringEnumTypeAnnotation':
          return generateEnumSetter(
            parentPropertyName,
            eventProperty.name,
            propertyParts,
          );
        case 'ObjectTypeAnnotation':
          const propertyName = eventProperty.name;
          return `
            {
              auto ${propertyName} = jsi::Object(runtime);
              ${generateSetters(
                propertyName,
                typeAnnotation.properties,
                propertyParts.concat([propertyName]),
              )}

              ${parentPropertyName}.setProperty(runtime, "${propertyName}", ${propertyName});
            }
          `.trim();
        default:
          (typeAnnotation.type: empty);
          throw new Error('Received invalid event property type');
      }
    })
    .join('\n');

  return propSetters;
}

function generateEvent(componentName: string, event): string {
  // This is a gross hack necessary because native code is sending
  // events named things like topChange to JS which is then converted back to
  // call the onChange prop. We should be consistent throughout the system.
  // In order to migrate to this new system we have to support the current
  // naming scheme. We should delete this once we are able to control this name
  // throughout the system.
  const dispatchEventName = `${event.name[2].toLowerCase()}${event.name.slice(
    3,
  )}`;

  if (event.typeAnnotation.argument) {
    const implementation = `
    auto payload = jsi::Object(runtime);
    ${generateSetters('payload', event.typeAnnotation.argument.properties, [])}
    return payload;
  `.trim();

    if (!event.name.startsWith('on')) {
      throw new Error('Expected the event name to start with `on`');
    }

    return ComponentTemplate({
      className: componentName,
      eventName: event.name,
      dispatchEventName,
      structName: generateEventStructName([event.name]),
      implementation,
    });
  }

  return BasicComponentTemplate({
    className: componentName,
    eventName: event.name,
    dispatchEventName,
  });
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
    assumeNonnull: boolean = false,
  ): FilesOutput {
    const moduleComponents: ComponentCollection = Object.keys(schema.modules)
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

        return components;
      })
      .filter(Boolean)
      .reduce((acc, components) => Object.assign(acc, components), {});

    const fileName = 'EventEmitters.cpp';

    const componentEmitters = Object.keys(moduleComponents)
      .map(componentName => {
        const component = moduleComponents[componentName];

        return component.events
          .map(event => {
            return generateEvent(componentName, event);
          })
          .join('\n');
      })
      .join('\n');

    const replacedTemplate = FileTemplate({
      libraryName,
      events: componentEmitters,
    });

    return new Map([[fileName, replacedTemplate]]);
  },
};
