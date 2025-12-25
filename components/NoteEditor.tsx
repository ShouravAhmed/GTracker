'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Bold, Italic, Underline, Link, List, CheckSquare } from 'lucide-react'

interface NoteEditorProps {
  initialContent?: string
  onSave: (content: string) => void
  onClose: () => void
  problemName: string
}

export default function NoteEditor({ initialContent = '', onSave, onClose, problemName }: NoteEditorProps) {
  const [content, setContent] = useState(initialContent)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent
    }
  }, [initialContent])

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const handleSave = () => {
    const htmlContent = editorRef.current?.innerHTML || ''
    onSave(htmlContent)
  }

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Note: {problemName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={() => formatText('bold')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Bold"
          >
            <Bold size={16} className="text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => formatText('italic')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Italic"
          >
            <Italic size={16} className="text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => formatText('underline')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Underline"
          >
            <Underline size={16} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <button
            onClick={() => {
              const url = prompt('Enter URL:')
              if (url) formatText('createLink', url)
            }}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Insert Link"
          >
            <Link size={16} className="text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => formatText('insertUnorderedList')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Bullet List"
          >
            <List size={16} className="text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => formatText('insertOrderedList')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Numbered List"
          >
            <List size={16} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex-1" />
          <select
            onChange={(e) => formatText('fontSize', e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            defaultValue="3"
          >
            <option value="1">Small</option>
            <option value="2">Normal</option>
            <option value="3">Large</option>
            <option value="4">X-Large</option>
            <option value="5">XX-Large</option>
          </select>
        </div>

        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="flex-1 p-4 overflow-y-auto text-gray-900 dark:text-white focus:outline-none min-h-[300px]"
          style={{
            minHeight: '300px',
          }}
        />

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

