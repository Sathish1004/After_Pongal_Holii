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
  planned_end_date?: string;
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
      const currentDate = new Date();

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
        // Delayed: currentDate > dueDate AND status != "Completed"
        filtered = allMilestones.filter((m: any) => {
          const mileStatus = m.status?.toLowerCase() || "";
          const isNotCompleted = mileStatus !== "completed";

          // Check both end_date and planned_end_date for compatibility
          const dueDate = m.planned_end_date || m.end_date;
          if (!dueDate) return false; // No due date = not delayed

          const isOverdue = new Date() > new Date(dueDate);

          return isNotCompleted && isOverdue;
        });
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

  /**
   * Calculate delay days for a milestone
   * @param dueDate - Planned end date
   * @param milestoneStatus - Milestone status
   * @returns Delay days (0 if not delayed)
   */
  const calculateDelayDays = (
    dueDate?: string,
    milestoneStatus?: string,
  ): number => {
    if (milestoneStatus === "Completed" || milestoneStatus === "completed") {
      return 0;
    }

    if (!dueDate) {
      return 0;
    }

    try {
      // Reset time to 00:00:00 to avoid partial-day errors
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);

      // Calculate difference in milliseconds
      const diffMs = today.getTime() - due.getTime();

      // Convert to days
      const delayDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Return 0 if not delayed (future date or today)
      return delayDays > 0 ? delayDays : 0;
    } catch (error) {
      console.error("Error calculating delay days:", error);
      return 0;
    }
  };

  const getDelayText = (milestone: Milestone): string => {
    const delayDays =
      milestone.delay_days ??
      calculateDelayDays(
        milestone.planned_end_date || milestone.end_date,
        milestone.status,
      );

    if (delayDays > 0) {
      return `Delayed by ${delayDays} day${delayDays > 1 ? "s" : ""}`;
    }
    return "On time";
  };

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

  const getStatusGradientColors = (mileStatus: string) => {
    const normalized = mileStatus?.toLowerCase() || "";
    if (normalized === "completed")
      return { light: "#DCFCE7", dark: "#22C55E" };
    if (normalized === "in progress" || normalized === "in_progress")
      return { light: "#DBEAFE", dark: "#3B82F6" };
    if (normalized === "delayed") return { light: "#FECACA", dark: "#EF4444" };
    return { light: "#E2E8F0", dark: "#64748B" };
  };

  const getCardBackgroundColor = (mileStatus: string) => {
    const normalized = mileStatus?.toLowerCase() || "";
    if (normalized === "completed") return "rgba(220, 252, 231, 0.4)";
    if (normalized === "in progress" || normalized === "in_progress")
      return "rgba(219, 234, 254, 0.4)";
    if (normalized === "delayed") return "rgba(254, 202, 202, 0.35)";
    return "rgba(226, 232, 240, 0.3)";
  };

  const getCardBorderColor = (mileStatus: string) => {
    const normalized = mileStatus?.toLowerCase() || "";
    if (normalized === "completed") return "rgba(34, 197, 94, 0.2)";
    if (normalized === "in progress" || normalized === "in_progress")
      return "rgba(59, 130, 246, 0.2)";
    if (normalized === "delayed") return "rgba(239, 68, 68, 0.2)";
    return "rgba(100, 116, 139, 0.15)";
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
    const gradientColors = getStatusGradientColors(milestone.status);
    const cardBgColor = getCardBackgroundColor(milestone.status);
    const cardBorderColor = getCardBorderColor(milestone.status);
    const statusLabel = getStatusLabel(milestone.status);

    return (
      <View
        style={[
          styles.milestoneCard,
          {
            backgroundColor: cardBgColor,
            borderColor: cardBorderColor,
          },
        ]}
      >
        {/* Header with Title & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.milestoneName}>{milestone.name}</Text>
            <Text style={styles.projectName}>{milestone.project_name}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: gradientColors.light,
                borderColor: statusColor,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={[styles.progressValue, { color: statusColor }]}>
              {milestone.progress || 0}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${milestone.progress || 0}%`,
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
                  {formatDate(milestone.planned_end_date || milestone.end_date)}
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
                  {formatDate(milestone.planned_end_date || milestone.end_date)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Delay</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        (milestone.delay_days ??
                          calculateDelayDays(
                            milestone.planned_end_date || milestone.end_date,
                            milestone.status,
                          )) > 0
                          ? "#DC2626"
                          : "#6B7280",
                      fontWeight: "800",
                    },
                  ]}
                >
                  {getDelayText(milestone)}
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  milestoneCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  milestoneName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  projectName: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  progressSection: {
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
    padding: 12,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(203, 213, 225, 0.4)",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  detailsGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  detailItem: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  detailLabel: {
    fontSize: 11,
    color: "#78909C",
    marginBottom: 6,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  detailValue: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#F8FAFC",
  },
  emptyText: {
    fontSize: 18,
    color: "#94A3B8",
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});

export default MilestoneDetailScreen;
