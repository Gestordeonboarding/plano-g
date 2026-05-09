/**
 * Paletas de cores das principais administradoras de consórcio do Brasil.
 * Usadas para aplicar automaticamente o branding da administradora que o
 * vendedor for usar na apresentação ao cliente final.
 *
 * Cada administradora tem:
 *  - primary: cor principal da marca (usada como accent dos slides)
 *  - secondary: cor de apoio (usada em destaques secundários)
 *  - dark: tom mais escuro para fundos
 *  - text_on_primary: cor do texto sobre a primary (preto ou branco)
 */

export interface AdminPalette {
  id: string
  name: string
  primary: string
  secondary: string
  dark: string
  text_on_primary: string
  /** sigla curta para badges */
  short: string
}

export const ADMIN_PALETTES: AdminPalette[] = [
  {
    id: 'porto',
    name: 'Porto Seguro',
    primary: '#0033A0',
    secondary: '#FFCD00',
    dark: '#001E5C',
    text_on_primary: '#FFFFFF',
    short: 'PORTO',
  },
  {
    id: 'santander',
    name: 'Santander',
    primary: '#EC0000',
    secondary: '#222222',
    dark: '#9C0000',
    text_on_primary: '#FFFFFF',
    short: 'SANT',
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    primary: '#CC092F',
    secondary: '#1A1A1A',
    dark: '#8B0620',
    text_on_primary: '#FFFFFF',
    short: 'BRAD',
  },
  {
    id: 'itau',
    name: 'Itaú',
    primary: '#EC7000',
    secondary: '#003399',
    dark: '#A14E00',
    text_on_primary: '#FFFFFF',
    short: 'ITAU',
  },
  {
    id: 'embracon',
    name: 'Embracon',
    primary: '#009639',
    secondary: '#FFCD00',
    dark: '#005F23',
    text_on_primary: '#FFFFFF',
    short: 'EMBR',
  },
  {
    id: 'rodobens',
    name: 'Rodobens',
    primary: '#00529B',
    secondary: '#E60012',
    dark: '#003263',
    text_on_primary: '#FFFFFF',
    short: 'RODO',
  },
  {
    id: 'hs',
    name: 'HS Consórcios',
    primary: '#0072CE',
    secondary: '#FFB81C',
    dark: '#004A87',
    text_on_primary: '#FFFFFF',
    short: 'HS',
  },
  {
    id: 'magalu',
    name: 'Magalu Consórcio',
    primary: '#0066CC',
    secondary: '#FFEB00',
    dark: '#003F80',
    text_on_primary: '#FFFFFF',
    short: 'MAGA',
  },
  {
    id: 'volkswagen',
    name: 'Volkswagen Consórcio',
    primary: '#001E50',
    secondary: '#00B0F0',
    dark: '#000F2C',
    text_on_primary: '#FFFFFF',
    short: 'VW',
  },
  {
    id: 'honda',
    name: 'Honda Consórcio',
    primary: '#CC0000',
    secondary: '#1A1A1A',
    dark: '#8A0000',
    text_on_primary: '#FFFFFF',
    short: 'HOND',
  },
  {
    id: 'yamaha',
    name: 'Yamaha Consórcio',
    primary: '#0046AD',
    secondary: '#E60012',
    dark: '#002F70',
    text_on_primary: '#FFFFFF',
    short: 'YAMA',
  },
  {
    id: 'caixa',
    name: 'Caixa Consórcio',
    primary: '#0070AF',
    secondary: '#F39200',
    dark: '#004B75',
    text_on_primary: '#FFFFFF',
    short: 'CAIXA',
  },
  {
    id: 'bb',
    name: 'BB Consórcios',
    primary: '#FFEF38',
    secondary: '#003595',
    dark: '#C7BA00',
    text_on_primary: '#003595',
    short: 'BB',
  },
  {
    id: 'ademicon',
    name: 'Ademicon',
    primary: '#0033A0',
    secondary: '#00B0E8',
    dark: '#001F66',
    text_on_primary: '#FFFFFF',
    short: 'ADEM',
  },
  {
    id: 'custom',
    name: 'Personalizada',
    primary: '#00D4C8',
    secondary: '#0D1F1E',
    dark: '#007A72',
    text_on_primary: '#0D1F1E',
    short: 'CUST',
  },
]

export const DEFAULT_PALETTE: AdminPalette = ADMIN_PALETTES.find((p) => p.id === 'custom')!

export function getPalette(id: string | null | undefined): AdminPalette {
  if (!id) return DEFAULT_PALETTE
  return ADMIN_PALETTES.find((p) => p.id === id) || DEFAULT_PALETTE
}
