import { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useGameAudio } from "@/lib/audio-manager";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader, ProgressIndicator } from "@/components/game-header";
import { Feedback } from "@/components/feedback";
import { getProgress, saveProgress, addStars } from "@/lib/storage";

const ANIMALS = [
  { emoji: "🐰", name: "兔子" },
  { emoji: "🐢", name: "乌龟" },
  { emoji: "🐶", name: "小狗" },
  { emoji: "🐱", name: "小猫" },
  { emoji: "🐻", name: "小熊" },
  { emoji: "🦊", name: "狐狸" },
];

function generateQuestion() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  let num2 = Math.floor(Math.random() * 10) + 1;
  while (num2 === num1) {
    num2 = Math.floor(Math.random() * 10) + 1;
  }
  
  const animals = [...ANIMALS].sort(() => Math.random() - 0.5).slice(0, 2);
  
  return {
    num1,
    num2,
    animal1: animals[0],
    animal2: animals[1],
    correctAnswer: num1 > num2 ? ">" : "<",
  };
}

export default function CompareGameScreen() {
  const [question, setQuestion] = useState(generateQuestion());
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "celebration">("success");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showRace, setShowRace] = useState(false);

  const animal1Position = useSharedValue(0);
  const animal2Position = useSharedValue(0);

  const totalRounds = 10;

  // 音频系统
  const { playClick } = useGameAudio("compare");

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const progress = await getProgress();
    setScore(progress.compareScore);
  };

  const runRace = (winner: number) => {
    setShowRace(true);
    const winnerPos = winner === 1 ? animal1Position : animal2Position;
    const loserPos = winner === 1 ? animal2Position : animal1Position;
    
    winnerPos.value = withSequence(
      withTiming(200, { duration: 800 }),
      withTiming(200, { duration: 200 })
    );
    loserPos.value = withTiming(100, { duration: 1000 });
  };

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answer);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    playClick();

    const isCorrect = answer === question.correctAnswer;
    
    // 开始赛跑动画
    const winner = question.num1 > question.num2 ? 1 : 2;
    runRace(winner);

    // 延迟显示结果
    setTimeout(async () => {
      if (isCorrect) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        const newScore = score + 1;
        setScore(newScore);
        await saveProgress({ compareScore: newScore });
        await addStars(1);
        
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
    }, 1200);
  };

  const handleFeedbackComplete = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setShowRace(false);
    animal1Position.value = 0;
    animal2Position.value = 0;
    
    if (round < totalRounds) {
      setRound(round + 1);
      setQuestion(generateQuestion());
    } else {
      setRound(1);
      setQuestion(generateQuestion());
    }
  };

  const animal1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: animal1Position.value }],
  }));

  const animal2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: animal2Position.value }],
  }));

  return (
    <ScreenContainer className="bg-background">
      <GameHeader 
        title="动物赛跑" 
        rightElement={<ProgressIndicator current={round} total={totalRounds} color="#5AC8FA" />}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Race Track */}
        <View style={styles.raceCard}>
          <Text style={styles.questionTitle}>
            哪个数字更大？数字大的动物跑得快！
          </Text>
          
          <View style={styles.raceTrack}>
            {/* Track 1 */}
            <View style={styles.trackRow}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{question.num1}</Text>
              </View>
              <View style={styles.track}>
                <Animated.Text style={[styles.animalEmoji, animal1Style]}>
                  {question.animal1.emoji}
                </Animated.Text>
                <View style={styles.finishLine} />
              </View>
            </View>
            
            {/* Track 2 */}
            <View style={styles.trackRow}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{question.num2}</Text>
              </View>
              <View style={styles.track}>
                <Animated.Text style={[styles.animalEmoji, animal2Style]}>
                  {question.animal2.emoji}
                </Animated.Text>
                <View style={styles.finishLine} />
              </View>
            </View>
          </View>
        </View>

        {/* Comparison Question */}
        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonNumber}>{question.num1}</Text>
          <View style={styles.symbolButtons}>
            <TouchableOpacity
              style={[
                styles.symbolButton,
                selectedAnswer === ">" && styles.symbolButtonSelected,
                selectedAnswer && selectedAnswer !== ">" && question.correctAnswer === ">" && styles.symbolButtonCorrect,
              ]}
              onPress={() => handleAnswer(">")}
              disabled={selectedAnswer !== null}
              activeOpacity={0.7}
            >
              <Text style={styles.symbolText}>{">"}</Text>
              <Text style={styles.symbolLabel}>大于</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.symbolButton,
                selectedAnswer === "<" && styles.symbolButtonSelected,
                selectedAnswer && selectedAnswer !== "<" && question.correctAnswer === "<" && styles.symbolButtonCorrect,
              ]}
              onPress={() => handleAnswer("<")}
              disabled={selectedAnswer !== null}
              activeOpacity={0.7}
            >
              <Text style={styles.symbolText}>{"<"}</Text>
              <Text style={styles.symbolLabel}>小于</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.comparisonNumber}>{question.num2}</Text>
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
            比较两个数字的大小，选择正确的符号！{"\n"}
            数字大的动物会跑得更快哦！
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
  raceCard: {
    backgroundColor: "#E8F7FF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#5AC8FA",
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3D2914",
    textAlign: "center",
    marginBottom: 16,
  },
  raceTrack: {
    gap: 16,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numberBadge: {
    width: 40,
    height: 40,
    backgroundColor: "#5AC8FA",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  track: {
    flex: 1,
    height: 50,
    backgroundColor: "#C8E8FF",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
    position: "relative",
    overflow: "hidden",
  },
  animalEmoji: {
    fontSize: 32,
    zIndex: 2,
  },
  finishLine: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#FF6B6B",
  },
  comparisonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  comparisonNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#3D2914",
    width: 60,
    textAlign: "center",
  },
  symbolButtons: {
    flexDirection: "row",
    gap: 12,
  },
  symbolButton: {
    width: 60,
    height: 70,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  symbolButtonSelected: {
    backgroundColor: "#5AC8FA",
    borderColor: "#5AC8FA",
  },
  symbolButtonCorrect: {
    borderColor: "#34C759",
    borderWidth: 3,
    borderStyle: "dashed",
  },
  symbolText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3D2914",
  },
  symbolLabel: {
    fontSize: 10,
    color: "#8B7355",
    marginTop: 2,
  },
  scoreCard: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    backgroundColor: "#E8F7FF",
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
    color: "#5AC8FA",
  },
  scoreUnit: {
    fontSize: 16,
    color: "#8B7355",
    marginLeft: 4,
  },
  instructionCard: {
    backgroundColor: "#E8F7FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#5AC8FA",
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
