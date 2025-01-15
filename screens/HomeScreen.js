import React, {useState, useEffect, useContext} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, TextInput, Button, ScrollView} from 'react-native';
import {BalanceContext} from './BalanceContext';
import {getExchangeRates, buyCurrency} from '../backend/api';

export default function HomeScreen({navigation}) {
    const {balance, userId, setBalance} = useContext(BalanceContext); // Get userId from context
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
            {/*currencies show under here*/}
            <FlatList
                data={rates}
                keyExtractor={(item) => item.code}
                renderItem={({item}) => (
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
                style={[styles.flatList, { flex: 1 }]}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
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
                            <Button title="Buy" onPress={handleBuyCurrency}/>
                            <Button title="Cancel" onPress={() => setShowModal(false)}/>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 16,
        backgroundColor: '#F7F9FC', // Modern light background
    },
    balance: {
        fontSize: 32,
        fontWeight: '600',
        marginBottom: 24,
        color: '#1A1F36',
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 10,
    },
    button: {
        flex: 1,
        minWidth: '30%',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    fundButton: {backgroundColor: '#4F46E5'}, // Modern indigo
    transactionButton: {backgroundColor: '#3B82F6'}, // Modern blue
    archivedButton: {backgroundColor: '#6366F1'}, // Modern purple
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    title: {
        fontSize: 24,
        marginVertical: 16,
        fontWeight: '600',
        color: '#1A1F36',
        textAlign: 'left',
    },
    rateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        marginVertical: 6,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    currencyText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1A1F36',
    },
    rateText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4F46E5',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end', // Bottom sheet style
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 24,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
        color: '#1A1F36',
    },
    input: {
        height: 48,
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        width: '100%',
        backgroundColor: '#F9FAFB',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
});