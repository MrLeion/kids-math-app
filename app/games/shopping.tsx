import { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useGameAudio } from "@/lib/audio-manager";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader, ProgressIndicator } from "@/components/game-header";
import { Feedback } from "@/components/feedback";
import { getProgress, saveProgress, addStars, unlockAchievement } from "@/lib/storage";

// 商品数据
const PRODUCTS = [
  { id: 1, name: "苹果", emoji: "🍎", price: 3 },
  { id: 2, name: "香蕉", emoji: "🍌", price: 2 },
  { id: 3, name: "牛奶", emoji: "🥛", price: 5 },
  { id: 4, name: "面包", emoji: "🍞", price: 4 },
  { id: 5, name: "鸡蛋", emoji: "🥚", price: 6 },
  { id: 6, name: "糖果", emoji: "🍬", price: 1 },
  { id: 7, name: "饼干", emoji: "🍪", price: 3 },
  { id: 8, name: "果汁", emoji: "🧃", price: 4 },
  { id: 9, name: "冰淇淋", emoji: "🍦", price: 5 },
  { id: 10, name: "蛋糕", emoji: "🍰", price: 8 },
];

interface CartItem {
  product: typeof PRODUCTS[0];
  quantity: number;
}

function generateShoppingTask() {
  // 随机选择2-4个商品作为购物清单
  const numItems = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...PRODUCTS].sort(() => Math.random() - 0.5);
  const selectedProducts = shuffled.slice(0, numItems);
  
  // 为每个商品分配数量（1-3个）
  const shoppingList = selectedProducts.map((product) => ({
    product,
    quantity: Math.floor(Math.random() * 3) + 1,
  }));
  
  // 计算总价
  const totalPrice = shoppingList.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  
  // 生成支付选项
  const options = new Set<number>();
  options.add(totalPrice);
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const option = Math.max(1, totalPrice + offset);
    if (option !== totalPrice) {
      options.add(option);
    }
  }
  
  return {
    shoppingList,
    totalPrice,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
}

export default function ShoppingGameScreen() {
  const [task, setTask] = useState(generateShoppingTask());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"shopping" | "checkout">("shopping");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "celebration">("success");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const totalRounds = 5;
  const cartScale = useSharedValue(1);

  // 音频系统
  const { playClick, playStar } = useGameAudio("money");

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const progress = await getProgress();
    setScore(progress.shoppingCompleted);
  };

  // 计算购物车总价
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // 检查购物清单是否完成
  const isShoppingComplete = task.shoppingList.every((listItem) => {
    const cartItem = cart.find((c) => c.product.id === listItem.product.id);
    return cartItem && cartItem.quantity >= listItem.quantity;
  });

  const addToCart = (product: typeof PRODUCTS[0]) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    playClick();

    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }

    // 购物车动画
    cartScale.value = withSequence(
      withSpring(1.1),
      withTiming(1, { duration: 150 })
    );
  };

  const removeFromCart = (productId: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    playClick();

    const existingItem = cart.find((item) => item.product.id === productId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(
        cart.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      setCart(cart.filter((item) => item.product.id !== productId));
    }
  };

  const goToCheckout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    playClick();
    setStep("checkout");
  };

  const handlePayment = async (amount: number) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(amount);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    playClick();

    const isCorrect = amount === task.totalPrice;

    if (isCorrect) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      const newScore = score + 1;
      setScore(newScore);
      await saveProgress({ shoppingCompleted: newScore });
      await addStars(2);
      playStar();

      // 检查成就
      if (newScore === 5) {
        await unlockAchievement({
          id: "shopping_beginner",
          name: "购物小能手",
          description: "完成5次超市购物",
          icon: "🛒",
        });
      }
      if (newScore === 20) {
        await unlockAchievement({
          id: "shopping_master",
          name: "购物达人",
          description: "完成20次超市购物",
          icon: "🏆",
        });
      }

      if (round === totalRounds) {
        setFeedbackType("celebration");
      } else {
        setFeedbackType("success");
      }
      setShowFeedback(true);
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

    if (feedbackType !== "error") {
      if (round < totalRounds) {
        setRound(round + 1);
        setTask(generateShoppingTask());
        setCart([]);
        setStep("shopping");
      } else {
        setRound(1);
        setTask(generateShoppingTask());
        setCart([]);
        setStep("shopping");
      }
    }
  };

  const cartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }],
  }));

  const getItemStatus = (listItem: CartItem) => {
    const cartItem = cart.find((c) => c.product.id === listItem.product.id);
    const currentQty = cartItem?.quantity || 0;
    if (currentQty >= listItem.quantity) return "complete";
    if (currentQty > 0) return "partial";
    return "empty";
  };

  return (
    <ScreenContainer className="bg-background">
      <GameHeader
        title="超市购物"
        subtitle="学习计算购物总价"
        rightElement={<ProgressIndicator current={round} total={totalRounds} color="#FF6B9D" />}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === "shopping" ? (
          <>
            {/* Shopping List */}
            <View style={styles.shoppingListCard}>
              <Text style={styles.cardTitle}>📋 购物清单</Text>
              <View style={styles.shoppingList}>
                {task.shoppingList.map((item, index) => {
                  const status = getItemStatus(item);
                  return (
                    <View
                      key={index}
                      style={[
                        styles.listItem,
                        status === "complete" && styles.listItemComplete,
                      ]}
                    >
                      <Text style={styles.listItemEmoji}>{item.product.emoji}</Text>
                      <View style={styles.listItemInfo}>
                        <Text style={styles.listItemName}>{item.product.name}</Text>
                        <Text style={styles.listItemPrice}>
                          {item.product.price}元/个 × {item.quantity}个
                        </Text>
                      </View>
                      {status === "complete" && (
                        <Text style={styles.checkIcon}>✓</Text>
                      )}
                      {status === "partial" && (
                        <Text style={styles.partialIcon}>...</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Store Shelves */}
            <View style={styles.storeCard}>
              <Text style={styles.cardTitle}>🏪 商品货架</Text>
              <View style={styles.productGrid}>
                {PRODUCTS.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productItem}
                    onPress={() => addToCart(product)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.productEmoji}>{product.emoji}</Text>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>{product.price}元</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cart */}
            <Animated.View style={[styles.cartCard, cartAnimatedStyle]}>
              <View style={styles.cartHeader}>
                <Text style={styles.cardTitle}>🛒 购物车</Text>
                <Text style={styles.cartTotal}>总计: {cartTotal}元</Text>
              </View>
              
              {cart.length === 0 ? (
                <Text style={styles.emptyCart}>购物车是空的，点击商品添加</Text>
              ) : (
                <View style={styles.cartItems}>
                  {cart.map((item) => (
                    <View key={item.product.id} style={styles.cartItem}>
                      <Text style={styles.cartItemEmoji}>{item.product.emoji}</Text>
                      <Text style={styles.cartItemName}>{item.product.name}</Text>
                      <View style={styles.cartItemControls}>
                        <TouchableOpacity
                          style={styles.qtyButton}
                          onPress={() => removeFromCart(item.product.id)}
                        >
                          <Text style={styles.qtyButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.cartItemQty}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyButton}
                          onPress={() => addToCart(item.product)}
                        >
                          <Text style={styles.qtyButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.cartItemPrice}>
                        {item.product.price * item.quantity}元
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {isShoppingComplete && (
                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={goToCheckout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.checkoutButtonText}>去结账 →</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </>
        ) : (
          <>
            {/* Checkout */}
            <View style={styles.checkoutCard}>
              <Text style={styles.checkoutTitle}>🧾 结账</Text>
              
              <View style={styles.receipt}>
                {task.shoppingList.map((item, index) => (
                  <View key={index} style={styles.receiptItem}>
                    <Text style={styles.receiptItemName}>
                      {item.product.emoji} {item.product.name} × {item.quantity}
                    </Text>
                    <Text style={styles.receiptItemPrice}>
                      {item.product.price * item.quantity}元
                    </Text>
                  </View>
                ))}
                <View style={styles.receiptDivider} />
                <View style={styles.receiptTotal}>
                  <Text style={styles.receiptTotalLabel}>应付金额</Text>
                  <Text style={styles.receiptTotalValue}>?元</Text>
                </View>
              </View>

              <Text style={styles.questionText}>请选择正确的总价：</Text>
              
              <View style={styles.paymentOptions}>
                {task.options.map((option) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === task.totalPrice;
                  const showResult = selectedOption !== null;
                  
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.paymentOption,
                        showResult && isSelected && isCorrect && styles.optionCorrect,
                        showResult && isSelected && !isCorrect && styles.optionWrong,
                        showResult && !isSelected && isCorrect && styles.optionCorrectHint,
                      ]}
                      onPress={() => handlePayment(option)}
                      activeOpacity={0.7}
                      disabled={selectedOption !== null}
                    >
                      <Text style={styles.paymentOptionText}>{option}元</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Calculation Hint */}
            <View style={styles.hintCard}>
              <Text style={styles.hintTitle}>💡 计算提示</Text>
              <Text style={styles.hintText}>
                {task.shoppingList.map((item, index) => (
                  `${item.product.price} × ${item.quantity} = ${item.product.price * item.quantity}`
                )).join("\n")}
              </Text>
            </View>
          </>
        )}

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>🎮 玩法说明</Text>
          <Text style={styles.instructionText}>
            {step === "shopping"
             ? "1. 查看购物清单\n2. 点击货架上的商品添加到购物车\n3. 完成清单后点击去结账"
              : "计算购物总价，选择正确的金额！\n每完成一次购物获得2颗星星！"}
          </Text>
        </View>
      </ScrollView>

      <Feedback
        visible={showFeedback}
        type={feedbackType}
        message={
          feedbackType === "celebration"
            ? "太棒了！完成了所有购物任务！"
            : feedbackType === "success"
            ? "计算正确！真厉害！"
            : "再算一算，你可以的！"
        }
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
  shoppingListCard: {
    backgroundColor: "#FFF8E7",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFD60A",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 12,
  },
  shoppingList: {
    gap: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  listItemComplete: {
    backgroundColor: "#E8FFE8",
    borderWidth: 1,
    borderColor: "#34C759",
  },
  listItemEmoji: {
    fontSize: 28,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3D2914",
  },
  listItemPrice: {
    fontSize: 12,
    color: "#8B7355",
  },
  checkIcon: {
    fontSize: 20,
    color: "#34C759",
    fontWeight: "bold",
  },
  partialIcon: {
    fontSize: 16,
    color: "#FF9500",
    fontWeight: "bold",
  },
  storeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  productItem: {
    width: 70,
    height: 90,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  productEmoji: {
    fontSize: 28,
  },
  productName: {
    fontSize: 11,
    color: "#3D2914",
    marginTop: 2,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF6B9D",
  },
  cartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cartTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B9D",
  },
  emptyCart: {
    textAlign: "center",
    color: "#8B7355",
    paddingVertical: 20,
  },
  cartItems: {
    gap: 8,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  cartItemEmoji: {
    fontSize: 24,
  },
  cartItemName: {
    flex: 1,
    fontSize: 14,
    color: "#3D2914",
  },
  cartItemControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF6B9D",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  cartItemQty: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3D2914",
    minWidth: 20,
    textAlign: "center",
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B9D",
    minWidth: 40,
    textAlign: "right",
  },
  checkoutButton: {
    backgroundColor: "#34C759",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  checkoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3D2914",
    textAlign: "center",
    marginBottom: 16,
  },
  receipt: {
    backgroundColor: "#FFF8E7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  receiptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  receiptItemName: {
    fontSize: 14,
    color: "#3D2914",
  },
  receiptItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3D2914",
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  receiptTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  receiptTotalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3D2914",
  },
  receiptTotalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B9D",
  },
  questionText: {
    fontSize: 16,
    color: "#3D2914",
    textAlign: "center",
    marginBottom: 16,
  },
  paymentOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  paymentOption: {
    width: 80,
    height: 60,
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
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
  paymentOptionText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3D2914",
  },
  hintCard: {
    backgroundColor: "#E8F4FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#5AC8FA",
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: "#3D2914",
    lineHeight: 22,
  },
  instructionCard: {
    backgroundColor: "#FFF8E7",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFD60A",
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
