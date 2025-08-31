// pages/components/templatepreview.tsx
"use client";

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

type Props = {
  id: string;
  title: string;
  description?: string;
  features?: string[];
  category?: string;
  selected: boolean;
  onSelect: (id: string) => void;
  children: React.ReactNode;
};

/** Simple portal modal (no external deps) */
function Modal({
  open,
  onClose,
  title,
  description,
  features,
  category,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  features?: string[];
  category?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  // Inject small style override scoped to the modal to force dark readable text.
  const overrideCSS = `
    /* Force dark text inside modal preview for readability */
    .resumator-modal-override * {
      color: #111827 !important; /* tailwind text-gray-900 */
    }
    /* Keep links visible (blue) */
    .resumator-modal-override a {
      color: #1d4ed8 !important; /* tailwind blue-700 */
    }
    /* Ensure bullets and small text are dark too */
    .resumator-modal-override li, 
    .resumator-modal-override p, 
    .resumator-modal-override h1, 
    .resumator-modal-override h2, 
    .resumator-modal-override h3, 
    .resumator-modal-override span {
      color: #111827 !important;
    }
  `;

  return ReactDOM.createPortal(
    <>
      <style>{overrideCSS}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden
        />

        {/* modal panel */}
        <div
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-[95vw] md:w-[90vw] lg:w-[920px] max-h-[95vh] overflow-auto rounded-lg bg-gray-100 shadow-xl"
        >
          <div className="flex items-center justify-between border-b bg-white p-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
              {category && (
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                  {category}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 rounded px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800"
              aria-label="Close preview"
            >
              Close
            </button>
          </div>

          {/* Template features */}
          {features && features.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-b">
              <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
              <div className="flex flex-wrap gap-2">
                {features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 md:p-8 flex justify-center bg-gray-50">
            {/* full-size page container with proper A4 aspect ratio */}
            <div
              className="w-full max-w-[794px] bg-white shadow-lg rounded-lg overflow-hidden resumator-modal-override border border-gray-200"
              style={{ aspectRatio: '210/297', maxHeight: '80vh' }}
              aria-hidden={false}
            >
              <div className="w-full h-full p-6 md:p-8 overflow-auto">
                <div className="w-full h-full min-h-[1123px]" style={{ width: '210mm', minHeight: '297mm' }}>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

const TemplatePreview: React.FC<Props> = ({ 
  id, 
  title, 
  description, 
  features, 
  category, 
  selected, 
  onSelect, 
  children 
}) => {
  const [open, setOpen] = useState(false);

  // clicking the thumbnail card selects the template
  const handleCardClick = () => onSelect(id);

  // View Full should not trigger selection — stop propagation
  const handleViewFullClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
    >
      {/* Thumbnail / preview box with proper A4 aspect ratio */}
      <div
        className={`relative w-full max-w-[240px] aspect-[210/297] overflow-hidden rounded-xl shadow-lg border-2 transition-all duration-300 ${
          selected 
            ? "ring-4 ring-blue-500 ring-offset-2 border-blue-300 shadow-blue-200/50" 
            : "border-gray-200 hover:border-gray-300 hover:shadow-xl group-hover:shadow-gray-300/50"
        } bg-white`}
        style={{ aspectRatio: '210/297' }}
        aria-hidden
      >
        {/* Render the full template scaled down with responsive scaling */}
        <div className="pointer-events-none origin-top-left scale-[0.3] w-[800px] h-[1133px] text-gray-900 p-4">
          {children}
        </div>
        
        {/* Subtle gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Selection indicator */}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Template Info */}
      <div className="mt-4 text-center w-full max-w-[240px] px-2">
        <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
        {description && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-tight">{description}</p>
        )}
        
        <div className="flex items-center justify-center gap-2 mt-3">
          {category && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full capitalize font-medium">
              {category}
            </span>
          )}
          {selected && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-semibold">
              ✓ Selected
            </span>
          )}
        </div>
      </div>

      {/* View Full Page button (stops propagation) */}
      <button
        onClick={handleViewFullClick}
        className="mt-3 text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
        aria-label={`View full ${title}`}
      >
        👁️ Preview
      </button>

      {/* Modal showing full-size preview inside same page */}
      <Modal 
        open={open} 
        onClose={() => setOpen(false)} 
        title={title}
        description={description}
        features={features}
        category={category}
      >
        {/* Render the same component as full-size (no scaling) */}
        <div className="w-full h-full">{children}</div>
      </Modal>
    </div>
  );
};

export default TemplatePreview;
