import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Touch } from './Motion';
import { Icon, T, s } from './ui';
import { colors, fonts } from '@/constants/theme';

export function ChatComposer({
  value,
  onChange,
  onSend,
  busy,
  disabled = false,
  compact = false,
  note = 'Demonstração · sem envio externo',
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  busy: boolean;
  disabled?: boolean;
  compact?: boolean;
  note?: string;
}) {
  const sendDisabled = disabled || busy || !value.trim();
  return (
    <View style={{ gap: 8, position: 'relative' }}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 25,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: colors.lavenderLine,
          padding: compact ? 8 : 12,
          gap: 10,
          boxShadow: '0 5px 24px rgba(105, 71, 153, 0.07)',
        }}
      >
        {compact ? (
          <View style={[s.row, { gap: 5 }]}>
            <Touch
              accessibilityRole="button"
              accessibilityLabel="Escolher material da biblioteca"
              onPress={() => router.push('/library')}
              style={{
                width: 42,
                height: 42,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.lavender,
                borderRadius: 15,
              }}
            >
              <Icon name="plus" size={19} />
            </Touch>
            <TextInput
              accessibilityLabel="Sua pergunta"
              multiline
              editable={!disabled}
              maxLength={2000}
              value={value}
              onChangeText={onChange}
              placeholder={
                disabled ? 'O assistente Cortexa será conectado aqui' : 'Pergunte ao Cortexa'
              }
              placeholderTextColor={colors.muted}
              style={{
                flex: 1,
                minHeight: 42,
                maxHeight: 90,
                paddingHorizontal: 8,
                paddingVertical: 9,
                color: colors.ink,
                fontFamily: fonts.regular,
                fontSize: 14,
                outlineWidth: 0,
              }}
            />
            <Touch
              accessibilityRole="button"
              accessibilityLabel={busy ? 'Preparando resposta...' : 'Enviar pergunta'}
              accessibilityState={{ disabled: sendDisabled }}
              disabled={sendDisabled}
              onPress={onSend}
              style={{
                width: 42,
                height: 42,
                borderRadius: 15,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: sendDisabled ? 0.55 : 1,
              }}
            >
              <Icon name="arrow-up" color="white" size={20} />
            </Touch>
          </View>
        ) : (
          <TextInput
            accessibilityLabel="Sua pergunta"
            multiline
            editable={!disabled}
            maxLength={2000}
            value={value}
            onChangeText={onChange}
            placeholder={
              disabled
                ? 'O assistente Cortexa será conectado aqui'
                : 'O que você quer entender melhor?'
            }
            placeholderTextColor={colors.muted}
            style={{
              minHeight: 42,
              maxHeight: 120,
              paddingHorizontal: 8,
              paddingVertical: 8,
              color: colors.ink,
              fontFamily: fonts.regular,
              fontSize: 14,
              outlineWidth: 0,
            }}
          />
        )}
        {compact ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 8,
              paddingTop: 1,
            }}
          >
            <Icon name="shield" size={11} color={colors.muted} />
            <T muted numberOfLines={1} style={{ fontSize: 9 }}>
              {note}
            </T>
          </View>
        ) : (
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <View style={[s.row, { gap: 9, flexShrink: 1 }]}>
              <Touch
                accessibilityRole="button"
                accessibilityLabel="Escolher material da biblioteca"
                onPress={() => router.push('/library')}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.lavender,
                  borderRadius: 15,
                }}
              >
                <Icon name="plus" size={19} />
              </Touch>
              <Icon name="shield" size={12} color={colors.muted} />
              <T muted numberOfLines={2} style={{ fontSize: 10, flexShrink: 1 }}>
                {note}
              </T>
            </View>
            <Touch
              accessibilityRole="button"
              accessibilityLabel={busy ? 'Preparando resposta...' : 'Enviar pergunta'}
              accessibilityState={{ disabled: sendDisabled }}
              disabled={sendDisabled}
              onPress={onSend}
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: sendDisabled ? 0.55 : 1,
              }}
            >
              <Icon name="arrow-up" color="white" size={20} />
            </Touch>
          </View>
        )}
      </View>
    </View>
  );
}
