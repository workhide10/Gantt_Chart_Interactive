// Tipos do sistema. Todo "relacionamento" é feito guardando o id do outro registro
// (ex.: uma Atividade guarda o id da Escola e o id da Equipe).

export type ID = string

export interface Escola {
  id: ID
  codigo: string // ex.: "FRA" (o código usado na planilha)
  nome: string
  cor: string // cor da barra no Gantt, ex.: "#3b82f6"
}

export interface Disciplina {
  id: ID
  sigla: string // ex.: "ARQ", "EST", "HID"
  nome: string
}

export interface Equipe {
  id: ID
  nome: string // ex.: "EST-1"
  disciplinaId: ID
}

export interface Pessoa {
  id: ID
  nome: string
  funcao: string // ex.: "ENG", "TEC", "ARQ", "EST"
  /** @deprecated Compatibilidade com dados antigos; a composição atual é derivada de VinculoPessoaEquipe. */
  equipeId?: ID | null
}

export interface VinculoPessoaEquipe {
  id: ID
  pessoaId: ID // chave estrangeira para Pessoa
  equipeId: ID // chave estrangeira para Equipe
  projetoId: ID | null // chave estrangeira para Escola (projeto); null apenas em registros antigos a classificar
  inicio: string | null // null = data de início desconhecida em registro migrado
  fim: string | null // null = vínculo ainda aberto
  origem?: 'manual' | 'legado' | 'planilha'
}

export interface ComposicaoEquipe {
  id: ID
  equipeId: ID
  inicio: string
  fim: string | null // null = formação ainda vigente
  origem?: 'manual' | 'planilha'
}

export interface IntegranteComposicaoEquipe {
  id: ID
  composicaoId: ID
  pessoaId: ID
}

export interface Atividade {
  id: ID
  escolaId: ID
  equipeId: ID
  titulo?: string // etapa ou atividade concluída
  inicio: string // data ISO "AAAA-MM-DD"
  fim: string // data ISO "AAAA-MM-DD" (inclusive)
  descricao: string
}

export interface MarcoProjeto {
  id: ID
  escolaId: ID
  data: string // data ISO "AAAA-MM-DD"
  titulo: string
  observacao: string // registro do resultado ou contexto para análise
}

// Tudo o que é salvo no navegador fica dentro deste objeto.
export interface Dados {
  escolas: Escola[]
  disciplinas: Disciplina[]
  equipes: Equipe[]
  pessoas: Pessoa[]
  atividades: Atividade[]
  // Opcional para migrar automaticamente dados e backups da versão anterior.
  marcos?: MarcoProjeto[]
  // Registros antigos mantidos para migração/revisão; o histórico atual usa ComposicaoEquipe.
  vinculosEquipe?: VinculoPessoaEquipe[]
  // Formação versionada por equipe e vigência, independente do projeto e das atividades.
  composicoesEquipe?: ComposicaoEquipe[]
  integrantesComposicao?: IntegranteComposicaoEquipe[]
  // Controle de migrações de dados de referência executadas uma única vez.
  fontesImportadas?: string[]
}

export interface Filtros {
  escolaId: ID | ''
  disciplinaId: ID | ''
  equipeId: ID | ''
}
