import React, { useState } from 'react';
import { 
  Network, Wifi, Binary, GitFork, BookOpen, GraduationCap, Github, Layers, ArrowRight, CheckCircle2, ChevronRight
} from 'lucide-react';
import ThingSpeakDashboard from './components/ThingSpeakDashboard';
import QosGraphVisualizer from './components/QosGraphVisualizer';
import DiscreteMathHub from './components/DiscreteMathHub';

export default function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<'iot' | 'qos' | 'discrete'>('iot');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-blue-900 selection:text-blue-150 antialiased">
      
      {/* Top Academic Banner */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl p-2.5 shadow-[0_0_10px_rgba(59,130,246,0.15)] transform hover:rotate-6 transition-all duration-300">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight font-sans">
                QOSGraphX Academic Dashboard
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-medium">
                <span>Core IoT Telemetry Platform & Discrete Mathematic Solver</span>
                <span className="w-1.5 h-1.5 bg-blue-500/50 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.5)]"></span>
                <span className="text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/10">Release v1.2</span>
              </p>
            </div>
          </div>

          {/* GitHub Repo link */}
          <a
            id="github-repository-hyperlink"
            href="https://github.com/LikhithBellamkonda/QOSGraphX"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-slate-100 font-semibold text-xs border border-slate-800 rounded-xl px-4 py-2 hover:border-blue-500/30 transition-all duration-300 shadow-2xs w-fit cursor-pointer"
          >
            <Github className="h-4 w-4 text-blue-400" />
            <span>LikhithBellamkonda / QOSGraphX</span>
            <GitFork className="h-3.5 w-3.5 text-slate-500" />
          </a>
        </div>
      </header>

      {/* Main Educational Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        
        {/* Module Segment Controls (Tab system) */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <button
              id="btn-workspace-tab-thingspeak"
              onClick={() => setActiveWorkspace('iot')}
              className={`px-4.5 py-3 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center space-x-2.5 cursor-pointer transition-all duration-300 ${
                activeWorkspace === 'iot'
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-blue-500 font-bold'
                  : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Wifi className="h-4 w-4 shrink-0" />
              <span>ThingSpeak IoT Telemetry</span>
            </button>

            <button
              id="btn-workspace-tab-routing"
              onClick={() => setActiveWorkspace('qos')}
              className={`px-4.5 py-3 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center space-x-2.5 cursor-pointer transition-all duration-300 ${
                activeWorkspace === 'qos'
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-blue-500 font-bold'
                  : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Network className="h-4 w-4 shrink-0" />
              <span>QoS Routing Graph Lab</span>
            </button>

            <button
              id="btn-workspace-tab-discrete"
              onClick={() => setActiveWorkspace('discrete')}
              className={`px-4.5 py-3 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center space-x-2.5 cursor-pointer transition-all duration-300 ${
                activeWorkspace === 'discrete'
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-blue-500 font-bold'
                  : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Binary className="h-4 w-4 shrink-0" />
              <span>Discrete Structures Lab</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-medium font-mono hidden lg:flex items-center space-x-1">
            <BookOpen className="h-3.5 w-3.5 text-blue-400 mr-1" />
            <span>Academic Sandbox Mode Active</span>
          </div>
        </div>

        {/* Workspace Display */}
        <div className="transition-all duration-300">
          {activeWorkspace === 'iot' && <ThingSpeakDashboard />}
          {activeWorkspace === 'qos' && <QosGraphVisualizer />}
          {activeWorkspace === 'discrete' && <DiscreteMathHub />}
        </div>

        {/* Academic conceptual curriculum cards */}
        <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6.5 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 bottom-0 translate-y-8 translate-x-8 text-blue-500/5 font-mono select-none pointer-events-none scale-150">
            QOSGRAPHX
          </div>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            <div className="space-y-3.5">
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded">
                Syllabus Guide
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Syllabus Map & Structural Concepts</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                Discrete Math underlies every routing decision. Graphs model connections, logical statements model constraints, combinatorics dictates route counts, and recurrence gives performance complexities.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 border-t border-slate-800 mt-6 pt-6.5 text-xs text-slate-400">
            <div className="space-y-1">
              <h4 className="text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Combinatorics in Networks</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-400 select-none">
                $2^n$ subnet addressing routes, network segment layouts, combinations of paths mapping to specific gateway priorities.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Boolean Policy Constraints</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-400 select-none">
                Propositional values model if a route is feasible (e.g. Bandwidth AND NOT Jitter_Exceeded Implies Path_Valid criteria).
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Time-Space Recurrence</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-400 select-none">
                Divide-and-conquer recurrences analyze recursion steps, tree traversals, and dynamic routing updates under QoS bounds.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Standard Academic Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 text-center py-6 mt-12 text-xs text-slate-500 select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 font-medium">
          <p>© 2026 QOSGraphX Academic Platform. Powered by Google AI Studio.</p>
          <div className="flex space-x-4">
            <a href="https://thingspeak.com/" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-all duration-300">ThingSpeak IoT</a>
            <span>•</span>
            <a href="https://github.com/LikhithBellamkonda" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-all duration-300">Likhith Bellamkonda Profile</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
