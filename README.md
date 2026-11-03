# Gantt de Equipes (MVP)

React + Vite + TypeScript, sem banco de dados: tudo fica no `localStorage` do navegador.

## Como rodar
```bash
npm install
npm run dev      # abre em http://localhost:5173
```

## Onde está cada coisa (leia nesta ordem)
1. `src/types.ts` – o modelo de dados (Escola, Disciplina, Equipe, Pessoa, Atividade)
2. `src/hooks/useLocalStorage.ts` – salva/carrega os dados no navegador
3. `src/App.tsx` – estado geral, abas, exportar/importar
4. `src/components/FormAtividade.tsx` – formulário de cadastro (modal)
5. `src/components/Gantt.tsx` + `src/lib/gantt.ts` – o diagrama
6. `src/components/Resumo.tsx` – análises (carga por equipe, sobreposições)
7. `src/components/Cadastros.tsx` + `TabelaEditavel.tsx` – CRUD de escolas, disciplinas, equipes, pessoas

## Dados
`src/data/seed.json` foi gerado da planilha. Use **Exportar** de vez em quando: o localStorage
some se o cache do navegador for limpo. **Restaurar** volta aos dados da planilha.
