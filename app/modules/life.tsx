import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader } from "@/components/game-header";
import { SubModuleCard } from "@/components/module-card";

const SUB_MODULES = [
  {
    id: "time",
    title: "认识时间",
    description: "整点、半点、时间排序",
    icon: "⏰",
    route: "/games/time",
  },
  {
    id: "money",
    title: "认识人民币",
    description: "币值、凑钱、购物",
    icon: "💰",
    route: "/games/money",
  },
  {
    id: "shopping",
    title: "超市购物",
    description: "购物清单、计算总价",
    icon: "🛒",
    route: "/games/shopping",
  },
];

export default function LifeScreen() {
  const router = useRouter();

  return (
    <ScreenContainer className="bg-background">
      <GameHeader title="生活应用" subtitle="🎯 学习时间和金钱" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introEmoji}>🎯</Text>
          <Text style={styles.introTitle}>欢迎来到生活应用！</Text>
          <Text style={styles.introText}>
            学会看时钟知道几点钟，认识人民币去玩具店购物，成为生活小能手！
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
              color="#FF6B9D"
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
    backgroundColor: "#FFE8F0",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#FF6B9D",
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
