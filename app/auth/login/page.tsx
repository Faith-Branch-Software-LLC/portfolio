'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Mail, LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

const BUBBLES = [
  { size: 30,  left: '6%',  bottom: '-50px',  duration: '14s', delay: '0s',    opacity: 0.10 },
  { size: 70,  left: '12%', bottom: '-80px',  duration: '20s', delay: '4s',    opacity: 0.06 },
  { size: 20,  left: '22%', bottom: '-40px',  duration: '11s', delay: '1.5s',  opacity: 0.12 },
  { size: 55,  left: '35%', bottom: '-70px',  duration: '17s', delay: '7s',    opacity: 0.07 },
  { size: 90,  left: '55%', bottom: '-100px', duration: '22s', delay: '2s',    opacity: 0.05 },
  { size: 35,  left: '65%', bottom: '-50px',  duration: '13s', delay: '9s',    opacity: 0.10 },
  { size: 110, left: '75%', bottom: '-120px', duration: '25s', delay: '0.5s',  opacity: 0.04 },
  { size: 45,  left: '85%', bottom: '-60px',  duration: '16s', delay: '6s',    opacity: 0.08 },
  { size: 25,  left: '92%', bottom: '-40px',  duration: '10s', delay: '3.5s',  opacity: 0.11 },
  { size: 60,  left: '48%', bottom: '-70px',  duration: '19s', delay: '11s',   opacity: 0.06 },
];

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/admin');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes riseUp {
          0%   { transform: translateY(0) translateX(0);    opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 0.8; }
          100% { transform: translateY(-110vh) translateX(25px); opacity: 0; }
        }
        .login-bubble {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.18);
          animation: riseUp linear infinite;
          pointer-events: none;
        }
      `}</style>
      <div
        style={{
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#2E294E',
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)',
            'linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
            'linear-gradient(135deg, #1a1630 0%, #2E294E 50%, #3d1f5c 100%)',
          ].join(','),
          backgroundSize: '32px 32px, 32px 32px, 100% 100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {BUBBLES.map((b, i) => (
          <div
            key={i}
            className="login-bubble"
            style={{
              width: b.size,
              height: b.size,
              left: b.left,
              bottom: b.bottom,
              opacity: b.opacity,
              animationDuration: b.duration,
              animationDelay: b.delay,
            }}
          />
        ))}

        <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

          {/* Logo + wordmark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '28px',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Faith Branch" style={{ width: '72px', height: '72px' }} />
            <div style={{ lineHeight: 1 }}>
              <div
                style={{
                  fontFamily: 'Fraunces, serif',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '34px',
                }}
              >
                Faith Branch
              </div>
              <div
                style={{
                  fontFamily: '"Send Flowers", cursive',
                  color: '#C5D86D',
                  fontSize: '22px',
                  marginTop: '5px',
                }}
              >
                the workshop
              </div>
            </div>
          </div>

          {/* Card */}
          <div
            style={{
              background: '#F4EAD4',
              border: '2px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              boxShadow: '8px 8px 0 0 rgba(0,0,0,0.3)',
              padding: '36px 32px',
              position: 'relative',
            }}
          >
            {/* Washi tape accent */}
            <div
              style={{
                position: 'absolute',
                height: '20px',
                width: '60px',
                background: 'rgba(244,96,54,0.82)',
                backgroundImage:
                  'repeating-linear-gradient(45deg,rgba(255,255,255,0.2) 0 4px,transparent 4px 9px)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                top: '-8px',
                left: '28px',
                transform: 'rotate(-3deg)',
                borderRadius: '2px',
              }}
            />

            <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Email */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: '11px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#6b6580',
                    marginBottom: '7px',
                  }}
                >
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#8a8499',
                      display: 'inline-flex',
                    }}
                  >
                    <Mail size={15} />
                  </span>
                  <input
                    {...form.register('email')}
                    type="email"
                    placeholder="you@faithbranch.com"
                    autoComplete="email"
                    style={{
                      width: '100%',
                      background: '#fff',
                      border: '1.5px solid rgba(46,41,78,0.2)',
                      borderRadius: '7px',
                      padding: '11px 12px 11px 36px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '14px',
                      color: '#2E294E',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {form.formState.errors.email && (
                  <p style={{ color: '#D7263D', fontSize: '12px', margin: '4px 0 0' }}>
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: '11px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#6b6580',
                    marginBottom: '7px',
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#8a8499',
                      display: 'inline-flex',
                    }}
                  >
                    <Lock size={15} />
                  </span>
                  <input
                    {...form.register('password')}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      background: '#fff',
                      border: '1.5px solid rgba(46,41,78,0.2)',
                      borderRadius: '7px',
                      padding: '11px 12px 11px 36px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '14px',
                      color: '#2E294E',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {form.formState.errors.password && (
                  <p style={{ color: '#D7263D', fontSize: '12px', margin: '4px 0 0' }}>
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {error && (
                <div
                  style={{
                    background: 'rgba(215,38,61,0.1)',
                    border: '1.5px solid rgba(215,38,61,0.3)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    color: '#D7263D',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: loading ? '#c4924a' : '#F46036',
                  color: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '15px',
                  padding: '13px',
                  border: '2px solid #2E294E',
                  borderRadius: '7px',
                  boxShadow: loading ? 'none' : '4px 4px 0 0 #2E294E',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                  transition: 'box-shadow 0.1s ease',
                }}
              >
                <LogIn size={17} />
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
