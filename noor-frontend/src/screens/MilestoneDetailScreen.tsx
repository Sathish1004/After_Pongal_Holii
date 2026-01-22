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

interface Milestone {
  id: number;
  name: string;
  project_id: number;
  project_name: string;
  status: string;
  progress: number;
  start_date?: string;
  end_date?: string;
  floor?: string;
  stage?: string;
  delay_days?: number;
  delay_reason?: string;
  completion_date?: string;
}

const MilestoneDetailScreen = ({ route, navigation }: any) => {
  const { status } = route.params;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/overall-report");
      const allMilestones = res.data.milestones?.list || [];

      // Filter milestones by status
      let filtered = allMilestones;
      if (status === "Completed") {
        filtered = allMilestones.filter(
          (m: any) => m.status === "Completed" || m.status === "completed",
        );
      } else if (status === "In Progress") {
        filtered = allMilestones.filter(
          (m: any) => m.status === "In Progress" || m.status === "in_progress",
        );
      } else if (status === "Delayed") {
        filtered = allMilestones.filter(
          (m: any) => m.status === "Delayed" || m.status === "delayed",
        );
      }

      setMilestones(filtered);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load milestones");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      fetchMilestones();
    }, [fetchMilestones]),
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

  const getStatusColor = (mileStatus: string) => {
    const normalized = mileStatus?.toLowerCase() || "";
    if (normalized === "completed") return "#10B981";
    if (normalized === "in progress" || normalized === "in_progress")
      return "#3B82F6";
    if (normalized === "delayed") return "#EF4444";
    return "#6B7280";
  };

  const getStatusLabel = (mileStatus: string) => {
    const normalized = mileStatus?.toLowerCase() || "";
    if (normalized === "completed") return "Completed";
    if (normalized === "in progress" || normalized === "in_progress")
      return "Ongoing";
    if (normalized === "delayed") return "Delayed";
    return mileStatus;
  };

  const MilestoneCard = ({ milestone }: { milestone: Milestone }) => {
    const statusColor = getStatusColor(milestone.status);
    const statusLabel = getStatusLabel(milestone.status);

    return (
      <View
        style={[
          styles.milestoneCard,
          {
            backgroundColor: statusColor + "08",
            borderColor: statusColor + "30",
          },
        ]}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.milestoneName}>{milestone.name}</Text>
            <Text style={styles.projectName}>{milestone.project_name}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "15", borderColor: statusColor },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={[styles.progressValue, { color: statusColor }]}>
              {milestone.progress}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${milestone.progress}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {status === "Completed" && (
            <>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Completion Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(milestone.completion_date)}
                </Text>
              </View>
              {milestone.stage && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Stage</Text>
                  <Text style={styles.detailValue}>{milestone.stage}</Text>
                </View>
              )}
              {milestone.floor && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Floor</Text>
                  <Text style={styles.detailValue}>{milestone.floor}</Text>
                </View>
              )}
            </>
          )}

          {status === "In Progress" && (
            <>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(milestone.start_date)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Expected End</Text>
                <Text style={styles.detailValue}>
                  {formatDate(milestone.end_date)}
                </Text>
              </View>
              {milestone.stage && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Stage</Text>
                  <Text style={styles.detailValue}>{milestone.stage}</Text>
                </View>
              )}
            </>
          )}

          {status === "Delayed" && (
            <>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Planned End Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(milestone.end_date)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Delay</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: "#EF4444", fontWeight: "600" },
                  ]}
                >
                  {milestone.delay_days || "-"} days
                </Text>
              </View>
              {milestone.delay_reason && (
                <View
                  style={[
                    styles.detailItem,
                    { width: isMobile ? "100%" : "100%", alignSelf: "stretch" },
                  ]}
                >
                  <Text style={styles.detailLabel}>Reason for Delay</Text>
                  <Text style={styles.detailValue}>
                    {milestone.delay_reason}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  const getPageTitle = () => {
    if (status === "Completed")
      return `Completed Milestones (${milestones.length})`;
    if (status === "In Progress")
      return `Ongoing Milestones (${milestones.length})`;
    if (status === "Delayed")
      return `Delayed Milestones (${milestones.length})`;
    return "Milestones";
  };

  const getTitleColor = () => {
    if (status === "Completed") return "#10B981";
    if (status === "In Progress") return "#3B82F6";
    if (status === "Delayed") return "#EF4444";
    return "#1F2937";
  };

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
          <Text style={[styles.pageTitle, { color: getTitleColor() }]}>
            {getPageTitle()}
          </Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getTitleColor()} />
        </View>
      ) : milestones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="flag-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            No {status.toLowerCase()} milestones
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {milestones.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
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
    color: "#1F2937",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  milestoneCard: {
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
  milestoneName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  projectName: {
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

export default MilestoneDetailScreen;
