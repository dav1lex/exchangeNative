import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {BalanceContext} from './BalanceContext';
import {getArchivedRates} from '../backend/api';

export default function ArchivedRatesScreen() {
    const {userId} = useContext(BalanceContext);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await getArchivedRates(userId);
                setTransactions(response.data);
            } catch (error) {
                console.error("Error fetching transactions", error);
            }
        };

        fetchTransactions();
    }, [userId]);

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const formatAmount = (amount, rate) => {
        return `${amount} (${(amount * rate).toFixed(2)} PLN)`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Archived Rates & Transactions</Text>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}) => (
                    <View style={styles.transactionItem}>
                        <View style={styles.transactionHeader}>
                            <Text style={styles.currencyText}>
                                {item.currency}
                            </Text>
                            <Text style={[styles.typeText,
                                item.type === 'buy' ? styles.buyText : styles.sellText]}>
                                {item.type.toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.transactionText}>
                            Amount: {formatAmount(item.amount, item.rate)}
                        </Text>
                        <Text style={styles.rateText}>
                            Rate: {item.rate} PLN
                        </Text>
                        <Text style={styles.transactionDetails}>
                            {formatDate(item.timestamp)}
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
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    currencyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1F36',
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    buyText: {
        backgroundColor: '#E6F4EA',
        color: '#137333',
    },
    sellText: {
        backgroundColor: '#FCE8E6',
        color: '#C5221F',
    },
    transactionText: {
        fontSize: 16,
        color: '#1A1F36',
        marginBottom: 4,
    },
    rateText: {
        fontSize: 14,
        color: '#4A5568',
        marginBottom: 4,
    },
    transactionDetails: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
});