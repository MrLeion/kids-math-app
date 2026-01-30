import { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useGameAudio } from "@/lib/audio-manager";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader, ProgressIndicator } from "@/components/game-header";
import { Feedback } from "@/components/feedback";
import { getProgress, saveProgress, addStars, unlockAchievement } from "@/lib/storage";

const ITEMS = [
  { emoji: "🦋", name: "蝴蝶" },
  { emoji: "🐝", name: "蜜蜂" },
  { emoji: "🍎", name: "苹果" },
  { emoji: "🍊", name: "橙子" },
  { emoji: "🌸", name: "花朵" },
];

function generateQuestion() {
  const num1 = Math.floor(Math.random() * 5) + 1; // 1-5
  const num2 = Math.floor(Math.random() * 5) + 1; // 1-5
  const answer = num1 + num2;
  const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  
  // 生成选项
  const options = new Set<number>();
  options.add(answer);
  while (options.size < 4) {
    const option = Math.floor(Math.random() * 10) + 2;
    if (option !== answer) {
      options.add(option);
    }
  }
  
  return {
    num1,
    num2,
    answer,
    item,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
}

function AnimatedItem({ emoji, delay, merged }: { emoji: string; delay: number; merged: boolean }) {
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (merged) {
      translateX.value = withDelay(delay, withTiming(0, { duration: 500 }));
      scale.value = withDelay(delay + 500, withSpring(1.2));
    }
  }, [merged]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.Text style={[styles.itemEmoji, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
}

export default function AdditionGameScreen() {
  const [question, setQuestion] = useState(generateQuestion());
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "celebration">("success");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showMerge, setShowMerge] = useState(false);

  const totalRounds = 10;

  // 音频系统
  const { playClick } = useGameAudio("addition");

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const progress = await getProgress();
    setScore(progress.additionScore);
  };

  const handleOptionPress = async (option: number) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(option);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    playClick();

    const isCorrect = option === question.answer;

    if (isCorrect) {
      setShowMerge(true);
      
      setTimeout(async () => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        const newScore = score + 1;
        setScore(newScore);
        await saveProgress({ additionScore: newScore });
        await addStars(1);
        
        // 检查成就
        if (newScore === 10) {
          await unlockAchievement({
            id: "addition_10",
            name: "加法入门",
            description: "完成10道加法题",
            icon: "🌸",
          });
        }
        
        if (round === totalRounds) {
          setFeedbackType("celebration");
        } else {
          setFeedbackType("success");
        }
        setShowFeedback(true);
      }, 800);
    } else {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setFeedbackType("error");
      setShowFeedback(true);
    }
  };

  const handleFeedbackComplete = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    setShowMerge(false);
    
    if (round < totalRounds) {
      setRound(round + 1);
      setQuestion(generateQuestion());
    } else {
      setRound(1);
      setQuestion(generateQuestion());
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <GameHeader 
        title="蝴蝶花园" 
        subtitle="加法启蒙"
        rightElement={<ProgressIndicator current={round} total={totalRounds} color="#34C759" />}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Scene Card */}
        <View style={styles.sceneCard}>
          <Text style={styles.storyText}>
            花园里原来有 {question.num1} 只{question.item.name}，
            又飞来了 {question.num2} 只，现在一共有几只？
          </Text>
          
          <View style={styles.gardenScene}>
            {/* First group */}
            <View style={styles.itemGroup}>
              <Text style={styles.groupLabel}>原来有</Text>
              <View style={styles.itemsRow}>
                {Array.from({ length: question.num1 }).map((_, i) => (
                  <AnimatedItem
                    key={`first-${i}`}
                    emoji={question.item.emoji}
                    delay={i * 100}
                    merged={showMerge}
                  />
                ))}
              </View>
            </View>
            
            {/* Plus sign */}
            <Text style={styles.plusSign}>+</Text>
            
            {/* Second group */}
            <View style={styles.itemGroup}>
              <Text style={styles.groupLabel}>又来了</Text>
              <View style={styles.itemsRow}>
                {Array.from({ length: question.num2 }).map((_, i) => (
                  <AnimatedItem
                    key={`second-${i}`}
                    emoji={question.item.emoji}
                    delay={i * 100 + 200}
                    merged={showMerge}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Equation */}
          <View style={styles.equation}>
            <Text style={styles.equationText}>
              {question.num1} + {question.num2} = ?
            </Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>选择正确答案：</Text>
          <View style={styles.optionsGrid}>
            {question.options.map((option) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === question.answer;
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
        </View>

        {/* Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>已完成</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.scoreUnit}>题</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>🎮 玩法说明</Text>
          <Text style={styles.instructionText}>
            看看花园里的小动物，数一数原来有几只，又来了几只，一共有多少只呢？
          </Text>
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
  sceneCard: {
    backgroundColor: "#E8FFED",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#34C759",
  },
  storyText: {
    fontSize: 16,
    color: "#3D2914",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  gardenScene: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C8F7C8",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  itemGroup: {
    alignItems: "center",
  },
  groupLabel: {
    fontSize: 12,
    color: "#34C759",
    marginBottom: 8,
  },
  itemsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    maxWidth: 100,
  },
  itemEmoji: {
    fontSize: 32,
  },
  plusSign: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#34C759",
  },
  equation: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: "center",
  },
  equationText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3D2914",
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3D2914",
    marginBottom: 12,
    textAlign: "center",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  optionButton: {
    width: 70,
    height: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 3,
    borderColor: "#34C759",
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#3D2914",
  },
  scoreCard: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    backgroundColor: "#E8FFED",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 16,
    color: "#8B7355",
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#34C759",
  },
  scoreUnit: {
    fontSize: 16,
    color: "#8B7355",
    marginLeft: 4,
  },
  instructionCard: {
    backgroundColor: "#E8FFED",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#34C759",
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#8B7355",
    lineHeight: 22,
  },
});
