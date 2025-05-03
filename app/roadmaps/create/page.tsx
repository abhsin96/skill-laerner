"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2, Upload } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import Link from "next/link"

interface Module {
  title: string
  description: string
  week_number: number
  xp_reward: number
  resources: Resource[]
}

interface Resource {
  title: string
  description: string
  type: "blog" | "quiz" | "video"
  url: string
  videoFile?: File | null
}

export default function CreateRoadmapPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill_category: "",
    duration_weeks: 1,
  })
  const [modules, setModules] = useState<Module[]>([
    {
      title: "",
      description: "",
      week_number: 1,
      xp_reward: 100,
      resources: [],
    },
  ])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addModule = () => {
    setModules((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        week_number: prev.length + 1,
        xp_reward: 100,
        resources: [],
      },
    ])
  }

  const removeModule = (index: number) => {
    setModules((prev) => prev.filter((_, i) => i !== index))
  }

  const handleModuleChange = (index: number, field: keyof Module, value: any) => {
    setModules((prev) =>
      prev.map((module, i) =>
        i === index ? { ...module, [field]: value } : module
      )
    )
  }

  const addResource = (moduleIndex: number) => {
    setModules((prev) =>
      prev.map((module, i) =>
        i === moduleIndex
          ? {
              ...module,
              resources: [
                ...module.resources,
                {
                  title: "",
                  description: "",
                  type: "blog",
                  url: "",
                  videoFile: null,
                },
              ],
            }
          : module
      )
    )
  }

  const removeResource = (moduleIndex: number, resourceIndex: number) => {
    setModules((prev) =>
      prev.map((module, i) =>
        i === moduleIndex
          ? {
              ...module,
              resources: module.resources.filter((_, j) => j !== resourceIndex),
            }
          : module
      )
    )
  }

  const handleResourceChange = (
    moduleIndex: number,
    resourceIndex: number,
    field: keyof Resource,
    value: any
  ) => {
    setModules((prev) =>
      prev.map((module, i) =>
        i === moduleIndex
          ? {
              ...module,
              resources: module.resources.map((resource, j) =>
                j === resourceIndex ? { ...resource, [field]: value } : resource
              ),
            }
          : module
      )
    )
  }

  const handleVideoFileChange = async (
    moduleIndex: number,
    resourceIndex: number,
    file: File
  ) => {
    // Just store the file temporarily
    handleResourceChange(moduleIndex, resourceIndex, "videoFile", file)
    // Set a temporary URL for preview
    handleResourceChange(moduleIndex, resourceIndex, "url", URL.createObjectURL(file))
  }

  const uploadVideo = async (file: File): Promise<string> => {
    // Sanitize filename: remove spaces and special characters
    const sanitizedFileName = `${Date.now()}-${file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .toLowerCase()}` // Convert to lowercase

    const { error: uploadError } = await supabase.storage
      .from("contentvideo")
      .upload(sanitizedFileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from("contentvideo")
      .getPublicUrl(sanitizedFileName)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirmation(true)
  }

  const handleConfirmCreate = async () => {
    try {
      setIsCreating(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      // Create roadmap
      const { data: roadmapData, error: roadmapError } = await supabase
        .from("roadmaps")
        .insert({
          title: formData.title,
          description: formData.description,
          skill_category: formData.skill_category,
          duration_weeks: formData.duration_weeks,
          created_by: user.id
        })
        .select()
        .single()

      if (roadmapError) throw roadmapError

      // Create modules
      for (const module of modules) {
        const { data: moduleData, error: moduleError } = await supabase
          .from("modules")
          .insert({
            roadmap_id: roadmapData.id,
            title: module.title,
            description: module.description,
            week_number: module.week_number,
            xp_reward: module.xp_reward
          })
          .select()
          .single()

        if (moduleError) throw moduleError

        // Create resources
        for (const resource of module.resources) {
          let resourceUrl = resource.url
          
          // If it's a video resource with a file, upload it
          if (resource.type === "video" && resource.videoFile) {
            const sanitizedFileName = `${Date.now()}-${resource.videoFile.name
              .replace(/[^a-zA-Z0-9.-]/g, '_')
              .replace(/\s+/g, '_')
              .toLowerCase()}`

            const { error: uploadError } = await supabase.storage
              .from("contentvideo")
              .upload(sanitizedFileName, resource.videoFile, {
                cacheControl: "3600",
                upsert: false,
              })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
              .from("contentvideo")
              .getPublicUrl(sanitizedFileName)

            resourceUrl = publicUrl
          }

          const { error: resourceError } = await supabase
            .from("resources")
            .insert({
              title: resource.title,
              description: resource.description,
              type: resource.type,
              url: resourceUrl,
              module_id: moduleData.id,
            })

          if (resourceError) throw resourceError
        }
      }

      toast({
        title: "Roadmap created",
        description: "Your roadmap has been created successfully",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error creating roadmap",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
      setShowConfirmation(false)
    }
  }

  return (
    <DashboardLayout>
      {isCreating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Creating Roadmap...</p>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
          </div>
        </div>
      )}
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Roadmap</h1>
            <p className="text-muted-foreground">Design a comprehensive learning path for your students</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Roadmap Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Web Development Fundamentals"
                  required
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what students will learn in this roadmap"
                  required
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill_category">Skill Category</Label>
                <Select
                  value={formData.skill_category}
                  onValueChange={(value) => setFormData({ ...formData, skill_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Web Development">Web Development</SelectItem>
                    <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                    <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                    <SelectItem value="DevOps">DevOps</SelectItem>
                    <SelectItem value="Cloud Computing">Cloud Computing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_weeks">Duration (weeks)</Label>
                <Input
                  id="duration_weeks"
                  name="duration_weeks"
                  type="number"
                  min="1"
                  required
                  value={formData.duration_weeks}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Modules</h2>
              <Button type="button" variant="outline" onClick={addModule}>
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>

            {modules.map((module, moduleIndex) => (
              <Card key={moduleIndex}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Module {moduleIndex + 1}</CardTitle>
                    {modules.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeModule(moduleIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={module.title}
                      onChange={(e) => handleModuleChange(moduleIndex, "title", e.target.value)}
                      placeholder="Module title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={module.description}
                      onChange={(e) => handleModuleChange(moduleIndex, "description", e.target.value)}
                      placeholder="Module description"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Week Number</Label>
                      <Input
                        type="number"
                        min="1"
                        value={module.week_number}
                        onChange={(e) => handleModuleChange(moduleIndex, "week_number", parseInt(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>XP Reward</Label>
                      <Input
                        type="number"
                        min="0"
                        value={module.xp_reward}
                        onChange={(e) => handleModuleChange(moduleIndex, "xp_reward", parseInt(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Resources</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addResource(moduleIndex)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    </div>

                    {module.resources.map((resource, resourceIndex) => (
                      <Card key={resourceIndex}>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input
                                value={resource.title}
                                onChange={(e) =>
                                  handleResourceChange(
                                    moduleIndex,
                                    resourceIndex,
                                    "title",
                                    e.target.value
                                  )
                                }
                                placeholder="Resource title"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                value={resource.description}
                                onChange={(e) =>
                                  handleResourceChange(
                                    moduleIndex,
                                    resourceIndex,
                                    "description",
                                    e.target.value
                                  )
                                }
                                placeholder="Resource description"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Type</Label>
                              <Select
                                value={resource.type}
                                onValueChange={(value) =>
                                  handleResourceChange(
                                    moduleIndex,
                                    resourceIndex,
                                    "type",
                                    value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="blog">Blog Post</SelectItem>
                                  <SelectItem value="quiz">Quiz</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {resource.type === "video" ? (
                              <div className="space-y-2">
                                <Label>Video File</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        handleVideoFileChange(moduleIndex, resourceIndex, file)
                                      }
                                    }}
                                    required
                                  />
                                  {resource.url && (
                                    <span className="text-sm text-muted-foreground">
                                      {resource.videoFile?.name || "Video selected"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                  value={resource.url}
                                  onChange={(e) =>
                                    handleResourceChange(
                                      moduleIndex,
                                      resourceIndex,
                                      "url",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Resource URL"
                                  required
                                />
                              </div>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeResource(moduleIndex, resourceIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Link href="/roadmaps">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isCreating}>
              Create Roadmap
            </Button>
          </div>
        </form>

        <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Roadmap Creation</AlertDialogTitle>
              <AlertDialogDescription>
                Please review the following details before creating your roadmap:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-4 space-y-2">
              <div>
                <h4 className="font-medium">Roadmap Details</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>Title: {formData.title}</li>
                  <li>Category: {formData.skill_category}</li>
                  <li>Duration: {formData.duration_weeks} weeks</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Modules ({modules.length})</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {modules.map((module, index) => (
                    <li key={index}>
                      Week {module.week_number}: {module.title} ({module.resources.length} resources)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCreating}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmCreate}
                disabled={isCreating}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Roadmap"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
} 