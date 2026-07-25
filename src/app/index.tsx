import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Lock } from "lucide-react-native";
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

  // PIN Security State
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let interval;
    if (lockoutTime) {
      interval = setInterval(() => {
        const now = Date.now();
        if (now >= lockoutTime) {
          setLockoutTime(null);
          setAttempts(0);
          setTimeLeft(0);
        } else {
          setTimeLeft(Math.ceil((lockoutTime - now) / 1000));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTime]);

  const handlePinSubmit = () => {
    if (lockoutTime) return;
    if (pin === "323232") {
      setIsAppLocked(false);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setLockoutTime(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
    }
  };

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

  if (isAppLocked) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 items-center justify-center px-8" style={{ backgroundColor: C.canvas }}>
          <StatusBar style="dark" />
          <View className="mb-6 h-[80px] w-[80px] items-center justify-center rounded-full" style={{ backgroundColor: C.greenTint }}>
            <Lock size={32} color={C.greenDeep} />
          </View>
          <Text style={{ fontFamily: "Fraunces_600SemiBold", color: C.ink }} className="mb-2 text-center text-[24px]">
            Accès Sécurisé
          </Text>
          <Text className="mb-8 text-center text-[14px]" style={{ color: C.muted }}>
            Veuillez entrer le code PIN pour accéder à l'application.
          </Text>

          <TextInput
            value={pin}
            onChangeText={setPin}
            placeholder="Entrez le code PIN"
            keyboardType="number-pad"
            secureTextEntry
            editable={!lockoutTime}
            className="mb-4 w-full rounded-2xl border px-5 py-4 text-center text-[18px] tracking-[4px]"
            style={{
              backgroundColor: C.white,
              borderColor: attempts >= 3 ? C.coral : C.line,
              color: C.ink,
            }}
          />

          {attempts > 0 && attempts < 3 && (
            <Text className="mb-4 text-center text-[13px] font-bold" style={{ color: C.coral }}>
              Code incorrect. {3 - attempts} tentative(s) restante(s).
            </Text>
          )}

          {lockoutTime && (
            <Text className="mb-4 text-center text-[13px] font-bold" style={{ color: C.coral }}>
              Trop de tentatives. Veuillez réessayer dans {timeString}.
            </Text>
          )}

          <Pressable
            onPress={handlePinSubmit}
            disabled={!!lockoutTime || pin.length === 0}
            className="w-full items-center rounded-[16px] py-[16px] active:opacity-80"
            style={{
              backgroundColor: lockoutTime || pin.length === 0 ? C.muted : C.green,
            }}
          >
            <Text className="text-[15px] font-bold" style={{ color: C.white }}>
              Déverrouiller
            </Text>
          </Pressable>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

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
