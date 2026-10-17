import { router } from 'expo-router';
import { Screen, Empty, Button } from '@/components/ui';
export default function NotFound() {
  return (
    <Screen title="Vamos voltar ao estudo?">
      <Empty title="Página não encontrada" message="Este endereço não faz parte do aplicativo." />
      <Button title="Voltar ao início" onPress={() => router.replace('/')} />
    </Screen>
  );
}
