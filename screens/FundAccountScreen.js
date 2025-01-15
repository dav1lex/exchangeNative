import React, {useState, useContext} from 'react';
import {View, Text, TextInput, Alert, StyleSheet} from 'react-native';
import {fundAccount} from '../backend/api';
import {BalanceContext} from './BalanceContext';

export default function FundAccountScreen() {
    const [amount, setAmount] = useState('');
    const {userId, setBalance} = useContext(BalanceContext);

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
                placeholderTextColor="#A0AEC0"
            />
            <TouchableOpacity
                style={styles.fundButton}
                onPress={handleFundAccount}
            >
                <Text style={styles.buttonText}>Add Funds</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F7F9FC',
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 30,
        color: '#1A1F36',
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 15,
        marginBottom: 20,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        fontSize: 16,
    },
    fundButton: {
        backgroundColor: '#4F46E5',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});