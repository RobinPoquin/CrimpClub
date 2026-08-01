import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { colors } from '../theme';

import LogbookScreen    from '../screens/logbook/LogbookScreen';
import StatsScreen      from '../screens/stats/StatsScreen';
import ProfileScreen    from '../screens/profile/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:            false,
        tabBarStyle: {
          backgroundColor: colors.light.bgCard,
          borderTopColor:  colors.light.border,
        },
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
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text> }}
      />

      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text> }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}