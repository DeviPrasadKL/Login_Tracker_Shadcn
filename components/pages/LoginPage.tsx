// Index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

const LoginPage: React.FC = () => {
    const [loginTime, setLoginTime] = useState<string>('');
    const [logoutTime, setLogoutTime] = useState<string>('');
    const [showLoginButton, setShowLoginButton] = useState<boolean>(true);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const themeSetting = await AsyncStorage.getItem('theme');
                if (themeSetting) {
                    setIsDarkMode(themeSetting === 'true');
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to load theme settings');
            }
        };

        fetchSettings();
    }, []);

    useEffect(() => {
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
        fetchLoginTime();
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

    return (

        <View className='flex-1 justify-center items-center gap-5 p-6 bg-secondary/30'>
            <Card className='w-full max-w-sm p-6 rounded-2xl'>
                <CardHeader className='items-center'>
                    <View className='p-3' />
                    <CardTitle className='pb-2 text-center'>{new Date().toLocaleDateString()}</CardTitle>
                </CardHeader>

                {
                    loginTime ? (
                        <>
                            <CardContent>
                                <View className='flex-col justify-center items-center gap-3'>
                                    <View className='items-center'>
                                        <Text className='text-sm text-muted-foreground'>Login Time:</Text>
                                        <Text className='text-xl font-semibold'>{loginTime}</Text>
                                    </View>
                                    <View className='items-center'>
                                        <Text className='text-sm text-muted-foreground'>Expected Logout Time:</Text>
                                        <Text className='text-xl font-semibold'>{logoutTime}</Text>
                                    </View>
                                    <Button
                                        variant='outline'
                                        className='shadow shadow-foreground/5 bg-blue-500 text-lg h-[6rem] w-[6rem] rounded-2xl'
                                    // onPress={updateProgressValue}
                                    >
                                        <Text>Update</Text>
                                    </Button>
                                </View>
                            </CardContent>
                            <View />
                        </>
                    ) : (
                        <Button
                            variant='outline'
                            className='shadow shadow-foreground/5 bg-blue-500 text-lg h-[6rem] w-[6rem] rounded-2xl'
                            onPress={handleLogin}
                        >
                            <Text>Login</Text>
                        </Button>
                    )
                }
            </Card>
        </View>
    );
};

export default LoginPage;
