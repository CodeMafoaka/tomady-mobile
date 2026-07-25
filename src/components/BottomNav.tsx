import { View, Text, Pressable } from "react-native";
import { Home, BookOpen, Compass, User } from "lucide-react-native";
import { C } from "@/constant/theme";
import { AIAssistantButton } from "./AIAssistantButton";

export const TABS = [
  { id: "dashboard", label: "Accueil", Icon: Home },
  { id: "journal", label: "Journal", Icon: BookOpen },
  { id: "catalogue", label: "Explorer", Icon: Compass },
  { id: "profile", label: "Profil", Icon: User },
];

export function BottomNav({ active, go }) {
  return (
    <View
      className="absolute bottom-0 left-0 right-0 flex-row justify-between px-3 pb-[22px] pt-[10px]"
      style={{ backgroundColor: C.white, borderTopColor: C.line, borderTopWidth: 1 }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        const isProfile = id === "profile";

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
            {/* Assistant button ancré au-dessus du bouton Profil */}
            {isProfile && (
              <View
                style={{
                  position: "absolute",
                  bottom: 76,
                  left: 26,
                  zIndex: 10,
                }}
                pointerEvents="box-none"
              >
                <AIAssistantButton
                  onPress={() => go("assistant")}
                />
              </View>
            )}
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
