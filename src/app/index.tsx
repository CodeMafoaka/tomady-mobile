import { useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";

import { C } from "../constant/theme";
import { BottomNav } from "../components/BottomNav";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { GoalScreen } from "../screens/GoalScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { JournalScreen } from "../screens/JournalScreen";
import { CatalogueScreen } from "../screens/CatalogueScreen";
import { FoodDetailScreen } from "../screens/FoodDetailScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { AssistantScreen } from "../screens/AssistantScreen";
import { VoiceModal } from "../screens/VoiceModal";
import { AlertsScreen } from "../screens/AlertsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { FOODS } from "../data/mockData";

const MAIN_TABS = new Set(["dashboard", "journal", "catalogue", "assistant", "profile"]);

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const [screen, setScreen] = useState("welcome");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [food, setFood] = useState(FOODS[0]);

  if (!fontsLoaded) return null;

  const go = (id) => {
    setScreen(id);
    setVoiceOpen(false);
  };
  const openFood = (f) => {
    setFood(f);
    setScreen("detail");
  };

  const renderScreen = () => {
    switch (screen) {
      case "welcome": return <WelcomeScreen go={go} />;
      case "goal": return <GoalScreen go={go} />;
      case "dashboard": return <DashboardScreen go={go} />;
      case "journal": return <JournalScreen go={go} />;
      case "catalogue": return <CatalogueScreen go={go} openFood={openFood} />;
      case "detail": return <FoodDetailScreen food={food} go={go} />;
      case "stats": return <StatsScreen />;
      case "assistant": return <AssistantScreen openVoice={() => setVoiceOpen(true)} />;
      case "alerts": return <AlertsScreen />;
      case "profile": return <ProfileScreen />;
      default: return <DashboardScreen go={go} />;
    }
  };

  const showNav = MAIN_TABS.has(screen);

  return (
    <SafeAreaProvider>
      <View className="flex-1" style={{ backgroundColor: C.canvas }}>
        <StatusBar style="dark" />
        <View className="flex-1" style={{ position: "relative" }}>
          {renderScreen()}
          {voiceOpen && <VoiceModal close={() => setVoiceOpen(false)} />}
        </View>
        {showNav && <BottomNav active={screen} go={go} />}
      </View>
    </SafeAreaProvider>
  );
}
