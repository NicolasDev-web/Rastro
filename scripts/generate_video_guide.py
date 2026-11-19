"""PDF interno de 15 páginas, roteiro editável e capturas reais do verify_web.py."""
import json
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape
import fitz
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf'
SHOTS = ROOT / 'output/qa/validacao'

# Ordem de gravação. Cada bloco contém fala, ação e limite editorial.
SCENES = [
 ('00:00–00:20', 'Um caminho para entender o orçamento', 'home-1440',
  'De onde vem uma emenda e até onde os registros permitem acompanhar o dinheiro? O RASTRO reúne explicações e ferramentas para consultar emendas federais destinadas ao Ceará. Este vídeo apresenta uma versão interna de validação, ainda sem publicação jornalística.',
  'Abrir a home. Manter visível o aviso de validação. Mostrar a manchete e a ilustração.',
  'Home e narrativas editoriais ainda têm conteúdo demonstrativo. Não apresentá-las como reportagem apurada.'),
 ('00:20–00:45', 'O que esta versão permite mostrar', 'sobre-1440',
  'O projeto combina uma demonstração fictícia com uma área local de dados oficiais em conferência. O objetivo é permitir consulta por cidade, emenda e autor, com as definições e lacunas ao lado dos números.',
  'Entrar em Sobre pelo rodapé. Explicar o estágio do projeto antes de qualquer número.',
  'Este roteiro é base de produção interna. A versão pública exigirá revisão de dados e texto.'),
 ('00:45–01:15', 'Comece pela sua cidade', 'criterio-emenda',
  'No explorador, procure um município pelo nome ou pelo código IBGE. Escolha o ano da emenda e a etapa financeira. O ano identifica a emenda; os documentos de pagamento podem ter datas posteriores.',
  'Buscar Fortaleza, selecionar 2025 e mostrar o critério localidade da emenda. Depois buscar Crateús sem acento e confirmar com Enter.',
  'Os filtros precisam aparecer junto ao valor. Nunca recortar um número sem ano, critério e fonte.'),
 ('01:15–01:45', 'Uma emenda, duas leituras territoriais', 'criterio-aplicacao',
  'A localidade da emenda é a registrada no arquivo principal. Onde o pagamento foi aplicado vem dos documentos de despesa. O segundo critério pode localizar pagamentos de emendas registradas para vários municípios. São leituras diferentes do mesmo dinheiro: não se somam.',
  'Alternar os dois botões, sem mudar município ou ano. Apontar a mudança de rótulo e a nota metodológica.',
  'Localidade de aplicação não comprova local de obra entregue. Não chamar a diferença de recurso novo.'),
 ('01:45–02:10', 'O mapa tem uma tabela para conferir', 'tabela-mapa-1440',
  'A tabela oferece uma alternativa textual ao mapa e mantém os critérios em colunas distintas. Registros estaduais e de vários municípios não são atribuídos automaticamente à capital. O desenho do mapa é esquemático.',
  'Rolar até a tabela e ler os cabeçalhos completos. Mostrar um link de município.',
  'Não tratar a ilustração como uma malha oficial ou uma distribuição geográfica precisa.'),
 ('02:10–02:40', 'A ficha do município', 'municipio-1440',
  'Na ficha de Fortaleza, cada ano mantém o valor pela emenda e o pagamento por aplicação separados. A página também reúne emendas, autores com ficha e favorecidos com sede no município. Esses recortes têm definições próprias.',
  'Abrir a ficha pelo explorador; percorrer os dois critérios e as listas de emendas.',
  'Sede de favorecido não equivale a destino final. Não somar a lista de favorecidos aos totais das emendas.'),
 ('02:40–03:10', 'A ficha da emenda', 'emenda-1440',
  'Cada ficha apresenta o código da emenda, o ano e a autoria formal. Empenhado, liquidado e pago são etapas diferentes. Pago total reúne a coluna Pago e os restos a pagar pagos; a ficha compara esse total com os documentos.',
  'Abrir uma emenda pelo código. Mostrar valores e selo de conciliação.',
  'Não apresentar empenho, liquidação e pagamento como parcelas de um total acumulado.'),
 ('03:10–03:40', 'Documentos contam etapas, não entregas', 'cronologia-1440',
  'A linha do tempo separa empenho, liquidação e pagamento. Cada registro preserva código e data. Quando a liquidação não traz valor na fonte, ele permanece ausente. Um pagamento comprova saída de caixa federal, mas não comprova sozinho a entrega do serviço.',
  'Rolar até a cronologia e depois até quem recebeu. Se houver convênio, mostrar número e objeto com contexto.',
  'A cronologia exibe até 60 documentos por fase e informa o excedente. Não afirmar que tudo aparece na tela.'),
 ('03:40–04:05', 'Conferência e divergência', 'emenda-1440',
  'Quando o total de pagamentos difere dos documentos disponíveis, a página registra a divergência para investigação. Diferença entre fontes não é, por si, prova de irregularidade. É preciso verificar cobertura, datas e documentos antes de interpretar.',
  'Mostrar o selo na ficha. Na edição final, só incluir exemplo divergente após revisão editorial específica.',
  'O percentual do recorte Ceará não deve ser confundido com o universo ampliado de fichas dos autores eleitos pelo Ceará.'),
 ('04:05–04:30', 'Autoria é um papel específico', 'autor-1440',
  'A ficha do autor mostra autoria formal segundo o SIAFI. Vínculos com Câmara e Senado passam por revisão registrada. Partido é o da data da consulta. Bancada, comissão e relator não têm seus valores rateados automaticamente entre pessoas.',
  'Abrir o autor pela ficha da emenda; mostrar metadados, período e links de emendas.',
  'Não fazer ranking de conduta. Indicar recurso não significa executar o pagamento ou entregar uma obra.'),
 ('04:30–04:55', 'Os termos precisam ser compreensíveis', 'glossario-1440',
  'O glossário explica pago total, documento de despesa, aplicação, favorecido e snapshot. Essas definições ajudam a compreender o que cada medida permite dizer e o que ainda exige apuração.',
  'Abrir o glossário, expandir um termo e mostrar o link de referência quando disponível.',
  'Não ocultar definições para simplificar uma comparação. Elas fazem parte do número.'),
 ('04:55–05:25', 'A fonte acompanha a consulta', 'dados-1440',
  'Na metodologia, o RASTRO explica o caminho da cópia da fonte à ficha, os critérios territoriais e as limitações. A versão oficial em validação exibe a data de extração e a identificação do snapshot. Não há atualização em tempo real.',
  'Mostrar fonte, data e snapshot. Demonstrar download do CSV e o cabeçalho de critério.',
  'CSV por aplicação já inclui RAP nos documentos; não adicionar a coluna de restos a pagar novamente.'),
 ('05:25–05:50', 'A consulta também cabe no celular', 'municipio-360',
  'No celular, as informações mantêm a mesma hierarquia e os mesmos avisos. As tabelas largas podem ser roladas no seu próprio espaço. Os links levam às fichas e os filtros continuam acessíveis.',
  'Gravar a 360 pixels de largura: abrir município, rolar uma tabela e voltar ao mapa.',
  'A captura é do navegador real em viewport móvel, não de um aparelho físico. Revisão manual com tecnologias assistivas ainda é necessária.'),
 ('05:50–06:15', 'Uma correção precisa deixar rastro', 'correcoes-1440',
  'A política prevista pede página, código, filtros e fonte para conferir uma diferença. Uma correção relevante deve explicar o que mudou, por quê e quando. O canal editorial ainda não está configurado nesta versão.',
  'Abrir Correções e Contato pelo rodapé. Mostrar que não há formulário de recebimento ativo.',
  'Não convidar o público a enviar denúncias ou documentos sigilosos antes de definir um canal apropriado.'),
 ('06:15–06:35', 'Consultar é o começo da apuração', 'sobre-1440',
  'O RASTRO propõe tornar o orçamento mais legível e verificável. Para cada número, uma fonte; para cada conexão, uma definição; para cada lacuna, uma explicação. A próxima etapa é concluir a validação e a revisão editorial antes de publicar dados oficiais.',
  'Encerrar com a marca e o estágio de desenvolvimento. Revisar legendas, links e o aviso antes de exportar o vídeo.',
  'Não anunciar lançamento ou disponibilidade pública que ainda não existem.'),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    from fontTools.ttLib import TTFont as FontToolsFont
    from fontTools.varLib.instancer import instantiateVariableFont
    temp = ROOT/'tmp/pdfs'; temp.mkdir(parents=True,exist_ok=True)
    for name, file, axes in [('Title','c214ffb7f5362987-s.p.woff2',{'wght':800,'wdth':70}), ('Body','597b6a5d799c44de-s.p.woff2',{'wght':400,'opsz':20}), ('Meta','cdec7fa3927eb560-s.p.woff2',{})]:
        font=FontToolsFont(ROOT/'apps/web/fonts'/file)
        if axes:
            valid={a.axisTag for a in font['fvar'].axes}
            font=instantiateVariableFont(font,{k:v for k,v in axes.items() if k in valid})
        font.flavor=None; font.save(temp/f'{name}.ttf')
        pdfmetrics.registerFont(TTFont(name,str(temp/f'{name}.ttf')))
    W, H = 595.28, 841.89
    paper, ink, cobalt, sol = [colors.HexColor(c) for c in ('#F4EFE6', '#151515', '#2E3BD6', '#F2B33D')]
    c = canvas.Canvas(str(OUT / 'rastro-roteiro-video.pdf'), pagesize=(W, H))
    c.setTitle('RASTRO - roteiro de vídeo e plano de captação')
    c.setAuthor('Projeto RASTRO - material interno de validação')
    styles = {
        'title': ParagraphStyle('title', fontName='Title', fontSize=27, leading=29, textColor=ink),
        'body': ParagraphStyle('body', fontName='Body', fontSize=11, leading=15, textColor=ink),
        'small': ParagraphStyle('small', fontName='Meta', fontSize=8, leading=11, textColor=ink),
    }
    def para(text, x, y, width, style):
        p = Paragraph(escape(text), styles[style]); _, h = p.wrap(width, H)
        p.drawOn(c, x, y-h)
        return y-h
    md = ['# RASTRO - roteiro-base do vídeo', '', 'Duração prevista: 6min35s. Material interno, dados oficiais em validação. Capturas reais de navegador local; sem autorização de publicação.', '']
    for n, (time, title, image, speech, action, caution) in enumerate(SCENES, 1):
        c.setFillColor(paper); c.rect(0,0,W,H,fill=1,stroke=0)
        c.setFillColor(ink); c.rect(0,H-48,W,48,fill=1,stroke=0)
        c.setFillColor(paper); c.setFont('Title',16); c.drawString(36,H-31,'RASTRO')
        c.setFillColor(sol); c.setFont('Meta',8); c.drawRightString(W-36,H-29,'ROTEIRO / USO INTERNO')
        para(f'CENA {n:02d}  /  {time}',36,H-69,W-72,'small')
        y = para(title,36,H-90,W-72,'title')-15
        if n == 1:
            y = para('ROTEIRO-BASE / 6min35s / Projeto RASTRO / '+datetime.now().strftime('%d/%m/%Y')+'\n15 cenas: contexto, consulta, fichas, método e correções.',36,y,W-72,'small')-12
        pic = SHOTS / f'{image}.png'
        if not pic.exists():
            raise FileNotFoundError(pic)
        iw, ih = ImageReader(str(pic)).getSize()
        maxw, maxh = W-72, 295
        scale = min(maxw/iw, maxh/ih)
        w,h = iw*scale,ih*scale
        c.setStrokeColor(ink); c.setLineWidth(1); c.rect(36+(maxw-w)/2,y-h,w,h)
        c.drawImage(str(pic),36+(maxw-w)/2,y-h,width=w,height=h)
        y -= h+8
        y = para(f'CAPTURA REAL / validação local / {image}.png',36,y,W-72,'small')-17
        c.setFillColor(cobalt); c.setFont('Title',10); c.drawString(36,y,'NARRAÇÃO'); y-=9
        y=para(speech,36,y,W-72,'body')-15
        c.setFillColor(cobalt); c.setFont('Title',10); c.drawString(36,y,'AÇÃO DE TELA'); y-=9
        y=para(action,36,y,W-72,'body')-12
        y=para('CUIDADO EDITORIAL: '+caution,36,y,W-72,'small')
        assert y > 53, (n,y)
        c.setStrokeColor(ink); c.line(36,41,W-36,41)
        c.setFillColor(ink); c.setFont('Meta',8)
        c.drawString(36,27,'DADOS EM VALIDAÇÃO - NÃO PUBLICAR')
        c.drawRightString(W-36,27,f'{n:02d} / 15')
        c.showPage()
        md.extend([f'## {n:02d}. {title} ({time})', '', f'Captura: `{image}.png` (output/qa/validacao).', '', f'Narração: {speech}', '', f'Ação: {action}', '', f'Cuidado editorial: {caution}', ''])
    c.save()
    (ROOT/'docs/editorial/ROTEIRO-VIDEO.md').write_text('\n'.join(md),encoding='utf-8')
    doc = fitz.open(OUT/'rastro-roteiro-video.pdf')
    assert len(doc)==15
    renders=ROOT/'tmp/pdfs'; renders.mkdir(parents=True,exist_ok=True)
    for i,page in enumerate(doc):
        assert 'NARRAÇÃO' in page.get_text()
        page.get_pixmap(matrix=fitz.Matrix(1,1)).save(renders/f'page-{i+1:02d}.png')
    # Contact sheet for visual review; rendering, not editing source screenshots.
    from PIL import Image, ImageOps, ImageDraw
    sheet=Image.new('RGB',(5*300,3*445),'#ddd')
    for i in range(15):
        img=Image.open(renders/f'page-{i+1:02d}.png'); img.thumbnail((290,420))
        sheet.paste(img,((i%5)*300,(i//5)*445))
    sheet.save(renders/'contact-sheet.png')
    print(f'PDF: {len(doc)} páginas; roteiro editável e renders gerados.')


if __name__=='__main__':
    main()
