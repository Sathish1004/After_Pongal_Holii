// SafeScrollContainer.tsx - Reusable component for safe scrolling
import React from "react";
import { ScrollView, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SafeScrollContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const SafeScrollContainer: React.FC<SafeScrollContainerProps> = ({
  children,
  style,
  contentContainerStyle,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[
        {
          flexGrow: 1,
          paddingBottom: Math.max(insets.bottom, 100), // SafeArea + bottom nav
        },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={true}
      scrollIndicatorInsets={{ right: 1 }}
    >
      {children}
    </ScrollView>
  );
};

export default SafeScrollContainer;
