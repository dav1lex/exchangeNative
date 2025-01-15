import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {BalanceContext} from './BalanceContext';
import {getArchivedRates} from '../backend/api'; // Import API

export default function ArchivedRatesScreen() {
    const {userId} = useContext(BalanceContext);
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
                renderItem={({item}) => (
                    <View style={styles.transactionItem}>
                        <Text style={styles.transactionText}>
                            {item.currency}: {item.amount}
                        </Text>
                        <Text style={styles.transactionDetails}>
                            {item.type} • {item.timestamp}
                        </Text>
                    </View>
                )}
                contentContainerStyle={{paddingBottom: 20}}
                showsVerticalScrollIndicator={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F7F9FC',
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 20,
        color: '#1A1F36',
        textAlign: 'center',
    },
    transactionItem: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    transactionText: {
        fontSize: 16,
        color: '#1A1F36',
        fontWeight: '500',
    },
    transactionDetails: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
});