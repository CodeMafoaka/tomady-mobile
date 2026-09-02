import { Pressable, Text, View, ActivityIndicator } from "react-native";
import { Download } from "lucide-react-native";
import { C } from "../constant/theme";

export type ModelStatus = "loading" | "ready" | "mock" | "downloading" | "unavailable";

export function AIStatusBadge({
  status,
  progress,
  onPress,
}: {
  status?: ModelStatus;
  /** 0..1 download progress, shown only while status === "downloading". */
  progress?: number | null;
  /** Called when the badge is tappable (mock/unavailable) — triggers a model download. */
  onPress?: () => void;
}) {
  const s = status ?? "ready";

  if (s === "loading") {
    return (
      <View
        className="flex-row items-center rounded-full px-[9px] py-[5px]"
        style={{ backgroundColor: C.violetTint, gap: 5 }}
      >
        <ActivityIndicator size={8} color={C.violetDeep} />
        <Text className="text-[10.5px] font-bold" style={{ color: C.violetDeep }}>
          Modèle en cours de chargement
        </Text>
      </View>
    );
  }

  if (s === "downloading") {
    const pct = Math.round((progress ?? 0) * 100);
    return (
      <View
        className="flex-row items-center rounded-full px-[9px] py-[5px]"
        style={{ backgroundColor: C.violetTint, gap: 5 }}
      >
        <ActivityIndicator size={8} color={C.violetDeep} />
        <Text className="text-[10.5px] font-bold" style={{ color: C.violetDeep }}>
          Téléchargement du modèle… {pct}%
        </Text>
      </View>
    );
  }

  if (s === "unavailable") {
    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityLabel="Télécharger le modèle IA"
        accessibilityRole="button"
        className="flex-row items-center rounded-full px-[9px] py-[5px] active:opacity-70"
        style={{ backgroundColor: C.coralTint, gap: 5 }}
      >
        <View className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: C.coral }} />
        <Text className="text-[10.5px] font-bold" style={{ color: C.coral }}>
          Modèle indisponible
        </Text>
        {onPress && <Download size={11} color={C.coral} />}
      </Pressable>
    );
  }

  if (s === "mock") {
    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityLabel="Télécharger le modèle IA réel"
        accessibilityRole="button"
        className="flex-row items-center rounded-full px-[9px] py-[5px] active:opacity-70"
        style={{ backgroundColor: C.amberTint, gap: 5 }}
      >
        <View className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: C.amber }} />
        <Text className="text-[10.5px] font-bold" style={{ color: C.amberDeep }}>
          Mode démo — télécharger le modèle
        </Text>
        {onPress && <Download size={11} color={C.amberDeep} />}
      </Pressable>
    );
  }

  // ready
  return (
    <View
      className="flex-row items-center rounded-full px-[9px] py-[5px]"
      style={{ backgroundColor: C.violetTint, gap: 5 }}
    >
      <View className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: C.violet }} />
      <Text className="text-[10.5px] font-bold" style={{ color: C.violetDeep }}>
        IA locale prête · hors-ligne
      </Text>
    </View>
  );
}

export default AIStatusBadge;
