import { useState } from 'react'
import { motion } from 'framer-motion'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import useAppStore from '@/store/authStore'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/SEO'
import PublicFaqItem from '@/features/public/components/PublicFaqItem'
import { fadeUp, motionEase, staggerContact } from '@/features/public/motionVariants'
import { AppIcon,
  Accordion,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  FormRow,
  Input,
  Textarea,
} from '@/components/ui'

const CONTACT_INFO = [
  { ico: 'envelope', title: 'Email Us', value: 'hello@studentsai.in', desc: 'We reply within 24 hours' },
  { ico: 'phone', title: 'Call Us', value: '+91 98765 43210', desc: 'Mon-Fri, 9 AM - 6 PM IST' },
  { ico: 'map-pin', title: 'Visit Us', value: 'Bangalore, India', desc: 'HSR Layout, Sector 1' },
  { ico: 'chat', title: 'Live Chat', value: 'In-app AI assistant', desc: 'Available 24/7' },
]

const FAQS = [
  { q: 'Is Glowminds affordable?', a: 'Absolutely! Glowminds offers affordable plans designed for students and fresh graduates. All core features — resume builder, job matching, AI coach, and application tracker — are available at student-friendly prices.' },
  { q: 'How does the AI job matching work?', a: 'Our AI scans 50+ job portals daily and compares job requirements with your skills, education, and preferences to generate a personalized match score.' },
  { q: "Can I use Glowminds if I'm not a student?", a: "Absolutely! While we're optimized for students and fresh graduates, anyone early in their career can benefit from our tools." },
  { q: 'How is my data protected?', a: 'We follow industry-standard security practices. Your data is encrypted, never sold to third parties, and you can delete your account anytime.' },
  { q: 'Do you support international job portals?', a: "Currently we focus on Indian job portals, but we're expanding to international portals including LinkedIn, Indeed, and Glassdoor soon." },
]

export default function ContactPage() {
  const { addToast } = useAppStore()
  const [form, setForm] = useState({ name: '', email: '', mobile: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState({})

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validateMobile = (mobile) => /^(\+91|91|0)?[6-9]\d{9}$/.test(mobile.replace(/[\s-]/g, ''))

  const validateForm = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    else if (form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters'
    if (!form.email.trim()) newErrors.email = 'Email is required'
    else if (!validateEmail(form.email)) newErrors.email = 'Please enter a valid email address'
    if (form.mobile.trim() && !validateMobile(form.mobile)) newErrors.mobile = 'Please enter a valid 10-digit mobile number'
    if (!form.message.trim()) newErrors.message = 'Message is required'
    else if (form.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      addToast('error', 'Please fix the errors in the form')
      return
    }
    setSending(true)
    try {
      const cleanMobile = form.mobile.replace(/[\s-]/g, '')
      await addDoc(collection(db, 'contactMessages'), {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: cleanMobile,
        subject: form.subject.trim(),
        message: form.message.trim(),
        createdAt: serverTimestamp(),
      })
      addToast('success', "Message sent! We'll get back to you within 24 hours.")
      setForm({ name: '', email: '', mobile: '', subject: '', message: '' })
      setErrors({})
    } catch (err) {
      console.error('Contact form error:', err)
      addToast('error', 'Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <SEO
        title="Contact Us"
        path="/contact"
        description="Get in touch with the Glowminds team. Email us at hello@studentsai.in for support, partnerships, or media inquiries. We reply within 24 hours."
        keywords="contact Glowminds, Glowminds support email, career platform contact, student support team, partnership inquiry, media contact"
      />

      <section className="relative overflow-hidden px-4 pb-10 pt-8 md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 text-center md:px-8">
          <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/10 text-primary">
            ✦ CONTACT US
          </Badge>
          <h1 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-black leading-tight tracking-tight text-foreground">
            Get in <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Have questions, feedback, or just want to say hi? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <motion.div
            variants={staggerContact}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {CONTACT_INFO.map((c) => (
              <motion.div key={c.title} variants={fadeUp} transition={{ duration: 0.5, ease: motionEase }}>
                <Card className="h-full text-center transition-colors hover:border-primary/30">
                  <CardContent className="pt-6">
                    <div className="mb-2 text-2xl"><AppIcon name={c.ico} className="size-5 text-primary" /></div>
                    <CardTitle className="text-sm">{c.title}</CardTitle>
                    <p className="my-1 text-sm font-semibold text-primary">{c.value}</p>
                    <CardDescription>{c.desc}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="pb-16 pt-4 md:pb-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 md:px-8 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: motionEase }}>
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>Fill out the form and we&apos;ll respond within 24 hours.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                  <FormRow>
                    <FormField label="Your Name *" htmlFor="contact-name" error={errors.name}>
                      <Input
                        id="contact-name"
                        name="name"
                        autoComplete="name"
                        aria-invalid={errors.name ? true : undefined}
                        className={errors.name ? 'border-destructive' : undefined}
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => {
                          setForm({ ...form, name: e.target.value })
                          if (errors.name) setErrors({ ...errors, name: '' })
                        }}
                      />
                    </FormField>
                    <FormField label="Email Address *" htmlFor="contact-email" error={errors.email}>
                      <Input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        aria-invalid={errors.email ? true : undefined}
                        className={errors.email ? 'border-destructive' : undefined}
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={(e) => {
                          setForm({ ...form, email: e.target.value })
                          if (errors.email) setErrors({ ...errors, email: '' })
                        }}
                      />
                    </FormField>
                  </FormRow>
                  <FormRow>
                    <FormField label="Mobile Number" htmlFor="contact-mobile" error={errors.mobile}>
                      <Input
                        id="contact-mobile"
                        name="tel"
                        type="tel"
                        autoComplete="tel"
                        aria-invalid={errors.mobile ? true : undefined}
                        className={errors.mobile ? 'border-destructive' : undefined}
                        placeholder="+91 98765 43210"
                        value={form.mobile}
                        onChange={(e) => {
                          setForm({ ...form, mobile: e.target.value })
                          if (errors.mobile) setErrors({ ...errors, mobile: '' })
                        }}
                      />
                    </FormField>
                    <FormField label="Subject" htmlFor="contact-subject">
                      <Input
                        id="contact-subject"
                        name="subject"
                        placeholder="What's this about?"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      />
                    </FormField>
                  </FormRow>
                  <FormField label="Message *" htmlFor="contact-message" error={errors.message}>
                    <Textarea
                      id="contact-message"
                      name="message"
                      className={errors.message ? 'min-h-[120px] border-destructive' : 'min-h-[120px]'}
                      aria-invalid={errors.message ? true : undefined}
                      placeholder="Tell us what you need help with…"
                      value={form.message}
                      onChange={(e) => {
                        setForm({ ...form, message: e.target.value })
                        if (errors.message) setErrors({ ...errors, message: '' })
                      }}
                    />
                  </FormField>
                  <Button type="submit" className="self-start min-h-[44px] px-6" disabled={sending}>
                    {sending ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: motionEase, delay: 0.15 }}
          >
            <h2 className="mb-1 text-lg font-extrabold text-foreground">Frequently Asked Questions</h2>
            <p className="mb-5 text-sm text-muted-foreground">Quick answers to common questions.</p>
            <Accordion type="single" collapsible className="flex flex-col gap-2">
              {FAQS.map((f, i) => (
                <motion.div key={f.q} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <PublicFaqItem q={f.q} a={f.a} value={String(i)} variant="contact" />
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
