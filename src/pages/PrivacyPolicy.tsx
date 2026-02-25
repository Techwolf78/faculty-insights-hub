import React from 'react';
import { Shield, Eye, Lock, FileCheck, ArrowLeft, Mail, Info, Smartphone, Globe, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* Mini Nav */}
      <nav className="border-b border-slate-100 px-6 py-6 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#11243C] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter text-[#11243C]">INSYT</span>
          </Link>
          <div className="flex gap-4">
            <Button variant="ghost" className="text-sm font-bold" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
            <Button className="bg-[#11243C] text-white font-bold" size="sm">
              Contact Privacy Officer
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-slate-50 py-24 border-b border-slate-100">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6">
            <Info className="w-3 h-3" />
            Last Updated: February 25, 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-[#11243C] mb-6">
            Privacy Matters <span className="text-slate-400 italic">to Us.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            A transparent overview of how INSYT collects, uses, and protects 
            your institutional and personal data.
          </p>
        </div>
      </header>

      {/* Content Grid */}
      <main className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-12 gap-16">
          {/* Summary Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="p-8 rounded-[2rem] bg-slate-900 text-white sticky top-32">
              <h3 className="text-xl font-bold mb-6">Summary at a Glance</h3>
              <div className="space-y-6">
                {[
                  { icon: Eye, text: "We never sell your personal data." },
                  { icon: Lock, text: "Data is encrypted at rest and in transit." },
                  { icon: Shield, text: "Student anonymity is physically decoupled." },
                  { icon: FileCheck, text: "You own your institutional data." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <item.icon className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Areas */}
          <div className="lg:col-span-8 space-y-16">
            <section className="prose prose-slate max-w-none">
              <h2 className="text-3xl font-black text-[#11243C] mb-8">1. Introduction</h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Welcome to INSYT (Gryphon Academy). Your privacy is of paramount importance to us. 
                This Privacy Policy explains how we collect, store, and process your data when 
                you use our platform.
              </p>
              
              <h2 className="text-3xl font-black text-[#11243C] mt-16 mb-8">2. Data Collection</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <h4 className="font-bold text-[#11243C] mb-2 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Student Data
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    We only collect minimal device identifiers and institutional email fragments 
                    required for session validation.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <h4 className="font-bold text-[#11243C] mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Faculty Data
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Name, department affiliation, and professional email are stored to provide 
                    personalized analytics dashboards.
                  </p>
                </div>
              </div>

              <h2 className="text-3xl font-black text-[#11243C] mt-16 mb-8">3. How We Use Data</h2>
              <ul className="space-y-4 list-none p-0">
                {[
                  "To generate performance reports and institutional insights.",
                  "To validate authentication for secure survey submission.",
                  "To improve the platform's AI-driven feedback analysis.",
                  "To provide technical support and security monitoring."
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <ChevronRight className="w-4 h-4 text-blue-500" />
                    {text}
                  </li>
                ))}
              </ul>

              <h2 className="text-3xl font-black text-[#11243C] mt-16 mb-8">4. Data Sharing</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                INSYT does not share data with third-party advertisers. Data is only shared with 
                your designated institution administrators according to your specific 
                configuration and permissions.
              </p>
            </section>

            {/* Contact Info */}
            <section className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                  <Mail className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#11243C] mb-2">Policy Inquiries</h3>
                  <p className="text-slate-500">
                    For inquiries regarding data protection or to exercise your privacy rights, 
                    please email <span className="font-bold text-blue-600">privacy@insyt.edu</span>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-slate-100 bg-slate-50/50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
            INSYT Privacy Framework • Trusted by Academic Institutions Worldwide
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;