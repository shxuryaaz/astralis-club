export interface UserProfile {
  id: string
  name: string
  email: string
  approved: boolean
  role: 'admin' | 'member'
  created_at: string
}

export interface Hackathon {
  id: string
  title: string
  date: string
  mode: 'online' | 'offline'
  description: string
  created_at: string
}

export interface Message {
  id: string
  user_id: string
  sender_name: string
  content: string
  created_at: string
}
