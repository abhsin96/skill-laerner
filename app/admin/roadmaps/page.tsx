import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
import Link from "next/link"

export default async function AdminRoadmapsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", session.user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Get all roadmaps
  const { data: roadmaps } = await supabase.from("roadmaps").select("*").order("created_at", { ascending: false })

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manage Roadmaps</h1>
            <p className="text-muted-foreground">Create and edit learning roadmaps</p>
          </div>
          <Link href="/admin/roadmaps/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Roadmap
            </Button>
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search roadmaps..." className="pl-10" />
        </div>

        <div className="space-y-4">
          {roadmaps && roadmaps.length > 0 ? (
            <div className="grid gap-4">
              {roadmaps.map((roadmap) => (
                <Card key={roadmap.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{roadmap.title}</CardTitle>
                        <CardDescription>{roadmap.skill_category}</CardDescription>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(roadmap.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{roadmap.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-medium">{roadmap.duration_weeks} weeks</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/admin/roadmaps/${roadmap.id}/modules`}>
                          <Button variant="outline" size="sm">
                            Manage Modules
                          </Button>
                        </Link>
                        <Link href={`/admin/roadmaps/${roadmap.id}/edit`}>
                          <Button size="sm">Edit Roadmap</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No roadmaps found</h3>
              <p className="text-muted-foreground mb-6">Create your first roadmap to get started</p>
              <Link href="/admin/roadmaps/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Roadmap
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
