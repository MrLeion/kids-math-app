import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Modal, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSoundEffect } from "@/lib/audio-manager";

interface FeedbackProps {
  visible: boolean;
  type: "success" | "error" | "celebration";
  message?: string;
  onComplete?: () => void;
}

// 鼓励语库
const SUCCESS_MESSAGES = [
  "真棒！",
  "太厉害了！",
  "做得好！",
  "你真聪明！",
  "继续加油！",
  "非常棒！",
  "好极了！",
];

const ERROR_MESSAGES = [
  "再试试！",
  "别灰心！",
  "加油哦！",
  "差一点点！",
  "再想想！",
];

const CELEBRATION_MESSAGES = [
  "太厉害了！",
  "你是最棒的！",
  "完美通关！",
  "超级厉害！",
  "恭喜恭喜！",
];

function getRandomMessage(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function Feedback({ visible, type, message, onComplete }: FeedbackProps) {
  const scale = useSharedValue(0);
  const { playSuccess, playWrong } = useSoundEffect();
  const rotation = useSharedValue(0);
  const [displayMessage, setDisplayMessage] = useState("");
  
  // 星星动画
  const star1Scale = useSharedValue(0);
  const star2Scale = useSharedValue(0);
  const star3Scale = useSharedValue(0);
  const star1Rotate = useSharedValue(0);
  const star2Rotate = useSharedValue(0);
  const star3Rotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // 设置显示消息
      if (message) {
        setDisplayMessage(message);
      } else {
        switch (type) {
          case "success":
            setDisplayMessage(getRandomMessage(SUCCESS_MESSAGES));
            break;
          case "error":
            setDisplayMessage(getRandomMessage(ERROR_MESSAGES));
            break;
          case "celebration":
            setDisplayMessage(getRandomMessage(CELEBRATION_MESSAGES));
            break;
        }
      }

      // Haptic feedback
      if (Platform.OS !== "web") {
        if (type === "success" || type === "celebration") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          playSuccess();
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          playWrong();
        }
      }

      // Animation
      if (type === "error") {
        // 错误时的抖动动画
        scale.value = withSequence(
          withSpring(1.2),
          withTiming(1, { duration: 100 }),
          withSequence(
            withTiming(1.05, { duration: 50 }),
            withTiming(0.95, { duration: 50 }),
            withTiming(1.05, { duration: 50 }),
            withTiming(0.95, { duration: 50 }),
            withTiming(1, { duration: 50 })
          )
        );
        rotation.value = withSequence(
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
      } else if (type === "celebration") {
        // 庆祝时的弹跳动画
        scale.value = withSpring(1.3, { damping: 6 }, () => {
          scale.value = withTiming(1, { duration: 300 });
        });
        
        // 星星依次出现
        star1Scale.value = withDelay(200, withSpring(1.2, { damping: 6 }));
        star2Scale.value = withDelay(400, withSpring(1.2, { damping: 6 }));
        star3Scale.value = withDelay(600, withSpring(1.2, { damping: 6 }));
        
        // 星星旋转
        star1Rotate.value = withDelay(200, withTiming(360, { duration: 500 }));
        star2Rotate.value = withDelay(400, withTiming(-360, { duration: 500 }));
        star3Rotate.value = withDelay(600, withTiming(360, { duration: 500 }));
      } else {
        // 成功时的弹跳动画
        scale.value = withSpring(1.2, { damping: 8 }, () => {
          scale.value = withTiming(1, { duration: 200 });
        });
      }

      // Auto dismiss
      const dismissTime = type === "celebration" ? 2500 : type === "error" ? 1500 : 1200;
      const timer = setTimeout(() => {
        scale.value = withTiming(0, { duration: 200 }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        });
        star1Scale.value = withTiming(0, { duration: 200 });
        star2Scale.value = withTiming(0, { duration: 200 });
        star3Scale.value = withTiming(0, { duration: 200 });
      }, dismissTime);

      return () => clearTimeout(timer);
    } else {
      scale.value = 0;
      star1Scale.value = 0;
      star2Scale.value = 0;
      star3Scale.value = 0;
    }
  }, [visible, type, message]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const star1Style = useAnimatedStyle(() => ({
    transform: [
      { scale: star1Scale.value },
      { rotate: `${star1Rotate.value}deg` },
    ],
  }));

  const star2Style = useAnimatedStyle(() => ({
    transform: [
      { scale: star2Scale.value },
      { rotate: `${star2Rotate.value}deg` },
    ],
  }));

  const star3Style = useAnimatedStyle(() => ({
    transform: [
      { scale: star3Scale.value },
      { rotate: `${star3Rotate.value}deg` },
    ],
  }));

  const getEmoji = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "celebration":
        return "🎉";
      default:
        return "✓";
    }
  };

  const getColor = () => {
    switch (type) {
      case "success":
        return "#30D158";
      case "error":
        return "#FF6B6B";
      case "celebration":
        return "#FFD60A";
      default:
        return "#30D158";
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#E8FFE8";
      case "error":
        return "#FFE8E8";
      case "celebration":
        return "#FFF8E7";
      default:
        return "#E8FFE8";
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { backgroundColor: getBackgroundColor() }, animatedStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: getColor() }]}>
            <Text style={styles.icon}>{getEmoji()}</Text>
          </View>
          <Text style={[styles.message, { color: getColor() }]}>{displayMessage}</Text>
          {type === "celebration" && (
            <View style={styles.starsContainer}>
              <Animated.Text style={[styles.star, star1Style]}>⭐</Animated.Text>
              <Animated.Text style={[styles.star, star2Style]}>⭐</Animated.Text>
              <Animated.Text style={[styles.star, star3Style]}>⭐</Animated.Text>
            </View>
          )}
          {type === "success" && (
            <View style={styles.encourageContainer}>
              <Text style={styles.encourageText}>+1 ⭐</Text>
            </View>
          )}
        </Animated.View>
        
        {/* 庆祝时的彩带效果 */}
        {type === "celebration" && (
          <View style={styles.confettiContainer}>
            <Text style={styles.confetti}>🎊</Text>
            <Text style={[styles.confetti, { left: "20%" }]}>🎈</Text>
            <Text style={[styles.confetti, { left: "80%" }]}>🎈</Text>
            <Text style={[styles.confetti, { left: "40%", top: "20%" }]}>🎊</Text>
            <Text style={[styles.confetti, { left: "60%", top: "20%" }]}>🎉</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  message: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  star: {
    fontSize: 36,
  },
  encourageContainer: {
    marginTop: 12,
    backgroundColor: "#FFD60A",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  encourageText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3D2914",
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  confetti: {
    position: "absolute",
    fontSize: 32,
    top: "10%",
    left: "50%",
  },
});
