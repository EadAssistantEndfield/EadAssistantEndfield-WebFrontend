import QRCode from 'qrcode'

export function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 256,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  })
}
