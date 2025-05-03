import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, BookOpen, Target, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b w-full">
        <div className="flex items-center justify-between w-full h-20 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SkillKart</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Master New Skills with Personalized Learning</h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              SkillKart creates customized learning roadmaps tailored to your goals, interests, and schedule.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start Learning Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16 bg-muted">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How SkillKart Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Set Your Goals</h3>
                <p className="text-muted-foreground">
                  Tell us what you want to learn and how much time you can commit each week.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Follow Your Roadmap</h3>
                <p className="text-muted-foreground">
                  Get a personalized 10-week learning plan with curated resources and structured modules.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Learn Together</h3>
                <p className="text-muted-foreground">
                  Connect with peers, discuss challenges, and earn badges as you progress.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="mt-auto border-t py-8">
        <div className="container text-center text-muted-foreground">
          <p>© 2024 SkillKart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
