# 6. Arquitetura técnica proposta

## 6.1 Visão geral

A aplicação será um SaaS web composto por frontend, API backend e banco
de dados relacional. A arquitetura deve manter as regras críticas no
backend, deixando a interface responsável pela interação, visualização e
feedback.

## 6.2 Tecnologias candidatas

  -----------------------------------------------------------------------
  Camada                  Tecnologia candidata    Responsabilidade
  ----------------------- ----------------------- -----------------------
  Frontend                Next.js e React         Páginas, componentes e
                                                  navegação

  Interface               Tailwind CSS e          Estilo e componentes
                          shadcn/ui               reutilizáveis

  Gantt                   DHTMLX Gantt ou Frappe  Visualização e
                          Gantt                   interação com
                                                  cronograma

  Estado                  Zustand                 Estado local
                                                  compartilhado e
                                                  sincronização da
                                                  interface

  Gráficos                Apache ECharts ou       Indicadores e gráficos
                          Chart.js                

  Backend                 Python com FastAPI      API, autorização e
                                                  regras de negócio

  Validação               Pydantic                Validação de entrada e
                                                  saída

  ORM                     SQLAlchemy              Persistência e
                                                  consultas

  Banco                   PostgreSQL              Persistência relacional

  Ambiente                Docker                  Reprodutibilidade de
                                                  serviços

  CI/CD                   GitHub Actions ou       Testes e implantação
                          equivalente             automatizada

  Hospedagem              Railway, Render ou AWS  Hospedagem conforme
                                                  requisitos e orçamento
  -----------------------------------------------------------------------

As opções são alternativas, não decisões finais. Verifique licença,
custos, compatibilidade, limites da edição escolhida e necessidades de
acessibilidade antes de selecionar a biblioteca Gantt.

## 6.3 Responsabilidades do frontend

-   Exibir projetos, disciplinas, tarefas e integrantes.
-   Renderizar e controlar a interação com o Gantt.
-   Validar campos para melhorar a experiência, sem substituir a
    validação do servidor.
-   Exibir a visão de capacidade e os estados de sobrecarga.
-   Gerenciar estado de carregamento, erro, sucesso e sessão.
-   Enviar alterações para a API e reconciliar as respostas.

## 6.4 Responsabilidades do backend

-   Autenticar usuários e autorizar operações.
-   Validar dados e relações.
-   Aplicar regras de negócio e dependências.
-   Calcular ou coordenar o cálculo de capacidade.
-   Executar transações para alterações relacionadas.
-   Persistir dados e devolver respostas consistentes.
-   Registrar logs sem expor credenciais ou dados sensíveis
    desnecessários.

## 6.5 Fluxo de alteração de tarefa

1.  O usuário altera a tarefa no Gantt.
2.  O frontend atualiza a interface de forma otimista, se adotado.
3.  O frontend envia uma requisição de atualização.
4.  A API valida autenticação, autorização, formato, datas e
    dependências.
5.  O backend salva a alteração e recalcula os dados afetados quando
    necessário.
6.  A API retorna a tarefa atualizada e, se aplicável, os dados de
    capacidade afetados.
7.  O frontend reconcilia o estado.
8.  Em falha, a interface desfaz a alteração otimista ou consulta
    novamente o estado persistido.

## 6.6 Organização sugerida do repositório

A estrutura exata pode variar. Uma opção de monorepositório:

``` text
/
├── apps/
│   ├── web/                 # Next.js
│   └── api/                 # FastAPI
├── docs/                    # Documentação do produto
├── infra/                   # Docker e configurações de implantação
├── tests/                   # Testes de integração ou end-to-end compartilhados
├── .env.example
├── .gitignore
└── README.md
```

## 6.7 Princípios arquiteturais

-   Separar rotas, esquemas, serviços de domínio e persistência no
    backend.
-   Não confiar em valores calculados exclusivamente no frontend.
-   Aplicar isolamento de dados por workspace/organização, caso o modelo
    multi-tenant seja confirmado.
-   Usar migrações versionadas para alterações de banco.
-   Tratar atualização de tarefa e recálculo relacionado de maneira
    consistente.
-   Evitar dependência circular entre módulos.
-   Manter configurações específicas de ambiente fora do código.

## 6.8 Decisões técnicas que exigem validação

-   Biblioteca Gantt e licença.
-   Monorepositório versus repositórios separados.
-   Provedor de autenticação ou autenticação própria.
-   Estratégia multi-tenant.
-   Cálculo de capacidade síncrono versus pré-calculado.
-   Regras de concorrência e conflitos de edição.
-   Hospedagem, backups, observabilidade e metas de disponibilidade.
