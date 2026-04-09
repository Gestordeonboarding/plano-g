import { Slide, PresentationTheme, EditableField } from './types'

const defaultTheme: PresentationTheme = {
  accent_color: '#00D4C8',
  bg_color: '#0D1F1E',
  font: 'inter',
  show_logo: true,
}

function field(key: string, label: string, placeholder: string, required = false) {
  return { key, label, type: 'text' as const, value: '', placeholder, required, max_chars: 100 }
}
function currencyField(key: string, label: string, placeholder = 'R$ 0,00') {
  return { key, label, type: 'currency' as const, value: '', placeholder, required: false }
}
function textareaField(key: string, label: string, placeholder: string) {
  return { key, label, type: 'textarea' as const, value: '', placeholder, required: false, max_chars: 500 }
}

function makeSlide(id: string, type: Slide['type'], title: string, fields: EditableField[], layout: Slide['layout'] = 'centered', bg: Slide['background'] = 'dark'): Slide {
  return { id, type, title, editable_fields: fields, layout, background: bg, locked: false, visible: true }
}

export const TEMPLATES = [
  {
    name: 'Proposta Imóvel',
    description: 'Ideal para apresentações de consórcio imobiliário',
    category: 'imovel',
    animation_style: 'slide' as const,
    sort_order: 1,
    theme: defaultTheme,
    slides: [
      makeSlide('s1', 'cover', 'Capa', [field('client_name', 'Nome do cliente', 'João Silva', true), field('subtitle', 'Subtítulo', 'Proposta de Consórcio Imobiliário')], 'centered', 'accent'),
      makeSlide('s2', 'problem', 'O sonho da casa própria', [textareaField('problem_text', 'Texto do problema', 'Financiar um imóvel custa o dobro do valor...')], 'split'),
      makeSlide('s3', 'solution', 'Por que consórcio?', [field('benefit1', 'Benefício 1', 'Sem juros abusivos'), field('benefit2', 'Benefício 2', 'Parcelas fixas e acessíveis'), field('benefit3', 'Benefício 3', 'Liberdade para escolher o imóvel')], 'cards'),
      makeSlide('s4', 'comparison', 'Consórcio vs Financiamento', [currencyField('financiamento_total', 'Custo total financiamento'), currencyField('consorcio_total', 'Custo total consórcio')], 'split'),
      makeSlide('s5', 'numbers', 'Seu plano personalizado', [currencyField('credit_value', 'Valor do crédito'), currencyField('monthly_payment', 'Parcela mensal'), field('total_months', 'Prazo (meses)', '180')], 'cards'),
      makeSlide('s6', 'timeline', 'Como funciona a contemplação', [field('step1', 'Passo 1', 'Adesão ao grupo'), field('step2', 'Passo 2', 'Assembleias mensais'), field('step3', 'Passo 3', 'Contemplação e uso da carta')], 'full'),
      makeSlide('s7', 'about', 'Sobre nós', [field('company_name', 'Nome da empresa', 'Minha Empresa'), textareaField('about_text', 'Texto sobre a empresa', 'Somos especialistas em consórcio...')], 'split'),
      makeSlide('s8', 'cta', 'Próximos passos', [field('cta_text', 'Chamada para ação', 'Vamos começar sua jornada!'), field('phone', 'WhatsApp', '(11) 99999-9999'), field('email', 'Email', 'contato@empresa.com')], 'centered', 'accent'),
    ] as Slide[],
  },
  {
    name: 'Proposta Auto Premium',
    description: 'Para consórcio de veículos de alto padrão',
    category: 'auto',
    animation_style: 'zoom' as const,
    sort_order: 2,
    theme: { ...defaultTheme, accent_color: '#3B82F6' },
    slides: [
      makeSlide('s1', 'cover', 'Capa', [field('client_name', 'Nome do cliente', 'Maria Souza', true), field('car_model', 'Modelo do veículo', 'Toyota Corolla')], 'centered', 'accent'),
      makeSlide('s2', 'problem', 'Liberdade de escolher', [textareaField('text', 'Texto', 'Com consórcio você escolhe o veículo que quiser...')], 'split'),
      makeSlide('s3', 'comparison', 'Custo real da compra', [currencyField('financing_cost', 'Custo financiamento'), currencyField('consortium_cost', 'Custo consórcio')], 'cards'),
      makeSlide('s4', 'numbers', 'Seu plano de veículo', [currencyField('credit_value', 'Valor do crédito'), currencyField('monthly_payment', 'Parcela mensal'), field('months', 'Meses', '60')], 'cards'),
      makeSlide('s5', 'solution', 'Simulação de lance', [currencyField('lance_value', 'Lance estimado'), field('lance_pct', 'Percentual do lance', '20%'), textareaField('obs', 'Observações', '')], 'split'),
      makeSlide('s6', 'about', 'Por que nos escolher', [field('diff1', 'Diferencial 1', 'Assessoria completa'), field('diff2', 'Diferencial 2', 'Melhor custo-benefício'), field('diff3', 'Diferencial 3', 'Suporte pós-venda')], 'cards'),
      makeSlide('s7', 'cta', 'Vamos fechar?', [field('cta_text', 'Chamada', 'Seu novo veículo está a um passo!'), field('phone', 'WhatsApp', '(11) 99999-9999')], 'centered', 'accent'),
    ] as Slide[],
  },
  {
    name: 'Apresentação Institucional',
    description: 'Apresente sua empresa antes de falar do produto',
    category: 'universal',
    animation_style: 'fade' as const,
    sort_order: 3,
    theme: defaultTheme,
    slides: [
      makeSlide('s1', 'cover', 'Capa', [field('company_name', 'Nome da empresa', 'Minha Empresa', true), field('tagline', 'Tagline', 'Realizando sonhos desde 2010')], 'centered', 'accent'),
      makeSlide('s2', 'about', 'Nossa história', [textareaField('history', 'História', 'Fundada em 2010, somos referência em...')], 'split'),
      makeSlide('s3', 'numbers', 'Nossos números', [field('clients', 'Clientes atendidos', '500+'), field('years', 'Anos de mercado', '14'), field('satisfaction', 'Satisfação', '98%')], 'cards'),
      makeSlide('s4', 'solution', 'O que fazemos', [field('service1', 'Serviço 1', 'Consórcio Imobiliário'), field('service2', 'Serviço 2', 'Consórcio de Veículos'), field('service3', 'Serviço 3', 'Assessoria completa')], 'cards'),
      makeSlide('s5', 'problem', 'Por que consórcio', [textareaField('why', 'Por que escolher', 'Consórcio é a forma mais inteligente de realizar seu sonho...')], 'split'),
      makeSlide('s6', 'testimonial', 'Cases de sucesso', [field('client', 'Nome do cliente', 'Pedro Costa'), textareaField('testimonial', 'Depoimento', '"Realizei o sonho da casa própria com muito menos custo..."')], 'centered'),
      makeSlide('s7', 'cta', 'Fale conosco', [field('phone', 'WhatsApp', '(11) 99999-9999'), field('email', 'Email', 'contato@empresa.com'), field('site', 'Site', 'www.empresa.com')], 'centered', 'accent'),
    ] as Slide[],
  },
  {
    name: 'Proposta Rápida',
    description: 'Versão compacta para reuniões curtas',
    category: 'universal',
    animation_style: 'slide' as const,
    sort_order: 4,
    theme: defaultTheme,
    slides: [
      makeSlide('s1', 'cover', 'Capa', [field('client_name', 'Nome do cliente', 'Cliente', true), field('company', 'Empresa', 'Minha Empresa')], 'centered', 'accent'),
      makeSlide('s2', 'problem', 'Seu objetivo', [textareaField('goal', 'Objetivo do cliente', 'Adquirir imóvel / veículo / serviço...')], 'centered'),
      makeSlide('s3', 'numbers', 'Nossa solução', [currencyField('credit', 'Crédito'), currencyField('parcela', 'Parcela'), field('prazo', 'Prazo', '180 meses')], 'cards'),
      makeSlide('s4', 'timeline', 'Próximos passos', [field('step1', 'Passo 1', 'Assinatura do contrato'), field('step2', 'Passo 2', 'Início das assembleias'), field('step3', 'Passo 3', 'Contemplação')], 'full'),
      makeSlide('s5', 'cta', 'Vamos começar!', [field('phone', 'WhatsApp', '(11) 99999-9999')], 'centered', 'accent'),
    ] as Slide[],
  },
  {
    name: 'Conquiste seu Imóvel',
    description: 'Foco emocional e aspiracional',
    category: 'imovel',
    animation_style: 'flip' as const,
    sort_order: 5,
    theme: { ...defaultTheme, accent_color: '#8B5CF6' },
    slides: [
      makeSlide('s1', 'cover', 'Capa Cinematográfica', [field('client_name', 'Nome', 'Ana Paula', true), field('dream', 'O sonho', 'A casa dos seus sonhos')], 'full', 'accent'),
      makeSlide('s2', 'testimonial', 'Quem já realizou', [field('name', 'Nome', 'Roberto Lima'), textareaField('story', 'História', '"Há 2 anos atrás eu não acreditava que seria possível..."')], 'split'),
      makeSlide('s3', 'problem', 'Por que agora é o momento', [textareaField('reason', 'Motivo', 'O mercado imobiliário valoriza 12% ao ano...')], 'centered'),
      makeSlide('s4', 'numbers', 'Seu plano', [currencyField('credit', 'Valor do crédito'), currencyField('parcela', 'Parcela mensal'), field('prazo', 'Prazo', '180 meses')], 'cards'),
      makeSlide('s5', 'solution', 'Diferenciais', [field('d1', 'Diferencial 1', 'Sem juros'), field('d2', 'Diferencial 2', 'Carta de crédito valorizada'), field('d3', 'Diferencial 3', 'Flexibilidade total')], 'cards'),
      makeSlide('s6', 'cta', 'Realize seu sonho', [field('cta', 'Chamada', 'A casa própria está mais perto do que você imagina!'), field('phone', 'WhatsApp', '(11) 99999-9999')], 'centered', 'accent'),
    ] as Slide[],
  },
  {
    name: 'Auto Acessível',
    description: 'Foco em custo baixo e acessibilidade',
    category: 'auto',
    animation_style: 'slide' as const,
    sort_order: 6,
    theme: { ...defaultTheme, accent_color: '#F59E0B' },
    slides: [
      makeSlide('s1', 'cover', 'Capa', [field('client_name', 'Nome', 'Carlos'), field('vehicle', 'Veículo desejado', 'Moto / Carro')], 'centered', 'accent'),
      makeSlide('s2', 'problem', 'O problema do financiamento', [textareaField('problem', 'Problema', 'No financiamento você paga até 100% a mais pelo veículo...')], 'split'),
      makeSlide('s3', 'solution', 'A solução consórcio', [field('b1', 'Benefício 1', 'Parcela acessível'), field('b2', 'Benefício 2', 'Zero juros'), field('b3', 'Benefício 3', 'Escolha livre do veículo')], 'cards'),
      makeSlide('s4', 'numbers', 'Seu plano', [currencyField('credit', 'Crédito'), currencyField('parcela', 'Parcela (cabe no bolso!)'), field('meses', 'Meses', '60')], 'cards'),
      makeSlide('s5', 'comparison', 'Compare você mesmo', [currencyField('fin_total', 'Total financiamento'), currencyField('con_total', 'Total consórcio')], 'split'),
      makeSlide('s6', 'cta', 'Seu veículo novo te espera', [field('phone', 'WhatsApp', '(11) 99999-9999')], 'centered', 'accent'),
    ] as Slide[],
  },
  {
    name: 'Proposta Investimento',
    description: 'Consórcio como estratégia de patrimônio',
    category: 'universal',
    animation_style: 'fade' as const,
    sort_order: 7,
    theme: { ...defaultTheme, accent_color: '#10B981' },
    slides: [
      makeSlide('s1', 'cover', 'Capa', [field('client_name', 'Nome', 'Investidor'), field('subtitle', 'Subtítulo', 'Construindo patrimônio com inteligência')], 'centered', 'accent'),
      makeSlide('s2', 'problem', 'Consórcio como investimento', [textareaField('text', 'Argumento', 'Enquanto outros perdem dinheiro com juros, você constrói patrimônio...')], 'split'),
      makeSlide('s3', 'comparison', 'Vs outros investimentos', [field('cdi', 'CDI (12 meses)', '11% a.a.'), field('consorcio', 'Consórcio (valorização)', '15% a.a. no imóvel')], 'cards'),
      makeSlide('s4', 'numbers', 'Simulação de retorno', [currencyField('invested', 'Valor investido'), currencyField('patrimony', 'Patrimônio estimado em 5 anos'), field('roi', 'Retorno estimado', '35%')], 'cards'),
      makeSlide('s5', 'timeline', 'Seu plano', [field('s1', 'Fase 1', 'Adesão e parcelas'), field('s2', 'Fase 2', 'Contemplação'), field('s3', 'Fase 3', 'Valorização do bem')], 'full'),
      makeSlide('s6', 'cta', 'Comece a investir hoje', [field('cta', 'Chamada', 'Seu patrimônio começa agora!'), field('phone', 'WhatsApp', '(11) 99999-9999')], 'centered', 'accent'),
    ] as Slide[],
  },
  {
    name: 'Proposta Serviços',
    description: 'Para viagem, cirurgia, reforma e outros serviços',
    category: 'servicos',
    animation_style: 'zoom' as const,
    sort_order: 8,
    theme: { ...defaultTheme, accent_color: '#EC4899' },
    slides: [
      makeSlide('s1', 'cover', 'Capa', [field('client_name', 'Nome', 'Cliente'), field('service', 'Projeto desejado', 'Viagem / Cirurgia / Reforma')], 'centered', 'accent'),
      makeSlide('s2', 'problem', 'Realize seu projeto', [textareaField('dream', 'Sonho do cliente', 'Você merece realizar esse projeto sem comprometer seu orçamento...')], 'split'),
      makeSlide('s3', 'solution', 'Como funciona', [field('h1', 'Como 1', 'Escolha o valor do crédito'), field('h2', 'Como 2', 'Pague parcelas acessíveis'), field('h3', 'Como 3', 'Use a carta quando contemplado')], 'cards'),
      makeSlide('s4', 'numbers', 'Seu plano personalizado', [currencyField('credit', 'Valor do crédito'), currencyField('parcela', 'Parcela mensal'), field('prazo', 'Prazo', '36 meses')], 'cards'),
      makeSlide('s5', 'cta', 'Próximos passos', [field('cta', 'Chamada', 'Seu projeto começa hoje!'), field('phone', 'WhatsApp', '(11) 99999-9999')], 'centered', 'accent'),
    ] as Slide[],
  },
]
