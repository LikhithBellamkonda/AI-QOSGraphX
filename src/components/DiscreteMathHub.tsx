import React, { useState, useMemo } from 'react';
import { 
  Binary, Compass, Hash, Info, ChevronRight, HelpCircle, ArrowRight, Code, Table2, Play
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Factorial helper
const factorial = (num: number): number => {
  if (num <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= num; i++) {
    res *= i;
  }
  return res;
};

// Generates permutations
const getPermutationsSample = (items: string[], r: number): string[][] => {
  const result: string[][] = [];
  const permute = (arr: string[], m: string[] = []) => {
    if (m.length === r) {
      result.push(m);
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      const curr = arr.slice();
      const next = curr.splice(i, 1);
      permute(curr, m.concat(next));
      if (result.length >= 60) return; // Cap for rendering performance
    }
  };
  permute(items);
  return result;
};

// Generates combinations
const getCombinationsSample = (items: string[], r: number): string[][] => {
  const result: string[][] = [];
  const combine = (start: number, combo: string[]) => {
    if (combo.length === r) {
      result.push(combo);
      return;
    }
    for (let i = start; i < items.length; i++) {
      combine(i + 1, combo.concat(items[i]));
      if (result.length >= 60) return; // Cap
    }
  };
  combine(0, []);
  return result;
};

export default function DiscreteMathHub() {
  const [panelTab, setPanelTab] = useState<'combinatorics' | 'logic' | 'recurrence'>('combinatorics');

  // Combinatorics state
  const [nVal, setNVal] = useState<number>(6);
  const [rVal, setRVal] = useState<number>(3);
  const items = useMemo(() => Array.from({ length: nVal }, (_, i) => String.fromCharCode(65 + i)), [nVal]);

  const combinatoricsData = useMemo(() => {
    const validR = Math.min(rVal, nVal);
    const nFact = factorial(nVal);
    const rFact = factorial(validR);
    const nrFact = factorial(nVal - validR);

    // Permutations
    const pCount = nFact / nrFact;
    // Combinations
    const cCount = nFact / (rFact * nrFact);

    const pSamples = getPermutationsSample(items, validR);
    const cSamples = getCombinationsSample(items, validR);

    return {
      pCount,
      cCount,
      pSamples,
      cSamples,
      validR,
    };
  }, [nVal, rVal, items]);

  // Logic Truth Table Generator state
  const [propositionFormula, setPropositionFormula] = useState<string>('(p AND q) OR (NOT r)');
  const [evalError, setEvalError] = useState<string | null>(null);

  // Parse and evaluate logic statement
  const truthTable = useMemo(() => {
    setEvalError(null);
    const variables = ['p', 'q', 'r'];
    const rows: { p: boolean; q: boolean; r: boolean; expr1?: boolean; result: boolean }[] = [];

    // Simple expression tokenizer & evaluator for educational safety
    const evaluate = (p: boolean, q: boolean, r: boolean, formula: string): boolean => {
      // Normalize values
      let expression = formula
        .toLowerCase()
        .replace(/p/g, String(p))
        .replace(/q/g, String(q))
        .replace(/r/g, String(r))
        .replace(/not\s+true/g, 'false')
        .replace(/not\s+false/g, 'true')
        .replace(/not/g, '!')
        .replace(/and/g, '&&')
        .replace(/or/g, '||');

      // Expand custom Logical operations like implication (a -> b is !a || b)
      while (expression.includes('->')) {
        expression = expression.replace(/(\w+)\s*->\s*(\w+)/, '!$1 || $2');
      }

      try {
        // Safe context-based execution of token list using standard binary evaluators
        const sFn = new Function(`return !!(${expression})`);
        return sFn();
      } catch (err) {
        throw new Error('Synth Error: Ensure expression matches operators (p, q, r, AND, OR, NOT, ->).');
      }
    };

    try {
      // Loop across 2^3 space
      for (const p of [true, false]) {
        for (const q of [true, false]) {
          for (const r of [true, false]) {
            const res = evaluate(p, q, r, propositionFormula);
            rows.push({ p, q, r, result: res });
          }
        }
      }
    } catch (err: any) {
      setEvalError(err.message || 'Logical parsing syntax error.');
    }

    return rows;
  }, [propositionFormula]);

  // Recurrence Relation state
  const [c1, setC1] = useState<number>(1);
  const [c2, setC2] = useState<number>(1);
  const [a0, setA0] = useState<number>(0);
  const [a1, setA1] = useState<number>(1);
  const [presetName, setPresetName] = useState<string>('fibonacci');

  const recurrenceSeries = useMemo(() => {
    const terms: { n: number; val: number }[] = [];
    terms.push({ n: 0, val: a0 });
    terms.push({ n: 1, val: a1 });

    let prev2 = a0;
    let prev1 = a1;

    for (let i = 2; i <= 12; i++) {
      const next = c1 * prev1 + c2 * prev2;
      terms.push({ n: i, val: next });
      prev2 = prev1;
      prev1 = next;
    }
    return terms;
  }, [c1, c2, a0, a1]);

  const selectRecurrencePreset = (preset: string) => {
    setPresetName(preset);
    if (preset === 'fibonacci') {
      setC1(1); setC2(1); setA0(0); setA1(1);
    } else if (preset === 'hanoi') {
      // Hanoi behaves like a_n = 2a_{n-1} + 1, we can write a_n = 3a_{n-1} - 2a_{n-2}
      setC1(3); setC2(-2); setA0(0); setA1(1);
    } else if (preset === 'pell') {
      setC1(2); setC2(1); setA0(0); setA1(1);
    } else if (preset === 'custom') {
      // Custom presets keep values
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-slate-200">
      {/* Tab Header */}
      <div className="bg-slate-950 border-b border-slate-850 px-6 py-3.5 flex space-x-1.5 overflow-x-auto">
        <button
          id="btn-discrete-combinatorics-tab"
          onClick={() => setPanelTab('combinatorics')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center space-x-2 ${
            panelTab === 'combinatorics'
              ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Hash className="h-4 w-4" />
          <span>Combinatorics P(N,R) & C(N,R)</span>
        </button>

        <button
          id="btn-discrete-logic-tab"
          onClick={() => setPanelTab('logic')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center space-x-2 ${
            panelTab === 'logic'
              ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Binary className="h-4 w-4" />
          <span>Logic Truth Table Builder</span>
        </button>

        <button
          id="btn-discrete-recurrence-tab"
          onClick={() => setPanelTab('recurrence')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center space-x-2 ${
            panelTab === 'recurrence'
              ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Recurrence growth plotting</span>
        </button>
      </div>

      <div className="p-6">
        {/* PANEL: COMBINATORICS */}
        {panelTab === 'combinatorics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-5 lg:col-span-1">
              <div className="bg-slate-950 border border-slate-850 p-4.5 rounded-xl space-y-4">
                <span className="block text-xs font-bold text-slate-400 tracking-wider uppercase">
                  Factorial Inputs
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label htmlFor="n-permutations" className="block text-slate-400 font-semibold mb-1">Total items (N)</label>
                    <input
                      id="n-permutations"
                      type="number"
                      min={1}
                      max={12}
                      value={nVal}
                      onChange={(e) => setNVal(Math.max(1, Math.min(12, Number(e.target.value))))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="r-combinations" className="block text-slate-400 font-semibold mb-1">Chosen (R)</label>
                    <input
                      id="r-combinations"
                      type="number"
                      min={1}
                      max={nVal}
                      value={rVal}
                      onChange={(e) => setRVal(Math.max(1, Math.min(nVal, Number(e.target.value))))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-slate-200 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                  <div className="flex items-center space-x-1.5"><ChevronRight className="h-3 w-3 text-blue-400" /><span>N restricts unique alphabet.</span></div>
                  <div className="flex items-center space-x-1.5"><ChevronRight className="h-3 w-3 text-blue-400" /><span>R designates selection group length.</span></div>
                </div>
              </div>

              {/* Set visualization cards */}
              <div className="bg-slate-955 border border-slate-850 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Combinational Space Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800">
                    <span className="block text-[9px] uppercase tracking-wide text-slate-450 font-bold">Permutations P(n,r)</span>
                    <span className="text-xl font-mono font-black text-blue-400">{combinatoricsData.pCount.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800">
                    <span className="block text-[9px] uppercase tracking-wide text-slate-450 font-bold">Combinations C(n,r)</span>
                    <span className="text-xl font-mono font-black text-blue-400">{combinatoricsData.cCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic arrangement grid view */}
            <div className="lg:col-span-2 space-y-5">
              <div className="border border-slate-850 rounded-xl p-4.5 bg-slate-950/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">Visual Selector Grid</h3>
                    <p className="text-xs text-slate-400">Highlighting the source set of {nVal} items.</p>
                  </div>
                  <div className="flex space-x-1 font-mono text-xs">
                    {items.map((it, idx) => (
                      <span 
                        key={it} 
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-650 text-white font-bold text-[10px] shadow-md transform hover:scale-110 transition-all duration-200"
                        style={{ filter: `hue-rotate(${idx * 45}deg)` }}
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* P samples */}
                  <div className="space-y-2 bg-slate-950 rounded-xl p-4 border border-slate-850">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Order Matters (Permutations)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Cap 60 shown</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">AB is considered distinct from BA.</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {combinatoricsData.pSamples.map((samp, idx) => (
                        <span key={idx} className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-350">
                          {samp.join('')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* C samples */}
                  <div className="space-y-2 bg-slate-950 rounded-xl p-4 border border-slate-850">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Group Subset (Combinations)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Cap 60 shown</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">AB is identical to BA. Order is discarded.</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {combinatoricsData.cSamples.map((samp, idx) => (
                        <span key={idx} className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold text-blue-400">
                          {samp.join('')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL: LOGIC TRUTH TABLE BUILDER */}
        {panelTab === 'logic' && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Propositional Logic Solver</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Write compound boolean statements for propositional elements $p, q, r$ and render tables.
                  </p>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/25 rounded-lg px-2.5 py-1">
                  <Code className="h-3.5 w-3.5" />
                  <span>Interactive Editor</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    id="input-proposition-logic"
                    type="text"
                    value={propositionFormula}
                    onChange={(e) => setPropositionFormula(e.target.value)}
                    placeholder="e.g. (p AND q) OR (NOT r)"
                    className="flex-1 text-sm bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 focus:outline-hidden focus:border-blue-500 transition-all font-mono"
                  />
                </div>

                {evalError && (
                  <p id="error-logic-syntactic" className="text-xs text-rose-400 font-medium font-mono">⚠️ {evalError}</p>
                )}

                {/* Operator pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="font-semibold uppercase mr-1">Quick operators:</span>
                  {['AND', 'OR', 'NOT', '->'].map(op => (
                    <button
                      key={op}
                      id={`btn-logic-op-pill-${op}`}
                      onClick={() => {
                        setPropositionFormula(prev => `${prev} ${op} `);
                        setEvalError(null);
                      }}
                      className="bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded px-2.5 py-1 font-mono hover:cursor-pointer text-slate-300 font-bold transition-all active:scale-95"
                    >
                      {op}
                    </button>
                  ))}
                  <p className="text-[10px] text-slate-550 pl-2">Use implication syntax `p {"->"} q` representing NOT p OR q</p>
                </div>
              </div>
            </div>

            {/* Generated Logic Grid */}
            <div className="border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-slate-950 border-b border-slate-850 px-6 py-3.5 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Table2 className="h-4 w-4 text-blue-400 animate-pulse" />
                  <span>$2^3$ Propositional Valuation Mapping</span>
                </span>
                <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Formula Evaluated: {propositionFormula}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-widest font-mono text-[9px] border-b border-slate-850 select-none">
                    <tr>
                      <th className="py-3">p</th>
                      <th className="py-3">q</th>
                      <th className="py-3">r</th>
                      <th className="py-3 text-blue-400 font-bold bg-blue-500/5">Result valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                    {truthTable.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/40 transition-all">
                        <td className="py-2.5">
                          <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${row.p ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950/40 text-rose-400 border border-rose-500/30'}`}>
                            {row.p ? 'T' : 'F'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${row.q ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950/40 text-rose-400 border border-rose-500/30'}`}>
                            {row.q ? 'T' : 'F'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${row.r ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950/40 text-rose-400 border border-rose-500/30'}`}>
                            {row.r ? 'T' : 'F'}
                          </span>
                        </td>
                        <td className={`py-2.5 font-extrabold text-[11px] ${row.result ? 'text-emerald-400 bg-emerald-500/5' : 'text-rose-400 bg-rose-500/5'}`}>
                          {row.result ? 'TRUE (1)' : 'FALSE (0)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PANEL: RECURRENCE MATHEMATICAL SYSTEM */}
        {panelTab === 'recurrence' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-5 col-span-1">
              {/* Presets and custom formulas */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 space-y-4">
                <span className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">
                  Preset Systems
                </span>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  {[
                    { id: 'fibonacci', label: 'Fibonacci ($a_n = a_{n-1} + a_{n-2}$)' },
                    { id: 'hanoi', label: 'Towers of Hanoi ($a_n = 2a_{n-1} + 1$)' },
                    { id: 'pell', label: 'Pell Numbers ($a_n = 2a_{n-1} + a_{n-2}$)' },
                    { id: 'custom', label: 'Custom Linear System' }
                  ].map(pres => (
                    <button
                      key={pres.id}
                      id={`btn-preset-recurrence-${pres.id}`}
                      onClick={() => selectRecurrencePreset(pres.id)}
                      className={`text-left py-2 px-3 rounded-lg border font-medium cursor-pointer transition-all ${
                        presetName === pres.id
                          ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {pres.label}
                    </button>
                  ))}
                </div>

                {/* Custom system inputs */}
                {presetName === 'custom' && (
                  <div className="space-y-3 pt-3 border-t border-slate-805 text-xs">
                    <p className="text-[11px] text-slate-455">Define relation: {"$a_n = c_1 a_{n-1} + c_2 a_{n-2}$"}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="c1-coefficient" className="block text-slate-400 font-semibold uppercase tracking-tight text-[10px]">C1 Multiplier</label>
                        <input
                          id="c1-coefficient"
                          type="number"
                          value={c1}
                          onChange={(e) => setC1(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-center text-slate-150 focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label htmlFor="c2-coefficient" className="block text-slate-400 font-semibold uppercase tracking-tight text-[10px]">C2 Multiplier</label>
                        <input
                          id="c2-coefficient"
                          type="number"
                          value={c2}
                          onChange={(e) => setC2(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-center text-slate-150 focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label htmlFor="a0-term" className="block text-slate-400 font-semibold uppercase tracking-tight text-[10px]">Value a[0]</label>
                        <input
                          id="a0-term"
                          type="number"
                          value={a0}
                          onChange={(e) => setA0(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-center text-slate-150 focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label htmlFor="a1-term" className="block text-slate-400 font-semibold uppercase tracking-tight text-[10px]">Value a[1]</label>
                        <input
                          id="a1-term"
                          type="number"
                          value={a1}
                          onChange={(e) => setA1(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-center text-slate-150 focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recurrence System Growth Mapping and Chart */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">Exponential Complexity Output</h3>
                  <span className="text-[10px] font-mono font-bold text-slate-500">n terms plotted</span>
                </div>

                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={recurrenceSeries}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="n" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#f8fafc',
                        }}
                      />
                      <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2} fillOpacity={0.18} fill="#3b82f6" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Term sequences print */}
                <div className="border border-slate-800 p-3 bg-slate-900 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Computed Term Series</span>
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-850/60 mt-1">
                    {recurrenceSeries.map((term, idx) => (
                      <span key={idx} className="bg-slate-950 border border-slate-850 text-[11px] font-mono hover:bg-slate-850 font-semibold rounded p-1 text-slate-300 hover:text-blue-400 transition-colors">
                        a[{term.n}] = {term.val.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
