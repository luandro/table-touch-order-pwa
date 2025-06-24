// QR Code PDF Generation Service
// Note: This implementation uses web-based QR generation and browser APIs
// For production, consider using a server-side PDF generation service

export interface QRCodeOptions {
  tableId: string;
  tableNumber: number;
  restaurantName?: string;
  restaurantLogo?: string;
  baseUrl?: string;
}

export const qrCodeService = {
  // Generate QR code as data URL
  async generateQRCode(url: string, size: number = 300): Promise<string> {
    try {
      // Using QR Server API for QR code generation
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=png&margin=10`;

      // Convert to data URL for embedding in PDF
      const response = await fetch(qrUrl);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  },

  // Generate table URL
  generateTableUrl(tableId: string, baseUrl?: string): string {
    const base = baseUrl || window.location.origin;
    return `${base}/?table=${tableId}`;
  },

  // Generate PDF using browser APIs
  async generatePDF(options: QRCodeOptions): Promise<void> {
    try {
      const tableUrl = this.generateTableUrl(options.tableId, options.baseUrl);
      const qrCodeDataUrl = await this.generateQRCode(tableUrl, 400);

      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Could not open print window. Please allow popups.');
      }

      // HTML template for the PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Table ${options.tableNumber} - QR Code</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              background: white;
              color: #333;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 40px;
            }

            .container {
              text-align: center;
              max-width: 600px;
              width: 100%;
              border: 3px solid #ea580c;
              border-radius: 20px;
              padding: 40px;
              background: #fef7ed;
            }

            .header {
              margin-bottom: 30px;
            }

            .logo {
              max-width: 150px;
              height: auto;
              margin-bottom: 20px;
            }

            .restaurant-name {
              font-size: 28px;
              font-weight: bold;
              color: #ea580c;
              margin-bottom: 10px;
            }

            .table-number {
              font-size: 48px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }

            .subtitle {
              font-size: 20px;
              color: #666;
              margin-bottom: 30px;
            }

            .qr-container {
              background: white;
              padding: 20px;
              border-radius: 15px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              margin-bottom: 30px;
            }

            .qr-code {
              max-width: 300px;
              width: 100%;
              height: auto;
            }

            .instructions {
              background: white;
              padding: 25px;
              border-radius: 15px;
              margin-bottom: 20px;
              text-align: left;
            }

            .instructions h3 {
              color: #ea580c;
              margin-bottom: 15px;
              font-size: 18px;
              text-align: center;
            }

            .instructions ol {
              margin-left: 20px;
              line-height: 1.8;
              font-size: 16px;
            }

            .instructions li {
              margin-bottom: 8px;
            }

            .footer {
              font-size: 14px;
              color: #666;
              margin-top: 20px;
            }

            .url {
              background: #f3f4f6;
              padding: 10px;
              border-radius: 8px;
              font-family: monospace;
              font-size: 12px;
              margin-top: 15px;
              word-break: break-all;
            }

            @media print {
              body {
                background: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .container {
                border: 3px solid #ea580c !important;
                background: #fef7ed !important;
              }

              .restaurant-name {
                color: #ea580c !important;
              }

              .instructions h3 {
                color: #ea580c !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${options.restaurantLogo ? `<img src="${options.restaurantLogo}" alt="Restaurant Logo" class="logo">` : ''}
              ${options.restaurantName ? `<div class="restaurant-name">${options.restaurantName}</div>` : ''}
              <div class="table-number">Table ${options.tableNumber}</div>
              <div class="subtitle">Scan to Order</div>
            </div>

            <div class="qr-container">
              <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code">
            </div>

            <div class="instructions">
              <h3>How to Order</h3>
              <ol>
                <li>Scan the QR code with your phone's camera</li>
                <li>Enter your name to start ordering</li>
                <li>Browse our menu and add items to your order</li>
                <li>Review your order and submit when ready</li>
                <li>We'll prepare your order and bring it to your table</li>
              </ol>
            </div>

            <div class="footer">
              <div>Need help? Ask our staff for assistance</div>
              <div class="url">Direct link: ${tableUrl}</div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Write content to new window
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for images to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  },

  // Download QR code as image
  async downloadQRImage(tableId: string, tableNumber: number): Promise<void> {
    try {
      const tableUrl = this.generateTableUrl(tableId);
      const qrCodeDataUrl = await this.generateQRCode(tableUrl, 512);

      // Create download link
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `table-${tableNumber}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR image:', error);
      throw new Error('Failed to download QR code image');
    }
  },

  // Copy table URL to clipboard
  async copyTableUrl(tableId: string, baseUrl?: string): Promise<void> {
    try {
      const tableUrl = this.generateTableUrl(tableId, baseUrl);
      await navigator.clipboard.writeText(tableUrl);
    } catch (error) {
      console.error('Error copying URL:', error);
      throw new Error('Failed to copy URL to clipboard');
    }
  }
};
