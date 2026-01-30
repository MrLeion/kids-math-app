import { View, Text, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function GameHeader({
  title,
  subtitle,
  showBack = true,
  rightElement,
}: GameHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.centerSection}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.rightSection}>{rightElement}</View>
    </View>
  );
}

interface ProgressIndicatorProps {
  current: number;
  total: number;
  color?: string;
}

export function ProgressIndicator({
  current,
  total,
  color = "#FF9500",
}: ProgressIndicatorProps) {
  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        {current}/{total}
      </Text>
      <View style={styles.progressDots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < current ? color : "#E0E0E0" },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  leftSection: {
    width: 48,
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
  },
  rightSection: {
    width: 48,
    alignItems: "flex-end",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backIcon: {
    fontSize: 24,
    color: "#3D2914",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3D2914",
  },
  subtitle: {
    fontSize: 14,
    color: "#8B7355",
    marginTop: 2,
  },
  progressContainer: {
    alignItems: "center",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3D2914",
    marginBottom: 4,
  },
  progressDots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
