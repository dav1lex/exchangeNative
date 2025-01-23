import React, {useState} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ActivityIndicator, Animated,
} from 'react-native';
import {loginUser} from '../backend/api';
import {BalanceContext} from './BalanceContext';


const StatusMessage = ({type, message, visible}) => {
    const slideAnim = React.useRef(new Animated.Value(-100)).current;

    React.useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: visible ? 0 : -100,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    if (!message) return null;

    const backgroundColor = type === 'success' ? '#10B981' : '#EF4444';
    return (
        <Animated.View
            style={[
                styles.statusMessage,
                {
                    backgroundColor,
                    transform: [{translateY: slideAnim}]
                }
            ]}
        >
            <Text style={styles.statusText}>{message}</Text>
        </Animated.View>
    );
};


export default function LoginScreen({navigation}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const {setBalance, setUserId} = React.useContext(BalanceContext);
    const [status, setStatus] = useState({
        visible: false,
        type: '',
        message: ''
    });

    const showStatus = (type, message) => {
        setStatus({
            visible: true,
            type,
            message
        });
        setTimeout(() => {
            setStatus(prev => ({...prev, visible: false}));
        }, 3000);
    };
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showStatus('error', 'Please enter a valid email address');
            return;
        }

        setIsLoading(true);

        try {
            const response = await loginUser(email, password);
            const {userId, balance} = response.data;
            showStatus('success', 'Login successful!');

            setUserId(userId);
            setBalance(balance);
            setTimeout(() => {
                setUserId(userId);
                setBalance(balance);
                navigation.navigate('Home');
            }, 500);
        } catch (error) {
            showStatus('error', 'Wrong credentials');
        } finally {
            setIsLoading(false);
        }

    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusMessage
                type={status.type}
                message={status.message}
                visible={status.visible}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue</Text>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#A0AEC0"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="email"
                                textContentType="emailAddress"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor="#A0AEC0"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoComplete="password"
                                textContentType="password"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>Don't have an account?</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Register')}
                                disabled={isLoading}
                            >
                                <Text style={styles.registerLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1A1F36',
        textAlign: 'left',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#4A5568',
        marginBottom: 32,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2D3748',
        marginBottom: 8,
    },
    input: {
        height: 48,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1A1F36',
    },
    loginButton: {
        height: 48,
        backgroundColor: '#4F46E5',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#4F46E5',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    registerText: {
        color: '#4A5568',
        fontSize: 14,
    },
    registerLink: {
        color: '#4F46E5',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    statusMessage: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 20,
        right: 20,
        padding: 15,
        borderRadius: 8,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    statusText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});