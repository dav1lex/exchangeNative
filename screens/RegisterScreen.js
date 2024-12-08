import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { registerUser } from '../backend/api';

export default function RegisterScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        try {
            await registerUser(email, password);
            Alert.alert('Success', 'Registration successful. Please log in.');
            navigation.navigate('Login');
        } catch (error) {
            Alert.alert(
                'Registration Failed',
                error.response?.data?.error || 'An error occurred.'
            );
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />
            <View style={styles.buttonContainer}>
                <Button title="Register" onPress={handleRegister} />
            </View>
            <View style={styles.buttonContainer}>
                <Button
                    title="Back to Login"
                    color="gray"
                    onPress={() => navigation.navigate('Login')}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 28, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
    input: {
        borderWidth: 1,
        padding: 12,
        marginVertical: 8,
        borderRadius: 10,
        borderColor: '#ccc',
        backgroundColor: '#f9f9f9'
    },
    buttonContainer: { marginVertical: 10 }
});
