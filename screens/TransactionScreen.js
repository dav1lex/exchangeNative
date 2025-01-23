import React, {useState, useEffect, useContext} from 'react';
import {View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import {BalanceContext} from './BalanceContext';
import {sellCurrency, getHoldings} from '../backend/api';
import Toast from "react-native-toast-message";

export default function TransactionScreen() {
    const {balance, userId, setBalance} = useContext(BalanceContext);
    const [holdings, setHoldings] = useState([]);
    const [selectedCurrency, setSelectedCurrency] = useState('');
    const [amount, setAmount] = useState('');

    const fetchHoldings = async () => {
        try {
            const response = await getHoldings(userId);
            const holdingsData = response.data;
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

    const handleHoldingPress = (currency) => {
        setSelectedCurrency(currency);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.balance}>Balance: {parseFloat(balance || 0).toFixed(2)} PLN</Text>

            <Text style={styles.title}>Your Holdings</Text>
            <FlatList
                data={holdings}
                keyExtractor={(item) => item.currency}
                renderItem={({item}) => (
                    <TouchableOpacity
                        style={[
                            styles.holdingItem,
                            selectedCurrency === item.currency && styles.selectedHolding
                        ]}
                        onPress={() => handleHoldingPress(item.currency)}
                    >
                        <Text style={styles.holdingText}>
                            {item.currency}: {parseFloat(item.amount).toFixed(2)}
                        </Text>
                    </TouchableOpacity>
                )}
                style={{maxHeight: '40%'}}
                contentContainerStyle={{paddingBottom: 10}}
            />

            <TextInput
                style={styles.input}
                placeholder="Currency (e.g., EUR)"
                value={selectedCurrency}
                onChangeText={setSelectedCurrency}
                placeholderTextColor="#A0AEC0"
            />
            <TextInput
                style={styles.input}
                placeholder="Amount to Sell"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholderTextColor="#A0AEC0"
            />
            <TouchableOpacity
                style={styles.sellButton}
                onPress={handleSellCurrency}
            >
                <Text style={styles.buttonText}>Sell Currency</Text>
            </TouchableOpacity>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F7F9FC',
    },
    balance: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 24,
        color: '#1A1F36',
        textAlign: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
        color: '#1A1F36',
    },
    holdingItem: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    holdingText: {
        fontSize: 16,
        color: '#1A1F36',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 15,
        marginVertical: 8,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        fontSize: 16,
    },
    sellButton: {
        backgroundColor: '#4F46E5',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    selectedHolding: {
        borderColor: '#4F46E5',
        backgroundColor: '#F5F3FF',
    },
});