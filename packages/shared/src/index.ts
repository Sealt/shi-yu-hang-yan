export type ReviewType = 'takeout' | 'dine_in'
export type Rating = '好吃' | '难吃'
export type VoteType = 'agree' | 'disagree'
export type SortMode = 'date' | 'likes' | 'comments'

export interface Review {
  id: number
  type: ReviewType
  restaurant_name: string
  rating: Rating
  content: string
  agree_count: number
  disagree_count: number
  is_visible: number
  is_deleted: number
  created_at: string
  comment_count?: number
}

export interface Comment {
  id: number
  review_id: number
  content: string
  is_deleted: number
  created_at: string
  /** Present on admin list endpoints */
  restaurant_name?: string
  review_type?: ReviewType
}

export interface PaginatedReviews {
  reviews: Review[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface PaginatedComments {
  comments: Comment[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface CreateReviewInput {
  type: ReviewType
  restaurant_name: string
  rating: Rating
  content: string
}

export interface CreateCommentInput {
  content: string
}

export interface VoteInput {
  vote_type: VoteType
  voter_id: string
}

export interface MenuItem {
  name: string
  price: string
  spec?: string
}

export interface MenuCategory {
  name: string
  items: MenuItem[]
}

export interface StoreMenu {
  name: string
  updatedAt: string
  categories: MenuCategory[]
  note?: string
}

export interface ApiError {
  error: string
}

export interface SiteStats {
  total_visitors: number
  online_users: number
}
