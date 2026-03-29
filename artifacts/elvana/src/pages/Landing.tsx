import { useState, useRef, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Play, X, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Marquee } from "@/components/Marquee";
import { useJoinWaitlist } from "@workspace/api-client-react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type WaitlistFormValues = z.infer<typeof waitlistSchema>;

// Line reveal wrapper — each child text "slides up" from below a mask
function LineReveal({ children, className = "", tag: Tag = "div" as any }: {
  children: React.ReactNode;
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <Tag className="reveal-line translate-y-full opacity-0 will-change-transform">
        {children}
      </Tag>
    </div>
  );
}

export default function Landing() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [successData, setSuccessData] = useState<{ message: string; position: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { email: "" },
  });
  const joinWaitlistMutation = useJoinWaitlist();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // ── HERO TEXT REVEALS ─────────────────────────────────────────────
      gsap.to(".hero-line", {
        y: 0,
        opacity: 1,
        duration: 1.15,
        ease: "expo.out",
        stagger: 0.12,
        delay: 0.2,
      });

      // ── HERO PARALLAX (scrubbed) ──────────────────────────────────────
      gsap.to(".hero-bg-ghost", {
        y: "20%",
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });
      gsap.to(".hero-headline", {
        y: "32%",
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });
      gsap.to(".hero-sub", {
        y: "55%",
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      // ── SECTION REVEALS (reusable) ────────────────────────────────────
      gsap.utils.toArray<HTMLElement>(".reveal-line").forEach((el) => {
        if (el.closest(".hero-section")) return; // hero handled separately above
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            toggleActions: "play none none none",
          },
        });
      });

      // ── PROBLEM CARDS stagger ─────────────────────────────────────────
      gsap.from(".problem-card", {
        y: 60,
        opacity: 0,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: ".problem-grid",
          start: "top 80%",
        },
      });

      // ── SOLUTIONS ROWS slide in from right ────────────────────────────
      gsap.utils.toArray<HTMLElement>(".solution-row").forEach((el, i) => {
        gsap.from(el, {
          x: 80,
          opacity: 0,
          duration: 0.9,
          ease: "expo.out",
          delay: i * 0.1,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
          },
        });
      });

      // ── INSIGHT — PINNED scrub ────────────────────────────────────────
      const insightTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".insight-section",
          start: "top top",
          end: "+=180%",
          scrub: 1.5,
          pin: true,
          anticipatePin: 1,
        },
      });
      insightTl
        .from(".insight-ghost", { scale: 0.7, opacity: 0, ease: "none" })
        .to(".insight-ghost", { scale: 1.15, opacity: 0.07, ease: "none" }, 0)
        .from(".insight-quote", { scale: 0.88, opacity: 0, y: 30, ease: "none" }, 0)
        .to(".insight-quote", { scale: 1, opacity: 1, y: 0, ease: "none" }, 0.3)
        .to(".insight-quote", { scale: 1.04, opacity: 0.4, y: -20, ease: "none" }, 0.7);

      // ── FEATURE ITEMS alternating sides ──────────────────────────────
      gsap.utils.toArray<HTMLElement>(".feature-item").forEach((el, i) => {
        const fromLeft = i % 2 === 0;
        gsap.from(el, {
          x: fromLeft ? -60 : 60,
          opacity: 0,
          duration: 0.85,
          ease: "expo.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
          },
        });
      });

      // ── WHY TITLE parallax vs cards ────────────────────────────────────
      gsap.to(".why-title-col", {
        y: -60,
        ease: "none",
        scrollTrigger: {
          trigger: ".why-section",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      gsap.to(".why-cards-col", {
        y: 60,
        ease: "none",
        scrollTrigger: {
          trigger: ".why-section",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });

      // ── WAITLIST ──────────────────────────────────────────────────────
      gsap.from(".waitlist-inner", {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: {
          trigger: ".waitlist-inner",
          start: "top 85%",
        },
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const onSubmit = async (data: WaitlistFormValues) => {
    joinWaitlistMutation.mutate(
      { data: { email: data.email } },
      {
        onSuccess: (response) => {
          setSuccessData({ message: response.message, position: response.position });
          form.reset();
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.error || "Failed to join. Please try again.";
          form.setError("email", { message: msg });
        },
      }
    );
  };

  return (
    <div ref={containerRef} className="relative bg-background cursor-none overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="hero-section relative min-h-[105vh] flex flex-col justify-center overflow-hidden">

        {/* Ambient glow — drifts up on scroll */}
        <div className="hero-bg-ghost absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#DED4E6]/[0.04] blur-[130px]" />
          <div className="absolute -bottom-40 right-0 w-[600px] h-[500px] rounded-full bg-[#F1EADE]/[0.02] blur-[100px]" />
        </div>

        {/* Ghost watermark — slow drift */}
        <div className="hero-bg-ghost absolute inset-0 flex items-center pointer-events-none select-none overflow-hidden">
          <span className="font-serif text-[clamp(100px,20vw,280px)] leading-none font-bold text-foreground/[0.025] whitespace-nowrap tracking-tight pl-4 translate-y-[8%]">
            ELVANA
          </span>
        </div>

        {/* Nav */}
        <nav className="absolute top-0 w-full px-6 md:px-14 py-8 flex justify-between items-center z-20">
          <div className="font-serif text-[17px] tracking-[0.15em] text-primary uppercase opacity-0 hero-line translate-y-full">
            Elvana
          </div>
          <button
            onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
            className="font-sans text-[11px] tracking-[0.28em] uppercase text-muted-foreground hover:text-primary transition-colors duration-500 cursor-none opacity-0 hero-line translate-y-full"
          >
            Join Waitlist
          </button>
        </nav>

        {/* Hero headline — mid-speed parallax */}
        <div className="hero-headline relative z-10 px-6 md:px-14 lg:px-24 pt-36 pb-6 max-w-6xl mx-auto w-full">
          <div className="overflow-hidden mb-10">
            <p className="hero-line font-sans text-accent tracking-[0.28em] uppercase text-[11px] translate-y-full opacity-0">
              Comfort wins now — Regret pays later.
            </p>
          </div>

          <div className="overflow-hidden mb-3">
            <h1 className="hero-line font-serif text-[clamp(40px,6.5vw,88px)] leading-[1.04] text-primary translate-y-full opacity-0">
              People don't fail
            </h1>
          </div>
          <div className="overflow-hidden mb-3">
            <h1 className="hero-line font-serif text-[clamp(40px,6.5vw,88px)] leading-[1.04] text-primary translate-y-full opacity-0">
              because they lack
            </h1>
          </div>
          <div className="overflow-hidden">
            <h1 className="hero-line font-serif text-[clamp(40px,6.5vw,88px)] leading-[1.04] translate-y-full opacity-0">
              <em className="italic text-foreground/35">Goals</em>
              <span className="text-primary"> or </span>
              <em className="italic text-foreground/35">Knowledge</em>
              <span className="text-primary">.</span>
            </h1>
          </div>
        </div>

        {/* Sub text — faster parallax */}
        <div className="hero-sub relative z-10 px-6 md:px-14 lg:px-24 pb-28 max-w-6xl mx-auto w-full">
          <div className="overflow-hidden mb-12">
            <p className="hero-line font-sans text-lg md:text-xl text-muted-foreground max-w-md leading-relaxed translate-y-full opacity-0">
              They fail because, in the moment, their brain chooses comfort — and guilt comes later.
            </p>
          </div>

          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="overflow-hidden">
              <button
                onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
                className="hero-line group inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.28em] uppercase px-9 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-500 cursor-none translate-y-full opacity-0"
              >
                Get Early Access
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-500" />
              </button>
            </div>
            <div className="overflow-hidden">
              <button
                onClick={() => setIsVideoOpen(true)}
                className="hero-line group inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.28em] uppercase px-9 py-4 border border-border/25 text-muted-foreground hover:text-primary hover:border-border/60 transition-all duration-500 cursor-none translate-y-full opacity-0"
              >
                <Play className="w-3 h-3 fill-current" />
                Watch Video
              </button>
            </div>
          </div>
        </div>

        {/* Scroll line */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none">
          <motion.div
            className="w-[1px] h-14 origin-top bg-gradient-to-b from-foreground/25 to-transparent"
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="font-sans text-[9px] tracking-[0.45em] uppercase text-foreground/20">Scroll</span>
        </div>
      </section>

      {/* ── MARQUEE ────────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── PROBLEM CYCLE ──────────────────────────────────────────────── */}
      <section className="relative py-44 px-6 md:px-14 lg:px-24 overflow-hidden">
        {/* Ghost background — barely visible, barely moving */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
          <span className="font-serif text-[clamp(120px,22vw,360px)] leading-none font-bold text-foreground/[0.022] tracking-tight">
            CYCLE
          </span>
        </div>

        <div className="relative max-w-5xl mx-auto z-10">
          <div className="mb-20">
            <div className="overflow-hidden mb-4">
              <span className="reveal-line font-sans text-[11px] tracking-[0.38em] uppercase text-muted-foreground/35 block translate-y-full opacity-0">
                The pattern
              </span>
            </div>
            <div className="overflow-hidden">
              <h2 className="reveal-line font-serif text-[clamp(32px,5vw,60px)] leading-tight translate-y-full opacity-0">
                The Everyday Cycle
              </h2>
            </div>
          </div>

          <div className="problem-grid grid grid-cols-1 md:grid-cols-3 gap-px bg-border/10">
            {[
              { num: "01", title: "The Urge", desc: "A notification, a moment of stress, or boredom. The trigger is always there." },
              { num: "02", title: "The Action", desc: "Scrolling, eating what you promised you wouldn't, skipping the workout, overspending." },
              { num: "03", title: "The Guilt", desc: "The immediate regret. The slow erosion of self-trust. Repeat tomorrow." },
            ].map((item, i) => (
              <div key={i} className="problem-card bg-background">
                <div className="p-10 md:p-12 group relative overflow-hidden h-full">
                  <div className="absolute top-0 left-0 h-[1px] w-0 bg-gradient-to-r from-accent/50 to-transparent group-hover:w-full transition-[width] duration-700 ease-out" />
                  <span className="font-sans text-[10px] tracking-[0.38em] text-foreground/18 block mb-10">{item.num}</span>
                  <h3 className="font-serif text-2xl mb-5 text-primary group-hover:text-accent/80 transition-colors duration-500">
                    {item.title}
                  </h3>
                  <p className="font-sans text-muted-foreground text-[13px] leading-[1.85]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY SOLUTIONS FAIL ─────────────────────────────────────────── */}
      <section className="why-section relative py-44 px-6 md:px-14 lg:px-24 bg-black/20 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-end overflow-hidden pointer-events-none select-none pr-0">
          <span className="font-serif text-[clamp(120px,20vw,300px)] leading-none font-bold text-foreground/[0.018] tracking-tight">
            WHY
          </span>
        </div>

        <div className="relative max-w-6xl mx-auto z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            <div className="why-title-col lg:col-span-4 will-change-transform">
              <div className="overflow-hidden mb-4">
                <span className="reveal-line font-sans text-[11px] tracking-[0.38em] uppercase text-muted-foreground/35 block translate-y-full opacity-0">
                  The problem
                </span>
              </div>
              <div className="overflow-hidden mb-6">
                <h2 className="reveal-line font-serif text-[clamp(28px,3.5vw,48px)] leading-tight translate-y-full opacity-0">
                  Why what you've tried doesn't work.
                </h2>
              </div>
              <div className="overflow-hidden">
                <p className="reveal-line font-sans text-muted-foreground text-[13px] leading-[1.85] translate-y-full opacity-0">
                  The world is full of advice, blockers, and schedules. None understand human behavior in the moment of decision.
                </p>
              </div>
            </div>

            <div className="why-cards-col lg:col-span-8 will-change-transform">
              {[
                {
                  title: "YouTube & Books",
                  detail: "Work when you're calm and motivated. But when the urge hits at 3 AM, you don't remember a single line. Impulse takes over. Content stays silent.",
                },
                {
                  title: "App Blockers",
                  detail: "Fight human behavior instead of working with it. The moment restriction feels forced, your brain looks for a way out — and always finds one.",
                },
                {
                  title: "Life Coaches",
                  detail: "Listen, adapt, give deeply personal guidance. But they run on schedules, not impulses. When the urge shows up, the right help isn't there.",
                },
              ].map((block, i) => (
                <div
                  key={i}
                  className="solution-row group border-b border-border/10 py-10 flex gap-8 items-start hover:translate-x-2 transition-transform duration-500 ease-out"
                >
                  <span className="font-sans text-[10px] tracking-[0.38em] text-foreground/18 shrink-0 mt-1 w-5">0{i + 1}</span>
                  <div>
                    <h3 className="font-serif text-xl mb-4 text-primary group-hover:text-accent transition-colors duration-500">
                      {block.title}
                    </h3>
                    <p className="font-sans text-muted-foreground text-[13px] leading-[1.85]">{block.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INSIGHT — PINNED SCRUB ─────────────────────────────────────── */}
      <section className="insight-section relative flex items-center justify-center bg-primary text-primary-foreground overflow-hidden"
        style={{ minHeight: "100vh" }}
      >
        {/* Ghost text that scales up dramatically */}
        <div className="insight-ghost absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none opacity-0">
          <span className="font-serif text-[clamp(80px,18vw,260px)] leading-none font-bold text-primary-foreground/[0.06] whitespace-nowrap tracking-tight">
            INTERVENTION
          </span>
        </div>

        <div className="insight-quote relative max-w-4xl mx-auto px-6 md:px-14 text-center opacity-0">
          <span className="font-sans text-[10px] tracking-[0.45em] uppercase text-primary-foreground/30 block mb-12">
            The insight
          </span>
          <blockquote className="font-serif text-[clamp(22px,4vw,52px)] leading-[1.28] text-balance">
            Intervention beats willpower.{" "}
            <span className="italic opacity-45">
              The right advice at the wrong time doesn't work.
              The right help at the right moment does.
            </span>
          </blockquote>
        </div>
      </section>

      {/* ── HOW ELVANA WORKS ───────────────────────────────────────────── */}
      <section className="relative py-44 px-6 md:px-14 lg:px-24 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
          <span className="font-serif text-[clamp(100px,18vw,280px)] leading-none font-bold text-foreground/[0.022] tracking-tight">
            ELVANA
          </span>
        </div>

        <div className="relative max-w-6xl mx-auto z-10">
          <div className="mb-20">
            <div className="overflow-hidden mb-4">
              <span className="reveal-line font-sans text-[11px] tracking-[0.38em] uppercase text-muted-foreground/35 block translate-y-full opacity-0">
                The solution
              </span>
            </div>
            <div className="overflow-hidden">
              <h2 className="reveal-line font-serif text-[clamp(32px,5vw,60px)] leading-tight translate-y-full opacity-0">
                How Elvana works.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24">
            {[
              { title: "Context Aware", desc: "Understands when, where, and which apps pull you in based on your real behavior patterns." },
              { title: "Perfect Timing", desc: "Steps in exactly when a distracting urge appears — not after, not before." },
              { title: "Behavior-Based Alerts", desc: "Notifications triggered by your patterns, not generic daily reminders nobody reads." },
              { title: "Actionable Guidance", desc: "Suggests the right next action for that exact time, context, and emotional state." },
              { title: "Conversational", desc: "Chat, share your schedule, and watch it adapt deeply to how you actually live." },
              { title: "Growth Oriented", desc: "Helps you understand why you slipped — so it can prevent it from happening next time." },
            ].map((feature, i) => (
              <div
                key={i}
                className="feature-item group border-t border-border/10 py-10 flex gap-6 items-start hover:translate-x-1 transition-transform duration-400"
              >
                <motion.div
                  className="mt-2.5 w-1 h-1 rounded-full bg-accent/25 shrink-0"
                  animate={{ scale: [1, 2, 1], opacity: [0.25, 0.7, 0.25] }}
                  transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                />
                <div>
                  <h3 className="font-serif text-xl mb-3 text-primary group-hover:text-accent transition-colors duration-500">
                    {feature.title}
                  </h3>
                  <p className="font-sans text-muted-foreground text-[13px] leading-[1.85]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE REVERSED ───────────────────────────────────────────── */}
      <Marquee direction="right" speed={80} />

      {/* ── WAITLIST ───────────────────────────────────────────────────── */}
      <section id="waitlist" className="relative py-48 px-6 md:px-14 lg:px-24 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
          <span className="font-serif text-[clamp(80px,14vw,200px)] leading-none font-bold text-foreground/[0.02] tracking-tight">
            WAITLIST
          </span>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] rounded-full bg-[#DED4E6]/[0.05] blur-[180px] pointer-events-none" />

        <div className="waitlist-inner relative max-w-3xl mx-auto text-center z-10">
          <div className="overflow-hidden mb-5">
            <span className="reveal-line font-sans text-[11px] tracking-[0.38em] uppercase text-muted-foreground/35 block translate-y-full opacity-0">
              Early access
            </span>
          </div>
          <div className="overflow-hidden mb-3">
            <h2 className="reveal-line font-serif text-[clamp(36px,5.5vw,76px)] leading-[1.1] translate-y-full opacity-0">
              The right help,
            </h2>
          </div>
          <div className="overflow-hidden mb-14">
            <h2 className="reveal-line font-serif text-[clamp(36px,5.5vw,76px)] leading-[1.1] translate-y-full opacity-0">
              right when you need it.
            </h2>
          </div>
          <div className="overflow-hidden mb-16">
            <p className="reveal-line font-sans text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed translate-y-full opacity-0">
              Get early access by joining the waitlist.
            </p>
          </div>

          <div className="max-w-sm mx-auto">
            <AnimatePresence mode="wait">
              {!successData ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2 text-left">
                    <Input
                      placeholder="your@email.com"
                      {...form.register("email")}
                      className={`cursor-none ${form.formState.errors.email ? "border-destructive" : ""}`}
                      disabled={joinWaitlistMutation.isPending}
                    />
                    <AnimatePresence>
                      {form.formState.errors.email && (
                        <motion.span
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-xs text-destructive font-sans tracking-wide"
                        >
                          {form.formState.errors.email.message}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <motion.button
                    type="submit"
                    disabled={joinWaitlistMutation.isPending}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    className="w-full inline-flex items-center justify-center gap-3 group font-sans text-[11px] tracking-[0.28em] uppercase px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-500 disabled:opacity-50 cursor-none"
                  >
                    {joinWaitlistMutation.isPending ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing</>
                    ) : (
                      <>
                        Request Access
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-500" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="border border-accent/20 bg-accent/[0.04] p-12 flex flex-col items-center gap-5"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.15 }}
                  >
                    <CheckCircle2 className="w-10 h-10 text-accent" />
                  </motion.div>
                  <p className="font-serif text-xl text-primary">{successData.message}</p>
                  <p className="font-sans text-sm text-muted-foreground">
                    You are <span className="text-accent">#{successData.position}</span> on the list.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 md:px-14 lg:px-24 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="font-serif text-lg tracking-[0.15em] text-foreground/28 uppercase">Elvana</div>
        <div className="flex gap-10 text-[11px] font-sans uppercase tracking-[0.28em] text-foreground/30">
          {[
            { label: "Instagram", href: "https://instagram.com" },
            { label: "LinkedIn", href: "https://linkedin.com" },
            { label: "Email", href: "mailto:hello@elvana.in" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors duration-400 cursor-none"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="font-sans text-[10px] tracking-[0.22em] text-foreground/20 uppercase">elvana.in</div>
      </footer>

      {/* ── VIDEO MODAL ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[100] bg-background/96 backdrop-blur-xl flex items-center justify-center p-4 md:p-16 cursor-none"
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.button
              className="absolute top-8 right-8 text-foreground/35 hover:text-primary transition-colors cursor-none"
              whileHover={{ rotate: 90, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsVideoOpen(false)}
            >
              <X className="w-5 h-5" />
            </motion.button>
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 40 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-5xl aspect-video bg-black border border-border/12 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/4_M5WuR8fkA?autoplay=1"
                title="Elvana Explainer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
