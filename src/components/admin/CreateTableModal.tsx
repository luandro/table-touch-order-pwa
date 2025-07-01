import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateTable, useRestaurant } from "@/hooks/useSupabaseData";
import { qrCodeService } from "@/services/qrCodeService";
import { X, Download, Printer, Copy, QrCode } from "lucide-react";

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateTableModal = ({ isOpen, onClose }: CreateTableModalProps) => {
  const { t } = useTranslation();
  const [tableNumber, setTableNumber] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [createdTable, setCreatedTable] = useState<any>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const createTableMutation = useCreateTable();
  const { data: restaurant } = useRestaurant();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTableNumber("");
      setQrCodeUrl(null);
      setCreatedTable(null);
    }
  }, [isOpen]);

  // Generate QR code when table is created
  useEffect(() => {
    if (createdTable && !qrCodeUrl) {
      generateQRCode();
    }
  }, [createdTable]);

  const generateQRCode = async () => {
    if (!createdTable) return;

    setIsGeneratingQR(true);
    try {
      // Use table UUID instead of table number
      const tableUrl = qrCodeService.generateTableUrl(createdTable.id);
      const qrDataUrl = await qrCodeService.generateQRCode(tableUrl, 300);
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleCreateTable = async () => {
    if (!restaurant) return;

    try {
      const tableData = {
        table_number: tableNumber ? parseInt(tableNumber) : undefined,
        restaurant_id: restaurant.id,
        status: "available",
        mode: "customer_order",
      };

      const newTable = await createTableMutation.mutateAsync(tableData);
      setCreatedTable(newTable);
    } catch (error) {
      console.error("Error creating table:", error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!createdTable || !restaurant) return;

    try {
      await qrCodeService.generatePDF({
        tableId: createdTable.id, // Use UUID
        tableNumber: createdTable.table_number,
        restaurantName: restaurant.name || "Bella Vista",
        restaurantLogo: restaurant.logo_url,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleCopyUrl = async () => {
    if (!createdTable) return;

    try {
      await qrCodeService.copyTableUrl(createdTable.id); // Use UUID
    } catch (error) {
      console.error("Error copying URL:", error);
    }
  };

  const handleClose = () => {
    setTableNumber("");
    setQrCodeUrl(null);
    setCreatedTable(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Create New Table
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-6">
          {!createdTable ? (
            // Table Creation Form
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number (optional)</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Leave empty for auto-assignment"
                  min="1"
                />
                <p className="text-sm text-gray-500">
                  If left empty, the next available table number will be
                  assigned automatically.
                </p>
              </div>

              <Button
                onClick={handleCreateTable}
                disabled={createTableMutation.isPending}
                className="w-full"
              >
                {createTableMutation.isPending
                  ? "Creating Table..."
                  : "Create Table"}
              </Button>
            </div>
          ) : (
            // QR Code Preview and Actions
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-600 mb-2">
                  ✅ Table {createdTable.table_number} Created Successfully!
                </h3>
              </div>

              {/* QR Code Preview */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <h4 className="font-medium">QR Code Preview</h4>
                    {isGeneratingQR ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      </div>
                    ) : qrCodeUrl ? (
                      <div className="flex justify-center">
                        <img
                          src={qrCodeUrl}
                          alt={`QR Code for Table ${createdTable.table_number}`}
                          className="w-48 h-48 border rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                        <p className="text-gray-500">
                          Failed to generate QR code
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadPDF}
                  disabled={!qrCodeUrl}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCopyUrl}
                  disabled={!createdTable}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy URL
                </Button>
              </div>

              <Button
                onClick={handleClose}
                className="w-full"
                variant="default"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTableModal;
