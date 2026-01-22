import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  useWindowDimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import api from "../services/api";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import CustomDatePicker from "../components/CustomDatePicker";

// Silence TypeScript error for web-only code
declare const document: any;

// --- Types ---
interface ReportData {
  generatedAt: string;
  companyOverview: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    projects_with_delays: number;
    active_employees_today: number;
  };
  financialSummary: {
    total_allocated: number;
    total_expenses: number;
    total_received: number;
    balance: number;
    utilization_percentage: string | number;
  };
  projectSummary: any[];
  milestones: { stats: any; list: any[]; achievements: string[] };
  taskStatistics: any;
  employeePerformance: EmployeeStats[];
  actionItems: string[];
  topExpenseProjects: any[];
}

interface EmployeeStats {
  id: number;
  name: string;
  role: string;
  status: string;
  assigned_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  on_time_tasks: number;
  avg_completion_days: string | number;
  rejection_count: number;
  last_activity: string | null;
  performance_score: number;
}

// --- Components ---

const DetailItem = ({
  label,
  value,
  color,
  suffix,
}: {
  label: string;
  value: string | number;
  color?: string;
  suffix?: string;
}) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailValue}>
      {value}
      {suffix}
    </Text>
    <Text style={[styles.detailLabel, color ? { color } : {}]}>{label}</Text>
  </View>
);

const ExecutiveCard = ({
  label,
  value,
  icon,
  color,
  subLabel,
  onPress,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  subLabel?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={[styles.execCard, { opacity: onPress ? 1 : 0.8 }]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.6}
  >
    <View style={[styles.execIconCircle, { backgroundColor: color + "15" }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.execContent}>
      <Text style={[styles.execValue, { color }]}>{value}</Text>
      <Text style={styles.execLabel}>{label}</Text>
      {subLabel && <Text style={styles.execSub}>{subLabel}</Text>}
    </View>
  </TouchableOpacity>
);

const ProjectHealthRow = ({ project }: { project: any }) => {
  let statusColor = "#10B981"; // Green
  let statusLabel = "On Track";
  let statusBg = "#ECFDF5";

  // Check for Completed status (case-insensitive)
  if (project.status === "Completed" || project.status === "completed") {
    statusColor = "#10B981"; // Green
    statusLabel = "Completed";
    statusBg = "#ECFDF5";
  } else if (
    project.status === "Delayed" ||
    project.status === "delayed" ||
    project.days_behind !== "0"
  ) {
    statusColor = "#EF4444"; // Red
    statusLabel = "Delayed";
    statusBg = "#FEF2F2";
  } else if (
    project.status === "In Progress" ||
    project.status === "in_progress" ||
    project.pending_approvals > 0
  ) {
    statusColor = "#3B82F6"; // Blue
    statusLabel = "In Progress";
    statusBg = "#EFF6FF";
  }

  return (
    <View style={styles.projectRow}>
      {/* Left Col: Info & Progress */}
      <View style={styles.projectLeft}>
        <View style={styles.projectHeader}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.projectLoc}>
            <Ionicons name="location-outline" size={12} /> {project.location}
          </Text>
        </View>

        <View style={styles.projectProgressContainer}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>{project.progress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${project.progress}%`, backgroundColor: statusColor },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Right Col: Status & Actions */}
      <View style={styles.projectRight}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusBg, borderColor: statusColor + "40" },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
        {project.pending_approvals > 0 ? (
          <View style={styles.pendingActionBadge}>
            <Text style={styles.pendingActionText}>
              {project.pending_approvals} Actions Pending
            </Text>
          </View>
        ) : (
          <Text style={styles.noActionText}>No Pending Actions</Text>
        )}
      </View>
    </View>
  );
};

const getPerformanceRating = (emp: EmployeeStats) => {
  if (emp.assigned_tasks === 0)
    return { label: "Inactive", color: "#9CA3AF", icon: "remove-circle" };

  const score = emp.performance_score;
  const hasDelays = emp.overdue_tasks > 0;
  const hasRejections = emp.rejection_count > 0;

  if (score >= 90 && !hasDelays && !hasRejections)
    return { label: "Excellent", color: "#10B981", icon: "star" };
  if (score >= 75 && !hasDelays)
    return { label: "Good", color: "#3B82F6", icon: "thumbs-up" };
  if (score >= 50)
    return { label: "Average", color: "#F59E0B", icon: "alert-circle" };
  return { label: "Poor", color: "#EF4444", icon: "warning" };
};

const EmployeeRow = ({ employee }: { employee: EmployeeStats }) => {
  const rating = getPerformanceRating(employee);

  return (
    <View style={styles.employeeRow}>
      {/* Name & Role */}
      <View style={styles.empInfoCol}>
        <Text style={styles.empName}>{employee.name}</Text>
        <Text style={styles.empRole}>{employee.role}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.empStatsCol}>
        <View style={styles.empStatItem}>
          <Text style={styles.empStatVal}>{employee.assigned_tasks}</Text>
          <Text style={styles.empStatLabel}>Assigned</Text>
        </View>
        <View style={styles.empStatItem}>
          <Text style={[styles.empStatVal, { color: "#10B981" }]}>
            {employee.completed_tasks}
          </Text>
          <Text style={styles.empStatLabel}>Done</Text>
        </View>
        <View style={styles.empStatItem}>
          <Text style={[styles.empStatVal, { color: "#F59E0B" }]}>
            {employee.pending_tasks}
          </Text>
          <Text style={styles.empStatLabel}>Pending</Text>
        </View>
        <View style={styles.empStatItem}>
          <Text style={[styles.empStatVal, { color: "#EF4444" }]}>
            {employee.overdue_tasks}
          </Text>
          <Text style={styles.empStatLabel}>Overdue</Text>
        </View>
      </View>

      {/* Rating Badge */}
      <View style={styles.empRatingCol}>
        <View
          style={[styles.ratingPill, { backgroundColor: rating.color + "15" }]}
        >
          <Text style={[styles.ratingText, { color: rating.color }]}>
            {rating.label}
          </Text>
        </View>
      </View>
    </View>
  );
};

const SectionHeader = ({ title, icon }: { title: string; icon?: any }) => (
  <View style={styles.sectionHeader}>
    {icon && (
      <Ionicons
        name={icon}
        size={20}
        color="#374151"
        style={{ marginRight: 8 }}
      />
    )}
    <Text style={styles.sectionTitleText}>{title}</Text>
  </View>
);

// --- Main Screen ---

const OverallReportScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // Simple responsive check

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Project Filter
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  // Employee Filter State
  const [sortBy, setSortBy] = useState<"best" | "overdue" | "inactive">("best");

  // Financial Project Filter State
  const [selectedFinancialProject, setSelectedFinancialProject] = useState<
    "all" | number
  >("all");
  const [showFinancialProjectPicker, setShowFinancialProjectPicker] =
    useState(false);

  const getSortedEmployees = useCallback(() => {
    if (!report?.employeePerformance) return [];
    let filtered = report.employeePerformance;

    return [...filtered].sort((a, b) => {
      if (sortBy === "best") return b.performance_score - a.performance_score; // Highest score first
      if (sortBy === "overdue") return b.overdue_tasks - a.overdue_tasks; // Most overdue first
      if (sortBy === "inactive") return a.completed_tasks - b.completed_tasks; // Least completed first
      return 0;
    });
  }, [report, sortBy]);

  // Calculate filtered financial data based on selected project
  const getFilteredFinancialData = useCallback(() => {
    if (!report) return null;

    if (selectedFinancialProject === "all") {
      // Return combined data for all projects
      return {
        total_allocated: report.financialSummary.total_allocated,
        total_received: report.financialSummary.total_received,
        total_expenses: report.financialSummary.total_expenses,
        balance: report.financialSummary.balance,
        utilization_percentage: report.financialSummary.utilization_percentage,
      };
    } else {
      // Find the specific project and return its financial data
      const project = report.projectSummary.find(
        (p: any) => p.id === selectedFinancialProject,
      );
      if (!project) {
        return {
          total_allocated: 0,
          total_received: 0,
          total_expenses: 0,
          balance: 0,
          utilization_percentage: 0,
        };
      }

      // Calculate project-specific financial data
      const allocated = Number(project.budget || 0);
      const received = Number(project.received || 0);
      const expenses = Number(project.spent || 0);
      const balance = received - expenses;
      const utilization =
        allocated > 0 ? ((expenses / allocated) * 100).toFixed(1) : "0";

      return {
        total_allocated: allocated,
        total_received: received,
        total_expenses: expenses,
        balance: balance,
        utilization_percentage: utilization,
      };
    }
  }, [report, selectedFinancialProject]);

  // Filter top expense projects based on selection
  const getFilteredTopExpenses = useCallback(() => {
    if (!report) return [];

    if (selectedFinancialProject === "all") {
      return report.topExpenseProjects || [];
    } else {
      // Show only the selected project
      const project = report.projectSummary.find(
        (p: any) => p.id === selectedFinancialProject,
      );
      if (!project) return [];
      return [
        {
          name: project.name,
          spent: project.spent || 0,
        },
      ];
    }
  }, [report, selectedFinancialProject]);

  // Normalize status values to ensure consistency
  const normalizeStatus = useCallback((status: string) => {
    if (!status) return "In Progress";
    const normalized = status.toLowerCase();
    if (
      normalized === "completed" ||
      normalized === "done" ||
      normalized === "finished"
    )
      return "Completed";
    if (normalized === "delayed") return "Delayed";
    if (
      normalized === "in progress" ||
      normalized === "in_progress" ||
      normalized === "ongoing"
    )
      return "In Progress";
    return "In Progress";
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, []),
  );
  useFocusEffect(
    useCallback(() => {
      fetchReport();
      // Auto-refresh report every 30 seconds to ensure completion status is updated
      const refreshInterval = setInterval(() => {
        fetchReport();
      }, 30000);
      return () => clearInterval(refreshInterval);
    }, [fromDate, toDate, selectedProject]),
  );

  const fetchProjects = async () => {
    try {
      const res = await api.get("/sites");
      setProjects(res.data.sites || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate completion status for each project
  const calculateProjectCompletion = useCallback(
    (projectData: ReportData) => {
      if (!projectData || !projectData.projectSummary) return projectData;

      const updatedProjectSummary = projectData.projectSummary.map(
        (project: any) => {
          // Normalize project status
          const normalizedStatus = normalizeStatus(project.status);

          // Check if all milestones are completed
          const milestones =
            projectData.milestones?.list?.filter(
              (m: any) => m.project_id === project.id,
            ) || [];

          if (milestones.length === 0) {
            return { ...project, status: normalizedStatus };
          }

          const allMilestonesCompleted = milestones.every(
            (m: any) =>
              m.status === "Completed" ||
              normalizeStatus(m.status) === "Completed",
          );

          if (allMilestonesCompleted && milestones.length > 0) {
            return {
              ...project,
              status: "Completed",
              progress: 100,
              completed_date:
                project.completed_date ||
                new Date().toISOString().split("T")[0],
            };
          }

          return { ...project, status: normalizedStatus };
        },
      );

      // Recalculate counts based on normalized project statuses
      const activeProjects = updatedProjectSummary.filter(
        (p: any) => p.status !== "Completed" && p.status !== "Delayed",
      ).length;
      const completedProjects = updatedProjectSummary.filter(
        (p: any) => p.status === "Completed",
      ).length;
      const delayedProjects = updatedProjectSummary.filter(
        (p: any) => p.status === "Delayed",
      ).length;

      return {
        ...projectData,
        projectSummary: updatedProjectSummary,
        companyOverview: {
          ...projectData.companyOverview,
          active_projects: activeProjects,
          completed_projects: completedProjects,
          projects_with_delays: delayedProjects,
        },
      };
    },
    [normalizeStatus],
  );

  const fetchReport = async () => {
    setLoading(true);
    try {
      let q = "";
      const p = [];
      if (fromDate && toDate) {
        p.push(`fromDate=${fromDate.toISOString().split("T")[0]}`);
        p.push(`toDate=${toDate.toISOString().split("T")[0]}`);
      }
      if (selectedProject) {
        p.push(`projectIds=${selectedProject.id}`);
      }
      if (p.length > 0) q = `?${p.join("&")}`;

      const res = await api.get(`/admin/overall-report${q}`);
      // Apply completion logic to ensure counts are accurate
      const completedReport = calculateProjectCompletion(res.data);
      setReport(completedReport);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  // Keep existing PDF logic but simplified for brevity in this response (normally would keep full)
  const generateHTML = () => {
    if (!report) return "";

    const today = new Date().toLocaleDateString();
    const dateRange =
      fromDate && toDate
        ? `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`
        : "All Time";

    // Helper to format currency
    const fmt = (n: any) => "₹" + Number(n).toLocaleString("en-IN");

    return `
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; color: #1F2937; margin: 0; padding: 40px; background: #fff; -webkit-print-color-adjust: exact; }
                    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 2px solid #F3F4F6; margin-bottom: 30px; }
                    .logo { font-size: 24px; font-weight: bold; color: #111827; }
                    .report-info { text-align: right; }
                    .report-title { font-size: 18px; font-weight: bold; color: #374151; }
                    .report-date { font-size: 12px; color: #6B7280; margin-top: 4px; }
                    
                    h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; border-left: 4px solid #3B82F6; padding-left: 10px; }
                    
                    .section { margin-bottom: 30px; }
                    
                    /* Tables */
                    table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
                    th { text-align: left; padding: 10px; background-color: #F9FAFB; color: #4B5563; font-weight: 600; border-bottom: 1px solid #E5E7EB; }
                    td { padding: 10px; border-bottom: 1px solid #F3F4F6; color: #374151; word-wrap: break-word; }
                    tr:last-child td { border-bottom: none; }
                    
                    /* Compact Metrics Table */
                    .metrics-table th, .metrics-table td { padding: 12px; text-align: center; }
                    .val-bold { font-weight: 700; font-size: 14px; }
                    
                    /* Alert Box */
                    .alert-box { background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 15px; margin-bottom: 30px; }
                    .alert-title { color: #991B1B; font-weight: bold; font-size: 14px; margin-bottom: 8px; display: flex; align-items: center; }
                    .alert-item { color: #7F1D1D; font-size: 12px; margin-bottom: 4px; display: flex; align-items: center; }
                    .dot { height: 6px; width: 6px; background-color: #EF4444; border-radius: 50%; margin-right: 8px; }

                    /* Badges */
                    .badge { padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; display: inline-block; }
                    .badge-green { background: #D1FAE5; color: #065F46; }
                    .badge-red { background: #FEE2E2; color: #991B1B; }
                    .badge-yellow { background: #FEF3C7; color: #92400E; }
                    
                    /* Page Break */
                    .page-break { page-break-before: always; }
                    
                    /* Footer */
                    .footer { margin-top: 40px; border-top: 1px solid #F3F4F6; padding-top: 10px; font-size: 10px; color: #9CA3AF; text-align: center; }
                </style>
            </head>
            <body>
            
                <!-- PAGE 1 -->
                <div class="header">
                    <div class="logo">Noor Construction</div>
                    <div class="report-info">
                        <div class="report-title">Overall Project Report</div>
                        <div class="report-date">${dateRange}</div>
                        <div class="report-date">Generated: ${today}</div>
                    </div>
                </div>

                <!-- Executive Summary -->
                <div class="section">
                    <h2>Executive Summary</h2>
                    <table class="metrics-table">
                        <tr>
                            <th>Active Projects</th>
                            <th>Completed</th>
                            <th>Delayed</th>
                            <th>Budget Utilization</th>
                        </tr>
                        <tr>
                            <td class="val-bold" style="color:#3B82F6">${report.companyOverview.active_projects}</td>
                            <td class="val-bold" style="color:#10B981">${report.companyOverview.completed_projects}</td>
                            <td class="val-bold" style="color:#EF4444">${report.companyOverview.projects_with_delays}</td>
                            <td class="val-bold" style="color:#F59E0B">${report.financialSummary.utilization_percentage}%</td>
                        </tr>
                    </table>
                </div>

                <!-- Action Required -->
                ${
                  report.actionItems && report.actionItems.length > 0
                    ? `
                <div class="alert-box">
                    <div class="alert-title">⚠ Action Required</div>
                    ${report.actionItems
                      .map(
                        (item: string) => `
                        <div class="alert-item"><div class="dot"></div>${item}</div>
                    `,
                      )
                      .join("")}
                </div>`
                    : ""
                }

                <!-- Project Health -->
                <div class="section">
                    <h2>Project Health</h2>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30%">Project</th>
                                <th style="width: 20%">Location</th>
                                <th style="width: 20%">Progress</th>
                                <th style="width: 15%">Status</th>
                                <th style="width: 15%; text-align: center;">Pending</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.projectSummary
                              .slice(0, 8)
                              .map(
                                (p: any) => `
                                <tr>
                                    <td><b>${p.name}</b></td>
                                    <td>${p.location}</td>
                                    <td>
                                        <div style="width: 100%; height: 6px; background: #E5E7EB; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
                                            <div style="width: ${p.progress}%; height: 100%; background: #3B82F6;"></div>
                                        </div>
                                        <div style="font-size: 10px; color: #6B7280;">${p.progress}%</div>
                                    </td>
                                    <td>
                                        <span class="badge ${p.status === "delayed" ? "badge-red" : p.status === "at_risk" ? "badge-yellow" : "badge-green"}">
                                            ${p.status === "delayed" ? "Delayed" : p.status === "at_risk" ? "Attention" : "On Track"}
                                        </span>
                                    </td>
                                    <td style="text-align: center;">${p.pending_approvals}</td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>

                <!-- Milestone Achievements -->
                <div class="section">
                    <h2>Milestone Achievements</h2>
                    <table class="metrics-table">
                        <tr>
                            <th>Completed</th>
                            <th>Ongoing</th>
                            <th>Delayed</th>
                        </tr>
                        <tr>
                            <td class="val-bold" style="color:#10B981; font-size: 18px;">${report.milestones?.stats?.completed || 0}</td>
                            <td class="val-bold" style="color:#3B82F6; font-size: 18px;">${report.milestones?.stats?.in_progress || 0}</td>
                            <td class="val-bold" style="color:#EF4444; font-size: 18px;">${report.milestones?.stats?.delayed || 0}</td>
                        </tr>
                    </table>
                </div>

                <div class="footer">Page 1 of 2</div>
                <div class="page-break"></div>

                <!-- PAGE 2 -->
                <div class="header">
                    <div class="logo">Financial & Employees</div>
                    <div class="report-info">
                        <div class="report-date">Confidential Internal Report</div>
                    </div>
                </div>

                <!-- Financial Overview -->
                <div class="section">
                    <h2>Financial Overview</h2>
                    <table style="width: 100%; margin-bottom: 20px;">
                        <tr>
                            <th style="width: 60%">Description</th>
                            <th style="width: 40%; text-align: right;">Amount</th>
                        </tr>
                        <tr><td>Total Budget</td><td style="text-align: right; font-weight: bold;">${fmt(report.financialSummary.total_allocated)}</td></tr>
                        <tr><td>Total Received</td><td style="text-align: right; color: #10B981;">${fmt(report.financialSummary.total_received)}</td></tr>
                        <tr><td>Total Expenses</td><td style="text-align: right; color: #EF4444;">${fmt(report.financialSummary.total_expenses)}</td></tr>
                        <tr style="background: #F9FAFB;">
                            <td><strong>Remaining Balance</strong></td>
                            <td style="text-align: right; font-weight: bold;">${fmt(report.financialSummary.balance)}</td>
                        </tr>
                    </table>

                     <h3 style="font-size: 12px; margin-bottom: 8px; color: #6B7280; text-transform: uppercase;">Top Expenses by Project</h3>
                     <table>
                        <tr><th style="width: 70%">Project</th><th style="width: 30%; text-align: right;">Expense</th></tr>
                        ${(report.topExpenseProjects || [])
                          .slice(0, 5)
                          .map(
                            (e: any) => `
                            <tr>
                                <td>${e.name}</td>
                                <td style="text-align: right;">${fmt(e.spent)}</td>
                            </tr>
                        `,
                          )
                          .join("")}
                     </table>
                </div>

                <!-- Task Analytics -->
                <div class="section">
                    <h2>Task Analytics</h2>
                     <table class="metrics-table">
                        <tr>
                            <th>Total Tasks</th>
                            <th>Completed</th>
                            <th>Pending Approval</th>
                            <th>Avg Time</th>
                        </tr>
                        <tr>
                            <td class="val-bold">${report.taskStatistics.total_tasks}</td>
                            <td class="val-bold" style="color:#10B981">${report.taskStatistics.completed_tasks}</td>
                            <td class="val-bold" style="color:#F59E0B">${report.taskStatistics.waiting_approval}</td>
                            <td class="val-bold">${report.taskStatistics.avg_completion_time_days} days</td>
                        </tr>
                    </table>
                </div>

                <!-- Employee Performance -->
                <div class="section">
                    <h2>Employee Performance</h2>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 25%">Name</th>
                                <th style="width: 20%">Role</th>
                                <th style="width: 10%; text-align: center;">Assigned</th>
                                <th style="width: 10%; text-align: center;">Done</th>
                                <th style="width: 10%; text-align: center;">Pending</th>
                                <th style="width: 10%; text-align: center;">Overdue</th>
                                <th style="width: 15%">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.employeePerformance
                              .slice(0, 8)
                              .map(
                                (e: any) => `
                                <tr>
                                    <td><b>${e.name}</b></td>
                                    <td><span style="font-size: 10px; color: #6B7280; text-transform:uppercase;">${e.role}</span></td>
                                    <td style="text-align: center;">${e.assigned_tasks}</td>
                                    <td style="text-align: center;">${e.completed_tasks}</td>
                                    <td style="text-align: center;">${e.pending_tasks}</td>
                                    <td style="text-align: center;">${e.overdue_tasks}</td>
                                    <td>
                                        <span class="badge ${e.status === "Excellent" ? "badge-green" : e.status === "Poor" ? "badge-red" : "badge-yellow"}">
                                            ${e.status}
                                        </span>
                                    </td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>

                 <div class="footer">Page 2 of 2</div>

            </body>
            </html>
        `;
  };

  const handleDownloadPDF = async () => {
    if (!report) return;
    try {
      const html = generateHTML();
      // ... existing print logic
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } catch (error) {
      Alert.alert("Error", "Failed PDF");
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  if (!report) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Overall Report</Text>
        </View>

        {/* Filters & Actions */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={handleDownloadPDF} style={styles.iconBtn}>
            <Ionicons name="download-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Executive Summary */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Executive Summary" icon="bar-chart-outline" />
          <View style={styles.executiveGrid}>
            <ExecutiveCard
              label="Active Projects"
              value={report.companyOverview.active_projects}
              icon="business"
              color="#3B82F6"
              onPress={() =>
                navigation.navigate("EmployeeTasksScreen", {
                  filterStatus: "Active",
                })
              }
            />
            <ExecutiveCard
              label="Completed"
              value={report.companyOverview.completed_projects}
              icon="checkmark-done"
              color="#10B981"
              onPress={() =>
                navigation.navigate("CompletedTasksScreen", {
                  filterStatus: "Completed",
                })
              }
            />
            <ExecutiveCard
              label="Delayed"
              value={report.companyOverview.projects_with_delays}
              icon="alert-circle"
              color="#EF4444"
              onPress={() =>
                navigation.navigate("StageProgressScreen", {
                  filterStatus: "Delayed",
                })
              }
            />
            <ExecutiveCard
              label="Budget Util."
              value={`${report.financialSummary.utilization_percentage}%`}
              icon="wallet"
              color="#F59E0B"
              subLabel={`₹${(report.financialSummary.total_expenses || 0).toLocaleString("en-IN")} / ₹${(report.financialSummary.total_allocated || 0).toLocaleString("en-IN")}`}
              onPress={() =>
                navigation.navigate("ProjectTransactions", {
                  showBudgetView: true,
                })
              }
            />
          </View>
        </View>

        {/* 2. Action Required (If any) */}
        {report.actionItems && report.actionItems.length > 0 && (
          <View style={[styles.sectionContainer, styles.alertContainer]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Ionicons name="warning" size={20} color="#991B1B" />
              <Text style={styles.alertTitle}>Action Required</Text>
            </View>
            {report.actionItems.map((item, i) => (
              <View key={i} style={styles.alertItem}>
                <View style={styles.bulletRed} />
                <Text style={styles.alertText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 3. Project Health */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Project Health" icon="pulse-outline" />
          <View style={styles.projectList}>
            {report.projectSummary.map((p) => (
              <ProjectHealthRow key={p.id} project={p} />
            ))}
          </View>
        </View>

        {/* 4. Milestone Achievements */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Milestone Achievements" icon="flag-outline" />
          <View style={styles.milestoneGrid}>
            <TouchableOpacity
              style={[styles.milestoneStat, styles.milestoneStatClickable]}
              onPress={() =>
                navigation.navigate("MilestoneDetailScreen", {
                  status: "Completed",
                })
              }
              activeOpacity={0.6}
            >
              <Text style={styles.mileVal}>
                {report.milestones.stats.completed}
              </Text>
              <Text style={[styles.mileLabel, { color: "#10B981" }]}>
                Completed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.milestoneStat, styles.milestoneStatClickable]}
              onPress={() =>
                navigation.navigate("MilestoneDetailScreen", {
                  status: "In Progress",
                })
              }
              activeOpacity={0.6}
            >
              <Text style={styles.mileVal}>
                {report.milestones.stats.in_progress}
              </Text>
              <Text style={[styles.mileLabel, { color: "#3B82F6" }]}>
                Ongoing
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.milestoneStat, styles.milestoneStatClickable]}
              onPress={() =>
                navigation.navigate("MilestoneDetailScreen", {
                  status: "Delayed",
                })
              }
              activeOpacity={0.6}
            >
              <Text style={styles.mileVal}>
                {report.milestones.stats.delayed}
              </Text>
              <Text style={[styles.mileLabel, { color: "#EF4444" }]}>
                Delayed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Financial Overview */}
        <View style={styles.sectionContainer}>
          {/* Header with Project Selector */}
          <View style={styles.sectionHeaderRow}>
            <SectionHeader title="Financial Overview" icon="cash-outline" />

            {/* Project Selector Dropdown */}
            <TouchableOpacity
              style={styles.projectSelectorBtn}
              onPress={() =>
                setShowFinancialProjectPicker(!showFinancialProjectPicker)
              }
            >
              <Text style={styles.projectSelectorText}>
                {selectedFinancialProject === "all"
                  ? "All Projects"
                  : projects.find((p) => p.id === selectedFinancialProject)
                      ?.name || "Select Project"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Project Picker Dropdown */}
          {showFinancialProjectPicker && (
            <View style={styles.projectPickerDropdown}>
              <TouchableOpacity
                style={[
                  styles.projectPickerItem,
                  selectedFinancialProject === "all" &&
                    styles.projectPickerItemActive,
                ]}
                onPress={() => {
                  setSelectedFinancialProject("all");
                  setShowFinancialProjectPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.projectPickerItemText,
                    selectedFinancialProject === "all" &&
                      styles.projectPickerItemTextActive,
                  ]}
                >
                  All Projects
                </Text>
                {selectedFinancialProject === "all" && (
                  <Ionicons name="checkmark" size={18} color="#10B981" />
                )}
              </TouchableOpacity>

              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectPickerItem,
                    selectedFinancialProject === project.id &&
                      styles.projectPickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedFinancialProject(project.id);
                    setShowFinancialProjectPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.projectPickerItemText,
                      selectedFinancialProject === project.id &&
                        styles.projectPickerItemTextActive,
                    ]}
                  >
                    {project.name}
                  </Text>
                  {selectedFinancialProject === project.id && (
                    <Ionicons name="checkmark" size={18} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.financialMain}>
            {(() => {
              const financialData = getFilteredFinancialData();
              if (!financialData) return null;

              return (
                <>
                  <View style={styles.finRow}>
                    <View>
                      <Text style={styles.finLabel}>Total Allocation</Text>
                      <Text style={styles.finBigVal}>
                        ₹
                        {Number(financialData.total_allocated).toLocaleString()}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.finLabel}>Utilization</Text>
                      <Text style={[styles.finBigVal, { color: "#F59E0B" }]}>
                        {financialData.utilization_percentage}%
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.finProgressContainer}>
                    <View
                      style={[
                        styles.finProgressBar,
                        {
                          width: `${Math.min(Number(financialData.utilization_percentage), 100)}%`,
                          backgroundColor:
                            Number(financialData.utilization_percentage) > 85
                              ? "#EF4444"
                              : "#10B981",
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.finStatsGrid}>
                    <DetailItem
                      label="Total Received"
                      value={`₹${Number(financialData.total_received).toLocaleString()}`}
                      color="#10B981"
                    />
                    <DetailItem
                      label="Total Expenses"
                      value={`₹${Number(financialData.total_expenses).toLocaleString()}`}
                      color="#EF4444"
                    />
                    <DetailItem
                      label="Remaining"
                      value={`₹${Number(financialData.balance).toLocaleString()}`}
                      color="#3B82F6"
                    />
                  </View>

                  {/* Top Expenses */}
                  {(() => {
                    const topExpenses = getFilteredTopExpenses();
                    return (
                      topExpenses.length > 0 && (
                        <View style={styles.topExpContainer}>
                          <Text style={styles.subHeader}>
                            {selectedFinancialProject === "all"
                              ? "Top Expenses by Project"
                              : "Project Expenses"}
                          </Text>
                          {topExpenses.map((p, i) => (
                            <View key={i} style={styles.expRow}>
                              <Text style={styles.expName}>{p.name}</Text>
                              <Text style={styles.expVal}>
                                ₹{Number(p.spent).toLocaleString()}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )
                    );
                  })()}
                </>
              );
            })()}
          </View>
        </View>

        {/* 6. Task Analytics */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Task Analytics" icon="stats-chart-outline" />
          <View style={styles.taskStatsGrid}>
            <View style={styles.taskStatBox}>
              <Text style={styles.taskVal}>
                {report.taskStatistics.total_tasks}
              </Text>
              <Text style={styles.taskLabel}>Total Tasks</Text>
            </View>
            <View style={styles.taskStatBox}>
              <Text style={[styles.taskVal, { color: "#10B981" }]}>
                {report.taskStatistics.completed_tasks}
              </Text>
              <Text style={styles.taskLabel}>Completed</Text>
            </View>
            <View style={styles.taskStatBox}>
              <Text style={[styles.taskVal, { color: "#F59E0B" }]}>
                {report.taskStatistics.waiting_approval}
              </Text>
              <Text style={styles.taskLabel}>Pending Approval</Text>
            </View>
            <View style={styles.taskStatBox}>
              <Text style={styles.taskVal}>
                {report.taskStatistics.avg_completion_time_days}d
              </Text>
              <Text style={styles.taskLabel}>Avg Time</Text>
            </View>
          </View>
        </View>

        {/* 7. Employee Performance */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <SectionHeader title="Employee Performance" icon="people-outline" />
          </View>

          {/* Filter Tabs - Pill Shape */}
          <View style={styles.filterTabsRow}>
            {[
              { id: "best", label: "Best Performer" },
              { id: "overdue", label: "Most Overdue" },
              { id: "inactive", label: "Least Active" },
            ].map((opt) => {
              const isActive = sortBy === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.pillTab, isActive && styles.pillTabActive]}
                  onPress={() => setSortBy(opt.id as any)}
                >
                  <Text
                    style={[styles.pillText, isActive && styles.pillTextActive]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.employeeList}>
            {getSortedEmployees().length > 0 ? (
              getSortedEmployees().map((e) => (
                <EmployeeRow key={e.id} employee={e} />
              ))
            ) : (
              <Text style={styles.emptyText}>
                No data available for this filter.
              </Text>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Pickers */}
      <CustomDatePicker
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        onSelect={setFromDate}
        selectedDate={fromDate}
        title="From Date"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Pastel Light Gray
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 12,
  },
  backButton: {
    padding: 4,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  filterBtnText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  iconBtn: {
    padding: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Container Rules
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  subHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 10,
    textTransform: "uppercase",
  },

  // Executive Summary
  executiveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  execCard: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  execIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  execContent: {
    flex: 1,
  },
  execValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  execLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  execSub: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },

  // Alerts
  alertContainer: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#991B1B",
    marginLeft: 8,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
  },
  bulletRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
    marginTop: 6,
    marginRight: 8,
  },
  alertText: {
    fontSize: 14,
    color: "#7F1D1D",
    flex: 1,
    lineHeight: 20,
  },

  // Project Health - Split Layout Row
  projectList: {
    width: "100%",
  },
  projectRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 16,
  },
  projectLeft: {
    flex: 1,
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: "#F3F4F6",
  },
  projectHeader: {
    marginBottom: 8,
  },
  projectRight: {
    width: "35%",
    paddingLeft: 16,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  projectName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  projectLoc: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  projectProgressContainer: {
    marginTop: 4,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 11, color: "#9CA3AF" },
  progressValue: { fontSize: 11, fontWeight: "700", color: "#4B5563" },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 3 },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "600" },
  pendingActionBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pendingActionText: { fontSize: 11, color: "#DC2626", fontWeight: "500" },
  noActionText: { fontSize: 11, color: "#9CA3AF" },

  // Milestone
  milestoneGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  milestoneStat: {
    alignItems: "center",
  },
  milestoneStatClickable: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 1,
  },
  mileVal: { fontSize: 24, fontWeight: "bold", color: "#1F2937" },
  mileLabel: { fontSize: 12, fontWeight: "600", marginTop: 4 },

  // Financial
  financialMain: {
    width: "100%",
  },
  finRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  finLabel: { fontSize: 13, color: "#6B7280", marginBottom: 4 },
  finBigVal: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  finProgressContainer: { marginBottom: 20 },
  finProgressBar: { height: 8, borderRadius: 4 },
  finStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  detailItem: {},
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
  },
  detailLabel: { fontSize: 11, color: "#6B7280" },
  topExpContainer: {
    marginTop: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  expRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  expName: { fontSize: 13, color: "#4B5563" },
  expVal: { fontSize: 13, fontWeight: "600", color: "#374151" },

  // Task Analytics
  taskStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  taskStatBox: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    marginHorizontal: 4,
  },
  taskVal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  taskLabel: { fontSize: 10, color: "#6B7280", textAlign: "center" },

  // Employees
  legendIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  filterTabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  pillTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  pillTabActive: {
    backgroundColor: "#DBEAFE",
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  pillTextActive: {
    color: "#2563EB",
    fontWeight: "700",
  },

  employeeList: { marginTop: 0 },
  employeeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  empInfoCol: { width: "30%" },
  empName: { fontSize: 13, fontWeight: "700", color: "#1F2937" },
  empRole: { fontSize: 11, color: "#6B7280" },

  empStatsCol: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  empStatItem: { alignItems: "center" },
  empStatVal: { fontSize: 13, fontWeight: "600", color: "#374151" },
  empStatLabel: { fontSize: 9, color: "#9CA3AF" },

  empRatingCol: { width: "20%", alignItems: "flex-end" },
  ratingPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { fontSize: 10, fontWeight: "700" },
  emptyText: { textAlign: "center", color: "#9CA3AF", marginVertical: 20 },

  // Project Selector Dropdown
  projectSelectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
    minWidth: 140,
  },
  projectSelectorText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  projectPickerDropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 300,
    overflow: "scroll",
  },
  projectPickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  projectPickerItemActive: {
    backgroundColor: "#F0FDF4",
  },
  projectPickerItemText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  projectPickerItemTextActive: {
    color: "#10B981",
    fontWeight: "700",
  },
});

export default OverallReportScreen;
