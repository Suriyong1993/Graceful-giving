import React from "react";
import { X, ExternalLink, Download, FileText } from "lucide-react";

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string | null;
  title?: string;
  refCode?: string;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  receiptUrl,
  title,
  refCode,
}) => {
  if (!isOpen || !receiptUrl) return null;

  const isPdf = receiptUrl.toLowerCase().includes(".pdf");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#DDE5F0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F6F8FC] border-b border-[#DDE5F0]">
          <div>
            <h3 className="font-bold text-sm text-[#0C1B33]">
              ??????????? / ??????????
            </h3>
            {refCode && (
              <p className="text-xs text-[#64748B] font-mono">
                {refCode} {title && `� ${title}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DDE5F0] text-[#475569] hover:bg-[#EDF1F7] text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>?????????????</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-[#64748B] hover:text-[#0C1B33] hover:bg-black/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Preview */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex items-center justify-center bg-slate-100 min-h-[300px]">
          {isPdf ? (
            <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-sm">
              <FileText className="w-16 h-16 text-[#12325C] mx-auto mb-3" />
              <p className="font-bold text-sm text-slate-800">
                ??????????????? PDF
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                ?????????? PDF ????????? Supabase Storage ????????????
              </p>
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#12325C] hover:bg-[#0F2947] text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>???????????????? PDF</span>
              </a>
            </div>
          ) : (
            <div className="max-w-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
              <img
                src={receiptUrl}
                alt="Receipt Full Preview"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
