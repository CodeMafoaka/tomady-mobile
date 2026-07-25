import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Home, BookOpen, Compass, Sparkles, User } from "lucide-react-native";
import { C } from "@/constant/theme";

export const TABS = [
  { id: "dashboard", label: "Accueil", Icon: Home },
  { id: "journal", label: "Journal", Icon: BookOpen },
  { id: "catalogue", label: "Explorer", Icon: Compass },
  { id: "assistant", label: "Assistant", Icon: Sparkles },
  { id: "profile", label: "Profil", Icon: User },
];

export function BottomNav({ active, go }) {
  return (
    <View
      className="absolute bottom-0 left-0 right-0 flex-row justify-between border-t px-3 pb-[22px] pt-[10px]"
      style={{ backgroundColor: C.white, borderColor: C.line }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        const isAssistant = id === "assistant";

        if (isAssistant) {
          return (
            <Pressable
              key={id}
              onPress={() => go(id)}
              accessibilityLabel={label}
              accessibilityRole="tab"
              className="items-center"
              style={{ gap: 4, transform: [{ translateY: -14 }] }}
            >
              <LinearGradient
                colors={[C.green, C.greenDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="h-[50px] w-[50px] items-center justify-center rounded-full"
                style={{
                  shadowColor: C.green,
                  shadowOpacity: 0.6,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 6,
                }}
              >
                <Icon size={21} color={C.white} />
              </LinearGradient>
              <Text className="text-[10px] font-bold" style={{ color: C.greenDeep }}>
                {label}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={id}
            onPress={() => go(id)}
            accessibilityLabel={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className="flex-1 items-center justify-center py-1"
            style={{ gap: 5 }}
          >
            <Icon size={20} color={isActive ? C.green : C.muted} strokeWidth={isActive ? 2.4 : 2} />
            <Text
              className="text-[10px]"
              style={{ color: isActive ? C.greenDeep : C.muted, fontWeight: isActive ? "700" : "500" }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default BottomNav;
