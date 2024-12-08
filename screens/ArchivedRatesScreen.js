import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Button, StyleSheet, FlatList } from 'react-native';
import { BalanceContext } from './BalanceContext';
import { getArchivedRates } from '../backend/api'; // Import API

export default function ArchivedRatesScreen() {
    const { userId } = useContext(BalanceContext);
    const [transactions, setTransactions] = useState([]);

    // Fetch archived transactions
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await getArchivedRates(userId);
                setTransactions(response.data); // Set transaction history
            } catch (error) {
                console.error("Error fetching transactions", error);
            }
        };

        fetchTransactions();
    }, [userId]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Archived Rates & Transactions</Text>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.transactionItem}>
                        <Text>{item.currency}: {item.amount} - {item.type} ({item.timestamp})</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
    transactionItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
});
