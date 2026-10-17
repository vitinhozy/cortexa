import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, T, Icon, Badge, Button, Field, Empty, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { colors, fonts } from '@/constants/theme';
import { formatDate } from '@/utils/date';
export default function LibraryScreen() {
  const { data } = useStudy();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const materials = data.materials.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'Todos' || m.type === filter),
  );
  return (
    <Screen
      title="Sua biblioteca"
      subtitle="Tudo o que você estuda, conectado em um só lugar."
      eyebrow="CONHECIMENTO QUE É SEU"
    >
      <Button title="Adicionar material" icon="plus" onPress={() => router.push('/material/add')} />
      <Field
        label="Buscar na biblioteca"
        placeholder="Busque por título do material..."
        value={search}
        onChangeText={setSearch}
      />
      <View style={[s.row, { flexWrap: 'wrap', gap: 8 }]}>
        {['Todos', 'PDF', 'Slides', 'Anotações', 'Prova'].map((type) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: filter === type }}
            key={type}
            onPress={() => setFilter(type)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: filter === type ? colors.primary : 'white',
              borderWidth: 1,
              borderColor: filter === type ? colors.primary : colors.line,
            }}
          >
            <T style={{ fontSize: 12, color: filter === type ? 'white' : colors.muted }}>{type}</T>
          </Pressable>
        ))}
      </View>
      <T muted style={{ fontSize: 12 }}>
        {materials.length} materiais · Fisiologia Renal
      </T>
      <View style={{ gap: 12 }}>
        {materials.map((material) => (
          <Card
            key={material.id}
            onPress={() => router.push({ pathname: '/material/[id]', params: { id: material.id } })}
            label={material.title}
          >
            <View style={s.row}>
              <View
                style={{
                  padding: 14,
                  borderRadius: 13,
                  backgroundColor: material.type === 'PDF' ? colors.redLight : colors.mint,
                }}
              >
                <Icon
                  name={material.type === 'Anotações' ? 'edit-3' : 'file-text'}
                  color={material.type === 'PDF' ? colors.red : colors.primary}
                />
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <T style={{ fontFamily: fonts.semibold }}>{material.title}</T>
                <T muted style={{ fontSize: 11 }}>
                  Fisiologia · {formatDate(material.createdAt)} · {material.type}
                </T>
              </View>
              <Icon name="chevron-right" size={17} color={colors.muted} />
            </View>
            <Badge label={material.content ? 'ANOTAÇÃO LOCAL' : 'PROCESSADO PELA IA · SIMULADO'} />
          </Card>
        ))}
      </View>
      {!materials.length ? (
        <Empty
          title="Nenhum material encontrado"
          message="Tente outro título ou selecione Todos."
        />
      ) : null}
    </Screen>
  );
}
