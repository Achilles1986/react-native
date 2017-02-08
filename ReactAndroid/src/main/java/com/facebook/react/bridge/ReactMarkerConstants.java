// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

/**
 * Constants used by ReactMarker.
 */
public class ReactMarkerConstants {

  // TODO convert to ints so we don't have to do String compares
  public static final String CREATE_REACT_CONTEXT_START = "CREATE_REACT_CONTEXT_START";
  public static final String CREATE_REACT_CONTEXT_END = "CREATE_REACT_CONTEXT_END";
  public static final String PROCESS_PACKAGES_START = "PROCESS_PACKAGES_START";
  public static final String PROCESS_PACKAGES_END = "PROCESS_PACKAGES_END";
  public static final String BUILD_NATIVE_MODULE_REGISTRY_START =
      "BUILD_NATIVE_MODULE_REGISTRY_START";
  public static final String BUILD_NATIVE_MODULE_REGISTRY_END =
      "BUILD_NATIVE_MODULE_REGISTRY_END";
  public static final String BUILD_JS_MODULE_CONFIG_START = "BUILD_JS_MODULE_CONFIG_START";
  public static final String BUILD_JS_MODULE_CONFIG_END = "BUILD_JS_MODULE_CONFIG_END";
  public static final String CREATE_CATALYST_INSTANCE_START = "CREATE_CATALYST_INSTANCE_START";
  public static final String CREATE_CATALYST_INSTANCE_END = "CREATE_CATALYST_INSTANCE_END";
  public static final String RUN_JS_BUNDLE_START = "RUN_JS_BUNDLE_START";
  public static final String RUN_JS_BUNDLE_END = "RUN_JS_BUNDLE_END";
  public static final String NATIVE_MODULE_INITIALIZE_START = "NativeModule_start";
  public static final String NATIVE_MODULE_INITIALIZE_END = "NativeModule_end";
  public static final String SETUP_REACT_CONTEXT_START = "SETUP_REACT_CONTEXT_START";
  public static final String SETUP_REACT_CONTEXT_END = "SETUP_REACT_CONTEXT_END";
  public static final String CREATE_UI_MANAGER_MODULE_START = "CREATE_UI_MANAGER_MODULE_START";
  public static final String CREATE_UI_MANAGER_MODULE_END = "CREATE_UI_MANAGER_MODULE_END";
  public static final String CREATE_VIEW_MANAGERS_START = "CREATE_VIEW_MANAGERS_START";
  public static final String CREATE_VIEW_MANAGERS_END = "CREATE_VIEW_MANAGERS_END";
  public static final String CREATE_UI_MANAGER_MODULE_CONSTANTS_START =
    "CREATE_UI_MANAGER_MODULE_CONSTANTS_START";
  public static final String CREATE_UI_MANAGER_MODULE_CONSTANTS_END =
    "CREATE_UI_MANAGER_MODULE_CONSTANTS_END";
  public static final String CREATE_MODULE_START = "CREATE_MODULE_START";
  public static final String CREATE_MODULE_END = "CREATE_MODULE_END";
  public static final String PROCESS_CORE_REACT_PACKAGE_START = "PROCESS_CORE_REACT_PACKAGE_START";
  public static final String PROCESS_CORE_REACT_PACKAGE_END = "PROCESS_CORE_REACT_PACKAGE_END";
  public static final String CORE_REACT_PACKAGE_GET_REACT_MODULE_INFO_PROVIDER_START =
    "CORE_REACT_PACKAGE_GET_REACT_MODULE_INFO_PROVIDER_START";
  public static final String CORE_REACT_PACKAGE_GET_REACT_MODULE_INFO_PROVIDER_END =
    "CORE_REACT_PACKAGE_GET_REACT_MODULE_INFO_PROVIDER_END";
  public static final String UI_MANAGER_MODULE_CONSTANTS_CONVERT_START =
    "UI_MANAGER_MODULE_CONSTANTS_CONVERT_START";
  public static final String UI_MANAGER_MODULE_CONSTANTS_CONVERT_END =
    "UI_MANAGER_MODULE_CONSTANTS_CONVERT_END";
  public static final String CREATE_I18N_MODULE_CONSTANTS_START =
    "CREATE_I18N_MODULE_CONSTANTS_START";
  public static final String CREATE_I18N_MODULE_CONSTANTS_END =
    "CREATE_I18N_MODULE_CONSTANTS_END";
  public static final String I18N_MODULE_CONSTANTS_CONVERT_START =
    "I18N_MODULE_CONSTANTS_CONVERT_START";
  public static final String I18N_MODULE_CONSTANTS_CONVERT_END =
    "I18N_MODULE_CONSTANTS_CONVERT_END";
  public static final String CREATE_I18N_ASSETS_MODULE_START =
    "CREATE_I18N_ASSETS_MODULE_START";
  public static final String CREATE_I18N_ASSETS_MODULE_END =
    "CREATE_I18N_ASSETS_MODULE_END";
}
