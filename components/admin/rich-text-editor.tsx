"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

export function RichTextEditor({ name, initial, label }: { name: string; initial: string; label: string }) {
  const [html, setHtml] = useState(initial);
  const [linkError, setLinkError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } }),
    ],
    content: initial,
    editorProps: { attributes: { "aria-label": label } },
    onUpdate: ({ editor: e }) => setHtml(e.isEmpty ? "" : e.getHTML()),
  });

  // Keep the editor in sync if the form is reset with a different initial value
  useEffect(() => {
    if (editor && initial !== editor.getHTML() && !editor.isFocused) editor.commands.setContent(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  if (!editor) return <div className="h-48 animate-pulse rounded border border-line bg-sand/40" />;

  const Btn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium ${active ? "bg-forest text-ivory" : "text-forest-dark hover:bg-sand"}`}
    >
      {children}
    </button>
  );

  function setLink() {
    setLinkError("");
    const previous = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address (https://...)", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
      setLinkError("Links must start with https://, http:// or mailto:");
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="rounded border border-line bg-paper focus-within:ring-2 focus-within:ring-forest/20">
      <div className="flex flex-wrap gap-0.5 border-b border-line bg-sand/40 p-1" role="toolbar" aria-label="Formatting">
        <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </Btn>
        <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </Btn>
        <Btn title="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Btn>
        <Btn title="Subheading" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </Btn>
        <Btn title="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          List
        </Btn>
        <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1.
        </Btn>
        <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          Quote
        </Btn>
        <Btn title="Link" active={editor.isActive("link")} onClick={setLink}>
          Link
        </Btn>
        <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          Undo
        </Btn>
        <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          Redo
        </Btn>
      </div>
      <div className="editor-surface">
        <EditorContent editor={editor} />
      </div>
      <input type="hidden" name={name} value={html} />
      {linkError && <p className="field-error px-3 pb-2">{linkError}</p>}
    </div>
  );
}
