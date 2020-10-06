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
  SchemaType,
  NativeModulePropertySchema,
  NativeModuleMethodParamSchema,
} from '../../CodegenSchema';

import type {AliasResolver} from './Utils';
const {createAliasResolver, getModules} = require('./Utils');
const {unwrapNullable} = require('../../parsers/flow/modules/utils');

type FilesOutput = Map<string, string>;

const propertyHeaderTemplate =
  'static jsi::Value __hostFunction_Native::_MODULE_NAME_::CxxSpecJSI_::_PROPERTY_NAME_::(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {';

const propertyCastTemplate =
  'static_cast<Native::_MODULE_NAME_::CxxSpecJSI *>(&turboModule)->::_PROPERTY_NAME_::(rt::_ARGS_::);';

const nonvoidPropertyTemplate = `${propertyHeaderTemplate}
  return ${propertyCastTemplate}
}`.trim();

const voidPropertyTemplate = `${propertyHeaderTemplate}
  ${propertyCastTemplate}
  return jsi::Value::undefined();
}`;

const proprertyDefTemplate =
  '  methodMap_["::_PROPERTY_NAME_::"] = MethodMetadata {::_ARGS_COUNT_::, __hostFunction_Native::_MODULE_NAME_::CxxSpecJSI_::_PROPERTY_NAME_::};';

const moduleTemplate = `::_MODULE_PROPERTIES_::

Native::_MODULE_NAME_::CxxSpecJSI::Native::_MODULE_NAME_::CxxSpecJSI(std::shared_ptr<CallInvoker> jsInvoker)
  : TurboModule("::_MODULE_NAME_::", jsInvoker) {
::_PROPERTIES_MAP_::
}`.trim();

const template = `/**
 * ${'C'}opyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${'@'}generated by codegen project: GenerateModuleH.js
 */

#include <react/modules/::_LIBRARY_NAME_::/NativeModules.h>

namespace facebook {
namespace react {

::_MODULES_::


} // namespace react
} // namespace facebook
`;

function traverseArg(
  arg: NativeModuleMethodParamSchema,
  index: number,
  resolveAlias: AliasResolver,
): string {
  function wrap(suffix) {
    return `args[${index}]${suffix}`;
  }
  const {typeAnnotation: nullableTypeAnnotation} = arg;
  const [typeAnnotation] = unwrapNullable(nullableTypeAnnotation);

  let realTypeAnnotation = typeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedFunctionValueTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return wrap('.getNumber()');
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(
            `Unknown prop type for "${arg.name}, found: ${realTypeAnnotation.name}"`,
          );
      }
    case 'StringTypeAnnotation':
      return wrap('.getString(rt)');
    case 'BooleanTypeAnnotation':
      return wrap('.getBool()');
    case 'NumberTypeAnnotation':
      return wrap('.getNumber()');
    case 'FloatTypeAnnotation':
      return wrap('.getNumber()');
    case 'DoubleTypeAnnotation':
      return wrap('.getNumber()');
    case 'Int32TypeAnnotation':
      return wrap('.getNumber()');
    case 'ArrayTypeAnnotation':
      return wrap('.getObject(rt).getArray(rt)');
    case 'FunctionTypeAnnotation':
      return `std::move(${wrap('.getObject(rt).getFunction(rt)')})`;
    case 'GenericObjectTypeAnnotation':
      return wrap('.getObject(rt)');
    case 'ObjectTypeAnnotation':
      return wrap('.getObject(rt)');
    default:
      (realTypeAnnotation.type: empty);
      throw new Error(
        `Unknown prop type for "${arg.name}, found: ${realTypeAnnotation.type}"`,
      );
  }
}

function traverseProperty(
  property: NativeModulePropertySchema,
  resolveAlias: AliasResolver,
): string {
  const [propertyTypeAnnotation] = unwrapNullable(property.typeAnnotation);
  const propertyTemplate =
    propertyTypeAnnotation.returnTypeAnnotation.type === 'VoidTypeAnnotation'
      ? voidPropertyTemplate
      : nonvoidPropertyTemplate;
  const traversedArgs = propertyTypeAnnotation.params
    .map((p, i) => traverseArg(p, i, resolveAlias))
    .join(', ');
  return propertyTemplate
    .replace(/::_PROPERTY_NAME_::/g, property.name)
    .replace(/::_ARGS_::/g, traversedArgs === '' ? '' : ', ' + traversedArgs);
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
  ): FilesOutput {
    const nativeModules = getModules(schema);

    const modules = Object.keys(nativeModules)
      .map(name => {
        const {aliases, properties} = nativeModules[name];
        const resolveAlias = createAliasResolver(aliases);
        const traversedProperties = properties
          .map(property => traverseProperty(property, resolveAlias))
          .join('\n');
        return moduleTemplate
          .replace(/::_MODULE_PROPERTIES_::/g, traversedProperties)
          .replace(
            '::_PROPERTIES_MAP_::',
            properties
              .map(
                ({
                  name: propertyName,
                  typeAnnotation: nullableTypeAnnotation,
                }) => {
                  const [{params}] = unwrapNullable(nullableTypeAnnotation);
                  return proprertyDefTemplate
                    .replace(/::_PROPERTY_NAME_::/g, propertyName)
                    .replace(/::_ARGS_COUNT_::/g, params.length.toString());
                },
              )
              .join('\n'),
          )
          .replace(/::_MODULE_NAME_::/g, name);
      })
      .join('\n');

    const fileName = 'NativeModules.cpp';
    const replacedTemplate = template
      .replace(/::_MODULES_::/g, modules)
      .replace(/::_LIBRARY_NAME_::/g, libraryName);
    return new Map([[fileName, replacedTemplate]]);
  },
};
