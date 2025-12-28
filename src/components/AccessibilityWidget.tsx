import React, { useState, useEffect } from 'react';
import { Eye, Type, Palette, Volume2, MousePointer, Keyboard } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';

export default function AccessibilityWidget() {
  const { config, updateConfig } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    // Apply font size changes
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  const toggleHighContrast = () => {
    updateConfig({ highContrast: !config.highContrast });
  };

  const toggleReducedMotion = () => {
    updateConfig({ reducedMotion: !config.reducedMotion });
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 10, 150));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 10, 80));
  };

  const resetFontSize = () => {
    setFontSize(100);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-sexy-pink-600 text-white p-3 rounded-full shadow-lg hover:bg-sexy-pink-700 transition-colors focus:ring-2 focus:ring-sexy-pink-500 focus:ring-offset-2"
        aria-label="Open accessibility options"
        aria-expanded={isOpen}
      >
        <Eye className="w-6 h-6" />
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Accessibility Options</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close accessibility options"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Font Size Controls */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Type className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Text Size</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={decreaseFontSize}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                  aria-label="Decrease font size"
                >
                  A-
                </button>
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">{fontSize}%</span>
                <button
                  onClick={increaseFontSize}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                  aria-label="Increase font size"
                >
                  A+
                </button>
                <button
                  onClick={resetFontSize}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                  aria-label="Reset font size"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* High Contrast */}
            <div>
              <label className="flex items-center space-x-3">
                <Palette className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900 flex-1">High Contrast</span>
                <button
                  onClick={toggleHighContrast}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sexy-pink-500 focus:ring-offset-2 ${
                    config.highContrast ? 'bg-sexy-pink-600' : 'bg-gray-200'
                  }`}
                  aria-pressed={config.highContrast}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Reduced Motion */}
            <div>
              <label className="flex items-center space-x-3">
                <MousePointer className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900 flex-1">Reduce Motion</span>
                <button
                  onClick={toggleReducedMotion}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sexy-pink-500 focus:ring-offset-2 ${
                    config.reducedMotion ? 'bg-sexy-pink-600' : 'bg-gray-200'
                  }`}
                  aria-pressed={config.reducedMotion}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Keyboard Navigation Help */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center space-x-2 mb-2">
                <Keyboard className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Keyboard Shortcuts</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Tab</span>
                  <span>Navigate forward</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift + Tab</span>
                  <span>Navigate backward</span>
                </div>
                <div className="flex justify-between">
                  <span>Enter/Space</span>
                  <span>Activate button</span>
                </div>
                <div className="flex justify-between">
                  <span>Esc</span>
                  <span>Close modal/menu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}