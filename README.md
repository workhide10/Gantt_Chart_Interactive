# Gantt de Equipes (MVP)

React + Vite + TypeScript, sem banco de dados: tudo fica no `localStorage` do navegador.

## Como rodar
```bash
npm install
npm run dev      # abre em http://localhost:5173
```

## Cadastro e edição

- **Nova atividade** aproveita o projeto e a equipe selecionados nos filtros e sugere a data local de hoje. No Gantt, clicar em um espaço livre também preenche a data e a linha escolhidas.
- **Salvar e criar outra** mantém projeto, equipe e período, limpa o título e a descrição e deixa o formulário aberto. Altere um campo para preparar o próximo registro; **Concluir** fecha o formulário após salvar.
- Na aba **Atividades**, a busca encontra projeto, equipe, etapa, descrição e participantes, ignorando acentos. É possível ordenar por data e usar **Duplicar** para revisar uma cópia antes de salvá-la com um novo identificador.
- Os formulários de atividade e marco aceitam **Enter** para salvar. **Escape**, **Cancelar** e o botão de fechar pedem confirmação quando há alterações não salvas. Os diálogos mantêm o foco do teclado dentro do formulário.
- Em **Cadastros**, os campos são salvos automaticamente e **Adicionar** posiciona o foco no novo registro. As exclusões respeitam também as referências do histórico de movimentações.
- A importação verifica campos, datas, identificadores duplicados e referências antes de substituir os dados. Backups antigos com as coleções opcionais ausentes continuam aceitos.
- Falhas de gravação são informadas na tela. Se o conteúdo salvo estiver ilegível ou incompatível, ele permanece preservado e pode ser baixado para recuperação; a gravação fica bloqueada até importar um backup válido ou restaurar os dados de referência.

## Verificação

Use Node.js 22.18 ou superior para os testes, que importam os módulos TypeScript com o suporte nativo do Node:

```bash
npm test
npm run build
```

Os testes cobrem datas no fuso local, datas inválidas, dias úteis, conflitos inclusivos, filtros combinados e mudanças de formação durante uma atividade.

## Organização do código

- [App](./src/App.tsx) coordena navegação, filtros e abertura dos formulários.
- [useDados](./src/hooks/useDados.ts) conecta armazenamento e operações, enquanto [useLocalStorage](./src/hooks/useLocalStorage.ts) cuida da persistência e recuperação.
- [Validação](./src/lib/validacao.ts), [migrações](./src/lib/migracoes.ts) e [backups](./src/lib/backups.ts) mantêm a compatibilidade dos arquivos existentes.
- [Registros](./src/lib/registros.ts) e [equipes](./src/lib/equipes.ts) concentram as regras de cadastro, exclusão, formação e movimentação em funções testáveis.
- [Análises](./src/lib/analises.ts) calcula os indicadores; [DashboardAnalises](./src/components/DashboardAnalises.tsx), [gráficos](./src/components/GraficosAnalises.tsx) e [ExecucaoProjetos](./src/components/ExecucaoProjetos.tsx) apresentam os resultados.
- [Gantt](./src/components/Gantt.tsx) apresenta o cronograma e [gantt](./src/lib/gantt.ts) calcula faixas e sobreposições.
- [Testes](./tests/) cobrem datas, filtros, indicadores, validação, migrações e operações de cadastro.

## Dashboard de análises

A aba **Análises** oferece cinco indicadores e cinco painéis: ritmo mensal, distribuição por disciplina, carga por equipe, perfil de duração e execução versus pausas dos projetos. Clique nas disciplinas, equipes e projetos dos gráficos para filtrar. Há atalhos para todo o histórico, os últimos 90 dias e o ano corrente, além do intervalo personalizado.

- A carga usa os dias úteis das atividades dentro do recorte; atividades simultâneas contam separadamente.
- A série de conclusões considera a data final original. Uma atividade que atravessa o fim do recorte não vira uma conclusão artificial no último dia do filtro.
- A duração mediana e o histograma usam a duração integral, em dias úteis, das atividades selecionadas.
- **Execução e pausas** conserva o histórico completo do projeto. Respeita o filtro de projeto, mas não encurta a linha do tempo pelos filtros de disciplina, equipe e período. Intervalos sobrepostos ou adjacentes são unidos; as pausas são os dias corridos sem atividades entre os trechos registrados.
- A base registra execução e não possui uma data de prazo planejado separada. O dashboard mostra concentração, duração e pausas observadas, sem inferir atraso contratual, capacidade, horas ou produtividade.

## Navegação e análises
O Gantt agora fica dedicado à visualização do cronograma, com escalas de **Semanas**, **Meses** e
**Trimestres** que ajustam o eixo e a largura das barras, além do atalho **Hoje** para centralizar
a data atual. Quando o período é curto, o diagrama aumenta a escala para preencher a largura visível;
quando é longo, mantém a escala escolhida e permite rolagem horizontal. Os indicadores e a carga por equipe ficam na aba **Análises**, com filtros por projeto,
disciplina, equipe e intervalo de datas. A tela foi separada para concentrar futuras visões de gestão
sem misturá-las com o cronograma. Durante a rolagem horizontal, o código de cada atividade acompanha
a borda visível do gráfico sem ultrapassar o intervalo da própria barra. Na escala semanal, uma terceira
linha identifica cada dia. Arraste as alças nas extremidades das barras para alterar diretamente as
datas de início e fim da atividade; a alteração é salva no armazenamento local do navegador.

Na aba **Análises**, **Execução e pausas** usa todas as disciplinas e calcula a união dos
intervalos de calendário das atividades de cada projeto. Cada data coberta conta uma vez, mesmo quando há
tarefas simultâneas. O quadro mostra dias de execução, janela entre a primeira e última atividade e as
pausas sem atividades. O filtro de projeto é respeitado, enquanto filtros de disciplina, equipe e período
não recortam esse indicador de execução completa.

## Formação temporal das equipes
O cadastro de atividade permanece independente: projeto, equipe, etapa, datas e descrição, sem editar a
composição da equipe. Na aba **Equipes**, a formação é global para aquela equipe, independente do projeto.
Ao registrar uma nova versão, a anterior é encerrada na véspera e a composição passa a valer na data escolhida.

O Gantt relaciona a composição à atividade pela equipe e pela sobreposição de datas. A disciplina é herdada
da equipe selecionada; assim, atividades de diferentes projetos mostram a composição da equipe quando
coincidem no período. Se a composição mudou durante a atividade, o tooltip apresenta os integrantes e as
datas de cada versão. Na visão **Por equipe**, marcadores roxos identificam cada versão posterior e, ao
passar o mouse, mostram a data, quem entrou e quem saiu. Alterações na composição não reescrevem as atividades.

Use **Troca ou saída de integrante** para movimentar pessoas em lote. Escolha a disciplina, as duas equipes
e a data do marco; selecione pessoas nas listas e use as setas para movê-las entre as equipes. Os nomes
movidos ficam destacados no destino e a seta inversa desfaz a movimentação antes de salvar. Uma única
operação cria um evento e os vínculos individuais, além de atualizar simultaneamente as composições de
origem e destino. Para férias, desligamento ou outra saída sem destino, use a seta para preparar a saída,
selecione uma ou mais pessoas e informe o motivo. O marco do Gantt mostra nome, destino ou motivo. Um
retorno pode ser registrado em novo marco. **Ajustar composição** continua disponível para correções ou
alterações da formação sem uma transferência formal.

Na migração, os vínculos antigos com equipe, pessoa e datas suficientes são consolidados no histórico
global da equipe. Como a planilha não informa mudanças de formação, conjuntos estáticos são registrados
como uma formação de referência com início na primeira alocação conhecida e vigência aberta. Registros
sem dados suficientes são mantidos apenas no arquivo de compatibilidade dos backups. O módulo de pendências foi removido da interface e esses registros arquivados não bloqueiam a exclusão de cadastros livres.

Os vínculos de referência do cronograma anexado foram importados a partir das semanas preenchidas e da
aba de integrantes por equipe, totalizando 512 relações de origem entre 49 pessoas, 29 equipes e 23
projetos, no período de 01/04/2026 a 30/10/2026. A composição de GLP-2 não constava na aba de integrantes;
permanece sem pessoas associadas até revisão do gestor. A importação é aplicada uma única vez também a
dados já existentes, sem substituir cadastros ou atividades. Os cinco nomes que constavam como equipes
individuais no Gantt, mas não tinham pessoa cadastrada, foram adicionados sem função preenchida.

## Marcos de projeto
Na aba **Marcos**, registre o projeto, a etapa, a data de conclusão e observações para análise.
O sistema exibe o intervalo em dias corridos desde o marco anterior do mesmo projeto, calcula o
intervalo médio e mostra marcadores clicáveis no Gantt quando agrupado por projeto. Datas futuras
são bloqueadas para manter o histórico focado em etapas concluídas. Projetos sem marcos continuam
com o mesmo funcionamento anterior. Dados salvos por versões antigas recebem uma lista vazia de
marcos automaticamente; a importação de backups antigos também continua aceita.

## Dados
`src/data/seed.json` foi gerado da planilha. Use **Exportar** de vez em quando: o localStorage
some se o cache do navegador for limpo. **Restaurar** volta aos dados da planilha.
