"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Bold from "@tiptap/extension-bold"
import Italic from "@tiptap/extension-italic"
import Underline from "@tiptap/extension-underline"
import Heading from "@tiptap/extension-heading"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import ListItem from "@tiptap/extension-list-item"
import TextAlign from "@tiptap/extension-text-align"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    immediatelyRender: false, // 👈 FIX for SSR hydration errors
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="space-y-2 border rounded-md p-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b pb-1 mb-2">
        <Toggle
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </Toggle>
        <Toggle
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          i
        </Toggle>
        <Toggle
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        >
          U
        </Toggle>
        <Toggle
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </Toggle>
        <Toggle
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Toggle>
        <Toggle
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Toggle>
        <Toggle
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </Toggle>
        <Toggle
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </Toggle>
        <Toggle
          pressed={editor.isActive({ textAlign: "left" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
        >
          ⬅
        </Toggle>
        <Toggle
          pressed={editor.isActive({ textAlign: "center" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
        >
          ⬌
        </Toggle>
        <Toggle
          pressed={editor.isActive({ textAlign: "right" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
        >
          ➡
        </Toggle>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className={cn(
          "min-h-[120px] prose prose-sm max-w-none focus:outline-none p-2 rounded-md border"
        )}
      />
    </div>
  )
}
