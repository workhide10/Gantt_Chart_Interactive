# Documento de Referência (Blueprint) - SaaS de Gestão de Projetos BIM e Alocação de Equipes

## 1. Visão Geral do Projeto
A aplicação é um **SaaS (Software as a Service) Web full-stack** focado na gestão interativa de cronogramas e controle de capacidade produtiva (Capacity Planning) para equipes multidisciplinares, com forte aderência ao setor de Arquitetura, Engenharia e Construção (AEC) e projetos BIM.

**Objetivo Principal:**
Fornecer uma plataforma centralizada e autônoma (Single Source of Truth) onde gestores possam planejar projetos, arrastar prazos em um Gráfico de Gantt altamente interativo e visualizar instantaneamente o impacto dessas mudanças na carga de trabalho (horas/semana) da equipe de modeladores e engenheiros.

**Diferencial:**
Independe de importações periódicas de arquivos CSV, MS Project ou integrações diretas com APIs de autoria (como pyRevit). É uma plataforma standalone, atualizada em tempo real via interface web.

---

## 2. Sugestões de Naming (Marca)
Conceitos baseados na união de "Gantt" + "Interatividade":
*   **LiveGantt:** Enfatiza o cronograma "vivo" e em tempo real.
*   **DynamiGantt:** Foco na dinamicidade e fluidez.
*   **GanttFlow:** Remete ao fluxo contínuo de trabalho entre disciplinas.
*   **GanttX:** Apelo moderno e focado em UX (User Experience).
*   **ActiveGantt:** Enfatiza a ação e gestão proativa.

---

## 3. Arquitetura e Stack Tecnológica
A arquitetura segue o modelo Cliente-Servidor (Client-Server) acoplado via API RESTful.

### 3.1. Frontend (Interface e Interatividade)
*   **Framework:** **Next.js** (React) - Escolhido pela performance, roteamento e padrão de mercado para SaaS.
*   **Biblioteca Gantt:** **DHTMLX Gantt** (corporativo/robusto) ou **Frappe Gantt** (MVP/leve) - Para manipulação de SVG/Canvas interativo.
*   **Estilização:** **Tailwind CSS + Shadcn UI** - Para componentes UI rápidos e responsivos.
*   **Estado Global:** **Zustand** - Para atualizar visualmente gráficos de capacidade instantaneamente (Optimistic UI) ao arrastar tarefas.
*   **Gráficos/Dashboards:** **Apache ECharts** ou **Chart.js**.

### 3.2. Backend (API e Regras de Negócio)
*   **Linguagem/Framework:** **Python + FastAPI** - Alta performance, assíncrono, documentação automática (Swagger).
*   **Validação de Dados:** **Pydantic** - Garantia de tipagem e integridade do payload recebido do frontend.
*   **ORM:** **SQLAlchemy** - Comunicação orientada a objetos com o banco de dados.
*   **Autenticação:** **OAuth2 com JWT** - Controle de acesso (Gestor vs. Modelador).

### 3.3. Banco de Dados e Infraestrutura
*   **Banco de Dados:** **PostgreSQL** - Relacional, ideal para estrutura hierárquica e integridade de restrições (Foreign Keys).
*   **Containerização:** **Docker** - Garantia de paridade entre ambiente de desenvolvimento e produção.
*   **Hospedagem (Cloud/PaaS):** **Railway**, **Render** ou AWS - Para deploy automatizado (CI/CD) conectado ao GitHub.

---

## 4. Funcionalidades Principais (Core Features)

### A. Gantt Dinâmico Interativo (CRUD Visual)
*   Visualização em linha do tempo (dias, semanas, meses).
*   **Drag-and-Drop:** Arrastar tarefas para alterar data de início/fim e progressão (% de conclusão).
*   Gestão de dependências (setas ligando o fim de uma disciplina ao início de outra).
*   Painel lateral (*drawer*) ao dar duplo clique em uma barra para editar responsáveis e adicionar anotações.

### B. Módulo de Capacidade e Alocação (Capacity Planning)
*   Cadastro da capacidade semanal de cada membro (ex: 40h/semana).
*   Matriz visual (Heatmap) que cruza a duração da tarefa no Gantt com o esforço em horas.
*   Alertas visuais de superalocação (ex: Célula vermelha se a alocação passar de 100%).

### C. Estrutura Hierárquica de Dados
*   **Nível 1:** Projetos (ex: Edifício Alpha).
*   **Nível 2:** Disciplinas / Pacotes de Trabalho (ex: SDAI, Hidráulica, Estrutura).
*   **Nível 3:** Tarefas (ex: Modelagem de Tubulação Nível 1).

### D. Dashboards de Business Intelligence (BI)
*   Curva S (Planejado vs. Realizado).
*   Métricas de Gargalo: Identificação de qual disciplina possui mais tarefas em atraso.
*   Indicadores de Prazo (SPI - Schedule Performance Index).

---

## 5. Fluxo de Dados e Interação (Data Flow Exemplo)
Como o sistema se comporta quando o usuário interage:

1.  **Ação (UI):** O gestor arrasta a extremidade da tarefa "Modelagem de Dutos" no Gantt para aumentar o prazo em 3 dias.
2.  **Frontend (React/Zustand):** O componente Gantt dispara o evento `on_date_change`. A interface (barra do Gantt e Heatmap do modelador) atualiza localmente para fornecer feedback visual instantâneo.
3.  **Requisição (Next.js):** O frontend faz um `PATCH /api/tarefas/{id}` enviando a nova `data_fim` em JSON.
4.  **Processamento (FastAPI + Pydantic):** A API recebe, valida as datas e checa regras de negócio (ex: se empurrou o prazo, tarefas dependentes também precisam ser recalculadas).
5.  **Persistência (PostgreSQL via SQLAlchemy):** O banco de dados atualiza o registro da tarefa.
6.  **Resposta:** O backend devolve um `200 OK` (com as tarefas dependentes recalculadas, se houver). O frontend consolida a interface.

---

## 6. Modelagem de Dados Base (Esquema Conceitual)
Tabelas essenciais para o PostgreSQL:

*   **Users/Members:** `id`, `name`, `role` (Admin/User), `weekly_capacity_hours`.
*   **Projects:** `id`, `name`, `status`, `start_date`, `end_date`.
*   **Disciplines/WBS:** `id`, `project_id`, `name` (SDAI, Telecom, etc.), `color`.
*   **Tasks:** `id`, `discipline_id`, `assigned_to`, `name`, `start_date`, `end_date`, `progress`, `estimated_hours`.
*   **Dependencies:** `id`, `source_task_id`, `target_task_id`, `type` (Finish-to-Start).

---

## 7. Próximos Passos Sugeridos para Desenvolvimento
Ao iniciar o trabalho com outra IA, sugere-se seguir a seguinte ordem (Roadmap):
1.  **Fase 1:** Geração dos modelos Pydantic e SQLAlchemy baseados no esquema relacional e criação do CRUD básico no FastAPI.
2.  **Fase 2:** Inicialização do frontend em Next.js e integração da biblioteca de Gantt com *mock data* (dados falsos estáticos).
3.  **Fase 3:** Integração da API (fetch) aos eventos de clique e arraste do Gantt.
4.  **Fase 4:** Desenvolvimento do algoritmo e interface do *Capacity Planning* (cálculo de horas alocadas por dia/semana).