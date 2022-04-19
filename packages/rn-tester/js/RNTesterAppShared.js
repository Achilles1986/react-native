/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import {
  BackHandler,
  StyleSheet,
  useColorScheme,
  View,
  LogBox,
} from 'react-native';
import * as React from 'react';

import RNTesterModuleContainer from './components/RNTesterModuleContainer';
import RNTesterModuleList from './components/RNTesterModuleList';
import RNTesterNavBar, {navBarHeight} from './components/RNTesterNavbar';
import RNTesterList from './utils/RNTesterList';
import {
  Screens,
  initialNavState,
  getExamplesListWithBookmarksAndRecentlyUsed,
} from './utils/testerStateUtils';
import {
  RNTesterNavReducer,
  RNTesterNavActionsType,
} from './utils/RNTesterNavReducer';
import {RNTesterThemeContext, themes} from './components/RNTesterTheme';
import RNTTitleBar from './components/RNTTitleBar';
import {RNTesterEmptyBookmarksState} from './components/RNTesterEmptyBookmarksState';
import {RNTesterJsStallsProvider} from './utils/RNTesterJsStallsContext';

// RNTester App currently uses in memory storage for storing navigation state
// and bookmark items.
// TODO: Identify/implement solution for async device storage.
LogBox.ignoreLogs([/AsyncStorage has been extracted from react-native/]);

const RNTesterApp = (): React.Node => {
  const [state, dispatch] = React.useReducer<Function, Object>(
    RNTesterNavReducer,
    initialNavState,
  );

  const colorScheme = useColorScheme();

  const {
    activeModuleKey,
    activeModuleTitle,
    activeModuleExampleKey,
    screen,
    bookmarks,
    recentlyUsed,
  } = state;

  const examplesList = React.useMemo(
    () =>
      getExamplesListWithBookmarksAndRecentlyUsed({bookmarks, recentlyUsed}),
    [bookmarks, recentlyUsed],
  );

  const handleBackPress = React.useCallback(() => {
    if (activeModuleKey != null) {
      dispatch({type: RNTesterNavActionsType.BACK_BUTTON_PRESS});
    }
  }, [dispatch, activeModuleKey]);

  // Setup hardware back button press listener
  React.useEffect(() => {
    const handleHardwareBackPress = () => {
      if (activeModuleKey) {
        handleBackPress();
        return true;
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', handleHardwareBackPress);

    return () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        handleHardwareBackPress,
      );
    };
  }, [activeModuleKey, handleBackPress]);

  const handleModuleCardPress = React.useCallback(
    ({exampleType, key, title}) => {
      dispatch({
        type: RNTesterNavActionsType.MODULE_CARD_PRESS,
        data: {exampleType, key, title},
      });
    },
    [dispatch],
  );

  const handleModuleExampleCardPress = React.useCallback(
    exampleName => {
      dispatch({
        type: RNTesterNavActionsType.EXAMPLE_CARD_PRESS,
        data: {key: exampleName},
      });
    },
    [dispatch],
  );

  const toggleBookmark = React.useCallback(
    ({exampleType, key}) => {
      dispatch({
        type: RNTesterNavActionsType.BOOKMARK_PRESS,
        data: {exampleType, key},
      });
    },
    [dispatch],
  );

  const handleNavBarPress = React.useCallback(
    args => {
      dispatch({
        type: RNTesterNavActionsType.NAVBAR_PRESS,
        data: {screen: args.screen},
      });
    },
    [dispatch],
  );

  const theme = colorScheme === 'dark' ? themes.dark : themes.light;

  if (examplesList === null) {
    return null;
  }

  const activeModule =
    activeModuleKey != null ? RNTesterList.Modules[activeModuleKey] : null;
  const activeModuleExample =
    activeModuleExampleKey != null
      ? activeModule?.examples.find(e => e.name === activeModuleExampleKey)
      : null;
  const title =
    activeModuleTitle != null
      ? activeModuleTitle
      : screen === Screens.COMPONENTS
      ? 'Components'
      : screen === Screens.APIS
      ? 'APIs'
      : 'Bookmarks';

  const activeExampleList =
    screen === Screens.COMPONENTS
      ? examplesList.components
      : screen === Screens.APIS
      ? examplesList.apis
      : examplesList.bookmarks;

  return (
    <RNTesterThemeContext.Provider value={theme}>
      <RNTesterJsStallsProvider>
        <RNTTitleBar
          title={title}
          theme={theme}
          onBack={activeModule ? handleBackPress : null}
          documentationURL={activeModule?.documentationURL}
        />
        <View
          style={StyleSheet.compose(styles.container, {
            backgroundColor: theme.GroupedBackgroundColor,
          })}>
          {activeModule != null ? (
            <RNTesterModuleContainer
              module={activeModule}
              example={activeModuleExample}
              onExampleCardPress={handleModuleExampleCardPress}
            />
          ) : screen === Screens.BOOKMARKS &&
            examplesList.bookmarks.length === 0 ? (
            <RNTesterEmptyBookmarksState />
          ) : (
            <RNTesterModuleList
              sections={activeExampleList}
              toggleBookmark={toggleBookmark}
              handleModuleCardPress={handleModuleCardPress}
            />
          )}
        </View>
        <View style={styles.bottomNavbar}>
          <RNTesterNavBar
            screen={screen || Screens.COMPONENTS}
            isExamplePageOpen={!!activeModule}
            handleNavBarPress={handleNavBarPress}
          />
        </View>
      </RNTesterJsStallsProvider>
    </RNTesterThemeContext.Provider>
  );
};

export default RNTesterApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomNavbar: {
    height: navBarHeight,
  },
  hidden: {
    display: 'none',
  },
});
