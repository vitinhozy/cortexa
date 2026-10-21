import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, T, Icon, Badge, Button, Empty, Notice, s } from '@/components/ui';
import { Choice, Choices } from '@/components/Choice';
import { FolderChoice } from '@/components/FolderChoice';
import { Touch } from '@/components/Motion';
import { BottomSheet } from '@/components/BottomSheet';
import { useStudy } from '@/hooks/useStudy';
import { useMotion } from '@/hooks/useMotion';
import { colors, fonts } from '@/constants/theme';
import { FOLDER_PALETTE, folderAccent } from '@/constants/folderPalette';
import { formatDate } from '@/utils/date';
import { normalizeSearch } from '@/features/study/search';

function FolderColorChoice({
  item,
  selected,
  onPress,
}: {
  item: (typeof FOLDER_PALETTE)[number];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Touch
      accessibilityRole="button"
      accessibilityLabel={item.name}
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onPress={onPress}
      style={{
        flexBasis: '20%',
        flexGrow: 1,
        minWidth: 48,
        minHeight: 54,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? item.accent : colors.line,
        backgroundColor: item.color,
        borderRadius: 13,
      }}
    />
  );
}

export default function LibraryScreen() {
  const { data, services } = useStudy();
  const { reduced } = useMotion();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filter, setFilter] = useState('Todos');
  const [folder, setFolder] = useState('all');
  const [subject, setSubject] = useState('all');
  const [favorites, setFavorites] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState<string>(FOLDER_PALETTE[0].color);
  const [editingFolder, setEditingFolder] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState('');
  const [deletingFolder, setDeletingFolder] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [folderSheetOpen, setFolderSheetOpen] = useState(false);
  const searchWidth = useRef(new Animated.Value(0)).current;
  const searchMotion = useRef(new Animated.Value(0)).current;
  const folders = useMemo(() => data.folders ?? [], [data.folders]);
  const folderBeingDeleted = folders.find((item) => item.id === folderToDelete);
  const query = normalizeSearch(search);
  const filterCount = Number(filter !== 'Todos') + Number(subject !== 'all') + Number(favorites);

  useEffect(() => {
    searchWidth.stopAnimation();
    searchMotion.stopAnimation();
    if (reduced) {
      searchWidth.setValue(searchOpen ? 1 : 0);
      searchMotion.setValue(searchOpen ? 1 : 0);
      return;
    }
    Animated.parallel([
      Animated.timing(searchWidth, {
        toValue: searchOpen ? 1 : 0,
        duration: 230,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(searchMotion, {
        toValue: searchOpen ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    return () => {
      searchWidth.stopAnimation();
      searchMotion.stopAnimation();
    };
  }, [reduced, searchMotion, searchOpen, searchWidth]);

  const materials = useMemo(
    () =>
      data.materials.filter((material) => {
        const subjectName =
          data.subjects.find((item) => item.id === material.subjectId)?.name ?? '';
        const topicName = data.topics.find((item) => item.id === material.topicId)?.name ?? '';
        return (
          normalizeSearch(
            `${material.title} ${material.content ?? ''} ${subjectName} ${topicName}`,
          ).includes(query) &&
          (filter === 'Todos' || material.type === filter) &&
          (folder === 'all' || material.folderId === folder) &&
          (subject === 'all' || material.subjectId === subject) &&
          (!favorites || material.favorite)
        );
      }),
    [data.materials, data.subjects, data.topics, favorites, filter, folder, query, subject],
  );

  const materialGroups = useMemo(() => {
    if (folder !== 'all') {
      const selected = folders.find((item) => item.id === folder);
      return selected
        ? [{ ...selected, materials: materials.filter((item) => item.folderId === folder) }]
        : [];
    }
    const groups = folders
      .map((item) => ({
        ...item,
        materials: materials.filter((material) => material.folderId === item.id),
      }))
      .filter((item) => item.materials.length > 0);
    const unfiled = materials.filter(
      (material) => !folders.some((item) => item.id === material.folderId),
    );
    if (unfiled.length)
      groups.push({ id: 'general', name: 'Biblioteca geral', materials: unfiled });
    return groups;
  }, [folder, folders, materials]);

  function openFolderSheet(id?: string) {
    const selected = folders.find((item) => item.id === id);
    setEditingFolder(selected?.id ?? '');
    setFolderName(selected?.name ?? '');
    setFolderColor(selected?.color ?? FOLDER_PALETTE[0].color);
    setMessage('');
    setFolderSheetOpen(true);
  }

  async function saveFolder() {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      if (editingFolder) {
        await services.folderService.rename(editingFolder, folderName, folderColor);
      } else {
        const created = await services.folderService.create(folderName, folderColor);
        setFolder(created.id);
      }
      setFolderSheetOpen(false);
      setFolderName('');
      setEditingFolder('');
      setMessage(editingFolder ? 'Pasta atualizada.' : 'Pasta criada e selecionada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar a pasta.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemoveFolder() {
    if (!folderToDelete || deletingFolder) return;
    setDeletingFolder(true);
    setMessage('');
    try {
      await services.folderService.remove(folderToDelete);
      setFolder('all');
      setDeleteConfirmOpen(false);
      setFolderToDelete('');
      setMessage('Pasta removida. Os materiais continuam na biblioteca.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível remover a pasta.');
    } finally {
      setDeletingFolder(false);
    }
  }

  function closeDeleteConfirm() {
    setDeleteConfirmOpen(false);
    setFolderToDelete('');
    setMessage('');
  }

  const contentWidth = width < 600 ? width - 44 : width - 80;
  const searchMaxWidth = Math.min(430, Math.max(90, contentWidth - 104));
  return (
    <Screen
      title="Sua biblioteca"
      subtitle="Tudo o que você estuda, conectado em um só lugar."
      eyebrow="CONHECIMENTO QUE É SEU"
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}
      >
        <Animated.View
          pointerEvents={searchOpen ? 'auto' : 'none'}
          style={{
            width: searchWidth.interpolate({
              inputRange: [0, 1],
              outputRange: [0, searchMaxWidth],
            }),
            height: searchWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 72] }),
            opacity: searchMotion,
            overflow: 'hidden',
            transform: [
              {
                translateX: searchMotion.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
              },
            ],
          }}
        >
          <View style={{ gap: 5 }}>
            <T style={{ fontSize: 11, fontFamily: fonts.semibold }}>Buscar na biblioteca</T>
            <View
              style={{
                minHeight: 44,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 12,
                backgroundColor: colors.surface,
              }}
            >
              <Icon name="search" size={17} color={colors.muted} />
              <TextInput
                accessibilityLabel="Buscar na biblioteca"
                placeholder="Título, conteúdo, disciplina ou assunto..."
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  color: colors.ink,
                  fontFamily: fonts.regular,
                  fontSize: 12,
                }}
              />
            </View>
          </View>
        </Animated.View>
        <Touch
          accessibilityRole="button"
          accessibilityLabel={searchOpen ? 'Fechar busca' : 'Buscar na biblioteca'}
          onPress={() => {
            if (searchOpen) setSearch('');
            setSearchOpen((current) => !current);
          }}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 15,
            backgroundColor: colors.lavender,
          }}
        >
          <Icon name={searchOpen ? 'x' : 'search'} size={19} />
        </Touch>
        <Touch
          accessibilityRole="button"
          accessibilityLabel={filterCount ? `Filtros · ${filterCount}` : 'Filtros'}
          onPress={() => setFiltersOpen(true)}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 15,
            backgroundColor: colors.lavender,
          }}
        >
          <Icon name="sliders" size={19} />
          {filterCount ? (
            <View
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: colors.primary,
              }}
            />
          ) : null}
        </Touch>
      </View>

      <BottomSheet
        visible={filtersOpen}
        title="Filtrar biblioteca"
        onClose={() => setFiltersOpen(false)}
      >
        <T style={s.sectionTitle}>Tipo de material</T>
        <Choices>
          {['Todos', 'PDF', 'Slides', 'Anotações', 'Prova'].map((type) => (
            <Choice
              key={type}
              label={type}
              selected={filter === type}
              onPress={() => setFilter(type)}
            />
          ))}
          <Choice label="Favoritos" selected={favorites} onPress={() => setFavorites(!favorites)} />
        </Choices>
        <T style={s.sectionTitle}>Disciplina</T>
        <Choices>
          <Choice
            label="Todas as disciplinas"
            selected={subject === 'all'}
            onPress={() => setSubject('all')}
          />
          {data.subjects.map((item) => (
            <Choice
              key={item.id}
              label={item.name}
              selected={subject === item.id}
              onPress={() => setSubject(item.id)}
            />
          ))}
        </Choices>
        <Button
          title={`Ver ${materials.length} ${materials.length === 1 ? 'material' : 'materiais'}`}
          onPress={() => setFiltersOpen(false)}
        />
        <Button
          title="Limpar filtros"
          variant="ghost"
          onPress={() => {
            setFilter('Todos');
            setSubject('all');
            setFavorites(false);
          }}
        />
      </BottomSheet>

      <Card style={{ padding: 28, gap: 18 }}>
        <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
          <T style={s.sectionTitle}>Pastas</T>
          <View style={s.row}>
            <Touch
              accessibilityRole="button"
              accessibilityLabel="Nova pasta"
              onPress={() => openFolderSheet()}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                backgroundColor: colors.lavender,
              }}
            >
              <Icon name="folder-plus" size={19} />
            </Touch>
            {folders.some((item) => item.id === folder) ? (
              <View style={s.row}>
                <Touch
                  accessibilityRole="button"
                  accessibilityLabel="Editar pasta selecionada"
                  onPress={() => openFolderSheet(folder)}
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 13,
                    backgroundColor: colors.neutral,
                  }}
                >
                  <Icon name="edit-2" size={16} color={colors.primary} />
                </Touch>
                <Touch
                  accessibilityRole="button"
                  accessibilityLabel="Remover pasta"
                  onPress={() => {
                    setFolderToDelete(folder);
                    setMessage('');
                    setDeleteConfirmOpen(true);
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 13,
                    backgroundColor: colors.neutral,
                  }}
                >
                  <Icon name="trash-2" size={16} color={colors.muted} />
                </Touch>
              </View>
            ) : null}
          </View>
        </View>
        <View style={{ gap: 10 }}>
          <FolderChoice
            name="Todas as pastas"
            selected={folder === 'all'}
            fullWidth
            onPress={() => setFolder('all')}
          />
          {folders.map((item) => (
            <FolderChoice
              key={item.id}
              name={item.name}
              color={item.color ?? FOLDER_PALETTE[0].color}
              selected={folder === item.id}
              fullWidth
              onPress={() => setFolder(item.id)}
            />
          ))}
        </View>
      </Card>

      <BottomSheet
        visible={folderSheetOpen}
        title={editingFolder ? 'Editar pasta' : 'Criar pasta'}
        onClose={() => setFolderSheetOpen(false)}
      >
        <T muted style={{ lineHeight: 22 }}>
          Dê um nome e escolha uma cor para encontrar seus materiais com mais facilidade.
        </T>
        <View style={{ gap: 8 }}>
          <T style={{ fontSize: 12, fontFamily: fonts.semibold }}>Nome da pasta</T>
          <TextInput
            accessibilityLabel="Nome da pasta"
            autoFocus
            value={folderName}
            onChangeText={setFolderName}
            maxLength={60}
            placeholder="Ex.: Aulas do semestre"
            placeholderTextColor={colors.muted}
            returnKeyType="done"
            style={{
              minHeight: 48,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 12,
              backgroundColor: colors.surface,
              color: colors.ink,
              fontFamily: fonts.regular,
              fontSize: 14,
            }}
          />
        </View>
        <View style={{ gap: 12 }}>
          <T style={s.sectionTitle}>Cor da pasta</T>
          <Choices>
            {FOLDER_PALETTE.map((item) => (
              <FolderColorChoice
                key={item.name}
                item={item}
                selected={folderColor === item.color}
                onPress={() => setFolderColor(item.color)}
              />
            ))}
          </Choices>
        </View>
        <Button
          title={busy ? 'Salvando...' : editingFolder ? 'Salvar alterações' : 'Criar pasta'}
          icon={editingFolder ? 'check' : 'folder-plus'}
          onPress={saveFolder}
          disabled={busy || !folderName.trim()}
        />
        {message ? <Notice text={message} /> : null}
      </BottomSheet>

      <BottomSheet visible={deleteConfirmOpen} title="Excluir pasta?" onClose={closeDeleteConfirm}>
        <T muted style={{ lineHeight: 22 }}>
          Tem certeza que deseja excluir a pasta{' '}
          <T style={{ fontFamily: fonts.semibold }}>{folderBeingDeleted?.name ?? 'selecionada'}</T>?
          Os materiais continuarão na biblioteca.
        </T>
        {message ? <Notice text={message} /> : null}
        <Button title="Cancelar" variant="ghost" onPress={closeDeleteConfirm} />
        <Touch
          accessibilityRole="button"
          accessibilityLabel={deletingFolder ? 'Excluindo pasta' : 'Excluir pasta'}
          accessibilityState={{ disabled: deletingFolder }}
          disabled={deletingFolder}
          onPress={confirmRemoveFolder}
          style={{
            minHeight: 50,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            paddingHorizontal: 18,
            borderRadius: 16,
            backgroundColor: colors.redLight,
            opacity: deletingFolder ? 0.6 : 1,
          }}
        >
          <Icon name="trash-2" size={17} color={colors.red} />
          <T style={{ color: colors.red, fontFamily: fonts.semibold, fontSize: 14 }}>
            {deletingFolder ? 'Excluindo...' : 'Excluir pasta'}
          </T>
        </Touch>
      </BottomSheet>

      {message && !folderSheetOpen && !deleteConfirmOpen ? <Notice text={message} /> : null}
      <T muted>{materials.length} materiais encontrados</T>
      <View style={{ gap: 20 }}>
        {materialGroups.map((group) => {
          const groupColor =
            group.id === 'general' ? colors.neutral : (group.color ?? FOLDER_PALETTE[0].color);
          return (
            <View key={group.id} style={{ gap: 12 }}>
              <View style={s.row}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 11,
                    backgroundColor: groupColor,
                  }}
                >
                  <Icon name="folder" size={17} color={folderAccent(groupColor)} />
                </View>
                <T style={{ flex: 1, fontFamily: fonts.semibold }}>{group.name}</T>
                <T muted style={{ fontSize: 11 }}>
                  {group.materials.length} {group.materials.length === 1 ? 'material' : 'materiais'}
                </T>
              </View>
              {group.materials.map((material) => (
                <Card
                  key={material.id}
                  label={material.title}
                  onPress={() =>
                    router.push({ pathname: '/material/[id]', params: { id: material.id } })
                  }
                >
                  <View style={s.row}>
                    <Icon name={material.favorite ? 'star' : 'file-text'} />
                    <View style={{ flex: 1, gap: 5 }}>
                      <T style={{ fontFamily: fonts.semibold }}>{material.title}</T>
                      <T muted style={{ fontSize: 11 }}>
                        {data.subjects.find((item) => item.id === material.subjectId)?.name} ·{' '}
                        {formatDate(material.createdAt)} · {material.type}
                      </T>
                    </View>
                    <Icon name="chevron-right" size={17} />
                  </View>
                  <Badge
                    label={
                      material.content
                        ? 'ANOTAÇÃO LOCAL · SEM IA'
                        : 'MATERIAL FICTÍCIO · SEM ARQUIVO'
                    }
                  />
                </Card>
              ))}
            </View>
          );
        })}
      </View>
      {!materials.length ? (
        <Empty
          title="Nenhum material encontrado"
          message="Crie uma anotação ou ajuste a busca e os filtros."
        />
      ) : null}
      <Card>
        <T style={s.sectionTitle}>Crie uma anotação</T>
        <T muted>Guarde suas ideias na biblioteca e organize por pasta quando quiser.</T>
        <Button
          title="Adicionar material"
          icon="plus"
          onPress={() => router.push('/material/add')}
        />
      </Card>
    </Screen>
  );
}
