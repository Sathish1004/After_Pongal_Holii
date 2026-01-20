import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

interface WorkerDetailScreenProps {
    navigation: any;
    route: any;
}

interface ActivityData {
    [week: string]: {
        [metricId: string]: boolean[];
        attendance: boolean[];
        tasks_assigned: boolean[];
        tasks_completed: boolean[];
        overtime: boolean[];
    };
}

interface WorkerDetails {
    id: number;
    name: string;
    email: string | null;
    phone: string;
    role: string;
    status: string;
    profile_image?: string;
}

interface MonthlyStats {
    attendance_days: number;
    tasks_completed: number;
    overtime_days: number;
}

const METRICS = [
    { id: 'attendance', label: 'Attendance', icon: 'time-outline', color: '#059669' },
    { id: 'tasks_assigned', label: 'Tasks Assigned', icon: 'list-outline', color: '#3B82F6' },
    { id: 'tasks_completed', label: 'Tasks Completed', icon: 'checkmark-done-circle-outline', color: '#10B981' },
    { id: 'overtime', label: 'Overtime', icon: 'moon-outline', color: '#F59E0B' },
];

const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const WorkerDetailScreen: React.FC<WorkerDetailScreenProps> = ({ navigation, route }) => {
    const { workerId } = route.params;
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [worker, setWorker] = useState<WorkerDetails | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
    const [activityData, setActivityData] = useState<ActivityData>({});
    const [productivityTrend, setProductivityTrend] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

    useEffect(() => {
        fetchWorkerData();
    }, [workerId]);

    const fetchWorkerData = async () => {
        try {
            setIsLoading(true);

            // Fetch worker details
            const detailsResponse = await api.get(`/admin/workers/${workerId}/details`);
            setWorker(detailsResponse.data.worker);
            setMonthlyStats(detailsResponse.data.monthlyStats);

            // Fetch activity data
            const activityResponse = await api.get(`/admin/workers/${workerId}/activity`);
            setActivityData(activityResponse.data.activityData);

            // Fetch productivity trend
            const trendResponse = await api.get(`/admin/workers/${workerId}/productivity-trend`);
            setProductivityTrend(trendResponse.data.trend);
        } catch (error) {
            console.error('Error fetching worker data:', error);
            Alert.alert('Error', 'Failed to load worker data');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleDay = async (week: string, metricId: string, dayIndex: number) => {
        try {
            // Calculate the actual date
            const weekNumber = parseInt(week.split(' ')[1]) - 1;
            const currentMonth = new Date();
            const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const daysToAdd = weekNumber * 7 + dayIndex;
            const activityDate = new Date(firstDayOfMonth);
            activityDate.setDate(firstDayOfMonth.getDate() + daysToAdd);

            const formattedDate = activityDate.toISOString().split('T')[0];
            const currentValue = activityData[week]?.[metricId]?.[dayIndex] || false;
            const newValue = !currentValue;

            // Optimistic update
            const newData = { ...activityData };
            if (!newData[week]) {
                newData[week] = {
                    attendance: Array(7).fill(false),
                    tasks_assigned: Array(7).fill(false),
                    tasks_completed: Array(7).fill(false),
                    overtime: Array(7).fill(false)
                };
            }
            newData[week][metricId][dayIndex] = newValue;
            setActivityData(newData);

            // Send to backend
            await api.post(`/admin/workers/${workerId}/activity/toggle`, {
                activityDate: formattedDate,
                metricType: metricId,
                isChecked: newValue
            });
        } catch (error) {
            console.error('Error toggling activity:', error);
            Alert.alert('Error', 'Failed to update activity');
            // Revert on error
            fetchWorkerData();
        }
    };

    const getWeekProgress = (week: string) => {
        if (!activityData[week]) return 0;

        let totalChecks = 0;
        let filledChecks = 0;

        METRICS.forEach(m => {
            totalChecks += 7;
            filledChecks += activityData[week][m.id]?.filter(Boolean).length || 0;
        });

        return totalChecks > 0 ? Math.round((filledChecks / totalChecks) * 100) : 0;
    };

    const renderWeekColumn = (week: string, index: number) => {
        const progress = getWeekProgress(week);
        const weekData = activityData[week] || {
            attendance: Array(7).fill(false),
            tasks_assigned: Array(7).fill(false),
            tasks_completed: Array(7).fill(false),
            overtime: Array(7).fill(false)
        };

        return (
            <View key={week} style={[styles.weekCard, isMobile && styles.weekCardMobile]}>
                {/* Week Header */}
                <View style={styles.weekHeader}>
                    <Text style={[styles.weekTitle, isMobile && currentWeekIndex === index && styles.weekTitleActive]}>
                        {week}
                    </Text>
                    <View style={styles.weekHeaderDays}>
                        {(isMobile ? DAYS_SHORT : DAYS).map((day, dIdx) => (
                            <Text key={dIdx} style={[styles.dayText, isMobile && styles.dayTextMobile]}>
                                {day}
                            </Text>
                        ))}
                    </View>
                </View>

                {/* Grid Rows */}
                <View style={styles.gridContainer}>
                    {METRICS.map((metric) => (
                        <View key={metric.id} style={styles.gridRow}>
                            {weekData[metric.id].map((isChecked: boolean, dayIndex: number) => (
                                <TouchableOpacity
                                    key={dayIndex}
                                    style={[styles.checkboxContainer, isMobile && styles.checkboxContainerMobile]}
                                    onPress={() => toggleDay(week, metric.id, dayIndex)}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        style={[
                                            styles.checkbox,
                                            isMobile && styles.checkboxMobile,
                                            isChecked && { backgroundColor: metric.color, borderColor: metric.color },
                                            !isChecked && { borderColor: '#E5E7EB' }
                                        ]}
                                    >
                                        {isChecked && <Ionicons name="checkmark" size={isMobile ? 10 : 12} color="#fff" />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </View>

                {/* Completion Bar */}
                <View style={styles.completionContainer}>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.completionText}>{progress}%</Text>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B0000" />
                <Text style={styles.loadingText}>Loading worker data...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                    <Text style={styles.backText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Worker Info Card */}
                <View style={styles.workerCard}>
                    <View style={styles.workerHeader}>
                        <View style={styles.avatar}>
                            {worker?.profile_image ? (
                                <Image
                                    source={{ uri: `${api.defaults.baseURL?.replace('/api', '')}${worker.profile_image}` }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <Text style={styles.avatarText}>{worker?.name.charAt(0).toUpperCase()}</Text>
                            )}
                        </View>
                        <View style={styles.workerInfo}>
                            <Text style={styles.workerName}>{worker?.name}</Text>
                            <Text style={styles.workerRole}>{worker?.role.toUpperCase()}</Text>
                            <View style={styles.contactRow}>
                                <Ionicons name="call-outline" size={14} color="#6b7280" />
                                <Text style={styles.contactText}>{worker?.phone}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, worker?.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
                            <Text style={styles.statusText}>{worker?.status}</Text>
                        </View>
                    </View>

                    {/* Monthly Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Ionicons name="calendar-outline" size={20} color="#059669" />
                            <Text style={styles.statValue}>{monthlyStats?.attendance_days || 0}</Text>
                            <Text style={styles.statLabel}>Days Present</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                            <Text style={styles.statValue}>{monthlyStats?.tasks_completed || 0}</Text>
                            <Text style={styles.statLabel}>Tasks Done</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Ionicons name="moon-outline" size={20} color="#F59E0B" />
                            <Text style={styles.statValue}>{monthlyStats?.overtime_days || 0}</Text>
                            <Text style={styles.statLabel}>Overtime</Text>
                        </View>
                    </View>
                </View>

                {/* Daily Activity Log */}
                <View style={styles.activitySection}>
                    <Text style={styles.sectionTitle}>Daily Activity Log</Text>
                    <Text style={styles.sectionSubtitle}>Track attendance, tasks, and overtime</Text>

                    <View style={styles.activityDashboard}>
                        {/* Fixed Left Column (Metrics) */}
                        <View style={styles.leftColumn}>
                            <View style={styles.leftHeaderSpacer} />
                            {METRICS.map(metric => (
                                <View key={metric.id} style={styles.metricLabelRow}>
                                    <View style={[styles.iconBox, { backgroundColor: metric.color + '15' }]}>
                                        <Ionicons name={metric.icon as any} size={16} color={metric.color} />
                                    </View>
                                    <Text style={[styles.metricText, isMobile && styles.metricTextMobile]} numberOfLines={2}>
                                        {metric.label}
                                    </Text>
                                </View>
                            ))}
                            <View style={styles.rowSpacer}>
                                <Text style={styles.rowSpacerText}>Completion</Text>
                            </View>
                        </View>

                        {/* Scrollable Right Section (Weeks) */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={!isMobile}
                            pagingEnabled={isMobile}
                            onScroll={(e) => {
                                if (isMobile) {
                                    const offsetX = e.nativeEvent.contentOffset.x;
                                    const index = Math.round(offsetX / (width - 140));
                                    if (index !== currentWeekIndex && index >= 0 && index < WEEKS.length) {
                                        setCurrentWeekIndex(index);
                                    }
                                }
                            }}
                            scrollEventThrottle={16}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {WEEKS.map((week, index) => renderWeekColumn(week, index))}
                        </ScrollView>
                    </View>
                </View>

                {/* Productivity Trend */}
                <View style={styles.trendSection}>
                    <Text style={styles.sectionTitle}>Productivity Trend (Tasks Completed)</Text>
                    <View style={styles.trendContainer}>
                        {productivityTrend.map((item, index) => (
                            <View key={index} style={styles.trendItem}>
                                <Text style={styles.trendWeek}>{item.week}</Text>
                                <View style={styles.trendBar}>
                                    <View style={[styles.trendBarFill, { height: `${item.completionRate}%` }]} />
                                </View>
                                <Text style={styles.trendValue}>{item.completionRate}%</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    workerCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    workerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#8B0000',
    },
    workerInfo: {
        flex: 1,
    },
    workerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    workerRole: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8B0000',
        marginBottom: 4,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    contactText: {
        fontSize: 13,
        color: '#6B7280',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusActive: {
        backgroundColor: '#D1FAE5',
    },
    statusInactive: {
        backgroundColor: '#F3F4F6',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#065F46',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },
    activitySection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 16,
    },
    activityDashboard: {
        flexDirection: 'row',
    },
    leftColumn: {
        width: 120,
        borderRightWidth: 1,
        borderRightColor: '#F3F4F6',
        paddingRight: 12,
    },
    leftHeaderSpacer: {
        height: 60,
    },
    metricLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        marginBottom: 8,
    },
    iconBox: {
        width: 28,
        height: 28,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    metricText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
        flex: 1,
    },
    metricTextMobile: {
        fontSize: 10,
    },
    rowSpacer: {
        height: 30,
        justifyContent: 'center',
        marginBottom: 8,
    },
    rowSpacerText: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    scrollContent: {
        paddingLeft: 12,
        paddingRight: 12,
    },
    weekCard: {
        width: 260,
        marginRight: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 8,
    },
    weekCardMobile: {
        width: 220,
    },
    weekHeader: {
        height: 60,
        marginBottom: 8,
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    weekTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
        textAlign: 'center',
    },
    weekTitleActive: {
        color: '#111827',
        fontWeight: '700',
    },
    weekHeaderDays: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    dayText: {
        fontSize: 10,
        color: '#9CA3AF',
        width: 32,
        textAlign: 'center',
    },
    dayTextMobile: {
        fontSize: 9,
        width: 26,
    },
    gridContainer: {
        marginTop: 8,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 48,
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    checkboxContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxContainerMobile: {
        width: 26,
        height: 26,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    checkboxMobile: {
        width: 18,
        height: 18,
        borderRadius: 4,
    },
    completionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 30,
        marginBottom: 8,
        gap: 8,
        paddingHorizontal: 4,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4B5563',
        borderRadius: 3,
    },
    completionText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#374151',
        width: 32,
        textAlign: 'right',
    },
    trendSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    trendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 120,
        marginTop: 16,
    },
    trendItem: {
        alignItems: 'center',
        gap: 8,
    },
    trendWeek: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    trendBar: {
        width: 40,
        height: 80,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    trendBarFill: {
        width: '100%',
        backgroundColor: '#10B981',
        borderRadius: 4,
    },
    trendValue: {
        fontSize: 11,
        fontWeight: '700',
        color: '#374151',
    },
});

export default WorkerDetailScreen;
