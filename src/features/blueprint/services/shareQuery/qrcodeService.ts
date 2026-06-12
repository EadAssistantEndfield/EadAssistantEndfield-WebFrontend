import { create } from '@qrcode/core'

type QrModules = {
  size: number
  get(row: number, column: number): boolean | number
}

type QrCode = {
  modules: QrModules
}

const QR_MARGIN = 2

function encodeSvgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function generateQrDataUrl(text: string): Promise<string> {
  const qrCode = create(text, { errorCorrectionLevel: 'M' }) as QrCode
  const size = qrCode.modules.size
  const viewBoxSize = size + QR_MARGIN * 2
  const cells: string[] = []

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (qrCode.modules.get(row, column)) {
        cells.push(`<rect x="${column + QR_MARGIN}" y="${row + QR_MARGIN}" width="1" height="1"/>`)
      }
    }
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" shape-rendering="crispEdges">`,
    '<rect width="100%" height="100%" fill="#ffffff"/>',
    '<g fill="#000000">',
    ...cells,
    '</g>',
    '</svg>',
  ].join('')

  return Promise.resolve(encodeSvgDataUrl(svg))
}
