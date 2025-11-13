export type ApiResponse<T> = {
  ok: boolean
  data?: T
  error?: { code: string; message: string }
}

export type Paginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export type ReviewSnippet = {
  id: string
  authorMask: string
  content: string
  ts: string
}

export type PropertyCard = {
  id: string
  title: string
  price: number
  communityId: string
  communityName: string
  cover: string
  highlights?: string[]
  reviewsTop2: ReviewSnippet[]
}

export type CommunityPreview = {
  id: string
  name: string
  cover: string
  score: number
  reviewCount: number
  location: string
}

export type AiMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  action?: AiAction
}

export type AiAskReq = {
  messages: AiMessage[]
}

export type AiAskRes = {
  answers: string[]
  recommends?: PropertyCard[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// AI 特殊操作類型
export type AiAction =
  | { type: 'community_post_refine'; data: PostRefineData }
  | { type: 'navigate_listings'; data: NavigateData }
  | { type: 'scroll_to'; data: ScrollToData }
  | { type: 'invite_text'; data: InviteTextData }

export type PostRefineData = {
  original: string
  options: Array<{
    style: 'normal' | 'calm'
    title: string
    body: string
  }>
}

export type NavigateData = {
  target: 'community' | 'area'
  params: Record<string, string>
}

export type ScrollToData = {
  target: string
}

export type InviteTextData = {
  text: string
  propertyId?: string
}
