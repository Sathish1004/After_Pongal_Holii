import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

interface Project {
  id: number;
  name: string;
  location: string;
  completed_date?: string;
  status: string;
  progress: number;
}

const CompletedProjectsScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/sites");
      const allProjectsData = Array.isArray(res.data)
        ? res.data
        : res.data?.sites || [];

      // Filter completed projects: status is 'completed' OR progress is 100%
      const completed = allProjectsData.filter((p: any) => {
        const status = (p.status || "").toLowerCase();
        const progress = parseInt(p.progress) || 0;

        return status === "completed" || progress === 100;
      });

      setProjects(completed);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load completed projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCompletedProjects();
    }, [fetchCompletedProjects]),
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <View
      style={[
        styles.projectCard,
        { backgroundColor: "#10B98108", borderColor: "#10B98130" },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.projectLocation}>{project.location}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: "#10B98115", borderColor: "#10B981" },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: "#10B981" }]} />
          <Text style={[styles.statusText, { color: "#10B981" }]}>
            Completed
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={[styles.progressValue, { color: "#10B981" }]}>100%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: "100%", backgroundColor: "#10B981" },
            ]}
          />
        </View>
      </View>

      {/* Details Grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Completion Date</Text>
          <Text style={styles.detailValue}>
            {formatDate(project.completed_date)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text
            style={[
              styles.detailValue,
              { color: "#10B981", fontWeight: "600" },
            ]}
          >
            Completed
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.pageTitle, { color: "#10B981" }]}>
            Completed Projects ({projects.length})
          </Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No completed projects yet</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  projectCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  projectLocation: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressSection: {
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  detailsGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: 150,
  },
  detailLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});

export default CompletedProjectsScreen;
