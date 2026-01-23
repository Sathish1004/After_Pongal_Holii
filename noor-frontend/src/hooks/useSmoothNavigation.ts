import { useNavigation } from '@react-navigation/native';
import { Animated, Easing } from 'react-native';

/**
 * Custom hook for smooth animated navigation
 * Provides gentle slide/fade transitions between screens
 */
export const useSmoothNavigation = () => {
  const navigation = useNavigation();
  const slideAnimation = new Animated.Value(0);

  const animateNavigate = (screenName: string, params?: any) => {
    // Start animation
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    // Navigate to screen
    setTimeout(() => {
      navigation.navigate(screenName as never, params);
    }, 50); // Small delay for smoother perception
  };

  const animateGoBack = () => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 250,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      navigation.goBack();
    }, 50);
  };

  return {
    slideAnimation,
    animateNavigate,
    animateGoBack,
    navigation,
  };
};
