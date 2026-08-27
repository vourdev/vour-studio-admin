export interface CarouselTopic {
  id: string | number
  title: string
  brief?: string | null
  pillar?: string | null
  category?: string | null
  target_audience?: string | null
  key_takeaways?: string[] | string | null
  tags?: string[] | string | null
  [key: string]: any
}

export interface FetchTopicResponse {
  topic?: CarouselTopic | null
  data?: CarouselTopic | null
  id?: string | number
  title?: string
  message?: string
  [key: string]: any
}

function getServiceConfig() {
  const backendUrl = (process.env.CAROUSEL_BACKEND_URL || 'http://localhost:3001').replace(/\/+$/, '')
  const serviceKey = process.env.VOURDEV_SERVICE_KEY || '3u820qD0ZIPTI6dRDmmvQ3hWh8jNLa5W7slDkp/oBhs='
  return { backendUrl, serviceKey }
}

/**
 * TASK 2: Fetch next available topic for blog generation from Topic Bank.
 */
export async function fetchNextTopicForBlog(): Promise<CarouselTopic | null> {
  const { backendUrl, serviceKey } = getServiceConfig()

  if (!serviceKey) {
    throw new Error('VOURDEV_SERVICE_KEY belum dikonfigurasi di environment variables.')
  }

  const endpoint = `${backendUrl}/api/topics/next-for-blog`

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (res.status === 404) {
      return null
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(`Gagal mengambil topik (${res.status}): ${errBody || res.statusText}`)
    }

    const data = (await res.json()) as FetchTopicResponse

    // Normalize topic response
    if (data && typeof data === 'object') {
      if (data.topic) return data.topic
      if (data.data) return data.data
      if (data.id && data.title) return data as CarouselTopic
    }

    return null
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Tidak dapat terhubung ke Carousel Backend di ${backendUrl}. Pastikan server carousel aktif.`
      )
    }
    throw error
  }
}

/**
 * TASK 5: Update blog status back to Carousel Backend Topic Bank.
 */
export async function updateTopicBlogStatus(
  topicId: string | number,
  status: 'published' | 'generated' | 'draft' | 'skipped' = 'published',
  metadata?: {
    slug?: string
    blogPostId?: string | number
    [key: string]: any
  }
): Promise<{ success: boolean; data?: any }> {
  const { backendUrl, serviceKey } = getServiceConfig()

  if (!serviceKey) {
    throw new Error('VOURDEV_SERVICE_KEY belum dikonfigurasi.')
  }

  const endpoint = `${backendUrl}/api/topics/${topicId}/blog-status`

  try {
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blog_status: status,
        status: status,
        blog_slug: metadata?.slug,
        blog_post_id: metadata?.blogPostId,
        ...metadata,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.warn(`[carousel-backend] Warning: Status update gagal (${res.status}): ${errBody}`)
      return { success: false }
    }

    const json = await res.json().catch(() => ({}))
    return { success: true, data: json }
  } catch (error) {
    console.error(`[carousel-backend] Gagal update status topik #${topicId}:`, error)
    return { success: false }
  }
}
