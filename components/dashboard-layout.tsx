"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSupabase } from "./supabase-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, LayoutDashboard, LogOut, Menu, Settings, Trophy, User, MessageSquare } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { supabase } = useSupabase()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)

        // Check if user is admin or content curator
        const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single()

        if (profile) {
          setUserRole(profile.role)
          if (profile.role === "admin") {
            setIsAdmin(true)
          }
        }
      }
    }

    fetchUserData()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    ...(userRole === "content_curator"
      ? [
        {
          title: "Discussions",
          href: "/discussions",
          icon: <MessageSquare className="h-5 w-5" />,
        },
      ]
      : []),
    ...(userRole === "learner"
      ? [
        {
          title: "My Roadmaps",
          href: "/roadmaps",
          icon: <BookOpen className="h-5 w-5" />,
        },
      ]
      : []),
    ...(userRole === "learner"
      ? [
        {
          title: "Achievements",
          href: "/achievements",
          icon: <Trophy className="h-5 w-5" />,
        },
      ]
      : []),

    {
      title: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5" />,
    },
  ]

  const adminItems = [
    {
      name: "Manage Roadmaps",
      href: "/admin/roadmaps",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      name: "Manage Resources",
      href: "/admin/resources",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
        <div className="flex h-16 items-center justify-between w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                <Link href="/" className="flex items-center gap-2 py-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">SkillKart</span>
                </Link>
                <nav className="grid gap-1 py-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
                      )}
                    >
                      {item.icon}
                      {item.title}
                    </Link>
                  ))}
                  {isAdmin && (
                    <>
                      <div className="my-2 h-px bg-border" />
                      <p className="px-3 py-1 text-xs font-medium text-muted-foreground">Admin</p>
                      {adminItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                            pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
                          )}
                        >
                          {item.icon}
                          {item.name}
                        </Link>
                      ))}
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold hidden md:inline-block">SkillKart</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="User" />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-background md:block">
          <nav className="grid gap-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
            {isAdmin && (
              <>
                <div className="my-2 h-px bg-border" />
                <p className="px-3 py-1 text-xs font-medium text-muted-foreground">Admin</p>
                {adminItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
