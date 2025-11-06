"use client";

import React, { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';

type Props = {
  content: string;
  className?: string;
  inline?: boolean;
};

/**
 * LaTeXRenderer - Renders HTML content with LaTeX math expressions
 * Supports both inline ($...$) and display ($$...$$) math
 */
export default function LaTeXRenderer({ content, className = '', inline = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // Dynamically import katex to avoid SSR issues
    import('katex').then((katex) => {
      const container = containerRef.current;
      if (!container) return;

      // Create a temporary div to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // Find and render all math expressions
      const renderMath = (element: Element) => {
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null
        );

        const nodesToReplace: Array<{ node: Node; parent: Node; latex: string; display: boolean }> = [];

        let node;
        while ((node = walker.nextNode())) {
          const text = node.textContent || '';
          
          // Match display math $$...$$ and \[...\]
          const displayMatches = text.matchAll(/(?:\$\$(.*?)\$\$|\\\[(.*?)\\\])/g);
          for (const match of displayMatches) {
            const latex = match[1] || match[2];
            nodesToReplace.push({
              node,
              parent: node.parentNode!,
              latex: latex,
              display: true,
            });
          }

          // Match inline math $...$ and \(...\)
          const inlineMatches = text.matchAll(/(?:(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)|\\\((.*?)\\\))/g);
          for (const match of inlineMatches) {
            const latex = match[1] || match[2];
            nodesToReplace.push({
              node,
              parent: node.parentNode!,
              latex: latex,
              display: false,
            });
          }
        }

        // Replace text nodes with rendered math
        nodesToReplace.forEach(({ node, parent, latex, display }) => {
          try {
            const span = document.createElement('span');
            katex.default.render(latex, span, {
              throwOnError: false,
              displayMode: display,
            });
            
            // Replace the text node with the rendered math
            const textContent = node.textContent || '';
            let searchPattern: string;
            
            if (display) {
              // Check for $$...$$ or \[...\] format
              if (textContent.includes(`$$${latex}$$`)) {
                searchPattern = `$$${latex}$$`;
              } else {
                searchPattern = `\\[${latex}\\]`;
              }
            } else {
              // Check for $...$ or \(...\) format
              if (textContent.includes(`$${latex}$`)) {
                searchPattern = `$${latex}$`;
              } else {
                searchPattern = `\\(${latex}\\)`;
              }
            }
            
            const parts = textContent.split(searchPattern);
            
            if (parts.length > 1) {
              const before = document.createTextNode(parts[0]);
              const after = document.createTextNode(parts.slice(1).join(''));
              
              parent.insertBefore(before, node);
              parent.insertBefore(span, node);
              parent.insertBefore(after, node);
              parent.removeChild(node);
            }
          } catch (error) {
            console.error('KaTeX rendering error:', error);
          }
        });
      };

      renderMath(tempDiv);
      container.innerHTML = tempDiv.innerHTML;
    });
  }, [content]);

  if (!content) return null;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ display: inline ? 'inline' : 'block' }}
    />
  );
}
