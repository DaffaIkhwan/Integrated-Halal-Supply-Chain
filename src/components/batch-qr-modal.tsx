"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Copy, Check, MessageCircle, QrCode, Printer } from "lucide-react";

interface BatchQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  earTag: string;
  rphName: string;
  productionDate?: string;
}

export function BatchQrModal({
  isOpen,
  onClose,
  batchId,
  earTag,
  rphName,
  productionDate,
}: BatchQrModalProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const traceUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/chat?trace=${batchId}`
      : `/chat?trace=${batchId}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(traceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    const svgEl = document.querySelector("#qr-svg-container svg") as SVGSVGElement;
    if (!svgEl) return;

    const padding = 32;
    const qrSize = 280;
    const totalSize = qrSize + padding * 2;
    const labelHeight = 80;
    const canvasHeight = totalSize + labelHeight;

    const canvas = document.createElement("canvas");
    canvas.width = totalSize;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d")!;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalSize, canvasHeight);

    // Serialize SVG
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      URL.revokeObjectURL(svgUrl);

      // Label below QR
      ctx.fillStyle = "#1a1a2e";
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Eartag: ${earTag}`, totalSize / 2, totalSize + 22);

      ctx.fillStyle = "#6b7280";
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText(`Batch: ${batchId.split("-")[0]}`, totalSize / 2, totalSize + 44);

      if (productionDate) {
        ctx.font = "12px system-ui, sans-serif";
        ctx.fillText(
          `Tgl: ${new Date(productionDate).toLocaleDateString("id-ID")}`,
          totalSize / 2,
          totalSize + 64
        );
      }

      // Download
      const link = document.createElement("a");
      link.download = `QR-${earTag}-${batchId.split("-")[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = svgUrl;
  };

  const handlePrint = () => {
    const svgEl = document.querySelector("#qr-svg-container svg") as SVGSVGElement;
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${earTag}</title>
          <style>
            @page { margin: 15mm; size: A5; }
            body {
              font-family: system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #fff;
              color: #1a1a2e;
            }
            .qr-wrapper {
              border: 2px solid #e5e7eb;
              border-radius: 16px;
              padding: 24px;
              text-align: center;
              page-break-inside: avoid;
            }
            .qr-img { display: block; margin: 0 auto; }
            h2 { margin: 16px 0 4px; font-size: 20px; color: #1a1a2e; }
            .badge { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 8px; padding: 4px 12px; font-size: 12px; font-weight: 700; display: inline-block; margin: 4px 0; }
            .info { font-size: 13px; color: #6b7280; margin: 4px 0; }
            .batch-id { font-family: monospace; font-size: 14px; font-weight: 700; color: #0891b2; margin: 6px 0; }
            .footer { margin-top: 12px; font-size: 10px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="qr-wrapper">
            <img class="qr-img" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}" width="220" height="220" />
            <h2>🐄 ${earTag}</h2>
            <div class="badge">Halal Certified</div>
            <div class="batch-id">Batch: ${batchId.split("-")[0]}</div>
            <div class="info">RPH: ${rphName}</div>
            ${productionDate ? `<div class="info">Tanggal: ${new Date(productionDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>` : ""}
            <div class="footer">Integrated Halal Supply Chain &bull; Scan QR untuk lacak keaslian</div>
          </div>
          <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-gradient-to-r from-cyan-500/5 to-emerald-500/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">QR Traceability</h3>
                  <p className="text-[11px] text-muted-foreground">{earTag}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center px-5 py-6">
              <div
                id="qr-svg-container"
                className="rounded-xl border-2 border-dashed border-border/50 p-4 bg-white dark:bg-white"
              >
                <QRCodeSVG
                  value={traceUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#1a1a2e"
                />
              </div>

              {/* Batch Info */}
              <div className="mt-4 w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Batch ID</span>
                  <span className="font-mono font-semibold text-foreground">
                    {batchId.split("-")[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Sapi</span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                    {earTag}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">RPH</span>
                  <span className="font-semibold text-foreground">{rphName}</span>
                </div>
                {productionDate && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tanggal</span>
                    <span className="font-semibold text-foreground">
                      {new Date(productionDate).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                )}
              </div>

              {/* URL Preview */}
              <div className="mt-4 w-full rounded-lg bg-muted/50 border border-border/30 px-3 py-2">
                <p className="text-[10px] text-muted-foreground font-mono break-all leading-relaxed">
                  {traceUrl}
                </p>
              </div>
            </div>

            {/* Actions */}
            {/* Primary: Download & Print */}
            <div className="grid grid-cols-2 gap-2 px-5 pb-3">
              <button
                onClick={handleDownloadPng}
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-95 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
              >
                <Printer className="h-4 w-4" />
                Print QR
              </button>
            </div>
            {/* Secondary: Copy & Open */}
            <div className="grid grid-cols-2 gap-2 px-5 pb-5">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/60 hover:bg-muted py-2 text-xs font-medium text-foreground transition-colors"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <a
                href={traceUrl}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/60 hover:bg-muted py-2 text-xs font-medium text-foreground transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                Buka Trace
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
