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

import type {
  NamedShape,
  CommandTypeAnnotation,
  ComponentShape,
  PropTypeAnnotation,
  SchemaType,
} from '../../CodegenSchema';
const {
  getImports,
  toSafeJavaString,
  getInterfaceJavaClassName,
} = require('./JavaHelpers');

// File path -> contents
type FilesOutput = Map<string, string>;

const template = `/**
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*
* ${'@'}generated by codegen project: GeneratePropsJavaInterface.js
*/

package ::_PACKAGE_NAME_::;

::_IMPORTS_::

public interface ::_CLASSNAME_::<T extends ::_EXTEND_CLASSES_::> {
  ::_METHODS_::
}
`;

function addNullable(imports) {
  imports.add('import androidx.annotation.Nullable;');
}

function getJavaValueForProp(
  prop: NamedShape<PropTypeAnnotation>,
  imports,
): string {
  const typeAnnotation = prop.typeAnnotation;

  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
      if (typeAnnotation.default === null) {
        addNullable(imports);
        return '@Nullable Boolean value';
      } else {
        return 'boolean value';
      }
    case 'StringTypeAnnotation':
      addNullable(imports);
      return '@Nullable String value';
    case 'Int32TypeAnnotation':
      return 'int value';
    case 'DoubleTypeAnnotation':
      return 'double value';
    case 'FloatTypeAnnotation':
      if (typeAnnotation.default === null) {
        addNullable(imports);
        return '@Nullable Float value';
      } else {
        return 'float value';
      }
    case 'ReservedPropTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          addNullable(imports);
          return '@Nullable Integer value';
        case 'ImageSourcePrimitive':
          addNullable(imports);
          return '@Nullable ReadableMap value';
        case 'PointPrimitive':
          addNullable(imports);
          return '@Nullable ReadableMap value';
        case 'EdgeInsetsPrimitive':
          addNullable(imports);
          return '@Nullable ReadableMap value';
        default:
          (typeAnnotation.name: empty);
          throw new Error('Received unknown ReservedPropTypeAnnotation');
      }
    case 'ArrayTypeAnnotation': {
      addNullable(imports);
      return '@Nullable ReadableArray value';
    }
    case 'ObjectTypeAnnotation': {
      addNullable(imports);
      return '@Nullable ReadableMap value';
    }
    case 'StringEnumTypeAnnotation':
      addNullable(imports);
      return '@Nullable String value';
    case 'Int32EnumTypeAnnotation':
      addNullable(imports);
      return '@Nullable Integer value';
    default:
      (typeAnnotation: empty);
      throw new Error('Received invalid typeAnnotation');
  }
}

function generatePropsString(component: ComponentShape, imports) {
  if (component.props.length === 0) {
    return '// No props';
  }

  return component.props
    .map(prop => {
      return `void set${toSafeJavaString(
        prop.name,
      )}(T view, ${getJavaValueForProp(prop, imports)});`;
    })
    .join('\n' + '  ');
}

function getCommandArgJavaType(param) {
  const {typeAnnotation} = param;

  switch (typeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return 'double';
        default:
          (typeAnnotation.name: empty);
          throw new Error(`Receieved invalid type: ${typeAnnotation.name}`);
      }
    case 'BooleanTypeAnnotation':
      return 'boolean';
    case 'DoubleTypeAnnotation':
      return 'double';
    case 'FloatTypeAnnotation':
      return 'float';
    case 'Int32TypeAnnotation':
      return 'int';
    case 'StringTypeAnnotation':
      return 'String';
    default:
      (typeAnnotation.type: empty);
      throw new Error('Receieved invalid typeAnnotation');
  }
}

function getCommandArguments(
  command: NamedShape<CommandTypeAnnotation>,
  componentName: string,
): string {
  return [
    'T view',
    ...command.typeAnnotation.params.map(param => {
      const commandArgJavaType = getCommandArgJavaType(param);

      return `${commandArgJavaType} ${param.name}`;
    }),
  ].join(', ');
}

function generateCommandsString(
  component: ComponentShape,
  componentName: string,
) {
  return component.commands
    .map(command => {
      const safeJavaName = toSafeJavaString(command.name, false);

      return `void ${safeJavaName}(${getCommandArguments(
        command,
        componentName,
      )});`;
    })
    .join('\n' + '  ');
}

function getClassExtendString(component): string {
  const extendString = component.extendsProps
    .map(extendProps => {
      switch (extendProps.type) {
        case 'ReactNativeBuiltInType':
          switch (extendProps.knownTypeName) {
            case 'ReactNativeCoreViewProps':
              return 'View';
            default:
              (extendProps.knownTypeName: empty);
              throw new Error('Invalid knownTypeName');
          }
        default:
          (extendProps.type: empty);
          throw new Error('Invalid extended type');
      }
    })
    .join('');

  return extendString;
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
    packageName?: string,
  ): FilesOutput {
    // TODO: This doesn't support custom package name yet.
    const normalizedPackageName = 'com.facebook.react.viewmanagers';
    const outputDir = `java/${normalizedPackageName.replace(/\./g, '/')}`;

    const files = new Map();
    Object.keys(schema.modules).forEach(moduleName => {
      const module = schema.modules[moduleName];
      if (module.type !== 'Component') {
        return;
      }

      const {components} = module;

      // No components in this module
      if (components == null) {
        return;
      }

      return Object.keys(components)
        .filter(componentName => {
          const component = components[componentName];
          return !(
            component.excludedPlatforms &&
            component.excludedPlatforms.includes('android')
          );
        })
        .forEach(componentName => {
          const component = components[componentName];
          const className = getInterfaceJavaClassName(componentName);

          const imports = getImports(component, 'interface');
          const propsString = generatePropsString(component, imports);
          const commandsString = generateCommandsString(
            component,
            componentName,
          );
          const extendString = getClassExtendString(component);

          const replacedTemplate = template
            .replace(
              /::_IMPORTS_::/g,
              Array.from(imports)
                .sort()
                .join('\n'),
            )
            .replace(/::_PACKAGE_NAME_::/g, normalizedPackageName)
            .replace(/::_CLASSNAME_::/g, className)
            .replace('::_EXTEND_CLASSES_::', extendString)
            .replace(
              '::_METHODS_::',
              [propsString, commandsString].join('\n' + '  ').trimRight(),
            )
            .replace('::_COMMAND_HANDLERS_::', commandsString);

          files.set(`${outputDir}/${className}.java`, replacedTemplate);
        });
    });

    return files;
  },
};
