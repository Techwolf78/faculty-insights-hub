import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Share2, 
  Linkedin, 
  Twitter, 
  Link as LinkIcon,
  Zap,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  ArrowUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/ContactForm";

const BlogPost = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = async () => {
    const title = "From Chaos to Clarity: How We Transformed Faculty Feedback Workloads at scale.";
    const url = window.location.href;
    const text = "Check out this engineering deep-dive on INSYT";

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(url).then(() => {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      });
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ContactForm isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#eeeeee]">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-black text-xl tracking-tighter text-[#0f172a]">INSYT</span>
          </Link>
          <div className="flex items-center gap-6">
            <Button variant="ghost" className="text-sm font-bold text-[#0f172a]" asChild>
              <Link to="/home">Explore Platform</Link>
            </Button>
            <Button 
              className="bg-[#7c3aed] text-white hover:bg-[#6d28d9] rounded-full px-6 font-bold shadow-lg shadow-[#7c3aed]/20"
              onClick={() => setIsContactModalOpen(true)}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="fixed top-20 left-0 w-full h-[2px] bg-[#eeeeee] z-50">
        <div 
          className="h-full bg-[#7c3aed] transition-all duration-150 ease-out" 
          style={{ width: `${scrollProgress}%` }} 
        />
      </div>

      <main className="pt-40 pb-24">
        <article className="container mx-auto px-6 max-w-4xl">
          {/* Article Header */}
          <header className="mb-16">
            <Link to="/home" className="inline-flex items-center gap-2 text-[#7c3aed] font-bold text-sm mb-8 hover:translate-x-[-4px] transition-transform">
              <ArrowLeft className="w-4 h-4" />
              Back to Insights
            </Link>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="px-3 py-1 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] text-[10px] font-black uppercase tracking-widest">
                Data Engineering
              </span>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                <span>Feb 25, 2026</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                <Clock className="w-4 h-4" />
                <span>12 min read</span>
              </div>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-black text-[#0f172a] leading-[1.1] tracking-tight mb-10">
              From Chaos to Clarity: How We Transformed <span className="text-[#7c3aed] italic">Faculty Feedback Workloads</span> at scale.
            </h1>

            {/* Author Card */}
            <div className="flex flex-col md:flex-row items-center justify-between py-10 border-y border-[#eeeeee] gap-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-[#0f172a] font-black text-xl overflow-hidden border border-[#eeeeee]">
                  <img 
                    src="https://api.dicebear.com/7.x/initials/svg?seed=AP&backgroundColor=0f172a&fontFamily=Arial&fontWeight=900" 
                    alt="Ajay Pawar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-black text-[#0f172a] text-xl tracking-tight">Ajay Pawar</h4>
                  <p className="text-[#7c3aed] text-xs font-black uppercase tracking-widest mt-1">Lead Software Engineer</p>
                  <p className="text-slate-400 text-xs font-medium mt-1">Building high-performance academic ecosystems.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 transition-colors"><Linkedin className="w-5 h-5 text-slate-400" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 transition-colors"><Twitter className="w-5 h-5 text-slate-400" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 transition-colors"><LinkIcon className="w-5 h-5 text-slate-400" /></Button>
                </div>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          <div className="mb-16 relative aspect-[21/9] rounded-[2.5rem] overflow-hidden border border-[#eeeeee]">
            <img 
              src="/blog_data.png" 
              alt="Data Transformation Visualization" 
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-12">
              <p className="text-white/90 font-medium text-sm">Visualizing data flow across academic departments in real-time.</p>
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-slate prose-lg max-w-none prose-headings:font-display prose-headings:font-black prose-headings:text-[#0f172a] prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-[#0f172a] px-0 md:px-12">
            <p className="text-2xl font-medium text-slate-700 leading-relaxed mb-12">
              In the fast-paced ecosystem of institutional feedback, data is no longer just a metric; it's the lifeline. 
              But as we scaled INSYT to handle hundreds of thousands of student responses, we hit a wall. 
              The chaos was real.
            </p>

            <h2 className="text-3xl mt-16 mb-8 text-[#0f172a]">The Technical Debt of Traditional Surveys</h2>
            <p>
              Traditional institutional surveys often suffer from the <strong>"Write-Heavy Lock"</strong> problem. In a typical mid-semester feedback window, thousands of students hit a single SQL endpoint simultaneously. If you're doing complex calculations (like calculating weighted averages for 50+ faculty members) on every read, your DB will inevitably choke.
            </p>
            <p>
              At INSYT, we realized that institutional data isn't just "big"—it's hierarchically complex. A single feedback entry affects the Faculty score, the Departmental average, and the College-wide excellence index.
            </p>

            <div className="my-16 p-10 bg-[#0f172a] rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c3aed]/10 rounded-full blur-[80px]" />
              <h4 className="text-[#7c3aed] font-black text-xs uppercase tracking-[0.2em] mb-4">Engineering Insight</h4>
              <p className="text-white text-xl font-medium leading-relaxed italic border-l-2 border-[#7c3aed] pl-6">
                "We moved to an Event-Driven Architecture. Submissions are now processed as streams, allowing our UI to remain performant even during peak traffic hours."
              </p>
            </div>

            <h2 className="text-3xl mt-16 mb-8 text-[#0f172a]">Our Multi-Tenant Data Isolation Strategy</h2>
            <p>
              One of the most critical challenges I solved was <strong>Data Isolation</strong>. When managing multiple colleges (ICEM, IGSB, etc.) on a single platform, you cannot afford cross-pollination. 
            </p>
            <p>
              We implemented a <strong>Logical Partitioning</strong> layer within our application code. By injecting a unique <code className="text-[#7c3aed] bg-[#7c3aed]/5 px-2 py-0.5 rounded font-bold">tenant_id</code> into every query execution context, we ensured that even if a database connection was shared, the data access remained strictly isolated. This approach reduced our infrastructure overhead by 40% while <em>increasing</em> security.
            </p>

            <h3 className="text-2xl mt-12 mb-6 font-bold text-[#0f172a]">The Evolution of Analytics</h3>
            <p>
              We didn't stop at just showing numbers. We built a <strong>Semantic Scoring Engine</strong>. Instead of just a "4.5/5" rating, our system now uses Natural Language Processing to categorize qualitative feedback into "Actionable" vs "Informational."
            </p>
            
            <ul className="space-y-4 my-10 list-none p-0">
              {[
                { label: "Predictive Burnout Detection", text: "Identifying faculty departments showing signs of high stress via sentiment trends." },
                { label: "Automatic Template Mapping", text: "Dynamically adjusting survey questions based on the specific syllabus requirements." },
                { label: "Whitelabel Performance", text: "Sub-100ms response times for all analytics dashboards across mobile and web." }
              ].map((item, i) => (
                <li key={i} className="flex gap-4 items-start bg-white p-6 rounded-2xl border border-[#eeeeee]">
                  <div className="w-6 h-6 rounded-full bg-[#7c3aed] flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-[#0f172a] block mb-1">{item.label}</strong>
                    <span className="text-slate-500 text-sm font-medium">{item.text}</span>
                  </div>
                </li>
              ))}
            </ul>

            <h2 className="text-3xl mt-16 mb-8 text-[#0f172a]">Closing the Loop</h2>
            <p>
              Engineering for education is uniquely rewarding. The "Clarity" we speak of isn't just about pretty charts; it's about giving a teacher the exact insight they need to change a student's life. 
            </p>
            <p>
              My philosophy as a <strong>Software Engineer</strong> is simple: Technology should disappear. It should be so fast, so clean, and so intuitive that the users only see the insights, never the complex machinery (the chaos) that powers it.
            </p>
          </div>

          {/* Tags & Footer */}
          <footer className="mt-20 pt-12 border-t border-[#eeeeee]">
            <div className="flex flex-wrap gap-3 mb-12">
              {["Optimization", "Architecture", "Education Technology", "Scalability"].map(tag => (
                <span key={tag} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-[#7c3aed] hover:text-white transition-colors cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="bg-[#0f172a] rounded-[2.5rem] p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c3aed]/20 rounded-full blur-[80px]" />
              <h3 className="text-white text-3xl font-black mb-6 relative z-10">Want more engineering deep-dives?</h3>
              <p className="text-white/60 mb-8 relative z-10">Join institutional leaders and engineers receiving monthly technical insights.</p>
              <div className="max-w-md mx-auto flex gap-4 relative z-10">
                <input 
                  type="email" 
                  placeholder="name@institution.edu" 
                  className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                />
                <Button 
                  className="bg-[#7c3aed] text-white hover:bg-[#6d28d9] rounded-2xl px-8 font-black"
                  onClick={() => setIsContactModalOpen(true)}
                >
                  Join
                </Button>
              </div>
            </div>
          </footer>
        </article>

        {/* Floating Icons */}
        <div className="fixed bottom-12 right-12 flex flex-col gap-4">
          {showScrollTop && (
            <Button 
              size="icon" 
              className="w-14 h-14 rounded-full bg-white border border-[#eeeeee] shadow-2xl text-slate-600 hover:text-[#7c3aed] transition-all hover:scale-110 animate-fadeIn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <ArrowUp className="w-6 h-6" />
            </Button>
          )}
          <Button 
            size="icon" 
            className={`w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-110 ${
              shareSuccess 
                ? 'bg-green-500 text-white' 
                : 'bg-[#7c3aed] text-white hover:bg-[#6d28d9]'
            }`}
            onClick={handleShare}
          >
            <Share2 className="w-6 h-6" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default BlogPost;
