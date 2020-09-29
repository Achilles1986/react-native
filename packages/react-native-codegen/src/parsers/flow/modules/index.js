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

import type {
  NativeModulePropertySchema,
  NativeModuleMethodParamSchema,
  NativeModuleAliasMap,
  NativeModuleSchema,
  NativeModuleFunctionTypeAnnotation,
} from '../../../CodegenSchema.js';

import type {TypeDeclarationMap} from '../utils.js';
const {resolveTypeAnnotation} = require('../utils.js');
const {
  FlowGenericNotTypeParameterizedParserError,
  FlowGenericTypeParameterCountMismatchParserError,
  UnrecognizedFlowTypeAnnotationParserError,
  UnrecognizedFlowGenericParserError,
  UnnamedFunctionTypeAnnotationParamError,
} = require('./errors.js');
const invariant = require('invariant');

import type {NativeModuleTypeAnnotation} from '../../../CodegenSchema.js';

function translateTypeAnnotation(
  moduleName: string,
  /**
   * TODO(T71778680): Flow-type this node.
   */
  flowTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: NativeModuleAliasMap,
): NativeModuleTypeAnnotation {
  const {nullable, typeAnnotation} = resolveTypeAnnotation(
    flowTypeAnnotation,
    types,
  );

  switch (typeAnnotation.type) {
    case 'GenericTypeAnnotation': {
      switch (typeAnnotation.id.name) {
        case 'RootTag':
          return {
            nullable,
            type: 'ReservedFunctionValueTypeAnnotation',
            name: 'RootTag',
          };
        case 'Promise': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            moduleName,
            typeAnnotation,
          );
          return {
            nullable,
            type: 'GenericPromiseTypeAnnotation',
          };
        }
        case 'Array':
        case '$ReadOnlyArray': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            moduleName,
            typeAnnotation,
          );

          try {
            /**
             * TODO(T72031674): Migrate all our NativeModule specs to not use
             * invalid Array ElementTypes. Then, make the elementType a required
             * parameter.
             */
            const elementType = translateTypeAnnotation(
              moduleName,
              typeAnnotation.typeParameters.params[0],
              types,
              aliasMap,
            );

            invariant(
              elementType.type !== 'VoidTypeAnnotation',
              `${typeAnnotation.id.name} element type cannot be 'void'.`,
            );
            invariant(
              elementType.type !== 'GenericPromiseTypeAnnotation',
              `${typeAnnotation.id.name} element type cannot be 'Promise'.`,
            );

            invariant(
              elementType.type !== 'FunctionTypeAnnotation',
              `${typeAnnotation.id.name} element type cannot be a function.`,
            );

            return {
              nullable,
              type: 'ArrayTypeAnnotation',
              elementType: elementType,
            };
          } catch (ex) {
            return {
              nullable,
              type: 'ArrayTypeAnnotation',
            };
          }
        }
        case '$ReadOnly': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            moduleName,
            typeAnnotation,
          );
          return translateTypeAnnotation(
            moduleName,
            typeAnnotation.typeParameters.params[0],
            types,
            aliasMap,
          );
        }
        case 'Stringish': {
          return {
            nullable,
            type: 'StringTypeAnnotation',
          };
        }
        case 'Int32': {
          return {
            nullable,
            type: 'Int32TypeAnnotation',
          };
        }
        case 'Double': {
          return {
            nullable,
            type: 'DoubleTypeAnnotation',
          };
        }
        case 'Float': {
          return {
            nullable,
            type: 'FloatTypeAnnotation',
          };
        }
        case 'Object': {
          return {
            nullable,
            type: 'GenericObjectTypeAnnotation',
          };
        }
        default: {
          throw new UnrecognizedFlowGenericParserError(
            moduleName,
            typeAnnotation.id.name,
          );
        }
      }
    }
    case 'ObjectTypeAnnotation': {
      const objectTypeAnnotation = {
        nullable,
        type: 'ObjectTypeAnnotation',
        properties: typeAnnotation.properties.map(property => {
          const {optional} = property;
          return {
            name: property.key.name,
            optional,
            typeAnnotation: translateTypeAnnotation(
              moduleName,
              property.value,
              types,
              aliasMap,
            ),
          };
        }),
      };

      if (flowTypeAnnotation.type === 'GenericTypeAnnotation') {
        aliasMap[flowTypeAnnotation.id.name] = objectTypeAnnotation;
        return {
          nullable: false,
          type: 'TypeAliasTypeAnnotation',
          name: flowTypeAnnotation.id.name,
        };
      }

      if (
        flowTypeAnnotation.type === 'NullableTypeAnnotation' &&
        flowTypeAnnotation.typeAnnotation.type === 'GenericTypeAnnotation'
      ) {
        aliasMap[
          flowTypeAnnotation.typeAnnotation.id.name
        ] = objectTypeAnnotation;
        return {
          nullable: true,
          type: 'TypeAliasTypeAnnotation',
          name: flowTypeAnnotation.typeAnnotation.id.name,
        };
      }

      return objectTypeAnnotation;
    }
    case 'BooleanTypeAnnotation': {
      return {
        nullable,
        type: 'BooleanTypeAnnotation',
      };
    }
    case 'NumberTypeAnnotation': {
      return {
        nullable,
        type: 'NumberTypeAnnotation',
      };
    }
    case 'VoidTypeAnnotation': {
      return {
        nullable,
        type: 'VoidTypeAnnotation',
      };
    }
    case 'StringTypeAnnotation': {
      return {
        nullable,
        type: 'StringTypeAnnotation',
      };
    }
    case 'FunctionTypeAnnotation': {
      return translateFunctionTypeAnnotation(
        moduleName,
        typeAnnotation,
        types,
        nullable,
        aliasMap,
      );
    }
    default: {
      throw new UnrecognizedFlowTypeAnnotationParserError(
        moduleName,
        typeAnnotation.type,
      );
    }
  }
}

function assertGenericTypeAnnotationHasExactlyOneTypeParameter(
  moduleName: string,
  /**
   * TODO(T71778680): This is a GenericTypeAnnotation. Flow type this node
   */
  typeAnnotation: $FlowFixMe,
) {
  if (typeAnnotation.typeParameters == null) {
    throw new FlowGenericNotTypeParameterizedParserError(
      moduleName,
      typeAnnotation.id.name,
    );
  }

  invariant(
    typeAnnotation.typeParameters.type === 'TypeParameterInstantiation',
    "assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type 'TypeParameterInstantiation'",
  );

  if (typeAnnotation.typeParameters.params.length !== 1) {
    throw new FlowGenericTypeParameterCountMismatchParserError(
      moduleName,
      typeAnnotation.id.name,
      (typeAnnotation.typeParameters.params.length: number),
      1,
    );
  }
}

function translateFunctionTypeAnnotation(
  moduleName: string,
  // TODO(T71778680): This is a FunctionTypeAnnotation. Type this.
  flowFunctionTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  nullable: boolean,
  aliasMap: NativeModuleAliasMap,
): NativeModuleFunctionTypeAnnotation {
  const params: Array<NativeModuleMethodParamSchema> = [];
  for (const flowParam of (flowFunctionTypeAnnotation.params: $ReadOnlyArray<$FlowFixMe>)) {
    if (flowParam.name == null) {
      throw new UnnamedFunctionTypeAnnotationParamError(moduleName);
    }

    const paramName = flowParam.name.name;
    const paramTypeAnnotation = translateTypeAnnotation(
      moduleName,
      flowParam.typeAnnotation,
      types,
      aliasMap,
    );

    invariant(
      paramTypeAnnotation.type !== 'VoidTypeAnnotation',
      `Parameter ${paramName} cannot have type 'void'.`,
    );

    invariant(
      paramTypeAnnotation.type !== 'GenericPromiseTypeAnnotation',
      `Parameter ${paramName} cannot have type 'Promise'.`,
    );

    params.push({
      name: flowParam.name.name,
      optional: flowParam.optional,
      typeAnnotation: paramTypeAnnotation,
    });
  }

  const returnTypeAnnotation = translateTypeAnnotation(
    moduleName,
    flowFunctionTypeAnnotation.returnType,
    types,
    aliasMap,
  );

  invariant(
    returnTypeAnnotation.type !== 'FunctionTypeAnnotation',
    "Return cannot have type 'Promise'.",
  );

  return {
    type: 'FunctionTypeAnnotation',
    returnTypeAnnotation,
    params,
    nullable,
  };
}

function buildPropertySchema(
  moduleName: string,
  // TODO(T71778680): This is an ObjectTypeProperty containing either:
  // - a FunctionTypeAnnotation or GenericTypeAnnotation
  // - a NullableTypeAnnoation containing a FunctionTypeAnnotation or GenericTypeAnnotation
  // Flow type this node
  property: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: NativeModuleAliasMap,
): NativeModulePropertySchema {
  let nullable = false;
  let {key, value} = property;

  const methodName: string = key.name;

  ({nullable, typeAnnotation: value} = resolveTypeAnnotation(value, types));

  if (value.type !== 'FunctionTypeAnnotation') {
    throw new Error(
      `Only methods are supported as module properties. Found ${value.type} in ${property.key.name}`,
    );
  }

  return {
    name: methodName,
    optional: property.optional,
    typeAnnotation: translateFunctionTypeAnnotation(
      moduleName,
      value,
      types,
      nullable,
      aliasMap,
    ),
  };
}

function buildModuleSchema(
  moduleName: string,
  types: TypeDeclarationMap,
): NativeModuleSchema {
  const moduleInterfaceNames = (Object.keys(
    types,
  ): $ReadOnlyArray<string>).filter((typeName: string) => {
    const declaration = types[typeName];
    return (
      declaration.type === 'InterfaceDeclaration' &&
      declaration.extends.length === 1 &&
      declaration.extends[0].type === 'InterfaceExtends' &&
      declaration.extends[0].id.name === 'TurboModule'
    );
  });

  invariant(
    moduleInterfaceNames.length === 1,
    'There must be exactly one module declaration per file.',
  );

  const [moduleInterfaceName] = moduleInterfaceNames;

  const declaration = types[moduleInterfaceName];
  return (declaration.body.properties: $ReadOnlyArray<$FlowFixMe>)
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(property => {
      const aliasMap: NativeModuleAliasMap = {};
      return {
        aliasMap: aliasMap,
        propertySchema: buildPropertySchema(
          moduleName,
          property,
          types,
          aliasMap,
        ),
      };
    })
    .reduce(
      (moduleSchema: NativeModuleSchema, {aliasMap, propertySchema}) => {
        return {
          aliases: {...moduleSchema.aliases, ...aliasMap},
          properties: [...moduleSchema.properties, propertySchema],
        };
      },
      {aliases: {}, properties: []},
    );
}

module.exports = {
  buildModuleSchema,
};
