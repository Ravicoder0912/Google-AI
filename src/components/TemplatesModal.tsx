import React, { useState } from "react";
import { X, Sparkles, ArrowRight, Tag, CheckCircle2 } from "lucide-react";
import { PresetTemplate } from "../types";

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: PresetTemplate[];
  onSelectTemplate: (template: PresetTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  if (!isOpen) return null;

  const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];

  const filtered =
    selectedCategory === "All"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Decision Scenarios & Templates
              </h3>
              <p className="text-xs text-slate-500">
                Select a pre-calibrated scenario to inspect or customize
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                onSelectTemplate(tpl);
                onClose();
              }}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer group bg-white shadow-xs"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 mb-1 inline-block">
                    {tpl.category}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">
                    {tpl.title}
                  </h4>
                </div>

                <div className="p-2 rounded-md bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 transition-colors flex-shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                {tpl.description}
              </p>

              {/* Options pills */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                {tpl.options.map((opt, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                  >
                    {opt.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
