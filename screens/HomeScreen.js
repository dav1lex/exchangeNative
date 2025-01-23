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
    StatusBar
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
    const renderRateItem = ({item}) => (
        <TouchableOpacity
            style={styles.rateItem}
            onPress={() => {
                setSelectedCurrency(item.code);
                setShowModal(true);
            }}
        >
            <Text style={styles.currencyText}>{item.currency} ({item.code})</Text>
            <Text style={styles.rateText}>{item.mid} PLN</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F7F9FC"/>

            <View style={styles.headerSection}>
                <Text style={styles.balance}>
                    Balance: {parseFloat(balance || 0).toFixed(2)} PLN
                </Text>

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
            </View>

            <View style={styles.ratesSection}>
                <Text style={styles.title}>Exchange Rates</Text>
                <FlatList
                    data={rates}
                    keyExtractor={(item) => item.code}
                    renderItem={renderRateItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.ratesList}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                />
            </View>

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
                            autoFocus={true}
                        />
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.buyButton]}
                                onPress={handleBuyCurrency}
                            >
                                <Text style={styles.modalButtonText}>Buy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7F9FC',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerSection: {
        backgroundColor: '#F7F9FC',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
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
        gap: 8,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    fundButton: {
        backgroundColor: '#4F46E5',
    },
    transactionButton: {
        backgroundColor: '#3B82F6',
    },
    archivedButton: {
        backgroundColor: '#6366F1',
    },
    buttonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    ratesSection: {
        flex: 1,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 24,
        marginVertical: 16,
        fontWeight: '600',
        color: '#1A1F36',
    },
    ratesList: {
        paddingBottom: 16,
    },
    rateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginBottom: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
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
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 24,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
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
        backgroundColor: '#F9FAFB',
        fontSize: 16,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    buyButton: {
        backgroundColor: '#4F46E5',
    },
    cancelButton: {
        backgroundColor: '#EF4444',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});