import { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useGameAudio } from "@/lib/audio-manager";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader, ProgressIndicator } from "@/components/game-header";
import { Feedback } from "@/components/feedback";
import { getProgress, saveProgress, addStars, unlockAchievement } from "@/lib/storage";

type TimeType = "hour" | "half";

function generateQuestion(type: TimeType) {
  if (type === "hour") {
    const hour = Math.floor(Math.random() * 12) + 1; // 1-12
    return {
      hour,
      minute: 0,
      display: `${hour}点整`,
      type: "hour" as const,
    };
  } else {
    const hour = Math.floor(Math.random() * 12) + 1;
    return {
      hour,
      minute: 30,
      display: `${hour}点半`,
      type: "half" as const,
    };
  }
}

function generateOptions(correct: string) {
  const options = new Set<string>();
  options.add(correct);
  
  while (options.size < 4) {
    const hour = Math.floor(Math.random() * 12) + 1;
    const isHalf = Math.random() > 0.5;
    const option = isHalf ? `${hour}点半` : `${hour}点整`;
    options.add(option);
  }
  
  return Array.from(options).sort(() => Math.random() - 0.5);
}

function Clock({ hour, minute }: { hour: number; minute: number }) {
  const hourRotation = useSharedValue(0);
  const minuteRotation = useSharedValue(0);

  useEffect(() => {
    // 时针角度：每小时30度 + 每分钟0.5度
    const hourAngle = (hour % 12) * 30 + minute * 0.5;
    // 分针角度：每分钟6度
    const minuteAngle = minute * 6;
    
    hourRotation.value = withTiming(hourAngle, { duration: 500 });
    minuteRotation.value = withTiming(minuteAngle, { duration: 500 });
  }, [hour, minute]);

  const hourStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${hourRotation.value}deg` }],
  }));

  const minuteStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${minuteRotation.value}deg` }],
  }));

  return (
    <View style={styles.clockContainer}>
      {/* Clock face */}
      <View style={styles.clockFace}>
        {/* Hour markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i + 1) * 30;
          const radian = (angle - 90) * (Math.PI / 180);
          const x = 70 * Math.cos(radian);
          const y = 70 * Math.sin(radian);
          return (
            <Text
              key={i}
              style={[
                styles.hourMarker,
                {
                  left: 85 + x - 10,
                  top: 85 + y - 12,
                },
              ]}
            >
              {i + 1}
            </Text>
          );
        })}
        
        {/* Center dot */}
        <View style={styles.centerDot} />
        
        {/* Hour hand */}
        <Animated.View style={[styles.hourHand, hourStyle]} />
        
        {/* Minute hand */}
        <Animated.View style={[styles.minuteHand, minuteStyle]} />
      </View>
      
      {/* Sun/Moon decoration */}
      <Text style={styles.clockDecoration}>
        {minute === 0 ? "☀️" : "🌙"}
      </Text>
    </View>
  );
}

export default function TimeGameScreen() {
  const [timeType, setTimeType] = useState<TimeType>("hour");
  const [question, setQuestion] = useState(generateQuestion("hour"));
  const [options, setOptions] = useState(generateOptions(question.display));
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "celebration">("success");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const totalRounds = 10;

  // 音频系统
  const { playClick } = useGameAudio("time");

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    const newQuestion = generateQuestion(timeType);
    setQuestion(newQuestion);
    setOptions(generateOptions(newQuestion.display));
  }, [timeType]);

  const loadProgress = async () => {
    const progress = await getProgress();
    setScore(progress.timeScore);
  };

  const handleOptionPress = async (option: string) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(option);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    playClick();

    const isCorrect = option === question.display;

    if (isCorrect) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const newScore = score + 1;
      setScore(newScore);
      await saveProgress({ timeScore: newScore });
      await addStars(1);
      
      // 检查成就
      if (newScore === 20) {
        await unlockAchievement({
          id: "time_master",
          name: "时间管理",
          description: "掌握整点和半点",
          icon: "⏰",
        });
      }
      
      if (round === totalRounds) {
        setFeedbackType("celebration");
      } else {
        setFeedbackType("success");
      }
    } else {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setFeedbackType("error");
    }
    
    setShowFeedback(true);
  };

  const handleFeedbackComplete = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    
    if (round < totalRounds) {
      setRound(round + 1);
      const newQuestion = generateQuestion(timeType);
      setQuestion(newQuestion);
      setOptions(generateOptions(newQuestion.display));
    } else {
      setRound(1);
      const newQuestion = generateQuestion(timeType);
      setQuestion(newQuestion);
      setOptions(generateOptions(newQuestion.display));
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <GameHeader 
        title="认识时间" 
        subtitle={timeType === "hour" ? "整点认识" : "半点认识"}
        rightElement={<ProgressIndicator current={round} total={totalRounds} color="#FF6B9D" />}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              timeType === "hour" && styles.typeButtonActive,
            ]}
            onPress={() => setTimeType("hour")}
            activeOpacity={0.7}
          >
            <Text style={styles.typeIcon}>☀️</Text>
            <Text style={[
              styles.typeText,
              timeType === "hour" && styles.typeTextActive,
            ]}>
              整点
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              timeType === "half" && styles.typeButtonActive,
            ]}
            onPress={() => setTimeType("half")}
            activeOpacity={0.7}
          >
            <Text style={styles.typeIcon}>🌙</Text>
            <Text style={[
              styles.typeText,
              timeType === "half" && styles.typeTextActive,
            ]}>
              半点
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clock Display */}
        <View style={styles.clockCard}>
          <Text style={styles.questionTitle}>现在是几点？</Text>
          <Clock hour={question.hour} minute={question.minute} />
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((option) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === question.display;
            const showResult = selectedOption !== null;
            
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  showResult && isSelected && isCorrect && styles.optionCorrect,
                  showResult && isSelected && !isCorrect && styles.optionWrong,
                  showResult && !isSelected && isCorrect && styles.optionCorrectHint,
                ]}
                onPress={() => handleOptionPress(option)}
                activeOpacity={0.7}
                disabled={selectedOption !== null}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>已完成</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.scoreUnit}>题</Text>
        </View>
      </ScrollView>

      <Feedback
        visible={showFeedback}
        type={feedbackType}
        onComplete={handleFeedbackComplete}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: "#F0E6D3",
  },
  typeButtonActive: {
    backgroundColor: "#FFE8F0",
    borderColor: "#FF6B9D",
  },
  typeIcon: {
    fontSize: 24,
  },
  typeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B7355",
  },
  typeTextActive: {
    color: "#FF6B9D",
  },
  clockCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 20,
  },
  clockContainer: {
    alignItems: "center",
  },
  clockFace: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFF8E7",
    borderWidth: 4,
    borderColor: "#FF6B9D",
    position: "relative",
  },
  hourMarker: {
    position: "absolute",
    fontSize: 16,
    fontWeight: "bold",
    color: "#3D2914",
    width: 20,
    textAlign: "center",
  },
  centerDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF6B9D",
    top: 84,
    left: 84,
    zIndex: 10,
  },
  hourHand: {
    position: "absolute",
    width: 6,
    height: 50,
    backgroundColor: "#3D2914",
    borderRadius: 3,
    top: 40,
    left: 87,
    transformOrigin: "bottom",
  },
  minuteHand: {
    position: "absolute",
    width: 4,
    height: 70,
    backgroundColor: "#FF6B9D",
    borderRadius: 2,
    top: 20,
    left: 88,
    transformOrigin: "bottom",
  },
  clockDecoration: {
    fontSize: 32,
    marginTop: 12,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    width: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#FF6B9D",
  },
  optionCorrect: {
    backgroundColor: "#E8FFE8",
    borderColor: "#34C759",
  },
  optionWrong: {
    backgroundColor: "#FFE8E8",
    borderColor: "#FF6B6B",
  },
  optionCorrectHint: {
    borderColor: "#34C759",
    borderStyle: "dashed",
  },
  optionText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3D2914",
  },
  scoreCard: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    backgroundColor: "#FFE8F0",
    borderRadius: 16,
    padding: 16,
  },
  scoreLabel: {
    fontSize: 16,
    color: "#8B7355",
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF6B9D",
  },
  scoreUnit: {
    fontSize: 16,
    color: "#8B7355",
    marginLeft: 4,
  },
});
