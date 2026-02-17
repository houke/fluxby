/**
 * Accessible Component Examples
 *
 * This file demonstrates accessible implementations of common UI patterns.
 */

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

// ============================================================================
// ACCESSIBLE BUTTON
// ============================================================================

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
}

export function AccessibleButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  ariaLabel,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {loading ? (
        <>
          <span className='spinner' aria-hidden='true' />
          <span className='sr-only'>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// ============================================================================
// ACCESSIBLE MODAL
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocus.current = document.activeElement as HTMLElement;

      // Focus modal
      modalRef.current?.focus();

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus
      previousFocus.current?.focus();
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Trap focus inside modal
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableElements?.length) return;

      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className='modal-overlay' onClick={onClose} aria-hidden='true'>
      <div
        ref={modalRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby='modal-title'
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className='modal'
      >
        <header className='modal-header'>
          <h2 id='modal-title'>{title}</h2>
          <button
            onClick={onClose}
            aria-label='Close modal'
            className='modal-close'
          >
            <span aria-hidden='true'>×</span>
          </button>
        </header>
        <div className='modal-content'>{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// ACCESSIBLE ACCORDION
// ============================================================================

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

export function AccessibleAccordion({
  items,
  allowMultiple = false,
}: AccordionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    const buttons = document.querySelectorAll('[data-accordion-trigger]');

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        (buttons[(index + 1) % buttons.length] as HTMLElement).focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        (
          buttons[(index - 1 + buttons.length) % buttons.length] as HTMLElement
        ).focus();
        break;
      case 'Home':
        e.preventDefault();
        (buttons[0] as HTMLElement).focus();
        break;
      case 'End':
        e.preventDefault();
        (buttons[buttons.length - 1] as HTMLElement).focus();
        break;
    }
  };

  return (
    <div className='accordion'>
      {items.map((item, index) => {
        const isExpanded = expandedItems.has(item.id);
        const panelId = `panel-${item.id}`;
        const triggerId = `trigger-${item.id}`;

        return (
          <div key={item.id} className='accordion-item'>
            <h3>
              <button
                id={triggerId}
                data-accordion-trigger
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onClick={() => toggleItem(item.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className='accordion-trigger'
              >
                <span>{item.title}</span>
                <span aria-hidden='true' className='accordion-icon'>
                  {isExpanded ? '−' : '+'}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role='region'
              aria-labelledby={triggerId}
              hidden={!isExpanded}
              className='accordion-panel'
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// ACCESSIBLE TABS
// ============================================================================

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  label: string;
}

export function AccessibleTabs({ items, label }: TabsProps) {
  const [activeTab, setActiveTab] = useState(items[0]?.id);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleKeyDown = (e: KeyboardEvent, currentIndex: number) => {
    let newIndex: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowLeft':
        newIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== null) {
      e.preventDefault();
      const newTab = items[newIndex];
      setActiveTab(newTab.id);
      tabRefs.current.get(newTab.id)?.focus();
    }
  };

  return (
    <div className='tabs'>
      <div role='tablist' aria-label={label}>
        {items.map((item, index) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => el && tabRefs.current.set(item.id, el)}
              role='tab'
              id={`tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${item.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`tab ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role='tabpanel'
          id={`panel-${item.id}`}
          aria-labelledby={`tab-${item.id}`}
          hidden={activeTab !== item.id}
          tabIndex={0}
          className='tab-panel'
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ACCESSIBLE FORM
// ============================================================================

interface FormErrors {
  [key: string]: string;
}

export function AccessibleForm() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (data: FormData): FormErrors => {
    const errors: FormErrors = {};

    const email = data.get('email') as string;
    if (!email) {
      errors.email = 'Email is required';
    } else if (!email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    }

    const password = data.get('password') as string;
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const validationErrors = validate(formData);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setSubmitted(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {submitted && (
        <div role='status' className='success-message'>
          Form submitted successfully!
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div role='alert' className='error-summary'>
          <h3>Please fix the following errors:</h3>
          <ul>
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>
                <a href={`#${field}`}>{message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className='form-group'>
        <label htmlFor='email'>
          Email <span aria-hidden='true'>*</span>
          <span className='sr-only'>(required)</span>
        </label>
        <input
          type='email'
          id='email'
          name='email'
          aria-required='true'
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          autoComplete='email'
        />
        {errors.email && (
          <span id='email-error' className='error' role='alert'>
            {errors.email}
          </span>
        )}
      </div>

      <div className='form-group'>
        <label htmlFor='password'>
          Password <span aria-hidden='true'>*</span>
          <span className='sr-only'>(required)</span>
        </label>
        <input
          type='password'
          id='password'
          name='password'
          aria-required='true'
          aria-invalid={!!errors.password}
          aria-describedby='password-help password-error'
          autoComplete='new-password'
        />
        <p id='password-help' className='help-text'>
          Must be at least 8 characters
        </p>
        {errors.password && (
          <span id='password-error' className='error' role='alert'>
            {errors.password}
          </span>
        )}
      </div>

      <button type='submit'>Sign Up</button>
    </form>
  );
}

// ============================================================================
// SCREEN READER ONLY CLASS
// ============================================================================

/**
 * CSS for visually hidden but accessible content:
 *
 * .sr-only {
 *   position: absolute;
 *   width: 1px;
 *   height: 1px;
 *   padding: 0;
 *   margin: -1px;
 *   overflow: hidden;
 *   clip: rect(0, 0, 0, 0);
 *   white-space: nowrap;
 *   border: 0;
 * }
 */
