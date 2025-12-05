'use client';

import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/**
 * Client-side component that hydrates code blocks with copy functionality
 * This component doesn't render anything visible - it just adds event handlers
 */
export default function CodeBlock() {
  useEffect(() => {
    const handleCopy = async (event: Event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const code = button.getAttribute('data-code');

      if (!code) {
        toast({
          title: 'Error',
          description: 'No code to copy',
          variant: 'destructive',
        });
        return;
      }

      try {
        // Decode HTML entities
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = code;
        const decodedCode = tempDiv.textContent || tempDiv.innerText || '';

        // Copy to clipboard
        await navigator.clipboard.writeText(decodedCode);

        // Show success toast
        toast({
          title: 'Copied!',
          description: 'Code copied to clipboard',
        });

        // Change button text temporarily
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
        toast({
          title: 'Error',
          description: 'Failed to copy code',
          variant: 'destructive',
        });
      }
    };

    const attachListeners = () => {
      // Find all copy buttons in the document
      const copyButtons = document.querySelectorAll('.code-copy-button');

      // Add click handlers to all copy buttons
      copyButtons.forEach((button) => {
        button.addEventListener('click', handleCopy);
      });

      return () => {
        copyButtons.forEach((button) => {
          button.removeEventListener('click', handleCopy);
        });
      };
    };

    // Initial attachment
    const cleanup = attachListeners();

    // Also observe DOM changes to attach to dynamically added buttons
    const observer = new MutationObserver(() => {
      attachListeners();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      cleanup();
      observer.disconnect();
    };
  }, []);

  // This component doesn't render anything
  return null;
}
