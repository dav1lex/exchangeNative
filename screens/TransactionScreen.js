import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { BalanceContext } from './BalanceContext';
import { sellCurrency, getHoldings } from '../backend/api';
import Toast from "react-native-toast-message";

export default function TransactionScreen() {
    const { balance, userId, setBalance } = useContext(BalanceContext);
    const [holdings, setHoldings] = useState([]);
    const [selectedCurrency, setSelectedCurrency] = useState('');
    const [amount, setAmount] = useState('');

    const fetchHoldings = async () => {
        try {
            const response = await getHoldings(userId);
            const holdingsData = response.data;
            // Filter out currencies with a zero balance
            const filteredHoldings = holdingsData.filter(item => parseFloat(item.amount) > 0);
            setHoldings(filteredHoldings);
        } catch (error) {
            console.error("Error fetching holdings", error);
        }
    };

    useEffect(() => {
        fetchHoldings();
    }, [userId]);

    const handleSellCurrency = async () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Amount',
                text2: 'Enter a valid amount to sell.',
            });
            return;
        }

        const holding = holdings.find((h) => h.currency === selectedCurrency);
        if (!holding || holding.amount < numericAmount) {
            Toast.show({
                type: 'error',
                text1: 'Insufficient Holdings',
                text2: `You only have ${holding?.amount || 0} ${selectedCurrency}.`,
            });
            return;
        }

        try {
            const response = await sellCurrency(userId, selectedCurrency, numericAmount);
            setBalance(parseFloat(response.data.newBalance)); // update balance
            Toast.show({
                type: 'success',
                text1: 'Transaction Successful',
                text2: `Sold ${numericAmount} ${selectedCurrency}.`,
            });
            setAmount('');
            await fetchHoldings(); // Refresh after sale
        } catch (error) {
            console.error('Sell Currency Error:', error.response?.data || error.message);

            Toast.show({
                type: 'error',
                text1: 'Transaction Failed',
                text2: 'Please try again later.',
            });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.balance}>Balance: {parseFloat(balance || 0).toFixed(2)} PLN</Text>

            <Text style={styles.title}>Your Holdings:</Text>
            <FlatList
                data={holdings}
                keyExtractor={(item) => item.currency}
                renderItem={({ item }) => (
                    <Text style={styles.holding}>
                        {item.currency}: {parseFloat(item.amount).toFixed(2)}
                    </Text>
                )}
            />

            <TextInput
                style={styles.input}
                placeholder="Currency (e.g., EUR)"
                value={selectedCurrency}
                onChangeText={setSelectedCurrency}
            />
            <TextInput
                style={styles.input}
                placeholder="Amount to Sell"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
            />
            <Button title="Sell" onPress={handleSellCurrency} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    balance: { fontSize: 24, marginBottom: 20 },
    title: { fontSize: 18, marginBottom: 10 },
    holding: { fontSize: 16, marginVertical: 5 },
    input: { borderWidth: 1, padding: 10, marginVertical: 10, borderRadius: 5 },
});