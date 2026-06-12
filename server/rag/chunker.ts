export interface TextChunk {
  content: string
  index: number
  wordCount: number
  metadata: {
    source: string
    title?: string
    startChar: number
    endChar: number
  }
}

const DEFAULT_CHUNK_SIZE = 400
const OVERLAP_SIZE = 80

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function splitIntoSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z])/)
}

export function chunkText(
  text: string,
  source: string,
  title?: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = OVERLAP_SIZE
): TextChunk[] {
  const cleaned = cleanText(text)
  if (!cleaned) return []

  const paragraphs = cleaned.split(/\n\n+/)
  const chunks: TextChunk[] = []
  let currentChunk = ''
  let currentStart = 0
  let charOffset = 0
  let chunkIndex = 0

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/)

    if (words.length > chunkSize * 2) {
      const sentences = splitIntoSentences(paragraph)
      let sentenceBuffer = ''

      for (const sentence of sentences) {
        const combinedWords = (sentenceBuffer + ' ' + sentence).trim().split(/\s+/)
        if (combinedWords.length >= chunkSize && sentenceBuffer) {
          const content = sentenceBuffer.trim()
          if (content) {
            chunks.push({
              content,
              index: chunkIndex++,
              wordCount: content.split(/\s+/).length,
              metadata: { source, title, startChar: charOffset, endChar: charOffset + content.length },
            })
            const overlapWords = sentenceBuffer.split(/\s+/).slice(-overlap)
            sentenceBuffer = overlapWords.join(' ') + ' ' + sentence
            charOffset += content.length
          }
        } else {
          sentenceBuffer = sentenceBuffer ? sentenceBuffer + ' ' + sentence : sentence
        }
      }

      if (sentenceBuffer.trim()) {
        currentChunk = currentChunk ? currentChunk + '\n\n' + sentenceBuffer : sentenceBuffer
      }
    } else {
      const combined = currentChunk ? currentChunk + '\n\n' + paragraph : paragraph
      const wordCount = combined.split(/\s+/).length

      if (wordCount >= chunkSize && currentChunk) {
        const content = currentChunk.trim()
        if (content) {
          chunks.push({
            content,
            index: chunkIndex++,
            wordCount: content.split(/\s+/).length,
            metadata: { source, title, startChar: currentStart, endChar: currentStart + content.length },
          })
          const overlapWords = currentChunk.split(/\s+/).slice(-overlap)
          currentChunk = overlapWords.join(' ') + '\n\n' + paragraph
          currentStart = charOffset
          charOffset += content.length
        }
      } else {
        currentChunk = combined
      }
    }
  }

  if (currentChunk.trim()) {
    const content = currentChunk.trim()
    chunks.push({
      content,
      index: chunkIndex++,
      wordCount: content.split(/\s+/).length,
      metadata: { source, title, startChar: currentStart, endChar: currentStart + content.length },
    })
  }

  return chunks.filter(c => c.wordCount >= 10)
}

export function extractMarkdownSections(markdown: string): Array<{ title: string; content: string }> {
  const sections: Array<{ title: string; content: string }> = []
  const lines = markdown.split('\n')
  let currentTitle = 'Introduction'
  let currentContent: string[] = []

  for (const line of lines) {
    if (line.match(/^#+\s/)) {
      if (currentContent.join('\n').trim()) {
        sections.push({ title: currentTitle, content: currentContent.join('\n').trim() })
      }
      currentTitle = line.replace(/^#+\s/, '')
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }

  if (currentContent.join('\n').trim()) {
    sections.push({ title: currentTitle, content: currentContent.join('\n').trim() })
  }

  return sections
}
