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
import AddProjectScreen   from '../screens/projects/AddProjectScreen';
import ProjectDetailScreen from '../screens/projects/ProjectDetailScreen';
import SettingsScreen    from '../screens/profile/SettingsScreen';
import GymManagerScreen  from '../screens/profile/GymManagerScreen';
import SpotManagerScreen from '../screens/profile/SpotManagerScreen';
import SimCompScreen from '../screens/profile/SimCompScreen';
import SearchScreen        from '../screens/social/SearchScreen';
import PublicProfileScreen from '../screens/social/PublicProfileScreen';
import FollowersListScreen from '../screens/social/FollowersListScreen';
import PublicLogbookScreen from '../screens/social/PublicLogbookScreen';

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
        <Stack.Screen name="AddProject"     component={AddProjectScreen} />
        <Stack.Screen name="ProjectDetail"  component={ProjectDetailScreen} />
        <Stack.Screen name="Settings"    component={SettingsScreen} />
        <Stack.Screen name="GymManager"  component={GymManagerScreen} />
        <Stack.Screen name="SpotManager" component={SpotManagerScreen} />
        <Stack.Screen name="SimComp" component={SimCompScreen} />
        <Stack.Screen name="Search"        component={SearchScreen} />
        <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
        <Stack.Screen name="FollowersList" component={FollowersListScreen} />
        <Stack.Screen name="PublicLogbook" component={PublicLogbookScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}