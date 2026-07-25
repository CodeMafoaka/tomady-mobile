import React, { useEffect } from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import {
  Canvas,
  Group,
  Circle,
  Paint,
  Blur,
  Mask,
  RadialGradient,
  vec,
} from "@shopify/react-native-skia";
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  SharedValue,
} from "react-native-reanimated";

/**
 * AIOrb — reproduit l'effet de l'image de référence :
 * plusieurs masses de couleur (corail, violet, teal, rouge)
 * qui orbitent lentement les unes autour des autres, floutées
 * ensemble (vrai flou gaussien via Skia) et mélangées en mode
 * additif ("plus") pour obtenir ce halo organique et lumineux
 * autour d'un centre sombre.
 *
 * Nécessite :
 *   npx expo install @shopify/react-native-skia
 *   (react-native-reanimated déjà présent dans le projet)
 */

type Speed = "idle" | "active" | "listening";

interface AIOrbProps {
  size?: number;
  speed?: Speed;
  style?: StyleProp<ViewStyle>;
}

interface BlobConfig {
  color: string;
  radiusRatio: number; // rayon du blob / size
  orbitRatio: number; // rayon de l'orbite / size
  phase: number; // décalage angulaire de départ (radians)
  freq: number; // vitesse relative de rotation du blob
}

// Palette calquée sur la référence : corail chaud, violet, cyan/teal, rouge profond
const BLOBS: BlobConfig[] = [
  { color: "#ff6a4d", radiusRatio: 0.3, orbitRatio: 0.34, phase: 0.0, freq: 1.0 },
  { color: "#b34ce0", radiusRatio: 0.34, orbitRatio: 0.3, phase: 2.1, freq: 0.86 },
  { color: "#23c6e0", radiusRatio: 0.32, orbitRatio: 0.32, phase: 4.2, freq: 1.14 },
  { color: "#e0335c", radiusRatio: 0.26, orbitRatio: 0.37, phase: 3.15, freq: 0.7 },
];

/* Un blob individuel : sa propre dérivation de position pour respecter
   les règles des hooks (chaque instance a son hook top-level, pas dans une boucle). */
const Blob: React.FC<{
  t: SharedValue<number>;
  config: BlobConfig;
  size: number;
  canvasCenter: number;
}> = ({ t, config, size, canvasCenter }) => {
  const cx = useDerivedValue(() => {
    "worklet";
    const angle = t.value * Math.PI * 2 * config.freq + config.phase;
    return canvasCenter + Math.cos(angle) * size * config.orbitRatio;
  });

  const cy = useDerivedValue(() => {
    "worklet";
    const angle = t.value * Math.PI * 2 * config.freq + config.phase;
    return canvasCenter + Math.sin(angle) * size * config.orbitRatio * 0.92; // légère ellipse
  });

  return <Circle cx={cx} cy={cy} r={size * config.radiusRatio} color={config.color} blendMode="plus" />;
};

export const AIOrb: React.FC<AIOrbProps> = ({ size = 140, speed = "idle", style }) => {
  const t = useSharedValue(0);

  useEffect(() => {
    const duration = speed === "listening" ? 5200 : speed === "active" ? 8000 : 13000;
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [speed]);

  // Canvas plus grand que le halo visible : le flou peut "déborder"
  // et s'estomper en douceur au lieu d'être coupé net.
  const canvasSize = size * 1.7;
  const canvasCenter = canvasSize / 2;
  const maskRadius = size * 0.62;

  return (
    <View
      style={[
        { width: size, height: size, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <Canvas style={{ width: canvasSize, height: canvasSize, position: "absolute" }}>
        <Mask
          mode="alpha"
          mask={
            <Circle cx={canvasCenter} cy={canvasCenter} r={maskRadius}>
              <RadialGradient
                c={vec(canvasCenter, canvasCenter)}
                r={maskRadius}
                colors={["white", "white", "rgba(255,255,255,0)"]}
                positions={[0, 0.68, 1]}
              />
            </Circle>
          }
        >
          <Group layer={<Paint><Blur blur={size * 0.16} /></Paint>}>
            {BLOBS.map((config, i) => (
              <Blob key={i} t={t} config={config} size={size} canvasCenter={canvasCenter} />
            ))}
          </Group>
        </Mask>
      </Canvas>
    </View>
  );
};

export default AIOrb;