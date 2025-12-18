import React, { useState } from 'react';
import { QrCode, X, Download, Copy, Check } from 'lucide-react';
import QRCodeGenerator from 'qrcode';

interface QRJoinButtonProps {
  setlistId: string;
  setlistTitle: string;
}

export function QRJoinButton({ setlistId, setlistTitle }: QRJoinButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const url = `${window.location.origin}/stage/${setlistId}`;
      const qrUrl = await QRCodeGenerator.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
      setShowModal(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Erro ao gerar QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/stage/${setlistId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `qr-code-${setlistTitle.replace(/\s+/g, '-')}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  return (
    <>
      <button
        onClick={generateQRCode}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        <QrCode className="w-5 h-5" />
        {loading ? 'Gerando...' : 'QR Code'}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                QR Code - Modo Palco
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Compartilhe este QR code com os músicos para acesso direto ao modo palco
              </p>

              <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-center">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code" className="max-w-full h-auto" />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Baixar QR Code
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-green-600" />
                    Link Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar Link
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Dica:</strong> Os músicos podem escanear este QR code com a câmera do celular
                para acessar o setlist diretamente no modo palco.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
