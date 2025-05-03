export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          interests: string[]
          learning_goals: string
          weekly_learning_time: number
          role: "learner" | "admin"
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          interests?: string[]
          learning_goals?: string
          weekly_learning_time?: number
          role?: "learner" | "admin"
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          interests?: string[]
          learning_goals?: string
          weekly_learning_time?: number
          role?: "learner" | "admin"
        }
      }
      roadmaps: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          skill_category: string
          duration_weeks: number
          created_by: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          skill_category: string
          duration_weeks?: number
          created_by: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          skill_category?: string
          duration_weeks?: number
          created_by?: string
        }
      }
      user_roadmaps: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          roadmap_id: string
          start_date: string
          completed: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          roadmap_id: string
          start_date?: string
          completed?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          roadmap_id?: string
          start_date?: string
          completed?: boolean
        }
      }
      modules: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          roadmap_id: string
          title: string
          description: string
          week_number: number
          xp_reward: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          roadmap_id: string
          title: string
          description: string
          week_number: number
          xp_reward?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          roadmap_id?: string
          title?: string
          description?: string
          week_number?: number
          xp_reward?: number
        }
      }
      user_progress: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          module_id: string
          status: "not_started" | "in_progress" | "completed"
          completed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          module_id: string
          status?: "not_started" | "in_progress" | "completed"
          completed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          module_id?: string
          status?: "not_started" | "in_progress" | "completed"
          completed_at?: string | null
        }
      }
      resources: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          module_id: string
          title: string
          description: string
          type: "video" | "blog" | "quiz" | "file"
          url: string
          file_path: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          module_id: string
          title: string
          description: string
          type: "video" | "blog" | "quiz" | "file"
          url?: string
          file_path?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          module_id?: string
          title?: string
          description?: string
          type?: "video" | "blog" | "quiz" | "file"
          url?: string
          file_path?: string | null
        }
      }
      discussions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          module_id: string
          title: string
          content: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          module_id: string
          title: string
          content: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          module_id?: string
          title?: string
          content?: string
          user_id?: string
        }
      }
      comments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          discussion_id: string
          content: string
          user_id: string
          parent_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          discussion_id: string
          content: string
          user_id: string
          parent_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          discussion_id?: string
          content?: string
          user_id?: string
          parent_id?: string | null
        }
      }
      badges: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string
          image_url: string
          badge_type: "streak" | "progress" | "mastery"
          requirement: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description: string
          image_url: string
          badge_type: "streak" | "progress" | "mastery"
          requirement: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string
          image_url?: string
          badge_type?: "streak" | "progress" | "mastery"
          requirement?: number
        }
      }
      user_badges: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          badge_id?: string
          earned_at?: string
        }
      }
      xp_transactions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          amount: number
          description: string
          module_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          amount: number
          description: string
          module_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          amount?: number
          description?: string
          module_id?: string | null
        }
      }
    }
  }
}
