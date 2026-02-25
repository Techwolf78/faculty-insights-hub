import React from 'react';
import { Shield, Lock, Eye, Server, Cpu, Database, ChevronRight, ArrowLeft, Terminal, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SecurityPortal = () => {
  return (
    <div className="min-h-screen bg-[#050B14] text-slate-300 font-sans selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white uppercase italic">INSYT<span className="text-primary italic">.SEC</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/compliance" className="text-sm font-medium hover:text-white transition-colors">Compliance</Link>
            <Link to="/privacy-policy" className="text-sm font-medium hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="text-sm font-medium hover:text-white transition-colors">Terms</Link>
            <Button size="sm" className="bg-primary text-white hover:bg-primary/90 font-bold px-6 border-none shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              Status: Operational
            </Button>
          </div>
          <Link to="/" className="md:hidden text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em]">
              <Terminal className="w-4 h-4" />
              Security First Architecture
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter">
              Hardened Security. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 italic">Total Privacy.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
              We employ military-grade encryption and enterprise-level security protocols 
              to ensure your institution's data is impenetrable and your faculty IDs remain encrypted.
            </p>
          </div>
        </div>
      </header>

      {/* Security Pillars */}
      <main className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          {[
            {
              icon: Lock,
              title: "End-to-End Encryption",
              desc: "All data in transit is protected by TLS 1.3, and data at rest is encrypted with AES-256."
            },
            {
              icon: Eye,
              title: "Complete Anonymity",
              desc: "Our unique ID-hashing algorithm ensures that even we cannot link feedback to a student identity."
            },
            {
              icon: Server,
              title: "Edge Protection",
              desc: "DDoS protection and advanced Web Application Firewall (WAF) filtering at every entry point."
            }
          ].map((pillar, i) => (
            <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-all">
                <pillar.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{pillar.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>

        {/* Detailed Infrastructure Section */}
        <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
              Enterprise Infrastructure <br />
              Built for <span className="text-primary italic">Scale.</span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              INSYT runs on high-availability cloud infrastructure with real-time failover 
              capabilities and geographic redundancy.
            </p>
            
            <div className="space-y-4 pt-4">
              {[
                { title: "Multi-Factor Authentication", info: "Required for all administrative access points." },
                { title: "Vulnerability Scanning", info: "Daily automated security audits and pentesting." },
                { title: "Real-time Monitoring", info: "24/7 SOC monitoring for suspicious activity." },
                { title: "Database Isolation", info: "Each institution's data is logically isolated." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-white text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{item.info}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
            <div className="relative bg-[#0A111E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">Encryption Manifest</div>
              </div>
              <div className="p-8 font-mono text-xs space-y-4">
                <div className="text-green-400">$ insyt --verify-security</div>
                <div className="text-slate-500">{" >> "} Analyzing architecture...</div>
                <div className="text-white">
                  <span className="text-blue-400">[OK]</span> TLS_SSL_CERTIFICATE: Valid (256-bit)<br />
                  <span className="text-blue-400">[OK]</span> DATA_ENCRYPTION_REST: AES_256_GCM<br />
                  <span className="text-blue-400">[OK]</span> FIREWALL_WAF: Active (Tier 1)<br />
                  <span className="text-blue-400">[OK]</span> IDENTITY_PROVIDER: Protected
                </div>
                <div className="text-primary italic animate-pulse">_ System Status: Secure</div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Disclosure CTA */}
        <section className="p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-primary/20 to-transparent border border-white/10 relative overflow-hidden text-center">
          <div className="max-w-3xl mx-auto space-y-8 relative z-10">
            <AlertCircle className="w-12 h-12 text-primary mx-auto mb-6" />
            <h3 className="text-3xl md:text-5xl font-black text-white">Security Vulnerability?</h3>
            <p className="text-xl text-slate-400">
              We operate a responsible disclosure policy. If you've found a security 
              issue, please report it immediately to our security response team.
            </p>
            <Button size="lg" className="bg-white text-[#11243C] font-black h-16 px-10 rounded-2xl hover:bg-white/90">
              security@insyt.edu
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/5 text-center">
         <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          Secured by INSYT Cloud Infrastructure • Built for Higher Education
        </p>
      </footer>
    </div>
  );
};

export default SecurityPortal;