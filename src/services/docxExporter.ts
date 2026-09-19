import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle
} from 'docx';

/**
 * Converte nós inline (text, strong, br, span) para instâncias de TextRun do pacote 'docx'
 */
function parseInlineRuns(
  node: Node,
  currentProps: { bold?: boolean; italic?: boolean; font?: string; size?: number; color?: string; allCaps?: boolean } = {}
): TextRun[] {
  const runs: TextRun[] = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (text) {
      runs.push(
        new TextRun({
          text: text,
          bold: currentProps.bold,
          italics: currentProps.italic,
          font: currentProps.font || 'Arial',
          size: currentProps.size || 22, // Arial 11pt (22 half-points)
          color: currentProps.color,
          allCaps: currentProps.allCaps
        })
      );
    }
    return runs;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    if (tagName === 'br') {
      return runs;
    }

    const isBold =
      currentProps.bold ||
      tagName === 'strong' ||
      tagName === 'b' ||
      el.classList.contains('font-bold') ||
      el.classList.contains('font-black');
    const isItalic = currentProps.italic || tagName === 'em' || tagName === 'i';
    let color = currentProps.color;

    if (color !== 'FFFFFF') {
      if (
        el.classList.contains('text-rose-700') ||
        el.classList.contains('text-rose-800') ||
        el.classList.contains('text-red-700')
      ) {
        color = 'B91C1C';
      } else if (
        el.classList.contains('text-emerald-700') ||
        el.classList.contains('text-emerald-800')
      ) {
        color = '047857';
      } else if (
        el.classList.contains('text-blue-900') ||
        el.classList.contains('text-blue-700')
      ) {
        color = '1E3A8A';
      }
    }

    for (let i = 0; i < el.childNodes.length; i++) {
      runs.push(
        ...parseInlineRuns(el.childNodes[i], {
          bold: isBold,
          italic: isItalic,
          font: currentProps.font || 'Arial',
          size: currentProps.size || 22,
          color,
          allCaps: currentProps.allCaps
        })
      );
    }
  }

  return runs;
}

/**
 * Obtém alinhamento do elemento baseado em classes CSS ou elementos pais.
 * Padrão: JUSTIFIED (conforme parâmetros solicitados)
 */
function getAlignment(el: HTMLElement): (typeof AlignmentType)[keyof typeof AlignmentType] {
  if (el.classList.contains('text-center') || (el.closest && el.closest('.text-center'))) {
    return AlignmentType.CENTER;
  }
  if (el.classList.contains('text-right') || (el.closest && el.closest('.text-right'))) {
    return AlignmentType.RIGHT;
  }
  if (el.classList.contains('text-left') || (el.closest && el.closest('.text-left'))) {
    return AlignmentType.LEFT;
  }
  return AlignmentType.JUSTIFIED;
}

/**
 * Converte elementos HTML em Paragraphs e Tables nativos do docx
 */
function parseElementToDocxChildren(el: HTMLElement): (Paragraph | Table)[] {
  const results: (Paragraph | Table)[] = [];
  const tagName = el.tagName.toLowerCase();

  // TÍTULOS E TÍTULOS DE TABELAS (h1, h2, h3, h4, h5, h6): Arial 11pt, Negrito, Caixa Alta, Justificado, Antes/Depois 6pt (120 dxa), Entrelinhas 1,5 (360 dxa)
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
    const alignment = getAlignment(el);
    results.push(
      new Paragraph({
        alignment,
        spacing: { before: 120, after: 120, line: 360 }, // antes 6pt (120 dxa), depois 6pt (120 dxa), entrelinhas 1,5 (360 dxa)
        children: parseInlineRuns(el, { bold: true, size: 22, allCaps: true, font: 'Arial' }) // Arial 11pt, Negrito, Caixa Alta
      })
    );
  } else if (tagName === 'p') {
    // CORPO DO TEXTO: Arial 11pt, Automático, Justificado, Antes/Depois 6pt (120 dxa), Entrelinhas 1,5 (360 dxa)
    // Para blocos de assinatura (no-spacing): centralizado, antes/depois 0pt, entrelinhas simples (240 dxa)
    // Para rodapés/citações (footnote): Arial 8pt (16 half-pts), itálico, entrelinhas simples (240 dxa)
    const alignment = getAlignment(el);
    const isNoSpacing =
      el.classList.contains('no-spacing') ||
      (el.closest && el.closest('.no-spacing') !== null) ||
      (el.closest && el.closest('.signature-block') !== null);
    const isFootnote =
      el.classList.contains('footnote') ||
      (el.closest && el.closest('.footnote') !== null) ||
      (el.closest && el.closest('.footnote-block') !== null);

    // Identificar a primeira citação [1] para forçar quebra de página no Word
    const textContent = el.textContent?.trim() || '';
    const isFirstFootnote = isFootnote && textContent.startsWith('[1]');
    const pageBreakBefore =
      isFirstFootnote ||
      el.classList.contains('page-break-before') ||
      (el.getAttribute && el.getAttribute('style')?.includes('page-break-before'));

    const isItalic = isFootnote || el.classList.contains('italic');
    const fontSize = isFootnote ? 16 : 22; // Arial 8pt (16 half-pts) para rodapé, Arial 11pt (22 half-pts) para texto normal
    
    // Espaço antes: 36pt (720 dxa) para primeira linha da assinatura se não for no-spacing interno, 0pt para no-spacing/footnote, 6pt para normal
    const spaceBefore = isNoSpacing ? 0 : (isFootnote ? 0 : 120);
    const spaceAfter = isNoSpacing ? 0 : (isFootnote ? 120 : 120); // 0pt para no-spacing, 6pt (120 dxa) para footnote (espaço entre citações), 6pt para normal
    const lineSpacing = (isNoSpacing || isFootnote) ? 240 : 360; // 240 dxa = entrelinhas simples (1.0), 360 dxa = entrelinhas 1,5

    const childNodes = Array.from(el.childNodes);
    let currentRuns: TextRun[] = [];

    const pushParagraph = () => {
      if (currentRuns.length > 0) {
        results.push(
          new Paragraph({
            alignment,
            spacing: { before: spaceBefore, after: spaceAfter, line: lineSpacing },
            pageBreakBefore: pageBreakBefore ? true : undefined,
            children: currentRuns
          })
        );
        currentRuns = [];
      }
    };

    for (const child of childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName.toLowerCase() === 'br') {
        pushParagraph();
      } else {
        const runs = parseInlineRuns(child, { font: 'Arial', size: fontSize, italic: isItalic });
        currentRuns.push(...runs);
      }
    }
    pushParagraph();

    if (results.length === 0) {
      results.push(
        new Paragraph({
          alignment,
          spacing: { before: spaceBefore, after: spaceAfter, line: lineSpacing },
          pageBreakBefore: pageBreakBefore ? true : undefined,
          children: [new TextRun({ text: '', font: 'Arial', size: fontSize, italics: isItalic })]
        })
      );
    }
  } else if (tagName === 'li') {
    const alignment = getAlignment(el);
    const runs = parseInlineRuns(el, { font: 'Arial', size: 22 });
    results.push(
      new Paragraph({
        alignment,
        spacing: { before: 120, after: 120, line: 360 },
        bullet: { level: 0 },
        children: runs.length > 0 ? runs : [new TextRun({ text: '', font: 'Arial', size: 22 })]
      })
    );
  } else if (tagName === 'table') {
    // TABELAS: Arial 8pt (16 half-points) conforme imagem anexa (Cabeçalho Preto + Texto Branco + Linha de Total Cinza)
    const rows: TableRow[] = [];
    const trElements = el.querySelectorAll('tr');

    trElements.forEach((tr) => {
      const cells: TableCell[] = [];
      const cellEls = tr.querySelectorAll('th, td');
      const isTrTotal = tr.classList.contains('font-bold') || tr.classList.contains('bg-slate-100') || tr.classList.contains('bg-slate-300') || tr.classList.contains('bg-emerald-50') || tr.classList.contains('bg-amber-50') || tr.classList.contains('bg-rose-50');

      cellEls.forEach((cellEl) => {
        const isHeader = cellEl.tagName.toLowerCase() === 'th';
        const colSpanAttr = cellEl.getAttribute('colspan');
        const colSpan = colSpanAttr ? parseInt(colSpanAttr, 10) : 1;
        const isCellBold = isHeader || cellEl.classList.contains('font-bold') || cellEl.classList.contains('font-black') || isTrTotal;

        let fill: string | undefined = undefined;
        let textColor: string | undefined = undefined;

        if (isHeader) {
          fill = '000000'; // Fundo preto conforme a imagem anexa
          textColor = 'FFFFFF'; // Texto branco em caixa alta
        } else if (isTrTotal || cellEl.classList.contains('bg-slate-300') || cellEl.classList.contains('bg-slate-200')) {
          fill = 'D1D5DB'; // Fundo cinza conforme a linha TOTAL CONSOLIDADO da imagem
          textColor = '000000';
        }

        // Cabeçalho das colunas: Caixa alta, centralizado, negrito, Arial 8pt
        // Texto das células: Justificado (ou alinhamento explícito), Arial 8pt
        const cellAlignment = isHeader ? AlignmentType.CENTER : getAlignment(cellEl as HTMLElement);
        const runs = parseInlineRuns(cellEl, {
          bold: isCellBold,
          size: 16, // Arial 8pt (16 half-points)
          allCaps: isHeader, // Cabeçalho das colunas com caixa alta
          font: 'Arial',
          color: textColor || (isHeader ? 'FFFFFF' : undefined)
        });

        cells.push(
          new TableCell({
            children: [
              new Paragraph({
                alignment: cellAlignment,
                spacing: { before: 0, after: 0, line: 240 }, // antes 0pt, depois 0pt, entrelinhas simples (240 dxa)
                children: runs.length > 0 ? runs : [new TextRun({ text: '', font: 'Arial', size: 16, color: textColor })]
              })
            ],
            shading: fill ? { fill } : undefined,
            columnSpan: colSpan > 1 ? colSpan : undefined,
            margins: { top: 60, bottom: 60, left: 100, right: 100 }
          })
        );
      });

      if (cells.length > 0) {
        rows.push(new TableRow({ children: cells }));
      }
    });

    if (rows.length > 0) {
      results.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' }
          },
          rows
        })
      );
    }
  } else if (tagName === 'div' || tagName === 'section' || tagName === 'article') {
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        results.push(...parseElementToDocxChildren(child as HTMLElement));
      } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
        const runs = parseInlineRuns(child, { font: 'Arial', size: 22 });
        if (runs.length > 0) {
          const alignment = getAlignment(el);
          results.push(
            new Paragraph({
              alignment,
              spacing: { before: 120, after: 120, line: 360 },
              children: runs
            })
          );
        }
      }
    }
  }

  return results;
}

/**
 * Exporta conteúdo HTML para um arquivo nativo do Microsoft Word (.docx) com formatação ABNT/Pericial exata.
 */
export function exportDocumentToDocx(filename: string, title: string, htmlContent: string) {
  try {
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');
    const container = htmlDoc.body.firstChild as HTMLElement;

    const children: (Paragraph | Table)[] = [];

    if (container) {
      for (let i = 0; i < container.childNodes.length; i++) {
        const child = container.childNodes[i];
        if (child.nodeType === Node.ELEMENT_NODE) {
          children.push(...parseElementToDocxChildren(child as HTMLElement));
        } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
          const runs = parseInlineRuns(child, { font: 'Arial', size: 22 });
          if (runs.length > 0) {
            children.push(
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 120, after: 120, line: 360 },
                children: runs
              })
            );
          }
        }
      }
    }

    if (children.length === 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 120, after: 120, line: 360 },
          children: [new TextRun({ text: title, bold: true, size: 22, allCaps: true, font: 'Arial' })]
        })
      );
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Arial',
              size: 22 // Arial 11pt por padrão
            },
            paragraph: {
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 120, after: 120, line: 360 } // antes/depois 6pt, entrelinhas 1,5
            }
          }
        }
      },
      sections: [
        {
          properties: {
            page: {
              size: {
                width: 11906, // A4
                height: 16838
              },
              margin: {
                top: 1440,
                bottom: 1440,
                left: 1440,
                right: 1440
              }
            }
          },
          children
        }
      ]
    });

    Packer.toBlob(doc).then((blob) => {
      const cleanFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  } catch (err) {
    console.error('Erro ao gerar o arquivo docx nativo:', err);
    alert('Erro ao gerar o arquivo Word (.docx). Por favor tente novamente.');
  }
}
