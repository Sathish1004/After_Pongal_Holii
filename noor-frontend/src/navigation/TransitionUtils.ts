import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/**
 * Smooth bottom sheet style transition for Create Site navigation
 * Provides a subtle vertical slide with easing effect
 */
export const smoothSlideTransition: NativeStackNavigationOptions = {
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
};

/**
 * Horizontal slide transition for Create Site navigation
 * iOS-style horizontal slide with natural feel
 */
export const slideFromRightTransition: NativeStackNavigationOptions = {
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
};

/**
 * Fade transition for quick, smooth appearance
 * Useful for modal-like screens
 */
export const fadeTransition: NativeStackNavigationOptions = {
  gestureEnabled: false,
};

/**
 * Custom ease-in transition with controlled timing
 * Provides smooth, professional animation
 */
export const easeInSlideTransition = {
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 400,
        easing: require('react-native/Libraries/Animated/Easing').ease,
        useNativeDriver: true,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: require('react-native/Libraries/Animated/Easing').ease,
        useNativeDriver: true,
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }: any) => {
    return {
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.9, 0.95, 1],
        }),
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.1],
        }),
      },
    };
  },
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
};

/**
 * Light slide from bottom with minimal opacity change
 * Perfect for smooth, subtle navigation
 */
export const lightSlideFromBottom = {
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 350,
        easing: require('react-native/Libraries/Animated/Easing').ease,
        useNativeDriver: true,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
        easing: require('react-native/Libraries/Animated/Easing').ease,
        useNativeDriver: true,
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }: any) => {
    return {
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height * 0.1, 0],
            }),
          },
        ],
      },
    };
  },
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
};

/**
 * Downward slide transition for expanding content from top
 * Used for "Total Projects" → "All Active Projects" navigation
 * Direction: TOP → BOTTOM (vertical slide down)
 * Duration: 280ms with ease-in-out easing
 * Gesture: Swipe up to go back (natural collapse behavior)
 */
export const downwardSlideTransition = {
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 280,
        easing: require('react-native/Libraries/Animated/Easing').ease,
        useNativeDriver: true,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
        easing: require('react-native/Libraries/Animated/Easing').ease,
        useNativeDriver: true,
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }: any) => {
    return {
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-layouts.screen.height, 0],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.08],
        }),
      },
    };
  },
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
};
