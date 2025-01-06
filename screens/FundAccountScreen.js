import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { fundAccount } from '../backend/api';
import { BalanceContext } from './BalanceContext';

export default function FundAccountScreen() {
    const [amount, setAmount] = useState('');
    const { userId, setBalance } = useContext(BalanceContext);

    const handleFundAccount = async () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a positive number.');
            return;
        }

        try {
            const response = await fundAccount(userId, numericAmount);
            const updatedBalance = parseFloat(response.data.balance);
            setBalance(updatedBalance);
            Alert.alert('Success', `Your account has been funded with €${numericAmount}.`);
            setAmount('');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'An error occurred.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Fund Your Account</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
            />
            <Button title="Add Funds" onPress={handleFundAccount} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, padding: 10, marginVertical: 10, borderRadius: 5 },
});