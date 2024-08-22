import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

const LoginPage: React.FC = () => {
    const [loginTime, setLoginTime] = useState<string>('');
    const [logoutTime, setLogoutTime] = useState<string>('');
    const [showLoginButton, setShowLoginButton] = useState<boolean>(true);
    const [showBreakButton, setShowBreakButton] = useState<boolean>(true);
    const [breakStartTime, setBreakStartTime] = useState<string | null>(null);
    const [breakDuration, setBreakDuration] = useState<string | null>(null);
    const [timer, setTimer] = useState<number>(0);
    const [isBreakActive, setIsBreakActive] = useState<boolean>(false);
    const [breakRecords, setBreakRecords] = useState<Array<{ start: string; end: string; duration: string }>>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null); // Use NodeJS.Timeout for timer management
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    useEffect(() => {
        fetchSettings();
        fetchLoginTime();
    }, []);

    const fetchSettings = async () => {
        try {
            const themeSetting = await AsyncStorage.getItem('theme');
            if (themeSetting) {
                setIsDarkMode(themeSetting === 'dark');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load theme settings');
        }
    };

    const fetchLoginTime = async () => {
        try {
            const storedTime = await AsyncStorage.getItem('loginTime');
            if (storedTime) {
                const loginDate = new Date(storedTime);
                setLoginTime(formatTime(loginDate));
                await calculateLogoutTime(loginDate);
                setShowLoginButton(false); // Hide login button if login time is present
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load login time');
        }
    };
    useEffect(() => {
        if (isBreakActive) {
            timerRef.current = setInterval(() => {
                setTimer(prevTimer => prevTimer + 1000);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isBreakActive]);

    useEffect(() => {
        const fetchBreakRecords = async () => {
            try {
                const records = await AsyncStorage.getItem('breakRecords');
                if (records) {
                    setBreakRecords(JSON.parse(records));
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to load break records');
            }
        };

        fetchBreakRecords();
    }, []);

    const handleLogin = async () => {
        const currentTime = new Date();
        const formattedTime = currentTime.toISOString();
        try {
            await AsyncStorage.setItem('loginTime', formattedTime);
            setLoginTime(formatTime(currentTime));
            await calculateLogoutTime(currentTime);
            setShowLoginButton(false); // Hide login button after login
        } catch (error) {
            Alert.alert('Error', 'Failed to save login time');
        }
    };

    const calculateLogoutTime = async (loginDate: Date) => {
        try {
            const weekdayHours = await AsyncStorage.getItem('weekdayHours') || '8';
            const weekendHours = await AsyncStorage.getItem('weekendHours') || '5';
            const hours = [0, 6, 7, 1, 2, 3, 4, 5].includes(loginDate.getDay()) ? weekdayHours : weekendHours;
            const logoutDate = new Date(loginDate.getTime() + parseInt(hours, 10) * 60 * 60 * 1000);
            setLogoutTime(formatTime(logoutDate));
        } catch (error) {
            Alert.alert('Error', 'Failed to calculate logout time');
        }
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleBreakStart = async () => {
        const currentTime = new Date().toISOString();
        try {
            await AsyncStorage.setItem('breakStartTime', currentTime);
            setBreakStartTime(formatTime(new Date()));
            setTimer(0); // Reset timer
            setIsBreakActive(true); // Start the timer
            setShowBreakButton(false); // Hide break start button
        } catch (error) {
            Alert.alert('Error', 'Failed to save break start time');
        }
    };

    const handleBreakStop = async () => {
        try {
            const breakStart = await AsyncStorage.getItem('breakStartTime');
            if (breakStart) {
                const breakStartDate = new Date(breakStart);
                const breakEndDate = new Date();
                const duration = calculateDuration(breakStartDate, breakEndDate);

                const newRecord = {
                    start: breakStartDate.toISOString(),
                    end: breakEndDate.toISOString(),
                    duration
                };

                const updatedRecords = [...breakRecords, newRecord];
                await AsyncStorage.setItem('breakRecords', JSON.stringify(updatedRecords));
                setBreakRecords(updatedRecords); // This should trigger a re-render

                setBreakDuration(duration);
                await AsyncStorage.removeItem('breakStartTime'); // Clear break start time
                setIsBreakActive(false); // Stop the timer
                setShowBreakButton(true); // Show break start button
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to calculate break duration');
        }
    };

    const calculateDuration = (start: Date, end: Date): string => {
        const diffMs = end.getTime() - start.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    const formatTimer = (milliseconds: number): string => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    // Helper function to format date and time
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <ScrollView className='w-full max-w-sm mt-4'>
            <View className='flex-1 justify-center gap-2 p-6 bg-secondary/30'>
                <Card className='w-full max-w-sm p-4 rounded-2xl'>
                    <CardHeader className='items-center'>
                        <CardTitle className='pb-2 text-center text-base'>{new Date().toLocaleDateString()}</CardTitle>
                    </CardHeader>

                    {
                        loginTime ? (
                            <>
                                <CardContent>
                                    <View className='flex-col justify-center items-center gap-3'>
                                        <View className='flex-row items-start'>
                                            <Text className='text-sm text-muted-foreground'>Login Time:- </Text>
                                            <Text className='text-sm text-secondary-foreground'>{loginTime}</Text>
                                        </View>
                                        <View className='flex-row items-start'>
                                            <Text className='text-sm text-muted-foreground'>Logout Time:- </Text>
                                            <Text className='text-sm text-secondary-foreground'>{logoutTime}</Text>
                                        </View>
                                        {breakStartTime && (
                                            <View className='mt-4'>
                                                <Text className='text-sm text-muted-foreground'>Break Started At:</Text>
                                                <Text className='text-sm text-secondary-foreground'>{breakStartTime}</Text>
                                                <Text className='text-sm text-muted-foreground'>Timer:</Text>
                                                <Text className='text-sm text-secondary-foreground'>{formatTimer(timer)}</Text>
                                            </View>
                                        )}
                                        {breakStartTime ? (
                                            <Button
                                                variant='outline'
                                                className='shadow shadow-foreground/5 bg-red-600 text-lg h-[6rem] w-[6rem] rounded-2xl'
                                                onPress={handleBreakStop}
                                            >
                                                <Text className='text-accent-foreground'>Break Stop</Text>
                                            </Button>
                                        ) : (
                                            showBreakButton && (
                                                <Button
                                                    variant='outline'
                                                    className='shadow shadow-foreground/5 bg-blue-600 text-lg h-[6rem] w-[6rem] rounded-2xl'
                                                    onPress={handleBreakStart}
                                                >
                                                    <Text className='text-accent-foreground'>Break Start</Text>
                                                </Button>
                                            )
                                        )}
                                        {breakDuration && (
                                            <View className='mt-4'>
                                                <Text className='text-sm text-muted-foreground'>Break Duration:</Text>
                                                <Text className='text-sm text-secondary-foreground'>{breakDuration}</Text>
                                            </View>
                                        )}
                                    </View>
                                </CardContent>
                            </>
                        ) : (
                            <View className='flex-col justify-center items-center gap-3'>
                                <Button
                                    variant='outline'
                                    className='shadow shadow-foreground/5 bg-blue-500 text-lg h-[6rem] w-[6rem] rounded-2xl'
                                    onPress={handleLogin}
                                >
                                    <Text>Login</Text>
                                </Button>
                            </View>
                        )
                    }
                </Card>

                <ScrollView className='w-full max-w-sm mt-4'>
                    <Card className='w-full p-4 rounded-2xl'>
                        <CardHeader>
                            <CardTitle className='text-base text-center'>Break Records</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <View className='border-t border-muted'>
                                {breakRecords.length === 0 ? (
                                    <Text className='text-center text-muted-foreground'>No break records found</Text>
                                ) : (
                                    breakRecords.map((record, index) => (
                                        <View key={index} className='flex-row justify-between p-2 border-b border-muted'>
                                            <Text className='text-sm text-muted-foreground'>{formatDate(record.start)}</Text>
                                            <Text className='text-sm text-muted-foreground'>{formatDate(record.end)}</Text>
                                            <Text className='text-sm text-secondary-foreground'>{record.duration}</Text>
                                        </View>
                                    ))
                                )}
                            </View>
                        </CardContent>
                    </Card>
                </ScrollView>
            </View>
        </ScrollView>
    );
};


export default LoginPage;
