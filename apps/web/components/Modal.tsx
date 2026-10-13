"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  type?: 'default' | 'success' | 'error' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  type = 'default',
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel'
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setAnimateIn(true), 10);
      document.body.style.overflow = 'hidden';
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
      document.body.style.overflow = '';
      const timer = setTimeout(() => setShouldRender(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!mounted || !shouldRender) return null;

  const modalNode = (
    <div
      className={`modal-overlay ${animateIn ? 'open' : ''}`}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (onClose && type === 'default') onClose();
      }}
    >
      <div
        className={`modal-content ${type}-modal animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="modal-title">{title}</h3>}

        <div className="modal-body">
          {type === 'success' && (
            <div className="icon-wrapper success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
            </div>
          )}
          {type === 'error' && (
            <div className="icon-wrapper error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M15 9l-6 6M9 9l6 6"></path>
              </svg>
            </div>
          )}
          {type === 'confirm' && (
            <div className="icon-wrapper confirm-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v4M12 16h.01"></path>
              </svg>
            </div>
          )}

          <div className="modal-children">
            {children}
          </div>
        </div>

        {(type === 'success' || type === 'error' || type === 'confirm') && (
          <div className="modal-actions">
            {type === 'confirm' && onClose && (
              <button type="button" className="btn btn-outline" onClick={onClose}>
                {cancelText}
              </button>
            )}
            <button
              type="button"
              className={`btn ${type === 'error' ? 'btn-danger' : type === 'confirm' ? 'btn-primary' : 'btn-success'}`}
              onClick={onConfirm || onClose}
            >
              {confirmText}
            </button>
          </div>
        )}

        {type === 'default' && onClose && (
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
