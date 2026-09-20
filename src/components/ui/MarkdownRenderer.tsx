import React from 'react'

interface MarkdownRendererProps {
  content?: string | null
  className?: string
}

function renderInline(text: string): React.ReactNode[] {
  if (!text) return []

  // Matches bold (**...** or __...__), italic (*...* or _..._), inline code (`...`)
  const regex = /(\*\*[^*]+?\*\*|__[^_]+?__|\*[^*]+?\*|_[^_]+?_|`[^`]+?`)/g
  const parts = text.split(regex)

  return parts.map((part, i) => {
    if (!part) return null

    // Bold (**...** or __...__)
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const inner = part.slice(2, -2)
      return (
        <strong key={i} className="font-bold text-[#26343B]">
          {inner}
        </strong>
      )
    }

    // Italic (*...* or _..._)
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const inner = part.slice(1, -1)
      return (
        <em key={i} className="italic text-[#4A5568]">
          {inner}
        </em>
      )
    }

    // Inline Code (`...`)
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1)
      return (
        <code key={i} className="bg-[#E2E8EE]/70 text-[#26343B] px-1.5 py-0.5 rounded text-xs font-mono">
          {inner}
        </code>
      )
    }

    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null

  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let currentListItems: { type: 'bullet' | 'number'; num?: string; text: string }[] = []

  const flushList = () => {
    if (currentListItems.length === 0) return

    const isNumbered = currentListItems[0].type === 'number'
    const listKey = `list-${blocks.length}`

    if (isNumbered) {
      blocks.push(
        <ol key={listKey} className="space-y-2 my-2 pl-0.5">
          {currentListItems.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-2.5 text-sm text-[#26343B] leading-relaxed">
              <span className="font-bold text-[#7897A8] text-xs shrink-0 mt-0.5 min-w-4 text-right">
                {item.num || idx + 1}.
              </span>
              <div className="flex-1">{renderInline(item.text)}</div>
            </li>
          ))}
        </ol>
      )
    } else {
      blocks.push(
        <ul key={listKey} className="space-y-2.5 my-2 pl-0.5">
          {currentListItems.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-2.5 text-sm text-[#26343B] leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7897A8] shrink-0 mt-2" />
              <div className="flex-1">{renderInline(item.text)}</div>
            </li>
          ))}
        </ul>
      )
    }

    currentListItems = []
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      return
    }

    // Bullet items: •, -, *
    const bulletMatch = trimmed.match(/^[•\-\*]\s+(.*)$/)
    if (bulletMatch) {
      currentListItems.push({ type: 'bullet', text: bulletMatch[1] })
      return
    }

    // Numbered items: 1., 2.
    const numberMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/)
    if (numberMatch) {
      currentListItems.push({ type: 'number', num: numberMatch[1], text: numberMatch[2] })
      return
    }

    // Otherwise flush existing list if any
    flushList()

    // Headers
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h4 key={`h4-${idx}`} className="text-sm font-bold text-[#26343B] mt-4 mb-1.5">
          {renderInline(trimmed.slice(4))}
        </h4>
      )
      return
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h3 key={`h3-${idx}`} className="text-base font-bold text-[#26343B] mt-5 mb-2">
          {renderInline(trimmed.slice(3))}
        </h3>
      )
      return
    }
    if (trimmed.startsWith('# ')) {
      blocks.push(
        <h2 key={`h1-${idx}`} className="text-lg font-bold text-[#26343B] mt-6 mb-2.5">
          {renderInline(trimmed.slice(2))}
        </h2>
      )
      return
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      blocks.push(
        <blockquote key={`quote-${idx}`} className="border-l-4 border-[#B8C9C1] pl-3 py-1 my-2 italic text-sm text-[#71808A] bg-[#F6F8FA] rounded-r-lg">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      )
      return
    }

    // Normal paragraph
    blocks.push(
      <p key={`p-${idx}`} className="text-sm text-[#26343B] leading-relaxed my-1">
        {renderInline(trimmed)}
      </p>
    )
  })

  flushList()

  return <div className={`space-y-1 ${className}`}>{blocks}</div>
}
