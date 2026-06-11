import Link from "next/link";
import { ArrowRight, Sparkles, Zap, BarChart3, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-tr from-primary to-secondary rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">MarketingAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#about" className="hover:text-primary transition-colors">About</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden md:flex text-sm font-medium hover:text-primary transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/onboarding"
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-primary/25 flex items-center gap-2 group"
            >
              Get Started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-8 border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            AI-Powered Marketing for Startups
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Your Virtual <br />
            <span className="text-gradient">Social Media Manager</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Create, schedule, and optimize your social media content in seconds.
            No marketing team required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              href="/onboarding"
              className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-white text-lg font-medium flex items-center justify-center transition-all shadow-xl shadow-primary/20 w-full sm:w-auto"
            >
              Start for Free
            </Link>
            <button className="h-12 px-8 rounded-full border border-border bg-card hover:bg-muted text-foreground text-lg font-medium transition-colors w-full sm:w-auto">
              View Demo
            </button>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-yellow-500" />}
              title="Instant Content"
              description="Generate captions, hashtags, and visuals tailored to your brand voice instantly."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6 text-blue-500" />}
              title="Smart Scheduling"
              description="Auto-schedule posts at peak times for maximum engagement across all platforms."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-green-500" />}
              title="Deep Analytics"
              description="Track performance and improve your strategy with data-driven insights."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2025 MarketingAI. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors shadow-sm cursor-default">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
