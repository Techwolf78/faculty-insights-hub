import React from 'react';
import { FileText, ShieldAlert, Scale, UserCheck, ArrowLeft, Download, CheckCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900">
      {/* Structural Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#11243C] px-6 py-6 border-b border-white/5 shadow-xl">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white uppercase italic">INSYT LEGAL</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-white/50">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/compliance" className="hover:text-white transition-colors">Compliance</Link>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <Link to="/" className="text-white hover:opacity-80">Return Home</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-40 pb-20 bg-[#11243C] relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter mb-8">
              Terms of <span className="text-white/40 italic">Service.</span>
            </h1>
            <p className="text-xl text-white/60 leading-relaxed max-w-2xl">
              Agreement between Gryphon Academy Pvt Ltd and institutions 
              governing the use of the INSYT Feedback Platform.
            </p>
            <div className="flex gap-4 mt-12 text-sm">
               <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 font-bold uppercase tracking-widest">
                Effective: Feb 2026
              </div>
               <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-bold uppercase tracking-widest">
                Version 3.4.1
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Sections */}
      <main className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-20">
            
            {/* Agreement Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-black text-[#11243C]">1. Acceptance of Terms</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                By accessing or using INSYT, you ("The Institution" or "The User") 
                agree to be bound by these Terms of Service. If you do not agree 
                to these terms, you must discontinue use of the platform immediately.
              </p>
            </section>

            {/* License Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-black text-[#11243C]">2. License Grant</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Subject to compliance with these terms, INSYT grants you a non-exclusive, 
                non-transferable, revocable license to use the platform for 
                institutional feedback collection and analysis.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "No reverse engineering",
                  "No unauthorized data scraping",
                  "No resale of platform access",
                  "Institutional use only"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Account Obligations */}
            <section className="space-y-6">
              <h2 className="text-3xl font-black text-[#11243C]">3. User Obligations</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Users are responsible for maintaining the confidentiality of their 
                authentication credentials and for all activities that occur under 
                their account.
              </p>
              <div className="p-8 rounded-2xl bg-slate-900 text-white border-l-4 border-yellow-500 shadow-2xl">
                <div className="flex gap-4 items-start">
                  <ShieldAlert className="w-6 h-6 text-yellow-500 shrink-0" />
                  <div>
                    <h4 className="font-bold mb-2">Notice to Administrators</h4>
                    <p className="text-sm text-white/60 leading-relaxed">
                      You are responsible for the accuracy of the faculty and student 
                      data uploaded to the system and for ensuring you have the 
                      necessary consents.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Termination */}
            <section className="space-y-6">
              <h2 className="text-3xl font-black text-[#11243C]">4. Limitation of Liability</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                To the maximum extent permitted by law, INSYT shall not be liable 
                for any indirect, incidental, or consequential damages resulting 
                from the use or inability to use the service.
              </p>
            </section>

          </div>

          {/* Table of Contents / Quick Links */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-40 space-y-12">
              <div className="p-8 rounded-[2rem] bg-white border border-slate-200">
                <h3 className="font-black text-[#11243C] mb-6 uppercase tracking-widest text-xs">Navigation</h3>
                <nav className="space-y-4">
                  {[
                    "Acceptance of Terms",
                    "License Grant",
                    "User Obligations",
                    "Limitation of Liability",
                    "Governing Law"
                  ].map((text, i) => (
                    <a key={i} href="#" className="flex items-center justify-between group py-1 text-slate-500 hover:text-[#11243C] transition-colors border-b border-slate-50">
                      <span className="text-sm font-medium">{text}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </nav>
              </div>

              <div className="text-center">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF Copy
                </Button>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed font-medium">
                  Looking for our Data Processing Agreement? <br />
                  <Link to="/compliance" className="text-blue-500 hover:underline">View Compliance Portal</Link>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Simplified Footer */}
      <footer className="py-20 border-t border-slate-200 bg-white">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
            Legal Governance • INSYT Feedback Systems 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;