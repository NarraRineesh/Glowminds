import { useState } from 'react'
import { motion } from 'framer-motion'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import useAppStore from '@/store/authStore'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/SEO'
import '@/styles/landing.css'
import '@/styles/forms.css'
import PublicFaqItem from '@/features/public/components/PublicFaqItem'
import { fadeUp, motionEase, staggerContact } from '@/features/public/motionVariants'

const CONTACT_INFO = [
  { ico: '📧', title: 'Email Us', value: 'hello@studentsai.in', desc: 'We reply within 24 hours' },
  { ico: '📞', title: 'Call Us', value: '+91 98765 43210', desc: 'Mon-Fri, 9 AM - 6 PM IST' },
  { ico: '📍', title: 'Visit Us', value: 'Bangalore, India', desc: 'HSR Layout, Sector 1' },
  { ico: '💬', title: 'Live Chat', value: 'In-app AI assistant', desc: 'Available 24/7' },
]

const FAQS = [
  { q: 'Is Glowminds affordable?', a: 'Absolutely! Glowminds offers affordable plans designed for students and fresh graduates. All core features — resume builder, job matching, AI coach, and application tracker — are available at student-friendly prices.' },
  { q: 'How does the AI job matching work?', a: 'Our AI scans 50+ job portals daily and compares job requirements with your skills, education, and preferences to generate a personalized match score.' },
  { q: 'Can I use Glowminds if I\'m not a student?', a: 'Absolutely! While we\'re optimized for students and fresh graduates, anyone early in their career can benefit from our tools.' },
  { q: 'How is my data protected?', a: 'We follow industry-standard security practices. Your data is encrypted, never sold to third parties, and you can delete your account anytime.' },
  { q: 'Do you support international job portals?', a: 'Currently we focus on Indian job portals, but we\'re expanding to international portals including LinkedIn, Indeed, and Glassdoor soon.' },
]

export default function ContactPage() {
  const { addToast } = useAppStore()
  const [form, setForm] = useState({ name: '', email: '', mobile: '', subject: '', message: '' })
  const [openFaq, setOpenFaq] = useState(null)
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState({})

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateMobile = (mobile) => {
    // Indian mobile number: 10 digits, optional +91 or 0 prefix
    const mobileRegex = /^(\+91|91|0)?[6-9]\d{9}$/
    return mobileRegex.test(mobile.replace(/[\s-]/g, ''))
  }

  const validateForm = () => {
    const newErrors = {}

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Mobile validation (optional but must be valid if provided)
    if (form.mobile.trim() && !validateMobile(form.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number'
    }

    // Message validation
    if (!form.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (form.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!validateForm()) {
      addToast('error', 'Please fix the errors in the form')
      return
    }

    setSending(true)
    try {
      // Clean mobile number before storing
      const cleanMobile = form.mobile.replace(/[\s-]/g, '')
      
      await addDoc(collection(db, 'contactMessages'), {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: cleanMobile,
        subject: form.subject.trim(),
        message: form.message.trim(),
        createdAt: serverTimestamp(),
      })
      addToast('success', 'Message sent! We\'ll get back to you within 24 hours.')
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
      {/* Hero */}
      <section className="relative overflow-hidden pb-[60px] pt-[calc(60px+40px)]">
        <div className="page-container">
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div className="hero-particles"><span /><span /><span /><span /><span /><span /><span /><span /></div>
          <div className="relative z-[1] mx-auto max-w-[800px] text-center">
          <div className="mb-[18px] inline-flex items-center gap-1.5 rounded-full border border-[rgba(56,139,253,.22)] bg-[var(--color-blu3)] px-[13px] py-[5px] text-[.72rem] font-bold tracking-wide text-[var(--color-blu2)]">✦ CONTACT US</div>
          <h1 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-black leading-tight tracking-tight">
            Get in <span className="grad-txt">Touch</span>
          </h1>
          <p className="mx-auto max-w-[600px] text-[clamp(.88rem,1.6vw,1rem)] leading-relaxed text-[var(--color-txt2)]">
            Have questions, feedback, or just want to say hi? We'd love to hear from you.
          </p>
        </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="pb-12">
        <div className="page-container max-w-[1100px]">
        <motion.div className="g-4" variants={staggerContact} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
          {CONTACT_INFO.map((c) => (
            <motion.div variants={fadeUp} transition={{ duration: .5, ease: motionEase }} key={c.title} className="rounded-[14px] border border-[var(--color-bdr)] bg-[var(--color-surf)] p-6 text-center transition-colors hover:border-[var(--color-bdr2)]">
              <div className="mb-2.5 text-2xl">{c.ico}</div>
              <div className="mb-1 text-[.88rem] font-extrabold">{c.title}</div>
              <div className="mb-1 text-[.82rem] font-semibold text-[var(--color-blu2)]">{c.value}</div>
              <div className="text-[.74rem] text-[var(--color-muted)]">{c.desc}</div>
            </motion.div>
          ))}
        </motion.div>
        </div>
      </section>

      {/* Contact Form + FAQ */}
      <section className="pb-20 pt-10">
        <div className="page-container max-w-[1100px]">
        <div className="g-2-alt">
          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6, ease: motionEase }} className="rounded-2xl border border-[var(--color-bdr)] bg-[var(--color-surf)] p-[clamp(20px,3vw,32px)]">
            <h2 className="mb-1 text-[1.1rem] font-extrabold">Send us a message</h2>
            <p className="mb-5 text-[.8rem] text-[var(--color-txt2)]">Fill out the form and we'll respond within 24 hours.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
              <div className="fg2">
                <div className="fg">
                  <label className="fl" htmlFor="contact-name">Your Name *</label>
                  <input 
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? 'contact-name-err' : undefined}
                    className={`fi ${errors.name ? 'fi-error' : ''}`}
                    placeholder="John Doe" 
                    value={form.name} 
                    onChange={e => {
                      setForm({ ...form, name: e.target.value })
                      if (errors.name) setErrors({ ...errors, name: '' })
                    }} 
                  />
                  {errors.name && <span id="contact-name-err" className="mt-1 text-[.75rem] text-[var(--color-red)]" role="alert">{errors.name}</span>}
                </div>
                <div className="fg">
                  <label className="fl" htmlFor="contact-email">Email Address *</label>
                  <input 
                    id="contact-email"
                    name="email"
                    type="email" 
                    autoComplete="email"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? 'contact-email-err' : undefined}
                    className={`fi ${errors.email ? 'fi-error' : ''}`}
                    placeholder="john@example.com" 
                    value={form.email} 
                    onChange={e => {
                      setForm({ ...form, email: e.target.value })
                      if (errors.email) setErrors({ ...errors, email: '' })
                    }} 
                  />
                  {errors.email && <span id="contact-email-err" className="mt-1 text-[.75rem] text-[var(--color-red)]" role="alert">{errors.email}</span>}
                </div>
              </div>
              <div className="fg2">
                <div className="fg">
                  <label className="fl" htmlFor="contact-mobile">Mobile Number</label>
                  <input 
                    id="contact-mobile"
                    name="tel"
                    type="tel" 
                    autoComplete="tel"
                    aria-invalid={errors.mobile ? true : undefined}
                    aria-describedby={errors.mobile ? 'contact-mobile-err' : undefined}
                    className={`fi ${errors.mobile ? 'fi-error' : ''}`}
                    placeholder="+91 98765 43210" 
                    value={form.mobile} 
                    onChange={e => {
                      setForm({ ...form, mobile: e.target.value })
                      if (errors.mobile) setErrors({ ...errors, mobile: '' })
                    }} 
                  />
                  {errors.mobile && <span id="contact-mobile-err" className="mt-1 text-[.75rem] text-[var(--color-red)]" role="alert">{errors.mobile}</span>}
                </div>
                <div className="fg">
                  <label className="fl" htmlFor="contact-subject">Subject</label>
                  <input 
                    id="contact-subject"
                    name="subject"
                    className="fi" 
                    placeholder="What's this about?" 
                    value={form.subject} 
                    onChange={e => setForm({ ...form, subject: e.target.value })} 
                  />
                </div>
              </div>
              <div className="fg">
                <label className="fl" htmlFor="contact-message">Message *</label>
                <textarea 
                  id="contact-message"
                  name="message"
                  className={`fta min-h-[120px] ${errors.message ? 'fi-error' : ''}`}
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? 'contact-message-err' : undefined}
                  placeholder="Tell us what you need help with…" 
                  value={form.message} 
                  onChange={e => {
                    setForm({ ...form, message: e.target.value })
                    if (errors.message) setErrors({ ...errors, message: '' })
                  }} 
                />
                {errors.message && <span id="contact-message-err" className="mt-1 text-[.75rem] text-[var(--color-red)]" role="alert">{errors.message}</span>}
              </div>
              <button type="submit" className="btn btn-p self-start px-6 py-2.5 min-h-[44px]" disabled={sending}>{sending ? 'Sending...' : '📨 Send Message'}</button>
            </form>
          </motion.div>

          {/* FAQ */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6, ease: motionEase, delay: .15 }}>
            <h2 className="mb-1 text-[1.1rem] font-extrabold">Frequently Asked Questions</h2>
            <p className="mb-5 text-[.8rem] text-[var(--color-txt2)]">Quick answers to common questions.</p>
            <div className="flex flex-col gap-2">
              {FAQS.map((f, i) => (
                <PublicFaqItem
                  key={f.q}
                  q={f.q}
                  a={f.a}
                  index={i}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                  variant="contact"
                />
              ))}
            </div>
          </motion.div>
        </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
