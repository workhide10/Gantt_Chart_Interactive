# 1. Visão do produto

## 1.1 Resumo

Desenvolver uma aplicação SaaS independente para planejamento de
cronogramas e capacidade de equipes em projetos de arquitetura,
engenharia, construção e BIM (AEC/BIM). A aplicação deve permitir que o
usuário organize projetos, disciplinas e tarefas em um cronograma visual
interativo e compreenda como as alterações de prazo e esforço afetam a
carga semanal da equipe.

## 1.2 Problema

O planejamento de tarefas, prazos e disponibilidade de profissionais
pode ficar distribuído entre planilhas, cronogramas e controles
individuais. Isso dificulta visualizar dependências, identificar
sobrecargas e avaliar o impacto de mudanças de prazo.

## 1.3 Objetivo principal

Disponibilizar uma fonte central de informação para cronograma e
capacidade, permitindo alterar tarefas no Gantt e visualizar os impactos
na carga de trabalho semanal.

## 1.4 Público-alvo

-   Gestores e coordenadores de projetos AEC/BIM.
-   Coordenadores de disciplinas.
-   Profissionais responsáveis pelo planejamento e acompanhamento de
    tarefas.
-   Modeladores e integrantes de equipes multidisciplinares, conforme
    permissões definidas.

## 1.5 Objetivos específicos

-   Organizar projetos, disciplinas/WBS e tarefas em uma estrutura
    consistente.
-   Visualizar tarefas em um gráfico de Gantt.
-   Editar datas e progresso de tarefas pela interface.
-   Representar dependências entre tarefas.
-   Registrar a capacidade semanal dos integrantes.
-   Calcular carga alocada e identificar sobrecarga.
-   Disponibilizar indicadores para acompanhamento do projeto em etapas
    posteriores.

## 1.6 Escopo inicial proposto

O MVP deve priorizar:

1.  Autenticação e autorização básica.
2.  Cadastro de projetos.
3.  Cadastro de disciplinas ou agrupadores WBS.
4.  Cadastro e edição de tarefas.
5.  Cronograma Gantt com alteração de datas.
6.  Dependências entre tarefas, inicialmente Finish-to-Start.
7.  Cadastro de integrantes e capacidade semanal.
8.  Cálculo de alocação semanal e sinalização de sobrecarga.
9.  Persistência dos dados em banco relacional.
10. Testes e implantação de uma versão utilizável.

## 1.7 Fora do escopo inicial

Salvo decisão explícita em contrário, ficam para fases posteriores:

-   Integrações com Autodesk Revit, Autodesk Construction Cloud ou
    outros sistemas BIM.
-   Importação/exportação avançada de cronogramas.
-   Aplicativo móvel nativo.
-   Planejamento financeiro detalhado.
-   Simulação 4D/5D.
-   Indicadores avançados como SPI e curva S completa.
-   Regras avançadas de calendário, feriados e turnos.
-   Alocação simultânea de vários responsáveis por tarefa.

## 1.8 Indicadores de sucesso

-   Um gestor consegue criar um projeto e estruturar disciplinas e
    tarefas sem intervenção técnica.
-   Alterações feitas no Gantt são persistidas e continuam corretas após
    recarregar a página.
-   A capacidade semanal é recalculada após mudanças relevantes.
-   A interface identifica cargas acima da capacidade configurada.
-   Usuários sem permissão não conseguem acessar ou modificar dados
    indevidos.

## 1.9 Princípios de produto

-   Uma fonte de verdade para os dados de cronograma.
-   Regras de negócio validadas no backend.
-   Interface responsiva e feedback claro para ações concluídas ou
    rejeitadas.
-   Rastreabilidade entre requisito, regra, implementação e teste.
-   Decisões ainda abertas devem ser documentadas, e não assumidas
    silenciosamente.
