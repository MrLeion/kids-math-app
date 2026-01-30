import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader } from "@/components/game-header";
import { SubModuleCard } from "@/components/module-card";

const SUB_MODULES = [
  {
    id: "count",
    title: "数一数",
    description: "昆虫花园里学习基础数数",
    icon: "🐛",
    route: "/games/count",
  },
  {
    id: "compare",
    title: "比大小",
    description: "动物赛跑中比较数量大小",
    icon: "🐰",
    route: "/games/compare",
  },
  {
    id: "fillblank",
    title: "数字填空",
    description: "火车车厢数字序列填空",
    icon: "🚂",
    route: "/games/fillblank",
  },
];

export default function CountingScreen() {
  const router = useRouter();

  return (
    <ScreenContainer className="bg-background">
      <GameHeader title="计数能力" subtitle="🔢 学习数数和比较" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introEmoji}>🔢</Text>
          <Text style={styles.introTitle}>欢迎来到计数能力！</Text>
          <Text style={styles.introText}>
            在这里，你将和小昆虫一起数数，和小动物比赛谁更大，还能帮火车车厢找到丢失的数字哦！
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
              color="#5AC8FA"
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
    backgroundColor: "#E8F7FF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#5AC8FA",
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
