import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
        const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Global shortcuts configuration
export const GLOBAL_SHORTCUTS: ShortcutConfig[] = [
  {
    key: 'k',
    ctrl: true,
    description: 'Open search',
    callback: () => {
      const event = new CustomEvent('open-search');
      window.dispatchEvent(event);
    }
  },
  {
    key: 'n',
    ctrl: true,
    description: 'New task',
    callback: () => {
      const event = new CustomEvent('new-task');
      window.dispatchEvent(event);
    }
  },
  {
    key: 'd',
    ctrl: true,
    description: 'Go to dashboard',
    callback: () => {
      window.location.href = '/dashboard';
    }
  },
  {
    key: 't',
    ctrl: true,
    description: 'Go to tasks',
    callback: () => {
      window.location.href = '/tasks';
    }
  },
  {
    key: 'c',
    ctrl: true,
    description: 'Go to calendar',
    callback: () => {
      window.location.href = '/calendar';
    }
  },
  {
    key: '/',
    ctrl: false,
    description: 'Focus search',
    callback: () => {
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    }
  },
  {
    key: '?',
    ctrl: false,
    shift: true,
    description: 'Show keyboard shortcuts',
    callback: () => {
      const event = new CustomEvent('show-shortcuts');
      window.dispatchEvent(event);
    }
  }
];
