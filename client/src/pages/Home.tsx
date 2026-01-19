import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { 
  Zap, Calendar, Brain, BarChart3, Users, Clock, 
  Shield, CheckCircle2, Star, ArrowRight, Sparkles 
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AutoPost2Market</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">FAQ</a>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Get Started</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-purple-50 via-blue-50 to-white dark:from-purple-950/20 dark:via-blue-950/20 dark:to-background">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-2 text-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Automate Your Facebook Group Marketing</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Schedule & Post to Multiple Facebook Groups Automatically
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Save hours every day with intelligent automation. Schedule posts, use spintax for content variation, 
              and manage unlimited Facebook groups from one powerful dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8">
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="text-lg px-8">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              )}
              <Button size="lg" variant="outline" className="text-lg px-8">
                Watch Demo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              7-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features for Smart Marketers</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to automate your Facebook group marketing and grow your business
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Auto-Posting</CardTitle>
                <CardDescription>
                  Post to multiple Facebook groups simultaneously with smart delays to avoid detection
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Advanced Scheduling</CardTitle>
                <CardDescription>
                  Schedule posts for one-time, daily, weekly, or custom intervals. Set it and forget it
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Brain className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Spintax Support</CardTitle>
                <CardDescription>
                  Create content variations automatically to keep your posts fresh and unique
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Track posts sent, group performance, and engagement metrics in real-time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Unlimited Groups</CardTitle>
                <CardDescription>
                  Manage and post to unlimited Facebook groups from a single dashboard
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Delays</CardTitle>
                <CardDescription>
                  Random delays between posts (30-120 seconds) to mimic human behavior
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground">
              One plan. All features. No hidden fees.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="border-2 border-primary shadow-xl">
              <CardHeader className="text-center pb-8">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                    <Star className="h-4 w-4" />
                    Most Popular
                  </div>
                </div>
                <CardTitle className="text-3xl mb-2">Pro Plan</CardTitle>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold">$37</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Unlimited Facebook groups</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Unlimited scheduled posts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Spintax content variation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Advanced scheduling options</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Analytics & performance tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Chrome extension included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Priority support</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  {isAuthenticated ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="w-full">
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <a href={getLoginUrl()}>
                      <Button size="lg" className="w-full">
                        Start 7-Day Free Trial
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Loved by Marketers Worldwide</h2>
            <p className="text-xl text-muted-foreground">
              See what our users have to say about AutoPost2Market
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <CardDescription className="text-base">
                  "AutoPost2Market has saved me hours every week. I can now manage all my Facebook groups 
                  from one place and schedule posts in advance. Game changer!"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">Sarah Johnson</p>
                <p className="text-sm text-muted-foreground">Digital Marketing Manager</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <CardDescription className="text-base">
                  "The spintax feature is brilliant! My posts always look unique and I never worry about 
                  Facebook flagging duplicate content. Highly recommended!"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">Michael Chen</p>
                <p className="text-sm text-muted-foreground">E-commerce Entrepreneur</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <CardDescription className="text-base">
                  "Best investment I've made for my business. The automation is flawless and the analytics 
                  help me understand which groups perform best."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">Emily Rodriguez</p>
                <p className="text-sm text-muted-foreground">Social Media Consultant</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about AutoPost2Market
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does the free trial work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You get full access to all features for 7 days, completely free. No credit card required. 
                  After the trial, you can choose to subscribe for just $37/month.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is it safe to use with Facebook?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! We use smart delays and target mobile Facebook (mbasic.facebook.com) for better reliability. 
                  Our system mimics human behavior to ensure your account stays safe.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I post to unlimited groups?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely! There's no limit on the number of Facebook groups you can manage and post to. 
                  Add as many as you need.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What is spintax and how does it work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Spintax allows you to create multiple variations of your content automatically. For example, 
                  "Hello world" becomes unique variations like "Hi world", "Hey there", etc. This keeps your 
                  posts fresh and avoids duplicate content issues.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you can cancel your subscription at any time. No questions asked, no hidden fees. 
                  You'll retain access until the end of your billing period.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We offer a 7-day free trial so you can test all features before paying. If you're not satisfied 
                  within the first 30 days of your paid subscription, contact us for a full refund.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Facebook Marketing?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of marketers who are saving time and growing their business with AutoPost2Market
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-bold">AutoPost2Market</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Automate your Facebook group marketing and save hours every day.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2025 AutoPost2Market. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
