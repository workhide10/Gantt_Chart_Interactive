# 9. Plano de execução do desenvolvimento

## 9.1 Estratégia

Desenvolver por fatias verticais: cada etapa deve entregar comportamento
testável de ponta a ponta sempre que possível. Evitar construir toda a
API e toda a interface sem integração intermediária.

## 9.2 Fases

### Fase 0 --- Alinhamento

-   Validar visão, escopo do MVP e usuários-alvo.
-   Resolver decisões críticas em `12-decisoes-pendentes.md`.
-   Confirmar tecnologia e licença da biblioteca Gantt.
-   Definir critérios de aceite e ambiente de demonstração.

**Saída:** escopo aprovado e decisões críticas registradas.

### Fase 1 --- Fundação do repositório

-   Criar estrutura do repositório.
-   Configurar Git, branches e revisão.
-   Criar `.env.example` sem segredos.
-   Configurar Docker, se adotado.
-   Criar pipeline básico de lint e testes.
-   Documentar execução local.

**Saída:** desenvolvedor consegue executar o projeto seguindo as
instruções.

### Fase 2 --- Banco e modelos

-   Configurar PostgreSQL.
-   Configurar SQLAlchemy e migrações.
-   Implementar modelos e restrições.
-   Criar dados de desenvolvimento.
-   Testar persistência e integridade.

**Saída:** modelos persistidos e migrações reproduzíveis.

### Fase 3 --- API e autorização

-   Implementar autenticação.
-   Implementar autorização por recurso e escopo.
-   Criar CRUD de projetos, disciplinas, tarefas e integrantes.
-   Implementar dependências e prevenção de ciclos.
-   Padronizar erros.
-   Criar testes de API.

**Saída:** API utilizável e documentada.

### Fase 4 --- Interface base

-   Criar navegação e layout.
-   Implementar telas de projetos e disciplinas.
-   Implementar formulários de tarefas e integrantes.
-   Conectar as telas à API.
-   Implementar estados de carregamento, vazio, sucesso e erro.

**Saída:** operações principais acessíveis pela interface.

### Fase 5 --- Gantt integrado

-   Selecionar e integrar a biblioteca Gantt.
-   Mapear entidades da API para o formato da biblioteca.
-   Exibir tarefas por disciplina.
-   Implementar criação e edição.
-   Implementar movimento e redimensionamento.
-   Persistir alterações.
-   Tratar rollback/reconciliação em falhas.
-   Testar dependências e limites de datas.

**Saída:** cronograma interativo com persistência confiável.

### Fase 6 --- Capacidade

-   Confirmar o algoritmo de distribuição de esforço.
-   Implementar cálculo de disponibilidade e alocação semanal.
-   Criar consulta/serviço de capacidade.
-   Construir visualização semanal e heatmap.
-   Destacar sobrecargas.
-   Recalcular após mudanças relevantes.
-   Testar casos de capacidade zero e semanas parciais.

**Saída:** capacidade semanal consistente com as tarefas persistidas.

### Fase 7 --- Qualidade e publicação

-   Executar testes unitários, integração e end-to-end.
-   Validar permissões e isolamento de dados.
-   Revisar logs e gestão de segredos.
-   Configurar backups e migrações de produção.
-   Publicar homologação.
-   Realizar aceite com usuários.
-   Corrigir falhas bloqueadoras e publicar produção.

**Saída:** MVP validado e operacional.

## 9.3 Backlog técnico inicial

  -------------------------------------------------------------------------------
  ID                Tarefa            Dependências      Resultado verificável
  ----------------- ----------------- ----------------- -------------------------
  DEV-001           Definir estrutura Fase 0            Pastas e instruções
                    do repositório                      aprovadas

  DEV-002           Configurar        DEV-001           Execução local
                    ambiente e                          documentada
                    variáveis                           

  DEV-003           Configurar        DEV-002           Migração inicial
                    PostgreSQL e                        executável
                    migrações                           

  DEV-004           Criar modelos de  DEV-003           Modelos e restrições
                    dados                               testados

  DEV-005           Implementar       DEV-002           Sessão válida e inválida
                    autenticação                        testadas

  DEV-006           Implementar       DEV-005           Acesso indevido bloqueado
                    autorização e                       
                    escopo                              

  DEV-007           CRUD de projetos  DEV-004, DEV-006  Testes de API aprovados

  DEV-008           CRUD de           DEV-007           Relação com projeto
                    disciplinas                         validada

  DEV-009           CRUD de tarefas   DEV-008           Validações de
                                                        datas/progresso/esforço

  DEV-010           CRUD de           DEV-006           Capacidade semanal
                    integrantes                         persistida

  DEV-011           Dependências e    DEV-009           Ciclos rejeitados
                    prevenção de                        
                    ciclos                              

  DEV-012           Interface base    DEV-001           Navegação e layout

  DEV-013           Telas de projetos DEV-007, DEV-012  CRUD integrado

  DEV-014           Formulários de    DEV-008, DEV-009, CRUD integrado
                    disciplina e      DEV-012           
                    tarefa                              

  DEV-015           Integrar          DEV-014           Tarefas exibidas
                    biblioteca Gantt                    corretamente

  DEV-016           Salvar mudanças   DEV-009, DEV-015  Datas persistidas
                    do Gantt                            

  DEV-017           Tratamento de     DEV-016           Estado reconciliado em
                    falha no Gantt                      erro

  DEV-018           Definir algoritmo Decisão aprovada  Especificação e exemplos
                    de capacidade                       

  DEV-019           Implementar       DEV-010, DEV-018  Casos de cálculo
                    cálculo semanal                     aprovados

  DEV-020           Criar tela de     DEV-019           Horas e utilização
                    capacidade                          visíveis

  DEV-021           Atualizar         DEV-016, DEV-019  Valores recalculados
                    capacidade após                     
                    alterações                          

  DEV-022           Testes de regras  DEV-009, DEV-011, Testes automatizados
                    de negócio        DEV-019           

  DEV-023           Teste ponta a     DEV-013, DEV-020  Fluxo principal validado
                    ponta                               

  DEV-024           Configurar CI     DEV-001           Pipeline executa testes

  DEV-025           Preparar          DEV-024           Versão publicada para
                    homologação                         aceite

  DEV-026           Revisar segurança Antes de produção Checklist concluído
                    e backups                           

  DEV-027           Publicar MVP      DEV-023, DEV-025, Versão de produção
                                      DEV-026           validada
  -------------------------------------------------------------------------------

## 9.4 Modelo para descrever cada tarefa

Para cada item de desenvolvimento, registrar: - **Objetivo:** qual
resultado deve existir. - **Contexto:** requisito e regra associados. -
**Pré-requisitos:** o que precisa estar pronto. - **Implementação:**
atividades concretas. - **Critérios de aceite:** condições
observáveis. - **Testes:** casos que demonstram o comportamento. -
**Riscos:** impactos ou decisões em aberto. - **Definition of Done:**
código, testes, revisão e documentação concluídos.

## 9.5 Rastreamento

Exemplo de cadeia de rastreabilidade:

`RF-012` (cálculo semanal) → `RN-007` (fórmula de utilização) →
`DEV-019` (serviço de cálculo) → `CA-006/CA-007` (critérios) → testes de
capacidade em `10-plano-de-testes.md`.

## 9.6 Controle de mudanças

Quando um requisito mudar: 1. Atualizar o requisito. 2. Identificar
regras, modelo de dados, API, interface e testes afetados. 3. Registrar
a decisão e a justificativa. 4. Atualizar o backlog. 5. Revisar impactos
em prazo e escopo.
