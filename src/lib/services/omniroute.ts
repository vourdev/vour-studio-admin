import type { CarouselTopic } from './carousel-backend'

export interface GeneratedBlogArticle {
  title: string
  content: string
  description: string
  category: string
  readingMinutes: number
}

function getOmnirouteConfig() {
  const apiKey = process.env.OMNIROUTE_API_KEY || ''
  const baseUrl = (process.env.OMNIROUTE_BASE_URL || 'https://api.omniroute.com/v1').replace(/\/+$/, '')
  const model = process.env.OMNIROUTE_MODEL || 'claude-3-5-sonnet'
  return { apiKey, baseUrl, model }
}

const SYSTEM_PROMPT = `
Anda adalah Content Writer & Tech Strategist untuk Vour Studio (vour.dev) dengan gaya penulisan terinspirasi dari persona Muhammad Adhinugroho:
- Tone of Voice: Kasual, edukatif, profesional, lugas, dan praktikal. Hindari jargon basa-basi klise ("Di era digital yang serba cepat ini...").
- Bahasa: Bahasa Indonesia yang natural dan mengalir, dengan istilah teknis bahasa Inggris tetap dipertahankan bila relevan (misal: "deployment", "state management", "caching").
- Struktur Output:
  1. Hasilkan judul artikel yang tajam dan menggugah rasa ingin tahu (bukan clickbait murahan).
  2. Paragraf pembuka (hook) yang langsung masuk ke problem / konteks nyata.
  3. Pembahasan poin demi poin dengan Heading 2 (##) dan Heading 3 (###).
  4. Berikan contoh implementasi, analogi teknis sederhana, atau tips arsitektur.
  5. Berikan kesimpulan ringkas atau action item di akhir.
- Format Output: Kembalikan respons dalam format JSON murni:
{
  "title": "Judul Artikel",
  "description": "Ringkasan 1-2 kalimat untuk meta description dan kartu artikel",
  "category": "Tutorial" | "Case Study" | "Dev Notes",
  "readingMinutes": 5,
  "content": "Isi artikel lengkap dalam format Markdown..."
}
`.trim()

/**
 * TASK 3: Generate long-form blog article from topic via Omniroute LLM.
 */
export async function generateBlogArticle(topic: CarouselTopic): Promise<GeneratedBlogArticle> {
  const { apiKey, baseUrl, model } = getOmnirouteConfig()

  const topicContext = `
Topik: ${topic.title}
Brief: ${topic.brief || 'Ekspansi topik ini menjadi panduan praktis dan artikel mendalam.'}
Pilar / Kategori: ${topic.pillar || topic.category || 'Dev Notes'}
Target Pembaca: ${topic.target_audience || 'Software engineer, tech lead, tech enthusiast'}
Poin Utama: ${Array.isArray(topic.key_takeaways) ? topic.key_takeaways.join(', ') : topic.key_takeaways || '-'}
Tags: ${Array.isArray(topic.tags) ? topic.tags.join(', ') : topic.tags || '-'}
`.trim()

  if (!apiKey) {
    console.warn(
      '[omniroute] OMNIROUTE_API_KEY tidak disetel. Menggunakan generator template cerdas untuk pengujian.'
    )
    return generateFallbackArticle(topic)
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Buatlah artikel blog long-form berkualitas tinggi berdasarkan topik berikut:\n\n${topicContext}`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      throw new Error(`Omniroute API request failed (${res.status}): ${err}`)
    }

    const data = await res.json()
    const contentText = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(contentText) as GeneratedBlogArticle

    return {
      title: parsed.title || topic.title,
      description: parsed.description || topic.brief || 'Artikel terbaru dari Vour Studio.',
      category: parsed.category || (topic.category as any) || 'Dev Notes',
      readingMinutes: Number(parsed.readingMinutes) || 5,
      content: parsed.content || generateFallbackMarkdown(topic),
    }
  } catch (error) {
    console.error('[omniroute] Terjadi error saat memanggil Omniroute:', error)
    return generateFallbackArticle(topic)
  }
}

function generateFallbackMarkdown(topic: CarouselTopic): string {
  return `
${topic.brief || 'Membahas strategi dan implementasi teknis secara menyeluruh.'}

## Mengapa Hal Ini Penting?

Banyak tim seringkali mengabaikan aspek fundamental saat membangun arsitektur digital. Melalui pendekatan yang terstruktur, kita bisa menghindari *tech debt* yang tidak perlu dan meningkatkan skalabilitas jangka panjang.

## Pendekatan & Solusi Praktis

1. **Rancang Sebelum Menulis Kode**: Pastikan arsitektur data dan alur kerja terdefinisi dengan jelas.
2. **Otomatisasi Hal-Hal Repetitif**: Gunakan pipeline CI/CD dan sistem otomasi terintegrasi.
3. **Fokus pada Developer & User Experience**: Kode yang bersih mempermudah *maintenance* di masa depan.

## Kesimpulan

Menerapkan praktik terbaik sejak awal bukan hanya membuat sistem lebih stabil, tetapi juga mempercepat iterasi produk Anda.
`.trim()
}

function generateFallbackArticle(topic: CarouselTopic): GeneratedBlogArticle {
  return {
    title: topic.title,
    description: topic.brief || `Panduan dan ulasan mendalam mengenai ${topic.title}.`,
    category: topic.category || 'Dev Notes',
    readingMinutes: 5,
    content: generateFallbackMarkdown(topic),
  }
}
