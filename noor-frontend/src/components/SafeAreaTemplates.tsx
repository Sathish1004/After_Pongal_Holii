import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * SafeAreaScreen - A wrapper component that properly handles safe areas
 * Use this as a template for fixing mobile layout issues
 *
 * Problems it solves:
 * ✅ Header hidden under notch → Uses paddingTop based on insets
 * ✅ Bottom nav hidden under system bar → Uses paddingBottom based on insets
 * ✅ Content cut off → Proper flex layout with ScrollView
 * ✅ Works on all devices → Dynamic inset calculation
 */

export const SafeAreaScreen = ({
  children,
  backgroundColor = "#F9FAFB",
  showHeader = true,
  headerTitle = "",
  headerHeight = 60,
}: {
  children: React.ReactNode;
  backgroundColor?: string;
  showHeader?: boolean;
  headerTitle?: string;
  headerHeight?: number;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor,
          // Apply safe area insets to push content away from notches and system bars
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {showHeader && (
        <View
          style={[
            styles.header,
            {
              // Add extra padding on top for notch devices
              paddingTop: Math.max(insets.top, 12),
            },
          ]}
        >
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            // Critical: Add bottom padding so content doesn't hide under system nav
            // This is the most important fix for bottom nav issues!
            paddingBottom: Math.max(insets.bottom + 80, 100), // 80px for nav + insets
          },
        ]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * BottomTabNavigator - Properly styled bottom tabs
 *
 * Problems solved:
 * ✅ Tabs hidden behind Android system nav → Uses dynamic height
 * ✅ Tabs not clickable → Proper padding and touch targets
 * ✅ Works with gesture navigation → Accounts for insets
 */

export const FixedBottomNav = ({
  tabs,
  activeTab,
  onTabPress,
}: {
  tabs: Array<{ name: string; icon: string; label: string }>;
  activeTab: string;
  onTabPress: (tabName: string) => void;
}) => {
  const insets = useSafeAreaInsets();

  const navHeight = useMemo(() => {
    // Base tab height: 64px
    // + safe area bottom (for Android nav bar)
    // + extra padding for gesture navigation
    const baseHeight = 64;
    const bottomSafeArea = Math.max(insets.bottom, 8);
    return baseHeight + bottomSafeArea;
  }, [insets.bottom]);

  return (
    <View
      style={[
        styles.bottomNav,
        {
          height: navHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          // Position absolutely at bottom to prevent scroll interference
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
        },
      ]}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={[
            styles.tabItem,
            activeTab === tab.name && styles.tabItemActive,
          ]}
          onPress={() => onTabPress(tab.name)}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === tab.name && styles.tabLabelActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

/**
 * ScreenWithBottomNav - Main container for screens with bottom navigation
 *
 * Usage:
 * <ScreenWithBottomNav>
 *   <Your scrollable content here>
 * </ScreenWithBottomNav>
 */

export const ScreenWithBottomNav = ({
  children,
  bottomNavHeight = 80,
}: {
  children: React.ReactNode;
  bottomNavHeight?: number;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          // Bottom padding is NOT set here because bottom nav is absolute positioned
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          {
            // Add bottom padding equal to bottom nav height + safe area
            // This prevents content from being hidden behind the bottom nav
            paddingBottom: bottomNavHeight + Math.max(insets.bottom, 8),
          },
        ]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  scrollView: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },

  tabItemActive: {
    backgroundColor: "#f3f4f6",
  },

  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "center",
  },

  tabLabelActive: {
    color: "#2563eb",
    fontWeight: "700",
  },
});

/*
 * ============================================================================
 * HOW TO USE THIS FILE IN YOUR SCREENS
 * ============================================================================
 *
 * Example 1: Simple screen with header and scroll
 *
 * import { SafeAreaScreen } from './SafeAreaTemplates';
 *
 * export default function MyScreen() {
 *   return (
 *     <SafeAreaScreen headerTitle="My Screen">
 *       <Text>Your content here</Text>
 *       <Text>More content...</Text>
 *     </SafeAreaScreen>
 *   );
 * }
 *
 * Example 2: Screen with bottom navigation
 *
 * import { ScreenWithBottomNav } from './SafeAreaTemplates';
 *
 * export default function DashboardScreen() {
 *   return (
 *     <ScreenWithBottomNav>
 *       <View>Your dashboard content</View>
 *     </ScreenWithBottomNav>
 *   );
 * }
 *
 * Example 3: Manual implementation for complex screens like AdminDashboard
 *
 * import { useSafeAreaInsets } from 'react-native-safe-area-context';
 *
 * const AdminDashboardScreen = () => {
 *   const insets = useSafeAreaInsets();
 *
 *   return (
 *     <SafeAreaView style={[styles.container, {
 *       paddingTop: insets.top,
 *       paddingLeft: insets.left,
 *       paddingRight: insets.right,
 *     }]}>
 *       <ScrollView contentContainerStyle={{
 *         paddingBottom: Math.max(insets.bottom, 8) + 80,
 *       }}>
 *         Your content here
 *       </ScrollView>
 *     </SafeAreaView>
 *   );
 * };
 *
 * ============================================================================
 * KEY FIXES
 * ============================================================================
 *
 * 1. HEADER UNDER NOTCH
 *    Problem: paddingTop is not applied
 *    Solution: Use insets.top in SafeAreaView padding
 *
 * 2. BOTTOM NAV HIDDEN
 *    Problem: ScrollView extends below nav bar
 *    Solution: Add large paddingBottom to ScrollView contentContainerStyle
 *    paddingBottom: 80 + Math.max(insets.bottom, 8)
 *
 * 3. FIXED HEIGHTS BREAKING LAYOUT
 *    Problem: height values ignore safe areas
 *    Solution: Use flex: 1 for containers
 *
 * 4. BOTTOM TAB HEIGHT
 *    Problem: Tab bar height is fixed, doesn't account for gesture nav
 *    Solution: Calculate dynamic height based on insets
 *    height: 64 + Math.max(insets.bottom, 8)
 *
 * ============================================================================
 */
