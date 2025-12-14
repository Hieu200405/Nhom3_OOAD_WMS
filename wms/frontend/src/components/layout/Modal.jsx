import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const modalRootId = 'modal-root';

function ensureModalRoot() {
    if (typeof document === 'undefined') return null;
    let root = document.getElementById(modalRootId);
    if (!root) {
        root = document.createElement('div');
        root.setAttribute('id', modalRootId);
        document.body.appendChild(root);
    }
    return root;
}

export function Modal({ open, onClose, title, children, actions }) {
    if (!open) return null;

    const container = ensureModalRoot();
    if (!container) return null;

    const content = (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Vui lòng điền thông tin đầy đủ.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="space-y-4 overflow-y-auto py-2 max-h-[60vh] pr-1">{children}</div>
                {actions ? <div className="mt-6 flex items-center justify-end gap-3">{actions}</div> : null}
            </div>
        </div>
    );

    return createPortal(content, container);
}
