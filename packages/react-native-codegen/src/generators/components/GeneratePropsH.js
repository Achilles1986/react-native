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

const {
  convertDefaultTypeToString,
  getCppTypeForAnnotation,
  getEnumMaskName,
  getEnumName,
  toSafeCppString,
  generateStructName,
  getImports,
  toIntEnumValueName,
} = require('./CppHelpers.js');

import type {
  ExtendsPropsShape,
  PropTypeShape,
  SchemaType,
} from '../../CodegenSchema';

// File path -> contents
type FilesOutput = Map<string, string>;
type StructsMap = Map<string, string>;

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

::_IMPORTS_::

namespace facebook {
namespace react {

::_COMPONENT_CLASSES_::

} // namespace react
} // namespace facebook
`;

const classTemplate = `
::_ENUMS_::
::_STRUCTS_::
class ::_CLASSNAME_:: final::_EXTEND_CLASSES_:: {
 public:
  ::_CLASSNAME_::() = default;
  ::_CLASSNAME_::(const ::_CLASSNAME_:: &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  ::_PROPS_::
};
`.trim();

const enumTemplate = `
enum class ::_ENUM_NAME_:: { ::_VALUES_:: };

static inline void fromRawValue(const RawValue &value, ::_ENUM_NAME_:: &result) {
  auto string = (std::string)value;
  ::_FROM_CASES_::
  abort();
}

static inline std::string toString(const ::_ENUM_NAME_:: &value) {
  switch (value) {
    ::_TO_CASES_::
  }
}
`.trim();

const intEnumTemplate = `
enum class ::_ENUM_NAME_:: { ::_VALUES_:: };

static inline void fromRawValue(const RawValue &value, ::_ENUM_NAME_:: &result) {
  assert(value.hasType<int>());
  auto integerValue = (int)value;
  switch (integerValue) {::_FROM_CASES_::
  }
  abort();
}

static inline std::string toString(const ::_ENUM_NAME_:: &value) {
  switch (value) {
    ::_TO_CASES_::
  }
}
`.trim();

const structTemplate = `struct ::_STRUCT_NAME_:: {
  ::_FIELDS_::
};

static inline void fromRawValue(const RawValue &value, ::_STRUCT_NAME_:: &result) {
  auto map = (better::map<std::string, RawValue>)value;

  ::_FROM_CASES_::
}

static inline std::string toString(const ::_STRUCT_NAME_:: &value) {
  return "[Object ::_STRUCT_NAME_::]";
}
`.trim();

const arrayConversionFunction = `static inline void fromRawValue(const RawValue &value, std::vector<::_STRUCT_NAME_::> &result) {
  auto items = (std::vector<RawValue>)value;
  for (const auto &item : items) {
    ::_STRUCT_NAME_:: newItem;
    fromRawValue(item, newItem);
    result.emplace_back(newItem);
  }
}
`;

const doubleArrayConversionFunction = `static inline void fromRawValue(const RawValue &value, std::vector<std::vector<::_STRUCT_NAME_::>> &result) {
  auto items = (std::vector<std::vector<RawValue>>)value;
  for (const std::vector<RawValue> &item : items) {
    auto nestedArray = std::vector<::_STRUCT_NAME_::>{};
    for (const RawValue &nestedItem : item) {
      ::_STRUCT_NAME_:: newItem;
      fromRawValue(nestedItem, newItem);
      nestedArray.emplace_back(newItem);
    }
    result.emplace_back(nestedArray);
  }
}
`;

const arrayEnumTemplate = `
using ::_ENUM_MASK_:: = uint32_t;

enum class ::_ENUM_NAME_::: ::_ENUM_MASK_:: {
  ::_VALUES_::
};

constexpr bool operator&(
  ::_ENUM_MASK_:: const lhs,
  enum ::_ENUM_NAME_:: const rhs) {
  return lhs & static_cast<::_ENUM_MASK_::>(rhs);
}

constexpr ::_ENUM_MASK_:: operator|(
  ::_ENUM_MASK_:: const lhs,
  enum ::_ENUM_NAME_:: const rhs) {
  return lhs | static_cast<::_ENUM_MASK_::>(rhs);
}

constexpr void operator|=(
  ::_ENUM_MASK_:: &lhs,
  enum ::_ENUM_NAME_:: const rhs) {
  lhs = lhs | static_cast<::_ENUM_MASK_::>(rhs);
}

static inline void fromRawValue(const RawValue &value, ::_ENUM_MASK_:: &result) {
  auto items = std::vector<std::string>{value};
  for (const auto &item : items) {
    ::_FROM_CASES_::
    abort();
  }
}

static inline std::string toString(const ::_ENUM_MASK_:: &value) {
    auto result = std::string{};
    auto separator = std::string{", "};

    ::_TO_CASES_::
    if (!result.empty()) {
      result.erase(result.length() - separator.length());
    }
    return result;
}
`.trim();

function getClassExtendString(component): string {
  const extendString =
    ' : ' +
    component.extendsProps
      .map(extendProps => {
        switch (extendProps.type) {
          case 'ReactNativeBuiltInType':
            switch (extendProps.knownTypeName) {
              case 'ReactNativeCoreViewProps':
                return 'public ViewProps';
              default:
                (extendProps.knownTypeName: empty);
                throw new Error('Invalid knownTypeName');
            }
          default:
            (extendProps.type: empty);
            throw new Error('Invalid extended type');
        }
      })
      .join(' ');

  return extendString;
}

function getNativeTypeFromAnnotation(
  componentName: string,
  prop,
  nameParts: $ReadOnlyArray<string>,
): string {
  const typeAnnotation = prop.typeAnnotation;

  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'DoubleTypeAnnotation':
    case 'FloatTypeAnnotation':
      return getCppTypeForAnnotation(typeAnnotation.type);
    case 'NativePrimitiveTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          return 'SharedColor';
        case 'ImageSourcePrimitive':
          return 'ImageSource';
        case 'PointPrimitive':
          return 'Point';
        case 'EdgeInsetsPrimitive':
          return 'EdgeInsets';
        default:
          (typeAnnotation.name: empty);
          throw new Error('Received unknown NativePrimitiveTypeAnnotation');
      }
    case 'ArrayTypeAnnotation': {
      const arrayType = typeAnnotation.elementType.type;
      if (arrayType === 'ArrayTypeAnnotation') {
        return `std::vector<${getNativeTypeFromAnnotation(
          componentName,
          {typeAnnotation: typeAnnotation.elementType, name: ''},
          nameParts.concat([prop.name]),
        )}>`;
      }
      if (arrayType === 'ObjectTypeAnnotation') {
        const structName = generateStructName(
          componentName,
          nameParts.concat([prop.name]),
        );
        return `std::vector<${structName}>`;
      }
      if (arrayType === 'StringEnumTypeAnnotation') {
        const enumName = getEnumName(componentName, prop.name);
        return getEnumMaskName(enumName);
      }
      const itemAnnotation = getNativeTypeFromAnnotation(
        componentName,
        {
          typeAnnotation: typeAnnotation.elementType,
          name: componentName,
        },
        nameParts.concat([prop.name]),
      );
      return `std::vector<${itemAnnotation}>`;
    }
    case 'ObjectTypeAnnotation': {
      return generateStructName(componentName, nameParts.concat([prop.name]));
    }
    case 'StringEnumTypeAnnotation':
      return getEnumName(componentName, prop.name);
    case 'Int32EnumTypeAnnotation':
      return getEnumName(componentName, prop.name);
    default:
      (typeAnnotation: empty);
      throw new Error(
        `Received invalid typeAnnotation for ${componentName} prop ${prop.name}, received ${typeAnnotation.type}`,
      );
  }
}

function convertValueToEnumOption(value: string): string {
  return toSafeCppString(value);
}

function generateArrayEnumString(
  componentName: string,
  name: string,
  enumOptions,
): string {
  const options = enumOptions.map(option => option.name);
  const enumName = getEnumName(componentName, name);

  const values = options
    .map((option, index) => `${toSafeCppString(option)} = 1 << ${index}`)
    .join(',\n  ');

  const fromCases = options
    .map(
      option =>
        `if (item == "${option}") {
      result |= ${enumName}::${toSafeCppString(option)};
      continue;
    }`,
    )
    .join('\n    ');

  const toCases = options
    .map(
      option =>
        `if (value & ${enumName}::${toSafeCppString(option)}) {
      result += "${option}" + separator;
    }`,
    )
    .join('\n' + '    ');

  return arrayEnumTemplate
    .replace(/::_ENUM_NAME_::/g, enumName)
    .replace(/::_ENUM_MASK_::/g, getEnumMaskName(enumName))
    .replace('::_VALUES_::', values)
    .replace('::_FROM_CASES_::', fromCases)
    .replace('::_TO_CASES_::', toCases);
}

function generateStringEnum(componentName, prop) {
  const typeAnnotation = prop.typeAnnotation;
  if (typeAnnotation.type === 'StringEnumTypeAnnotation') {
    const values: $ReadOnlyArray<string> = typeAnnotation.options.map(
      option => option.name,
    );
    const enumName = getEnumName(componentName, prop.name);

    const fromCases = values
      .map(
        value =>
          `if (string == "${value}") { result = ${enumName}::${convertValueToEnumOption(
            value,
          )}; return; }`,
      )
      .join('\n' + '  ');

    const toCases = values
      .map(
        value =>
          `case ${enumName}::${convertValueToEnumOption(
            value,
          )}: return "${value}";`,
      )
      .join('\n' + '    ');

    return enumTemplate
      .replace(/::_ENUM_NAME_::/g, enumName)
      .replace('::_VALUES_::', values.map(toSafeCppString).join(', '))
      .replace('::_FROM_CASES_::', fromCases)
      .replace('::_TO_CASES_::', toCases);
  }

  return '';
}

function generateIntEnum(componentName, prop) {
  const typeAnnotation = prop.typeAnnotation;
  if (typeAnnotation.type === 'Int32EnumTypeAnnotation') {
    const values: $ReadOnlyArray<number> = typeAnnotation.options.map(
      option => option.value,
    );
    const enumName = getEnumName(componentName, prop.name);

    const fromCases = values
      .map(
        value =>
          `
    case ${value}:
      result = ${enumName}::${toIntEnumValueName(prop.name, value)};
      return;`,
      )
      .join('');

    const toCases = values
      .map(
        value =>
          `case ${enumName}::${toIntEnumValueName(
            prop.name,
            value,
          )}: return "${value}";`,
      )
      .join('\n' + '    ');

    const valueVariables = values
      .map(val => `${toIntEnumValueName(prop.name, val)} = ${val}`)
      .join(', ');

    return intEnumTemplate
      .replace(/::_ENUM_NAME_::/g, enumName)
      .replace('::_VALUES_::', valueVariables)
      .replace('::_FROM_CASES_::', fromCases)
      .replace('::_TO_CASES_::', toCases);
  }

  return '';
}

function generateEnumString(componentName: string, component): string {
  return component.props
    .map(prop => {
      if (
        prop.typeAnnotation.type === 'ArrayTypeAnnotation' &&
        prop.typeAnnotation.elementType.type === 'StringEnumTypeAnnotation'
      ) {
        return generateArrayEnumString(
          componentName,
          prop.name,
          prop.typeAnnotation.elementType.options,
        );
      }

      if (prop.typeAnnotation.type === 'StringEnumTypeAnnotation') {
        return generateStringEnum(componentName, prop);
      }

      if (prop.typeAnnotation.type === 'Int32EnumTypeAnnotation') {
        return generateIntEnum(componentName, prop);
      }

      if (prop.typeAnnotation.type === 'ObjectTypeAnnotation') {
        return prop.typeAnnotation.properties
          .map(property => {
            if (property.typeAnnotation.type === 'StringEnumTypeAnnotation') {
              return generateStringEnum(componentName, property);
            } else if (
              property.typeAnnotation.type === 'Int32EnumTypeAnnotation'
            ) {
              return generateIntEnum(componentName, property);
            }
            return null;
          })
          .filter(Boolean)
          .join('\n');
      }
    })
    .filter(Boolean)
    .join('\n');
}

function generatePropsString(
  componentName: string,
  props: $ReadOnlyArray<PropTypeShape>,
) {
  return props
    .map(prop => {
      const nativeType = getNativeTypeFromAnnotation(componentName, prop, []);
      const defaultValue = convertDefaultTypeToString(componentName, prop);

      return `${nativeType} ${prop.name}{${defaultValue}};`;
    })
    .join('\n' + '  ');
}

function getExtendsImports(
  extendsProps: $ReadOnlyArray<ExtendsPropsShape>,
): Set<string> {
  const imports: Set<string> = new Set();

  extendsProps.forEach(extendProps => {
    switch (extendProps.type) {
      case 'ReactNativeBuiltInType':
        switch (extendProps.knownTypeName) {
          case 'ReactNativeCoreViewProps':
            imports.add('#include <react/components/view/ViewProps.h>');
            return;
          default:
            (extendProps.knownTypeName: empty);
            throw new Error('Invalid knownTypeName');
        }
      default:
        (extendProps.type: empty);
        throw new Error('Invalid extended type');
    }
  });

  return imports;
}

function getLocalImports(
  properties: $ReadOnlyArray<PropTypeShape>,
): Set<string> {
  const imports: Set<string> = new Set();

  function addImportsForNativeName(name) {
    switch (name) {
      case 'ColorPrimitive':
        imports.add('#include <react/graphics/Color.h>');
        return;
      case 'ImageSourcePrimitive':
        imports.add('#include <react/imagemanager/primitives.h>');
        return;
      case 'PointPrimitive':
        imports.add('#include <react/graphics/Geometry.h>');
        return;
      case 'EdgeInsetsPrimitive':
        imports.add('#include <react/graphics/Geometry.h>');
        return;
      default:
        (name: empty);
        throw new Error(
          `Invalid NativePrimitiveTypeAnnotation name, got ${name}`,
        );
    }
  }

  properties.forEach(prop => {
    const typeAnnotation = prop.typeAnnotation;

    if (typeAnnotation.type === 'NativePrimitiveTypeAnnotation') {
      addImportsForNativeName(typeAnnotation.name);
    }

    if (typeAnnotation.type === 'ArrayTypeAnnotation') {
      imports.add('#include <vector>');
      if (typeAnnotation.elementType.type === 'StringEnumTypeAnnotation') {
        imports.add('#include <cinttypes>');
      }
    }

    if (
      typeAnnotation.type === 'ArrayTypeAnnotation' &&
      typeAnnotation.elementType.type === 'NativePrimitiveTypeAnnotation'
    ) {
      addImportsForNativeName(typeAnnotation.elementType.name);
    }

    if (
      typeAnnotation.type === 'ArrayTypeAnnotation' &&
      typeAnnotation.elementType.type === 'ObjectTypeAnnotation'
    ) {
      const objectProps = typeAnnotation.elementType.properties;
      const objectImports = getImports(objectProps);
      const localImports = getLocalImports(objectProps);
      objectImports.forEach(imports.add, imports);
      localImports.forEach(imports.add, imports);
    }

    if (typeAnnotation.type === 'ObjectTypeAnnotation') {
      imports.add('#include <react/core/propsConversions.h>');
      const objectImports = getImports(typeAnnotation.properties);
      const localImports = getLocalImports(typeAnnotation.properties);
      objectImports.forEach(imports.add, imports);
      localImports.forEach(imports.add, imports);
    }
  });

  return imports;
}

function generateStructsForComponent(componentName: string, component): string {
  const structs = generateStructs(componentName, component.props, []);
  const structArray = Array.from(structs.values());
  if (structArray.length < 1) {
    return '';
  }
  return structArray.join('\n\n');
}

function generateStructs(
  componentName: string,
  properties,
  nameParts,
): StructsMap {
  const structs: StructsMap = new Map();
  properties.forEach(prop => {
    const typeAnnotation = prop.typeAnnotation;
    if (typeAnnotation.type === 'ObjectTypeAnnotation') {
      // Recursively visit all of the object properties.
      // Note: this is depth first so that the nested structs are ordered first.
      const elementProperties = typeAnnotation.properties;
      const nestedStructs = generateStructs(
        componentName,
        elementProperties,
        nameParts.concat([prop.name]),
      );
      nestedStructs.forEach(function(value, key) {
        structs.set(key, value);
      });

      generateStruct(
        structs,
        componentName,
        nameParts.concat([prop.name]),
        typeAnnotation.properties,
      );
    }

    if (
      prop.typeAnnotation.type === 'ArrayTypeAnnotation' &&
      prop.typeAnnotation.elementType.type === 'ObjectTypeAnnotation'
    ) {
      // Recursively visit all of the object properties.
      // Note: this is depth first so that the nested structs are ordered first.
      const elementProperties = prop.typeAnnotation.elementType.properties;
      const nestedStructs = generateStructs(
        componentName,
        elementProperties,
        nameParts.concat([prop.name]),
      );
      nestedStructs.forEach(function(value, key) {
        structs.set(key, value);
      });

      // Generate this struct and its conversion function.
      generateStruct(
        structs,
        componentName,
        nameParts.concat([prop.name]),
        elementProperties,
      );

      // Generate the conversion function for std:vector<Object>.
      // Note: This needs to be at the end since it references the struct above.
      structs.set(
        `${[componentName, ...nameParts.concat([prop.name])].join(
          '',
        )}ArrayStruct`,
        arrayConversionFunction.replace(
          /::_STRUCT_NAME_::/g,
          generateStructName(componentName, nameParts.concat([prop.name])),
        ),
      );
    }
    if (
      prop.typeAnnotation.type === 'ArrayTypeAnnotation' &&
      prop.typeAnnotation.elementType.type === 'ArrayTypeAnnotation' &&
      prop.typeAnnotation.elementType.elementType.type ===
        'ObjectTypeAnnotation'
    ) {
      // Recursively visit all of the object properties.
      // Note: this is depth first so that the nested structs are ordered first.
      const elementProperties =
        prop.typeAnnotation.elementType.elementType.properties;
      const nestedStructs = generateStructs(
        componentName,
        elementProperties,
        nameParts.concat([prop.name]),
      );
      nestedStructs.forEach(function(value, key) {
        structs.set(key, value);
      });

      // Generate this struct and its conversion function.
      generateStruct(
        structs,
        componentName,
        nameParts.concat([prop.name]),
        elementProperties,
      );

      // Generate the conversion function for std:vector<Object>.
      // Note: This needs to be at the end since it references the struct above.
      structs.set(
        `${[componentName, ...nameParts.concat([prop.name])].join(
          '',
        )}ArrayArrayStruct`,
        doubleArrayConversionFunction.replace(
          /::_STRUCT_NAME_::/g,
          generateStructName(componentName, nameParts.concat([prop.name])),
        ),
      );
    }
  });

  return structs;
}

function generateStruct(
  structs: StructsMap,
  componentName: string,
  nameParts: $ReadOnlyArray<string>,
  properties: $ReadOnlyArray<PropTypeShape>,
): void {
  const structNameParts = nameParts;
  const structName = generateStructName(componentName, structNameParts);

  const fields = properties
    .map(property => {
      return `${getNativeTypeFromAnnotation(
        componentName,
        property,
        structNameParts,
      )} ${property.name};`;
    })
    .join('\n' + '  ');

  properties.forEach((property: PropTypeShape) => {
    const name = property.name;
    switch (property.typeAnnotation.type) {
      case 'BooleanTypeAnnotation':
        return;
      case 'StringTypeAnnotation':
        return;
      case 'Int32TypeAnnotation':
        return;
      case 'DoubleTypeAnnotation':
        return;
      case 'FloatTypeAnnotation':
        return;
      case 'NativePrimitiveTypeAnnotation':
        return;
      case 'ArrayTypeAnnotation':
        return;
      case 'StringEnumTypeAnnotation':
        return;
      case 'Int32EnumTypeAnnotation':
        return;
      case 'DoubleTypeAnnotation':
        return;
      case 'ObjectTypeAnnotation':
        const props = property.typeAnnotation.properties;
        if (props == null) {
          throw new Error(
            `Properties are expected for ObjectTypeAnnotation (see ${name} in ${componentName})`,
          );
        }
        generateStruct(structs, componentName, nameParts.concat([name]), props);
        return;
      default:
        (property.typeAnnotation.type: empty);
        throw new Error(
          `Received invalid component property type ${property.typeAnnotation.type}`,
        );
    }
  });

  const fromCases = properties
    .map(property => {
      const variable = property.name;
      return `auto ${variable} = map.find("${property.name}");
  if (${variable} != map.end()) {
    fromRawValue(${variable}->second, result.${variable});
  }`;
    })
    .join('\n  ');

  structs.set(
    structName,
    structTemplate
      .replace(/::_STRUCT_NAME_::/g, structName)
      .replace('::_FIELDS_::', fields)
      .replace('::_FROM_CASES_::', fromCases),
  );
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
  ): FilesOutput {
    const fileName = 'Props.h';

    const allImports: Set<string> = new Set();

    const componentClasses = Object.keys(schema.modules)
      .map(moduleName => {
        const components = schema.modules[moduleName].components;
        // No components in this module
        if (components == null) {
          return null;
        }

        return Object.keys(components)
          .filter(componentName => {
            const component = components[componentName];
            return component.excludedPlatform !== 'iOS';
          })
          .map(componentName => {
            const component = components[componentName];

            const newName = `${componentName}Props`;
            const structString = generateStructsForComponent(
              componentName,
              component,
            );
            const enumString = generateEnumString(componentName, component);
            const propsString = generatePropsString(
              componentName,
              component.props,
            );
            const extendString = getClassExtendString(component);
            const extendsImports = getExtendsImports(component.extendsProps);
            const imports = getLocalImports(component.props);

            extendsImports.forEach(allImports.add, allImports);
            imports.forEach(allImports.add, allImports);

            const replacedTemplate = classTemplate
              .replace('::_ENUMS_::', enumString)
              .replace('::_STRUCTS_::', structString)
              .replace(/::_CLASSNAME_::/g, newName)
              .replace('::_EXTEND_CLASSES_::', extendString)
              .replace('::_PROPS_::', propsString)
              .trim();

            return replacedTemplate;
          })
          .join('\n\n');
      })
      .filter(Boolean)
      .join('\n\n');

    const replacedTemplate = template
      .replace(/::_COMPONENT_CLASSES_::/g, componentClasses)
      .replace(
        '::_IMPORTS_::',
        Array.from(allImports)
          .sort()
          .join('\n'),
      );

    return new Map([[fileName, replacedTemplate]]);
  },
};
