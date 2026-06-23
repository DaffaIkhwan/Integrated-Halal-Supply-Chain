"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Copy, Check, MessageCircle, QrCode } from "lucide-react";

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
      ? `${window.location.origin}/trace/${batchId}`
      : `/trace/${batchId}`;

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
    const labelHeight = 60;
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
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`🐄 ${earTag}`, totalSize / 2, totalSize + 20);

      ctx.fillStyle = "#6b7280";
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText(`Batch: ${batchId.split("-")[0]}`, totalSize / 2, totalSize + 40);

      // Download
      const link = document.createElement("a");
      link.download = `QR-${earTag}-${batchId.split("-")[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = svgUrl;
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
            <div className="grid grid-cols-3 gap-2 px-5 pb-5">
              <button
                onClick={handleDownloadPng}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-background py-3 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-4 w-4 text-cyan-500" />
                Download
              </button>
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-background py-3 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4 text-cyan-500" />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <a
                href={`/chat?trace=${batchId}`}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-background py-3 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                Chatbot
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
