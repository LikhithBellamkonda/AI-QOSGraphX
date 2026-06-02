import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, Pause, RefreshCw, Layers, Database, Wifi, AlertCircle, 
  TrendingUp, Activity, BarChart4, ChevronRight, Settings, Info
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { ThingSpeakChannel, ThingSpeakFeedItem } from '../types';

// Standard demo feeds mock generator
const generateDemoDataPoint = (index: number, prevVal: number, range: [number, number]): number => {
  const noise = (Math.random() - 0.5) * (range[1] - range[0]) * 0.1;
  let newVal = prevVal + noise;
  if (newVal < range[0]) newVal = range[0] + Math.random() * 2;
  if (newVal > range[1]) newVal = range[1] - Math.random() * 2;
  return parseFloat(newVal.toFixed(2));
};

export default function ThingSpeakDashboard() {
  // Input Config state
  const [channelId, setChannelId] = useState<string>('2415124'); // Example open channel
  const [apiKey, setApiKey] = useState<string>('1EAJM2GB29JHWIHH'); // User Read API Key
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [resultsCount, setResultsCount] = useState<number>(30);
  const [refreshInterval, setRefreshInterval] = useState<number>(10); // in seconds
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Write support (using User Write API Key)
  const [writeApiKey, setWriteApiKey] = useState<string>('YQGIUNIEQJFF3ORX');
  const [isPushingLive, setIsPushingLive] = useState<boolean>(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  // Live status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [channelInfo, setChannelInfo] = useState<ThingSpeakChannel | null>(null);
  const [feedData, setFeedData] = useState<ThingSpeakFeedItem[]>([]);
  const [selectedField, setSelectedField] = useState<string>('field1');
  const [activeTab, setActiveTabTab] = useState<'charts' | 'history' | 'stats'>('charts');

  // Load initial demo data
  const initDemoData = useCallback(() => {
    const data: ThingSpeakFeedItem[] = [];
    let temp = 24.5;
    let hum = 55.0;
    let gas = 280;
    let pir = 0;

    const mockChannel: ThingSpeakChannel = {
      id: 999999,
      name: 'Secure Environment IoT Node (Demo)',
      description: 'Educational simulation of climate, gas sensor levels & PIR motion metrics.',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString(),
      last_entry_id: resultsCount,
      field1: 'Temperature (°C)',
      field2: 'Humidity (%)',
      field3: 'MQ2 Gas Level (ppm)',
      field4: 'PIR Motion Sensor (Binary)',
    };
    
    for (let i = resultsCount; i >= 1; i--) {
      temp = generateDemoDataPoint(i, temp, [15, 38]);
      hum = generateDemoDataPoint(i, hum, [30, 95]);
      gas = generateDemoDataPoint(i, gas, [100, 900]);
      pir = Math.random() > 0.8 ? 1 : 0;
      
      data.push({
        created_at: new Date(Date.now() - i * 60000).toISOString(),
        entry_id: resultsCount - i + 1,
        field1: temp,
        field2: hum,
        field3: parseFloat(gas.toFixed(1)),
        field4: pir,
      });
      gas = generateDemoDataPoint(i, gas, [100, 900]);
    }

    setChannelInfo(mockChannel);
    setFeedData(data);
    setErrorMsg(null);
  }, [resultsCount]);

  // Fetch from ThingSpeak Cloud
  const fetchThingSpeakData = useCallback(async () => {
    if (isDemoMode) return;
    if (!channelId.trim()) {
      setErrorMsg('Please provide a valid ThingSpeak Channel ID.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const apiURL = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=${resultsCount}`;
      const response = await fetch(apiURL);
      if (!response.ok) {
        throw new Error(`ThingSpeak responded with code ${response.status}. Please check channel permissions/Read API Key.`);
      }
      const data = await response.json();
      if (!data || !data.channel || !data.feeds) {
        throw new Error('Malformed JSON received from ThingSpeak Cloud.');
      }
      setChannelInfo(data.channel);
      setFeedData(data.feeds);
      
      // Ensure selectedField exists in custom fields
      const channelFields = Object.keys(data.channel).filter(key => key.startsWith('field'));
      if (channelFields.length > 0 && !data.channel[selectedField as keyof ThingSpeakChannel]) {
        setSelectedField(channelFields[0]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fetch sensor stream. Ensure the Channel ID is correct & Public (or set API Key).');
    } finally {
      setIsLoading(false);
    }
  }, [channelId, apiKey, isDemoMode, resultsCount, selectedField]);

  // Push simulated data to User's ThingSpeak cloud dynamically
  const pushToThingSpeak = useCallback(async (temp: number, hum: number, gas: number, pir: number) => {
    if (!writeApiKey.trim()) {
      setPushStatus('No Write API Key provided.');
      return;
    }
    try {
      setPushStatus('Pushing metrics...');
      const url = `https://api.thingspeak.com/update?api_key=${writeApiKey}&field1=${temp}&field2=${hum}&field3=${gas}&field4=${pir}`;
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        if (text === '0') {
          setPushStatus('Failed: Rate limit (wait 15s between writes).');
        } else {
          setPushStatus(`Payload uploaded! Channel Entry ID: ${text}`);
        }
      } else {
        setPushStatus(`Upload failed: status ${response.status}`);
      }
    } catch (err: any) {
      setPushStatus(`Upload error: ${err.message || err}`);
    }
  }, [writeApiKey]);

  // Handle stream tick for live demo simulation
  useEffect(() => {
    if (isDemoMode) {
      initDemoData();
    } else {
      fetchThingSpeakData();
    }
  }, [isDemoMode, resultsCount]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (isDemoMode) {
        // Append a simulated tick
        setFeedData(prev => {
          if (prev.length === 0) return prev;
          const lastIndex = prev[prev.length - 1].entry_id;
          const lastTemp = parseFloat(String(prev[prev.length - 1].field1 || 25));
          const lastHum = parseFloat(String(prev[prev.length - 1].field2 || 60));
          const lastGas = parseFloat(String(prev[prev.length - 1].field3 || 280));

          const newTemp = generateDemoDataPoint(0, lastTemp, [15, 38]);
          const newHum = generateDemoDataPoint(0, lastHum, [30, 95]);
          const newGas = generateDemoDataPoint(0, lastGas, [100, 900]);
          const newPir = Math.random() > 0.8 ? 1 : 0;

          const nextFeed: ThingSpeakFeedItem = {
            created_at: new Date().toISOString(),
            entry_id: lastIndex + 1,
            field1: newTemp,
            field2: newHum,
            field3: parseFloat(newGas.toFixed(1)),
            field4: newPir,
          };
          
          if (isPushingLive) {
            pushToThingSpeak(newTemp, newHum, parseFloat(newGas.toFixed(1)), newPir);
          }
          
          return [...prev.slice(1), nextFeed];
        });
      } else {
        fetchThingSpeakData();
      }
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isDemoMode, refreshInterval, fetchThingSpeakData, isPushingLive, pushToThingSpeak]);

  // Aggregate statistics
  const statistics = useMemo(() => {
    if (feedData.length === 0) return { avg: 0, min: 0, max: 0, stdDev: 0, current: 0 };
    
    const values = feedData
      .map(item => parseFloat(String(item[selectedField])))
      .filter(val => !isNaN(val));

    if (values.length === 0) return { avg: 0, min: 0, max: 0, stdDev: 0, current: 0 };

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = parseFloat((sum / values.length).toFixed(2));
    const min = parseFloat(Math.min(...values).toFixed(2));
    const max = parseFloat(Math.max(...values).toFixed(2));
    
    // Std dev calculation
    const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
    const stdDev = parseFloat(Math.sqrt(variance).toFixed(2));
    const current = parseFloat(values[values.length - 1].toFixed(2));

    return { avg, min, max, stdDev, current };
  }, [feedData, selectedField]);

  // List of active fields the channel possesses
  const activeFields = useMemo(() => {
    if (!channelInfo) return [];
    const fields: { id: string; label: string }[] = [];
    for (let i = 1; i <= 8; i++) {
      const fieldKey = `field${i}` as keyof ThingSpeakChannel;
      const fieldName = channelInfo[fieldKey] as string;
      if (fieldName) {
        fields.push({ id: `field${i}`, label: fieldName });
      }
    }
    return fields;
  }, [channelInfo]);

  // Recharts structured dataset helper
  const chartData = useMemo(() => {
    return feedData.map(item => {
      const date = new Date(item.created_at);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        ...item,
        formattedTime: timeStr,
        displayVal: parseFloat(String(item[selectedField] || 0)),
      };
    });
  }, [feedData, selectedField]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-1 py-2 text-slate-200">
      {/* Configuration Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-2 text-blue-400 font-semibold mb-4 pb-2 border-b border-slate-800">
            <Settings className="h-5 w-5 text-blue-400" />
            <span className="font-sans">IoT Stream Source</span>
          </div>

          <div className="space-y-4">
            {/* Toggle demo vs cloud */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button 
                id="btn-demo-mode-toggle"
                onClick={() => setIsDemoMode(true)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 cursor-pointer ${
                  isDemoMode 
                    ? 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.35)] text-white font-semibold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mock Demo Feed
              </button>
              <button 
                id="btn-live-cloud-mode-toggle"
                onClick={() => setIsDemoMode(false)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 cursor-pointer ${
                  !isDemoMode 
                    ? 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.35)] text-white font-semibold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ThingSpeak Cloud
              </button>
            </div>

            {!isDemoMode ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label htmlFor="thingspeak-channel-id" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Channel ID
                  </label>
                  <input 
                    id="thingspeak-channel-id"
                    type="text" 
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    placeholder="e.g. 2415124"
                    className="w-full text-sm bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-700 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-950/40 transition-all font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="thingspeak-api-key" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Read API Key (Optional)
                  </label>
                  <input 
                    id="thingspeak-api-key"
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="None (Public Channel)"
                    className="w-full text-sm bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-700 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-950/40 transition-all font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Required if the channel is marked private in ThingSpeak panel.</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-pulse">
                <div className="flex space-x-2">
                  <Wifi className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-blue-300 font-medium">
                    Simulating fully dynamic local environmental safety sensor metrics. Use this mode to evaluate visual performance without having a live IoT device running.
                  </p>
                </div>
              </div>
            )}

            {/* General parameters */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Auto-poll Rate:</span>
                <select 
                  id="select-poll-rate"
                  value={refreshInterval} 
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-850 rounded-lg py-1 px-2 font-mono text-xs select-none text-slate-300 focus:outline-hidden focus:border-blue-500"
                >
                  <option value={3}>3s (Demo Only)</option>
                  <option value={10}>10s (Fast)</option>
                  <option value={15}>15s (ThingSpeak Standard)</option>
                  <option value={30}>30s</option>
                  <option value={60}>1 min</option>
                </select>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Data Points to Keep:</span>
                <select 
                  id="select-results-count"
                  value={resultsCount} 
                  onChange={(e) => setResultsCount(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-850 rounded-lg py-1 px-2 font-mono text-xs text-slate-300 focus:outline-hidden focus:border-blue-500"
                >
                  <option value={15}>15 points</option>
                  <option value={30}>30 points</option>
                  <option value={50}>50 points</option>
                  <option value={100}>100 points</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2 pt-2">
              <button 
                id="btn-stream-play-pause"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 text-xs font-semibold cursor-pointer transition-all ${
                  isPlaying 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause Stream</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Resume Stream</span>
                  </>
                )}
              </button>

              {!isDemoMode && (
                <button 
                  id="btn-manual-poll-trigger"
                  onClick={fetchThingSpeakData}
                  disabled={isLoading}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 p-2 rounded-lg flex items-center justify-center hover:cursor-pointer transition-all disabled:opacity-50"
                  title="Force Reload Now"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live ThingSpeak cloud transmitter control board */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold pb-2 border-b border-slate-800">
            <Activity className="h-5 w-5 text-emerald-400" />
            <span className="font-sans">Simulated Cloud Writer</span>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="thingspeak-write-key" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Write API Key (Private)
              </label>
              <input 
                id="thingspeak-write-key"
                type="password" 
                value={writeApiKey}
                onChange={(e) => setWriteApiKey(e.target.value)}
                placeholder="e.g. YQGIUNIEQJFF3ORX"
                className="w-full text-sm bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-700 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-950/40 transition-all font-mono"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded-xl">
              <div className="text-xs">
                <span className="block font-semibold text-slate-300">Auto-Sync to Cloud</span>
                <span className="text-[10px] text-slate-500">Post simulated ticks live</span>
              </div>
              <button
                id="btn-auto-sync-toggle"
                onClick={() => setIsPushingLive(!isPushingLive)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isPushingLive ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isPushingLive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <button
                id="btn-single-cloud-manual-push"
                onClick={() => {
                  const latestItem = feedData[feedData.length - 1];
                  const temp = latestItem ? parseFloat(String(latestItem.field1)) : 24.5;
                  const hum = latestItem ? parseFloat(String(latestItem.field2)) : 55.0;
                  const gas = latestItem ? parseFloat(String(latestItem.field3)) : 280.0;
                  const pir = latestItem ? parseFloat(String(latestItem.field4)) : 0;
                  pushToThingSpeak(temp, hum, gas, pir);
                }}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 text-xs font-semibold cursor-pointer transition-all"
              >
                <span>Trigger Single Cloud Post</span>
              </button>

              {pushStatus && (
                <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-mono text-center">
                  <span className="text-slate-500">Status: </span>
                  <span className={pushStatus.includes('uploaded') ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                    {pushStatus}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-500 leading-normal">
              Field mapping: Temp (F1), Hum (F2), Gas (F3), PIR Motion (F4).
            </p>
          </div>
        </div>

        {/* Channel Info summary card */}
        {channelInfo && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-3 shadow-md">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 tracking-wider uppercase">
              <Database className="h-4 w-4 text-blue-400" />
              <span>Channel Details</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 clamp-2">{channelInfo.name}</h4>
              <p className="text-xs text-slate-450 mt-1 leading-relaxed">{channelInfo.description || 'No description provided.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] border-t border-slate-800 font-mono text-slate-400">
              <div>
                <span className="block text-slate-500 font-sans font-medium uppercase tracking-tight">Channel ID:</span>
                <span className="font-semibold text-blue-400">{channelInfo.id}</span>
              </div>
              <div>
                <span className="block text-slate-500 font-sans font-medium uppercase tracking-tight">Total Feeds:</span>
                <span className="font-semibold text-emerald-400">{feedData.length} active</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Stream Area */}
      <div className="lg:col-span-3 space-y-6">
        {/* Alerts / Loading status */}
        {errorMsg && (
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 text-rose-300 flex items-start space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-200">Connection Error</p>
              <p className="text-xs opacity-90 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Field Selector Pill Group */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl">
          <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-3 text-blue-450">
            Monitor Stream Channel Metric
          </span>
          <div className="flex flex-wrap gap-2">
            {activeFields.length === 0 ? (
              <span className="text-slate-500 text-xs py-1">Initializing channel fields...</span>
            ) : (
              activeFields.map((field) => (
                <button
                  key={field.id}
                  id={`btn-field-pill-${field.id}`}
                  onClick={() => setSelectedField(field.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 border ${
                    selectedField === field.id
                      ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {field.label}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Aggregate statistics ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-805 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Latest Reading</span>
            <div className="flex items-baseline space-x-1 mt-2">
              <span className="text-xl md:text-2xl font-mono font-bold text-slate-100">{statistics.current}</span>
            </div>
            <span className="text-[10px] text-blue-400 font-semibold mt-1 flex items-center">
              <Activity className="h-2.5 w-2.5 mr-0.5" /> Live tick
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-805 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Average Stream</span>
            <div className="flex items-baseline space-x-1 mt-2">
              <span className="text-xl md:text-2xl font-mono font-bold text-slate-100">{statistics.avg}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">MEAN VALUE</span>
          </div>

          <div className="bg-slate-900 border border-slate-805 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Peak Signal</span>
            <div className="flex items-baseline space-x-1 mt-2">
              <span className="text-xl md:text-2xl font-mono font-bold text-emerald-400">{statistics.max}</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center">
              <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> MAXIMUM
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-805 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Lowest Signal</span>
            <div className="flex items-baseline space-x-1 mt-2">
              <span className="text-xl md:text-2xl font-mono font-bold text-amber-400">{statistics.min}</span>
            </div>
            <span className="text-[10px] text-amber-400 mt-1 uppercase tracking-wider">MINIMUM</span>
          </div>

          <div className="bg-slate-900 border border-slate-805 rounded-xl p-4 shadow-lg flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Deviation (σ)</span>
            <div className="flex items-baseline space-x-1 mt-2">
              <span className="text-xl md:text-2xl font-mono font-bold text-blue-450">{statistics.stdDev}</span>
            </div>
            <span className="text-[10px] text-blue-400 mt-1 uppercase tracking-wider">FLUX METRIC</span>
          </div>
        </div>

        {/* Dynamic Display workspace (Tabs: Charts, History table, Stats reports) */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="border-b border-slate-800 bg-slate-950/40 flex justify-between items-center px-6 py-3">
            <div className="flex space-x-4">
              <button
                id="btn-tab-charts"
                onClick={() => setActiveTabTab('charts')}
                className={`py-1.5 text-xs font-semibold tracking-wide cursor-pointer flex items-center space-x-1.5 transition-all outline-none ${
                  activeTab === 'charts' 
                    ? 'text-blue-400 border-b-2 border-blue-500 font-bold' 
                    : 'text-slate-405 hover:text-slate-200'
                }`}
              >
                <BarChart4 className="h-3.5 w-3.5" />
                <span>Sensor Graph Layout</span>
              </button>
              <button
                id="btn-tab-history"
                onClick={() => setActiveTabTab('history')}
                className={`py-1.5 text-xs font-semibold tracking-wide cursor-pointer flex items-center space-x-1.5 transition-all outline-none ${
                  activeTab === 'history' 
                    ? 'text-blue-400 border-b-2 border-blue-500 font-bold' 
                    : 'text-slate-405 hover:text-slate-200'
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                <span>History Streams Log</span>
              </button>
              <button
                id="btn-tab-stats"
                onClick={() => setActiveTabTab('stats')}
                className={`py-1.5 text-xs font-semibold tracking-wide cursor-pointer flex items-center space-x-1.5 transition-all outline-none ${
                  activeTab === 'stats' 
                    ? 'text-blue-400 border-b-2 border-blue-500 font-bold' 
                    : 'text-slate-405 hover:text-slate-200'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Aggregated Analytics</span>
              </button>
            </div>
            
            <div className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
              <RefreshCw className={`h-2.5 w-2.5 ${isPlaying && isDemoMode ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isPlaying ? `Updating live...` : 'Updates paused'}</span>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'charts' && (
              <div className="space-y-4">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorField" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis 
                        dataKey="formattedTime" 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: '1px solid #1e293b', 
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          color: '#e2e8f0'
                        }}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="displayVal" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorField)" 
                        name={activeFields.find(f => f.id === selectedField)?.label || 'Value'}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl text-xs text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <Info className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>This chart shows the last {feedData.length} records. Transition effects are baked dynamically into stream changes.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-mono text-[9px] select-none">
                      <tr>
                        <th className="px-5 py-3 text-center">Entry ID</th>
                        <th className="px-5 py-3">Timestamp (UTC)</th>
                        {activeFields.map(f => (
                          <th key={f.id} className={`px-5 py-3 ${f.id === selectedField ? 'text-blue-400 bg-blue-500/10 font-bold' : ''}`}>
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                      {feedData.slice().reverse().map((item) => (
                        <tr key={item.entry_id} className="hover:bg-slate-850/40 transition-all">
                          <td className="px-5 py-2.5 text-center font-semibold text-slate-550">{item.entry_id}</td>
                          <td className="px-5 py-2.5 text-slate-450">
                            {new Date(item.created_at).toLocaleString([], {
                                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </td>
                          {activeFields.map(f => {
                            const cellsVal = parseFloat(String(item[f.id as keyof ThingSpeakFeedItem]));
                            const isFocused = f.id === selectedField;
                            return (
                              <td key={f.id} className={`px-5 py-2.5 ${isFocused ? 'font-bold text-blue-400 bg-blue-500/5' : ''}`}>
                                {isNaN(cellsVal) ? '—' : cellsVal.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span>Interactive Probability Distribution & Historical Range</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-950/40">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Statistical Distribution Profile</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Using Gaussian Normal approximation, standard error is represented visually below. Sensor dispersion tells academic users about the level of noise and stability of the system.
                    </p>
                    <div className="pt-2 space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-455">Lower Bound (μ - σ)</span>
                        <span className="font-semibold text-slate-300">{(statistics.avg - statistics.stdDev).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-455">Mean Value (μ)</span>
                        <span className="font-semibold text-slate-100">{statistics.avg}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-455">Upper Bound (μ + σ)</span>
                        <span className="font-semibold text-slate-300">{(statistics.avg + statistics.stdDev).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-950/40">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Dynamic Trend Rate</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Determines the difference between latest active stream metrics and overall average to evaluate drift over the monitored period.
                    </p>
                    <div className="pt-2 text-center">
                      <div className={`text-xl font-mono font-extrabold ${statistics.current >= statistics.avg ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {statistics.current >= statistics.avg ? '+' : ''}{(statistics.current - statistics.avg).toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Difference From Session Mean</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
