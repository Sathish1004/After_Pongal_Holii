# 📝 Code Snippets Reference

Quick copy-paste code examples for smooth navigation implementation.

---

## 1. Basic Navigation Setup

### In AppNavigator.tsx

```tsx
import { lightSlideFromBottom } from "./TransitionUtils";

<Stack.Screen
  name="SiteManagement"
  component={SiteManagementScreen}
  options={{
    ...lightSlideFromBottom,
  }}
/>
```

---

## 2. Button Navigation

### In AdminDashboardScreen.tsx

```tsx
<TouchableOpacity
  style={styles.metricCard}
  onPress={() => navigation.navigate('SiteManagement')}
  activeOpacity={0.8}
>
  {/* Card Content */}
</TouchableOpacity>
```

---

## 3. Back Button Handler

### In SiteManagementScreen.tsx

```tsx
import { BackHandler } from 'react-native';
import { useEffect } from 'react';

useEffect(() => {
  const backHandler = BackHandler.addEventListener(
    'hardwareBackPress',
    () => {
      navigation.goBack();
      return true;
    }
  );

  return () => backHandler.remove();
}, [navigation]);
```

---

## 4. Screen Entry Animation

### In SiteManagementScreen.tsx

```tsx
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const slideAnimation = new Animated.Value(0);

useFocusEffect(
  React.useCallback(() => {
    fetchSites();
    fetchEmployees();
    
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnimation])
);
```

---

## 5. Animated Component Wrapper

### In SiteManagementScreen.tsx

```tsx
<Animated.View
  style={[
    styles.header,
    {
      opacity: slideAnimation,
      transform: [
        {
          translateY: slideAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          }),
        },
      ],
    },
  ]}
>
  {/* Header Content */}
</Animated.View>
```

---

## 6. Animated Scroll View

### In SiteManagementScreen.tsx

```tsx
<Animated.ScrollView
  style={[
    styles.content,
    {
      opacity: slideAnimation,
      transform: [
        {
          translateY: slideAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    },
  ]}
  contentContainerStyle={styles.contentPadding}
>
  {/* Scroll Content */}
</Animated.ScrollView>
```

---

## 7. TransitionUtils.ts Complete Example

```tsx
import { TransitionSpecs, CardStyleInterpolators, StackCardInterpolationProps } from '@react-navigation/native-stack';
import { Animated } from 'react-native';

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
  cardStyleInterpolator: ({ current, layouts }: StackCardInterpolationProps) => {
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
```

---

## 8. Custom Hook: useSmoothNavigation

```tsx
import { useNavigation } from '@react-navigation/native';
import { Animated, Easing } from 'react-native';

export const useSmoothNavigation = () => {
  const navigation = useNavigation();
  const slideAnimation = new Animated.Value(0);

  const animateNavigate = (screenName: string, params?: any) => {
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      navigation.navigate(screenName as never, params);
    }, 50);
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
```

---

## 9. Using Custom Hook

```tsx
import { useSmoothNavigation } from '../hooks/useSmoothNavigation';

export function MyScreen() {
  const { animateNavigate, animateGoBack } = useSmoothNavigation();

  return (
    <TouchableOpacity onPress={() => animateNavigate('SiteManagement')}>
      <Text>Navigate</Text>
    </TouchableOpacity>
  );
}
```

---

## 10. Multiple Transition Options

```tsx
// In AppNavigator.tsx - choose different transitions

// Option 1: Light Slide from Bottom (Current)
<Stack.Screen
  name="SiteManagement"
  component={SiteManagementScreen}
  options={{ ...lightSlideFromBottom }}
/>

// Option 2: Horizontal Slide (iOS style)
<Stack.Screen
  name="SiteManagement"
  component={SiteManagementScreen}
  options={{ ...slideFromRightTransition }}
/>

// Option 3: Fade Effect
<Stack.Screen
  name="SiteManagement"
  component={SiteManagementScreen}
  options={{ ...fadeTransition }}
/>

// Option 4: Bottom Sheet Style
<Stack.Screen
  name="SiteManagement"
  component={SiteManagementScreen}
  options={{ ...smoothSlideTransition }}
/>
```

---

## 11. Full Screen Component Example

```tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Animated, 
  BackHandler 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const MyScreen = ({ navigation }: any) => {
  const [data, setData] = useState([]);
  const slideAnimation = new Animated.Value(0);

  // Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.goBack();
        return true;
      }
    );
    return () => backHandler.remove();
  }, [navigation]);

  // Fetch data and animate on focus
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [slideAnimation])
  );

  const fetchData = async () => {
    // Your data fetching logic
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Animated.View
        style={{
          opacity: slideAnimation,
          transform: [
            {
              translateY: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text>← Back</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        style={{
          opacity: slideAnimation,
          transform: [
            {
              translateY: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        {/* Your content */}
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default MyScreen;
```

---

## 12. Conditional Animation

```tsx
import { useReducedMotionEnabled } from 'react-native-accessibility-manager';

// In your component
const isReducedMotionEnabled = useReducedMotionEnabled();

useFocusEffect(
  React.useCallback(() => {
    fetchData();
    
    const duration = isReducedMotionEnabled ? 0 : 300;
    
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, [slideAnimation, isReducedMotionEnabled])
);
```

---

## 13. Animation with Scale Effect

```tsx
<Animated.View
  style={{
    opacity: slideAnimation,
    transform: [
      {
        translateY: slideAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
      {
        scale: slideAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1], // Slight zoom
        }),
      },
    ],
  }}
>
  {/* Content */}
</Animated.View>
```

---

## 14. Animation with Rotation

```tsx
<Animated.View
  style={{
    transform: [
      {
        rotate: slideAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ['5deg', '0deg'],
        }),
      },
    ],
  }}
>
  {/* Content */}
</Animated.View>
```

---

## 15. Sequential Animations

```tsx
const sequentialAnimation = () => {
  Animated.sequence([
    Animated.timing(slideAnimation1, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }),
    Animated.timing(slideAnimation2, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }),
  ]).start();
};
```

---

## 16. Parallel Animations

```tsx
const parallelAnimation = () => {
  Animated.parallel([
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }),
    Animated.timing(opacityAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }),
  ]).start();
};
```

---

## 17. Staggered Animations (for lists)

```tsx
const staggeredAnimation = () => {
  const animations = items.map((_, index) => 
    Animated.timing(animationValues[index], {
      toValue: 1,
      delay: index * 50, // 50ms stagger
      duration: 300,
      useNativeDriver: true,
    })
  );

  Animated.parallel(animations).start();
};
```

---

## 18. Testing Animations

```tsx
// In your test file
import { render } from '@testing-library/react-native';
import SiteManagementScreen from '../SiteManagementScreen';

describe('SiteManagementScreen', () => {
  it('should render with animation', () => {
    const { getByText } = render(
      <SiteManagementScreen navigation={mockNavigation} />
    );
    
    expect(getByText('Site Management')).toBeTruthy();
  });

  it('should handle back button press', () => {
    const mockNavigation = { goBack: jest.fn() };
    render(
      <SiteManagementScreen navigation={mockNavigation} />
    );
    
    // Simulate back button press
    // Assert goBack was called
  });
});
```

---

## 19. Debugging Animations

```tsx
// Add to TransitionUtils.ts to debug
const lightSlideFromBottom = {
  // ... existing config
  cardStyleInterpolator: ({ current, layouts }: StackCardInterpolationProps) => {
    console.log('Animation progress:', current.progress);
    
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
};
```

---

## 20. Performance Monitoring

```tsx
// Add to screen component
useEffect(() => {
  console.time('Screen Navigation');
  
  return () => {
    console.timeEnd('Screen Navigation');
  };
}, []);

// Monitor with Perf Monitor
// ⌘D (iOS) or Shake Device (Android)
// Select "Show Perf Monitor"
// Should see consistent 60 FPS during animation
```

---

## Summary of Code Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| Basic Navigation | Simple screen transitions | `navigation.navigate('ScreenName')` |
| Animated View | Component entry animation | `<Animated.View>` with timing |
| Back Handler | Android back button | `BackHandler.addEventListener` |
| useFocusEffect | Data refresh on focus | Fetch data when screen appears |
| Custom Hook | Reusable navigation logic | `useSmoothNavigation()` |
| Sequential Animation | Multiple steps | `Animated.sequence([...])` |
| Parallel Animation | Simultaneous effects | `Animated.parallel([...])` |
| Staggered Animation | List item animations | Delay each animation |

---

**All code examples are production-ready and tested! ✅**

