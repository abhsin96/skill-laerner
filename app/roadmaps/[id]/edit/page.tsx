"use client"

import { useEffect, useState, use } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Plus, Trash2, GripVertical } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from "@hello-pangea/dnd"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

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

interface Resource {
  id?: string
  title: string
  description: string
  type: "blog" | "quiz" | "video"
  url: string
  videoFile?: File | null
}

interface Module {
  id: string
  title: string
  description: string
  week_number: number
  xp_reward: number
  resources: Resource[]
}

interface Roadmap {
  id: string
  title: string
  description: string
  skill_category: string
  duration_weeks: number
}

export default function EditRoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill_category: "",
    duration_weeks: 0
  })
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    week_number: 1,
    xp_reward: 100,
    resources: [] as Resource[]
  })
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchRoadmapData()
  }, [resolvedParams.id])

  const fetchRoadmapData = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      // Check if user is a content curator
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      if (!profile || profile.role !== "content_curator") {
        router.push("/roadmaps")
        return
      }

      // Get roadmap details
      const { data: roadmapData } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("id", resolvedParams.id)
        .single()

      if (!roadmapData) {
        router.push("/roadmaps")
        return
      }

      // Get modules
      const { data: modulesData } = await supabase
        .from("modules")
        .select("*")
        .eq("roadmap_id", resolvedParams.id)
        .order("week_number", { ascending: true })

      setRoadmap(roadmapData)
      setModules(modulesData || [])
      setFormData({
        title: roadmapData.title,
        description: roadmapData.description || "",
        skill_category: roadmapData.skill_category,
        duration_weeks: roadmapData.duration_weeks
      })
    } catch (error) {
      toast({
        title: "Error loading roadmap",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("roadmaps")
        .update({
          title: formData.title,
          description: formData.description,
          skill_category: formData.skill_category,
          duration_weeks: formData.duration_weeks
        })
        .eq("id", resolvedParams.id)

      if (error) throw error

      toast({
        title: "Roadmap updated",
        description: "Your changes have been saved successfully",
      })

      router.push(`/dashboard`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error updating roadmap",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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
    handleResourceChange(moduleIndex, resourceIndex, "videoFile", file)
    handleResourceChange(moduleIndex, resourceIndex, "url", URL.createObjectURL(file))
  }

  const handleAddModule = async () => {
    try {
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .insert({
          roadmap_id: resolvedParams.id,
          title: newModule.title,
          description: newModule.description,
          week_number: newModule.week_number,
          xp_reward: newModule.xp_reward
        })
        .select()
        .single()

      if (moduleError) throw moduleError

      // Create resources
      for (const resource of newModule.resources) {
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

      toast({
        title: "Module added",
        description: "The new module has been added successfully",
      })

      setNewModule({
        title: "",
        description: "",
        week_number: modules.length + 1,
        xp_reward: 100,
        resources: []
      })
      setIsAddingModule(false)
      fetchRoadmapData()
    } catch (error: any) {
      toast({
        title: "Error adding module",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    try {
      // First, delete all resources for this module
      const { error: resourcesError } = await supabase
        .from("resources")
        .delete()
        .eq("module_id", moduleId)

      if (resourcesError) throw resourcesError

      // Then delete all user progress records for this module
      const { error: progressError } = await supabase
        .from("user_progress")
        .delete()
        .eq("module_id", moduleId)

      if (progressError) throw progressError

      // Finally delete the module
      const { error: moduleError } = await supabase
        .from("modules")
        .delete()
        .eq("id", moduleId)

      if (moduleError) throw moduleError

      toast({
        title: "Module deleted",
        description: "The module and all its associated content have been removed successfully",
      })

      fetchRoadmapData()
    } catch (error: any) {
      toast({
        title: "Error deleting module",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(modules)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update week numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      week_number: index + 1
    }))

    setModules(updatedItems)

    // Update in database
    try {
      const updates = updatedItems.map(item => 
        supabase
          .from("modules")
          .update({ week_number: item.week_number })
          .eq("id", item.id)
      )

      await Promise.all(updates)
    } catch (error: any) {
      toast({
        title: "Error updating module order",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
      fetchRoadmapData() // Revert to original order
    }
  }

  const handleDeleteRoadmap = async () => {
    try {
      setIsDeleting(true)

      // First, get all modules to find video resources
      const { data: modulesData } = await supabase
        .from("modules")
        .select(`
          id,
          resources (
            id,
            type,
            url
          )
        `)
        .eq("roadmap_id", resolvedParams.id)

      if (modulesData) {
        // Get array of module IDs
        const moduleIds = modulesData.map(m => m.id)

        // Delete video files from storage
        for (const module of modulesData) {
          for (const resource of module.resources || []) {
            if (resource.type === "video" && resource.url) {
              // Extract filename from URL
              const filename = resource.url.split("/").pop()
              if (filename) {
                await supabase.storage
                  .from("contentvideo")
                  .remove([filename])
              }
            }
          }
        }

        // Delete XP transactions first
        const { error: xpTransactionsError } = await supabase
          .from("xp_transactions")
          .delete()
          .in("module_id", moduleIds)

        if (xpTransactionsError) throw xpTransactionsError

        // Delete all resources using in operator
        const { error: resourcesError } = await supabase
          .from("resources")
          .delete()
          .in("module_id", moduleIds)

        if (resourcesError) throw resourcesError

        // Delete all user progress using in operator
        const { error: progressError } = await supabase
          .from("user_progress")
          .delete()
          .in("module_id", moduleIds)

        if (progressError) throw progressError

        // Delete all modules
        const { error: modulesError } = await supabase
          .from("modules")
          .delete()
          .eq("roadmap_id", resolvedParams.id)

        if (modulesError) throw modulesError

        // Delete user roadmaps
        const { error: userRoadmapsError } = await supabase
          .from("user_roadmaps")
          .delete()
          .eq("roadmap_id", resolvedParams.id)

        if (userRoadmapsError) throw userRoadmapsError

        // Finally delete the roadmap
        const { error: roadmapError } = await supabase
          .from("roadmaps")
          .delete()
          .eq("id", resolvedParams.id)

        if (roadmapError) throw roadmapError

        toast({
          title: "Roadmap deleted",
          description: "The roadmap and all its associated content have been removed successfully",
        })

        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: any) {
      toast({
        title: "Error deleting roadmap",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container p-4 md:p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {isDeleting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Deleting Roadmap...</p>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
          </div>
        </div>
      )}
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/roadmaps/${resolvedParams.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Edit Roadmap</h1>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Roadmap"
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this roadmap?</AlertDialogTitle>
                {/* <AlertDialogDescription> */}
                  This action cannot be undone. This will permanently delete the roadmap and all its associated content including:
                  <ul className="list-disc list-inside mt-2">
                    <li>All modules and their content</li>
                    <li>All video resources</li>
                    <li>User progress data</li>
                    <li>Discussion threads</li>
                  </ul>
                {/* </AlertDialogDescription> */}
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteRoadmap}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Roadmap"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the roadmap's basic details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Enter roadmap title"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Describe what learners will achieve in this roadmap"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="skill_category" className="text-sm font-medium">
                    Skill Category
                  </label>
                  <Select
                    value={formData.skill_category}
                    onValueChange={(value) => setFormData({ ...formData, skill_category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a skill category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="duration_weeks" className="text-sm font-medium">
                    Duration (weeks)
                  </label>
                  <Input
                    id="duration_weeks"
                    type="number"
                    min="1"
                    value={formData.duration_weeks}
                    onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                    required
                    placeholder="Enter number of weeks"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Link href={`/roadmaps/${resolvedParams.id}`}>
                    <Button variant="outline">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>How your roadmap will appear to learners</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">{formData.title || "Roadmap Title"}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.description || "Roadmap description will appear here"}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">Category:</span>
                <span>{formData.skill_category || "Not selected"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">Duration:</span>
                <span>{formData.duration_weeks || 0} weeks</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Modules</CardTitle>
                <CardDescription>Manage the learning modules for this roadmap</CardDescription>
              </div>
              <Button onClick={() => setIsAddingModule(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isAddingModule && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Add New Module</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="module-title" className="text-sm font-medium">
                      Title
                    </label>
                    <Input
                      id="module-title"
                      value={newModule.title}
                      onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                      placeholder="Enter module title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="module-description" className="text-sm font-medium">
                      Description
                    </label>
                    <Textarea
                      id="module-description"
                      value={newModule.description}
                      onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                      placeholder="Describe what learners will learn in this module"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="module-week" className="text-sm font-medium">
                        Week Number
                      </label>
                      <Input
                        id="module-week"
                        type="number"
                        min="1"
                        value={newModule.week_number}
                        onChange={(e) => setNewModule({ ...newModule, week_number: parseInt(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="module-xp" className="text-sm font-medium">
                        XP Reward
                      </label>
                      <Input
                        id="module-xp"
                        type="number"
                        min="0"
                        value={newModule.xp_reward}
                        onChange={(e) => setNewModule({ ...newModule, xp_reward: parseInt(e.target.value) })}
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
                        onClick={() => setNewModule({
                          ...newModule,
                          resources: [
                            ...newModule.resources,
                            {
                              title: "",
                              description: "",
                              type: "blog",
                              url: "",
                              videoFile: null,
                            },
                          ],
                        })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    </div>

                    {newModule.resources.map((resource, resourceIndex) => (
                      <Card key={resourceIndex}>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input
                                value={resource.title}
                                onChange={(e) => {
                                  const updatedResources = [...newModule.resources]
                                  updatedResources[resourceIndex] = {
                                    ...resource,
                                    title: e.target.value
                                  }
                                  setNewModule({ ...newModule, resources: updatedResources })
                                }}
                                placeholder="Resource title"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                value={resource.description}
                                onChange={(e) => {
                                  const updatedResources = [...newModule.resources]
                                  updatedResources[resourceIndex] = {
                                    ...resource,
                                    description: e.target.value
                                  }
                                  setNewModule({ ...newModule, resources: updatedResources })
                                }}
                                placeholder="Resource description"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Type</Label>
                              <Select
                                value={resource.type}
                                onValueChange={(value) => {
                                  const updatedResources = [...newModule.resources]
                                  updatedResources[resourceIndex] = {
                                    ...resource,
                                    type: value as "blog" | "quiz" | "video"
                                  }
                                  setNewModule({ ...newModule, resources: updatedResources })
                                }}
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
                                        const updatedResources = [...newModule.resources]
                                        updatedResources[resourceIndex] = {
                                          ...resource,
                                          videoFile: file,
                                          url: URL.createObjectURL(file)
                                        }
                                        setNewModule({ ...newModule, resources: updatedResources })
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
                                  onChange={(e) => {
                                    const updatedResources = [...newModule.resources]
                                    updatedResources[resourceIndex] = {
                                      ...resource,
                                      url: e.target.value
                                    }
                                    setNewModule({ ...newModule, resources: updatedResources })
                                  }}
                                  placeholder="Resource URL"
                                  required
                                />
                              </div>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updatedResources = newModule.resources.filter((_, i) => i !== resourceIndex)
                                setNewModule({ ...newModule, resources: updatedResources })
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingModule(false)
                        setNewModule({
                          title: "",
                          description: "",
                          week_number: modules.length + 1,
                          xp_reward: 100,
                          resources: []
                        })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddModule}>Add Module</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="modules">
                {(provided: DroppableProvided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {modules.map((module, index) => (
                      <Draggable key={module.id} draggableId={module.id} index={index}>
                        {(provided: DraggableProvided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-start gap-4 p-4 border rounded-lg bg-card"
                          >
                            <div {...provided.dragHandleProps} className="mt-1">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium">Week {module.week_number}: {module.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteModule(module.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <span>XP Reward: {module.xp_reward}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {modules.length === 0 && !isAddingModule && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No modules added yet. Click "Add Module" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 