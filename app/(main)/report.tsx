import { getStoredAuthData } from '@/services/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { API_URL } from '@/config/apiUrl';

interface ReportOption {
    id: string;
    title: string;
    icon: string;
    description: string;
};

const ReportPage: React.FC = () => {
    const router = useRouter();
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [customReason, setCustomReason] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [userId, setUserId] = useState<string>('');

    const reportOptions: ReportOption[] = [
        {
            id: 'violence_self_harm',
            title: 'Violence & self-harm',
            icon: 'warning-outline',
            description: 'Content that promotes or depicts violence or self-harm',
        },
        {
            id: 'sexual_exploitation_abuse',
            title: 'Sexual exploitation & abuse',
            icon: 'shield-outline',
            description: 'Inappropriate sexual content or exploitation',
        },
        {
            id: 'child_exploitation',
            title: 'Child exploitation',
            icon: 'people-outline',
            description: 'Content that exploits or endangers children',
        },
        {
            id: 'bullying_harassment',
            title: 'Bullying & harassment',
            icon: 'sad-outline',
            description: 'Targeted harassment or bullying behavior',
        },
        {
            id: 'spam_fraud_deception',
            title: 'Spam, fraud & deception',
            icon: 'mail-outline',
            description: 'Unwanted spam, scams, or deceptive content',
        },
        {
            id: 'privacy_violation',
            title: 'Privacy violation',
            icon: 'eye-off-outline',
            description: 'Sharing private information without consent',
        },
        {
            id: 'intellectual_property',
            title: 'Intellectual property',
            icon: 'document-outline',
            description: 'Copyright or trademark infringement',
        },
        {
            id: 'age_inappropriate_content',
            title: 'Age-inappropriate content',
            icon: 'alert-circle-outline',
            description: 'Content not suitable for certain age groups',
        },
        {
            id: 'something_else',
            title: 'Something else',
            icon: 'ellipsis-horizontal-outline',
            description: 'Other issues not listed above',
        },
    ];

    // Get userId on component mount
    useEffect(() => {
        const getUserId = async () => {
            try {
                const authData = await getStoredAuthData();
                if (authData?.userId) {
                    setUserId(authData.userId);
                    console.log('Retrieved user ID:', authData.userId);
                } else {
                    console.error('User ID not found in storage');
                }
            } catch (error) {
                console.error('Error getting user ID:', error);
            }
        };
        getUserId();
    }, []);

    const submitReport = async () => {
        if (!selectedOption) {
            Alert.alert('Error', 'Please select a report type');
            return;
        }

        if (!userId) {
            Alert.alert('Error', 'User ID not found. Please login again.');
            return;
        }

        setIsLoading(true);

        try {
            const requestBody = {
                user_id: userId,
                report_type: selectedOption,
                ...(customReason && { custom_reason: customReason }),
            };

            const response = await fetch(`${API_URL}/submit-report/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                Alert.alert(
                    'Report Submitted',
                    'Thank you for your report. We will review it and take appropriate action.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back(),
                        },
                    ]
                );
            } else {
                throw new Error('Failed to submit report');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            Alert.alert('Error', 'Failed to submit report. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#000', '#111']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.container}
        >

            {/* Cosmic Background Overlay */}
            <View style={styles.backgroundOverlay} pointerEvents="none">
                <LinearGradient
                    colors={['transparent', 'rgba(30, 144, 255, 0.2)', 'transparent']}
                    start={{ x: 0, y: 0.3 }}
                    end={{ x: 1, y: 0.7 }}
                    style={styles.cosmicGradient}
                    pointerEvents="none"
                />
            </View>
            {/* Header */}
            <View className="w-full flex-row items-center justify-between mt-10 px-4 py-4 border-b border-gray-700">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="bg-gray-800 rounded-full p-2"
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>

                <Text className="text-xl font-bold text-white">Report a conversation</Text>

                <TouchableOpacity
                    onPress={() => router.back()}
                    className="bg-gray-800 rounded-full p-2"
                    activeOpacity={0.7}
                >
                    <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 py-6">
                {/* Question */}
                <Text className="text-lg font-semibold text-white mb-6">
                    Why are you reporting this conversation?
                </Text>

                {/* Report Options */}
                <View className="space-y-3">
                    {reportOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            onPress={() => setSelectedOption(option.id)}
                            activeOpacity={0.7}
                        >
                            <View
                                className={`rounded-2xl border-2 ${selectedOption === option.id
                                    ? 'bg-blue-900 border-blue-500'
                                    : 'bg-white/10 my-2 border-gray-600'
                                    }`}
                            >
                                <View className="flex-row items-start p-4">
                                    {/* Radio Button */}
                                    <View
                                        className={`w-5 h-5 rounded-full border-2 mr-4 mt-1 ${selectedOption === option.id
                                            ? 'border-blue-500 bg-blue-500'
                                            : 'border-gray-400'
                                            }`}
                                    >
                                        {selectedOption === option.id && (
                                            <View className="w-2 h-2 bg-white rounded-full self-center mt-0.5" />
                                        )}
                                    </View>

                                    {/* Icon */}
                                    <View className="mr-3 mt-1">
                                        <Ionicons
                                            name={option.icon as any}
                                            size={20}
                                            color={selectedOption === option.id ? '#3b82f6' : '#9ca3af'}
                                        />
                                    </View>

                                    {/* Content */}
                                    <View className="flex-1">
                                        <Text
                                            className={`text-lg font-semibold mb-1 ${selectedOption === option.id ? 'text-blue-400' : 'text-white'
                                                }`}
                                        >
                                            {option.title}
                                        </Text>
                                        <Text className="text-gray-400 text-sm leading-5">
                                            {option.description}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Custom Reason Input */}
                {selectedOption === 'something_else' && (
                    <View className="mt-6">
                        <Text className="text-white text-base font-medium mb-3">
                            Please describe the issue:
                        </Text>
                        <LinearGradient
                            colors={['rgba(55, 65, 81, 0.8)', 'rgba(31, 41, 55, 0.8)']}
                            className="rounded-2xl border border-gray-600"
                        >
                            <TextInput
                                value={customReason}
                                onChangeText={setCustomReason}
                                placeholder="Describe the issue in detail..."
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={4}
                                className="text-white p-4 text-base"
                                style={{ textAlignVertical: 'top' }}
                            />
                        </LinearGradient>
                    </View>
                )}

                {/* Submit Button */}
                <View className="mt-8 mb-6">
                    <TouchableOpacity
                        onPress={submitReport}
                        disabled={!selectedOption || isLoading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={
                                selectedOption && !isLoading
                                    ? ['#3b82f6', '#1d4ed8']
                                    : ['#4b5563', '#374151']
                            }
                            className="rounded-2xl py-4"
                        >
                            <View className="flex-row items-center justify-center">
                                {isLoading && (
                                    <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                                )}
                                <Text
                                    className={`text-lg font-semibold ${selectedOption && !isLoading ? 'text-white' : 'text-gray-400'
                                        }`}
                                >
                                    {isLoading ? 'Submitting...' : 'Submit Report'}
                                </Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Footer Note */}
                <View className="bg-black/30 border border-white/20 rounded-2xl p-4 my-4 mb-10">
                    <Text className="text-gray-200 text-sm leading-6 text-center">
                        Your report is anonymous and helps us make the platform safer for everyone.
                        We review all reports and take appropriate action according to our community guidelines.
                    </Text>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

export default ReportPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
    },
    backgroundOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    cosmicGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
})