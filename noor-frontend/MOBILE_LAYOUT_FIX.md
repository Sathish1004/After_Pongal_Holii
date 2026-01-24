// MOBILE LAYOUT FIX GUIDE
// Apply these changes to AdminDashboardScreen.tsx

// ============================================
// 1. ADD IMPORTS AT THE TOP
// ============================================
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeScrollContainer from '../components/SafeScrollContainer';

// ============================================
// 2. ADD THIS HOOK INSIDE THE COMPONENT
// ============================================
const AdminDashboardScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  // ... rest of your code

  // ============================================
  // 3. WRAP THE ENTIRE RENDER WITH SAFE AREA
  // ============================================
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }
      ]}
    >
      {/* Header - Add extra padding for notch */}
      <View style={[
        styles.header,
        { 
          paddingTop: Math.max(insets.top, 12),
        }
      ]}>
        {/* Header content */}
      </View>

      {/* Main Content - Use SafeScrollContainer */}
      <SafeScrollContainer
        contentContainerStyle={styles.scrollContent}
      >
        {/* All your content here */}
      </SafeScrollContainer>

      {/* Bottom Navigation - Fixed at bottom with inset */}
      <View 
        style={[
          styles.bottomNavContainer,
          { 
            paddingBottom: Math.max(insets.bottom, 8),
            height: 64 + Math.max(insets.bottom, 8),
          }
        ]}
      >
        {/* Navigation items */}
      </View>
    </SafeAreaView>
  );
};

// ============================================
// 4. UPDATE StyleSheet - CRITICAL CHANGES
// ============================================

// BEFORE (PROBLEMATIC):
// container: { flex: 1, backgroundColor: "#F9FAFB", paddingBottom: 100 }
// bottomNav: { height: 64 }
// scrollContent: { paddingBottom: 100 }

// AFTER (FIXED):
const newStyles = {
  // ===== CONTAINER =====
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    // NO fixed paddingBottom - let insets handle it
  },

  // ===== HEADER =====
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10, // Ensure header is above content
  },

  // ===== SCROLL CONTENT =====
  scrollContent: {
    flexGrow: 1,
    padding: 16, // Reduced from 20 for better mobile fit
    paddingBottom: 20, // SafeScrollContainer handles additional padding
  },

  // ===== METRIC CARD =====
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12, // Reduced from 16 for mobile
    width: '48%',
    marginBottom: 12, // Reduced from 16
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },

  // ===== PROJECT CARD =====
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Reduced from 16
    padding: 12, // Reduced from 16
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12, // Reduced from 16
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  // ===== BOTTOM NAVIGATION - CRITICAL FIX =====
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 9999,
    // NO fixed height - managed by container
  },

  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  bottomNavText: {
    fontSize: 10,
    marginTop: 4,
    color: '#6B7280',
    fontWeight: '600',
  },

  // ===== MODAL STYLES =====
  miniModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12, // Reduced from 16
    padding: 16, // Reduced from 20
    maxHeight: '90%', // Add max height for modals
  },

  // ===== FORM FIELDS =====
  inputField: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10, // Reduced from 12
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },

  // ===== PHASE ACCORDION =====
  phaseAccordion: {
    marginBottom: 8, // Reduced from 12
    borderRadius: 12, // Reduced from custom
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Reduced from 6
  },

  phaseHeaderDark: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12, // Reduced from 16
    backgroundColor: '#8B0000',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  // ===== TASK ITEM =====
  taskItem: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 10, // Reduced from 12
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderRadius: 8,
    marginTop: 4,
    marginHorizontal: 4,
  },

  // ===== TEXT STYLES - MOBILE OPTIMIZED =====
  headerTitle: {
    fontSize: 20, // Reduced from 22
    fontWeight: '800',
    color: '#8B0000',
    letterSpacing: -0.5,
  },

  sectionTitle: {
    fontSize: 16, // Reduced from 18
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },

  projectName: {
    fontSize: 14, // Reduced from 16
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },

  projectLocation: {
    fontSize: 12, // Reduced from 13
    color: '#6B7280',
  },
};

// ============================================
// 5. CRITICAL SPACING RULES FOR MOBILE
// ============================================

/*
DO NOT USE:
- height: "100%" (use flex: 1 instead)
- paddingBottom: 100 (let SafeAreaInsets handle it)
- fixed viewportHeight values
- Platform-specific hard-coded values without variables

DO USE:
- flex: 1 for flexible layouts
- useSafeAreaInsets() hook for dynamic insets
- SafeScrollContainer for scrolling views
- Relative padding based on screen dimensions
- maxHeight on modals
- flexWrap: 'wrap' for responsive grids

MOBILE-SAFE LAYOUT PATTERN:

<SafeAreaView style={[
  styles.container,
  {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }
]}>
  {/* Header */}
  
  {/* Scrollable Content */}
  <SafeScrollContainer>
    {/* Your content */}
  </SafeScrollContainer>
  
  {/* Fixed Bottom Nav */}
  <View style={{
    paddingBottom: Math.max(insets.bottom, 8),
    height: 64 + Math.max(insets.bottom, 8),
  }}>
    {/* Nav items */}
  </View>
</SafeAreaView>
*/

// ============================================
// 6. ANDROID-SPECIFIC CONSIDERATIONS
// ============================================

/*
For Android with system navigation bar:

1. Use android:windowFullscreen="false" in AndroidManifest.xml
2. Set android:windowDrawsSystemBarBackgrounds="true"
3. Use transparent statusBar with proper insets
4. Add paddingBottom for navigation gestures (not shown)
5. Test on real device with notch/camera hole

File: android/app/src/main/AndroidManifest.xml

<activity
  ...
  android:windowFullscreen="false"
  android:windowDrawsSystemBarBackgrounds="true"
  android:windowLightStatusBar="false"
/>
*/

// ============================================
// 7. QUICK FIXES CHECKLIST
// ============================================

/*
✅ Wrap App with SafeAreaProvider in App.tsx
✅ Use SafeAreaView in all screens
✅ Import useSafeAreaInsets hook
✅ Apply insets to container padding
✅ Use flex: 1 instead of height: "100%"
✅ Create SafeScrollContainer for scroll views
✅ Set proper paddingBottom on scrollContent
✅ Apply insets to bottom nav height
✅ Fix tab navigator height (don't hardcode)
✅ Reduce card padding for mobile (12-16px)
✅ Reduce border radius (8-12px)
✅ Reduce font sizes (1-2pt smaller)
✅ Remove platform-specific hacks
✅ Test on Android with notch
✅ Test on iOS with notch
✅ Verify scrolling works
✅ Verify buttons are clickable
✅ Check overflow isn't hidden
*/

export { newStyles };
