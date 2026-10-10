"use client";

import React, { useEffect, useState } from 'react';
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
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setAnimateIn(true), 10);
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setShouldRender(false), 300); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className={`modal-overlay ${animateIn ? 'open' : ''}`} onClick={(e) => {
      // Allow closing by clicking overlay if it's not a strict confirm/success dialog that requires explicit action
      if (onClose && type === 'default') onClose();
    }}>
      <div className={`modal-content ${type}-modal`} onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="modal-title">{title}</h3>}
        
        <div className="modal-body">
          {type === 'success' && (
            <div className="icon-wrapper success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"></path></svg>
            </div>
          )}
          {type === 'error' && (
            <div className="icon-wrapper error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M15 9l-6 6M9 9l6 6"></path></svg>
            </div>
          )}
          {type === 'confirm' && (
            <div className="icon-wrapper confirm-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4M12 16h.01"></path></svg>
            </div>
          )}
          
          <div className="modal-children">
            {children}
          </div>
        </div>

        {(type === 'success' || type === 'error' || type === 'confirm') && (
          <div className="modal-actions">
            {type === 'confirm' && onClose && (
              <button className="btn btn-outline" onClick={onClose}>{cancelText}</button>
            )}
            <button 
              className={`btn ${type === 'error' ? 'btn-danger' : type === 'confirm' ? 'btn-primary' : 'btn-success'}`}
              onClick={onConfirm || onClose}
            >
              {confirmText}
            </button>
          </div>
        )}
        
        {type === 'default' && onClose && (
          <button className="modal-close-btn" onClick={onClose}>×</button>
        )}
      </div>
    </div>
  );
}
