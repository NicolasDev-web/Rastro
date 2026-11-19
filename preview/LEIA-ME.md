# Prévia visual offline

Abra `index.html` no navegador. Não precisa instalar Next.js, Python, banco de dados ou bibliotecas: CSS e fontes estão em `assets/`.

**Gerada automaticamente** a partir do build real do site (`apps/web`) — não edite os `.html` à mão. Para atualizar:

```bash
cd apps/web
npm run preview:static
```

Inclui todas as páginas (início, investigação, mapa, autores, fluxos, reportagens, dados, glossário e componentes), com valores **inteiramente fictícios**.

Limitação: a prévia não carrega JavaScript. O explorador municipal e o fluxo documental aparecem no estado inicial (Fortaleza, etapa "Pago"); filtros, busca, link compartilhável e CSV funcionam só no site (`npm run dev`). Os blocos de glossário abrem normalmente.

`referencia-visual-desktop.jpg` e `referencia-visual-mobile.png` são capturas reais desta prévia (v0.2). As ilustrações são vetores originais, sem fotografia nem imagem gerada por IA.
