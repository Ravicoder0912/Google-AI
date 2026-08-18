import React from "react";
import { X, History, Trash2, ArrowRight, Calendar, Bookmark, Scale } from "lucide-react";
import { DecisionSession } from "../types";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: DecisionSession[];
  onSelectSession: (session: DecisionSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectSession,
  onDeleteSession,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Decision History
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 px-4 text-slate-500">
              <Scale className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-semibold">No saved decisions yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Run an analysis and it will be safely remembered here.
              </p>
            </div>
          ) : (
            history.map((session) => {
              const winnerName = session.analysis?.tiebreakerVerdict?.winnerOptionName;

              return (
                <div
                  key={session.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/10 transition-all shadow-xs group relative"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(session.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                      title="Delete saved decision"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4
                    onClick={() => {
                      onSelectSession(session);
                      onClose();
                    }}
                    className="font-bold text-slate-900 text-sm cursor-pointer group-hover:text-indigo-600 transition-colors line-clamp-2"
                  >
                    {session.title}
                  </h4>

                  {winnerName && (
                    <div className="mt-2 text-xs flex items-center gap-1 text-emerald-800 font-medium">
                      🏆 <span className="text-slate-500">Winner:</span> {winnerName}
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {session.options.length} options compared
                    </span>
                    <button
                      onClick={() => {
                        onSelectSession(session);
                        onClose();
                      }}
                      className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <span>Open Analysis</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              {history.length} saved {history.length === 1 ? "decision" : "decisions"}
            </span>
            <button
              onClick={onClearAll}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium"
            >
              Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
