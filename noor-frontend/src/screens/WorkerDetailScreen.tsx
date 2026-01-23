import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
    Platform,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { BarChart } from 'react-native-gifted-charts';
import api from '../services/api';

interface WorkerDetailScreenProps {
    navigation: any;
    route: any;
}

interface WorkerDetails {
    id: number;
    name: string;
    email: string | null;
    phone: string;
    role: string;
    status: string;
    profile_image?: string;

    // Detailed stats now part of worker object
    tasksAssigned: number;
    tasksCompleted: number;
    tasksOverdue: number;
    performancePercentage: number;
    performanceLabel: string;
}

// Activity Log Data Type for CHARTS
// We still use this for the charts
interface PerformanceStats {
    attendance_days: number;
    performance_breakdown: {
        onTime: number;
        late: number;
        overdue: number;
        ongoing: number;
    };
}

interface Task {
    id: number;
    status: string;
    created_at: string;
    due_date: string | null;
    completed_at: string | null;
}

const WorkerDetailScreen: React.FC<WorkerDetailScreenProps> = ({ navigation, route }) => {
    const { workerId } = route.params;
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [worker, setWorker] = useState<WorkerDetails | null>(null);
    const [stats, setStats] = useState<PerformanceStats | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    // Date Range Filter
    const [fromDate, setFromDate] = useState(() => {
        const date = new Date();
        date.setDate(1); // First day of current month
        return date.toISOString().split('T')[0];
    });
    const [toDate, setToDate] = useState(() => {
        const date = new Date();
        return date.toISOString().split('T')[0];
    });
    const [activeDateField, setActiveDateField] = useState<'from' | 'to' | null>(null);

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (event.type === 'dismissed') {
            setActiveDateField(null);
            return;
        }
        if (selectedDate && activeDateField) {
            const offset = selectedDate.getTimezoneOffset() * 60000;
            const localDate = new Date(selectedDate.getTime() - offset);
            const dateStr = localDate.toISOString().split('T')[0];
            if (activeDateField === 'from') {
                if (dateStr > toDate) Alert.alert('Invalid Range', 'From date cannot be after To date');
                else setFromDate(dateStr);
            } else {
                if (dateStr < fromDate) Alert.alert('Invalid Range', 'To date cannot be before From date');
                else setToDate(dateStr);
            }
        }
        if (Platform.OS !== 'android') setActiveDateField(null);
    };

    useEffect(() => {
        fetchData();
    }, [workerId, fromDate, toDate]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/admin/workers/${workerId}/details`, {
                params: { startDate: fromDate, endDate: toDate }
            });
            setWorker(response.data.worker);
            setStats(response.data.monthlyStats);
            setTasks(response.data.tasks || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to load worker data');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Charts Logic ---
    const barChartData = useMemo(() => {
        if (!stats) return [];
        const { onTime, late, overdue, ongoing } = stats.performance_breakdown;
        const total = onTime + late + overdue + ongoing;
        const getPct = (val: number) => total > 0 ? Math.round((val / total) * 100) : 0;

        return [
            { value: onTime, label: 'Completed', frontColor: '#10B981', topLabelComponent: () => <Text style={styles.chartLabel}>{getPct(onTime)}%</Text> },
            { value: late, label: 'Late', frontColor: '#F59E0B', topLabelComponent: () => <Text style={styles.chartLabel}>{getPct(late)}%</Text> },
            { value: overdue, label: 'Overdue', frontColor: '#EF4444', topLabelComponent: () => <Text style={styles.chartLabel}>{getPct(overdue)}%</Text> },
            { value: ongoing, label: 'Ongoing', frontColor: '#3B82F6', topLabelComponent: () => <Text style={styles.chartLabel}>{getPct(ongoing)}%</Text> },
        ];
    }, [stats]);

    const pieChartData = useMemo(() => {
        if (!stats) return [];
        const { onTime, late, overdue, ongoing } = stats.performance_breakdown;
        const total = onTime + late + overdue + ongoing;
        
        if (total === 0) return [];

        return [
            {
                name: 'On Time',
                population: onTime,
                color: '#10B981',
                legendFontColor: '#374151',
                legendFontSize: 12,
            },
            {
                name: 'Late',
                population: late,
                color: '#F59E0B',
                legendFontColor: '#374151',
                legendFontSize: 12,
            },
            {
                name: 'Overdue',
                population: overdue,
                color: '#EF4444',
                legendFontColor: '#374151',
                legendFontSize: 12,
            },
            {
                name: 'Ongoing',
                population: ongoing,
                color: '#3B82F6',
                legendFontColor: '#374151',
                legendFontSize: 12,
            },
        ].filter(item => item.population > 0); // Only show non-zero values
    }, [stats]);

    const trendChartData = useMemo(() => {
        if (!tasks.length || !fromDate || !toDate) return null;
        const labels: string[] = [];
        const onTimeData: number[] = [];
        const lateData: number[] = [];
        const overdueData: number[] = [];
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const current = new Date(start);
        let index = 0;

        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            if (index === 0 || current.getDate() === 1 || index % 5 === 0) {
                labels.push(current.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
            } else {
                labels.push('');
            }
            let dOnTime = 0, dLate = 0, dOverdue = 0;
            for (const t of tasks) {
                const completedAt = t.completed_at ? t.completed_at.split('T')[0] : null;
                const dueDate = t.due_date ? t.due_date.split('T')[0] : null;
                if (completedAt === dateStr) {
                    if (!dueDate || completedAt <= dueDate) dOnTime++; else dLate++;
                }
                if (dueDate === dateStr) {
                    const isDoneByNow = completedAt && completedAt <= dateStr;
                    if (!isDoneByNow) dOverdue++;
                }
            }
            onTimeData.push(dOnTime);
            lateData.push(dLate);
            overdueData.push(dOverdue);
            current.setDate(current.getDate() + 1);
            index++;
        }
        if (labels.length === 0) return null;
        return {
            labels,
            datasets: [
                { data: onTimeData, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, strokeWidth: 2 },
                { data: lateData, color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, strokeWidth: 2 },
                { data: overdueData, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, strokeWidth: 2 },
            ],
            legend: ["On Time", "Late", "Overdue"]
        };
    }, [tasks, fromDate, toDate]);

    // --- Render ---

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B0000" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading worker details...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header / Nav */}
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                    <Text style={styles.backText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* 1. Profile Header Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatar}>
                            {worker?.profile_image ? (
                                <Image source={{ uri: worker.profile_image }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{worker?.name?.charAt(0).toUpperCase()}</Text>
                            )}
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{worker?.name}</Text>
                            <Text style={styles.profileRole}>{worker?.role.toUpperCase()}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <Ionicons name="call-outline" size={14} color="#6B7280" />
                                <Text style={styles.profilePhone}>{worker?.phone}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, worker?.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
                            <Text style={styles.statusText}>{worker?.status}</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Stats Cards Row */}
                <View style={styles.statsContainer}>
                    <View style={styles.summaryRow}>

                        {/* Tasks Assigned */}
                        <View style={styles.summaryCard}>
                            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                                <Ionicons name="clipboard-outline" size={18} color="#3B82F6" />
                            </View>
                            <Text style={styles.summaryValue}>{worker?.tasksAssigned || 0}</Text>
                            <Text style={styles.summaryLabel}>Tasks Assigned</Text>
                        </View>

                        {/* Tasks Completed */}
                        <View style={styles.summaryCard}>
                            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                                <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                            </View>
                            <Text style={styles.summaryValue}>{worker?.tasksCompleted || 0}</Text>
                            <Text style={styles.summaryLabel}>Tasks Completed</Text>
                        </View>

                        {/* Tasks Overdue */}
                        <View style={styles.summaryCard}>
                            <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                            </View>
                            <Text style={styles.summaryValue}>{worker?.tasksOverdue || 0}</Text>
                            <Text style={styles.summaryLabel}>Tasks Overdue</Text>
                        </View>

                        {/* Performance Score */}
                        <View style={styles.summaryCard}>
                            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                                <Ionicons name="speedometer-outline" size={18} color="#059669" />
                            </View>
                            <Text style={styles.summaryValue}>{worker?.performancePercentage || 0}%</Text>
                            <Text style={[styles.summarySubLabel,
                                (worker?.performanceLabel === 'Good') ? { color: '#10B981' } :
                                    (worker?.performanceLabel === 'Average') ? { color: '#F59E0B' } :
                                        { color: '#EF4444' }
                            ]}>
                                {worker?.performanceLabel}
                            </Text>
                        </View>

                    </View>
                </View>

                {/* 3. Performance Overview Chart */}
                <View style={styles.chartCard}>
                    <Text style={styles.sectionTitle}>Performance Overview</Text>
                    <View style={{ height: 180, marginTop: 12 }}>
                        <BarChart
                            data={barChartData}
                            barWidth={32}
                            spacing={40}
                            roundedTop
                            hideRules
                            yAxisThickness={0}
                            xAxisThickness={0}
                            yAxisTextStyle={{ color: '#9CA3AF' }}
                            noOfSections={4}
                            maxValue={Math.max(10, Math.max(...barChartData.map(d => d.value)) * 1.2)}
                        />
                    </View>
                </View>

                {/* 4. Due Date vs Completion Pie Chart */}
                {pieChartData.length > 0 && (
                    <View style={styles.chartCard}>
                        <Text style={styles.sectionTitle}>Due Date vs Completion Breakdown</Text>
                        <View style={styles.pieChartContainer}>
                            <PieChart
                                data={pieChartData}
                                width={width - 64}
                                height={220}
                                chartConfig={{
                                    backgroundColor: '#fff',
                                    backgroundGradientFrom: '#fff',
                                    backgroundGradientTo: '#fff',
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                }}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                center={[10, 50]}
                                absolute
                            />
                        </View>
                    </View>
                )}

                {/* 5. Trends Chart */}
                {trendChartData && (
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <Text style={styles.sectionTitle}>Due Date vs Completion Trends</Text>
                        </View>
                        {/* Date Filter Inputs */}
                        <View style={styles.dateFilterRow}>
                            <DateInput label="From" date={fromDate} onPress={() => setActiveDateField('from')} />
                            <Text style={styles.arrow}>→</Text>
                            <DateInput label="To" date={toDate} onPress={() => setActiveDateField('to')} />
                            <TouchableOpacity style={styles.applyBtn} onPress={fetchData}>
                                <Text style={styles.applyText}>Apply</Text>
                            </TouchableOpacity>
                        </View>

                        <LineChart
                            data={{
                                labels: trendChartData.labels,
                                datasets: trendChartData.datasets,
                                legend: trendChartData.legend
                            }}
                            width={width - 64} // Padding compensation
                            height={180}
                            chartConfig={{
                                backgroundColor: "#fff",
                                backgroundGradientFrom: "#fff",
                                backgroundGradientTo: "#fff",
                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // Gray 500
                                propsForDots: { r: "3" },
                                strokeWidth: 2,
                            }}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 8 }}
                        />
                    </View>
                )}

                <View style={{ height: 20 }} />

                {activeDateField && (
                    <DateTimePicker
                        value={new Date(activeDateField === 'from' ? fromDate : toDate)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                    />
                )}
            </ScrollView>
        </View>
    );
};

// --- Atomic Components ---

const DateInput = ({ label, date, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={styles.dateInput}>
        <Ionicons name="calendar-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
        <Text style={styles.dateText}>{date ? new Date(date).toLocaleDateString('en-GB') : label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    navHeader: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E5E7EB' },
    backButton: { flexDirection: 'row', alignItems: 'center' },
    backText: { fontSize: 16, fontWeight: '600', marginLeft: 8, color: '#111827' },

    scrollContent: { padding: 16 },

    // Profile Card - Separate from stats
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },

    // Profile Section
    profileHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    avatarText: { fontSize: 24, color: '#991B1B', fontWeight: 'bold' },
    avatarImage: { width: 56, height: 56, borderRadius: 28 },

    profileInfo: { flex: 1 },
    profileName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    profileRole: { fontSize: 11, color: '#DC2626', fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 },
    profilePhone: { fontSize: 13, color: '#6B7280', marginLeft: 4 },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start' },
    statusActive: { backgroundColor: '#D1FAE5' },
    statusInactive: { backgroundColor: '#F3F4F6' },
    statusText: { fontSize: 11, fontWeight: '700', color: '#059669' },

    // Stats Container - Separate card
    statsContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },

    // Summary Row - Equal width cards in single row
    summaryRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        gap: 12
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FCFCFC',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'center',
        minHeight: 100
    },
    iconBox: { 
        width: 28, 
        height: 28, 
        borderRadius: 6, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 8 
    },
    summaryLabel: { 
        fontSize: 10, 
        fontWeight: '600', 
        color: '#6B7280', 
        textAlign: 'center',
        marginBottom: 4,
        lineHeight: 12
    },
    summaryValue: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#111827', 
        marginBottom: 2,
        textAlign: 'center'
    },
    summarySubLabel: { 
        fontSize: 9, 
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 11
    },

    // Charts - More compact
    chartCard: { 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 16, 
        shadowColor: '#000', 
        shadowOpacity: 0.05, 
        shadowRadius: 4,
        elevation: 1 
    },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    sectionSubtitle: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
    chartLabel: { fontSize: 10, color: '#4B5563', marginBottom: 4, width: 30, textAlign: 'center' },
    
    // Pie Chart Container
    pieChartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },

    // Date Filter
    dateFilterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    dateInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
    dateText: { fontSize: 11, color: '#374151' },
    arrow: { marginHorizontal: 8, color: '#9CA3AF' },
    applyBtn: { backgroundColor: '#059669', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginLeft: 'auto' },
    applyText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});

export default WorkerDetailScreen;
