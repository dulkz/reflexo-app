import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
// DESIGN SYSTEM
export const COLORS = {
  bg: '#0A1628',
  bgCard: '#111E35',
  bgCardDark: '#0D1829',
  blue: '#1A6DB5',
  teal: '#0E7C7B',
  purple: '#5B3E8C',
  elite: '#00D4AA',
  muitoBom: '#1A6DB5',
  bom: '#4A90D9',
  abaixo: '#F5A623',
  devagar: '#E05252',
  white: '#FFFFFF',
  gray: '#8899AA',
  grayLight: '#C5D0DC',
};
export const FAIXAS = [
  { label: 'Elite Extremo', max: 150,  color: '#00D4AA' },
  { label: 'Elite',         max: 200,  color: '#00D4AA' },
  { label: 'Muito Bom',     max: 250,  color: '#1A6DB5' },
  { label: 'Bom',           max: 300,  color: '#4A90D9' },
  { label: 'Abaixo da Média', max: 400, color: '#F5A623' },
  { label: 'Devagar',       max: 9999, color: '#E05252' },
];
export function getFaixa(ms) {
  return FAIXAS.find(f => ms < f.max) || FAIXAS[FAIXAS.length - 1];
}
// PLACEHOLDER SCREENS
function HomeScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.label}>REFLEXO</Text>
      <Text style={styles.subtitle}>Olá, Bruno</Text>
      {[
        { name: 'Partida', desc: 'Reação pura. Como a largada da F1.', color: COLORS.blue, screen: 'Partida' },
        { name: 'Alvo',    desc: 'Velocidade + precisão. O teste do boxeador.', color: COLORS.teal, screen: 'Alvo' },
        { name: 'Sequência', desc: 'Atenção sustentada. O teste do piloto.', color: COLORS.purple, screen: 'Sequencia' },
      ].map(mode => (
        <TouchableOpacity
          key={mode.name}
          style={[styles.card, { borderLeftColor: mode.color, borderLeftWidth: 4 }]}
          onPress={() => navigation.navigate(mode.screen)}
        >
          <Text style={[styles.cardTitle, { color: mode.color }]}>{mode.name}</Text>
          <Text style={styles.cardDesc}>{mode.desc}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
function PartidaScreen() {
  return <View style={styles.screen}><Text style={styles.subtitle}>Modo Partida — em breve</Text></View>;
}
function AlvoScreen() {
  return <View style={styles.screen}><Text style={styles.subtitle}>Modo Alvo — em breve</Text></View>;
}
function SequenciaScreen() {
  return <View style={styles.screen}><Text style={styles.subtitle}>Modo Sequência — em breve</Text></View>;
}
function HistoricoScreen() {
  return <View style={styles.screen}><Text style={styles.subtitle}>Histórico — em breve</Text></View>;
}
function CienciaScreen() {
  return <View style={styles.screen}><Text style={styles.subtitle}>Ciência — em breve</Text></View>;
}
function PerfilScreen() {
  return <View style={styles.screen}><Text style={styles.subtitle}>Perfil — em breve</Text></View>;
}
// NAVIGATION
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
function TabIcon({ label, color }) {
  return <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{label}</Text>;
}
function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.bgCard, borderTopColor: '#1A2A40', height: 60 },
        tabBarActiveTintColor: COLORS.blue,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
      }}
    >
      <Tab.Screen name="Jogar" component={HomeScreen} />
      <Tab.Screen name="Histórico" component={HistoricoScreen} />
      <Tab.Screen name="Ciência" component={CienciaScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeTabs} />
        <Stack.Screen name="Partida" component={PartidaScreen} />
        <Stack.Screen name="Alvo" component={AlvoScreen} />
        <Stack.Screen name="Sequencia" component={SequenciaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 24,
    paddingTop: 60,
  },
  label: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    color: COLORS.gray,
    fontSize: 13,
  },
});
