"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ShieldCheck, WifiOff, Banknote, Users, ArrowRight, Sparkles, Clock, AlertTriangle } from "lucide-react";

type Language = "en" | "ml" | "hi";

interface CopyDict {
  tagline: string;
  heroTitle: string;
  heroSub: string;
  ctaPrimary: string;
  ctaSecondary: string;
  beforeAfterTitle: string;
  withoutTitle: string;
  withoutDesc: string;
  withTitle: string;
  withDesc: string;
  stepsTitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  card1Title: string;
  card1Desc: string;
  card2Title: string;
  card2Desc: string;
  card3Title: string;
  card3Desc: string;
  finalCtaTitle: string;
  finalCtaSub: string;
}

const translations: Record<Language, CopyDict> = {
  en: {
    tagline: "FMCG Distribution Route Reminder",
    heroTitle: "Never miss a restock round.",
    heroSub: "Simple, offline-first delivery rounds for Indian FMCG distributors. Stops due today, dues tracking, and zero lost retailer sales.",
    ctaPrimary: "Start Free Onboarding",
    ctaSecondary: "View Live Demo Route",
    beforeAfterTitle: "Why Indian distributors lose 15% revenue to stockouts",
    withoutTitle: "Without Waymark (Mental memory & notebook)",
    withoutDesc: "Shop runs out of biscuits on Day 7. Distributor visits on Day 9. That is 2 days of empty racks where a competitor product took your shelf space.",
    withTitle: "With Waymark (Self-correcting round intervals)",
    withDesc: "Waymark calculates stock burn rate. You get reminded on Day 6 with 1 day safety buffer. You arrive before the rack empties.",
    stepsTitle: "Three steps to run your route in autopilot",
    step1Title: "1. Add your shops",
    step1Desc: "Upload your existing shop register or type in rapid 10-second entries. Region, interval, and contact.",
    step2Title: "2. Open today's list",
    step2Desc: "Every morning, your vertical route line shows exactly which shops are due, who is urgent, and pending dues.",
    step3Title: "3. Tap delivered",
    step3Desc: "A quick tally tick updates stock intervals automatically. Collect cash/UPI in one tap. Works offline.",
    card1Title: "100% Offline in basements",
    card1Desc: "No signal in wholesale market godowns or rural highways? Full app works seamlessly. Syncs silently when back online.",
    card2Title: "Pending dues & ledger",
    card2Desc: "In FMCG, collecting money is half the battle. View pending balances per shop and log payments in seconds.",
    card3Title: "Multi-driver team view",
    card3Desc: "Manage staff, assign routes, and track vehicle mileage and petrol costs per round without endless phone calls.",
    finalCtaTitle: "Ready to protect your distributor racks?",
    finalCtaSub: "No credit card required. Works directly in your mobile browser and installs as a lightweight PWA.",
  },
  ml: {
    tagline: "FMCG വിതരണ റൂട്ട് ഓർമ്മപ്പെടുത്തൽ",
    heroTitle: "ഒരു റീസ്റ്റോക്ക് റൗണ്ടും ഇനി നഷ്ടപ്പെടില്ല.",
    heroSub: "FMCG വിതരണക്കാർക്കുള്ള ഓഫ്‌ലൈൻ ഡെലിവറി ആപ്പ്. ഇന്നത്തെ കടകളുടെ ലിസ്റ്റ്, കുടിശ്ശിക കളക്ഷൻ, പെട്രോൾ കണക്ക്.",
    ctaPrimary: "ഉടൻ ആരംഭിക്കുക",
    ctaSecondary: "റൂട്ട് ഡെമോ കാണുക",
    beforeAfterTitle: "സ്റ്റോക്ക് തീരുന്നതിലൂടെ ലാഭം നഷ്ടപ്പെടുന്നത് എങ്ങനെ?",
    withoutTitle: "വേമാർക്ക് ഇല്ലാതെ (ഡയറിയും ഓർമ്മയും)",
    withoutDesc: "7-ാം ദിവസം കടയിൽ ബിസ്ക്കറ്റ് തീരുന്നു. നിങ്ങൾ എത്തുന്നത് 9-ാം ദിവസം. 2 ദിവസം കടക്കാരൻ മറ്റൊരാളുടെ ബ്രാൻഡ് വിൽക്കുന്നു.",
    withTitle: "വേമാർക്കിലൂടെ (കൃത്യമായ റൗണ്ട് ഓർമ്മപ്പെടുത്തൽ)",
    withDesc: "6-ാം ദിവസം വേമാർക്ക് നിങ്ങൾക്ക് ഓർമ്മപ്പെടുത്തൽ നൽകുന്നു. കടയിലെ സാധനം തീരുന്നതിന് മുൻപ് പുതിയ സ്റ്റോക്ക് എത്തുന്നു.",
    stepsTitle: "ലളിതമായ 3 ഘട്ടങ്ങൾ",
    step1Title: "1. കടകൾ ചേർക്കുക",
    step1Desc: "നിങ്ങളുടെ കടകളുടെ ലിസ്റ്റ് എളുപ്പത്തിൽ ആപ്പിലേക്ക് നൽകുക. പേര്, റൂട്ട്, ഡെലിവറി ഇടവേള.",
    step2Title: "2. ഇന്നത്തെ റൂട്ട് നോക്കുക",
    step2Desc: "രാവിലെ ആപ്പ് തുറക്കുമ്പോൾ ഇന്ന് പോകേണ്ട കടകളുടെ ലിസ്റ്റും കുടിശ്ശികയും കൃത്യമായി മുന്നിൽ വരുന്നു.",
    step3Title: "3. ഡെലിവറി രേഖപ്പെടുത്തുക",
    step3Desc: "ഒറ്റ ടാപ്പിൽ ഡെലിവറി ടിക്ക് ചെയ്യുക, കാശ് വാങ്ങിയ തുക രേഖപ്പെടുത്തുക. ഓഫ്‌ലൈനിലും പ്രവർത്തിക്കും.",
    card1Title: "ബേസ്മെന്റിലും ഓഫ്‌ലൈൻ പ്രവർത്തനം",
    card1Desc: "റേഞ്ചില്ലാത്ത ഗോഡൗണുകളിലും ഗ്രാമങ്ങളിലും തടസ്സമില്ലാതെ പ്രവർത്തിക്കുന്നു. റേഞ്ച് കിട്ടുമ്പോൾ ഓട്ടോമാറ്റിക് സിങ്ക്.",
    card2Title: "കുടിശ്ശിക പണം കണക്ക്",
    card2Desc: "ഓരോ കടക്കാരനും നൽകാനുള്ള കുടിശ്ശിക തുക കൃത്യമായി കാണാം. പണം വാങ്ങിയാൽ ഉടൻ രേഖപ്പെടുത്താം.",
    card3Title: "ഡ്രൈവർമാരും ടീമും",
    card3Desc: "ജീവനക്കാരെ ഉൾപ്പെടുത്തുക, റൂട്ടുകൾ വിഭജിക്കുക, പെട്രോൾ മൈലേജ് ചെലവ് പരിശോധിക്കുക.",
    finalCtaTitle: "ഇന്ന് തന്നെ നിങ്ങളുടെ വിതരണം കാര്യക്ഷമമാക്കൂ",
    finalCtaSub: "ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാം, ഫോണിൽ വളരെ വേഗതയുള്ള അനുഭവം.",
  },
  hi: {
    tagline: "FMCG डिस्ट्रीब्यूशन रूट रिमाइंडर",
    heroTitle: "एक भी रीस्टॉक राउंड कभी न छूटे।",
    heroSub: "भारतीय FMCG डिस्ट्रीब्यूटर्स के लिए खास ऑफलाइन डिलीवरी ऐप। आज की दुकानें, बकाया उगाही और शून्य स्टॉकआउट।",
    ctaPrimary: "फ्री शुरू करें",
    ctaSecondary: "लाइव डेमो देखें",
    beforeAfterTitle: "डिस्ट्रीब्यूटर हर महीने 15% बिक्री कैसे खो देते हैं?",
    withoutTitle: "वेमार्क के बिना (डायरी और याददाश्त)",
    withoutDesc: "दुकान में दिन 7 पर माल खत्म हुआ। आप दिन 9 पर पहुंचे। 2 दिन खाली रैक रहने से दूसरे ब्रांड ने आपकी जगह ले ली।",
    withTitle: "वेमार्क के साथ (स्मार्ट रूट रिमाइंडर)",
    withDesc: "वेमार्क दिन 6 पर ही अलर्ट देता है। रैक खाली होने से पहले आपका माल दुकान में सज जाता है।",
    stepsTitle: "सिर्फ 3 आसान स्टेप्स",
    step1Title: "1. दुकानें जोड़ें",
    step1Desc: "अपनी दुकानों की लिस्ट तेजी से दर्ज करें। नाम, इलाका, डिलीवरी का अंतराल और फोन नंबर।",
    step2Title: "2. आज का रूट देखें",
    step2Desc: "रोज सुबह देखें किन दुकानों पर माल देना है, कौन सी दुकान अर्जेंट है और किसका कितना बकाया है।",
    step3Title: "3. डिलीवर टैप करें",
    step3Desc: "एक टैप में डिलीवरी दर्ज, कैश या UPI पेमेंट कलेक्ट। बिना इंटरनेट भी तुरंत चलेगा।",
    card1Title: "बेसमेंट में भी 100% ऑफलाइन",
    card1Desc: "मंडी या बेसमेंट में इंटरनेट नहीं है? कोई बात नहीं। इंटरनेट आते ही डेटा अपने आप सिंक हो जाएगा।",
    card2Title: "बकाया पेमेंट का हिसाब",
    card2Desc: "FMCG में उधारी वसूलना सबसे जरूरी है। हर दुकान का बकाया तुरंत देखें और दर्ज करें।",
    card3Title: "स्टाफ और गाड़ी का हिसाब",
    card3Desc: "कर्मचारियों को जोड़ें, रूट बांटें और गाड़ी का माइलेज व पेट्रोल का खर्चा ट्रैक करें।",
    finalCtaTitle: "आज ही अपनी डिस्ट्रीब्यूशन को स्मार्ट बनाएं",
    finalCtaSub: "कोई क्रेडिट कार्ड नहीं चाहिए। सीधे मोबाइल ब्राउज़र में चलाएं या PWA ऐप इंस्टॉल करें।",
  },
};

export default function WelcomePage() {
  const [lang, setLang] = useState<Language>("en");
  const t = translations[lang];

  // Animated Mini Today List state simulation
  const [tickedIndices, setTickedIndices] = useState<number[]>([0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickedIndices((prev) => {
        if (prev.length >= 3) {
          return [];
        }
        return [...prev, prev.length];
      });
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const sampleStops = [
    { name: "Gupta Kirana Store", items: "Parle-G (3 cases) · Frooti (2 crates)", due: "Due today", urgent: true, dues: "₹1,450" },
    { name: "Laxmi Supermarket", items: "Maggi Noodles (4 boxes)", due: "3 days overdue", urgent: false, dues: "₹3,200" },
    { name: "Anand Tea Depot", items: "Tata Tea Gold (5 packs)", due: "Due today", urgent: false, dues: "₹0" },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#14213D] selection:bg-[#F2A900]/30">
      {/* Top Header / Language Switcher */}
      <header className="sticky top-0 z-30 bg-[#FBFBF9]/90 backdrop-blur-md border-b border-[#E6E9EF]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-lg bg-[#F2A900] flex items-center justify-center font-bold text-ink text-sm shadow-sm">
              W
            </div>
            <span className="font-heading font-bold text-lg tracking-tight text-ink">
              Waymark
            </span>
          </Link>

          {/* Right Header: Language Toggle & Login */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="flex items-center gap-1 bg-[#E6E9EF]/60 p-1 rounded-lg text-xs font-medium">
              <button
                type="button"
                data-testid="lang-en"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  lang === "en" ? "bg-white text-ink shadow-xs font-semibold" : "text-[#5C6B73] hover:text-ink"
                }`}
              >
                English
              </button>
              <button
                type="button"
                data-testid="lang-ml"
                onClick={() => setLang("ml")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  lang === "ml" ? "bg-white text-ink shadow-xs font-semibold" : "text-[#5C6B73] hover:text-ink"
                }`}
              >
                മലയാളം
              </button>
              <button
                type="button"
                data-testid="lang-hi"
                onClick={() => setLang("hi")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  lang === "hi" ? "bg-white text-ink shadow-xs font-semibold" : "text-[#5C6B73] hover:text-ink"
                }`}
              >
                हिंदी
              </button>
            </div>

            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg border border-[#E6E9EF] bg-white text-ink text-xs font-semibold hover:bg-[#E6E9EF]/40 transition-colors shadow-2xs"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F2A900]/15 text-ink border border-[#F2A900]/30 mb-4">
            <Sparkles size={13} className="text-[#F2A900]" />
            {t.tagline}
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-heading text-ink leading-[1.15] mb-4">
            {t.heroTitle}
          </h1>

          <p className="text-base sm:text-lg text-[#5C6B73] leading-relaxed mb-8">
            {t.heroSub}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#F2A900] text-ink font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
            >
              {t.ctaPrimary}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#E6E9EF] bg-white text-ink font-medium text-sm hover:bg-[#E6E9EF]/30 transition-colors flex items-center justify-center gap-2"
            >
              {t.ctaSecondary}
            </Link>
          </div>
        </div>

        {/* Live Animated Mini Today List */}
        <div className="max-w-md mx-auto bg-white border border-[#E6E9EF] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E6E9EF]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F2A900] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-ink font-heading">
                Today's Live Route Line
              </span>
            </div>
            <span className="text-xs text-[#5C6B73] tabular-nums">
              {tickedIndices.length} / 3 Completed
            </span>
          </div>

          <div className="space-y-4 relative">
            {sampleStops.map((stop, i) => {
              const isTicked = tickedIndices.includes(i);
              const isNext = !isTicked && (i === 0 || tickedIndices.includes(i - 1));

              return (
                <div key={stop.name} className="relative flex items-start gap-3 pl-1">
                  {/* Vertical connector line */}
                  {i < sampleStops.length - 1 && (
                    <div
                      className={`absolute left-[13px] top-6 w-[2px] h-[calc(100%+8px)] transition-colors duration-300 ${
                        isTicked ? "bg-[#1F9D6B]" : "bg-[#E6E9EF]"
                      }`}
                    />
                  )}

                  {/* Stop dot / tick */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 z-10 transition-all duration-200 ${
                      isTicked
                        ? "bg-[#1F9D6B] text-white scale-105"
                        : stop.urgent
                        ? "border-2 border-[#D64545] bg-[#D64545]/10 text-[#D64545]"
                        : isNext
                        ? "border-2 border-[#F2A900] bg-[#F2A900]/20 text-ink ring-2 ring-[#F2A900]/30"
                        : "border-2 border-[#E6E9EF] bg-white text-[#5C6B73]"
                    }`}
                  >
                    {isTicked ? (
                      <Check size={13} strokeWidth={3} className="animate-in fade-in" />
                    ) : stop.urgent ? (
                      "🌶️"
                    ) : (
                      i + 1
                    )}
                  </div>

                  {/* Stop details */}
                  <div
                    className={`flex-1 p-2.5 rounded-xl border transition-all duration-200 ${
                      isTicked
                        ? "bg-[#1F9D6B]/5 border-[#1F9D6B]/30 opacity-75"
                        : isNext
                        ? "bg-[#F2A900]/10 border-[#F2A900]/40 shadow-xs"
                        : "bg-[#FBFBF9] border-[#E6E9EF]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isTicked ? "line-through text-[#5C6B73]" : "text-ink"}`}>
                        {stop.name}
                      </span>
                      <span className="text-[11px] font-medium text-[#1F9D6B] tabular-nums">
                        {stop.dues}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5C6B73] mt-0.5 truncate">
                      {stop.items}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                      {stop.urgent && (
                        <span className="text-[#D64545] font-bold">Urgent</span>
                      )}
                      <span className="text-[#5C6B73]">· {stop.due}</span>
                      {isTicked && (
                        <span className="text-[#1F9D6B] font-medium ml-auto">Delivered ✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Before / After Strip */}
      <section className="bg-white border-y border-[#E6E9EF] py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-center text-ink mb-10">
            {t.beforeAfterTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without Waymark */}
            <div className="p-6 rounded-2xl border border-[#D64545]/30 bg-[#D64545]/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#D64545] font-semibold text-sm mb-2">
                  <AlertTriangle size={18} />
                  {t.withoutTitle}
                </div>
                <p className="text-xs sm:text-sm text-[#5C6B73] leading-relaxed">
                  {t.withoutDesc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D64545]/20 flex items-center justify-between text-xs font-medium text-[#D64545]">
                <span>Day 7: Out of stock</span>
                <span>Day 9: Visit (Too late)</span>
              </div>
            </div>

            {/* With Waymark */}
            <div className="p-6 rounded-2xl border border-[#1F9D6B]/30 bg-[#1F9D6B]/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#1F9D6B] font-semibold text-sm mb-2">
                  <ShieldCheck size={18} />
                  {t.withTitle}
                </div>
                <p className="text-xs sm:text-sm text-[#5C6B73] leading-relaxed">
                  {t.withDesc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#1F9D6B]/20 flex items-center justify-between text-xs font-medium text-[#1F9D6B]">
                <span>Day 6: Reminded</span>
                <span>Day 6: Fresh stock delivered ✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Real Steps */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-xl sm:text-2xl font-bold font-heading text-center text-ink mb-10">
          {t.stepsTitle}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-[#E6E9EF] bg-white">
            <div className="w-8 h-8 rounded-lg bg-[#F2A900]/20 text-ink font-bold text-sm flex items-center justify-center mb-3">
              1
            </div>
            <h3 className="text-base font-bold text-ink mb-1 font-heading">{t.step1Title}</h3>
            <p className="text-xs text-[#5C6B73] leading-relaxed">{t.step1Desc}</p>
          </div>

          <div className="p-5 rounded-2xl border border-[#E6E9EF] bg-white">
            <div className="w-8 h-8 rounded-lg bg-[#F2A900]/20 text-ink font-bold text-sm flex items-center justify-center mb-3">
              2
            </div>
            <h3 className="text-base font-bold text-ink mb-1 font-heading">{t.step2Title}</h3>
            <p className="text-xs text-[#5C6B73] leading-relaxed">{t.step2Desc}</p>
          </div>

          <div className="p-5 rounded-2xl border border-[#E6E9EF] bg-white">
            <div className="w-8 h-8 rounded-lg bg-[#F2A900]/20 text-ink font-bold text-sm flex items-center justify-center mb-3">
              3
            </div>
            <h3 className="text-base font-bold text-ink mb-1 font-heading">{t.step3Title}</h3>
            <p className="text-xs text-[#5C6B73] leading-relaxed">{t.step3Desc}</p>
          </div>
        </div>
      </section>

      {/* Feature Cards (Offline, Payments, Team) */}
      <section className="bg-white border-t border-[#E6E9EF] py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FBFBF9] border border-[#E6E9EF]">
              <div className="w-10 h-10 rounded-xl bg-[#F2A900]/15 text-ink flex items-center justify-center mb-4">
                <WifiOff size={20} className="text-[#F2A900]" />
              </div>
              <h3 className="text-sm font-bold text-ink mb-2 font-heading">{t.card1Title}</h3>
              <p className="text-xs text-[#5C6B73] leading-relaxed">{t.card1Desc}</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FBFBF9] border border-[#E6E9EF]">
              <div className="w-10 h-10 rounded-xl bg-[#1F9D6B]/15 text-[#1F9D6B] flex items-center justify-center mb-4">
                <Banknote size={20} />
              </div>
              <h3 className="text-sm font-bold text-ink mb-2 font-heading">{t.card2Title}</h3>
              <p className="text-xs text-[#5C6B73] leading-relaxed">{t.card2Desc}</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FBFBF9] border border-[#E6E9EF]">
              <div className="w-10 h-10 rounded-xl bg-[#14213D]/10 text-ink flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <h3 className="text-sm font-bold text-ink mb-2 font-heading">{t.card3Title}</h3>
              <p className="text-xs text-[#5C6B73] leading-relaxed">{t.card3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#14213D] text-white">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading mb-3">
            {t.finalCtaTitle}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto mb-8">
            {t.finalCtaSub}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#F2A900] text-ink font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {t.ctaPrimary}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-gray-700 bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-colors"
            >
              {t.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}