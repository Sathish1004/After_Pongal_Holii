/**
 * MOBILE-SAFE REACT NATIVE SCREEN TEMPLATE
 *
 * Use this as a template for all screens in your app
 * This ensures consistent safe area handling across all screens
 */

import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SafeScrollContainer from "../components/SafeScrollContainer";

const TemplateScreen = ({ navigation }: any) => {
  // 1️⃣ HOOK: Get safe area insets
  const insets = useSafeAreaInsets();

  // 2️⃣ STATE: Component state
  const [activeTab, setActiveTab] = useState("Dashboard");

  // 3️⃣ HANDLERS: Event handlers
  const handleNavigation = (screenName: string) => {
    navigation.navigate(screenName);
  };

  // 4️⃣ RENDER: JSX structure
  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          // Apply safe area insets to container
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: 0, // Don't add bottom padding (SafeScrollContainer + bottom nav handle it)
        },
      ]}
    >
      {/* ===== HEADER ===== */}
      <View
        style={[
          styles.header,
          {
            // Extra padding for notch/camera
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        <Text style={styles.headerTitle}>Screen Title</Text>
        <TouchableOpacity
          onPress={() => navigation.openDrawer?.()}
          style={styles.headerButton}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ===== MAIN CONTENT ===== */}
      <SafeScrollContainer contentContainerStyle={styles.scrollContent}>
        {/* Your scrollable content goes here */}

        {/* EXAMPLE: Cards */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Example Card</Text>
          <Text style={styles.cardText}>
            This is a responsive card for mobile
          </Text>
        </View>

        {/* EXAMPLE: List Items */}
        {[1, 2, 3].map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.listItem}
            onPress={() => console.log("Clicked item", item)}
          >
            <Text style={styles.listItemText}>Item {item}</Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        ))}
      </SafeScrollContainer>

      {/* ===== BOTTOM NAVIGATION ===== */}
      <View
        style={[
          styles.bottomNav,
          {
            // Safe area bottom padding + minimum nav height
            paddingBottom: Math.max(insets.bottom, 8),
            height: 64 + Math.max(insets.bottom, 8),
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === "Dashboard" && styles.navItemActive,
          ]}
          onPress={() => setActiveTab("Dashboard")}
        >
          <Ionicons
            name={activeTab === "Dashboard" ? "grid" : "grid-outline"}
            size={24}
            color={activeTab === "Dashboard" ? "#8B0000" : "#6B7280"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "Dashboard" && styles.navTextActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === "Tasks" && styles.navItemActive,
          ]}
          onPress={() => setActiveTab("Tasks")}
        >
          <Ionicons
            name={activeTab === "Tasks" ? "list" : "list-outline"}
            size={24}
            color={activeTab === "Tasks" ? "#8B0000" : "#6B7280"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "Tasks" && styles.navTextActive,
            ]}
          >
            Tasks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === "Profile" && styles.navItemActive,
          ]}
          onPress={() => setActiveTab("Profile")}
        >
          <Ionicons
            name={activeTab === "Profile" ? "person" : "person-outline"}
            size={24}
            color={activeTab === "Profile" ? "#8B0000" : "#6B7280"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "Profile" && styles.navTextActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ============================================
// STYLES - MOBILE OPTIMIZED
// ============================================

const styles = StyleSheet.create({
  // ===== CONTAINER =====
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    // ❌ NO: paddingBottom: 100
    // ✅ YES: Let SafeAreaInsets handle it
  },

  // ===== HEADER =====
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16, // Reduced from 20 for mobile
    paddingBottom: 12, // Reduced from 16
    backgroundColor: "#8B0000",
    borderBottomLeftRadius: 12, // Reduced from 16
    borderBottomRightRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10, // Ensure header stays on top
  },

  headerTitle: {
    fontSize: 20, // Reduced from 22
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },

  headerButton: {
    padding: 8,
  },

  // ===== SCROLL CONTENT =====
  scrollContent: {
    flexGrow: 1,
    padding: 16, // Mobile-friendly padding
    paddingBottom: 20, // SafeScrollContainer handles the rest
  },

  // ===== CARD =====
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Reduced from 16
    padding: 16, // Reduced from 20
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  cardTitle: {
    fontSize: 16, // Reduced from 18
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  cardText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  // ===== LIST ITEM =====
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12, // Reduced from 16
    marginBottom: 8,
    borderRadius: 10, // Reduced from 12
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  listItemText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },

  // ===== BOTTOM NAVIGATION =====
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 9999,
    // ❌ NO: height: 64 (managed by component props)
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },

  navItemActive: {
    backgroundColor: "#FEF2F2",
  },

  navText: {
    fontSize: 10,
    marginTop: 4,
    color: "#6B7280",
    fontWeight: "600",
  },

  navTextActive: {
    color: "#8B0000",
    fontWeight: "700",
  },
});

export default TemplateScreen;

/**
 * ============================================
 * KEY POINTS TO REMEMBER
 * ============================================
 *
 * 1. ALWAYS use SafeAreaView with useSafeAreaInsets()
 *
 * 2. Apply insets to container:
 *    paddingTop: insets.top
 *    paddingLeft: insets.left
 *    paddingRight: insets.right
 *    paddingBottom: 0 (let SafeScrollContainer handle it)
 *
 * 3. Use SafeScrollContainer for scrollable content
 *    It automatically handles paddingBottom with insets
 *
 * 4. Bottom nav needs:
 *    paddingBottom: Math.max(insets.bottom, 8)
 *    height: 64 + Math.max(insets.bottom, 8)
 *
 * 5. Never use:
 *    - height: "100%" (use flex: 1)
 *    - paddingBottom: 100 (use SafeAreaInsets)
 *    - Fixed viewport heights
 *    - Platform-specific hacks without variables
 *
 * 6. Mobile-friendly sizes:
 *    - Padding: 12-16px (not 20-24px)
 *    - Border radius: 8-12px (not 16-20px)
 *    - Font sizes: 1-2pt smaller
 *    - Card padding: 12-16px
 *    - Tab height: 64px + insets
 *
 * 7. Always test on real device with notch/camera
 *
 * 8. Use absolute positioning for bottom nav with zIndex
 *
 * 9. Add proper elevation/shadow for depth
 *
 * 10. Keep layouts responsive with flex and flexWrap
 */
