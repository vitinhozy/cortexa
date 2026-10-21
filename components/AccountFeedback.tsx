import { useEffect } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Reveal, Touch } from './Motion';
import { Card, Icon, T } from './ui';
import { colors, fonts } from '@/constants/theme';
import type { AccountNotice } from '@/types/auth';

/** Stays above the form even when its ScrollView or the keyboard is open. */
export function AccountFeedback({
  notice,
  onClose,
  onAction,
}: {
  notice: AccountNotice | null;
  onClose: () => void;
  onAction: (action: NonNullable<AccountNotice['action']>) => void;
}) {
  const insets = useSafeAreaInsets();
  const announcement = notice ? notice.title + '. ' + notice.text : undefined;
  useEffect(() => {
    if (announcement && Platform.OS === 'ios')
      AccessibilityInfo.announceForAccessibility(announcement);
  }, [announcement]);
  if (!notice) return null;
  const error = notice.kind === 'error';
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, zIndex: 20 }}
    >
      <Reveal
        key={notice.id}
        variant="inflate"
        style={{ width: '100%', maxWidth: 520, alignSelf: 'center' }}
      >
        <Card style={{ padding: 16, gap: 10, borderBottomLeftRadius: 6 }}>
          <View
            accessibilityLiveRegion={error ? 'assertive' : 'polite'}
            accessibilityRole={error ? 'alert' : undefined}
            testID="account-feedback"
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}
          >
            <View
              style={{
                padding: 9,
                borderRadius: 12,
                backgroundColor: error ? colors.redLight : colors.lavender,
              }}
            >
              <Icon
                name={
                  error
                    ? 'alert-circle'
                    : notice.kind === 'success'
                      ? 'check-circle'
                      : 'message-circle'
                }
                size={18}
              />
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <T style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{notice.title}</T>
              <T muted style={{ fontSize: 13, lineHeight: 20 }}>
                {notice.text}
              </T>
            </View>
            <Touch
              accessibilityRole="button"
              accessibilityLabel="Fechar aviso"
              onPress={onClose}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -8,
                marginRight: -8,
              }}
            >
              <Icon name="x" color={colors.muted} size={18} />
            </Touch>
          </View>
          {notice.action ? (
            <Touch
              accessibilityRole="button"
              onPress={() => notice.action && onAction(notice.action)}
              style={{
                minHeight: 44,
                paddingHorizontal: 12,
                alignSelf: 'flex-start',
                justifyContent: 'center',
                marginLeft: 36,
              }}
            >
              <T style={{ color: colors.primaryDark, fontFamily: fonts.semibold, fontSize: 13 }}>
                {notice.action === 'recover' ? 'Recuperar minha senha' : 'Reenviar confirmação'}
              </T>
            </Touch>
          ) : null}
        </Card>
      </Reveal>
    </View>
  );
}
