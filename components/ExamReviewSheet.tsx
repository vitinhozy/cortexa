import { View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Badge, Button, Card, Icon, Notice, Progress, T, s } from './ui';
import { colors } from '@/constants/theme';
import type { Exam } from '@/types/domain';
import { daysUntil, formatDate } from '@/utils/date';

export function ExamReviewSheet({
  visible,
  exam,
  preparation,
  onClose,
  onPlan,
  onDismiss,
}: {
  visible: boolean;
  exam?: Exam;
  preparation?: number;
  onClose: () => void;
  onPlan: () => void;
  onDismiss?: () => void;
}) {
  return (
    <BottomSheet
      visible={visible}
      title="Organizar minha revisão"
      size="large"
      onClose={onClose}
      onDismiss={onDismiss}
    >
      {exam ? (
        <>
          <Card style={{ backgroundColor: colors.peach, borderColor: colors.peach }}>
            <ViewHeader exam={exam} />
            <T style={s.sectionTitle}>{exam.title}</T>
            <T muted>
              Prova em {formatDate(exam.date)}.{' '}
              {preparation === undefined
                ? `${exam.topicIds.length} assuntos cadastrados para revisar.`
                : `Preparação demonstrativa: ${preparation}%.`}
            </T>
            {preparation === undefined ? null : (
              <Progress value={preparation} color={colors.orange} />
            )}
          </Card>
          <Notice text="O planejador monta uma rotina local usando os assuntos cadastrados e o tempo disponível até a prova." />
          <Button title="Configurar plano de revisão" icon="arrow-right" onPress={onPlan} />
        </>
      ) : null}
    </BottomSheet>
  );
}

function ViewHeader({ exam }: { exam: Exam }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Icon name="calendar" color={colors.orange} />
      <Badge label={`${daysUntil(exam.date)} dias`} tone="amber" />
    </View>
  );
}
