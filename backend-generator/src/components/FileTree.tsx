"use client";

import React, { useState } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react';

export interface FileSystemNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string; // Only for files
  children?: FileSystemNode[]; // Only for folders
}

interface FileTreeProps {
  nodes: FileSystemNode[];
  onFileSelect: (file: FileSystemNode) => void;
  level?: number;
  selectedFileId?: string; // Added to track selected file
}

const FileTree: React.FC<FileTreeProps> = ({ nodes, onFileSelect, level = 0, selectedFileId }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    // Expand first-level folders by default
    if (level === 0) {
      const initialExpansion: Record<string, boolean> = {};
      nodes.forEach(node => {
        if (node.type === 'folder' && node.children && node.children.length > 0) {
          initialExpansion[node.id] = true;
        }
      });
      return initialExpansion;
    }
    return {};
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  return (
    <ul className="space-y-1">
      {nodes.map(node => (
        <li key={node.id} style={{ paddingLeft: `${level * 1.5}rem` }}>
          {node.type === 'folder' ? (
            <div className="flex items-center py-0.5">
              <button 
                onClick={() => toggleFolder(node.id)} 
                className="mr-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {expandedFolders[node.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <Folder size={18} className={`mr-2 ${expandedFolders[node.id] ? 'text-purple-500' : 'text-gray-500 dark:text-gray-400'} flex-shrink-0`} />
              <span 
                className="text-sm cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => toggleFolder(node.id)}
              >
                {node.name}
              </span>
            </div>
          ) : (
            <div 
              className={`flex items-center cursor-pointer py-0.5 pl-1 pr-1 rounded ${selectedFileId === node.id ? 'bg-purple-100 dark:bg-purple-800/60' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              onClick={() => onFileSelect(node)}
              style={{ paddingLeft: `${0.25 + (level > 0 ? 0 : -0.25)}rem` }} // Keep file icon aligned with folder text
            >
              <FileText size={18} className={`mr-2 ${selectedFileId === node.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'} flex-shrink-0`} />
              <span className={`text-sm ${selectedFileId === node.id ? 'text-purple-700 dark:text-purple-300 font-medium' : 'hover:text-purple-600 dark:hover:text-purple-400'}`}>{node.name}</span>
            </div>
          )}
          {node.type === 'folder' && expandedFolders[node.id] && node.children && (
            <FileTree nodes={node.children} onFileSelect={onFileSelect} level={level + 1} selectedFileId={selectedFileId} />
          )}
        </li>
      ))}
    </ul>
  );
};

export default FileTree;