/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Upload, 
  Activity, 
  Database, 
  Cpu, 
  Play, 
  Save, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3,
  MessageSquare,
  ChevronRight,
  Code2,
  FileJson,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { detectPotholes, askMentor } from './lib/gemini';

// --- Types ---
interface Pothole {
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  label: string;
  severity: 'low' | 'medium' | 'high';
}

interface DetectionResult {
  potholes: Pothole[];
  damage_summary: string;
  estimated_repair_priority: number;
}

// --- Mock Data ---
const TRAINING_DATA = [
  { epoch: 1, map50: 0.12, loss: 4.5 },
  { epoch: 10, map50: 0.35, loss: 2.1 },
  { epoch: 20, map50: 0.58, loss: 1.2 },
  { epoch: 30, map50: 0.72, loss: 0.8 },
  { epoch: 40, map50: 0.81, loss: 0.6 },
  { epoch: 50, map50: 0.85, loss: 0.5 },
];

export default function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [activeTab, setActiveTab] = useState('inference');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hello! I'm your YOLO Pothole mentor. How can I help you with your segmentation model today?" }
  ]);
  const [userInput, setUserInput] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile(event.target?.result as string);
        setResult(null); // Clear previous results
      };
      reader.readAsDataURL(file);
    }
  };

  // Run analysis (Simulation via Gemini)
  const runAnalysis = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    
    // Extract base64
    const base64 = selectedFile.split(',')[1];
    const detection = await detectPotholes(base64);
    
    setResult(detection);
    setIsAnalyzing(false);
  };

  // Draw detections on canvas
  useEffect(() => {
    if (result && canvasRef.current && imgRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = imgRef.current;
      canvas.width = img.clientWidth;
      canvas.height = img.clientHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      result.potholes.forEach((p) => {
        const [ymin, xmin, ymax, xmax] = p.box_2d;
        
        // Scale to canvas
        const left = (xmin / 1000) * canvas.width;
        const top = (ymin / 1000) * canvas.height;
        const width = ((xmax - xmin) / 1000) * canvas.width;
        const height = ((ymax - ymin) / 1000) * canvas.height;

        // Draw Box
        ctx.strokeStyle = p.severity === 'high' ? '#ef4444' : p.severity === 'medium' ? '#f59e0b' : '#3b82f6';
        ctx.lineWidth = 3;
        ctx.strokeRect(left, top, width, height);

        // Draw Mask Overlay (Simulated with translucent fill)
        ctx.fillStyle = (p.severity === 'high' ? '#ef4444' : p.severity === 'medium' ? '#f59e0b' : '#3b82f6') + '44'; 
        ctx.fillRect(left, top, width, height);

        // Label
        ctx.font = '12px Courier New';
        ctx.fillStyle = p.severity === 'high' ? '#ef4444' : p.severity === 'medium' ? '#f59e0b' : '#3b82f6';
        const labelText = p.severity.toUpperCase();
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillRect(left, top - 20, textWidth + 10, 20);
        ctx.fillStyle = 'white';
        ctx.fillText(labelText, left + 5, top - 5);
      });
    }
  }, [result, selectedFile]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const msg = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    
    const response = await askMentor(msg);
    setChatMessages(prev => [...prev, { role: 'ai', text: response || "" }]);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Sidebar / Navigation */}
      <nav className="fixed top-0 left-0 w-full h-16 border-b border-[#141414] bg-[#E4E3E0] z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#141414] rounded-sm flex items-center justify-center">
            <Activity className="text-[#E4E3E0] w-6 h-6" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold tracking-tighter uppercase">PotholeSeer_v1.0</h1>
            <p className="font-mono text-[10px] opacity-60">Status: System Operational // GPU: Ready</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-4 font-mono text-xs uppercase tracking-widest">
            <button onClick={() => setActiveTab('inference')} className={`hover:underline ${activeTab === 'inference' ? 'underline' : ''}`}>[01] Inference</button>
            <button onClick={() => setActiveTab('training')} className={`hover:underline ${activeTab === 'training' ? 'underline' : ''}`}>[02] Training</button>
            <button onClick={() => setActiveTab('mentor')} className={`hover:underline ${activeTab === 'mentor' ? 'underline' : ''}`}>[03] Mentor AI</button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-[#141414] font-mono text-[10px] rounded-none px-2 py-0.5">EPOCHS: 100/100</Badge>
            <Badge variant="outline" className="border-[#141414] font-mono text-[10px] rounded-none bg-[#141414] text-[#E4E3E0] px-2 py-0.5">mAP50: 0.852</Badge>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Viewport & Controls */}
        <div className="xl:col-span-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="inference" className="mt-0 space-y-6">
              <Card className="border-[#141414] rounded-none bg-transparent shadow-none overflow-hidden">
                <CardHeader className="border-b border-[#141414] py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-mono text-sm uppercase italic">Live_Analysis_Viewport</CardTitle>
                      <CardDescription className="font-mono text-[10px]">Processing source: {selectedFile ? 'Camera_In' : 'No_Signal'}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-none border-[#141414] h-8 font-mono text-[10px] uppercase"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <Upload className="w-3 h-3 mr-2" /> Load_Source
                      </Button>
                      <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      
                      <Button 
                        size="sm" 
                        className="rounded-none bg-[#141414] text-[#E4E3E0] h-8 font-mono text-[10px] uppercase hover:bg-opacity-90 px-4"
                        onClick={runAnalysis}
                        disabled={!selectedFile || isAnalyzing}
                      >
                        {isAnalyzing ? <Activity className="w-3 h-3 mr-2 animate-spin" /> : <Play className="w-3 h-3 mr-2" />}
                        Run_Inference
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 bg-[#000] aspect-video relative flex items-center justify-center group">
                  {!selectedFile ? (
                    <div className="flex flex-col items-center gap-4 text-[#8E9299]">
                      <div className="w-24 h-24 border border-dashed border-[#8E9299] flex items-center justify-center opacity-30 animate-pulse">
                        <Maximize2 className="w-8 h-8" />
                      </div>
                      <p className="font-mono text-xs uppercase tracking-tighter">Waiting for input stream...</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                      <img 
                        ref={imgRef}
                        src={selectedFile} 
                        alt="Source" 
                        className="max-w-full max-h-full object-contain"
                      />
                      <canvas 
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      />
                    </div>
                  )}

                  {/* HUD Elements */}
                  <div className="absolute top-4 left-4 font-mono text-[10px] text-white/50 space-y-1 pointer-events-none uppercase">
                    <p>LAT: 40.7128° N</p>
                    <p>LON: 74.0060° W</p>
                    <p>RES: 1280x720</p>
                  </div>
                  
                  <div className="absolute top-4 right-4 font-mono text-[10px] text-white/50 text-right pointer-events-none uppercase">
                    <p>FPS: {isAnalyzing ? '--' : '0.0'}</p>
                    <p>INFERENCE: {isAnalyzing ? 'ACTIVE' : 'IDLE'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-[#141414] rounded-none bg-transparent shadow-none">
                  <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                    <p className="font-mono text-[10px] uppercase opacity-60 mb-1">Detections_Count</p>
                    <p className="text-4xl font-mono font-bold">{result?.potholes.length || 0}</p>
                  </div>
                </Card>
                <Card className="border-[#141414] rounded-none bg-transparent shadow-none">
                  <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                    <p className="font-mono text-[10px] uppercase opacity-60 mb-1">Max_Severity</p>
                    <p className={`text-2xl font-mono font-bold uppercase ${result?.potholes.some(p => p.severity === 'high') ? 'text-red-700' : 'text-[#141414]'}`}>
                      {result?.potholes.some(p => p.severity === 'high') ? 'Critical' : result?.potholes.length ? 'Stable' : 'None'}
                    </p>
                  </div>
                </Card>
                <Card className="border-[#141414] rounded-none bg-transparent shadow-none">
                  <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                    <p className="font-mono text-[10px] uppercase opacity-60 mb-1">Repair_Priority</p>
                    <div className="w-full px-4 mt-2">
                       <Progress value={(result?.estimated_repair_priority || 0) * 10} className="h-1 bg-[#141414]/10 rounded-none " />
                    </div>
                    <p className="text-2xl font-mono font-bold mt-1">{(result?.estimated_repair_priority || 0)}/10</p>
                  </div>
                </Card>
              </div>

              {/* Analysis Log */}
              <Card className="border-[#141414] rounded-none bg-transparent shadow-none">
                <CardHeader className="py-3 border-b border-[#141414]">
                  <CardTitle className="font-mono text-xs uppercase">System_Log_Output</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[200px] font-mono text-[11px] p-4">
                    <div className="space-y-1">
                      <p className="text-blue-700 font-bold">[SYS] Initializing Vision Engine...</p>
                      <p className="text-blue-700 font-bold">[SYS] Model loaded: yolov8n-seg.pt (nano)</p>
                      <p>[LOG] Waiting for video signal...</p>
                      {result && (
                        <>
                          <p className="text-green-700 font-bold">[INF] Inference cycle complete.</p>
                          <p className="text-green-700 font-bold">[INF] Found {result.potholes.length} instances.</p>
                          <p className="italic text-gray-700 mt-2">Summary: {result.damage_summary}</p>
                        </>
                      )}
                      {isAnalyzing && <p className="animate-pulse">_Running instance segmentation...</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="training" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-[#141414] rounded-none bg-transparent shadow-none">
                  <CardHeader className="py-3 border-b border-[#141414]">
                    <CardTitle className="font-mono text-sm uppercase italic">Performance_Curriculum</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={TRAINING_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141422" />
                        <XAxis dataKey="epoch" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="map50" stroke="#141414" fill="#14141422" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-[#141414] rounded-none bg-transparent shadow-none">
                  <CardHeader className="py-3 border-b border-[#141414]">
                    <CardTitle className="font-mono text-sm uppercase italic">Training_Script_Reference</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px] p-4 bg-[#141414] text-[#E4E3E0] font-mono text-[10px]">
                      <code className="whitespace-pre-wrap">
                        {`# YOLOv8-seg Training Script
from ultralytics import YOLO

# Load model
model = YOLO('yolov8n-seg.pt')

# Train
results = model.train(
    data='custom_pothole.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    device=0,
    augment=True,
    patience=50
)`}
                      </code>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              
              <Alert className="border-[#141414] bg-[#14141411] rounded-none">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-mono text-xs uppercase font-bold">Optimization Note</AlertTitle>
                <AlertDescription className="text-xs">
                  YOLOv8n-seg is optimized for edge devices. For higher precision on severe damage, consider fine-tuning on a balanced dataset of diverse road textures.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="mentor" className="mt-0 space-y-6">
               {/* Mentor Content is handled in the persistent sidebar on the right for this layout */}
               <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#14141433]">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                  <h3 className="font-mono text-sm uppercase mb-2">Mentor Interface Active</h3>
                  <p className="text-xs max-w-md opacity-60 font-mono">Use the chat panel on the right to interact with the YOLO specialist mentor. I am trained on Ultralytics datasets and instance segmentation best practices.</p>
               </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Mentor & Meta */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="border-[#141414] rounded-none bg-transparent shadow-none flex flex-col h-[600px] xl:h-[calc(100vh-180px)]">
            <CardHeader className="py-3 border-b border-[#141414]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <CardTitle className="font-mono text-xs uppercase italic">Mentor_Insight_Interface</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                 <div className="space-y-4">
                   {chatMessages.map((msg, i) => (
                     <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 font-mono text-[11px] leading-relaxed ${msg.role === 'user' ? 'bg-[#141414] text-[#E4E3E0]' : 'border border-[#141414] bg-white/50'}`}>
                          <p className="opacity-40 text-[9px] mb-1 uppercase font-bold tracking-tighter">{msg.role === 'ai' ? 'MODEL_MENTOR_01' : 'USER_OPS'}</p>
                          {msg.text}
                        </div>
                     </div>
                   ))}
                 </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-[#141414] bg-[#14141405]">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ask about model tuning, masks, or metrics..." 
                    className="flex-1 bg-transparent border-b border-[#141414] font-mono text-xs focus:outline-none py-1 placeholder:tracking-tighter placeholder:opacity-30"
                    value={userInput}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    onChange={(e) => setUserInput(e.target.value)}
                  />
                  <Button 
                    size="sm" 
                    className="rounded-none bg-[#141414] text-[#E4E3E0] h-6 font-mono text-[9px] uppercase hover:bg-opacity-80"
                    onClick={handleSendMessage}
                  >
                    Transmit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#141414] rounded-none bg-transparent shadow-none">
            <CardHeader className="py-3 border-b border-[#141414]">
              <CardTitle className="font-mono text-xs uppercase italic">Resource_Mapping</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 font-mono text-[10px]">
              <div className="space-y-2">
                 <div className="flex justify-between items-center uppercase tracking-tighter">
                   <span>Dataset: Pothole_v8_S</span>
                   <span className="opacity-60">[VERIFIED]</span>
                 </div>
                 <Progress value={92} className="h-0.5 rounded-none bg-[#14141411]" />
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between items-center uppercase tracking-tighter">
                   <span>Dataset: Archive_M</span>
                   <span className="opacity-60">[MERGING...]</span>
                 </div>
                 <Progress value={45} className="h-0.5 rounded-none bg-[#14141411]" />
              </div>
              <Separator className="bg-[#14141422]" />
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="w-full text-[9px] rounded-none border-[#141414] h-7 uppercase hover:bg-[#141414] hover:text-[#E4E3E0]">Export_Weights</Button>
                <Button variant="outline" size="sm" className="w-full text-[9px] rounded-none border-[#141414] h-7 uppercase hover:bg-[#141414] hover:text-[#E4E3E0]">Clear_Cache</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 w-full h-8 border-t border-[#141414] bg-[#E4E3E0] px-6 flex items-center justify-between font-mono text-[9px] z-50">
        <div className="flex gap-4">
          <span className="flex items-center gap-1 uppercase tracking-tighter"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> ENGINE: ONLINE</span>
          <span className="opacity-40 uppercase tracking-tighter">STORAGE: 14.2GB / 100GB</span>
        </div>
        <div className="flex gap-4">
          <span className="opacity-40 uppercase tracking-tighter">Road_Damage_AI // Infrastructure_Monitor</span>
          <span className="uppercase tracking-tighter">AIS-CORE: READY</span>
        </div>
      </footer>
    </div>
  );
}
