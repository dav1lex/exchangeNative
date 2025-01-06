import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, TextInput, Button, ScrollView } from 'react-native';
import { BalanceContext } from './BalanceContext';
import { getExchangeRates, buyCurrency } from '../backend/api';

export default function HomeScreen({ navigation }) {
    const { balance, userId, setBalance } = useContext(BalanceContext); // Get userId from context
    const [rates, setRates] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [amountToBuy, setAmountToBuy] = useState('');

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const response = await getExchangeRates();
                setRates(response.data);
            } catch (error) {
                console.error("Error fetching exchange rates", error);
            }
        };

        fetchRates();
    }, []);

    const handleBuyCurrency = async () => {
        const amount = parseFloat(amountToBuy);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        const rate = rates.find(rate => rate.code === selectedCurrency);
        if (!rate) {
            alert('Currency not supported.');
            return;
        }

        const cost = amount * rate.ask; // Assuming ask is the rate at which the bank sells the currency to the user

        if (balance < cost) {
            alert('Insufficient balance!');
            return;
        }

        try {
            const response = await buyCurrency(userId, selectedCurrency, amount, cost); // Use dynamic userId
            setBalance(response.data.balance); // Update balance from server response
            setShowModal(false);
        } catch (error) {
            console.error("Error buying currency:", error);
            alert('Error purchasing currency.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.balance}>Balance: {parseFloat(balance || 0).toFixed(2)} PLN</Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.fundButton]}
                    onPress={() => navigation.navigate('Fund Account')}
                >
                    <Text style={styles.buttonText}>Fund Account</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.transactionButton]}
                    onPress={() => navigation.navigate('Transaction')}
                >
                    <Text style={styles.buttonText}>Transaction</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.archivedButton]}
                    onPress={() => navigation.navigate('Archived Rates')}
                >
                    <Text style={styles.buttonText}>Archived Rates</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.title}>Exchange Rates</Text>
            <FlatList
                data={rates}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.rateItem}
                        onPress={() => {
                            setSelectedCurrency(item.code);
                            setShowModal(true);
                        }}
                    >
                        <Text style={styles.currencyText}>{item.currency} {item.code}</Text>
                        <Text style={styles.rateText}>{item.mid} PLN</Text>
                    </TouchableOpacity>
                )}
                style={styles.flatList}
            />

            {/* Modal for buying currency */}
            <Modal
                transparent={true}
                visible={showModal}
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Buy {selectedCurrency}</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="Enter amount"
                            value={amountToBuy}
                            onChangeText={setAmountToBuy}
                        />
                        <View style={styles.modalButtonContainer}>
                            <Button title="Buy" onPress={handleBuyCurrency} />
                            <Button title="Cancel" onPress={() => setShowModal(false)} />
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20, backgroundColor: '#f5f5f5' },
    balance: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center'
    },
    title: {
        fontSize: 22,
        marginVertical: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#555'
    },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3
    },
    fundButton: { backgroundColor: '#4CAF50' },
    transactionButton: { backgroundColor: '#2196F3' },
    archivedButton: { backgroundColor: '#FF9800' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    flatList: {
        flexGrow: 0,
        marginBottom: 20,
    },
    rateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        marginVertical: 5,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    currencyText: { fontSize: 18, fontWeight: '500', color: '#333' },
    rateText: { fontSize: 18, fontWeight: '400', color: '#666' },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: 300,
        alignItems: 'center'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 10,
        paddingLeft: 10,
        width: '100%'
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    }
});