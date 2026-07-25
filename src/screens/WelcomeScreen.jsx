import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Leaf } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";
import { Blob } from "../components/Blob";

export function WelcomeScreen({ go }) {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.white }}>
      <View className="flex-1 items-center justify-center px-8" style={{ position: "relative" }}>
        <Blob size={220} color={C.greenTint} style={{ top: 20, left: -40 }} />
        <Blob size={140} color={C.amberTint} style={{ bottom: 80, right: -30 }} />

        <View className="items-center" style={{ zIndex: 1 }}>
          <LinearGradient
            colors={[C.green, C.greenDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="mb-[26px] h-[92px] w-[92px] items-center justify-center rounded-full"
          >
            <Leaf size={40} color={C.white} />
          </LinearGradient>

          <Text
            style={{ fontFamily: FONTS.display, color: C.greenDeep }}
            className="mb-[10px] text-[15px] font-semibold uppercase tracking-[2px]"
          >
            Tomady
          </Text>

          <Text
            style={{ fontFamily: FONTS.display, color: C.ink }}
            className="text-center text-[27px] font-semibold leading-[34px]"
          >
            Votre alimentation.{"\n"}Votre objectif.{"\n"}Votre intelligence nutritionnelle.
          </Text>

          <Text className="mt-4 text-center text-[14.5px] leading-[23px]" style={{ color: C.muted }}>
            Comprenez vos habitudes alimentaires et avancez vers vos objectifs avec un assistant IA personnalisé.
          </Text>
        </View>
      </View>

      <View className="px-6 pb-[34px]" style={{ zIndex: 1 }}>
        <Pressable
          onPress={() => go("goal")}
          accessibilityLabel="Commencer l'expérience Tomady"
          accessibilityRole="button"
          className="w-full items-center rounded-[18px] py-4 active:opacity-80"
          style={{
            backgroundColor: C.green,
            shadowColor: C.green,
            shadowOpacity: 0.5,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 10 },
            elevation: 4,
          }}
        >
          <Text className="text-[15.5px] font-bold" style={{ color: C.white }}>
            Commencer
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default WelcomeScreen;
