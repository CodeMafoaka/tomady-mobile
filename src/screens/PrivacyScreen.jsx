import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shield, Lock, Database, WifiOff, Info, Cpu } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";
import { TopBar } from "../components/TopBar";

const ITEMS = [
  {
    Icon: Database,
    title: "Stockage local uniquement",
    desc: "Toutes vos données de santé, préférences alimentaires et historique sont stockées exclusivement sur votre appareil. Aucune information n'est envoyée vers un serveur externe.",
  },
  {
    Icon: WifiOff,
    title: "Fonctionne hors ligne",
    desc: "L'assistant IA Gemma s'exécute localement sur votre téléphone. Vous n'avez pas besoin de connexion Internet pour analyser vos repas ou recevoir des recommandations.",
  },
  {
    Icon: Lock,
    title: "Chiffrement des données",
    desc: "L'accès à l'application est protégé par un code PIN. Vos informations personnelles ne sont jamais partagées avec des tiers.",
  },
  {
    Icon: Shield,
    title: "Vous contrôlez vos données",
    desc: "Vous pouvez exporter ou supprimer l'intégralité de vos données à tout moment depuis les paramètres. Aucune donnée fantôme ne persiste ailleurs.",
  },
];

export function PrivacyScreen({ go }) {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      <TopBar title="Confidentialité" onBack={() => go("profile")} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}>
        {/* En-tête */}
        <View className="items-center pb-2 pt-4">
          <View
            className="mb-[14px] h-[64px] w-[64px] items-center justify-center rounded-full"
            style={{ backgroundColor: C.greenTint }}
          >
            <Shield size={28} color={C.greenDeep} />
          </View>
          <Text
            className="mb-[6px] text-[20px] font-bold"
            style={{ fontFamily: FONTS.display, color: C.ink }}
          >
            Vos données vous appartiennent
          </Text>
          <Text className="text-center text-[13px] leading-[20px]" style={{ color: C.muted }}>
            Tomady repose sur un modèle d'intelligence artificielle Gemma qui fonctionne
            intégralement sur votre appareil. Aucune donnée ne quitte votre téléphone.
          </Text>
        </View>

        {/* Mention IA locale */}
        <View
          className="flex-row items-center rounded-[18px] border p-4"
          style={{ backgroundColor: C.violetTint, borderColor: "rgba(139,92,246,0.15)", gap: 14 }}
        >
          <View
            className="h-[42px] w-[42px] items-center justify-center rounded-[12px]"
            style={{ backgroundColor: C.violet }}
          >
            <Cpu size={18} color={C.white} />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-bold" style={{ color: C.violetDeep }}>
              Analyse locale — zéro cloud
            </Text>
            <Text className="mt-[4px] text-[12px] leading-[18px]" style={{ color: C.inkSoft }}>
              Vos repas sont analysés directement sur votre téléphone par le modèle Gemma, sans
              connexion internet requise. Aucune photo, aucun texte ni aucune donnée nutritionnelle
              n'est envoyé vers un serveur extérieur.
            </Text>
          </View>
        </View>

        {/* Cartes explicatives */}
        {ITEMS.map(({ Icon, title, desc }) => (
          <View
            key={title}
            className="flex-row rounded-[18px] border p-4"
            style={{ backgroundColor: C.card, borderColor: C.line, gap: 14 }}
          >
            <View
              className="h-[42px] w-[42px] items-center justify-center rounded-[12px]"
              style={{ backgroundColor: C.greenTint }}
            >
              <Icon size={18} color={C.greenDeep} />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold" style={{ color: C.ink }}>
                {title}
              </Text>
              <Text className="mt-[4px] text-[12px] leading-[18px]" style={{ color: C.muted }}>
                {desc}
              </Text>
            </View>
          </View>
        ))}

        {/* Avertissement */}
        <View className="flex-row rounded-[14px] p-[14px]" style={{ backgroundColor: C.amberTint, gap: 10 }}>
          <Info size={16} color={C.amberDeep} style={{ marginTop: 1 }} />
          <Text className="flex-1 text-[11px] leading-[17px]" style={{ color: C.amberDeep2 }}>
            Bien que des métriques d'utilisation anonymes puissent être collectées pour améliorer
            l'application, aucune donnée personnelle, nutritionnelle ou médicale n'est transmise.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default PrivacyScreen;
