import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, FileText } from 'lucide-react';
import { exportData, ExportColumn } from '../utils/exportData';
import { motion, AnimatePresence } from 'framer-motion';

interface ExportButtonProps {
  data: any[];
  columns: ExportColumn[];
  filename: string;
  label?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  columns,
  filename,
  label = 'Export'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    exportData({
      filename,
      columns,
      data,
      format
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>{label}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden"
            >
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <FileText className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Export as CSV</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Comma-separated values</p>
                </div>
              </button>

              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <FileSpreadsheet className="w-5 h-5 text-green-700" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Export as Excel</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Microsoft Excel format</p>
                </div>
              </button>

              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <FileJson className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Export as JSON</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">JavaScript Object Notation</p>
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExportButton;
