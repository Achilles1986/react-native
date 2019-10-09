package com.facebook.yoga;

public abstract class YogaNodeFactory {
  public static YogaNode create() {
    return new YogaNodeJNIFinalizer();
  }

  public static YogaNode create(boolean useVanillaJNI) {
    return new YogaNodeJNIFinalizer(useVanillaJNI);
  }

  public static YogaNode create(YogaConfig config) {
    return new YogaNodeJNIFinalizer(config);
  }
}
