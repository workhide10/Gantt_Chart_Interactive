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
  equipeId: ID | null
}

export interface Atividade {
  id: ID
  escolaId: ID
  equipeId: ID
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
}

export interface Filtros {
  escolaId: ID | ''
  disciplinaId: ID | ''
  equipeId: ID | ''
}
