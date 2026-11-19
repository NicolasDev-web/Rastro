"""Gera boards PNG de referência visual (não são screenshots do navegador).

Requer Pillow. Fontes locais são usadas apenas para rasterizar os mockups,
sem redistribuí-las.
"""
from PIL import Image, ImageDraw, ImageFont, ImageOps
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'preview'
IMG=ROOT/'apps/web/public/images'
PAPER='#F7F5F0';INK='#152B32';PETROL='#337B73';COPPER='#C47C4A';STONE='#D8D9D2';MUTED='#61716F'
SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
SERIF='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
SERIF_B='/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'

def f(size,serif=False,bold=False):
    try:return ImageFont.truetype(SERIF_B if bold else (SERIF if serif else SANS),size)
    except:return ImageFont.load_default()

def rect(draw,xy,color,r=0):
    if r:draw.rounded_rectangle(xy,radius=r,fill=color)
    else:draw.rectangle(xy,fill=color)

def para(draw,text,x,y,max_w,font,fill,leading=1.47):
    words=text.split();line='';ly=y
    for w in words:
        trial=(line+' '+w).strip()
        if draw.textbbox((0,0),trial,font=font)[2]>max_w and line:
            draw.text((x,ly),line,font=font,fill=fill);ly+=int(font.size*leading);line=w
        else:line=trial
    if line:draw.text((x,ly),line,font=font,fill=fill);ly+=int(font.size*leading)
    return ly

def paste_cover(canvas,path,box):
    src=Image.open(path).convert('RGB'); w=box[2]-box[0];h=box[3]-box[1]
    src=ImageOps.fit(src,(w,h),method=Image.Resampling.LANCZOS,centering=(.5,.45))
    canvas.paste(src,(box[0],box[1]))

# desktop reference
im=Image.new('RGB',(1440,1550),PAPER);d=ImageDraw.Draw(im)
rect(d,(0,0,1440,34),'#F8E7CE');d.text((365,9),'PROTÓTIPO VISUAL  •  DADOS FICTÍCIOS  •  IMAGENS GERADAS POR IA',font=f(11),fill='#754C28')
rect(d,(0,34,1440,108),PAPER);d.text((92,52),'RASTRO.',font=f(29,True,True),fill=INK)
d.text((680,67),'INVESTIGAÇÃO     MAPA     AUTORES     FLUXOS     REPORTAGENS     DADOS',font=f(12),fill=INK)
rect(d,(0,108,1440,735),INK);d.text((92,196),'INVESTIGAÇÃO  /  CEARÁ  /  PROJETO EDITORIAL',font=f(13),fill='#B5D7CE')
d.text((92,266),'O caminho',font=f(70,True,True),fill='#FAFAF6')
d.text((92,360),'do dinheiro.',font=f(69,True,True),fill='#AACCC3')
para(d,'Quem decide para onde vão as emendas parlamentares, quem recebe os recursos e o que os documentos permitem descobrir?',96,490,520,f(20), '#DEE8E4')
rect(d,(96,615,360,677),PETROL,5);d.text((125,634),'COMEÇAR A LEITURA   →',font=f(15),fill='white')
paste_cover(im,IMG/'fortaleza-conceito.jpg',(755,175,1344,652))
d.text((757,667),'Imagem conceitual gerada por IA — não documental',font=f(11),fill='#A5C0B8')
d.text((95,810),'A PROPOSTA',font=f(14),fill=PETROL)
d.text((360,788),'Transparência não é apenas',font=f(44,True),fill=INK)
d.text((360,850),'publicar números.',font=f(44,True),fill=INK)
d.text((360,912),'É permitir compreendê-los.',font=f(42,True),fill=PETROL)
para(d,'O RASTRO combina reportagens, dados públicos e ferramentas de exploração para que o leitor acompanhe o caminho do dinheiro.',360,1000,850,f(17),MUTED)
rect(d,(0,1114,1440,1550),'#E8EBE5')
d.text((90,1175),'QUATRO ETAPAS PARA EXPLORAR',font=f(13),fill=PETROL)
d.text((90,1220),'Da curiosidade à evidência.',font=f(42,True),fill=INK)
for i,(num,name,text) in enumerate([('01','Entender','Como as emendas funcionam'),('02','Explorar','Pesquise por município'),('03','Verificar','Confira a trilha de documentos'),('04','Acompanhar','Leia novas investigações')]):
    x=90+i*315
    rect(d,(x,1320,x+294,1507),'#F8F8F3',7)
    d.text((x+22,1342),num,font=f(13),fill=PETROL)
    d.text((x+22,1385),name,font=f(28,True),fill=INK)
    para(d,text,x+22,1435,245,f(13),MUTED)
im.save(OUT/'referencia-visual-desktop.png',optimize=True)

# mobile reference (sequential look at first screen)
im=Image.new('RGB',(420,1510),PAPER);d=ImageDraw.Draw(im)
rect(d,(0,0,420,70),'#F8E7CE');para(d,'DEMO: DADOS FICTÍCIOS • IMAGENS CONCEITUAIS',15,15,390,f(12), '#744C28')
rect(d,(0,70,420,148),PAPER);d.text((22,90),'RASTRO.',font=f(27,True,True),fill=INK);d.text((345,102),'MENU',font=f(12),fill=INK)
rect(d,(0,148,420,1067),INK);d.text((22,198),'INVESTIGAÇÃO / CEARÁ',font=f(11),fill='#B5D7CE')
d.text((22,255),'O caminho',font=f(42,True,True),fill='white');d.text((22,320),'do dinheiro.',font=f(39,True,True),fill='#B1D0C7')
para(d,'Quem decide para onde vão as emendas parlamentares e o que podemos rastrear?',24,407,368,f(17),'#DAE7E1')
rect(d,(22,565,397,617),PETROL,5);d.text((83,582),'COMEÇAR A LEITURA  →',font=f(13),fill='white')
paste_cover(im,IMG/'fortaleza-conceito.jpg',(22,658,398,960))
d.text((22,974),'Arte IA ilustrativa — não documental',font=f(10),fill='#AAC5BC')
d.text((22,1105),'A PROPOSTA',font=f(11),fill=PETROL)
d.text((22,1153),'Transparência é',font=f(33,True),fill=INK)
d.text((22,1205),'permitir entender.',font=f(32,True),fill=PETROL)
para(d,'Jornalismo, dados e evidências para acompanhar a destinação de recursos públicos.',24,1280,363,f(17),MUTED)
im.save(OUT/'referencia-visual-mobile.png',optimize=True)
print('Visual reference boards generated')
