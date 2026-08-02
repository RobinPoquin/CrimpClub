import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '../theme';

import LogbookScreen  from '../screens/logbook/LogbookScreen';
import StatsScreen    from '../screens/stats/StatsScreen';
import ProfileScreen  from '../screens/profile/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Onglets principaux — reçoit user depuis Stack.Screen
function MainTabs({ route }) {
  const user = route?.params?.user;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.light.bgCard,
          borderTopColor:  colors.light.border,
        },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor:   colors.accent,
        tabBarInactiveTintColor: colors.light.textMuted,
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Logbook"
        component={LogbookScreen}
        initialParams={{ userId: user?.id }}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text> }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        initialParams={{ userId: user?.id }}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text> }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        initialParams={{ userId: user?.id }}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

// Navigation racine — reçoit user depuis App.js
export default function Navigation({ user }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Main"
          component={MainTabs}
          initialParams={{ user }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}