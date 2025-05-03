"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { toast } from "@/components/ui/use-toast"

const SKILL_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Data Science",
  "Machine Learning",
  "DevOps",
  "Cloud Computing",
  "Cybersecurity",
  "Blockchain",
  "Game Development",
  "Digital Marketing",
  "Product Management",
]

interface RoadmapFormProps {
  userId: string
  roadmap?: any
}

export default function RoadmapForm({ userId, roadmap }: RoadmapFormProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: roadmap?.title || "",
    description: roadmap?.description || "",
    skill_category: roadmap?.skill_category || "",
    duration_weeks: roadmap?.duration_weeks || 10,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.description.trim()) {
      toast({
        title: "Description is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.skill_category) {
      toast({
        title: "Skill category is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (roadmap) {
        // Update existing roadmap
        const { error } = await supabase
          .from("roadmaps")
          .update({
            title: formData.title,
            description: formData.description,
            skill_category: formData.skill_category,
            duration_weeks: formData.duration_weeks,
          })
          .eq("id", roadmap.id);

        if (error) {
          throw error;
        }

        toast({
          title: "Roadmap updated successfully",
        });
        
        router.push("/admin/roadmaps");
      } else {
        // Create new roadmap
        const { data, error } = await supabase
          .from("roadmaps")
          .insert({
            title: formData.title,
            description: formData.description,
            skill_category: formData.skill_category,
            \
