export const FOLDER_PALETTE = [
  { name: 'Lavanda', color: '#E9D5FF', accent: '#7E57A5' },
  { name: 'Azul', color: '#DCEBFF', accent: '#4E73A8' },
  { name: 'Menta', color: '#D7F2E3', accent: '#438064' },
  { name: 'Amarelo', color: '#FFF0C2', accent: '#95752D' },
  { name: 'Pêssego', color: '#FFDCCB', accent: '#A86648' },
  { name: 'Rosa', color: '#FFD9E8', accent: '#A75678' },
  { name: 'Turquesa', color: '#D7F0F2', accent: '#438187' },
  { name: 'Cinza', color: '#E7E5E4', accent: '#68615D' },
] as const;

export function folderAccent(color?: string) {
  return FOLDER_PALETTE.find((item) => item.color === color)?.accent ?? FOLDER_PALETTE[0].accent;
}
