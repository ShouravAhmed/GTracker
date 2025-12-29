'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Bold, Italic, Underline, Link, List } from 'lucide-react'

interface InlineNoteEditorProps {
  problemId: string
  initialContent?: string
  onSave: (content: string) => void
  onClose: () => void
  problemName: string
}

export function InlineNoteEditor({
  problemId,
  initialContent = '',
  onSave,
  onClose,
  problemName
}: InlineNoteEditorProps) {
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Note</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 p-1 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 mb-2">
        <button
          onClick={() => formatText('bold')}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Bold"
        >
          <Bold size={12} className="text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={() => formatText('italic')}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Italic"
        >
          <Italic size={12} className="text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={() => formatText('underline')}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Underline"
        >
          <Underline size={12} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
        <button
          onClick={() => {
            const url = prompt('Enter URL:')
            if (url) formatText('createLink', url)
          }}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Insert Link"
        >
          <Link size={12} className="text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={() => formatText('insertUnorderedList')}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Bullet List"
        >
          <List size={12} className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 p-2 overflow-y-auto text-sm text-gray-900 dark:text-white focus:outline-none min-h-[150px] max-h-[200px] border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
      />

      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={handleSave}
          className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Save
        </button>
      </div>
    </div>
  )
}

