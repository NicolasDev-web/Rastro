# Início rápido no Windows / VS Code

1. Extraia o ZIP completo sem mover somente uma subpasta.
2. No Explorer, abra `RASTRO/preview/index.html` com Chrome ou Edge para visualizar o conceito sem dependências. Se alguma política bloquear `file://`, execute servidor local com Python (abaixo).
3. Abra a pasta **RASTRO** no VS Code.
4. No terminal PowerShell:

```powershell
cd apps/web
npm install
npm run dev
```

5. Abra `http://localhost:3000` e navegue por Investigação, Mapa, Autores, Fluxos, Reportagens, Dados e Componentes.
6. Para usar o exemplo de API em um terminal separado:

```powershell
cd services/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

7. Testes Python na pasta raiz:

```powershell
python pipelines/validate/check_fixture.py
python -m unittest discover -s pipelines/tests -v
python -m unittest discover -s services/api/tests -v
```

## Servidor para prévia offline (se necessário)

```powershell
cd RASTRO
python -m http.server 8765
```

Abra `http://localhost:8765/preview/index.html`.

**Requisitos:** Node.js 20+, Python 3.11+ e acesso à internet para instalar dependências com npm/pip. O código da web foi verificado sintaticamente, mas não teve build real de Next.js neste ambiente.
