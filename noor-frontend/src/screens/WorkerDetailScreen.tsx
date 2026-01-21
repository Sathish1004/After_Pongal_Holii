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
    Dimensions,
    TextInput as RNTextInput,
    Image,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart } from 'react-native-chart-kit';
import { BarChart } from 'react-native-gifted-charts';
import api from '../services/api';

interface WorkerDetailScreenProps {
    navigation: any;
    route: any;
}

interface ActivityData {
    [date: string]: {
        [metricId: string]: boolean | number;
        attendance: boolean;
        tasks_assigned: number;
        tasks_completed: number;
        tasks_pending: number;
        // Lock status
        attendance_locked: boolean;
        tasks_assigned_locked: boolean;
        tasks_completed_locked: boolean;
    };
};

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
}

const METRICS = [
    { id: 'attendance', label: 'Attendance', icon: 'time-outline', color: '#059669' },
    { id: 'tasks_assigned', label: 'Tasks Assigned', icon: 'list-outline', color: '#3B82F6' },
    { id: 'tasks_completed', label: 'Tasks Completed', icon: 'checkmark-circle-outline', color: '#F59E0B' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const WorkerDetailScreen: React.FC<WorkerDetailScreenProps> = ({ navigation, route }) => {
    const { workerId } = route.params;
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [worker, setWorker] = useState<WorkerDetails | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
    const [activityData, setActivityData] = useState<ActivityData>({});

    const [isLoading, setIsLoading] = useState(true);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

    // Date Range Filter State & Logic
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
        const mode = activeDateField;

        // Dismiss picker on Android automatically
        if (Platform.OS === 'android') {
            setActiveDateField(null);
        }

        if (event.type === 'dismissed') {
            setActiveDateField(null);
            return;
        }

        if (selectedDate && mode) {
            // Adjust for timezone offset to prevent day shift
            const offset = selectedDate.getTimezoneOffset() * 60000;
            const localDate = new Date(selectedDate.getTime() - offset);
            const dateStr = localDate.toISOString().split('T')[0];

            if (mode === 'from') {
                if (dateStr > toDate) {
                    Alert.alert('Invalid Range', 'From date cannot be after To date');
                } else {
                    setFromDate(dateStr);
                }
            } else {
                if (dateStr < fromDate) {
                    Alert.alert('Invalid Range', 'To date cannot be before From date');
                } else {
                    setToDate(dateStr);
                }
            }
        }

        // Close picker on other platforms
        if (Platform.OS !== 'android') setActiveDateField(null);
    };

    const formatDateDisplay = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    useEffect(() => {
        fetchWorkerData();
    }, [workerId, fromDate, toDate]);

    const fetchWorkerData = async () => {
        try {
            setIsLoading(true);

            // Fetch worker details
            const detailsResponse = await api.get(`/admin/workers/${workerId}/details`);
            setWorker(detailsResponse.data.worker);
            setMonthlyStats(detailsResponse.data.monthlyStats);

            // Fetch activity data with date range
            const activityResponse = await api.get(`/admin/workers/${workerId}/activity`, {
                params: {
                    startDate: fromDate,
                    endDate: toDate
                }
            });
            setActivityData(activityResponse.data.activityData || {});


        } catch (error) {
            console.error('Error fetching worker data:', error);
            Alert.alert('Error', 'Failed to load worker data');
        } finally {
            setIsLoading(false);
        }
    };



    // Calculate attendance percentage (Simplified)
    const calculateAttendancePercentage = () => {
        if (!monthlyStats) return 0;
        // Logic can be refined based on working days if needed
        return Math.round((monthlyStats.attendance_days / 30) * 100) || 0;
    };

    // Generate Calendar Mapped Weeks based on Date Range
    const calendarWeeks = React.useMemo(() => {
        const weeks = [];
        if (!fromDate || !toDate) return [];

        const start = new Date(fromDate);
        // Find Monday of the start week to ensure standard grid alignment
        const day = start.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);

        const gridStart = new Date(start);
        gridStart.setDate(diff);

        const end = new Date(toDate);
        const current = new Date(gridStart);

        let weekCount = 1;

        // Loop until we cover the end date range
        // Safety break at 52 weeks to prevent infinite loops
        while ((current <= end || current.getDay() !== 1) && weekCount < 53) {
            const weekDays: Date[] = [];
            for (let i = 0; i < 7; i++) {
                weekDays.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            weeks.push({ title: `Week ${weekCount}`, days: weekDays });
            weekCount++;

            // If we've passed the end date and just finished a Sunday (next is Monday), stop.
            if (current > end && current.getDay() === 1) break;
        }
        return weeks;
    }, [fromDate, toDate]);



    // NEW Graph Data Logic (Stacked Bars + Area)
    const graphData = React.useMemo(() => {
        if (!fromDate || !toDate) return null;

        const labels: string[] = [];
        const attendanceData: number[] = [];
        const taskStackedData: number[][] = [];
        let hasActivity = false;

        const start = new Date(fromDate);
        const end = new Date(toDate);
        const current = new Date(start);

        let index = 0;

        while (current <= end) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;

            // Format: "01 Jan"
            const labelStr = current.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

            // Sparse labels: First, Last, and every 5th
            if (index === 0 || current.getDate() === 1 || index % 5 === 0) {
                labels.push(labelStr);
            } else {
                labels.push('');
            }

            const dayData = activityData[dateKey];

            // Attendance Trend (Area - 100% or 0)
            const attVal = (dayData?.attendance && dayData?.attendance_locked) ? 100 : 0;
            attendanceData.push(attVal);
            if (attVal > 0) hasActivity = true;

            // Tasks (Stacked Bar - Counts)
            if (dayData?.tasks_assigned) {
                const isComp = (dayData.tasks_completed && dayData.tasks_completed_locked);
                if (isComp) {
                    taskStackedData.push([1, 0]); // 1 Completed (Blue), 0 Pending
                    hasActivity = true;
                } else {
                    taskStackedData.push([0, 1]); // 0 Completed, 1 Pending (Light Blue)
                    hasActivity = true;
                }
            } else {
                taskStackedData.push([0, 0]);
            }

            current.setDate(current.getDate() + 1);
            index++;
        }

        if (labels.length === 0) return null;

        return { labels, attendanceData, taskStackedData, hasActivity };
    }, [fromDate, toDate, activityData]);

    // NEW Graph Data Logic V2 (Grouped Bars + Area with Real Counts)
    const graphDataV2 = React.useMemo(() => {
        if (!fromDate || !toDate) return null;

        const labels: string[] = [];
        const attendanceData: number[] = [];
        const groupedBarData: any[] = [];
        let hasActivity = false;

        const start = new Date(fromDate);
        const end = new Date(toDate);
        const current = new Date(start);

        let index = 0;

        while (current <= end) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;

            const labelStr = current.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

            // Sparse labels for Area Chart
            if (index === 0 || current.getDate() === 1 || index % 5 === 0) {
                labels.push(labelStr);
            } else {
                labels.push('');
            }

            const dayData = activityData[dateKey];

            // Attendance Trend
            const attVal = (dayData?.attendance && dayData?.attendance_locked) ? 100 : 0;
            attendanceData.push(attVal);
            if (attVal > 0) hasActivity = true;

            // Tasks (Grouped Bars: Pending vs Done)
            const assigned = Number(dayData?.tasks_assigned || 0);
            const completed = Number(dayData?.tasks_completed || 0);
            const pending = (dayData?.tasks_pending !== undefined)
                ? Number(dayData.tasks_pending)
                : Math.max(0, assigned - completed);

            if (assigned > 0 || completed > 0) hasActivity = true;

            // Bar 1: Pending (Light Blue)
            groupedBarData.push({
                value: pending,
                frontColor: '#93C5FD',
                label: labelStr,
                labelTextStyle: { fontSize: 10, color: '#6B7280', width: 40, textAlign: 'center' },
                topLabelComponent: () => (
                    (pending > 0) ? <Text style={{ fontSize: 10, color: '#374151', marginBottom: 4, textAlign: 'center' }}>{pending}</Text> : null
                ),
                spacing: 4,
            });

            // Bar 2: Done (Dark Blue)
            groupedBarData.push({
                value: completed,
                frontColor: '#1E40AF',
                topLabelComponent: () => (
                    (completed > 0) ? <Text style={{ fontSize: 10, color: '#374151', marginBottom: 4, textAlign: 'center' }}>{completed}</Text> : null
                ),
                spacing: 24,
            });

            current.setDate(current.getDate() + 1);
            index++;
        }

        if (labels.length === 0) return null;

        return { labels, attendanceData, groupedBarData, hasActivity };
    }, [fromDate, toDate, activityData]);

    const renderWeekColumn = (week: { title: string, days: Date[] }, index: number) => {
        return (
            <View key={index} style={[styles.weekCard, isMobile && styles.weekCardMobile]}>
                {/* Week Title */}
                <View style={styles.weekTitleContainer}>
                    <Text style={styles.weekTitle}>{week.title}</Text>
                </View>

                {/* Day Headers - Spacer + 7 equal columns */}
                <View style={[styles.dayHeaderRow, isMobile && { paddingLeft: 0 }]}>
                    {/* Spacer for Label Column on Mobile */}
                    <View style={{ width: isMobile ? 80 : 70 }} />

                    {week.days.map((date, dayIndex) => {
                        const dayName = DAYS_SHORT[dayIndex]; // M, T, W...
                        const dayNum = date.getDate();
                        // Check if date is within selected range
                        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD checks
                        const isWithinRange = dateStr >= fromDate && dateStr <= toDate;

                        return (
                            <View key={dayIndex} style={[styles.dayHeaderCell, !isWithinRange && { opacity: 0.3 }]}>
                                {isMobile ? (
                                    <>
                                        <Text style={styles.dayLetterMobile}>{dayName}</Text>
                                        <Text style={styles.dayDateMobile}>{dayNum}</Text>
                                    </>
                                ) : (
                                    <Text style={styles.dayLetter}>{dayName}</Text>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Metric Rows */}
                {METRICS.map((metric) => (
                    <View key={metric.id} style={styles.metricRowContainer}>
                        {/* Metric Label */}
                        <View style={[styles.metricLabelCell, isMobile && { width: 80 }]}>
                            <View style={[styles.metricIconBadge, { backgroundColor: metric.color + '20' }]}>
                                <Ionicons name={metric.icon as any} size={14} color={metric.color} />
                            </View>
                            {/* Mobile: Show Label Inline */}
                            {isMobile && (
                                <Text style={[styles.metricLabelTextCompact, { fontSize: 10, marginLeft: 4 }]} numberOfLines={1}>
                                    {metric.label}
                                </Text>
                            )}
                            {/* Desktop: Hide Label */}
                            {!isMobile && (
                                <Text style={styles.metricLabelTextCompact} numberOfLines={1}>
                                    {metric.label.split(' ')[0]}
                                </Text>
                            )}
                        </View>

                        {/* 7 Checkbox Cells Mapped to Dates */}
                        {week.days.map((date, dayIndex) => {
                            // Construct Date Key YYYY-MM-DD
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const dateKey = `${year}-${month}-${day}`;

                            // Range Check
                            const isWithinRange = dateKey >= fromDate && dateKey <= toDate;
                            if (!isWithinRange) {
                                // Render Empty/Grey Box
                                return (
                                    <View key={dayIndex} style={[styles.checkboxCellContainer, isMobile && { paddingHorizontal: 3 }]}>
                                        <View style={[styles.statusBox, isMobile && styles.statusBoxMobile, { backgroundColor: '#F3F4F6', borderColor: 'transparent' }]} />
                                    </View>
                                );
                            }

                            // Data Lookup
                            const dayData = activityData[dateKey];
                            const isChecked = dayData?.[metric.id] || false;
                            const isLocked = dayData?.[`${metric.id}_locked`] || false;

                            const tooltipText = isChecked
                                ? (isLocked ? `${metric.label}: ✓ Approved` : `${metric.label}: Pending`)
                                : `${metric.label}: Not marked`;

                            return (
                                <View
                                    key={dayIndex}
                                    style={[styles.checkboxCellContainer, isMobile && { paddingHorizontal: 3 }]}
                                    onTouchEnd={() => {
                                        if (isMobile) {
                                            Alert.alert('Read-Only', tooltipText);
                                        }
                                    }}
                                >
                                    <View
                                        style={[
                                            styles.statusBox,
                                            isMobile ? styles.statusBoxMobile : null,
                                            (!!isChecked && isLocked) ? {
                                                backgroundColor: metric.color,
                                                borderColor: metric.color,
                                            } : null,
                                            (!!isChecked && !isLocked) ? {
                                                backgroundColor: '#FEF3C7',
                                                borderColor: '#F59E0B',
                                            } : null,
                                            (!isChecked) ? {
                                                backgroundColor: '#F9FAFB',
                                                borderColor: '#E5E7EB',
                                            } : null
                                        ]}
                                    >
                                        {!!isChecked && isLocked && (
                                            <Ionicons name="checkmark-circle" size={isMobile ? 18 : 14} color="#FFF" />
                                        )}
                                        {!!isChecked && !isLocked && (
                                            <Ionicons name="time-outline" size={isMobile ? 18 : 14} color="#F59E0B" />
                                        )}
                                        {isLocked && (
                                            <View style={styles.lockBadge}>
                                                <Ionicons name="lock-closed" size={7} color={metric.color} />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ))}
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

                    </View>
                </View>

                {/* Daily Activity Log */}
                <View style={styles.activitySection}>
                    <View style={[styles.activityHeader, isMobile && styles.activityHeaderMobile]}>
                        <View style={isMobile && styles.titleContainerMobile}>
                            <Text style={styles.sectionTitle}>Daily Activity Log</Text>
                            <Text style={styles.sectionSubtitle}>System-generated • Auto-recorded after admin approval</Text>
                        </View>

                        {/* Date Range Filter */}
                        <View style={[styles.dateFilterContainer, isMobile && styles.dateFilterContainerMobile]}>
                            <View style={[styles.dateInputGroup, isMobile && { width: '100%' }]}>
                                <Text style={styles.dateLabel}>From:</Text>
                                <TouchableOpacity
                                    style={[styles.dateInput, isMobile && styles.dateInputMobile]}
                                    onPress={() => setActiveDateField('from')}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                                        <Text style={{ fontSize: 12, color: '#111827' }}>{formatDateDisplay(fromDate)}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {!isMobile && <Text style={styles.dateSeparator}>→</Text>}

                            <View style={[styles.dateInputGroup, isMobile && { width: '100%' }]}>
                                <Text style={styles.dateLabel}>To:</Text>
                                <TouchableOpacity
                                    style={[styles.dateInput, isMobile && styles.dateInputMobile]}
                                    onPress={() => setActiveDateField('to')}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                                        <Text style={{ fontSize: 12, color: '#111827' }}>{formatDateDisplay(toDate)}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.applyButton, isMobile && { width: '100%', alignItems: 'center', marginTop: 4 }]}
                                onPress={() => fetchWorkerData()}
                            >
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>

                            {activeDateField && (
                                <DateTimePicker
                                    value={new Date(activeDateField === 'from' ? fromDate : toDate)}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                />
                            )}
                        </View>
                    </View>

                    <View style={styles.activityDashboard}>
                        {/* Fixed Left Column - HIDDEN ON MOBILE */}
                        {!isMobile && (
                            <View style={styles.leftColumn}>
                                <View style={styles.leftHeaderSpacer} />
                                {METRICS.map(metric => (
                                    <View key={metric.id} style={styles.metricLabelRow}>
                                        <View style={[styles.iconBox, { backgroundColor: metric.color + '15' }]}>
                                            <Ionicons name={metric.icon as any} size={16} color={metric.color} />
                                        </View>
                                        <Text style={styles.metricText} numberOfLines={2}>
                                            {metric.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Scrollable Right Section (Weeks) */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={!isMobile}
                            pagingEnabled={isMobile}
                            onScroll={(e) => {
                                const x = e.nativeEvent.contentOffset.x;
                                const index = Math.round(x / 300); // approx width
                                setCurrentWeekIndex(index);
                            }}
                            scrollEventThrottle={16}
                            contentContainerStyle={isMobile && { width: '100%' }}
                        >
                            {calendarWeeks.map((week, index) => renderWeekColumn(week, index))}
                        </ScrollView>
                    </View>
                </View>


                {graphDataV2 && (
                    <View style={styles.trendSection}>
                        <Text style={styles.trendTitle}>Activity Trend</Text>

                        {!graphDataV2.hasActivity ? (
                            <View style={{ padding: 24, alignItems: 'center' }}>
                                <Text style={{ color: '#9CA3AF', fontStyle: 'italic', marginBottom: 8 }}>No approved activity for selected date range</Text>
                            </View>
                        ) : (
                            <ScrollView
                                horizontal={isMobile}
                                pagingEnabled={isMobile}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={!isMobile ? { flexDirection: 'column', gap: 24 } : {}}
                            >
                                {/* Attendance - Area Graph */}
                                <View style={{ width: isMobile ? width - 56 : (width - 64), marginRight: isMobile ? 12 : 0 }}>
                                    <Text style={styles.graphTitle}>Attendance Trend</Text>
                                    <LineChart
                                        data={{
                                            labels: graphDataV2.labels,
                                            datasets: [{ data: graphDataV2.attendanceData }]
                                        }}
                                        width={isMobile ? width - 56 : (width - 64)}
                                        height={220}
                                        yAxisSuffix="%"
                                        chartConfig={{
                                            backgroundColor: "#fff",
                                            backgroundGradientFrom: "#fff",
                                            backgroundGradientTo: "#fff",
                                            decimalPlaces: 0,
                                            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                                            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                            propsForDots: { r: "0" },
                                            fillShadowGradientFrom: "#10B981",
                                            fillShadowGradientTo: "#10B981",
                                            fillShadowGradientFromOpacity: 0.3,
                                            fillShadowGradientToOpacity: 0.05,
                                        }}
                                        bezier
                                        style={{ borderRadius: 12 }}
                                        withInnerLines={false}
                                        withOuterLines={false}
                                        fromZero
                                        segments={2}
                                    />
                                </View>

                                {/* Tasks - Grouped Bars */}
                                <View style={{ width: isMobile ? width - 56 : (width - 64), marginLeft: isMobile ? 4 : 0 }}>
                                    <Text style={[styles.graphTitle, { color: '#3B82F6' }]}>Task Assignment vs Completion</Text>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4 }}>
                                        <View style={{ width: 12, height: 12, backgroundColor: '#93C5FD', marginRight: 4, borderRadius: 2 }} />
                                        <Text style={{ fontSize: 12, color: '#4B5563', marginRight: 16 }}>Pending</Text>
                                        <View style={{ width: 12, height: 12, backgroundColor: '#1E40AF', marginRight: 4, borderRadius: 2 }} />
                                        <Text style={{ fontSize: 12, color: '#4B5563' }}>Done</Text>
                                    </View>

                                    <BarChart
                                        data={graphDataV2.groupedBarData}
                                        barWidth={18}
                                        spacing={24}
                                        roundedTop
                                        roundedBottom
                                        hideRules
                                        xAxisThickness={0}
                                        yAxisThickness={0}
                                        yAxisTextStyle={{ color: '#9CA3AF' }}
                                        noOfSections={3}
                                        height={220}
                                        width={isMobile ? width - 56 : (width - 64)}
                                    />
                                </View>
                            </ScrollView>
                        )}
                    </View>
                )}

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
        padding: 16,
        overflow: 'hidden',
    },
    weekCardMobile: {
        width: '100%',
        marginRight: 0, // No margin on mobile
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

    // ===== NEW GRID-BASED ACTIVITY LOG STYLES =====
    weekTitleContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1.5,
        borderBottomColor: '#E5E7EB',
        marginBottom: 12,
    },
    weekTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },

    // Day Header Row - 7 Equal Columns
    dayHeaderRow: {
        flexDirection: 'row',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 8,
    },
    dayHeaderCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    dayLetter: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
    },
    dayLetterMobile: {
        fontSize: 9,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 2,
    },
    dayDateMobile: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
    },
    dayMonthMobile: {
        fontSize: 8,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
    },

    // Metric Row Container - Holds label + 7 checkboxes
    metricRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        minHeight: 36,
    },
    metricLabelCell: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 70,
        marginRight: 8,
    },
    metricIconBadge: {
        width: 20,
        height: 20,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    metricLabelTextCompact: {
        fontSize: 9,
        fontWeight: '600',
        color: '#4B5563',
        flex: 1,
    },

    // Checkbox Cell Container - Each day column
    checkboxCellContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4, // 8px total gap (4px each side)
        paddingVertical: 6, // 12px total gap (6px top + 6px bottom)
    },
    statusBox: {
        width: 28,
        height: 28,
        borderRadius: 7,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    statusBoxMobile: {
        width: 28,
        height: 28,
        borderRadius: 6,
    },
    dateInBox: {
        position: 'absolute',
        bottom: 2,
        fontSize: 8,
        fontWeight: '700',
        color: '#6B7280',
    },
    lockBadge: {
        position: 'absolute',
        bottom: -3,
        right: -3,
        backgroundColor: '#FFF',
        borderRadius: 8,
        width: 14,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Date Filter Styles
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    activityHeaderMobile: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 12,
    },
    titleContainerMobile: {
        marginBottom: 4,
    },
    dateFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    dateFilterContainerMobile: {
        width: '100%',
        flexDirection: 'column',
        gap: 8,
    },
    dateText: {
        fontSize: 12,
        color: '#111827',
        fontWeight: '500',
    },
    dateInputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
    },
    dateInput: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 6,
        padding: 6,
        fontSize: 11,
        minWidth: 100,
        color: '#111827',
    },
    dateInputMobile: {
        minWidth: 80,
        flex: 1,
    },

    dateSeparator: {
        fontSize: 14,
        color: '#9CA3AF',
        marginHorizontal: 4,
    },
    applyButton: {
        backgroundColor: '#059669',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    applyButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
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
    trendTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
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
    graphTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#059669',
        marginBottom: 8,
    },
});

export default WorkerDetailScreen;
