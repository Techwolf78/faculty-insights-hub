import React from 'react';
import { Shield, CheckCircle2, Lock, FileText, Globe, ArrowLeft, ExternalLink, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Compliance = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#11243C] border-b border-white/10 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white uppercase italic">INSYT</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/security-portal" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Security</Link>
            <Link to="/privacy-policy" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Terms</Link>
            <Button size="sm" className="bg-white text-[#11243C] hover:bg-white/90 font-bold px-6">
              Contact Sales
            </Button>
          </div>
          <Link to="/" className="md:hidden">
            <ArrowLeft className="w-6 h-6 text-white" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-20 bg-[#11243C] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-widest mb-6">
            <Activity className="w-4 h-4 text-green-400" />
            Active Compliance Framework
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
            Trust & Compliance <span className="text-white/40 italic">at INSYT</span>
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
            We maintain the highest standards of regulatory compliance and data governance 
            to ensure your institution's data remains protected and private.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Sidebar - Quick Navigation */}
          <div className="hidden lg:block space-y-8 sticky top-32 h-fit">
            <div>
              <h4 className="font-bold text-[#11243C] mb-4 uppercase tracking-widest text-xs">Compliance Standards</h4>
              <nav className="flex flex-col space-y-2">
                <a href="#gdpr" className="text-sm text-slate-500 hover:text-[#11243C] transition-colors py-2 border-l-2 border-transparent hover:border-[#11243C] pl-4">GDPR Compliance</a>
                <a href="#privacy-shield" className="text-sm text-slate-500 hover:text-[#11243C] transition-colors py-2 border-l-2 border-transparent hover:border-[#11243C] pl-4">Privacy Shield</a>
                <a href="#education-act" className="text-sm text-slate-500 hover:text-[#11243C] transition-colors py-2 border-l-2 border-transparent hover:border-[#11243C] pl-4">Educational Data Protection</a>
                <a href="#audit" className="text-sm text-slate-500 hover:text-[#11243C] transition-colors py-2 border-l-2 border-transparent hover:border-[#11243C] pl-4">Annual Audits</a>
              </nav>
            </div>
            
            <div className="p-6 rounded-2xl bg-[#11243C] text-white">
              <h5 className="font-bold mb-2">Need a DPA?</h5>
              <p className="text-sm text-white/60 mb-4 leading-relaxed">
                Contact our legal team to request a Data Processing Agreement for your institution.
              </p>
              <Button size="sm" className="w-full bg-white text-[#11243C] font-bold">
                Request Document
              </Button>
            </div>
          </div>

          {/* Core Content */}
          <div className="lg:col-span-2 space-y-20">
            {/* Commitment Section */}
            <section id="commitment" className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-[#11243C]/5 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#11243C]" />
              </div>
              <h2 className="text-3xl font-black text-[#11243C]">Our Global Commitment</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                At INSYT, compliance isn't just a checkbox; it's the foundation of everything we build. 
                We operate across multiple jurisdictions and adhere to the strictest global standards 
                for data privacy, student record protection, and institutional governance.
              </p>
            </section>

            {/* Frameworks Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              <div id="gdpr" className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-[#11243C]/20 transition-all group">
                <Globe className="w-8 h-8 text-[#11243C] mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-xl text-[#11243C] mb-4">GDPR Ready</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Fully compliant with General Data Protection Regulation (GDPR) standards 
                  for handling personal data of EU and international users.
                </p>
              </div>
              <div id="privacy-shield" className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-[#11243C]/20 transition-all group">
                <Lock className="w-8 h-8 text-[#11243C] mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-xl text-[#11243C] mb-4">Data Sovereignty</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Regional data hosting options ensure compliance with local data residency 
                  requirements for sensitive educational records.
                </p>
              </div>
            </div>

            {/* Detailed Policies */}
            <section id="education-act" className="space-y-8">
              <h2 className="text-2xl font-black text-[#11243C]">Educational Data Standards</h2>
              <div className="space-y-4">
                {[
                  "Protection of Student Privacy & Records",
                  "Automated Data Retention & Deletion Protocols",
                  "Role-based Access Control (RBAC) Enforcement",
                  "Anonymous Feedback Integrity Assurance",
                  "Verified Institutional Authentication Only"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:bg-slate-100">
                    <FileText className="w-5 h-5 text-[#11243C]/40" />
                    <span className="font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Final Footer Contact */}
            <section className="p-10 rounded-[2rem] bg-[#11243C] text-white relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-tl-full" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h3 className="text-2xl font-black mb-2">Compliance Help Desk</h3>
                  <p className="text-white/60 text-sm">Have specific regulatory questions? Our legal team is here.</p>
                </div>
                <Button className="bg-white text-[#11243C] font-bold px-8 h-12 hover:bg-white/90">
                  contact@insyt.edu
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-12 border-t border-slate-200 text-center">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Gryphon Academy Pvt Ltd • Secure Feedback Systems
        </p>
      </footer>
    </div>
  );
};

export default Compliance;