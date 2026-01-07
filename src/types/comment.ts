export interface FeedComment {
  id: string | number;
  postId: string | number;
  author: string;
  role: "resident" | "member" | "agent" | "official";
  content: string;
  time: string;
  likes: number;
  isLiked?: boolean;
}
