import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const METRICS = [
    { id: 'attendance', label: 'Attendance', icon: 'time-outline', color: '#059669' },
    { id: 'tasks_assigned', label: 'Tasks Assigned', icon: 'list-outline', color: '#3B82F6' },
    { id: 'tasks_completed', label: 'Tasks Completed', icon: 'checkmark-done-circle-outline', color: '#10B981' },
];

const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Dummy Data Generator
const generateDummyData = () => {
    const data: any = {};
    WEEKS.forEach(week => {
        data[week] = {};
        METRICS.forEach(metric => {
            // Randomly fill checks
            data[week][metric.id] = Array(7).fill(false).map((_, i) => {
                if (metric.id === 'attendance') return i < 5 ? true : Math.random() > 0.8;
                return Math.random() > 0.4;
            });
        });
    });
    return data;
};

const DailyActivityLog = () => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [activityData, setActivityData] = useState(generateDummyData());
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0); // For mobile tracking

    // Calculate dynamic layout values
    // Mobile: Left col fixed 105px to leave maximum space for week grid
    const LEFT_COL_WIDTH = isMobile ? 105 : 160;

    // Total Container Padding = 16 (left) + 16 (right) = 32
    // Left Column Padding Right = 12
    // Scroll View Padding Left = 12
    // Extra safety margin = 4
    // Total deductions from width = 32 + 12 + 12 + 4 = 60 roughly
    const WEEK_WIDTH = isMobile ? (width - LEFT_COL_WIDTH - 60) : 260;

    // No minimum width that forces scroll on mobile. We want to fit exactly.
    const ACTUAL_WEEK_WIDTH = WEEK_WIDTH;

    const toggleDay = (week: string, metricId: string, dayIndex: number) => {
        const newData = { ...activityData };
        newData[week][metricId][dayIndex] = !newData[week][metricId][dayIndex];
        setActivityData(newData);
    };

    // Calculate completion per week
    const getWeekProgress = (week: string) => {
        let totalChecks = 0;
        let filledChecks = 0;
        METRICS.forEach(m => {
            totalChecks += 7;
            filledChecks += activityData[week][m.id].filter(Boolean).length;
        });
        return Math.round((filledChecks / totalChecks) * 100);
    };

    const handleScroll = (event: any) => {
        if (!isMobile) return;
        const offsetX = event.nativeEvent.contentOffset.x;
        // The card takes up week width + margin(12) roughly
        const index = Math.round(offsetX / (ACTUAL_WEEK_WIDTH + 12));
        if (index !== currentWeekIndex && index >= 0 && index < WEEKS.length) {
            setCurrentWeekIndex(index);
        }
    };

    const renderWeekColumn = (week: string, index: number) => {
        const progress = getWeekProgress(week);

        return (
            <View key={week} style={[styles.weekCard, { width: ACTUAL_WEEK_WIDTH }]}>
                {/* Week Header */}
                <View style={styles.weekHeader}>
                    <Text style={[styles.weekTitle, isMobile && currentWeekIndex === index && styles.weekTitleActive]}>
                        {week}
                    </Text>
                    <View style={styles.weekHeaderDays}>
                        {DAYS.map((day, dIdx) => (
                            <Text key={dIdx} style={[styles.dayText, isMobile && { fontSize: 9, width: '13%' }]}>{day}</Text>
                        ))}
                    </View>
                </View>

                {/* Grid Rows */}
                <View style={styles.gridContainer}>
                    {METRICS.map((metric) => (
                        <View key={metric.id} style={styles.gridRow}>
                            {activityData[week][metric.id].map((isChecked: boolean, dayIndex: number) => (
                                <TouchableOpacity
                                    key={dayIndex}
                                    style={[styles.checkboxContainer, isMobile && { width: '13%', height: 24 }]} // Distribute equally
                                    onPress={() => toggleDay(week, metric.id, dayIndex)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        isMobile && { width: 18, height: 18, borderRadius: 4 }, // Smaller on mobile
                                        isChecked && { backgroundColor: metric.color, borderColor: metric.color },
                                        !isChecked && { borderColor: '#E5E7EB' }
                                    ]}>
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
                        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: '#4B5563' }]} />
                    </View>
                    <Text style={styles.completionText}>{progress}%</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.mainTitle}>Weekly Activity Dashboard</Text>
                {isMobile && (
                    <View style={styles.mobileWeekBadge}>
                        <Text style={styles.mobileWeekText}>{WEEKS[currentWeekIndex]}</Text>
                    </View>
                )}
            </View>

            <View style={styles.dashboardBody}>
                {/* Fixed Left Column (Metrics) */}
                <View style={[styles.leftColumn, { width: LEFT_COL_WIDTH }]}>
                    <View style={styles.leftHeaderSpacer} />
                    {METRICS.map(metric => (
                        <View key={metric.id} style={styles.metricLabelRow}>
                            <View style={[styles.iconBox, { backgroundColor: metric.color + '15' }]}>
                                <Ionicons name={metric.icon as any} size={16} color={metric.color} />
                            </View>
                            <Text style={[styles.metricText, isMobile && { fontSize: 11 }]} numberOfLines={2}>{metric.label}</Text>
                        </View>
                    ))}
                    {/* Spacers for bottom alignments */}
                    <View style={styles.rowSpacer}><Text style={styles.rowSpacerText}>Completion</Text></View>
                </View>

                {/* Scrollable Right Section (Weeks) */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={!isMobile} // Show scrollbar on desktop, hide on mobile
                    pagingEnabled={isMobile}
                    snapToInterval={isMobile ? (ACTUAL_WEEK_WIDTH + 12) : undefined} // Match card margin
                    decelerationRate="fast"
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={styles.scrollContent}
                >
                    {WEEKS.map((week, index) => renderWeekColumn(week, index))}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    mainTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    mobileWeekBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    mobileWeekText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    dashboardBody: {
        flexDirection: 'row',
    },
    leftColumn: {
        borderRightWidth: 1,
        borderRightColor: '#F3F4F6',
        paddingRight: 12,
        backgroundColor: '#fff',
        zIndex: 10,
    },
    leftHeaderSpacer: {
        height: 50, // Matches week header height
    },
    metricLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48, // Fixed row height
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
    rowSpacer: {
        height: 30, // For bottom aligned items
        justifyContent: 'center',
        marginBottom: 8,
    },
    rowSpacerText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
        textTransform: 'uppercase',
    },

    // Right Scroll Section
    scrollContent: {
        paddingLeft: 12,
        paddingBottom: 20, // Space for card shadow
        paddingRight: 12, // Balance padding
    },
    weekCard: {
        marginRight: 12, // Reduced margin
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 4, // Tighter padding inside card for mobile
        paddingVertical: 0,
        // Subtle card look
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    weekHeader: {
        height: 50,
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
        paddingHorizontal: 0, // Remove padding to use full width
    },
    dayText: {
        fontSize: 10,
        color: '#9CA3AF',
        width: 24, // Desktop default
        textAlign: 'center',
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
        paddingHorizontal: 0,
    },
    checkboxContainer: {
        width: 24, // Desktop default
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkbox: {
        width: 20, // Desktop default
        height: 20,
        borderRadius: 5,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },

    // Completion
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
        borderRadius: 3,
    },
    completionText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#374151',
        width: 32,
        textAlign: 'right',
    },
});

export default DailyActivityLog;
