import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldAlert, AlertTriangle, Check } from "lucide-react-native";
import { C } from "../constant/theme";
import { TopBar } from "../components/TopBar";
import { ALERTS } from "../data/mockData";

const STYLES = {
  bad: { bg: C.coralTint, fg: C.coral, Icon: ShieldAlert },
  warn: { bg: C.amberTint, fg: C.amber, Icon: AlertTriangle },
  good: { bg: C.greenTint, fg: C.green, Icon: Check },
};

export function AlertsScreen() {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      <TopBar title="Alertes" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 12 }}>
        {ALERTS.map((a, i) => {
          const s = STYLES[a.type];
          return (
            <View
              key={i}
              className="flex-row rounded-[18px] border p-[15px]"
              style={{ backgroundColor: C.card, borderColor: C.line, gap: 12 }}
              accessibilityLabel={`${a.title} : ${a.text}`}
              accessibilityRole="alert"
            >
              <View className="h-[38px] w-[38px] items-center justify-center rounded-xl" style={{ backgroundColor: s.bg }}>
                <s.Icon size={17} color={s.fg} />
              </View>
              <View className="flex-1">
                <Text className="text-[13.5px] font-bold" style={{ color: C.ink }}>{a.title}</Text>
                <Text className="mt-[3px] text-[12.5px] leading-[19px]" style={{ color: C.muted }}>{a.text}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

export default AlertsScreen;
