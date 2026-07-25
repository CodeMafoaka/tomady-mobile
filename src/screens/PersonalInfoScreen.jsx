import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Info } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";
import { TopBar } from "../components/TopBar";

/* ---------- constantes ---------- */

const ACTIVITY_LEVELS = [
  { id: "sédentaire", label: "Sédentaire", desc: "Peu ou pas d'exercice" },
  { id: "modéré", label: "Modéré", desc: "Exercice 3–5× / semaine" },
  { id: "actif", label: "Actif", desc: "Exercice intense 6–7× / semaine" },
];

const REGIONS = [
  "Antananarivo", "Toamasina", "Antsirabe", "Fianarantsoa",
  "Mahajanga", "Toliara", "Autre",
];

const STEP = { current: 2, total: 5 };
const STEP_LABELS = ["Bienvenue", "Infos", "Objectif", "Profil", "Prêt"];

/* ==============================================================
   Écran : Informations personnelles (onboarding)
   ============================================================== */

export function PersonalInfoScreen({ go, onNext }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    weight: "",
    height: "",
    activityLevel: "modéré",
    region: "",
  });

  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const canContinue =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.age.trim() &&
    form.weight.trim() &&
    form.height.trim() &&
    form.region.trim();

  const handleContinue = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = "Requis";
    if (!form.lastName.trim()) newErrors.lastName = "Requis";
    const age = parseInt(form.age, 10);
    if (!form.age.trim() || isNaN(age) || age <= 0 || age > 150) newErrors.age = "Âge invalide (1–150)";
    const weight = parseFloat(form.weight);
    if (!form.weight.trim() || isNaN(weight) || weight <= 0 || weight > 500) newErrors.weight = "Poids invalide (1–500 kg)";
    const height = parseInt(form.height, 10);
    if (!form.height.trim() || isNaN(height) || height <= 0 || height > 300) newErrors.height = "Taille invalide (1–300 cm)";
    if (!form.region.trim()) newErrors.region = "Sélectionnez votre région";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onNext({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      name: form.firstName.trim(),
      age,
      weight: { current: weight, start: weight, target: weight - 5 },
      height,
      activityLevel: form.activityLevel,
      region: form.region,
    });
    go("goal");
  };

  /* ---- sous-composant champ texte ---- */

  const renderField = (label, field, opts = {}) => {
    const { keyboard = "default", placeholder = "", suffix = "" } = opts;
    const hasError = !!errors[field];
    return (
      <View className="mb-4">
        <Text className="mb-[6px] text-[11px] font-extrabold uppercase tracking-[0.5px]" style={{ color: C.muted }}>
          {label}
        </Text>
        <View
          className="flex-row items-center rounded-xl border"
          style={{ backgroundColor: C.white, borderColor: hasError ? C.coral : C.line }}
        >
          <TextInput
            value={form[field]}
            onChangeText={(v) => updateField(field, v)}
            placeholder={placeholder}
            keyboardType={keyboard}
            accessibilityLabel={label}
            className="flex-1 rounded-xl px-[14px] py-[10px] text-[14px]"
            style={{ color: C.ink }}
          />
          {suffix ? (
            <Text className="mr-[14px] text-[12px] font-semibold" style={{ color: C.muted }}>
              {suffix}
            </Text>
          ) : null}
        </View>
        {hasError ? (
          <Text className="mt-[4px] text-[11px]" style={{ color: C.coral }}>
            {errors[field]}
          </Text>
        ) : null}
      </View>
    );
  };

  /* ---- rendu principal ---- */

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.white }}>
      <TopBar title="Vos informations" onBack={() => go("welcome")} />

      {/* Barre de progression */}
      <View className="px-5 pb-1">
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {Array.from({ length: STEP.total }, (_, i) => (
            <View key={i + 1} className="flex-1">
              <View
                className="h-2 rounded-full"
                style={{
                  backgroundColor: i + 1 <= STEP.current ? C.green : C.line,
                  opacity: i + 1 <= STEP.current ? 1 : 0.5,
                }}
              />
            </View>
          ))}
        </View>
        <View className="mt-[6px] flex-row justify-between">
          {STEP_LABELS.map((label, i) => (
            <Text
              key={label}
              className="text-[10.5px] font-semibold"
              style={{
                color: i <= STEP.current - 1 ? C.greenDeep : C.muted,
                opacity: i <= STEP.current - 1 ? 1 : 0.5,
              }}
            >
              {label}
            </Text>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, gap: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Identité */}
          <View
            className="rounded-[20px] border p-4"
            style={{ backgroundColor: C.card, borderColor: C.line }}
          >
            <Text
              className="mb-[14px] text-[11px] font-extrabold uppercase tracking-[0.5px]"
              style={{ color: C.greenDeep }}
            >
              Identité
            </Text>

            <View className="flex-row" style={{ gap: 10 }}>
              <View className="flex-1">
                {renderField("Prénom", "firstName", { placeholder: "Votre prénom" })}
              </View>
              <View className="flex-1">
                {renderField("Nom", "lastName", { placeholder: "Votre nom" })}
              </View>
            </View>

            <View className="flex-row" style={{ gap: 10 }}>
              <View className="flex-1">
                {renderField("Âge", "age", { keyboard: "number-pad", placeholder: "28" })}
              </View>
              <View className="flex-1">
                {renderField("Poids", "weight", { keyboard: "decimal-pad", placeholder: "68", suffix: "kg" })}
              </View>
              <View className="flex-1">
                {renderField("Taille", "height", { keyboard: "number-pad", placeholder: "165", suffix: "cm" })}
              </View>
            </View>
          </View>

          {/* Activité */}
          <View
            className="rounded-[20px] border p-4"
            style={{ backgroundColor: C.card, borderColor: C.line }}
          >
            <Text
              className="mb-[14px] text-[11px] font-extrabold uppercase tracking-[0.5px]"
              style={{ color: C.greenDeep }}
            >
              Activité physique
            </Text>

            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {ACTIVITY_LEVELS.map((opt) => {
                const isSelected = form.activityLevel === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => updateField("activityLevel", opt.id)}
                    accessibilityLabel={`${opt.label} — ${opt.desc}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    className="flex-1 rounded-xl border p-[12px] active:opacity-80"
                    style={{
                      minWidth: "30%",
                      borderColor: isSelected ? C.green : C.line,
                      backgroundColor: isSelected ? C.greenTint : C.white,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-[13px] font-bold"
                        style={{ color: isSelected ? C.greenDeep : C.ink }}
                      >
                        {opt.label}
                      </Text>
                      {isSelected && <Check size={14} color={C.greenDeep} />}
                    </View>
                    <Text
                      className="mt-[2px] text-[10.5px]"
                      style={{ color: isSelected ? C.greenDeep : C.muted }}
                    >
                      {opt.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Région */}
          <View
            className="rounded-[20px] border p-4"
            style={{ backgroundColor: C.card, borderColor: C.line }}
          >
            <Text
              className="mb-[10px] text-[11px] font-extrabold uppercase tracking-[0.5px]"
              style={{ color: C.greenDeep }}
            >
              Région
            </Text>
            <Text className="mb-[10px] text-[12.5px]" style={{ color: C.muted }}>
              Où vous trouvez-vous à Madagascar&nbsp;?
            </Text>

            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {REGIONS.map((r) => {
                const isSelected = form.region === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => updateField("region", r)}
                    accessibilityLabel={r}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    className="flex-row items-center rounded-full border px-[16px] py-[9px] active:opacity-70"
                    style={{
                      borderColor: isSelected ? C.green : C.line,
                      backgroundColor: isSelected ? C.greenTint : C.white,
                      gap: 5,
                    }}
                  >
                    {isSelected && <Check size={13} color={C.greenDeep} />}
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: isSelected ? C.greenDeep : C.ink }}
                    >
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.region && (
              <Text className="mt-[6px] text-[11px]" style={{ color: C.coral }}>
                {errors.region}
              </Text>
            )}
          </View>

          {/* Disclaimer */}
          <View className="flex-row rounded-[14px] p-[14px]" style={{ backgroundColor: C.amberTint, gap: 10 }}>
            <Info size={16} color={C.amberDeep} style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[11px] leading-[17px]" style={{ color: C.amberDeep2 }}>
              Ces informations nous aident à personnaliser vos recommandations nutritionnelles.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bouton Continuer */}
      <View className="px-5 pb-[30px]">
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          accessibilityLabel="Continuer vers l'objectif"
          accessibilityRole="button"
          className="w-full items-center rounded-2xl py-[15px] active:opacity-80"
          style={{
            backgroundColor: canContinue ? C.green : C.muted,
            shadowColor: canContinue ? C.green : "transparent",
            shadowOpacity: canContinue ? 0.4 : 0,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: canContinue ? 4 : 0,
          }}
        >
          <Text className="text-[15px] font-bold" style={{ color: C.white }}>
            Continuer
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default PersonalInfoScreen;
