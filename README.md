# SaaS de Planejamento BIM

Plataforma web para **planejamento de cronogramas e capacidade de
equipes em projetos AEC/BIM**. A proposta é reunir tarefas, prazos,
dependências e disponibilidade da equipe em um único ambiente,
permitindo visualizar o cronograma em um gráfico de Gantt e entender
como alterações afetam a carga semanal de trabalho.

> **Status do projeto:** em planejamento e desenvolvimento. As
> funcionalidades descritas neste README representam o escopo proposto e
> podem ainda não estar implementadas.

## Objetivo

Facilitar o planejamento e o acompanhamento de projetos
multidisciplinares de arquitetura, engenharia e construção, reduzindo a
dependência de controles isolados e melhorando a visibilidade sobre
prazos e sobrecarga da equipe.

## Funcionalidades planejadas

### Cronograma e tarefas

-   Organização de projetos por disciplinas ou estrutura WBS.
-   Visualização de tarefas em gráfico de Gantt.
-   Criação e edição de tarefas, datas, progresso e esforço estimado.
-   Alteração de datas diretamente no cronograma.
-   Representação de dependências entre tarefas.
-   Persistência das alterações realizadas.

### Planejamento de capacidade

-   Cadastro de integrantes e capacidade semanal em horas.
-   Cálculo da carga alocada por semana.
-   Visualização de horas disponíveis, horas planejadas e percentual de
    utilização.
-   Identificação de semanas com utilização superior a 100% da
    capacidade configurada.
-   Atualização da capacidade após mudanças relevantes nas tarefas.

### Evoluções previstas

-   Painel de indicadores do projeto.
-   Análise de gargalos por disciplina.
-   Curva S planejada versus realizada.
-   Indicadores de desempenho, como SPI, após definição da metodologia
    de cálculo.
-   Exportações e possíveis integrações com ferramentas externas.

## Arquitetura e tecnologias propostas

A seleção final das tecnologias deve considerar os requisitos, os
custos, a manutenção e o licenciamento das bibliotecas escolhidas.

  -----------------------------------------------------------------------
  Camada                  Tecnologia proposta     Uso previsto
  ----------------------- ----------------------- -----------------------
  Frontend                Next.js e React         Interface web

  UI                      Tailwind CSS e          Estilização e
                          shadcn/ui               componentes

  Cronograma              DHTMLX Gantt ou Frappe  Visualização e edição
                          Gantt                   do Gantt

  Estado da interface     Zustand                 Estado compartilhado no
                                                  frontend

  Gráficos                Apache ECharts ou       Indicadores e
                          Chart.js                visualizações

  Backend                 Python e FastAPI        API e regras de negócio

  Validação               Pydantic                Validação de dados

  Persistência            SQLAlchemy e PostgreSQL Modelagem e
                                                  armazenamento

  Ambiente                Docker                  Reprodutibilidade do
                                                  ambiente

  CI/CD                   GitHub Actions ou       Testes e automação de
                          equivalente             entrega
  -----------------------------------------------------------------------

**Observação:** as tecnologias listadas são candidatas arquiteturais,
não necessariamente dependências já configuradas no repositório. A
biblioteca de Gantt deverá ser selecionada após avaliação de
funcionalidades e licenciamento.

## Visão geral do funcionamento

1.  O usuário cria um projeto e organiza suas disciplinas.
2.  As tarefas são cadastradas com datas, esforço estimado, progresso e
    responsável, conforme as regras definidas.
3.  O cronograma é exibido no Gantt.
4.  Ao alterar uma tarefa, a aplicação envia a atualização para a API.
5.  O backend valida os dados e as dependências e persiste a alteração
    no banco.
6.  O planejamento de capacidade é recalculado para os períodos
    afetados.
7.  A interface apresenta a carga semanal e destaca possíveis
    sobrecargas.

As regras de negócio devem ser validadas no backend. A interface não
deve ser a única responsável pela integridade dos dados.

## Documentação

A documentação de planejamento está organizada na pasta
[`docs/`](docs/).

  ------------------------------------------------------------------------------------
  Documento                                        Descrição
  ------------------------------------------------ -----------------------------------
  [Visão do produto](docs/01-visao-do-produto.md)  Objetivos, público e escopo

  [Requisitos](docs/02-requisitos.md)              Requisitos funcionais e não
                                                   funcionais

  [Backlog e                                       Escopo do MVP e evoluções
  prioridades](docs/03-backlog-e-prioridades.md)   

  [Regras de negócio e                             Regras, fórmulas e critérios de
  aceite](docs/04-regras-de-negocio-e-aceite.md)   aceitação

  [Fluxos de                                       Jornadas e operações principais
  usuário](docs/05-fluxos-de-usuario.md)           

  [Arquitetura                                     Componentes e tecnologias propostas
  técnica](docs/06-arquitetura-tecnica.md)         

  [Modelo de dados](docs/07-modelo-de-dados.md)    Entidades e relacionamentos

  [Contrato da API](docs/08-contrato-da-api.md)    Endpoints e formatos de resposta
                                                   propostos

  [Plano de                                        Fases e tarefas de desenvolvimento
  execução](docs/09-plano-de-execucao.md)          

  [Plano de testes](docs/10-plano-de-testes.md)    Testes e critérios de aceite

  [Deploy e                                        Implantação, segurança e operação
  operação](docs/11-deploy-e-operacao.md)          

  [Decisões                                        Hipóteses que precisam de
  pendentes](docs/12-decisoes-pendentes.md)        confirmação
  ------------------------------------------------------------------------------------

Consulte também o [índice da documentação](docs/README.md).

## Escopo inicial (MVP)

O MVP prioriza o fluxo essencial de planejamento:

-   Autenticação e controle de acesso.
-   Cadastro de projetos, disciplinas, tarefas e integrantes.
-   Gantt interativo com alterações persistidas.
-   Dependências entre tarefas.
-   Capacidade semanal e sinalização de sobrecarga.
-   Testes das regras críticas e preparação para implantação.

Funcionalidades de análise avançada e integrações externas ficam
previstas para etapas posteriores, salvo revisão explícita do escopo.

## Status do desenvolvimento

-   [x] Estrutura inicial de documentação do produto
-   [ ] Confirmação das decisões pendentes
-   [ ] Definição final da arquitetura e das bibliotecas
-   [ ] Configuração do repositório e do ambiente de desenvolvimento
-   [ ] Implementação do backend e do modelo de dados
-   [ ] Implementação da interface e integração com o Gantt
-   [ ] Implementação do planejamento de capacidade
-   [ ] Testes de aceitação e implantação do MVP

Atualize esta lista conforme o desenvolvimento avançar.

## Como executar

As instruções de instalação e execução serão adicionadas quando a
estrutura de frontend, backend, dependências e configurações de ambiente
estiver definida. Até lá, consulte a documentação em [`docs/`](docs/)
para entender o escopo e as decisões técnicas propostas.

Não adicione credenciais reais ao repositório. Quando a configuração do
ambiente estiver implementada, disponibilize um arquivo `.env.example`
com nomes de variáveis e valores ilustrativos, sem segredos.

## Contribuição e decisões

Antes de implementar uma funcionalidade que altere o modelo de dados, as
permissões ou o cálculo de capacidade:

1.  Consulte os requisitos e as regras de negócio.
2.  Verifique as decisões pendentes.
3.  Registre impactos no modelo de dados, na API, na interface e nos
    testes.
4.  Atualize a documentação quando uma decisão for aprovada.

## Licença

A licença do projeto ainda não foi definida. Antes de publicar ou
distribuir o software, escolha uma licença para o repositório e confirme
a compatibilidade das dependências, especialmente das bibliotecas de
terceiros utilizadas no Gantt.
