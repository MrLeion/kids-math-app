import { View, Text, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface ModuleCardProps {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  progress?: number;
  onPress: () => void;
}

export function ModuleCard({
  title,
  subtitle,
  icon,
  color,
  progress = 0,
  onPress,
}: ModuleCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {progress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress}%`, backgroundColor: color },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface SubModuleCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  stars?: number;
  maxStars?: number;
  onPress: () => void;
}

export function SubModuleCard({
  title,
  description,
  icon,
  color,
  stars = 0,
  maxStars = 3,
  onPress,
}: SubModuleCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.subCard, animatedStyle]}>
        <View style={[styles.subIconContainer, { backgroundColor: color }]}>
          <Text style={styles.subIcon}>{icon}</Text>
        </View>
        <View style={styles.subContent}>
          <Text style={styles.subTitle}>{title}</Text>
          <Text style={styles.subDescription}>{description}</Text>
        </View>
        <View style={styles.starsContainer}>
          {Array.from({ length: maxStars }).map((_, i) => (
            <Text key={i} style={styles.starIcon}>
              {i < stars ? "⭐" : "☆"}
            </Text>
          ))}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#8B7355",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#F0E6D3",
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#8B7355",
    width: 36,
  },
  subCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  subIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  subIcon: {
    fontSize: 24,
  },
  subContent: {
    flex: 1,
    marginLeft: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3D2914",
    marginBottom: 2,
  },
  subDescription: {
    fontSize: 12,
    color: "#8B7355",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  starIcon: {
    fontSize: 16,
  },
});
