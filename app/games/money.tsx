import { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { useGameAudio } from "@/lib/audio-manager";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader, ProgressIndicator } from "@/components/game-header";
import { Feedback } from "@/components/feedback";
import { getProgress, saveProgress, addStars, unlockAchievement } from "@/lib/storage";

const COINS = [
  { value: 1, emoji: "🪙", name: "1元" },
  { value: 5, emoji: "💵", name: "5元" },
  { value: 10, emoji: "💴", name: "10元" },
];

const TOYS = [
  { name: "小熊", emoji: "🧸", price: 5 },
  { name: "小车", emoji: "🚗", price: 8 },
  { name: "机器人", emoji: "🤖", price: 10 },
  { name: "恐龙", emoji: "🦕", price: 6 },
  { name: "皮球", emoji: "⚽", price: 4 },
  { name: "娃娃", emoji: "🎎", price: 7 },
  { name: "积木", emoji: "🧱", price: 9 },
  { name: "风筝", emoji: "🪁", price: 3 },
];

function generateQuestion() {
  const toy = TOYS[Math.floor(Math.random() * TOYS.length)];
  
  // 生成可能的付款组合选项
  const correctOptions: number[][] = [];
  
  // 找出所有能凑出价格的组合
  for (let tens = 0; tens <= 1; tens++) {
    for (let fives = 0; fives <= 2; fives++) {
      for (let ones = 0; ones <= 10; ones++) {
        if (tens * 10 + fives * 5 + ones === toy.price) {
          correctOptions.push([ones, fives, tens]);
        }
      }
    }
  }
  
  return {
    toy,
    correctOptions,
  };
}

export default function MoneyGameScreen() {
  const [question, setQuestion] = useState(generateQuestion());
  const [selectedCoins, setSelectedCoins] = useState<number[]>([0, 0, 0]); // [1元, 5元, 10元]
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "celebration">("success");

  const totalRounds = 10;

  // 音频系统
  const { playClick } = useGameAudio("money");

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const progress = await getProgress();
    setScore(progress.moneyScore);
  };

  const totalMoney = selectedCoins[0] * 1 + selectedCoins[1] * 5 + selectedCoins[2] * 10;

  const handleCoinPress = (index: number, delta: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    playClick();
    
    const newCoins = [...selectedCoins];
    newCoins[index] = Math.max(0, newCoins[index] + delta);
    setSelectedCoins(newCoins);
  };

  const handleSubmit = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const isCorrect = totalMoney === question.toy.price;

    if (isCorrect) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const newScore = score + 1;
      setScore(newScore);
      await saveProgress({ moneyScore: newScore });
      await addStars(1);
      
      // 检查成就
      if (newScore === 20) {
        await unlockAchievement({
          id: "money_wise",
          name: "理财小能手",
          description: "学会使用人民币",
          icon: "💰",
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
    setSelectedCoins([0, 0, 0]);
    
    if (feedbackType !== "error") {
      if (round < totalRounds) {
        setRound(round + 1);
        setQuestion(generateQuestion());
      } else {
        setRound(1);
        setQuestion(generateQuestion());
      }
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <GameHeader 
        title="玩具店" 
        subtitle="认识人民币"
        rightElement={<ProgressIndicator current={round} total={totalRounds} color="#FF6B9D" />}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Toy Display */}
        <View style={styles.toyCard}>
          <Text style={styles.shopTitle}>🏪 玩具店</Text>
          <View style={styles.toyDisplay}>
            <Text style={styles.toyEmoji}>{question.toy.emoji}</Text>
            <Text style={styles.toyName}>{question.toy.name}</Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{question.toy.price}元</Text>
            </View>
          </View>
          <Text style={styles.questionText}>
            请用硬币和纸币凑出 {question.toy.price} 元来购买{question.toy.name}！
          </Text>
        </View>

        {/* Coin Selection */}
        <View style={styles.coinsCard}>
          <Text style={styles.coinsTitle}>选择金额</Text>
          
          {COINS.map((coin, index) => (
            <View key={coin.value} style={styles.coinRow}>
              <View style={styles.coinInfo}>
                <Text style={styles.coinEmoji}>{coin.emoji}</Text>
                <Text style={styles.coinName}>{coin.name}</Text>
              </View>
              
              <View style={styles.coinControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleCoinPress(index, -1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.controlText}>-</Text>
                </TouchableOpacity>
                
                <Text style={styles.coinCount}>{selectedCoins[index]}</Text>
                
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleCoinPress(index, 1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.controlText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>总计：</Text>
            <Text style={[
              styles.totalValue,
              totalMoney === question.toy.price && styles.totalCorrect,
              totalMoney > question.toy.price && styles.totalOver,
            ]}>
              {totalMoney}元
            </Text>
            {totalMoney === question.toy.price && (
              <Text style={styles.matchText}>✓ 刚好！</Text>
            )}
            {totalMoney > question.toy.price && (
              <Text style={styles.overText}>太多了！</Text>
            )}
            {totalMoney < question.toy.price && totalMoney > 0 && (
              <Text style={styles.lessText}>还不够哦</Text>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            totalMoney === 0 && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          activeOpacity={0.7}
          disabled={totalMoney === 0}
        >
          <Text style={styles.submitText}>💰 付款</Text>
        </TouchableOpacity>

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
            点击 + 和 - 按钮选择硬币和纸币的数量，{"\n"}
            凑出刚好等于玩具价格的金额，然后点击付款！
          </Text>
        </View>
      </ScrollView>

      <Feedback
        visible={showFeedback}
        type={feedbackType}
        message={feedbackType === "error" ? "金额不对哦，再试试！" : undefined}
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
  toyCard: {
    backgroundColor: "#FFE8F0",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#FF6B9D",
    alignItems: "center",
  },
  shopTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 16,
  },
  toyDisplay: {
    alignItems: "center",
    marginBottom: 16,
  },
  toyEmoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  toyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 8,
  },
  priceTag: {
    backgroundColor: "#FF6B9D",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  priceText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  questionText: {
    fontSize: 14,
    color: "#8B7355",
    textAlign: "center",
  },
  coinsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  coinsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 16,
    textAlign: "center",
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E6D3",
  },
  coinInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coinEmoji: {
    fontSize: 32,
  },
  coinName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3D2914",
  },
  coinControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  controlButton: {
    width: 40,
    height: 40,
    backgroundColor: "#FF6B9D",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  controlText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  coinCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3D2914",
    width: 40,
    textAlign: "center",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingTop: 16,
    gap: 8,
  },
  totalLabel: {
    fontSize: 18,
    color: "#8B7355",
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3D2914",
  },
  totalCorrect: {
    color: "#34C759",
  },
  totalOver: {
    color: "#FF6B6B",
  },
  matchText: {
    fontSize: 16,
    color: "#34C759",
    fontWeight: "600",
  },
  overText: {
    fontSize: 16,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  lessText: {
    fontSize: 16,
    color: "#FF9500",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#FF6B9D",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  submitText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scoreCard: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    backgroundColor: "#FFE8F0",
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
    color: "#FF6B9D",
  },
  scoreUnit: {
    fontSize: 16,
    color: "#8B7355",
    marginLeft: 4,
  },
  instructionCard: {
    backgroundColor: "#FFE8F0",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FF6B9D",
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
