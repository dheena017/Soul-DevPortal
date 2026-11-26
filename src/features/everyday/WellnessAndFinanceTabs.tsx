import React, { useMemo, useState } from 'react';
import { HeroArtworkBackdrop, MiniRadialRing } from '../../components/PortalVisuals';

// ── 1. Health, BMI, Calorie BMR/TDEE & Sleep Cycle Planner Tab ──

function pad2(n: number): string {
  return String(Math.floor(n) % 60).padStart(2, '0');
}

function formatClockMinutes(totalMins: number): string {
  const m = ((totalMins % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mins = m % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad2(mins)} ${ampm}`;
}

export const HealthWellnessTab: React.FC = () => {
  const [unitMode, setUnitMode] = useState<'metric' | 'imperial'>('metric');
  const [heightCm, setHeightCm] = useState<string>('175');
  const [weightKg, setWeightKg] = useState<string>('70');
  const [heightFt, setHeightFt] = useState<string>('5');
  const [heightIn, setHeightIn] = useState<string>('9');
  const [weightLb, setWeightLb] = useState<string>('154');

  const [age, setAge] = useState<string>('26');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [activityFactor, setActivityFactor] = useState<number>(1.55);

  const [sleepMode, setSleepMode] = useState<'wakeAt' | 'sleepAt'>('wakeAt');
  const [sleepClock, setSleepClock] = useState<string>('07:00');

  const effectiveCm =
    unitMode === 'metric'
      ? Math.max(80, parseFloat(heightCm) || 170)
      : Math.max(80, ((parseFloat(heightFt) || 5) * 12 + (parseFloat(heightIn) || 8)) * 2.54);

  const effectiveKg =
    unitMode === 'metric'
      ? Math.max(25, parseFloat(weightKg) || 70)
      : Math.max(25, (parseFloat(weightLb) || 154) * 0.453592);

  const bmiStats = useMemo(() => {
    const m = effectiveCm / 100;
    const bmi = effectiveKg / (m * m);
    let label = 'Healthy';
    let tone = 'text-emerald-300 border-emerald-500/35 bg-emerald-500/15';
    if (bmi < 18.5) {
      label = 'Underweight';
      tone = 'text-sky-300 border-sky-400/35 bg-sky-500/15';
    } else if (bmi >= 25 && bmi < 30) {
      label = 'Overweight';
      tone = 'text-amber-300 border-amber-400/35 bg-amber-500/15';
    } else if (bmi >= 30) {
      label = 'Obese Range';
      tone = 'text-rose-300 border-rose-500/35 bg-rose-500/15';
    }
    const minHealthyKg = (18.5 * m * m).toFixed(1);
    const maxHealthyKg = (24.9 * m * m).toFixed(1);
    return { bmi: bmi.toFixed(1), label, tone, minHealthyKg, maxHealthyKg };
  }, [effectiveCm, effectiveKg]);

  const calorieStats = useMemo(() => {
    const yrs = Math.max(12, Math.min(99, parseFloat(age) || 26));
    const bmr =
      sex === 'male'
        ? 10 * effectiveKg + 6.25 * effectiveCm - 5 * yrs + 5
        : 10 * effectiveKg + 6.25 * effectiveCm - 5 * yrs - 161;
    const maintenance = Math.round(bmr * activityFactor);
    const cut = Math.max(1200, maintenance - 400);
    const gain = maintenance + 300;
    const proteinGrams = Math.round(effectiveKg * 1.6);
    const fatGrams = Math.round((maintenance * 0.25) / 9);
    const carbGrams = Math.max(0, Math.round((maintenance - proteinGrams * 4 - fatGrams * 9) / 4));
    return { bmr: Math.round(bmr), maintenance, cut, gain, proteinGrams, fatGrams, carbGrams };
  }, [age, sex, activityFactor, effectiveCm, effectiveKg]);

  const sleepWindows = useMemo(() => {
    const [hhRaw, mmRaw] = sleepClock.split(':').map((n) => parseInt(n, 10) || 0);
    const baseMins = hhRaw * 60 + mmRaw;
    return [6, 5, 4, 3].map((cycles) => {
      const totalDuration = cycles * 90 + 15; // 15m fall-asleep buffer
      const targetMins =
        sleepMode === 'wakeAt' ? baseMins - totalDuration : baseMins + totalDuration;
      return {
        cycles,
        hours: ((cycles * 90) / 60).toFixed(1),
        timeLabel: formatClockMinutes(targetMins),
        recommended: cycles === 5 || cycles === 6,
      };
    });
  }, [sleepClock, sleepMode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
      {/* BMI & Ideal Weight */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0c1015] shrink-0">
          <HeroArtworkBackdrop src="/visuals/pillar-computer-silicon.jpg" alt="BMI Health Reference Visual" opacityClass="opacity-72 sm:opacity-88" />
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-white">BMI &amp; Weight Range</h2>
              <p className="text-xs text-zinc-300/90">Healthy body mass &amp; weight reference.</p>
            </div>
            <div className="flex p-0.5 rounded-lg bg-[#08090c]/90 border border-white/[0.1] text-[11px] font-mono shrink-0">
              <button
                type="button"
                onClick={() => setUnitMode('metric')}
                className={`px-2 py-1 rounded cursor-pointer ${unitMode === 'metric' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'}`}
              >
                cm/kg
              </button>
              <button
                type="button"
                onClick={() => setUnitMode('imperial')}
                className={`px-2 py-1 rounded cursor-pointer ${unitMode === 'imperial' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'}`}
              >
                ft/lb
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col justify-between gap-4">
          {unitMode === 'metric' ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-zinc-400">Height (cm)</span>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white focus:outline-none focus:border-sky-400/45"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-zinc-400">Weight (kg)</span>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white focus:outline-none focus:border-emerald-400/45"
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-zinc-400">Feet</span>
                <input
                  type="number"
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                  className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-zinc-400">Inches</span>
                <input
                  type="number"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-zinc-400">Weight (lb)</span>
                <input
                  type="number"
                  value={weightLb}
                  onChange={(e) => setWeightLb(e.target.value)}
                  className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white"
                />
              </label>
            </div>
          )}

          <div className="p-4 rounded-xl bg-[#08090c] border border-white/[0.08] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-extrabold font-mono text-white tabular-nums">{bmiStats.bmi}</span>
              <span className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${bmiStats.tone}`}>
                {bmiStats.label}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
              <div className="w-[24%] h-full bg-sky-400/75" />
              <div className="w-[33%] h-full bg-emerald-400" />
              <div className="w-[23%] h-full bg-amber-400" />
              <div className="flex-1 h-full bg-rose-400" />
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              Ideal BMI 18.5–24.9 range: <span className="text-white font-semibold">{bmiStats.minHealthyKg}–{bmiStats.maxHealthyKg} kg</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>Target: 18.5 – 24.9</span>
          <span className="text-emerald-300/80">{bmiStats.label}</span>
        </div>
      </section>

      {/* Calorie BMR / TDEE & Macros */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0c1210] shrink-0">
          <HeroArtworkBackdrop src="/visuals/tab-database-wal.jpg" alt="Daily Calorie TDEE Visual" opacityClass="opacity-72 sm:opacity-88" />
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-white">Daily Calorie &amp; Macro Planner</h2>
              <p className="text-xs text-zinc-300/90">Mifflin-St Jeor TDEE &amp; macro breakdown.</p>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#080b0a]/90 border border-emerald-400/25">
              <MiniRadialRing percent={Math.min(100, Math.round((calorieStats.maintenance / 3500) * 100))} color="#34d399" size={26} />
              <span className="text-[11px] font-mono font-bold text-white tabular-nums">{calorieStats.maintenance}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-zinc-400">Age</span>
              <input
                type="number"
                min={12}
                max={99}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-emerald-400/45"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-zinc-400">Profile</span>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as 'male' | 'female')}
                className="h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-zinc-200"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-zinc-400">Activity</span>
              <select
                value={activityFactor}
                onChange={(e) => setActivityFactor(Number(e.target.value))}
                className="h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-zinc-200"
              >
                <option value={1.2}>Sedentary</option>
                <option value={1.375}>Light 1-3d</option>
                <option value={1.55}>Moderate 3-5d</option>
                <option value={1.725}>Active 6-7d</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2.5 rounded-xl bg-[#08090c] border border-white/[0.08]">
              <div className="text-[10px] text-zinc-400">Gentle Cut</div>
              <strong className="text-sm text-sky-300 tabular-nums">{calorieStats.cut}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-[10px] text-emerald-300">Maintain</div>
              <strong className="text-sm text-white tabular-nums">{calorieStats.maintenance}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[#08090c] border border-white/[0.08]">
              <div className="text-[10px] text-zinc-400">Lean Gain</div>
              <strong className="text-sm text-amber-300 tabular-nums">{calorieStats.gain}</strong>
            </div>
          </div>

          <div className="px-3 py-2.5 rounded-xl bg-[#16171e] border border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-300">
            <span>P: <strong className="text-emerald-300">{calorieStats.proteinGrams}g</strong></span>
            <span>C: <strong className="text-sky-300">{calorieStats.carbGrams}g</strong></span>
            <span>F: <strong className="text-amber-300">{calorieStats.fatGrams}g</strong></span>
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>BMR: {calorieStats.bmr} kcal</span>
          <span className="text-zinc-600">kcal / day</span>
        </div>
      </section>

      {/* Sleep Cycle Planner */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0f0d17] shrink-0">
          <HeroArtworkBackdrop src="/visuals/world-clock-globe.jpg" alt="Sleep Cycle REM Planner Visual" opacityClass="opacity-75 sm:opacity-90" />
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-white">90-Min Sleep Cycle Planner</h2>
              <p className="text-xs text-zinc-300/90">Wake between REM cycles (+15m fall-asleep buffer).</p>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-md bg-[#0a0914]/85 backdrop-blur-sm border border-indigo-400/35 text-[10px] font-mono font-bold text-indigo-300">
              REM 90m
            </span>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={sleepMode}
              onChange={(e) => setSleepMode(e.target.value as 'wakeAt' | 'sleepAt')}
              className="flex-1 h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-zinc-200"
            >
              <option value="wakeAt">I want to wake up at:</option>
              <option value="sleepAt">I plan to sleep at:</option>
            </select>
            <input
              type="time"
              value={sleepClock}
              onChange={(e) => setSleepClock(e.target.value)}
              className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {sleepWindows.map((w) => (
              <div
                key={w.cycles}
                className={`p-3 rounded-xl border flex flex-col gap-0.5 ${
                  w.recommended
                    ? 'bg-indigo-500/15 border-indigo-400/35 text-white'
                    : 'bg-[#08090c] border-white/[0.07] text-zinc-300'
                }`}
              >
                <strong className="text-sm font-mono tabular-nums">{w.timeLabel}</strong>
                <span className="text-[10px] font-mono opacity-80">
                  {w.cycles} cycles ({w.hours}h) {w.recommended ? '★ Ideal' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>{sleepMode === 'wakeAt' ? 'Recommended bedtimes' : 'Recommended wake times'}</span>
          <span className="text-indigo-300/80">+15m buffer</span>
        </div>
      </section>
    </div>
  );
};

// ── 2. EMI Loan, SIP Wealth & 50/30/20 Paycheck Money Lab Tab ──

export const MoneyFinanceLabTab: React.FC = () => {
  const [currency, setCurrency] = useState<string>('₹');

  // Loan EMI
  const [loanPrincipal, setLoanPrincipal] = useState<string>('500000');
  const [loanRate, setLoanRate] = useState<string>('8.5');
  const [loanMonths, setLoanMonths] = useState<string>('36');

  const emiStats = useMemo(() => {
    const p = Math.max(0, parseFloat(loanPrincipal) || 0);
    const annualR = Math.max(0, parseFloat(loanRate) || 0);
    const n = Math.max(1, parseInt(loanMonths, 10) || 1);
    const r = annualR / 12 / 100;
    const emi = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPay = emi * n;
    const interestPay = Math.max(0, totalPay - p);
    const principalShare = totalPay > 0 ? Math.round((p / totalPay) * 100) : 100;
    return { emi, totalPay, interestPay, principalShare };
  }, [loanPrincipal, loanRate, loanMonths]);

  // Compound SIP Calculator
  const [sipMonthly, setSipMonthly] = useState<string>('5000');
  const [sipReturnPct, setSipReturnPct] = useState<string>('12');
  const [sipYears, setSipYears] = useState<string>('10');

  const sipStats = useMemo(() => {
    const m = Math.max(0, parseFloat(sipMonthly) || 0);
    const annual = Math.max(0, parseFloat(sipReturnPct) || 0);
    const years = Math.max(1, parseInt(sipYears, 10) || 1);
    const months = years * 12;
    const r = annual / 12 / 100;
    const futureVal =
      r === 0 ? m * months : m * (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
    const invested = m * months;
    const wealthGain = Math.max(0, futureVal - invested);
    const gainShare = futureVal > 0 ? Math.round((wealthGain / futureVal) * 100) : 0;
    return { futureVal, invested, wealthGain, gainShare };
  }, [sipMonthly, sipReturnPct, sipYears]);

  // 50 / 30 / 20 Budget Allocator
  const [income, setIncome] = useState<string>('60000');
  const incNum = Math.max(0, parseFloat(income) || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
      {/* Loan EMI */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0c1210] shrink-0">
          <HeroArtworkBackdrop src="/visuals/tab-env-security.jpg" alt="Loan EMI Calculator Visual" opacityClass="opacity-72 sm:opacity-88" />
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-white">Loan &amp; EMI Calculator</h2>
              <p className="text-xs text-zinc-300/90">Monthly installment &amp; interest ratio.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#080b0a]/90 border border-emerald-400/25">
                <MiniRadialRing percent={emiStats.principalShare} color="#34d399" size={24} />
                <span className="text-[10.5px] font-mono font-bold text-white tabular-nums">{emiStats.principalShare}%</span>
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label="Currency symbol"
                className="h-8 px-2 rounded-lg bg-[#08090c]/90 border border-white/[0.12] text-xs font-mono text-white"
              >
                {['₹', '$', '€', '£', '¥'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-zinc-400">Principal</span>
              <input
                type="number"
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(e.target.value)}
                className="h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-emerald-400/45"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-zinc-400">Rate %/yr</span>
              <input
                type="number"
                step="0.1"
                value={loanRate}
                onChange={(e) => setLoanRate(e.target.value)}
                className="h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-emerald-400/45"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-zinc-400">Months</span>
              <input
                type="number"
                min={1}
                value={loanMonths}
                onChange={(e) => setLoanMonths(e.target.value)}
                className="h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-emerald-400/45"
              />
            </label>
          </div>

          <div className="p-3.5 rounded-xl bg-[#08090c] border border-white/[0.08] flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-zinc-400 font-mono">Monthly EMI</span>
              <strong className="text-xl font-extrabold font-mono text-emerald-300 tabular-nums">
                {currency}{Math.round(emiStats.emi).toLocaleString()}
              </strong>
            </div>
            <div className="w-full h-2 rounded-full bg-amber-500/35 overflow-hidden">
              <div className="h-full bg-emerald-400" style={{ width: `${emiStats.principalShare}%` }} />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-zinc-400">
              <span>Interest: <strong className="text-amber-300">{currency}{Math.round(emiStats.interestPay).toLocaleString()}</strong></span>
              <span>Total: <strong className="text-white">{currency}{Math.round(emiStats.totalPay).toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>{emiStats.principalShare}% principal</span>
          <span className="text-amber-300/80">{100 - emiStats.principalShare}% interest</span>
        </div>
      </section>

      {/* Compound SIP Savings */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0c1017] shrink-0">
          <HeroArtworkBackdrop src="/visuals/pillar-packages-core.jpg" alt="Compound SIP Growth Visual" opacityClass="opacity-72 sm:opacity-88" />
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-white">SIP &amp; Compound Savings</h2>
              <p className="text-xs text-zinc-300/90">Project compounded wealth growth over time.</p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#080b10]/90 border border-sky-400/25">
              <MiniRadialRing percent={sipStats.gainShare} color="#38bdf8" size={24} />
              <span className="text-[10.5px] font-mono font-bold text-white tabular-nums">+{sipStats.gainShare}%</span>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-zinc-400">Monthly</span>
              <input
                type="number"
                value={sipMonthly}
                onChange={(e) => setSipMonthly(e.target.value)}
                className="h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-sky-400/45"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-zinc-400">Return %</span>
              <input
                type="number"
                step="0.5"
                value={sipReturnPct}
                onChange={(e) => setSipReturnPct(e.target.value)}
                className="h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-sky-400/45"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-zinc-400">Years</span>
              <input
                type="number"
                min={1}
                value={sipYears}
                onChange={(e) => setSipYears(e.target.value)}
                className="h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-sky-400/45"
              />
            </label>
          </div>

          <div className="p-3.5 rounded-xl bg-[#08090c] border border-sky-400/25 flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-zinc-400 font-mono">Projected Corpus</span>
              <strong className="text-xl font-extrabold font-mono text-sky-300 tabular-nums">
                {currency}{Math.round(sipStats.futureVal).toLocaleString()}
              </strong>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden flex">
              <div className="h-full bg-sky-400" style={{ width: `${Math.max(0, 100 - sipStats.gainShare)}%` }} />
              <div className="h-full bg-emerald-400" style={{ width: `${sipStats.gainShare}%` }} />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-zinc-400">
              <span>Invested: <strong className="text-zinc-200">{currency}{Math.round(sipStats.invested).toLocaleString()}</strong></span>
              <span>Gains: <strong className="text-emerald-300">+{currency}{Math.round(sipStats.wealthGain).toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>Horizon: {sipYears} yrs</span>
          <span className="text-emerald-300/80">{sipStats.gainShare}% return gain</span>
        </div>
      </section>

      {/* 50 / 30 / 20 Paycheck Rule */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0e1017] shrink-0">
          <HeroArtworkBackdrop src="/visuals/tab-api-rest.jpg" alt="Income Split Visual" opacityClass="opacity-72 sm:opacity-88" />
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-white">50 / 30 / 20 Income Allocator</h2>
              <p className="text-xs text-zinc-300/90">Balance needs, wants &amp; savings targets.</p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#080a0e]/90 border border-sky-400/25">
              <MiniRadialRing percent={20} color="#34d399" size={24} />
              <span className="text-[10.5px] font-mono font-bold text-emerald-300">20% save</span>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-zinc-400">Monthly Take-Home Income ({currency})</span>
              <input
                type="number"
                min={0}
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="h-10 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono font-bold text-white focus:outline-none focus:border-sky-400/45"
              />
            </label>

            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden flex">
              <div className="w-[50%] h-full bg-sky-400" />
              <div className="w-[30%] h-full bg-amber-400" />
              <div className="w-[20%] h-full bg-emerald-400" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-3 rounded-xl bg-sky-500/12 border border-sky-400/30">
              <div className="text-[10px] text-sky-300">50% Needs</div>
              <strong className="text-sm text-white tabular-nums">{currency}{Math.round(incNum * 0.5).toLocaleString()}</strong>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/12 border border-amber-400/30">
              <div className="text-[10px] text-amber-300">30% Wants</div>
              <strong className="text-sm text-white tabular-nums">{currency}{Math.round(incNum * 0.3).toLocaleString()}</strong>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/12 border border-emerald-400/30">
              <div className="text-[10px] text-emerald-300">20% Save</div>
              <strong className="text-sm text-emerald-300 tabular-nums">{currency}{Math.round(incNum * 0.2).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>Annual savings</span>
          <span className="text-emerald-300/80 tabular-nums">{currency}{Math.round(incNum * 0.2 * 12).toLocaleString()} / yr</span>
        </div>
      </section>
    </div>
  );
};
