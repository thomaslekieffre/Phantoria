import { GameShell } from "@/components/layout/game-shell";
import { StoryBattleScreen } from "@/components/story/story-battle-screen";

type Props = {
  params: Promise<{ zoneId: string; levelId: string }>;
};

export default async function StoryLevelPage({ params }: Props) {
  const { zoneId, levelId } = await params;
  const zone = Number(zoneId);
  const level = Number(levelId);

  return (
    <GameShell active="camp">
      <StoryBattleScreen zoneId={zone} levelIndex={level} />
    </GameShell>
  );
}
