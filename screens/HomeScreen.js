import React, {useState, useEffect, useContext} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Modal,
    TextInput,
    SafeAreaView,
    Platform,
    StatusBar,
    KeyboardAvoidingView,
} from 'react-native';
import {BalanceContext} from './BalanceContext';
import {getExchangeRates, buyCurrency} from '../backend/api';

export default function HomeScreen({navigation}) {
    const {balance, userId, setBalance} = useContext(BalanceContext);
    const [rates, setRates] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [amountToBuy, setAmountToBuy] = useState('');

    useEffect(() => {
        fetchRates();
    }, []);

    const fetchRates = async () => {
        try {
            const response = await getExchangeRates();
            setRates(response.data);
        } catch (error) {
            console.error("Error fetching rates:", error);
        }
    };

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

        const cost = amount * rate.ask;
        if (balance < cost) {
            alert('Insufficient balance!');
            return;
        }

        try {
            const response = await buyCurrency(userId, selectedCurrency, amount, cost);
            setBalance(response.data.balance);
            setShowModal(false);
        } catch (error) {
            console.error("Error buying currency:", error);
            alert('Error purchasing currency.');
        }
    };

    const renderCurrencyItem = ({ item }) => (
        <TouchableOpacity
            style={styles.currencyCard}
            onPress={() => {
                setSelectedCurrency(item.code);
                setShowModal(true);
            }}
        >
            <Text style={styles.currencyName}>{item.currency}</Text>
            <View style={styles.currencyDetails}>
                <Text style={styles.currencyCode}>{item.code}</Text>
                <Text style={styles.rate}>{item.mid} PLN</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.balanceText}>
                    Balance: {parseFloat(balance || 0).toFixed(2)} PLN
                </Text>
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#4F46E5' }]}
                    onPress={() => navigation.navigate('Fund Account')}
                >
                    <Text style={styles.actionButtonText}>Fund Account</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                    onPress={() => navigation.navigate('Transaction')}
                >
                    <Text style={styles.actionButtonText}>Transaction</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#6366F1' }]}
                    onPress={() => navigation.navigate('Archived Rates')}
                >
                    <Text style={styles.actionButtonText}>Archived Rates</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.ratesContainer}>
                <Text style={styles.ratesTitle}>Exchange Rates</Text>
                <FlatList
                    data={rates}
                    renderItem={renderCurrencyItem}
                    keyExtractor={item => item.code}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.ratesList}
                />
            </View>

            <Modal
                visible={showModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalWrapper}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Buy {selectedCurrency}</Text>
                        <TextInput
                            style={styles.modalInput}
                            keyboardType="numeric"
                            placeholder="Enter amount"
                            value={amountToBuy}
                            onChangeText={setAmountToBuy}
                            placeholderTextColor="#A0AEC0"
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#4F46E5' }]}
                                onPress={handleBuyCurrency}
                            >
                                <Text style={styles.modalButtonText}>Buy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        padding: 16,
        backgroundColor: '#F7F9FC',
    },
    balanceText: {
        fontSize: 28,
        fontWeight: '600',
        color: '#1A1F36',
        textAlign: 'center',
    },
    actionsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
    },
    actionButton: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    ratesContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    ratesTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1A1F36',
        marginBottom: 16,
    },
    ratesList: {
        paddingBottom: 16,
    },
    currencyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    currencyName: {
        fontSize: 16,
        color: '#1A1F36',
        marginBottom: 4,
    },
    currencyDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    currencyCode: {
        fontSize: 14,
        color: '#6B7280',
    },
    rate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
    },
    modalWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1F36',
        marginBottom: 16,
    },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});