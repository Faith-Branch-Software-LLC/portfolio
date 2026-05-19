"use client"

import Header from "@/components/app/header"
import Footer from "@/components/app/footer"
import Section from "@/components/ui/section"
import { Hand, Highlight, Paper, Tape } from "@/components/app/scrapbookElements"
import { ScrapNavLink } from "@/components/app/ScrapNavLink"
import { useLayout } from "@/lib/context/layoutContext"
import { Link } from "next-transition-router"
import { CSSProperties } from "react"

function TornScrap() {
  const path =
    "M 8 12 L 132 4 L 144 18 L 138 34 L 148 48 L 140 64 L 152 82 " +
    "L 132 96 L 142 116 L 124 122 L 96 110 L 78 124 L 56 116 " +
    "L 40 130 L 22 118 L 12 96 L 24 76 L 6 60 L 18 38 L 4 22 Z"
  return (
    <svg
      viewBox="0 0 156 134"
      width={150}
      height={129}
      style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,0.25))", transform: "rotate(16deg)" }}
    >
      <path d={path} fill="#f3ead4" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      <line x1="18" y1="38" x2="140" y2="32" stroke="rgba(46,41,78,0.18)" strokeWidth="1" />
      <line x1="14" y1="58" x2="144" y2="54" stroke="rgba(46,41,78,0.18)" strokeWidth="1" />
      <line x1="16" y1="78" x2="138" y2="76" stroke="rgba(46,41,78,0.18)" strokeWidth="1" />
      <line x1="22" y1="98" x2="130" y2="96" stroke="rgba(46,41,78,0.18)" strokeWidth="1" />
    </svg>
  )
}

function Scribble() {
  return (
    <svg
      viewBox="0 0 360 30"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "min(380px, 100%)",
        height: 28,
        transform: "translate(-50%, -50%) rotate(-2deg)",
        pointerEvents: "none",
      }}
    >
      <path
        d="M 6 18 Q 40 4 80 16 T 160 14 Q 200 22 240 12 T 320 18 L 354 12"
        fill="none"
        stroke="#D7263D"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.88"
      />
      <path
        d="M 14 22 Q 60 14 110 20 T 210 18 Q 260 26 310 16"
        fill="none"
        stroke="#D7263D"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  )
}

const chipBase: CSSProperties = {
  position: "relative",
  display: "inline-block",
  background: "#f3ead4",
  color: "#1a1410",
  fontFamily: "'Gelasio', serif",
  fontSize: 16,
  lineHeight: 1.3,
  cursor: "pointer",
  userSelect: "none",
  textDecoration: "none",
}

export default function NotFound() {
  const { totalTranslation } = useLayout()

  return (
    <div
      className="h-fit"
      style={{
        height: `calc(100vh - ${totalTranslation}px)`,
        marginBottom: `-${totalTranslation}px`,
      }}
    >
      <Header />
      <Section className="bg-backgroundRed" layer={1}>
        <div
          className="px-4 sm:px-10 md:px-[60px]"
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            paddingTop: 80,
            paddingBottom: 20,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 36,
            width: "100%",
          }}
        >
          <Hand
            color="#C5D86D"
            size={36}
            rot={-8}
            className="hidden md:block"
            style={{ position: "absolute", top: 25, left: 30 }}
          >
            uh oh —
          </Hand>

          {/* Paper card + floating torn scrap */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 780,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Paper rot={-1.8} style={{ width: "100%", maxWidth: 760, padding: "44px 52px 48px" }}>
              {/* Left tape */}
              <Tape rot={-12} color="rgba(46,41,78,0.82)" width={96} top={-14} left="50%" />
              {/* Right tape (teal) */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: -12,
                  right: 28,
                  width: 84,
                  height: 22,
                  background: "rgba(27,153,139,0.82)",
                  transform: "rotate(8deg)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.22) 0 4px, transparent 4px 9px)",
                  pointerEvents: "none",
                }}
              />

              {/* Crossed-out original title */}
              <div style={{ position: "relative", textAlign: "center", marginBottom: 4 }}>
                <span
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontStyle: "italic",
                    fontSize: "clamp(18px, 4vw, 30px)",
                    color: "rgba(26,20,16,0.55)",
                    fontWeight: 500,
                  }}
                >
                  Our Approach to Software
                </span>
                <Scribble />
              </div>

              {/* Handwritten page not found */}
              <div style={{ textAlign: "center", marginTop: 6 }}>
                <Hand color="#D7263D" size={32} rot={-3}>
                  page not found
                </Hand>
              </div>

              {/* Big 404 */}
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 900,
                  fontSize: "clamp(80px, 20vw, 200px)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                  margin: "6px 0 0",
                  textAlign: "center",
                  fontStyle: "italic",
                  color: "#1a1410",
                }}
              >
                404
              </div>

              <p
                style={{
                  fontFamily: "'Gelasio', serif",
                  fontSize: 18,
                  lineHeight: 1.6,
                  textAlign: "center",
                  maxWidth: 520,
                  margin: "22px auto 0",
                  color: "#1a1410",
                }}
              >
                The link you followed may be broken, or the page may have been{" "}
                <Highlight>moved or renamed</Highlight>. Sorry about that — let&rsquo;s get
                you back on track.
              </p>
            </Paper>

            {/* Torn scrap + label — desktop only, they overflow on mobile */}
            <div
              className="hidden lg:block"
              style={{ position: "absolute", right: -110, top: -60, pointerEvents: "none" }}
            >
              <TornScrap />
            </div>
            <Hand
              color="white"
              size={24}
              rot={10}
              className="hidden lg:block"
              style={{
                position: "absolute",
                right: -260,
                top: -10,
                maxWidth: 150,
                textAlign: "left",
              }}
            >
              ← the missing piece
            </Hand>
          </div>

          {/* Action chips */}
          <div
            style={{
              display: "flex",
              gap: 28,
              alignItems: "center",
              marginTop: 6,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => window.history.back()}
              style={{
                ...chipBase,
                padding: "7px 18px",
                transform: "rotate(-2deg)",
                boxShadow: "2px 2px 0 0 rgba(0,0,0,0.18)",
                fontWeight: 500,
                border: "none",
              }}
            >
              ← Go back
            </button>
            <Link
              href="/"
              style={{
                ...chipBase,
                padding: "8px 22px",
                transform: "rotate(1deg)",
                boxShadow: "5px 5px 0 0 rgba(0,0,0,0.32)",
                fontWeight: 700,
              }}
            >
              ↩ Home
            </Link>
          </div>

          {/* Or try one of these */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginTop: 0,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Hand color="#C5D86D" size={22} rot={-3}>
              or try one of these →
            </Hand>
            <ScrapNavLink href="/portfolio">Portfolio</ScrapNavLink>
            <ScrapNavLink href="/blog">Blog</ScrapNavLink>
            <ScrapNavLink href="/#contact">Contact</ScrapNavLink>
          </div>
        </div>
      </Section>
      <Footer layer={2} />
    </div>
  )
}
