import React, { useContext, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    SafeAreaView,
    Platform,
    StatusBar,
    Modal,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

const AdminProfileScreen = () => {
    const { user, login, logout } = useContext(AuthContext); // Assuming login can update user too or we manually update state
    const navigation = useNavigation();

    // Mock Data (In a real app, fetch from backend)
    const [profile, setProfile] = useState({
        name: user?.name || 'Admin',
        company: 'Noor Construction',
        location: 'Chennai, Tamil Nadu',
        phone: user?.phone || '+91-9876543210',
        email: user?.email || 'admin@noor.com',
        role: 'Super Admin',
        lastLogin: new Date().toLocaleString(),
    });

    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editForm, setEditForm] = useState({ ...profile });

    const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });
    const [isUpdating, setIsUpdating] = useState(false);

    // --- Profile Edit Logic ---
    const handleEditProfile = () => {
        setEditForm({ ...profile });
        setEditModalVisible(true);
    };

    const saveProfile = async () => {
        try {
            // Optimistic Update
            setProfile(editForm);
            setEditModalVisible(false);

            // API Call
            await api.put('/auth/profile', {
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone,
                company_name: editForm.company,
                address: editForm.location
            });

            Alert.alert('Success', 'Profile updated successfully');

            // Optionally update Context User
            // updateContextUser({ ...user, name: editForm.name, email: editForm.email, phone: editForm.phone });

        } catch (error: any) {
            console.log('Update Error', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        }
    };

    // --- Password Change Logic ---
    const handleChangePassword = async () => {
        const { oldPassword, newPassword, confirmPassword } = passwordForm;

        if (newPassword.length < 6) {
            Alert.alert("Validation Error", "New password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Validation Error", "New password and Confirm password do not match.");
            return;
        }

        if (newPassword === oldPassword) {
            Alert.alert("Validation Error", "New password cannot be the same as old password.");
            return;
        }

        try {
            await api.post('/auth/change-password', {
                oldPassword,
                newPassword
            });
            setPasswordModalVisible(false);
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            Alert.alert("Success", "Password updated successfully");
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to update password");
        }
    };


    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: () => {
                    logout();
                    // Navigation to login is handled by AppNavigator based on auth state
                }
            }
        ]);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin Profile</Text>
            <View style={{ width: 24 }} />
        </View>
    );

    const renderProfileCard = () => (
        <View style={styles.card}>
            <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{profile.name?.charAt(0).toUpperCase() || 'A'}</Text>
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.nameText}>{profile.name}</Text>
                    <Text style={styles.roleText}>{profile.role}</Text>
                    <View style={styles.badgeContainer}>
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                    <Ionicons name="pencil" size={16} color="#4B5563" />
                </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={18} color="#6B7280" />
                <Text style={styles.infoText}>{profile.email}</Text>
            </View>
            <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color="#6B7280" />
                <Text style={styles.infoText}>{profile.phone}</Text>
            </View>
            <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={18} color="#6B7280" />
                <Text style={styles.infoText}>{profile.company}</Text>
            </View>
            <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color="#6B7280" />
                <Text style={styles.infoText}>{profile.location}</Text>
            </View>
        </View>
    );

    const renderSecurityCard = () => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Account & Security</Text>

            <TouchableOpacity style={styles.settingRow} onPress={() => setPasswordModalVisible(true)}>
                <View style={styles.settingIconRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                        <Ionicons name="lock-closed-outline" size={18} color="#3B82F6" />
                    </View>
                    <Text style={styles.settingText}>Change Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.settingRow}>
                <View style={styles.settingIconRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                        <Ionicons name="time-outline" size={18} color="#10B981" />
                    </View>
                    <View>
                        <Text style={styles.settingText}>Last Login</Text>
                        <Text style={styles.settingSubText}>{profile.lastLogin}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                <View style={styles.settingIconRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                    </View>
                    <Text style={[styles.settingText, { color: '#EF4444' }]}>Logout</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
            {renderHeader()}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {renderProfileCard()}
                {renderSecurityCard()}

                <Text style={styles.footerText}>Noor Construction App v1.0.0</Text>
                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal visible={isEditModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400 }}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.name}
                                    onChangeText={(t) => setEditForm({ ...editForm, name: t })}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.email}
                                    onChangeText={(t) => setEditForm({ ...editForm, email: t })}
                                    keyboardType="email-address"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.phone}
                                    onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
                                    keyboardType="phone-pad"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Company</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.company}
                                    onChangeText={(t) => setEditForm({ ...editForm, company: t })}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Address</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.location}
                                    onChangeText={(t) => setEditForm({ ...editForm, location: t })}
                                />
                            </View>
                        </ScrollView>
                        <TouchableOpacity style={[styles.saveButton, isUpdating && { opacity: 0.7 }]} onPress={saveProfile} disabled={isUpdating}>
                            <Text style={styles.saveButtonText}>{isUpdating ? "Saving..." : "Save Changes"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Change Password Modal */}
            <Modal visible={isPasswordModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400 }}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Old Password</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        secureTextEntry={!showPassword.old}
                                        style={styles.passwordInput}
                                        value={passwordForm.oldPassword}
                                        onChangeText={(t) => setPasswordForm({ ...passwordForm, oldPassword: t })}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword({ ...showPassword, old: !showPassword.old })}>
                                        <Ionicons name={showPassword.old ? "eye-off" : "eye"} size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>New Password</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        secureTextEntry={!showPassword.new}
                                        style={styles.passwordInput}
                                        value={passwordForm.newPassword}
                                        onChangeText={(t) => setPasswordForm({ ...passwordForm, newPassword: t })}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword({ ...showPassword, new: !showPassword.new })}>
                                        <Ionicons name={showPassword.new ? "eye-off" : "eye"} size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.helperText}>Min 6 characters</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm New Password</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        secureTextEntry={!showPassword.confirm}
                                        style={styles.passwordInput}
                                        value={passwordForm.confirmPassword}
                                        onChangeText={(t) => setPasswordForm({ ...passwordForm, confirmPassword: t })}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}>
                                        <Ionicons name={showPassword.confirm ? "eye-off" : "eye"} size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.saveButton, isUpdating && { opacity: 0.7 }]} onPress={handleChangePassword} disabled={isUpdating}>
                                <Text style={styles.saveButtonText}>{isUpdating ? "Updating..." : "Update Password"}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#991B1B',
    },
    profileInfo: {
        flex: 1,
    },
    nameText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    roleText: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    badgeContainer: {
        flexDirection: 'row',
    },
    activeBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#059669',
    },
    editButton: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: -16,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#374151',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    settingIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    settingSubText: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    footerText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', // Center vertically
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 5
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827'
    },
    inputGroup: {
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#111827'
    },
    saveButton: {
        backgroundColor: '#8B0000',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: '#111827'
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4
    }
});

export default AdminProfileScreen;
