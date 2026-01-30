import { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useGameAudio } from "@/lib/audio-manager";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader, ProgressIndicator } from "@/components/game-header";
import { Feedback } from "@/components/feedback";
import { getProgress, saveProgress, addStars, unlockAchievement } from "@/lib/storage";

const ITEMS = [
  { emoji: "🍎", name: "苹果", container: "🌳" },
  { emoji: "🍊", name: "橙子", container: "🌳" },
  { emoji: "🍌", name: "香蕉", container: "🌴" },
  { emoji: "🍬", name: "糖果", container: "🎁" },
  { emoji: "🧱", name: "积木", container: "📦" },
];

function generateQuestion() {
  const num1 = Math.floor(Math.random() * 6) + 4; // 4-9
  const num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // 1 to num1-1
  const answer = num1 - num2;
  const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  
  // 生成选项
  const options = new Set<number>();
  options.add(answer);
  while (options.size < 4) {
    const option = Math.floor(Math.random() * 9) + 1;
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

function FallingItem({ emoji, index, falling }: { emoji: string; index: number; falling: boolean }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (falling) {
      translateY.value = withDelay(
        index * 100,
        withTiming(150, { duration: 600 })
      );
      rotate.value = withDelay(
        index * 100,
        withTiming(Math.random() > 0.5 ? 30 : -30, { duration: 600 })
      );
      opacity.value = withDelay(
        index * 100 + 400,
        withTiming(0.3, { duration: 200 })
      );
    }
  }, [falling]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.itemEmoji, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
}

export default function SubtractionGameScreen() {
  const [question, setQuestion] = useState(generateQuestion());
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "celebration">("success");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFalling, setShowFalling] = useState(false);

  const totalRounds = 10;

  // 音频系统
  const { playClick } = useGameAudio("subtraction");

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const progress = await getProgress();
    setScore(progress.subtractionScore);
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
      setShowFalling(true);
      
      setTimeout(async () => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        const newScore = score + 1;
        setScore(newScore);
        await saveProgress({ subtractionScore: newScore });
        await addStars(1);
        
        // 检查成就
        if (newScore === 10) {
          await unlockAchievement({
            id: "subtraction_10",
            name: "减法入门",
            description: "完成10道减法题",
            icon: "🍎",
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
    setShowFalling(false);
    
    if (round < totalRounds) {
      setRound(round + 1);
      setQuestion(generateQuestion());
    } else {
      setRound(1);
      setQuestion(generateQuestion());
    }
  };

  // 分离要掉落的和保留的物品
  const fallingItems = Array.from({ length: question.num2 });
  const remainingItems = Array.from({ length: question.answer });

  return (
    <ScreenContainer className="bg-background">
      <GameHeader 
        title="苹果树" 
        subtitle="减法启蒙"
        rightElement={<ProgressIndicator current={round} total={totalRounds} color="#34C759" />}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Scene Card */}
        <View style={styles.sceneCard}>
          <Text style={styles.storyText}>
            树上原来有 {question.num1} 个{question.item.name}，
            掉下来了 {question.num2} 个，还剩几个？
          </Text>
          
          <View style={styles.treeScene}>
            {/* Tree/Container */}
            <Text style={styles.container}>{question.item.container}</Text>
            
            {/* Items on tree */}
            <View style={styles.itemsOnTree}>
              {/* Remaining items */}
              {remainingItems.map((_, i) => (
                <Text key={`remain-${i}`} style={styles.itemEmoji}>
                  {question.item.emoji}
                </Text>
              ))}
              {/* Falling items */}
              {fallingItems.map((_, i) => (
                <FallingItem
                  key={`fall-${i}`}
                  emoji={question.item.emoji}
                  index={i}
                  falling={showFalling}
                />
              ))}
            </View>
            
            {/* Ground */}
            <View style={styles.ground}>
              <Text style={styles.groundEmoji}>🌱</Text>
              <Text style={styles.groundEmoji}>🌿</Text>
              <Text style={styles.groundEmoji}>🌱</Text>
            </View>
          </View>

          {/* Equation */}
          <View style={styles.equation}>
            <Text style={styles.equationText}>
              {question.num1} - {question.num2} = ?
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
            看看树上的水果，有一些掉下来了，数一数还剩多少个呢？
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
  treeScene: {
    backgroundColor: "#87CEEB",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    minHeight: 200,
    position: "relative",
  },
  container: {
    fontSize: 80,
    position: "absolute",
    top: 10,
  },
  itemsOnTree: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    marginTop: 20,
    maxWidth: 200,
    zIndex: 2,
  },
  itemEmoji: {
    fontSize: 28,
  },
  ground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#8B4513",
    paddingVertical: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  groundEmoji: {
    fontSize: 20,
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
