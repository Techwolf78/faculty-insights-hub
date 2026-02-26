import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  Shield,
  BarChart3,
  ClipboardCheck,
  Building2,
  ChevronDown,
  Star,
  CheckCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  Lock,
  MessageSquare,
  Award,
  Globe,
  Clock,
  Target,
  Smartphone,
  Mail,
  Calendar,
  FileText,
  Settings,
  PieChart,
  UserCheck,
  BookOpen,
  Lightbulb,
  Heart,
  Quote,
  Play,
  Download,
  ExternalLink,
  Check,
  X,
  Plus,
  Minus,
  XCircle,
  Filter,
  Brain,
  Search,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ImageComparison = () => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);

  const handleMove = (e) => {
    if (!containerRef.current) return;

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (clientX === undefined) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(position);
  };

  const handleMouseDown = () => {
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleMouseUp);
  };

  const handleMouseUp = () => {
    window.removeEventListener("mousemove", handleMove);
    window.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("touchmove", handleMove);
    window.removeEventListener("touchend", handleMouseUp);
  };

  return (
    <div className="w-full bg-background py-16 px-6 border-t border-border">
      <div className="container mx-auto">
        <div
          ref={containerRef}
          className="relative max-w-7xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl cursor-default select-none border-4 border-white/10 object-contain"
        >
          {/* Image 2 (Revealed - Bottom Layer) */}
          <div className="absolute inset-0">
            <img
              src="https://www.zonkafeedback.com/hubfs/After-Image-Jun-Comp-Img.svg"
              alt="After"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Image 1 (Original - Top Layer with Clip Path) */}
          <div
            className="absolute inset-0 z-10 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <img
              src="https://www.zonkafeedback.com/hubfs/BeforeSide-FullView-Comp-Img.svg"
              alt="Before"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Separator Line */}
          <div
            className="absolute top-0 bottom-0 z-20 w-[3px] bg-primary flex items-center justify-center pointer-events-none shadow-[0_0_15px_rgba(168,85,247,0.5)]"
            style={{ left: `calc(${sliderPos}% - 1.5px)` }}
          >
            {/* Circular Handle */}
            <div
              className="absolute w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center pointer-events-auto border-4 border-primary transition-transform active:scale-95 translate-x-[0px] cursor-grab active:cursor-grabbing group-hover:scale-110 duration-200"
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              <div className="flex gap-1 items-center">
                <ChevronDown className="w-5 h-5 text-primary rotate-90" />
                <ChevronDown className="w-5 h-5 text-primary -rotate-90" />
              </div>
            </div>
          </div>

          {/* Status Badges - Repositioned and stylized */}
          <div className="absolute bottom-6 left-6 z-30 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-white/10 shadow-xl">
              Legacy Forms
            </div>
          </div>
          <div className="absolute bottom-6 right-6 z-30 pointer-events-none">
            <div className="bg-primary/90 backdrop-blur-md text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-white/20 shadow-xl">
              Modern Analytics
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageComparison;

import { ContactForm } from "@/components/ContactForm";

export const Landing: React.FC = () => {
  const [isContactModalOpen, setContactModalOpen] = useState(false);
  const [contactCategory, setContactCategory] = useState("general");

  const openContact = (category: string = "general") => {
    setContactCategory(category);
    setContactModalOpen(true);
  };

  const testimonials = [
    {
      name: "Dr. Sanjay Joshi",
      role: "Dean of Academic Affairs",
      college: "ICEM College",
      content:
        "INSYT has revolutionized how we collect and analyze student feedback. Response rates increased by 300% and we now have actionable insights that drive real improvements.",
      rating: 5,
      avatar: "SJ",
    },
    {
      name: "Prof. Ravi Kumar",
      role: "Head of Department",
      college: "IGSB College",
      content:
        "The anonymous feedback system has created an environment of trust. Our faculty development programs are now targeted and effective.",
      rating: 5,
      avatar: "MC",
    },
    {
      name: "Dr. Priya Sharma",
      role: "Quality Assurance Director",
      college: "Shri Ramdeobaba College of Engineering and Management",
      content:
        "The analytics dashboard provides unprecedented visibility into teaching effectiveness. We've seen measurable improvements in student satisfaction scores.",
      rating: 5,
      avatar: "PS",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Anonymous & Secure",
      description:
        "Bank-level encryption ensures complete privacy. Students can provide honest feedback without fear of identification.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description:
        "AI-powered insights with comprehensive dashboards, trend analysis, and predictive recommendations.",
    },
    {
      icon: Users,
      title: "Multi-Role Access",
      description:
        "Tailored dashboards for administrators, HODs, faculty, and students with role-based permissions.",
    },
    {
      icon: Settings,
      title: "Customizable Surveys",
      description:
        "Create custom question sets, templates, and workflows tailored to your institution's needs.",
    },
  ];

  const integrations = [
    { name: "Google Classroom", icon: "📚" },
    { name: "Microsoft Teams", icon: "👥" },
    { name: "Canvas LMS", icon: "🎓" },
    { name: "Moodle", icon: "📖" },
    { name: "Blackboard", icon: "📝" },
    { name: "Zoom", icon: "📹" },
    { name: "Slack", icon: "💬" },
    { name: "Email", icon: "✉️" },
  ];

  const faqs = [
    {
      question: "How secure is the anonymous feedback system?",
      answer:
        "Our platform uses bank-level 256-bit SSL encryption and advanced anonymization techniques. Student identities are never stored with their feedback, ensuring complete privacy and compliance with GDPR and educational privacy standards.",
    },
    {
      question: "Can we customize the survey questions?",
      answer:
        "Absolutely! INSYT offers fully customizable survey templates. You can create custom questions, use our question bank, or import your existing survey formats. All surveys can be tailored to specific departments or courses.",
    },
    {
      question: "What kind of analytics and reports are available?",
      answer:
        "We provide comprehensive analytics including real-time dashboards, trend analysis, comparative reports, and predictive insights. Reports can be generated for individual faculty, departments, or institution-wide, with export options in multiple formats.",
    },
    {
      question: "How does the pricing work for multiple colleges?",
      answer:
        "Our pricing is based on a per-faculty model at ₹1xx per faculty member per month. For institutions with multiple colleges or custom requirements, we provide personalized quotes through our sales team. This ensures fair pricing based on your specific needs and scale.",
    },
    {
      question: "Can students access the system on mobile devices?",
      answer:
        "Yes! INSYT is fully responsive and optimized for mobile devices. Students can submit feedback using smartphones, tablets, or computers. We also support QR code access for quick survey distribution.",
    },
    {
      question: "What kind of support do you provide?",
      answer:
        "We offer comprehensive support including 24/7 technical support, dedicated account managers for enterprise clients, training sessions, and regular webinars. Our success team ensures smooth implementation and ongoing optimization.",
    },
  ];

  return (
    <div className="min-h-screen bg-background font-apercu">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/GA - Logo - TM_black.png"
                alt="Gryphon Academy INSYT Logo"
                className="h-auto w-40"
              />
            </div>

            <div className="hidden lg:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Methodology
              </a>
              <a
                href="#testimonials"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Impact
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                FAQ
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-visible bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto relative">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-4 py-2 text-sm relative">
                <Shield className="h-4 w-4 mr-2" />
                Secure & Anonymous Feedback Platform
              </Badge>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight tracking-tight">
                Elevate Teaching Excellence
                <br />
                Through <span className="text-primary italic relative inline-block">
                  Feedback
                  <img 
                    src="/black_arrow.png" 
                    alt="" 
                    className="absolute top-full left-1/2 translate-x-8 transform rotate-180 pointer-events-none object-contain w-72 opacity-30 h-96 -translate-y-24"
                  />
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
                The most advanced feedback platform for modern educational
                institutions. Move beyond forms to actionable insights.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                <Button
                  size="lg"
                  className="px-8 h-14 text-base font-semibold gradient-hero shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                  onClick={() => openContact("standard")}
                >
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 h-14 text-base font-semibold border-2"
                  onClick={() => openContact("demo")}
                >
                  Request Live Demo
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full -z-10 opacity-30" />
            {/* Browser-like Frame for Image Comparison */}
            <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="bg-muted/50 border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/20" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/20" />
                  <div className="w-3 h-3 rounded-full bg-green-400/20" />
                </div>
                <div className="mx-auto bg-background/50 rounded-md px-12 py-1 text-[10px] text-muted-foreground border border-border/50">
                  faculty.gryphonacademy.co.in
                </div>
              </div>
              <ImageComparison />
            </div>
            {/* Star Image positioned at top of outer container */}
            <div className="absolute -top-12 -right-12 z-50 pointer-events-none hidden lg:block">
              <img
                src="https://www.zonkafeedback.com/hubfs/bannerform-star1.svg"
                alt="Star"
                className="animate-pulse w-24 h-24 drop-shadow-2xl"
              />
            </div>{" "}
            {/* Overlay Text positioned outside the image container */}
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-30 text-center pointer-events-none">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary bg-background px-4 py-1 rounded-full border border-primary/20 shadow-sm">
                Real-time Transformation
              </p>
            </div>{" "}
          </div>

          {/* Core Feature Cards - Positioned directly below Image Comparison */}
          <div className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="relative p-8 rounded-3xl border border-border/50 hover:border-primary/30 transition-all duration-500 group hover:shadow-2xl hover:shadow-primary/5 bg-card/30 backdrop-blur-md overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-500" />

                <div className="mb-6 relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4 leading-tight group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Floating elements with improved aesthetics */}
        <div className="absolute top-40 right-10 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div
          className="absolute bottom-40 left-10 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -z-10 animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </section>

      {/* Trusted By Section (New) */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-6">
          <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-8">
            Powering Excellence at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8 opacity-40 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
            <div className="flex items-center gap-2 font-display font-black text-2xl">
              <GraduationCap className="h-6 w-6 text-primary" /> ICEM
            </div>
            <div className="flex items-center gap-2 font-display font-black text-2xl">
              <Building2 className="h-6 w-6 text-primary" /> IGSB
            </div>
            <div className="flex items-center gap-2 font-display font-black text-2xl uppercase italic">
              Indira
            </div>
            <div className="flex items-center gap-2 font-display font-black text-2xl">
              <Award className="h-6 w-6 text-primary" /> DYP
            </div>
            <div className="flex items-center gap-2 font-display font-black text-2xl">
              RCOEM GROUP
            </div>
          </div>
        </div>
      </section>

      {/* Selling Points Section - More Professional Comparison */}
      <section id="features" className="py-24 px-6 bg-background relative">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.25em] mb-4">
              The Challenge
            </h2>
            <h3 className="font-display text-4xl md:text-5xl font-extrabold text-foreground mb-6">
              Why generic tools aren't enough
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Standard survey tools capture data, but they don't capture{" "}
              <span className="text-foreground font-semibold">
                understanding
              </span>
              . Here's why institutional context matters.
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-stretch">
            {/* Without Modern Feedback */}
            <div className="p-10 border border-border/50 rounded-3xl bg-muted/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <XCircle className="w-16 h-16 text-destructive" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-destructive" />
                </div>
                Generic Online Forms
              </h4>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive/40 flex-shrink-0" />
                  <p className="text-muted-foreground text-sm">
                    Limited analytics capabilities hinder deep academic insights
                  </p>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive/40 flex-shrink-0" />
                  <p className="text-muted-foreground text-sm">
                    No role-specific dashboards for HODs or Faculty members
                  </p>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive/40 flex-shrink-0" />
                  <p className="text-muted-foreground text-sm">
                    Manual follow-ups lead to wasted time and slow improvements
                  </p>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive/40 flex-shrink-0" />
                  <p className="text-muted-foreground text-sm">
                    Security concerns often lead to dishonest or biased feedback
                  </p>
                </li>
              </ul>
            </div>

            {/* With Modern Feedback */}
            <div className="p-10 rounded-3xl bg-foreground text-background shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle className="w-16 h-16 text-primary" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />

              <h4 className="text-xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
                INSYT Platform
              </h4>
              <ul className="space-y-6 relative z-10">
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <p className="text-white/80 text-sm">
                    AI-driven mapping from student feedback to teaching metrics
                  </p>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <p className="text-white/80 text-sm">
                    Real-time dashboards tailored for every level of
                    administration
                  </p>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <p className="text-white/80 text-sm">
                    Automated suggestion engine for faculty development
                  </p>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <p className="text-white/80 text-sm">
                    Bank-level anonymity and data-protection protocols
                  </p>
                </li>
              </ul>

              <div className="mt-10 relative z-10">
                <Button
                  size="sm"
                  className="w-full bg-white text-foreground hover:bg-white/90 font-bold border-none"
                  onClick={() => openContact("demo")}
                >
                  Analyze the Difference
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-24 px-6 bg-secondary/30 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto relative">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.25em] mb-4">
              Process
            </h2>
            <h3 className="font-display text-4xl md:text-5xl font-extrabold text-foreground mb-6">
              How INSYT works for you
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A streamlined, automated workflow designed specifically for
              complex academic environments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-primary/5 via-primary/20 to-primary/5 -z-10" />

            <div className="relative group">
              <div className="w-20 h-20 rounded-3xl bg-background border border-border shadow-xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <FileText className="w-8 h-8" />
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center border-4 border-background shadow-lg">
                  01
                </div>
              </div>
              <div className="text-center group-hover:translate-y-[-4px] transition-transform duration-500">
                <h3 className="font-display text-xl font-bold text-foreground mb-4">
                  Setup Surveys
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed px-4">
                  Choose from accredited templates or build custom mapping for
                  specific course outcomes.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="w-20 h-20 rounded-3xl bg-background border border-border shadow-xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <Globe className="w-8 h-8" />
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center border-4 border-background shadow-lg">
                  02
                </div>
              </div>
              <div className="text-center group-hover:translate-y-[-4px] transition-transform duration-500">
                <h3 className="font-display text-xl font-bold text-foreground mb-4">
                  Distribute
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed px-4">
                  Deploy via automated emails, classroom QR codes, or direct LMS
                  deep-links.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="w-20 h-20 rounded-3xl bg-background border border-border shadow-xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <Shield className="w-8 h-8" />
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center border-4 border-background shadow-lg">
                  03
                </div>
              </div>
              <div className="text-center group-hover:translate-y-[-4px] transition-transform duration-500">
                <h3 className="font-display text-xl font-bold text-foreground mb-4">
                  Collect Feedback
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed px-4">
                  Students provide honest input through an encrypted, completely
                  anonymous portal.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="w-20 h-20 rounded-3xl bg-background border border-border shadow-xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <TrendingUp className="w-8 h-8" />
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center border-4 border-background shadow-lg">
                  04
                </div>
              </div>
              <div className="text-center group-hover:translate-y-[-4px] transition-transform duration-500">
                <h3 className="font-display text-xl font-bold text-foreground mb-4">
                  Analyze & Act
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed px-4">
                  Instant mapping of insights to actionable HOD checklists and
                  faculty development goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.25em] mb-4">
              Impact
            </h2>
            <h3 className="font-display text-4xl md:text-5xl font-extrabold text-foreground mb-6">
              Trusted by leading academics
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from the leaders who are transforming institutional culture
              with data.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 rounded-3xl overflow-hidden group"
              >
                <CardContent className="p-10 flex flex-col h-full">
                  <div className="flex gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <div className="relative mb-8">
                    <Quote className="absolute -top-4 -left-4 h-12 w-12 text-primary/5 group-hover:text-primary/10 transition-colors" />
                    <p className="text-foreground/80 leading-relaxed italic relative z-10 text-sm">
                      "{testimonial.content}"
                    </p>
                  </div>
                  <div className="mt-auto pt-8 border-t border-border flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground/20 flex items-center justify-center font-black text-white text-sm shadow-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm">
                        {testimonial.name}
                      </div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">
                        {testimonial.role}
                      </div>
                      <div className="text-[10px] font-black text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <Building2 className="w-3 h-3" /> {testimonial.college}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.25em] mb-4">
              Access
            </h2>
            <h3 className="font-display text-4xl md:text-5xl font-extrabold text-foreground mb-6">
              Flexible scale for any institution
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              We provide enterprise-grade feedback infrastructure tailored to
              your faculty size and specific administrative needs.
            </p>

            <div className="bg-card/50 border border-border/50 rounded-[2rem] p-10 max-w-5xl mx-auto backdrop-blur-sm shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-left space-y-4">
                  <h4 className="font-display text-2xl font-black text-foreground">
                    Our Pricing Philosophy
                  </h4>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Solutions that grow with your institution. Simple
                    per-faculty billing with full-scale support.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="px-8 h-14 font-black gradient-hero shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                    onClick={() => openContact("sales")}
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Connect with Sales
                  </Button>
                </div>
              </div>

              <div className="mt-12 grid md:grid-cols-3 gap-8">
                <div className="flex gap-4 group/item">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-foreground text-sm">
                      Per Faculty Model
                    </span>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                      Base Subscription
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 group/item">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                    <Settings className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-foreground text-sm">
                      Full Customisation
                    </span>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                      Optional Module
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 group/item">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-foreground text-sm">
                      ERP Integration
                    </span>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                      Enterprise Only
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Standard Plan */}
            <Card className="border-border/50 bg-card rounded-[2rem] hover:border-primary/20 transition-all duration-500 overflow-hidden flex flex-col">
              <CardHeader className="p-10 text-center relative">
                <div className="mb-6 mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Zap className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl font-bold">Standard</CardTitle>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black text-foreground">
                    ₹1xx
                  </span>
                  <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    /Fac/Mo
                  </span>
                </div>
                <p className="text-muted-foreground mt-4 text-sm">
                  For single department colleges
                </p>
              </CardHeader>
              <CardContent className="px-10 pb-10 flex-grow flex flex-col">
                <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">
                      Anonymous Feedback Portal
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">
                      Standard Analytics Suite
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">
                      Multi-role Access Control
                    </span>
                  </div>
                  <div className="flex items-start gap-3 opacity-40">
                    <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span className="text-sm">Custom Template Mapping</span>
                  </div>
                </div>
                <Button
                  className="w-full h-12 rounded-xl border-2 hover:text-gray-500 font-bold hover:bg-muted"
                  variant="outline"
                  onClick={() => openContact("standard")}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Growth Plan */}
            <Card className="border-primary bg-foreground text-background rounded-[2rem] shadow-2xl shadow-primary/20 relative overflow-hidden flex flex-col scale-105 z-10">
              <div className="absolute top-0 right-0 p-3">
                <Badge className="bg-primary text-white border-none py-1.5 px-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="p-10 text-center">
                <div className="mb-6 mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white">
                  Custom Growth
                </CardTitle>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black text-white">₹1xx</span>
                  <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
                    /Fac/Mo
                  </span>
                </div>
                <p className="text-white/60 mt-4 text-sm font-medium italic">
                  + Custom Development Fee
                </p>
              </CardHeader>
              <CardContent className="px-10 pb-10 flex-grow flex flex-col">
                <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle className="h-5 w-5 text-white shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">
                      Everything in Standard
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle className="h-5 w-5 text-white shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">
                      Custom Academic Templates
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle className="h-5 w-5 text-white shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">
                      Whitelabel UI Customisation
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-white">
                    <CheckCircle className="h-5 w-5 text-white shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">
                      Priority 24/7 Response
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full h-12 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 border-none"
                  onClick={() => openContact("pricing")}
                >
                  Request Custom Quote
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-border/50 bg-card rounded-[2rem] hover:border-primary/20 transition-all duration-500 overflow-hidden flex flex-col">
              <CardHeader className="p-10 text-center">
                <div className="mb-6 mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl font-bold">
                  Enterprise ERP
                </CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-black text-foreground">
                    Talk to Sales
                  </span>
                </div>
                <p className="text-muted-foreground mt-4 text-sm">
                  For large multi-college groups
                </p>
              </CardHeader>
              <CardContent className="px-10 pb-10 flex-grow flex flex-col">
                <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">
                      Full ERP Deep Integration
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">
                      On-Premise Deployment
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">
                      Dedicated Account Success
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">
                      Custom Data Governance
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full h-12 rounded-xl border-2 hover:text-gray-500 font-bold hover:bg-muted"
                  variant="outline"
                  onClick={() => openContact("enterprise")}
                >
                  Schedule Demo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="py-24 px-6 bg-background relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10" />
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.25em] mb-4">
              Resources
            </h2>
            <h3 className="font-display text-4xl md:text-5xl font-extrabold text-foreground mb-6">
              Frequently Asked Questions
            </h3>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about implementing INSYT at your
              institution.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/50 bg-card/30 backdrop-blur-sm px-6 rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/20"
              >
                <AccordionTrigger className="py-6 text-left hover:no-underline hover:text-primary transition-colors font-bold text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Still have questions?{" "}
              <a href="#" className="font-bold text-primary hover:underline">
                Download our full implementation guide
              </a>{" "}
              or{" "}
              <a href="#" className="font-bold text-primary hover:underline">
                chat with our experts
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="bg-foreground rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center relative z-10 space-y-10">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-primary-foreground/80 text-xs font-black uppercase tracking-widest">
                <Zap className="w-4 h-4 text-white" />
                Next Generation Feedback
              </div>

              <h2 className="font-display text-4xl md:text-6xl font-black text-white leading-tight">
                Ready to transform your <br />
                <span className="text-primary italic">
                  institutional culture?
                </span>
              </h2>

              <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                Join frontline educational institutions already using INSYT to
                drive excellence. Start your journey toward data-driven teaching
                today.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto gap-2 px-10 h-16 shadow-2xl bg-white text-foreground hover:bg-white/90 font-black text-lg transition-all hover:scale-105"
                  onClick={() => openContact("general")}
                >
                  <Mail className="h-5 w-5" />
                  Contact Sales Team
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 px-10 h-16 border-white/20 text-black  hover:bg-white/10 font-bold transition-all"
                  onClick={() => openContact("demo")}
                >
                  <Calendar className="h-5 w-5" />
                  Schedule Live Demo
                </Button>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 pt-8">
                <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                  <Check className="w-4 h-4 text-white" />
                  No long-term contracts
                </div>
                <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                  <Check className="w-4 h-4 text-white" />
                  Customised Pricing
                </div>
                <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                  <Check className="w-4 h-4 text-white" />
                  24/7 Dedicated Support
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border pt-24 pb-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2 lg:col-span-2 space-y-8">
              <img
                src="/GA - Logo - TM_black.png"
                alt="Gryphon Academy INSYT Logo"
                className="h-10 w-auto"
              />
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                Empowering educational excellence through meaningful, AI-driven
                feedback. Built for modern academic ecosystems.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all"
                >
                  <Globe className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all"
                >
                  <Mail className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all"
                >
                  <Target className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-6 text-sm uppercase tracking-widest">
                Product
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-primary transition-colors"
                  >
                    Platform Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-primary transition-colors"
                  >
                    Pricing Structure
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-primary transition-colors"
                  >
                    Methodology
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="hover:text-primary transition-colors"
                  >
                    Case Studies
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-6 text-sm uppercase tracking-widest">
                Company
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    About INSYT
                  </a>
                </li>
                <li>
                  <Link
                    to="/blog/chaos-to-clarity"
                    className="hover:text-primary transition-colors"
                  >
                    Insights Blog
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Academic Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Partner Program
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-6 text-sm uppercase tracking-widest">
                Governance
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/compliance"
                    className="hover:text-primary transition-colors"
                  >
                    Compliance
                  </Link>
                </li>
                <li>
                  <Link
                    to="/security-portal"
                    className="hover:text-primary transition-colors"
                  >
                    Security Portal
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy-policy"
                    className="hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms-of-service"
                    className="hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs font-medium text-muted-foreground order-2 md:order-1">
              © {new Date().getFullYear()} Gryphon Academy Pvt Ltd. All rights
              reserved.
            </p>
            <div className="flex items-center gap-8 order-1 md:order-2">
              <Link
                to="/privacy-policy"
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              >
                Privacy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              >
                Terms
              </Link>
              <Link
                to="/security-portal"
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              >
                Security
              </Link>
              <Link
                to="/compliance"
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              >
                Compliance
              </Link>
            </div>
          </div>
        </div>
      </footer>
      <ContactForm
        isOpen={isContactModalOpen}
        onClose={() => setContactModalOpen(false)}
        defaultCategory={contactCategory}
      />
    </div>
  );
};
