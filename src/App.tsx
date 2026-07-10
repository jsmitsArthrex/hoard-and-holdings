import { useGameStore } from './store/gameStore';
import GameLayout from './layouts/GameLayout';
import IntroScreen from './screens/IntroScreen';
import GameHub from './screens/GameHub';
import RealEstateScreen from './screens/RealEstateScreen';
import KoboldAgencyScreen from './screens/KoboldAgencyScreen';
import KoboldManagementScreen from './screens/KoboldManagementScreen';
import CombatScreen from './screens/CombatScreen';
import RivalScreen from './screens/RivalScreen';
import AuctionScreen from './screens/AuctionScreen';
import InnkeeperScreen from './screens/InnkeeperScreen';
import BankScreen from './screens/BankScreen';
import LawyerScreen from './screens/LawyerScreen';
import WinScreen from './screens/WinScreen';
import LoseScreen from './screens/LoseScreen';
import TitleScreen from './screens/TitleScreen';
import LairScreen from './screens/LairScreen';
import SabotageScreen from './screens/SabotageScreen';
import BlackMarketScreen from './screens/BlackMarketScreen';
import DungeonScreen from './screens/DungeonScreen';
import ExpeditionScreen from './screens/ExpeditionScreen';

const SCREEN_MAP: Record<string, React.ReactNode> = {
  'hub': <GameHub />,
  'real-estate': <RealEstateScreen />,
  'kobold-agency': <KoboldAgencyScreen />,
  'kobold-management': <KoboldManagementScreen />,
  'combat': <CombatScreen />,
  'rival': <RivalScreen />,
  'auction': <AuctionScreen />,
  'innkeeper': <InnkeeperScreen />,
  'bank': <BankScreen />,
  'lawyer': <LawyerScreen />,
  'lair': <LairScreen />,
  'sabotage': <SabotageScreen />,
  'dungeon': <DungeonScreen />,
  'black-market': <BlackMarketScreen />,
  'expedition': <ExpeditionScreen />,
};

function App() {
  const { status, activeScreen } = useGameStore();

  if (status === 'title') return <TitleScreen />;
  if (status === 'intro') return <IntroScreen />;
  if (status === 'won') return <WinScreen />;
  if (status === 'lost') return <LoseScreen />;

  return (
    <GameLayout>
      {SCREEN_MAP[activeScreen] ?? <GameHub />}
    </GameLayout>
  );
}

export default App;
