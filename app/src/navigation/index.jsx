import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '../theme';
import { useTheme } from '../theme/ThemeContext';

import LogbookScreen  from '../screens/logbook/LogbookScreen';
import StatsScreen    from '../screens/stats/StatsScreen';
import ProfileScreen  from '../screens/profile/ProfileScreen';
import AddAscentScreen from '../screens/logbook/AddAscentScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Onglets principaux — reçoit user depuis Stack.Screen
function MainTabs({ route }) {
  const user = route?.params?.user;
  const { palette } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.bgCard,
          borderTopColor:  palette.border,
        },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor:   colors.accent,
        tabBarInactiveTintColor: palette.textMuted,
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
        <Stack.Screen name="Main"       component={MainTabs}       initialParams={{ user }} />
        <Stack.Screen name="AddAscent"  component={AddAscentScreen} />
        <Stack.Screen name="EditAscent" component={AddAscentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}