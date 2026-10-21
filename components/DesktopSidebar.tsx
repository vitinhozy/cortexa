import { Animated, Easing, ScrollView, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useGlobalSearchParams, usePathname } from 'expo-router';
import { navigationLocation } from '@/constants/navigation';
import { colors, fonts, themeTint } from '@/constants/theme';
import { workspaceTools } from '@/constants/tools';
import { useStudy } from '@/hooks/useStudy';
import { useNavigationLayout } from '@/hooks/useNavigationLayout';
import { Icon, T, s } from './ui';
import { Touch } from './Motion';
import { BrandLogo } from './BrandLogo';
import { NavigationLayoutToggle } from './NavigationLayoutToggle';
import { uid } from '@/utils/date';

export function DesktopSidebar() {
  const pathname = usePathname();
  const params = useGlobalSearchParams<{
    conversationId?: string;
    kind?: string;
    id?: string;
  }>();
  const activeConversationId = params.conversationId;
  const { data } = useStudy();
  const location = navigationLocation(pathname, {
    ...params,
    kind: params.kind ?? data.studio?.find((document) => document.id === params.id)?.kind,
  });
  const { collapsed, setCollapsed } = useNavigationLayout();
  const width = useRef(new Animated.Value(collapsed ? 72 : 224)).current;
  const contentOpacity = useRef(new Animated.Value(collapsed ? 0 : 1)).current;
  const menuHover = useRef(new Animated.Value(0)).current;
  const [compactHovered, setCompactHovered] = useState(false);
  const [expandedContent, setExpandedContent] = useState(!collapsed);
  const compact = !expandedContent;
  const recentConversations = useMemo(
    () =>
      [...data.conversations]
        .filter((conversation) => conversation.messages.length > 0)
        .sort((a, b) => {
          const latestA = a.messages.at(-1)?.createdAt ?? '';
          const latestB = b.messages.at(-1)?.createdAt ?? '';
          return latestB.localeCompare(latestA);
        })
        .slice(0, 5),
    [data.conversations],
  );
  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (collapsed) {
      animation = Animated.parallel([
        Animated.timing(width, {
          toValue: 72,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
      ]);
      animation.start(({ finished }) => {
        if (finished) {
          setExpandedContent(false);
          contentOpacity.setValue(1);
        }
      });
    } else {
      setExpandedContent(true);
      contentOpacity.setValue(0);
      animation = Animated.parallel([
        Animated.timing(width, {
          toValue: 224,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.delay(100),
          Animated.timing(contentOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
        ]),
      ]);
      animation.start();
    }
    return () => {
      animation.stop();
      width.stopAnimation();
      contentOpacity.stopAnimation();
    };
  }, [collapsed, contentOpacity, width]);
  useEffect(() => {
    const animation = Animated.timing(menuHover, {
      toValue: compactHovered ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [compactHovered, menuHover]);
  const main = [
    { label: 'Visão geral', route: '/overview' as const, icon: 'grid' as const },
    { label: 'Estudar', route: '/study' as const, icon: 'book-open' as const },
    { label: 'Conversar', route: '/ai' as const, icon: 'message-circle' as const },
  ];
  const renderMainItem = (item: (typeof main)[number]) => (
    <Touch
      key={item.route}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      aria-selected={location.sectionHref === item.route}
      accessibilityState={{ selected: location.sectionHref === item.route }}
      onPress={() => router.navigate(item.route)}
      style={[
        s.row,
        {
          borderRadius: 13,
          minHeight: 44,
          paddingHorizontal: compact ? 0 : 12,
          justifyContent: compact ? 'center' : 'flex-start',
          backgroundColor: location.sectionHref === item.route ? colors.lavender : 'transparent',
        },
      ]}
    >
      <Icon name={item.icon} size={17} color={themeTint(colors.primary, '#A29BAE')} />
      {!compact ? (
        <Animated.View style={{ opacity: contentOpacity }}>
          <T style={{ fontSize: 12 }}>{item.label}</T>
          {location.sectionHref === item.route && location.currentLabel !== item.label ? (
            <T muted style={{ fontSize: 10, marginTop: 2 }}>
              {location.currentLabel}
            </T>
          ) : null}
        </Animated.View>
      ) : null}
    </Touch>
  );

  return (
    <Animated.View
      testID="desktop-sidebar"
      style={{
        width,
        height: '100%',
        minHeight: '100%',
        alignSelf: 'stretch',
        flexShrink: 0,
        overflow: 'hidden',
        backgroundColor: colors.background,
        borderRightWidth: 1,
        borderColor: colors.line,
        paddingHorizontal: compact ? 8 : 18,
        paddingVertical: 18,
        gap: compact ? 16 : 23,
      }}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['#7C3AED00', '#7C3AED12', '#7C3AED24']}
        locations={[0, 0.6, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 230 }}
      />
      <Animated.View
        style={{ paddingVertical: 13, alignItems: compact ? 'center' : 'flex-start', gap: 10 }}
      >
        {compact ? (
          <Touch
            accessibilityRole="button"
            accessibilityLabel="Expandir navegação lateral"
            onPress={() => setCollapsed(false)}
            onHoverIn={() => setCompactHovered(true)}
            onHoverOut={() => setCompactHovered(false)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: compactHovered ? colors.surface : 'transparent',
              borderWidth: compactHovered ? 1 : 0,
              borderColor: colors.line,
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                opacity: menuHover.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                transform: [
                  { scale: menuHover.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] }) },
                ],
              }}
            >
              <BrandLogo size={32} wordmark={false} />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                opacity: menuHover,
                transform: [
                  { scale: menuHover.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) },
                ],
              }}
            >
              <Icon name="menu" size={17} color={colors.ink} />
            </Animated.View>
          </Touch>
        ) : (
          <View style={[s.row, { justifyContent: 'flex-start', gap: 12 }]}>
            <NavigationLayoutToggle compact sidebar />
            <Animated.View style={{ opacity: contentOpacity }}>
              <BrandLogo size={34} />
            </Animated.View>
          </View>
        )}
      </Animated.View>
      <ScrollView
        style={{ flex: 1, minHeight: 0 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 5 }}
      >
        {main.slice(0, 2).map(renderMainItem)}
        {main.slice(2).map(renderMainItem)}
        {!compact && pathname === '/ai' ? (
          <View style={{ marginTop: 7, marginBottom: 5, gap: 3 }}>
            <View style={[s.row, { justifyContent: 'space-between', paddingHorizontal: 12 }]}>
              <T muted style={{ fontSize: 9, letterSpacing: 1.5, marginTop: 9, marginBottom: 7 }}>
                RECENTES
              </T>
              <Touch
                accessibilityRole="button"
                accessibilityLabel="Nova conversa"
                onPress={() =>
                  router.replace({
                    pathname: '/ai',
                    params: { conversationId: uid('chat') },
                  })
                }
                style={{
                  minWidth: 36,
                  minHeight: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="plus" size={16} color={colors.muted} />
              </Touch>
            </View>
            {recentConversations.length ? (
              recentConversations.map((conversation) => {
                const selected = activeConversationId === conversation.id;
                const title =
                  conversation.messages.find((message) => message.role === 'user')?.content ??
                  'Nova conversa';
                return (
                  <Touch
                    key={conversation.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir conversa: ${title}`}
                    accessibilityState={{ selected }}
                    aria-selected={selected}
                    onPress={() =>
                      router.replace({
                        pathname: '/ai',
                        params: { conversationId: conversation.id },
                      })
                    }
                    style={{
                      minHeight: 38,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 9,
                      backgroundColor: selected ? colors.lavender : 'transparent',
                    }}
                  >
                    <Icon name="message-circle" size={13} color={colors.muted} />
                    <T muted={!selected} numberOfLines={1} style={{ flex: 1, fontSize: 11 }}>
                      {title}
                    </T>
                  </Touch>
                );
              })
            ) : (
              <T muted style={{ paddingHorizontal: 12, fontSize: 10, lineHeight: 16 }}>
                Suas conversas aparecerão aqui.
              </T>
            )}
          </View>
        ) : null}
        {!compact ? (
          <Animated.View style={{ opacity: contentOpacity }}>
            <T
              muted
              style={{
                fontSize: 9,
                letterSpacing: 1.5,
                marginTop: 24,
                marginBottom: 9,
                paddingHorizontal: 12,
              }}
            >
              SEU ESTÚDIO
            </T>
          </Animated.View>
        ) : null}
        {workspaceTools.map((tool) => (
          <Touch
            key={tool.id}
            accessibilityRole="button"
            accessibilityLabel={tool.label}
            onPress={() => router.push(tool.route)}
            style={[
              s.row,
              {
                minHeight: 43,
                borderRadius: 13,
                paddingHorizontal: compact ? 0 : 10,
                gap: compact ? 0 : 10,
                justifyContent: compact ? 'center' : 'flex-start',
                backgroundColor:
                  typeof tool.route === 'string' && pathname === tool.route
                    ? themeTint(tool.color)
                    : 'transparent',
              },
            ]}
          >
            <View style={{ padding: 6, backgroundColor: themeTint(tool.color), borderRadius: 9 }}>
              <Icon name={tool.icon} color={themeTint(tool.ink, '#A29BAE')} size={14} />
            </View>
            {!compact ? (
              <Animated.View style={{ opacity: contentOpacity }}>
                <T style={{ fontSize: 12 }}>{tool.label}</T>
              </Animated.View>
            ) : null}
          </Touch>
        ))}
      </ScrollView>
      <Touch
        accessibilityRole="button"
        accessibilityLabel="Conhecer Cortexa Plus"
        onPress={() => router.push('/membership')}
        style={{
          backgroundColor: colors.lavender,
          padding: compact ? 8 : 14,
          borderRadius: 18,
          gap: 6,
          alignItems: compact ? 'center' : undefined,
        }}
      >
        {compact ? (
          <BrandLogo size={22} wordmark={false} />
        ) : (
          <Animated.View style={{ opacity: contentOpacity }}>
            <View style={s.row}>
              <BrandLogo size={20} wordmark={false} />
              <T
                style={{
                  flex: 1,
                  color: colors.primaryDark,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                Um pouco mais de possibilidades
              </T>
            </View>
            <T muted style={{ fontSize: 10 }}>
              Conheça o Cortexa Plus · em breve
            </T>
          </Animated.View>
        )}
      </Touch>
      <Touch
        accessibilityRole="tab"
        accessibilityLabel="Perfil"
        aria-selected={pathname === '/profile'}
        onPress={() => router.navigate('/profile')}
        style={[s.row, { paddingVertical: 8, justifyContent: compact ? 'center' : 'flex-start' }]}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.rose,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T style={{ color: colors.pink, fontFamily: fonts.semibold }}>{data.user.name[0]}</T>
        </View>
        {!compact ? (
          <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
            <T numberOfLines={1} style={{ fontSize: 12, fontFamily: fonts.medium }}>
              {data.user.name}
            </T>
            <T muted style={{ fontSize: 10 }}>
              Perfil e preferências
            </T>
          </Animated.View>
        ) : null}
        {!compact ? (
          <Animated.View style={{ opacity: contentOpacity }}>
            <Icon name="chevrons-up" size={14} />
          </Animated.View>
        ) : null}
      </Touch>
    </Animated.View>
  );
}
