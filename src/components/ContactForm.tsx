import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle2, ShieldCheck, Zap, Users2, Building2 } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// allowed categories; keep list synced with pages that open the form
const categories = [
  "general",
  "demo",
  "pricing",
  "standard",
  "sales",
  "enterprise",
] as const;

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  institution: z.string().min(2, "Institution name is required"),
  // z.enum needs a mutable tuple; cast the readonly array accordingly and supply an error object
  category: z.enum(
    categories as unknown as [string, ...string[]],
    { required_error: "Please select an inquiry type" }
  ),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Please keep the message under 1000 characters"),
});

type ContactFormValues = z.infer<typeof formSchema>;

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: typeof categories[number];
}

export const ContactForm = ({ isOpen, onClose, defaultCategory }: ContactFormProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      institution: "",
      category: defaultCategory || "general",
      message: "",
    },
  });

  // when the parent changes the defaultCategory we must update the form
  useEffect(() => {
    if (
      defaultCategory &&
      defaultCategory !== form.getValues().category
    ) {
      form.reset({ ...form.getValues(), category: defaultCategory });
    }
  }, [defaultCategory, form]);

  async function onSubmit(values: ContactFormValues) {
    setSubmitting(true);
    try {
      await addDoc(collection(db, "formenquiry"), {
        ...values,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Inquiry Received",
        description: "Our institutional success team will contact you shortly.",
      });
      form.reset({
        name: "",
        email: "",
        institution: "",
        category: defaultCategory || "general",
        message: "",
      });
      onClose();
    } catch (err) {
      console.error("failed to submit contact form", err);
      toast({
        title: "Submission failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] h-auto p-0 overflow-hidden border-none bg-transparent shadow-none">
        <div className="flex flex-col md:flex-row w-full bg-white rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.2)] max-h-[90vh] overflow-y-auto">
          {/* Left Side: Brand & Trust (Dark) */}
          <div className="md:w-[40%] bg-[#0f172a] p-6 md:p-12 text-white relative flex flex-col justify-between overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c3aed]/20 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7c3aed]/10 rounded-full blur-[60px] -ml-24 -mb-24" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6 md:mb-12">
                <div className="w-8 md:w-10 h-8 md:h-10 rounded-xl bg-[#7c3aed] flex items-center justify-center">
                  <Zap className="w-5 md:w-6 h-5 md:h-6 text-white" />
                </div>
                <span className="font-display font-black text-xl md:text-2xl tracking-tighter">INSYT</span>
              </div>

              <h2 className="font-display text-2xl md:text-3xl font-black leading-tight mb-4 md:mb-8">
                The future of <br />
                <span className="text-[#7c3aed] italic">academic excellence</span> <br />
                starts here.
              </h2>

              <div className="space-y-3 md:space-y-6">
                {[
                  { icon: ShieldCheck, text: "Enterprise-grade privacy & security" },
                  { icon: Users2, text: "Seamless multi-role integration" },
                  { icon: Building2, text: "Custom mapped for your curriculum" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-white/70">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-[#7c3aed]" />
                    </div>
                    <p className="text-sm font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-6 md:pt-12 mt-6 md:mt-12 border-t border-white/10">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2 md:mb-4">Trusted Institutions</p>
              <div className="grid grid-cols-2 gap-4 grayscale opacity-40">
                <div className="text-sm font-black italic">ICEM</div>
                <div className="text-sm font-black italic">IGSB</div>
              </div>
            </div>
          </div>

          {/* Right Side: Form (Clean White background for high-contrast) */}
          <div className="md:w-[60%] p-4 md:p-8 bg-white relative">
            <div className="max-w-sm mx-auto">
              <div className="mb-2 md:mb-3">
                <h3 className="text-base md:text-lg font-black text-[#0f172a] mb-0.5">Request Consultation</h3>
                <p className="text-slate-500 text-[11px] md:text-xs font-medium">Complete the form and our experts will reach out.</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1 md:space-y-1.5">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="h-8 md:h-9 bg-slate-50 border-slate-100 text-slate-900 rounded-xl focus-visible:ring-[#7c3aed]/20 placeholder:text-slate-300" {...field} />
                          </FormControl>
                          <FormMessage className="text-[#f43f5e] font-bold text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Work Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john@uni.edu" className="h-8 md:h-9 bg-slate-50 border-slate-100 text-slate-900 rounded-xl focus-visible:ring-[#7c3aed]/20 placeholder:text-slate-300" {...field} />
                          </FormControl>
                          <FormMessage className="text-[#f43f5e] font-bold text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Institution Name</FormLabel>
                        <FormControl>
                          <Input placeholder="University of Technology" className="h-8 md:h-9 bg-slate-50 border-slate-100 text-slate-900 rounded-xl focus-visible:ring-[#7c3aed]/20 placeholder:text-slate-300" {...field} />
                        </FormControl>
                        <FormMessage className="text-[#f43f5e] font-bold text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Project Scope</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-8 md:h-9 bg-slate-50 border-slate-100 text-slate-900 rounded-xl focus:ring-[#7c3aed]/20 transition-all">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-slate-100 shadow-2xl bg-white">
                            <SelectItem value="general" className="text-slate-700">Strategic Partnership</SelectItem>
                            <SelectItem value="demo" className="text-slate-700">Request Deep Dive Demo</SelectItem>
                            <SelectItem value="pricing" className="text-slate-700">Enterprise Pricing Quote</SelectItem>
                            <SelectItem value="standard" className="text-slate-700">Standard Implementation</SelectItem>
                            <SelectItem value="sales" className="text-slate-700">Sales Inquiry</SelectItem>
                            <SelectItem value="enterprise" className="text-slate-700">Enterprise Deployment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[#f43f5e] font-bold text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Additional Context</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your institutional goals..." 
                            maxLength={1000}
                            className="bg-slate-50 border-slate-100 text-slate-900 rounded-xl min-h-[50px] md:min-h-[60px] resize-none focus-visible:ring-[#7c3aed]/20 placeholder:text-slate-300" 
                            {...field} 
                          />
                        </FormControl>
                        <div className="flex justify-between items-center">
                          <FormMessage className="text-[#f43f5e] font-bold text-[10px]" />
                          <span className="text-xs text-slate-400">
                            {form.watch("message").length}/1000
                          </span>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="pt-0.5">
                    <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-8 md:h-9 rounded-xl font-black text-xs gap-1.5 shadow-xl shadow-[#7c3aed]/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                  >
                    {submitting ? "Submitting…" : "Submit Request"}
                    <CheckCircle2 className="w-3 h-3" />
                  </Button>
                    <p className="text-center text-[8px] text-slate-400 mt-0.5 uppercase tracking-widest font-bold">Typically responds in under 4 hours</p>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

