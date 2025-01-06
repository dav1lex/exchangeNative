import React, {useState, useContext} from 'react';
import {View, Text, TextInput, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import {loginUser} from '../backend/api';
import {BalanceContext} from './BalanceContext';

export default function LoginScreen({navigation}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const {setBalance, setUserId} = useContext(BalanceContext);

    const handleLogin = async () => {
        try {
            const response = await loginUser(email, password);
            const {userId, balance} = response.data;

            setUserId(userId); // Set user ID in context
            setBalance(balance); // Set balance in context

            navigation.navigate('Home');
        } catch (error) {
            Alert.alert('Login Failed', error.response?.data?.error || 'An error occurred.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Currency Exchange</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('Register')}
            >
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 40,
        color: '#333',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 15,
        marginBottom: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    loginButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    registerButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
