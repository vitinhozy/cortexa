import { Screen, Empty, Button } from '@/components/ui';
import { useAppNavigation } from '@/hooks/useAppNavigation';
export default function NotFound() {
  const { replace } = useAppNavigation();
  return (
    <Screen title="Vamos voltar ao estudo?">
      <Empty title="Página não encontrada" message="Este endereço não faz parte do aplicativo." />
      <Button title="Voltar ao início" onPress={() => replace('/')} />
    </Screen>
  );
}
