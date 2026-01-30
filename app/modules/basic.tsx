import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader } from "@/components/game-header";
import { SubModuleCard } from "@/components/module-card";

const SUB_MODULES = [
  {
    id: "numbers",
    title: "认识数字",
    description: "0-10数字识别、排序、书写",
    icon: "🐼",
    route: "/games/numbers",
  },
  {
    id: "writing",
    title: "数字书写",
    description: "用手指描写数字0-9",
    icon: "✍️",
    route: "/games/writing",
  },
  {
    id: "symbols",
    title: "认识符号",
    description: "+、-、=、>、< 符号含义讲解",
    icon: "🐝",
    route: "/games/symbols",
  },
  {
    id: "matching",
    title: "数物对应",
    description: "数字与物品数量对应关系",
    icon: "🍎",
    route: "/games/matching",
  },
];

export default function BasicCognitionScreen() {
  const router = useRouter();

  return (
    <ScreenContainer className="bg-background">
      <GameHeader title="基础认知" subtitle="🌟 认识数字和符号" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introEmoji}>🌟</Text>
          <Text style={styles.introTitle}>欢迎来到基础认知！</Text>
          <Text style={styles.introText}>
            在这里，你将认识有趣的数字动物，学习神奇的运算符号，还能玩水果配对游戏哦！
          </Text>
        </View>

        {/* Sub Modules */}
        <View style={styles.modulesSection}>
          {SUB_MODULES.map((module) => (
            <SubModuleCard
              key={module.id}
              title={module.title}
              description={module.description}
              icon={module.icon}
              color="#FFD60A"
              stars={0}
              onPress={() => router.push(module.route as any)}
            />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: "#FFF9E6",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#FFD60A",
  },
  introEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: "#8B7355",
    textAlign: "center",
    lineHeight: 22,
  },
  modulesSection: {
    gap: 12,
  },
});
