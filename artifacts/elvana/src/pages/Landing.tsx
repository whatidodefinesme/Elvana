import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from "framer-motion";
import { Loader2, ArrowRight, Play, X, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Marquee } from "@/components/Marquee";
import { useJoinWaitlist } from "@workspace/api-client-react";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type WaitlistFormValues = z.infer<typeof waitlistSchema>;

// Smoothed scroll value helper
function useSmoothScroll() {
  const { scrollY } = useScroll();
  return useSpring(scrollY, { stiffness: 80, damping: 20, mass: 0.8 });
}

// Ghost oversized text that drifts slowly in background
function GhostText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}>
      <motion.div
        style={{ y }}
        className="flex items-center justify-center h-full"
      >
        <span className="font-serif text-[clamp(80px,18vw,220px)] leading-none font-bold text-foreground/[0.025] whitespace-nowrap tracking-tight">
          {text}
        </span>
      </motion.div>
    </div>
  );
}

// Reveal component with directional entrance
function SlideIn({
  children,
  from = "bottom",
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  from?: "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-12% 0px" });
  const initial = {
    bottom: { opacity: 0, y: 60 },
    left: { opacity: 0, x: -80 },
    right: { opacity: 0, x: 80 },
  }[from];

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : initial}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Parallax image/block that moves at a different speed than surrounding content
function ParallaxLayer({
  children,
  factor = 0.4,
  className = "",
}: {
  children: React.ReactNode;
  factor?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${factor * -50}%`, `${factor * 50}%`]);
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}

export default function Landing() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [successData, setSuccessData] = useState<{ message: string; position: number } | null>(null);

  // Hero parallax layers
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Background layer — moves up very slowly (depth illusion)
  const bgY = useTransform(heroProgress, [0, 1], ["0%", "15%"]);
  // Main headline — mid-speed
  const headlineY = useTransform(heroProgress, [0, 1], ["0%", "35%"]);
  // Sub text — slightly faster
  const subY = useTransform(heroProgress, [0, 1], ["0%", "50%"]);
  // Fade out as hero scrolls away
  const heroOpacity = useTransform(heroProgress, [0, 0.75], [1, 0]);

  // Insight section pinned parallax
  const insightRef = useRef<HTMLElement>(null);
  const { scrollYProgress: insightProgress } = useScroll({
    target: insightRef,
    offset: ["start end", "end start"],
  });
  const insightScale = useTransform(insightProgress, [0, 0.5, 1], [0.88, 1, 1.05]);
  const insightOpacity = useTransform(insightProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0.3]);

  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { email: "" },
  });
  const joinWaitlistMutation = useJoinWaitlist();

  const onSubmit = async (data: WaitlistFormValues) => {
    joinWaitlistMutation.mutate(
      { data: { email: data.email } },
      {
        onSuccess: (response) => {
          setSuccessData({ message: response.message, position: response.position });
          form.reset();
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.error || "Failed to join waitlist. Please try again.";
          form.setError("email", { message: msg });
        },
      }
    );
  };

  return (
    <div className="relative min-h-screen bg-background cursor-none overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[105vh] flex flex-col justify-center overflow-hidden"
      >
        {/* Ambient blob — barely moves, deep background */}
        <motion.div
          style={{ y: bgY }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#DED4E6]/[0.04] blur-[140px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full bg-[#F1EADE]/[0.02] blur-[100px]" />
        </motion.div>

        {/* Giant ghost watermark — very slow drift */}
        <motion.div
          style={{ y: bgY, opacity: heroOpacity }}
          className="absolute inset-0 flex items-center justify-start pl-4 pointer-events-none select-none overflow-hidden"
        >
          <span className="font-serif text-[clamp(120px,22vw,320px)] leading-none font-bold text-foreground/[0.022] whitespace-nowrap tracking-tight">
            ELVANA
          </span>
        </motion.div>

        {/* Nav */}
        <motion.nav
          style={{ opacity: heroOpacity }}
          className="absolute top-0 w-full px-6 md:px-12 py-8 flex justify-between items-center z-20"
        >
          <motion.div
            className="font-serif text-xl tracking-[0.15em] text-primary uppercase"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            Elvana
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
            className="font-sans text-[11px] tracking-[0.25em] uppercase text-muted-foreground hover:text-primary transition-colors duration-400 cursor-none"
          >
            Join Waitlist
          </motion.button>
        </motion.nav>

        {/* Headline — mid-speed parallax */}
        <motion.div
          style={{ y: headlineY, opacity: heroOpacity }}
          className="relative z-10 px-6 md:px-12 lg:px-24 pt-40 pb-8 max-w-6xl mx-auto w-full"
        >
          <motion.p
            className="font-sans text-accent tracking-[0.28em] uppercase text-[11px] mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Comfort wins now, Regret pays later.
          </motion.p>
          <motion.h1
            className="font-serif text-[clamp(42px,7vw,96px)] leading-[1.04] text-balance text-primary"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            People don't fail because they lack{" "}
            <em className="italic text-foreground/40">Goals</em>{" "}
            or{" "}
            <em className="italic text-foreground/40">Knowledge</em>.
          </motion.h1>
        </motion.div>

        {/* Sub text — fastest parallax layer */}
        <motion.div
          style={{ y: subY, opacity: heroOpacity }}
          className="relative z-10 px-6 md:px-12 lg:px-24 pb-24 max-w-6xl mx-auto w-full"
        >
          <motion.p
            className="font-sans text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed mb-14"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            They fail because, in the moment, their brain chooses comfort — and guilt comes later.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
              className="group inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.25em] uppercase px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-400 cursor-none"
            >
              Get Early Access
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-400" />
            </button>
            <button
              onClick={() => setIsVideoOpen(true)}
              className="group inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.25em] uppercase px-8 py-4 border border-border/25 text-muted-foreground hover:text-primary hover:border-border/50 transition-all duration-400 cursor-none"
            >
              <Play className="w-3 h-3 fill-current" />
              Watch Video
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          style={{ opacity: useTransform(heroProgress, [0, 0.25], [1, 0]) }}
        >
          <motion.div
            className="w-[1px] h-12 origin-top bg-gradient-to-b from-foreground/30 to-transparent"
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.3 }}
          />
          <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-foreground/20">Scroll</span>
        </motion.div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── PROBLEM CYCLE ────────────────────────────────────────────────── */}
      <section className="relative py-40 px-6 md:px-12 lg:px-24 overflow-hidden">
        <GhostText text="CYCLE" />

        <div className="relative max-w-5xl mx-auto z-10">
          <SlideIn from="bottom">
            <div className="mb-20">
              <span className="font-sans text-[11px] tracking-[0.35em] uppercase text-muted-foreground/40 block mb-5">The pattern</span>
              <h2 className="font-serif text-[clamp(32px,5vw,60px)] leading-tight">The Everyday Cycle</h2>
            </div>
          </SlideIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/8">
            {[
              { num: "01", title: "The Urge", desc: "A notification, a stressful moment, or sheer boredom. The trigger is always there." },
              { num: "02", title: "The Action", desc: "Scrolling, eating what you promised you wouldn't, skipping the workout, overspending." },
              { num: "03", title: "The Guilt", desc: "The regret. The slow erosion of self-trust. The promise to do better tomorrow." },
            ].map((item, i) => (
              <SlideIn key={i} from={["left", "bottom", "right"][i] as "left" | "bottom" | "right"} delay={i * 0.12}>
                <motion.div
                  className="bg-background p-12 group relative overflow-hidden h-full"
                  whileHover={{ backgroundColor: "rgba(241,234,222,0.025)" }}
                  transition={{ duration: 0.5 }}
                >
                  {/* top accent line */}
                  <motion.div
                    className="absolute top-0 left-0 h-[1px] bg-gradient-to-r from-accent/40 to-transparent"
                    initial={{ width: 0 }}
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="font-sans text-[10px] tracking-[0.35em] text-foreground/20 block mb-10">{item.num}</span>
                  <h3 className="font-serif text-2xl mb-5 text-primary group-hover:text-accent/80 transition-colors duration-500">{item.title}</h3>
                  <p className="font-sans text-muted-foreground text-sm leading-[1.8]">{item.desc}</p>
                </motion.div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY SOLUTIONS FAIL ───────────────────────────────────────────── */}
      <section className="relative py-40 px-6 md:px-12 lg:px-24 bg-black/25 overflow-hidden">
        <GhostText text="WHY" />

        <div className="relative max-w-6xl mx-auto z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            {/* Sticky title that drifts up slowly */}
            <div className="lg:col-span-4">
              <ParallaxLayer factor={0.15} className="h-full">
                <div className="lg:sticky lg:top-32">
                  <SlideIn from="left">
                    <span className="font-sans text-[11px] tracking-[0.35em] uppercase text-muted-foreground/40 block mb-6">The problem</span>
                    <h2 className="font-serif text-[clamp(32px,4vw,52px)] leading-tight mb-6">
                      Why what you've tried doesn't work.
                    </h2>
                    <p className="font-sans text-muted-foreground text-sm leading-relaxed">
                      The world is full of advice, blockers, and schedules. None understand human behavior in the moment of decision.
                    </p>
                  </SlideIn>
                </div>
              </ParallaxLayer>
            </div>

            {/* Cards that drift faster */}
            <div className="lg:col-span-8">
              <ParallaxLayer factor={-0.1} className="h-full">
                <div className="space-y-px">
                  {[
                    {
                      title: "YouTube & Books",
                      detail: "Work only when you're calm and motivated. But when the urge hits at 3 AM, you don't remember a single line. Impulse takes over. Content stays silent.",
                    },
                    {
                      title: "App Blockers",
                      detail: "They fight human behavior instead of working with it. The moment restriction feels forced, your brain looks for a way out — and always finds one.",
                    },
                    {
                      title: "Life Coaches",
                      detail: "They listen and adapt and give deeply personal guidance. But they run on schedules, not on impulses. When the urge shows up, the right help isn't there.",
                    },
                  ].map((block, i) => (
                    <SlideIn key={i} from="right" delay={i * 0.1}>
                      <motion.div
                        className="group border-b border-border/10 py-10 flex gap-8 items-start"
                        whileHover={{ x: 10 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      >
                        <span className="font-sans text-[10px] tracking-[0.35em] text-foreground/20 shrink-0 mt-1 w-5">0{i + 1}</span>
                        <div>
                          <h3 className="font-serif text-xl mb-4 text-primary group-hover:text-accent transition-colors duration-500">{block.title}</h3>
                          <p className="font-sans text-muted-foreground text-sm leading-[1.8]">{block.detail}</p>
                        </div>
                      </motion.div>
                    </SlideIn>
                  ))}
                </div>
              </ParallaxLayer>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE INSIGHT (cinematic zoom) ─────────────────────────────────── */}
      <section
        ref={insightRef}
        className="relative py-48 px-6 md:px-12 lg:px-24 bg-primary text-primary-foreground overflow-hidden"
      >
        {/* Background ghost that zooms past */}
        <motion.div
          style={{ scale: insightScale, opacity: insightOpacity }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        >
          <span className="font-serif text-[clamp(80px,20vw,260px)] leading-none font-bold text-primary-foreground/[0.05] whitespace-nowrap tracking-tight">
            INTERVENTION
          </span>
        </motion.div>

        <motion.div
          style={{ scale: insightScale, opacity: insightOpacity }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <span className="font-sans text-[10px] tracking-[0.4em] uppercase text-primary-foreground/30 block mb-12">The insight</span>
          <blockquote className="font-serif text-[clamp(24px,4.5vw,54px)] leading-[1.25] text-balance">
            Intervention beats willpower.{" "}
            <span className="italic opacity-50">
              The right advice at the wrong time doesn't work. The right help at the right moment does.
            </span>
          </blockquote>
        </motion.div>
      </section>

      {/* ── HOW ELVANA WORKS ─────────────────────────────────────────────── */}
      <section className="relative py-40 px-6 md:px-12 lg:px-24 overflow-hidden">
        <GhostText text="ELVANA" />

        <div className="relative max-w-6xl mx-auto z-10">
          <SlideIn from="bottom">
            <span className="font-sans text-[11px] tracking-[0.35em] uppercase text-muted-foreground/40 block mb-5">The solution</span>
            <h2 className="font-serif text-[clamp(32px,5vw,60px)] leading-tight mb-24">
              How Elvana works.
            </h2>
          </SlideIn>

          {/* Features — alternating left / right entrances */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-0">
            {[
              { title: "Context Aware", desc: "Understands when, where, and which apps pull you in based on your real behavior patterns." },
              { title: "Perfect Timing", desc: "Steps in exactly when a distracting urge appears — not after, not before." },
              { title: "Behavior-Based Alerts", desc: "Notifications triggered by your patterns, not generic daily reminders nobody reads." },
              { title: "Actionable Guidance", desc: "Suggests the right next action for that exact time, context, and emotional state." },
              { title: "Conversational", desc: "Chat, share your schedule, and watch it adapt deeply to how you actually live." },
              { title: "Growth Oriented", desc: "Helps you understand why you slipped — so it can help prevent it from happening next time." },
            ].map((feature, i) => (
              <SlideIn key={i} from={i % 2 === 0 ? "left" : "right"} delay={0.05}>
                <motion.div
                  className="group border-t border-border/10 py-10 flex gap-6 items-start"
                  whileHover={{ x: i % 2 === 0 ? 8 : -8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <motion.div
                    className="mt-2.5 w-1 h-1 rounded-full bg-accent/30 shrink-0"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                  />
                  <div>
                    <h3 className="font-serif text-xl mb-3 text-primary group-hover:text-accent transition-colors duration-400">{feature.title}</h3>
                    <p className="font-sans text-muted-foreground text-sm leading-[1.8]">{feature.desc}</p>
                  </div>
                </motion.div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE reversed ─────────────────────────────────────────────── */}
      <Marquee direction="right" speed={80} />

      {/* ── WAITLIST ─────────────────────────────────────────────────────── */}
      <section id="waitlist" className="relative py-48 px-6 md:px-12 lg:px-24 overflow-hidden">
        <GhostText text="WAITLIST" />

        {/* Rising glow from below */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full bg-[#DED4E6]/[0.06] blur-[160px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center z-10">
          <SlideIn from="bottom">
            <span className="font-sans text-[11px] tracking-[0.35em] uppercase text-muted-foreground/40 block mb-8">Early access</span>
            <h2 className="font-serif text-[clamp(36px,6vw,80px)] leading-tight mb-6">
              The right help,<br />right when you need it.
            </h2>
            <p className="font-sans text-lg text-muted-foreground mb-16 max-w-md mx-auto leading-relaxed">
              Get early access to Elvana by joining the waitlist.
            </p>
          </SlideIn>

          <SlideIn from="bottom" delay={0.15}>
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
                        className={`text-base cursor-none ${form.formState.errors.email ? "border-destructive" : ""}`}
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
                      className="w-full inline-flex items-center justify-center gap-3 group font-sans text-[11px] tracking-[0.25em] uppercase px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-400 disabled:opacity-50 cursor-none"
                    >
                      {joinWaitlistMutation.isPending ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing</>
                      ) : (
                        <>
                          Request Access
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-400" />
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
          </SlideIn>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 md:px-12 lg:px-24 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="font-serif text-lg tracking-[0.15em] text-foreground/30 uppercase">Elvana</div>
        <div className="flex gap-10 text-[11px] font-sans uppercase tracking-[0.25em] text-foreground/30">
          {[
            { label: "Instagram", href: "https://instagram.com" },
            { label: "LinkedIn", href: "https://linkedin.com" },
            { label: "Email", href: "mailto:hello@elvana.in" },
          ].map(({ label, href }) => (
            <motion.a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors duration-300 cursor-none"
              whileHover={{ y: -2 }}
            >
              {label}
            </motion.a>
          ))}
        </div>
        <div className="font-sans text-[10px] tracking-[0.2em] text-foreground/20 uppercase">elvana.in</div>
      </footer>

      {/* ── VIDEO MODAL ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[100] bg-background/96 backdrop-blur-lg flex items-center justify-center p-4 md:p-16 cursor-none"
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.button
              className="absolute top-8 right-8 text-foreground/40 hover:text-primary transition-colors cursor-none"
              whileHover={{ rotate: 90, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsVideoOpen(false)}
            >
              <X className="w-5 h-5" />
            </motion.button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-5xl aspect-video bg-black border border-border/15"
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
