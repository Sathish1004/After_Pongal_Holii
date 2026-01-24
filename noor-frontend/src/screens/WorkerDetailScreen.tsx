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
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
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
    title?: string;
    category?: string;
    project_name?: string;
    site_name?: string;
}

interface GanttTask {
    id: number;
    name: string;
    projectName: string;
    category: string;
    startDate: Date;
    endDate: Date;
    status: 'completed' | 'ongoing' | 'delayed';
    delayDays?: number;
}

const WorkerDetailScreen: React.FC<WorkerDetailScreenProps> = ({ navigation, route }) => {
    const { workerId } = route.params;
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [worker, setWorker] = useState<WorkerDetails | null>(null);
    const [stats, setStats] = useState<PerformanceStats | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [workerId]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/admin/workers/${workerId}/details`);
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
    // Gantt Chart Data
    const ganttData = useMemo(() => {
        if (!tasks.length) return [];
        
        return tasks.map(task => {
            const startDate = new Date(task.created_at);
            const dueDate = task.due_date ? new Date(task.due_date) : new Date();
            const completedDate = task.completed_at ? new Date(task.completed_at) : null;
            
            let status: 'completed' | 'ongoing' | 'delayed' = 'ongoing';
            let delayDays = 0;
            
            if (completedDate) {
                status = completedDate > dueDate ? 'delayed' : 'completed';
                if (status === 'delayed') {
                    delayDays = Math.ceil((completedDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                }
            } else if (new Date() > dueDate) {
                status = 'delayed';
                delayDays = Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            }
            
            return {
                id: task.id,
                name: task.title || `Task #${task.id}`,
                projectName: task.project_name || task.site_name || 'Unknown Project',
                category: task.category || 'General',
                startDate,
                endDate: completedDate || dueDate,
                status,
                delayDays
            } as GanttTask;
        }).slice(0, 10); // Show max 10 tasks for better mobile view
    }, [tasks]);

    const trendChartData = useMemo(() => {
        if (!tasks.length) return null;
        
        // Use last 30 days as default range
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        
        const dateMap = new Map<string, { 
            onTime: number; 
            late: number; 
            overdue: number;
            onTimeProjects: string[];
            lateProjects: string[];
            overdueProjects: string[];
        }>();
        const current = new Date(start);

        // Initialize all dates with 0 values
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            dateMap.set(dateStr, { 
                onTime: 0, 
                late: 0, 
                overdue: 0,
                onTimeProjects: [],
                lateProjects: [],
                overdueProjects: []
            });
            current.setDate(current.getDate() + 1);
        }

        // Populate data from tasks
        for (const t of tasks) {
            const completedAt = t.completed_at ? t.completed_at.split('T')[0] : null;
            const dueDate = t.due_date ? t.due_date.split('T')[0] : null;
            const projectName = t.project_name || t.site_name || 'Unknown Project';
            
            if (completedAt && dateMap.has(completedAt)) {
                const data = dateMap.get(completedAt)!;
                if (!dueDate || completedAt <= dueDate) {
                    data.onTime++;
                    data.onTimeProjects.push(projectName);
                } else {
                    data.late++;
                    data.lateProjects.push(projectName);
                }
            }
            
            if (dueDate && dateMap.has(dueDate)) {
                const isDoneByNow = completedAt && completedAt <= dueDate;
                if (!isDoneByNow) {
                    const data = dateMap.get(dueDate)!;
                    data.overdue++;
                    data.overdueProjects.push(projectName);
                }
            }
        }

        // Convert to array format for chart
        const sortedDates = Array.from(dateMap.keys()).sort();
        const onTimeData: any[] = [];
        const lateData: any[] = [];
        const overdueData: any[] = [];

        sortedDates.forEach((dateStr, index) => {
            const data = dateMap.get(dateStr)!;
            const date = new Date(dateStr);
            const label = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            const fullDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            
            onTimeData.push({
                value: data.onTime,
                label: index % 3 === 0 ? label : '',
                labelTextStyle: { color: '#6B7280', fontSize: 10, fontWeight: '600' },
                dataPointText: data.onTime.toString(),
                date: fullDate,
                projectName: data.onTimeProjects.join(', ') || 'No Projects',
                status: 'On Time',
                customDataPoint: () => (
                    <View style={{
                        width: 10,
                        height: 10,
                        backgroundColor: '#1F9D55',
                        borderRadius: 5,
                        borderWidth: 2,
                        borderColor: '#fff',
                    }} />
                ),
            });

            lateData.push({
                value: data.late,
                label: '',
                dataPointText: data.late.toString(),
                date: fullDate,
                projectName: data.lateProjects.join(', ') || 'No Projects',
                status: 'Late',
                customDataPoint: () => (
                    <View style={{
                        width: 10,
                        height: 10,
                        backgroundColor: '#F59E0B',
                        borderRadius: 5,
                        borderWidth: 2,
                        borderColor: '#fff',
                    }} />
                ),
            });

            overdueData.push({
                value: data.overdue,
                label: '',
                dataPointText: data.overdue.toString(),
                date: fullDate,
                projectName: data.overdueProjects.join(', ') || 'No Projects',
                status: 'Overdue',
                customDataPoint: () => (
                    <View style={{
                        width: 10,
                        height: 10,
                        backgroundColor: '#DC2626',
                        borderRadius: 5,
                        borderWidth: 2,
                        borderColor: '#fff',
                    }} />
                ),
            });
        });

        return {
            onTimeData,
            lateData,
            overdueData,
        };
    }, [tasks]);

    // --- Render ---

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B0000" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading worker details...</Text>
            </View>
        );
    }

    // Gantt Chart Helper Functions (inside component to access worker state)
    const generateTimelineHeaders = () => {
        const headers = [];
        const today = new Date();
        
        for (let i = -2; i <= 8; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + (i * 7));
            const weekLabel = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            
            headers.push(
                <View key={i} style={styles.ganttHeaderCell}>
                    <Text style={styles.ganttHeaderCellText}>{weekLabel}</Text>
                </View>
            );
        }
        
        return headers;
    };

    const renderGanttBar = (task: GanttTask) => {
        const today = new Date();
        const startOfTimeline = new Date(today);
        startOfTimeline.setDate(today.getDate() - 14); // 2 weeks before
        
        const endOfTimeline = new Date(today);
        endOfTimeline.setDate(today.getDate() + 56); // 8 weeks after
        
        const totalDays = Math.ceil((endOfTimeline.getTime() - startOfTimeline.getTime()) / (1000 * 60 * 60 * 24));
        const taskStartDays = Math.ceil((task.startDate.getTime() - startOfTimeline.getTime()) / (1000 * 60 * 60 * 24));
        const taskDuration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const leftPosition = (taskStartDays / totalDays) * 100;
        const barWidth = (taskDuration / totalDays) * 100;
        
        const getBarColor = () => {
            switch (task.status) {
                case 'completed': return ['#10B981', '#059669'];
                case 'ongoing': return ['#3B82F6', '#2563EB'];
                case 'delayed': return ['#EF4444', '#DC2626'];
                default: return ['#9CA3AF', '#6B7280'];
            }
        };
        
        const [startColor, endColor] = getBarColor();
        
        return (
            <View style={styles.ganttBarContainer}>
                <View 
                    style={[
                        styles.ganttBar,
                        {
                            left: `${Math.max(0, leftPosition)}%`,
                            width: `${Math.min(barWidth, 100 - leftPosition)}%`,
                            backgroundColor: startColor,
                        }
                    ]}
                >
                    <Text style={styles.ganttBarText} numberOfLines={1}>
                        {worker?.name || 'Worker'}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header / Nav */}
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                    <Text style={styles.backText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
            >

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

                {/* 3. Gantt Chart - Task Timeline */}
                {ganttData.length > 0 && (
                    <View style={styles.ganttFullWidthSection}>
                        <View style={styles.ganttHeaderSection}>
                            <Text style={styles.sectionTitle}>Task Timeline</Text>
                            <Text style={styles.sectionSubtitle}>Worker task schedule and progress</Text>
                        </View>
                        
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={true} 
                            style={styles.ganttScrollContainer}
                            nestedScrollEnabled={true}
                        >
                            <View style={styles.ganttContainer}>
                                {/* Timeline Header */}
                                <View style={styles.ganttHeader}>
                                    <View style={styles.ganttTaskNameColumn}>
                                        <Text style={styles.ganttHeaderText}>Task</Text>
                                    </View>
                                    <View style={styles.ganttTimelineColumn}>
                                        {generateTimelineHeaders()}
                                    </View>
                                </View>
                                
                                {/* Task Rows */}
                                {ganttData.map((task, index) => (
                                    <View key={task.id} style={[styles.ganttRow, index % 2 === 0 && styles.ganttRowAlt]}>
                                        <View style={styles.ganttTaskNameColumn}>
                                            <Text style={styles.ganttTaskName} numberOfLines={1}>{task.name}</Text>
                                            <Text style={styles.ganttProjectName} numberOfLines={1}>{task.projectName}</Text>
                                        </View>
                                        <View style={styles.ganttTimelineColumn}>
                                            {renderGanttBar(task)}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                        
                        {/* Legend */}
                        <View style={styles.ganttLegend}>
                            <View style={styles.ganttLegendItem}>
                                <View style={[styles.ganttLegendDot, { backgroundColor: '#10B981' }]} />
                                <Text style={styles.ganttLegendText}>Completed</Text>
                            </View>
                            <View style={styles.ganttLegendItem}>
                                <View style={[styles.ganttLegendDot, { backgroundColor: '#3B82F6' }]} />
                                <Text style={styles.ganttLegendText}>Ongoing</Text>
                            </View>
                            <View style={styles.ganttLegendItem}>
                                <View style={[styles.ganttLegendDot, { backgroundColor: '#EF4444' }]} />
                                <Text style={styles.ganttLegendText}>Delayed</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* 4. Trends Chart */}
                {trendChartData && (
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <Text style={styles.sectionTitle}>Due Date vs Completion Trends</Text>
                        </View>

                        {/* Legend Buttons */}
                        <View style={styles.trendLegendButtonContainer}>
                            <View style={[styles.trendLegendButton, { backgroundColor: '#1F9D55' }]}>
                                <View style={[styles.trendLegendButtonDot, { backgroundColor: '#fff' }]} />
                                <Text style={styles.trendLegendButtonText}>On Time</Text>
                            </View>
                            <View style={[styles.trendLegendButton, { backgroundColor: '#F59E0B' }]}>
                                <View style={[styles.trendLegendButtonDot, { backgroundColor: '#fff' }]} />
                                <Text style={styles.trendLegendButtonText}>Late</Text>
                            </View>
                            <View style={[styles.trendLegendButton, { backgroundColor: '#EF4444' }]}>
                                <View style={[styles.trendLegendButtonDot, { backgroundColor: '#fff' }]} />
                                <Text style={styles.trendLegendButtonText}>Overdue</Text>
                            </View>
                        </View>

                        {/* Chart Container with Fixed Y-Axis */}
                        <View style={styles.trendChartContainer}>
                            {/* Fixed Y-Axis */}
                            <View style={styles.trendYAxisContainer}>
                                {[25, 20, 15, 10, 5, 0].map((label, index) => (
                                    <View key={index} style={styles.trendYAxisLabelContainer}>
                                        <Text style={styles.trendYAxisLabel}>{label}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Scrollable Chart Area */}
                            <View style={styles.trendChartScrollWrapper}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    bounces={false}
                                    nestedScrollEnabled={true}
                                >
                                    <View style={styles.trendChartInner}>
                                        {/* On Time Line Chart */}
                                        <LineChart
                                            data={trendChartData.onTimeData}
                                            width={Math.max(width - 100, trendChartData.onTimeData.length * 45)}
                                            height={260}
                                            maxValue={25}
                                            noOfSections={5}
                                            stepValue={5}
                                            spacing={45}
                                            initialSpacing={10}
                                            endSpacing={10}
                                            yAxisThickness={0}
                                            xAxisThickness={2}
                                            xAxisColor="#DC2626"
                                            hideYAxisText={true}
                                            rulesType="dashed"
                                            rulesColor="#E5E7EB"
                                            dashWidth={4}
                                            dashGap={6}
                                            color="#1F9D55"
                                            thickness={3}
                                            curved
                                            areaChart
                                            startFillColor="rgba(31, 157, 85, 0.4)"
                                            endFillColor="rgba(31, 157, 85, 0.1)"
                                            startOpacity={0.9}
                                            endOpacity={0.2}
                                            isAnimated
                                            animationDuration={1200}
                                            hideDataPoints={false}
                                            dataPointsHeight={10}
                                            dataPointsWidth={10}
                                            dataPointsColor="#1F9D55"
                                            dataPointsRadius={5}
                                            hideOrigin={false}
                                            yAxisOffset={0}
                                            showVerticalLines={false}
                                            pointerConfig={{
                                                pointerStripHeight: 240,
                                                pointerStripColor: '#1F9D55',
                                                pointerStripWidth: 2,
                                                pointerColor: '#1F9D55',
                                                radius: 6,
                                                pointerLabelWidth: 160,
                                                pointerLabelHeight: 100,
                                                activatePointersOnLongPress: false,
                                                autoAdjustPointerLabelPosition: true,
                                                pointerLabelComponent: (items: any) => {
                                                    const item = items[0];
                                                    return (
                                                        <View style={styles.simpleTooltipContainer}>
                                                            <View style={[styles.simpleTooltipHeader, { backgroundColor: '#2D5F3F' }]}>
                                                                <Text style={styles.simpleTooltipDate}>{item.label || item.date}</Text>
                                                            </View>
                                                            <View style={styles.simpleTooltipBody}>
                                                                <Text style={[styles.simpleTooltipStatus, { color: '#1F9D55' }]}>
                                                                    {item.status}
                                                                </Text>
                                                                <Text style={styles.simpleTooltipValue}>
                                                                    {item.value} Completions
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    );
                                                },
                                            }}
                                        />

                                        {/* Late Line Chart - Overlay */}
                                        <View style={styles.overlayChart}>
                                            <LineChart
                                                data={trendChartData.lateData}
                                                width={Math.max(width - 100, trendChartData.lateData.length * 45)}
                                                height={260}
                                                maxValue={25}
                                                noOfSections={5}
                                                stepValue={5}
                                                spacing={45}
                                                initialSpacing={10}
                                                endSpacing={10}
                                                yAxisThickness={0}
                                                xAxisThickness={0}
                                                hideYAxisText={true}
                                                hideRules={true}
                                                color="#F59E0B"
                                                thickness={3}
                                                curved
                                                areaChart
                                                startFillColor="rgba(245, 158, 11, 0.4)"
                                                endFillColor="rgba(245, 158, 11, 0.1)"
                                                startOpacity={0.9}
                                                endOpacity={0.2}
                                                isAnimated
                                                animationDuration={1200}
                                                hideDataPoints={false}
                                                dataPointsHeight={10}
                                                dataPointsWidth={10}
                                                dataPointsColor="#F59E0B"
                                                dataPointsRadius={5}
                                                hideOrigin={false}
                                                yAxisOffset={0}
                                                showVerticalLines={false}
                                                pointerConfig={{
                                                    pointerStripHeight: 240,
                                                    pointerStripColor: '#F59E0B',
                                                    pointerStripWidth: 2,
                                                    pointerColor: '#F59E0B',
                                                    radius: 6,
                                                    pointerLabelWidth: 160,
                                                    pointerLabelHeight: 100,
                                                    activatePointersOnLongPress: false,
                                                    autoAdjustPointerLabelPosition: true,
                                                    pointerLabelComponent: (items: any) => {
                                                        const item = items[0];
                                                        return (
                                                            <View style={styles.simpleTooltipContainer}>
                                                                <View style={[styles.simpleTooltipHeader, { backgroundColor: '#B45309' }]}>
                                                                    <Text style={styles.simpleTooltipDate}>{item.label || item.date}</Text>
                                                                </View>
                                                                <View style={styles.simpleTooltipBody}>
                                                                    <Text style={[styles.simpleTooltipStatus, { color: '#F59E0B' }]}>
                                                                        {item.status}
                                                                    </Text>
                                                                    <Text style={styles.simpleTooltipValue}>
                                                                        {item.value} Completions
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        );
                                                    },
                                                }}
                                            />
                                        </View>

                                        {/* Overdue Line Chart - Overlay */}
                                        <View style={styles.overlayChart}>
                                            <LineChart
                                                data={trendChartData.overdueData}
                                                width={Math.max(width - 100, trendChartData.overdueData.length * 45)}
                                                height={260}
                                                maxValue={25}
                                                noOfSections={5}
                                                stepValue={5}
                                                spacing={45}
                                                initialSpacing={10}
                                                endSpacing={10}
                                                yAxisThickness={0}
                                                xAxisThickness={0}
                                                hideYAxisText={true}
                                                hideRules={true}
                                                color="#DC2626"
                                                thickness={3}
                                                curved
                                                areaChart
                                                startFillColor="rgba(220, 38, 38, 0.4)"
                                                endFillColor="rgba(220, 38, 38, 0.1)"
                                                startOpacity={0.9}
                                                endOpacity={0.2}
                                                isAnimated
                                                animationDuration={1200}
                                                hideDataPoints={false}
                                                dataPointsHeight={10}
                                                dataPointsWidth={10}
                                                dataPointsColor="#DC2626"
                                                dataPointsRadius={5}
                                                hideOrigin={false}
                                                yAxisOffset={0}
                                                showVerticalLines={false}
                                                pointerConfig={{
                                                    pointerStripHeight: 240,
                                                    pointerStripColor: '#DC2626',
                                                    pointerStripWidth: 2,
                                                    pointerColor: '#DC2626',
                                                    radius: 6,
                                                    pointerLabelWidth: 160,
                                                    pointerLabelHeight: 100,
                                                    activatePointersOnLongPress: false,
                                                    autoAdjustPointerLabelPosition: true,
                                                    pointerLabelComponent: (items: any) => {
                                                        const item = items[0];
                                                        return (
                                                            <View style={styles.simpleTooltipContainer}>
                                                                <View style={[styles.simpleTooltipHeader, { backgroundColor: '#991B1B' }]}>
                                                                    <Text style={styles.simpleTooltipDate}>{item.label || item.date}</Text>
                                                                </View>
                                                                <View style={styles.simpleTooltipBody}>
                                                                    <Text style={[styles.simpleTooltipStatus, { color: '#DC2626' }]}>
                                                                        {item.status}
                                                                    </Text>
                                                                    <Text style={styles.simpleTooltipValue}>
                                                                        {item.value} Tasks
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        );
                                                    },
                                                }}
                                            />
                                        </View>
                                    </View>
                                </ScrollView>
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ height: 20 }} />

            </ScrollView>
        </View>
    );
};

// --- Atomic Components ---

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F9FC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    navHeader: { 
        paddingHorizontal: 16, 
        paddingTop: 48, 
        paddingBottom: 12, 
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderColor: '#E5E7EB' 
    },
    backButton: { flexDirection: 'row', alignItems: 'center' },
    backText: { fontSize: 16, fontWeight: '600', marginLeft: 8, color: '#111827' },

    scrollContent: { 
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },

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

    // Trend Chart Styles
    trendLegendButtonContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    trendLegendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    trendLegendButtonDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    trendLegendButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    trendChartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    trendYAxisContainer: {
        width: 35,
        height: 260,
        justifyContent: 'space-between',
        paddingTop: 8,
        paddingBottom: 28,
        paddingRight: 8,
    },
    trendYAxisLabelContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    trendYAxisLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    trendChartScrollWrapper: {
        flex: 1,
    },
    trendChartInner: {
        position: 'relative',
    },
    overlayChart: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    simpleTooltipContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
        overflow: 'hidden',
        minWidth: 150,
        borderWidth: 2,
        borderColor: '#2D5F3F',
    },
    simpleTooltipHeader: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    simpleTooltipDate: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    simpleTooltipBody: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        alignItems: 'flex-start',
    },
    simpleTooltipStatus: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    simpleTooltipValue: {
        fontSize: 13,
        fontWeight: '400',
        color: '#6B7280',
    },
    detailedTooltipContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
        minWidth: 170,
        maxWidth: 200,
    },
    detailedTooltipHeader: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        alignItems: 'center',
    },
    detailedTooltipDate: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    detailedTooltipBody: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: '#fff',
    },
    tooltipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    tooltipIcon: {
        fontSize: 16,
        marginTop: 2,
    },
    tooltipTextContainer: {
        flex: 1,
    },
    tooltipLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tooltipProjectName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
        lineHeight: 16,
    },
    tooltipStatus: {
        fontSize: 13,
        fontWeight: '700',
    },
    tooltipCount: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    tooltipDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    tooltipContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
        minWidth: 130,
    },
    tooltipHeader: {
        backgroundColor: '#1F9D55',
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    tooltipDate: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    tooltipBody: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
    },
    tooltipValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    
    // Gantt Chart Styles
    ganttFullWidthSection: {
        backgroundColor: '#fff',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderRadius: 12,
        overflow: 'hidden',
    },
    ganttHeaderSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    ganttScrollContainer: {
        marginTop: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    ganttContainer: {
        minWidth: 800,
    },
    ganttHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8,
        marginBottom: 8,
    },
    ganttTaskNameColumn: {
        width: 160,
        paddingRight: 12,
        justifyContent: 'center',
    },
    ganttTimelineColumn: {
        flex: 1,
        flexDirection: 'row',
        position: 'relative',
    },
    ganttHeaderText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
    },
    ganttHeaderCell: {
        width: 60,
        alignItems: 'center',
        borderLeftWidth: 1,
        borderLeftColor: '#F3F4F6',
        paddingHorizontal: 4,
    },
    ganttHeaderCellText: {
        fontSize: 9,
        color: '#6B7280',
        fontWeight: '600',
    },
    ganttRow: {
        flexDirection: 'row',
        minHeight: 48,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'center',
    },
    ganttRowAlt: {
        backgroundColor: '#FAFBFC',
    },
    ganttTaskName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    ganttProjectName: {
        fontSize: 10,
        fontWeight: '500',
        color: '#6B7280',
    },
    ganttTaskCategory: {
        fontSize: 10,
        color: '#6B7280',
    },
    ganttBarContainer: {
        flex: 1,
        height: 32,
        position: 'relative',
        justifyContent: 'center',
    },
    ganttBar: {
        position: 'absolute',
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    ganttBarText: {
        fontSize: 9,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    ganttLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    ganttLegendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ganttLegendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    ganttLegendText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
});

export default WorkerDetailScreen;
