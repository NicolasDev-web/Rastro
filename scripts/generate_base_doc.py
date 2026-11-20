"""Documento-base do vídeo (complemento do roteiro de 15 cenas em output/pdf/rastro-roteiro-video.pdf).

Explica o problema, o projeto, as fontes, a conferência dos dados, as regras éticas, os achados (em validação)
e as pendências. Mesma identidade e mesmas fontes autohospedadas do roteiro.
Uso: python scripts/generate_base_doc.py
Dependências de QA: reportlab, fonttools[woff], pymupdf e as capturas de scripts/verify_web.py.
"""
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Image, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/rastro-documento-base.pdf'
SHOTS = ROOT / 'output/qa/validacao'
PAPER, INK, COBALT, SOL, SOL_SOFT, MUTED = [colors.HexColor(c) for c in ('#F4EFE6', '#151515', '#2E3BD6', '#F2B33D', '#F8E6BC', '#5C564E')]


def register_fonts():
    from fontTools.ttLib import TTFont as FTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    temp = ROOT / 'tmp/pdfs'
    temp.mkdir(parents=True, exist_ok=True)
    for name, file, axes in [('Title', 'c214ffb7f5362987-s.p.woff2', {'wght': 800, 'wdth': 70}),
                             ('Body', '597b6a5d799c44de-s.p.woff2', {'wght': 400, 'opsz': 20}),
                             ('Meta', 'cdec7fa3927eb560-s.p.woff2', {})]:
        font = FTFont(ROOT / 'apps/web/fonts' / file)
        if axes:
            valid = {a.axisTag for a in font['fvar'].axes}
            font = instantiateVariableFont(font, {k: v for k, v in axes.items() if k in valid})
        font.flavor = None
        font.save(temp / f'{name}.ttf')
        pdfmetrics.registerFont(TTFont(name, str(temp / f'{name}.ttf')))
    from reportlab.pdfbase.pdfmetrics import registerFontFamily
    registerFontFamily('Body', normal='Body', bold='Title', italic='Body', boldItalic='Title')  # destaque em Archivo condensada, como no site


S = {}


def styles():
    S['h1'] = ParagraphStyle('h1', fontName='Title', fontSize=34, leading=34, textColor=INK, spaceAfter=10)
    S['h2'] = ParagraphStyle('h2', fontName='Title', fontSize=21, leading=23, textColor=INK, spaceBefore=6, spaceAfter=8)
    S['eyebrow'] = ParagraphStyle('eb', fontName='Meta', fontSize=8, leading=11, textColor=COBALT, spaceAfter=4)
    S['body'] = ParagraphStyle('b', fontName='Body', fontSize=10.5, leading=15, textColor=INK, spaceAfter=7)
    S['lead'] = ParagraphStyle('l', fontName='Body', fontSize=13, leading=18, textColor=MUTED, spaceAfter=10)
    S['small'] = ParagraphStyle('s', fontName='Meta', fontSize=7.5, leading=10, textColor=MUTED, spaceAfter=4)
    S['cell'] = ParagraphStyle('c', fontName='Body', fontSize=8.8, leading=11.5, textColor=INK)
    S['cellh'] = ParagraphStyle('ch', fontName='Title', fontSize=9, leading=11, textColor=PAPER)
    S['big'] = ParagraphStyle('big', fontName='Title', fontSize=22, leading=24, textColor=INK)
    S['bullet'] = ParagraphStyle('bu', parent=S['body'], leftIndent=12, bulletIndent=0, spaceAfter=4)


def P(text, style='body'):
    return Paragraph(text, S[style])


def bullets(items):
    return [Paragraph(t, S['bullet'], bulletText='•') for t in items]


def table(head, rows, widths):
    data = [[P(h, 'cellh') for h in head]] + [[P(c, 'cell') for c in r] for r in rows]
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), INK), ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFFDF8')),
        ('BOX', (0, 0), (-1, -1), 1.2, INK), ('LINEBELOW', (0, 1), (-1, -1), 0.4, colors.HexColor('#CFC7B8')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6)]))
    return t


def stat_row(items):
    cells = [[[P(v, 'big'), Spacer(1, 3), P(l, 'small')] for v, l in items]]
    t = Table(cells, colWidths=[(170 * mm) / len(items)] * len(items))
    t.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 1.2, INK), ('INNERGRID', (0, 0), (-1, -1), 0.6, INK),
                           ('BACKGROUND', (0, 0), (-1, -1), SOL_SOFT), ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8)]))
    return t


def shot(name, caption, width=170 * mm):
    p = SHOTS / f'{name}.png'
    if not p.exists():
        return P(f'[captura ausente: {name}.png — rode scripts/verify_web.py]', 'small')
    img = Image(str(p))
    ratio = img.imageHeight / img.imageWidth
    img.drawWidth, img.drawHeight = width, min(width * ratio, 95 * mm)
    img.drawWidth = img.drawHeight / ratio
    return KeepTogether([img, P(f'CAPTURA REAL / validação local / {name}.png — {caption}', 'small')])


def page(canvas, doc):
    w, h = doc.pagesize
    canvas.saveState()
    canvas.setFillColor(PAPER); canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.setFillColor(INK); canvas.rect(0, h - 40, w, 40, fill=1, stroke=0)
    canvas.setFillColor(PAPER); canvas.setFont('Title', 15); canvas.drawString(20 * mm, h - 26, 'RASTRO')
    canvas.setFillColor(SOL); canvas.setFont('Meta', 7.5); canvas.drawRightString(w - 20 * mm, h - 24, 'DOCUMENTO-BASE DO VÍDEO / USO INTERNO')
    canvas.setStrokeColor(INK); canvas.line(20 * mm, 36, w - 20 * mm, 36)
    canvas.setFillColor(INK); canvas.setFont('Meta', 7.5)
    canvas.drawString(20 * mm, 24, 'DADOS OFICIAIS EM VALIDAÇÃO — NÃO PUBLICAR NEM CITAR COMO RESULTADO APURADO')
    canvas.drawRightString(w - 20 * mm, 24, f'{doc.page:02d}')
    canvas.restoreState()


def content():
    st = []
    # Capa
    st += [Spacer(1, 18 * mm), P('PROJETO RASTRO · JORNALISMO DE DADOS · CEARÁ', 'eyebrow'),
           P('O caminho do dinheiro das emendas', 'h1'),
           P('Documento-base para o vídeo: o que é o projeto, de onde vêm os dados, como eles são conferidos, o que já dá para mostrar e o que ainda falta.', 'lead'),
           P(f'Versão de {datetime.now():%d/%m/%Y}. Use junto com o roteiro de gravação <b>output/pdf/rastro-roteiro-video.pdf</b> (15 cenas, cerca de 6min35s, com capturas reais).', 'body'),
           P('Números do snapshot CGU ed93842c, extraído em 19/11/2026. Referência da conciliação: reports/revisao-conciliacao-2026-11-19-ed93842c.md. Trocar o snapshot exige reconferir este documento.', 'small'),
           Spacer(1, 6 * mm),
           stat_row([('94.948', 'linhas no arquivo oficial de emendas (2014–2026)'), ('3,61 mi', 'documentos de despesa lidos (2020–2026)'),
                     ('184', 'municípios do Ceará'), ('53', 'testes de pipeline')]),
           Spacer(1, 6 * mm),
           P('<b>Estágio:</b> protótipo. O modo demonstração mostra só dados fictícios. Os dados oficiais aparecem apenas no computador da equipe, em <b>modo validação</b>, com aviso permanente de “não publicar”. A conferência amostral foi realizada; a comparação com documentos inclui diferenças e lacunas ainda pendentes de investigação e revisão editorial independente.', 'body'),
           P('Verificação técnica: 53 testes de pipeline, 4 de API e 7 do pacote de dados, além da checagem TypeScript. Essas verificações não substituem a revisão editorial.', 'small'),
           PageBreak()]

    # 1. Problema
    st += [P('1 / O PROBLEMA', 'eyebrow'), P('Os dados existem. Entendê-los é que é difícil.', 'h2'),
           P('Emendas parlamentares são a parte do orçamento federal cujo destino é indicado por deputados e senadores. São bilhões de reais por ano, e a CGU publica os registros no Portal da Transparência. Mesmo assim, acompanhar esse dinheiro é difícil para quem não é especialista:', 'body')]
    st += bullets([
        '<b>Etapas que se confundem.</b> Empenhar é reservar; liquidar é verificar a entrega; pagar é a saída do dinheiro. Somar etapas como se fossem dinheiro novo é um erro comum.',
        '<b>Localidades vagas.</b> Boa parte das emendas do Ceará está registrada como “vários municípios” ou “aplicação estadual”, sem dizer qual cidade recebeu.',
        '<b>Pagamentos em anos diferentes.</b> Parte do dinheiro é paga anos depois, como “restos a pagar”.',
        '<b>Arquivos grandes e técnicos.</b> Milhões de documentos, códigos do SIAFI e um dicionário de dados que nem sempre bate com o arquivo.'])
    st += [Spacer(1, 3 * mm), P('<b>A pergunta do projeto:</b> para onde foi o dinheiro das emendas federais destinadas ao Ceará — e até onde os documentos públicos permitem acompanhar esse caminho?', 'lead'),
           P('2 / O QUE É O RASTRO', 'eyebrow'), P('Reportagem, ferramenta e método no mesmo lugar.', 'h2')]
    st += bullets([
        '<b>Site</b> com reportagem explicativa em cinco capítulos, glossário, explorador por município, mapa com tabela acessível e fichas de emenda, de município e de parlamentar.',
        '<b>Pipeline de dados</b> em Python que baixa os arquivos oficiais, guarda cópias imutáveis, confere o formato, carrega e reconcilia os valores — tudo reproduzível com um comando.',
        '<b>Método à vista:</b> cada número tem fonte, data de extração, definição e limites ao lado; o que não dá para afirmar é dito com todas as letras.',
        '<b>Identidade “papel e tinta”:</b> ilustrações em colagem no lugar de fotos genéricas. Fotos só aparecem como retrato oficial de parlamentar, com crédito.'])
    st += [Spacer(1, 3 * mm), shot('home-1440', 'página inicial em modo validação, com o aviso de “não publicar”.'), PageBreak()]

    # 3. Fontes
    st += [P('3 / DE ONDE VÊM OS DADOS', 'eyebrow'), P('Só fontes oficiais, baixadas e guardadas.', 'h2'),
           table(['Fonte', 'O que traz', 'Como o RASTRO usa'], [
               ['CGU — Portal da Transparência, emendas (arquivo único)', '94.948 linhas de 2014 a 2026: autor, tipo, localidade, empenhado, liquidado, pago, restos a pagar.', 'Base dos valores por emenda. Recorte do Ceará: 3.526 linhas.'],
               ['CGU — documentos de despesa (por ano, 2020–2026)', '3,61 milhões de documentos SIAFI: data, fase, valor, favorecido, município de aplicação.', 'Conferir os pagamentos e localizar onde o dinheiro foi aplicado.'],
               ['IBGE — localidades', 'Os 184 municípios do Ceará com código oficial.', 'Chave territorial. Nada é localizado por texto.'],
               ['Câmara e Senado — dados abertos', 'Deputados e senadores da 56ª e 57ª legislaturas, partido atual e retrato oficial.', 'Identificar os 43 autores com emendas no Ceará ou eleitos pelo Ceará.'],
               ['Assembleia Legislativa do Ceará', '54 deputados estaduais em exercício, partido e retrato.', 'Perfis sem valores: não há base aberta das emendas estaduais.'],
           ], [42 * mm, 66 * mm, 62 * mm]),
           Spacer(1, 5 * mm),
           P('4 / COMO OS DADOS SÃO CONFERIDOS', 'eyebrow'), P('Seis travas antes de um número aparecer.', 'h2')]
    st += bullets([
        '<b>Cópia imutável.</b> Cada arquivo baixado é guardado com uma “impressão digital” (SHA-256). Qualquer número pode ser refeito do zero.',
        '<b>Contrato de formato.</b> Se a CGU mudar uma coluna, a carga para. Já no primeiro dia, o arquivo real divergia do dicionário oficial em duas colunas e três arquivos.',
        '<b>Conservação.</b> Os totais são calculados por dois caminhos independentes, direto do arquivo e pelo banco, e precisam bater ao centavo.',
        '<b>Conferência humana.</b> 10 emendas sorteadas, 60 valores comparados um a um com o Portal: 60 conferem. Planilha assinada pelo revisor.',
        '<b>Conciliação com documentos.</b> No recorte do Ceará, 1.645 de 1.711 emendas comparáveis (96,1%) têm pagamentos que batem exatamente com os documentos. As diferenças ficam listadas para investigação.',
        '<b>Revisão de vínculos.</b> A CGU e a Câmara não usam o mesmo código de parlamentar. Os 43 vínculos foram feitos por nome e confirmados por revisor humano.'])
    st += [PageBreak()]

    # 5. Regras
    st += [P('5 / REGRAS QUE NÃO SE QUEBRAM', 'eyebrow'), P('A Constituição do projeto.', 'h2'),
           P('Antes de qualquer código, o RASTRO definiu regras editoriais e técnicas. Elas explicam várias escolhas visíveis no site:', 'body')]
    st += bullets([
        '<b>Etapas não se somam.</b> Empenhado, liquidado e pago aparecem lado a lado, nunca como total. “Pago total” soma os campos Pago e RAP pagos da fonte para comparação com documentos. A igualdade numérica não comprova universalmente a divisão temporal desses campos.',
        '<b>Ausência não é zero.</b> Sem registro aparece como “sem registro”.',
        '<b>Estado não é capital.</b> Valores de “aplicação estadual” ou “vários municípios” nunca são atribuídos a Fortaleza ou a outra cidade por conveniência.',
        '<b>Localidade não prova entrega.</b> Onde o dinheiro foi registrado ou aplicado não comprova que a obra ou o serviço chegou.',
        '<b>Sem ranking de pessoas.</b> Parlamentares em ordem alfabética; nenhum juízo de conduta. Emendas de bancada, comissão e relator não são repartidas entre pessoas.',
        '<b>Divergência não é irregularidade.</b> Diferença entre fontes vira pergunta de apuração, não acusação.',
        '<b>Privacidade (LGPD).</b> Pessoas físicas e empresários individuais que receberam pagamentos aparecem como “omitido”.',
        '<b>Dois modos.</b> Demonstração usa dados fictícios; os dados oficiais só aparecem localmente, em validação, até a revisão editorial.'])
    st += [Spacer(1, 4 * mm), shot('criterio-aplicacao', 'explorador com o critério “onde o pagamento foi aplicado”.'), PageBreak()]

    # 6. Achados
    st += [P('6 / O QUE OS DADOS JÁ MOSTRAM (EM VALIDAÇÃO)', 'eyebrow'), P('Achados para o vídeo — com as ressalvas.', 'h2'),
           stat_row([('12,2%', 'do pago total das emendas do recorte CE (2020–2026) tem município registrado na emenda'),
                     ('R$ 863 mi', 'de R$ 7,05 bi pagos, localizados pela própria emenda'),
                     ('96,1%', 'das emendas comparáveis conciliam com os documentos')]),
           Spacer(1, 5 * mm)]
    st += bullets([
        '<b>A maior parte do dinheiro não diz onde foi parar.</b> Pela localidade registrada na emenda, só de 5% a 18% do valor pago por ano tem município. O restante está como “vários municípios” ou “aplicação estadual”.',
        '<b>Os documentos de pagamento localizam muito mais.</b> Pelo município de aplicação dos documentos, R$ 8,09 bi em pagamentos de emendas de 2020–2026 aparecem nos 184 municípios do Ceará. Atenção: é outro universo (inclui emendas de outros autores e de outras localidades com pagamento aplicado no Ceará). Não comparar diretamente com os R$ 7,05 bi nem somar os dois critérios.',
        '<b>Exemplo — Fortaleza, emendas de 2025:</b> R$ 37,7 mi pela localidade da emenda; R$ 155,3 mi pelo local de aplicação dos pagamentos (28 emendas, 86 documentos).',
        '<b>Emendas “Nacional”:</b> só nas emendas de 2020, R$ 3,2 bi pagos em todo o país não têm estado identificado no arquivo de emendas.',
        '<b>Restos a pagar contam.</b> Parte relevante dos pagamentos acontece em anos seguintes; ignorar os restos a pagar subestima o que foi pago.',
        '<b>Deputados estaduais:</b> no Ceará as emendas estaduais não são impositivas (indicações de até 1/46 do valor reservado, cerca de R$ 76 mi por ano) e não há base aberta com autor, valor e execução. O quadro das aprovadas sai só em PDF, no Diário Oficial.'])
    st += [Spacer(1, 3 * mm), P('Como dizer no vídeo: “os registros indicam”, “segundo os documentos da CGU”, “em validação”. Evitar: “desviado”, “sumiu”, “o deputado X gastou” (quem paga é o Executivo; o parlamentar indica).', 'small'),
           Spacer(1, 3 * mm), shot('municipio-1440', 'ficha de Fortaleza com os dois critérios em colunas separadas.'), PageBreak()]

    # 7. Pendências
    st += [P('7 / O QUE AINDA FALTA', 'eyebrow'), P('Lacunas conhecidas e próximos passos.', 'h2'),
           table(['Pendência', 'Por que importa', 'Próximo passo'], [
               ['Revisão editorial independente e direito de resposta', 'Nenhum número pode ser publicado sem isso (Gate D).', 'Revisor externo; contato prévio com citados.'],
               ['73 emendas com pagamento divergente e 93 sem pagamento documental', 'São as exceções da conciliação; 11 das 93 têm valor pago positivo.', 'Revisão documental caso a caso; causas ainda não confirmadas.'],
               ['Emendas estaduais (Alece)', 'Sem base aberta estruturada.', 'Extrair o quadro da LOA (PDF do Diário Oficial) e pedir a execução pela Lei de Acesso à Informação.'],
               ['“Emendas Pix” (Transferegov)', 'Mostram plano de ação, objeto e executor das transferências especiais.', 'Integrar a API pública já verificada.'],
               ['Mapa geográfico, valor por habitante e partido da época', 'Hoje o mapa é ilustrativo e o partido é o atual.', 'Malha e população do IBGE; histórico de partido da Câmara.'],
               ['Evolução futura: API, PostgreSQL e atualização agendada', 'A base atual usa SQLite local e pacotes validados. A infraestrutura futura depende da operação.', 'Definir publicação por snapshot aprovado e atualização controlada; avaliar API e PostgreSQL conforme a necessidade.'],
               ['Testes de acessibilidade, tablet e de ponta a ponta', 'Leitor de tela, 768px e fluxo completo ainda não testados.', 'Auditoria automatizada e teste manual.'],
               ['Canal de contato e correções', 'Páginas existem, canal editorial ainda não configurado.', 'Definir e-mail e responsável.'],
           ], [52 * mm, 60 * mm, 58 * mm]),
           Spacer(1, 6 * mm),
           P('8 / ANTES DE GRAVAR', 'eyebrow'), P('Checklist rápido.', 'h2')]
    st += bullets([
        'Use o snapshot revisado e confira a identificação do pacote ativo. Uma nova extração exige repetir a validação e atualizar os números e as capturas deste documento. O comando <font name="Meta">python pipelines/run.py all</font> faz uma nova aquisição; não é necessário para gravar o snapshot atual.',
        'Suba o site em modo validação: em <font name="Meta">apps/web</font>, <font name="Meta">$env:DATA_MODE="validacao"; npm run dev</font>.',
        'Mantenha o aviso “DADOS OFICIAIS EM VALIDAÇÃO — NÃO PUBLICAR” visível em toda captura.',
        'Siga o roteiro de 15 cenas (output/pdf/rastro-roteiro-video.pdf); cada cena traz fala, ação de tela e cuidado editorial.',
        'Não mostre exemplos de divergência sem revisão editorial específica; não apresente o vídeo como lançamento público.',
        'Código no GitHub: repositório NicolasDev-web/Rastro. Dados brutos, banco local, exports e fotos ficam fora do repositório.'])
    return st


def main():
    register_fonts()
    styles()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(OUT), pagesize=(595.28, 841.89), leftMargin=20 * mm, rightMargin=20 * mm, topMargin=24 * mm, bottomMargin=20 * mm,
                            title='RASTRO — documento-base do vídeo', author='Projeto RASTRO — material interno de validação')
    doc.build(content(), onFirstPage=page, onLaterPages=page)
    import fitz
    d = fitz.open(OUT)
    renders = ROOT / 'tmp/pdfs/base'
    renders.mkdir(parents=True, exist_ok=True)
    for i, pg in enumerate(d):
        pg.get_pixmap(matrix=fitz.Matrix(1, 1)).save(renders / f'base-{i + 1:02d}.png')
    print(f'PDF: {OUT.relative_to(ROOT)} · {len(d)} páginas · renders em tmp/pdfs/base/')


if __name__ == '__main__':
    main()
