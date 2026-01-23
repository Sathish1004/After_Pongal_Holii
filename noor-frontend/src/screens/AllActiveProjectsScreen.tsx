import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  TextInput,
  Animated,
  Platform,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";

interface Site {
  id: number;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  duration: string;
  status: string;
  progress?: number;
  phase_count?: number;
  task_count?: number;
}

const AllActiveProjectsScreen = ({ navigation, route }: any) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const slideAnimation = new Animated.Value(0);

  // Handle back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        navigation.goBack();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [navigation]);

  const fetchSites = async () => {
    try {
      const response = await api.get("/sites");
      const activeProjects = response.data.sites || [];
      setSites(activeProjects);
      setFilteredSites(activeProjects);
    } catch (error) {
      console.log("Error fetching sites:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSites();
      // Animate in on focus
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [slideAnimation]),
  );

  // Filter sites based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSites(sites);
    } else {
      const filtered = sites.filter(
        (site) =>
          site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          site.location.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredSites(filtered);
    }
  }, [searchQuery, sites]);

  const handleSitePress = (siteId: number) => {
    navigation.navigate("SiteManagement", { siteId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Active Projects</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#94a3b8"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
          placeholderTextColor="#cbd5e1"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <Animated.ScrollView
        style={[
          styles.content,
          {
            opacity: slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
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
        showsVerticalScrollIndicator={false}
      >
        {filteredSites.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? "No projects found" : "No active projects"}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery.trim()
                ? "Try adjusting your search"
                : "No projects available"}
            </Text>
          </View>
        ) : (
          filteredSites.map((site) => (
            <TouchableOpacity
              key={site.id}
              style={styles.siteCard}
              onPress={() => handleSitePress(site.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.siteName}>{site.name}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        site.status === "completed"
                          ? "#dcfce7"
                          : site.status === "delayed"
                            ? "#fee2e2"
                            : "#dbeafe",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          site.status === "completed"
                            ? "#166534"
                            : site.status === "delayed"
                              ? "#991b1b"
                              : "#1e40af",
                      },
                    ]}
                  >
                    {site.status || "Active"}
                  </Text>
                </View>
              </View>

              <View style={styles.siteLocation}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#64748b"
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: "#64748b", fontSize: 14 }}>
                  {site.location}
                </Text>
              </View>

              {/* Progress Bar */}
              {site.progress && site.progress > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(site.progress, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {site.progress}% Complete
                  </Text>
                </View>
              )}

              <View style={styles.dateRow}>
                <Text style={styles.dateText}>
                  📅 {site.start_date} - {site.end_date}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{site.phase_count || 4}</Text>
                  <Text style={styles.statLabel}>Phases</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{site.task_count || 0}</Text>
                  <Text style={styles.statLabel}>Tasks</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{site.duration || "—"}</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginTop: Platform.OS === "android" ? 0 : 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
  },
  emptySub: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  siteCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  siteName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  siteLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#64748b",
  },
  dateRow: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3b82f6",
  },
  statLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
});

export default AllActiveProjectsScreen;
