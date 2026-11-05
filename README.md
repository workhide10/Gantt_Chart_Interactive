# Gantt de Equipes (MVP)

React + Vite + TypeScript, sem banco de dados: tudo fica no `localStorage` do navegador.

## Como rodar
```bash
npm install
npm run dev      # abre em http://localhost:5173
```

## Onde está cada coisa (leia nesta ordem)
1. `src/types.ts` – o modelo de dados (Projeto, Disciplina, Equipe, Pessoa, composição temporal, Atividade, MarcoProjeto)
2. `src/hooks/useLocalStorage.ts` – salva/carrega os dados no navegador
3. `src/App.tsx` – estado geral, abas, exportar/importar
4. `src/components/FormAtividade.tsx` – cadastro independente de atividade concluída (modal)
5. `src/components/Gantt.tsx` + `src/lib/gantt.ts` – o diagrama
6. `src/components/Resumo.tsx` – análises (carga por equipe, sobreposições)
7. `src/components/Cadastros.tsx` + `TabelaEditavel.tsx` – CRUD de escolas, disciplinas, equipes, pessoas
8. `src/components/ListaMarcos.tsx` + `FormMarco.tsx` – cadastro, edição e remoção de marcos concluídos
9. `src/components/ComposicoesEquipe.tsx` – histórico global de formação por equipe e vigência

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
sem dados suficientes permanecem em **Cadastros → Pendências antigas** para consulta ou descarte.

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
