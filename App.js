import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {BalanceProvider} from './screens/BalanceContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import FundAccountScreen from './screens/FundAccountScreen';
import TransactionScreen from './screens/TransactionScreen';
import ArchivedRatesScreen from './screens/ArchivedRatesScreen';

const Stack = createStackNavigator();

export default function App() {
    return (
        <BalanceProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Login"
                    screenOptions={{
                        headerShown: false,
                        cardStyle: {backgroundColor: '#F7F9FC'},
                        presentation: 'card',
                        animationEnabled: true,
                    }}
                >
                    <Stack.Screen name="Login"
                        component={LoginScreen}
                    />
                    <Stack.Screen
                        name="Register"
                        component={RegisterScreen}
                    />
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                    />
                    <Stack.Screen
                        name="Fund Account"
                        component={FundAccountScreen}
                    />
                    <Stack.Screen
                        name="Transaction"
                        component={TransactionScreen}
                    />
                    <Stack.Screen
                        name="Archived Rates"
                        component={ArchivedRatesScreen}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </BalanceProvider>
    );
}