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

type Speed = "idle" | "active" | "listening";

interface AIOrbProps {
  size?: number;
  speed?: Speed;
  style?: StyleProp<ViewStyle>;
}

interface BlobConfig {
  color: string;
  radiusRatio: number;
  orbitRatio: number;
  phase: number;
  freq: number;
  scaleAmplitude: number; // Amplitude de pulsation propre au blob
}

// Palette inspirée de la recherche visuelle Pinterest : rouges, roses chauds, magentas et orange vibrant
const BLOBS: BlobConfig[] = [
  { color: "#ff2a5f", radiusRatio: 0.32, orbitRatio: 0.28, phase: 0.0, freq: 1.0, scaleAmplitude: 0.08 },
  { color: "#ff6b00", radiusRatio: 0.28, orbitRatio: 0.24, phase: 2.1, freq: 1.2, scaleAmplitude: 0.12 },
  { color: "#e0004d", radiusRatio: 0.35, orbitRatio: 0.22, phase: 4.2, freq: 0.85, scaleAmplitude: 0.06 },
  { color: "#ff94b8", radiusRatio: 0.25, orbitRatio: 0.30, phase: 3.15, freq: 1.4, scaleAmplitude: 0.10 },
];

/* Un blob individuel avec trajectoire elliptique et respiration (scale) */
const Blob: React.FC<{
  t: SharedValue<number>;
  pulse: SharedValue<number>;
  config: BlobConfig;
  size: number;
  canvasCenter: number;
}> = ({ t, pulse, config, size, canvasCenter }) => {
  const cx = useDerivedValue(() => {
    "worklet";
    const angle = t.value * Math.PI * 2 * config.freq + config.phase;
    return canvasCenter + Math.cos(angle) * size * config.orbitRatio;
  });

  const cy = useDerivedValue(() => {
    "worklet";
    const angle = t.value * Math.PI * 2 * config.freq + config.phase;
    return canvasCenter + Math.sin(angle) * size * config.orbitRatio * 0.88; // Ellipse légèrement accentuée
  });

  // Animation de rayon dynamique (effet de déformation organique)
  const r = useDerivedValue(() => {
    "worklet";
    const baseRadius = size * config.radiusRatio;
    const pulseFactor = Math.sin(pulse.value * Math.PI * 2 * config.freq) * config.scaleAmplitude;
    return baseRadius * (1 + pulseFactor);
  });

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={r}
      color={config.color}
      blendMode="plus"
    />
  );
};

export const AIOrb: React.FC<AIOrbProps> = ({ size = 140, speed = "idle", style }) => {
  const t = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    // Vitesses ajustées : plus réactives lors de l'écoute ou du scan
    const duration = speed === "listening" ? 3500 : speed === "active" ? 5500 : 9000;
    const pulseDuration = speed === "listening" ? 1800 : speed === "active" ? 2800 : 4500;

    t.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false
    );

    pulse.value = withRepeat(
      withTiming(1, { duration: pulseDuration, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    return () => {
      cancelAnimation(t);
      cancelAnimation(pulse);
    };
  }, [speed]);

  const canvasSize = size * 1.6;
  const canvasCenter = canvasSize / 2;
  const maskRadius = size * 0.58;

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
                colors={["rgba(255,255,255,1)", "rgba(255,255,255,0.9)", "rgba(255,255,255,0)"]}
                positions={[0, 0.7, 1]}
              />
            </Circle>
          }
        >
          {/* Flou gaussien équilibré pour garder de la netteté au centre */}
          <Group layer={<Paint><Blur blur={size * 0.12} /></Paint>}>
            {BLOBS.map((config, i) => (
              <Blob
                key={i}
                t={t}
                pulse={pulse}
                config={config}
                size={size}
                canvasCenter={canvasCenter}
              />
            ))}
          </Group>
        </Mask>
      </Canvas>
    </View>
  );
};

export default AIOrb;