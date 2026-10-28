import { useState } from 'react'
import { motion } from 'framer-motion'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import useAppStore from '@/store/authStore'
import SEO from '@/components/SEO'
import {
  PAGE_SEO,
  breadcrumbSchema,
  contactPageSchema,
  faqPageSchema,
  normalizeStructuredData,
  organizationSchema,
} from '@/config/seo'
import PublicFaqItem from '@/features/public/components/PublicFaqItem'
import {
  PublicPageContainer,
  PublicPageHeroBackdrop,
  PublicPageSection,
} from '@/features/public/components/publicPageUi'
import { fadeUp, motionEase, staggerContact } from '@/features/public/motionVariants'
import useLandingConfig from '@/hooks/useLandingConfig'
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

import { LEGAL_ADDRESS_ONE_LINE, LEGAL_EMAIL, LEGAL_NAME } from '@/config/legal'

const FAQS = [
  { q: 'Is Glowminds affordable?', a: 'Absolutely! Glowminds offers affordable plans designed for students and fresh graduates. All core features — resume builder, job matching, AI coach, and application tracker — are available at student-friendly prices.' },
  { q: 'How does the AI job matching work?', a: 'Our AI scans 50+ job portals daily and compares job requirements with your skills, education, and preferences to generate a personalized match score.' },
  { q: "Can I use Glowminds if I'm not a student?", a: "Absolutely! While we're optimized for students and fresh graduates, anyone early in their career can benefit from our tools." },
  { q: 'How is my data protected?', a: 'We follow industry-standard security practices. Your data is encrypted, never sold to third parties, and you can delete your account anytime.' },
  { q: 'Do you support jobs outside India?', a: 'Yes. Glowminds lists roles worldwide — including remote and international openings — then you can match, apply, and track them in the same Career OS.' },
]

export default function ContactPage() {
  const { addToast } = useAppStore()
  const { config: landingConfig } = useLandingConfig()
  const legalContact = [
    { ico: 'envelope', title: 'Email Us', value: LEGAL_EMAIL, desc: 'We reply within 24 hours' },
    { ico: 'map-pin', title: 'Registered office', value: LEGAL_NAME, desc: LEGAL_ADDRESS_ONE_LINE },
    { ico: 'chat', title: 'Live Chat', value: 'In-app Glow (Bot)', desc: 'Available in the dashboard' },
  ]
  const rawContact = landingConfig.contactInfo || []
  const contactInfo = rawContact.some((c) => /98765 43210|HSR Layout/i.test(`${c.value || ''} ${c.desc || ''}`))
    ? legalContact
    : (rawContact.length ? rawContact : legalContact)
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
        {...PAGE_SEO.contact}
        structuredData={normalizeStructuredData([
          organizationSchema(),
          contactPageSchema(),
          faqPageSchema(FAQS),
          breadcrumbSchema([
            { label: 'Home', path: '/' },
            { label: 'Contact', path: '/contact' },
          ]),
        ])}
      />

      <section className="relative overflow-hidden py-12 md:py-16">
        <PublicPageHeroBackdrop />
        <PublicPageContainer className="relative z-10 text-center">
          <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/10 text-primary">
            ✦ CONTACT US
          </Badge>
          <h1 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-black leading-tight tracking-tight text-foreground">
            Get in <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Have questions, feedback, or just want to say hi? We&apos;d love to hear from you.
          </p>
        </PublicPageContainer>
      </section>

      <PublicPageSection className="pt-0 pb-16 md:pb-20">
        <PublicPageContainer className="space-y-12">
          <motion.div
            variants={staggerContact}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {contactInfo.map((c) => (
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

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
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
                        placeholder="10-digit mobile (optional)"
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
        </PublicPageContainer>
      </PublicPageSection>
    </div>
  )
}
