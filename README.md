# Gantt de Equipes (MVP)

React + Vite + TypeScript, sem banco de dados: tudo fica no `localStorage` do navegador.

## Como rodar
```bash
npm install
npm run dev      # abre em http://localhost:5173
```

## Onde está cada coisa (leia nesta ordem)
1. `src/types.ts` – o modelo de dados (Escola, Disciplina, Equipe, Pessoa, Atividade, MarcoProjeto)
2. `src/hooks/useLocalStorage.ts` – salva/carrega os dados no navegador
3. `src/App.tsx` – estado geral, abas, exportar/importar
4. `src/components/FormAtividade.tsx` – formulário de cadastro (modal)
5. `src/components/Gantt.tsx` + `src/lib/gantt.ts` – o diagrama
6. `src/components/Resumo.tsx` – análises (carga por equipe, sobreposições)
7. `src/components/Cadastros.tsx` + `TabelaEditavel.tsx` – CRUD de escolas, disciplinas, equipes, pessoas
8. `src/components/ListaMarcos.tsx` + `FormMarco.tsx` – cadastro, edição e remoção de marcos concluídos

## Navegação e análises
O Gantt agora fica dedicado à visualização do cronograma, com escalas de **Semanas**, **Meses** e
**Trimestres** que ajustam o eixo e a largura das barras, além do atalho **Hoje** para centralizar
a data atual. Quando o período é curto, o diagrama aumenta a escala para preencher a largura visível;
quando é longo, mantém a escala escolhida e permite rolagem horizontal. Os indicadores e a carga por equipe ficam na aba **Análises**, com filtros por projeto,
disciplina, equipe e intervalo de datas. A tela foi separada para concentrar futuras visões de gestão
sem misturá-las com o cronograma. Durante a rolagem horizontal, o código de cada atividade acompanha
a borda visível do gráfico sem ultrapassar o intervalo da própria barra.

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
