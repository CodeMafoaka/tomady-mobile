import {
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  useFonts,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { Lock } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight
} from "react-native-reanimated";
import { BottomNav } from "../components/BottomNav";
import { Toast } from "../components/Toast";
import { C } from "../constant/theme";
import { FOODS } from "../data/mockData";
import { AlertsScreen } from "../screens/AlertsScreen";
import { AssistantScreen } from "../screens/AssistantScreen";
import { CatalogueScreen } from "../screens/CatalogueScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { FoodDetailScreen } from "../screens/FoodDetailScreen";
import { ForbiddenFoodsScreen } from "../screens/ForbiddenFoodsScreen";
import { GoalScreen } from "../screens/GoalScreen";
import { JournalScreen } from "../screens/JournalScreen";
import { PersonalInfoScreen } from "../screens/PersonalInfoScreen";
import { PrivacyScreen } from "../screens/PrivacyScreen";
import { ProfileEditScreen } from "../screens/ProfileEditScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { VoiceModal } from "../screens/VoiceModal";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { getUser, initDatabase, saveUser, getTodayMeals, addMealEntry } from "../services/database";

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
  const [toast, setToast] = useState(null);
  const [food, setFood] = useState(FOODS[0]);
  const [meals, setMeals] = useState([]);
  const [profile, setProfile] = useState({});
  const [dbReady, setDbReady] = useState(false);

  // Charger l'utilisateur depuis SQLite au démarrage
  useEffect(() => {
    (async () => {
      await initDatabase();
      const saved = await getUser();
      if (saved) {
        setProfile(saved);
        setScreen("dashboard");
        // Charger les repas du jour
        const todayMeals = await getTodayMeals();
        if (todayMeals.length > 0) {
          setMeals(todayMeals);
          applyDailyTotals(todayMeals);
        }
      }
      setDbReady(true);
    })();
  }, []);

  // Navigation direction tracking for animated transitions
  const prevScreenRef = useRef(screen);

  // Screens that should slide in from the right ("push" navigation)
  const DETAIL_SCREENS = new Set([
    "detail",
    "alerts",
    "profileEdit",
    "privacy",
    "forbiddenFoods",
    "personalInfo",
    "goal",
    "stats",
  ]);
  // Main tab screens — use fade transitions between them
  const TAB_SCREENS = new Set(["dashboard", "journal", "catalogue", "assistant", "profile"]);

  // Keep prevScreenRef in sync (ref updates don't trigger re-renders)
  useEffect(() => {
    prevScreenRef.current = screen;
  }, [screen]);

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

  if (!fontsLoaded || !dbReady) return null;

  const go = (id) => {
    setScreen(id);
    setVoiceOpen(false);
  };

  const updateProfile = async (newProfile) => {
    setProfile(newProfile);
    await saveUser(newProfile);
  };

  const showToast = (message) => {
    setToast(message);
  };

  // Recalcule les totaux du jour dans profile à partir des repas
  const applyDailyTotals = (todayMeals) => {
    setProfile((prev) => ({
      ...prev,
      caloriesConsumed: todayMeals.reduce((sum, m) => sum + (m.kcal || 0), 0),
      protein: {
        ...prev.protein,
        consumed: todayMeals.reduce((sum, m) => sum + (m.protein_g || 0), 0),
      },
      carbs: {
        ...prev.carbs,
        consumed: todayMeals.reduce((sum, m) => sum + (m.carbs_g || 0), 0),
      },
      fat: {
        ...prev.fat,
        consumed: todayMeals.reduce((sum, m) => sum + (m.fat_g || 0), 0),
      },
    }));
  };

  // Ajoute un repas : sauvegarde dans SQLite puis recharge
  const addMeal = async (partialMeal) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Détermine le prochain meal_order (0‑3)
    const existingOrders = meals.map((m) => m.meal_order).filter((o) => o !== null);
    const mealOrder = existingOrders.length > 0
      ? Math.min(3, Math.max(...existingOrders) + 1)
      : 0;

    await addMealEntry({
      ...partialMeal,
      time,
      meal_order: mealOrder,
    });

    // Recharge les repas du jour depuis SQLite
    const todayMeals = await getTodayMeals();
    setMeals(todayMeals);
    applyDailyTotals(todayMeals);

    showToast("Repas ajouté au journal \u2713");
  };
  const openFood = (f) => {
    setFood(f);
    setScreen("detail");
  };

  const renderScreen = () => {
    switch (screen) {
      case "welcome": return <WelcomeScreen go={go} />;
      case "personalInfo":
        return (
          <PersonalInfoScreen
            go={go}
            onNext={(data) => updateProfile({ ...profile, ...data })}
          />
        );
      case "goal":
        return (
          <GoalScreen
            go={go}
            onNext={(data) => updateProfile({ ...profile, ...data })}
          />
        );
      case "dashboard": return <DashboardScreen go={go} profile={profile} meals={meals} />;
      case "journal": return (
        <JournalScreen
          go={go}
          onMealDeleted={async () => {
            const todayMeals = await getTodayMeals();
            setMeals(todayMeals);
            applyDailyTotals(todayMeals);
            showToast("Repas supprimé");
          }}
        />
      );
      case "catalogue": return <CatalogueScreen go={go} openFood={openFood} profile={profile} />;
      case "detail": return <FoodDetailScreen food={food} go={go} profile={profile} />;
      case "stats": return <StatsScreen profile={profile} />;
      case "assistant": return <AssistantScreen openVoice={() => setVoiceOpen(true)} addMeal={addMeal} />;
      case "alerts": return <AlertsScreen go={go} />;
      case "profile": return <ProfileScreen go={go} profile={profile} />;
      case "profileEdit": return (
        <ProfileEditScreen
          onBack={() => go("profile")}
          onSave={async (newProfile) => {
            await updateProfile(newProfile);
            showToast("Profil mis à jour \u2713");
            go("profile");
          }}
          profile={profile}
        />
      );
      case "privacy": return <PrivacyScreen go={go} />;
      case "forbiddenFoods": return <ForbiddenFoodsScreen go={go} openFood={openFood} profile={profile} />;
      default: return <DashboardScreen go={go} profile={profile} meals={meals} />;
    }
  };

  const showNav = MAIN_TABS.has(screen);

  // Determine entering/exiting animations based on direction
  // Computed inline during render using prevScreenRef (still holds old screen)
  // and screen (new screen) to avoid stale-ref bugs
  const prev = prevScreenRef.current;
  const isGoingForward = DETAIL_SCREENS.has(screen) && (TAB_SCREENS.has(prev) || prev === "welcome");
  const isGoingBack = TAB_SCREENS.has(screen) && DETAIL_SCREENS.has(prev);
  const isTabToTab = TAB_SCREENS.has(prev) && TAB_SCREENS.has(screen);
  const isDetailToDetail = DETAIL_SCREENS.has(prev) && DETAIL_SCREENS.has(screen);
  const useFade = isTabToTab || isDetailToDetail || (!isGoingForward && !isGoingBack);

  const enteringAnimation = isGoingForward
  ? SlideInRight.duration(200).springify().damping(24).stiffness(200)
  : SlideInLeft.duration(200).springify().damping(26).stiffness(200);

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
      <View className="flex-1" style={{ backgroundColor: C.canvas, overflow: "hidden" }}>
        <StatusBar style="dark" />
        <View className="flex-1" style={{ position: "relative", overflow: "hidden" }}>
          <Animated.View
            key={screen}
            entering={useFade ? FadeIn.duration(280) : enteringAnimation}
            style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}
          >
            {renderScreen()}
          </Animated.View>
          {voiceOpen && <VoiceModal close={() => setVoiceOpen(false)} addMeal={addMeal} />}
          {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        </View>
        {showNav && <BottomNav active={screen} go={go} />}
      </View>
    </SafeAreaProvider>
  );
}
