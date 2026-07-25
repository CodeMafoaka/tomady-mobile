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
import { FoodDetailScreen } from "../screens/FoodDetailScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { AssistantScreen } from "../screens/AssistantScreen";
import { VoiceModal } from "../screens/VoiceModal";
import { AlertsScreen } from "../screens/AlertsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { FOODS, MEALS_TODAY } from "../data/mockData";

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
  const [meals, setMeals] = useState(MEALS_TODAY);

  if (!fontsLoaded) return null;

  const go = (id) => {
    setScreen(id);
    setVoiceOpen(false);
  };

  // Ajoute un repas dans le premier créneau vide du journal du jour
  // (repère : kcal === null dans mockData.js). Sinon, l'ajoute en fin de liste.
  const addMeal = (partialMeal) => {
    setMeals((prev) => {
      const emptyIdx = prev.findIndex((m) => m.kcal === null);
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const meal = { time, status: "good", ...partialMeal };
      if (emptyIdx !== -1) {
        const next = [...prev];
        next[emptyIdx] = { ...next[emptyIdx], ...meal };
        return next;
      }
      return [...prev, meal];
    });
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
      case "journal": return <JournalScreen go={go} meals={meals} />;
      case "catalogue": return <CatalogueScreen go={go} openFood={openFood} />;
      case "detail": return <FoodDetailScreen food={food} go={go} />;
      case "stats": return <StatsScreen />;
      case "assistant": return <AssistantScreen openVoice={() => setVoiceOpen(true)} addMeal={addMeal} />;
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
          {voiceOpen && <VoiceModal close={() => setVoiceOpen(false)} addMeal={addMeal} />}
        </View>
        {showNav && <BottomNav active={screen} go={go} />}
      </View>
    </SafeAreaProvider>
  );
}
