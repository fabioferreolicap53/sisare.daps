import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, AlertCircle, BarChart3, Users, History, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface PendingFeedbackCount {
  unit: string;
  count: number;
}

interface UploadHistory {
  id: string;
  fileName: string;
  date: string;
  totalUnits: number;
  totalPending: number;
  data: PendingFeedbackCount[];
}

export default function App() {
  const [data, setData] = useState<PendingFeedbackCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('sisare_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (fileName: string, results: PendingFeedbackCount[]) => {
    const totalPending = results.reduce((acc, curr) => acc + curr.count, 0);
    const newEntry: UploadHistory = {
      id: crypto.randomUUID(),
      fileName,
      date: new Date().toISOString(),
      totalUnits: results.length,
      totalPending,
      data: results
    };

    const updatedHistory = [newEntry, ...history].slice(0, 5);
    setHistory(updatedHistory);
    localStorage.setItem('sisare_history', JSON.stringify(updatedHistory));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<string[]>) => {
        const rows = results.data;
        const unitCounts: Record<string, number> = {};

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const rawUnit = row[9]?.trim(); 
          const feedbackStatus = row[71]?.trim(); 

          if (rawUnit) {
            const unit = rawUnit.replace(/^\(.*\)\s*/, '');
            if (!unitCounts[unit]) {
              unitCounts[unit] = 0;
            }

            if (feedbackStatus === '' || feedbackStatus === undefined) {
              unitCounts[unit]++;
            }
          }
        }

        const sortedData = Object.entries(unitCounts)
          .map(([unit, count]) => ({ unit, count }))
          .filter(item => item.count > 0)
          .sort((a, b) => b.count - a.count || a.unit.localeCompare(b.unit));

        setData(sortedData);
        saveToHistory(file.name, sortedData);
        setLoading(false);
      },
      error: (error: Error) => {
        console.error("Erro ao ler o CSV:", error);
        setLoading(false);
      }
    });
  };

  const totalPending = useMemo(() => data.reduce((acc, curr) => acc + curr.count, 0), [data]);
  const totalUnits = data.length;

  const viewHistoryItem = (item: UploadHistory) => {
    setData(item.data);
    setFileName(item.fileName);
    setActiveTab('upload');
  };

  const deleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('sisare_history', JSON.stringify(updatedHistory));
    setItemToDelete(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Corporativo */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-md">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">SISARE</h1>
              <p className="text-xs text-primary-foreground/80 font-medium">Sistema de Análise de Feedbacks</p>
            </div>
          </div>
          <nav className="flex gap-2">
            <Button 
              variant={activeTab === 'upload' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setActiveTab('upload')}
              className="text-xs font-bold uppercase tracking-wider"
            >
              <Upload className="w-4 h-4 mr-2" />
              Análise
            </Button>
            <Button 
              variant={activeTab === 'history' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setActiveTab('history')}
              className="text-xs font-bold uppercase tracking-wider"
            >
              <History className="w-4 h-4 mr-2" />
              Histórico
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        
        {activeTab === 'upload' ? (
          <>
            {/* Top Controls & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-md border-none bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2 text-center">
                  <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Upload de Dados</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pb-6">
                  <div className="w-full max-w-[200px]">
                    <Input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      id="csv-upload"
                    />
                    <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-blue-900/20 h-11 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      <label htmlFor="csv-upload" className="cursor-pointer flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider">
                        <Upload className="w-4 h-4" />
                        {loading ? 'Processando...' : 'Carregar CSV'}
                      </label>
                    </Button>
                  </div>
                  {fileName && (
                    <div className="mt-3 px-3 py-1 bg-slate-100 rounded-full flex items-center gap-2 max-w-full">
                      <FileText className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-slate-600 font-bold truncate">{fileName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-md border-none bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2 text-center">
                  <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Unidades Pendentes</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pb-6">
                  <div className="p-3 bg-blue-50 text-primary rounded-2xl mb-2 ring-4 ring-blue-50/50">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-4xl font-black text-slate-800 tracking-tighter">{totalUnits}</div>
                  <div className="text-[10px] font-bold text-blue-600/70 uppercase mt-1">Instituições</div>
                </CardContent>
              </Card>

              <Card className="shadow-md border-none bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2 text-center">
                  <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total Pendências</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pb-6">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl mb-2 ring-4 ring-red-50/50">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="text-4xl font-black text-slate-800 tracking-tighter">{totalPending}</div>
                  <div className="text-[10px] font-bold text-red-600/70 uppercase mt-1">Feedbacks</div>
                </CardContent>
              </Card>
            </div>

            {/* Data Table */}
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-white py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                      Detalhamento por Unidade
                      <span className="bg-blue-50 text-primary text-[10px] uppercase px-2 py-0.5 rounded-full border border-blue-100 tracking-tighter">
                        Ranking
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-slate-500">
                      Unidades ordenadas por maior número de pendências
                    </CardDescription>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-full shadow-inner">
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow className="hover:bg-transparent border-b-2">
                          <TableHead className="w-[70%] h-10 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Unidade</TableHead>
                          <TableHead className="h-10 px-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Pendências</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((item, index) => (
                          <TableRow key={index} className="hover:bg-blue-50/30 transition-colors border-b last:border-0 h-9">
                            <TableCell className="py-2 px-4 text-sm text-slate-700 font-medium leading-tight">
                              {item.unit}
                            </TableCell>
                            <TableCell className="py-2 px-4 text-right">
                              <span className="inline-flex items-center justify-center bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-bold border border-red-200 min-w-[2rem]">
                                {item.count}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-16 text-center flex flex-col items-center justify-center">
                    <div className="bg-slate-50 p-4 rounded-full mb-4">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-slate-600 font-medium text-base">Nenhum dado para exibir</h3>
                    <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                      Faça o upload do arquivo CSV do SISARE para visualizar as unidades com pendência de feedback.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* History View */
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-white py-4 px-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                    Últimos Uploads
                    <span className="bg-slate-100 text-slate-600 text-[10px] uppercase px-2 py-0.5 rounded-full border border-slate-200 tracking-tighter">
                      Top 5
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500">
                    Histórico das 5 análises mais recentes
                  </CardDescription>
                </div>
                <div className="bg-slate-50 p-2 rounded-full shadow-inner">
                  <History className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {history.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="px-4 h-10 text-xs font-bold text-slate-600 uppercase tracking-wider">Data</TableHead>
                        <TableHead className="px-4 h-10 text-xs font-bold text-slate-600 uppercase tracking-wider">Arquivo</TableHead>
                        <TableHead className="px-4 h-10 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Unidades</TableHead>
                        <TableHead className="px-4 h-10 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Total</TableHead>
                        <TableHead className="px-4 h-10 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item) => (
                        <TableRow key={item.id} className="hover:bg-blue-50/30 transition-colors border-b last:border-0 h-12">
                          <TableCell className="py-2 px-4 text-xs text-slate-500 font-bold whitespace-nowrap">
                            {new Date(item.date).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="py-2 px-4 text-sm text-slate-700 font-bold truncate max-w-[200px]">
                            {item.fileName}
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center text-sm text-slate-600 font-medium">
                            {item.totalUnits}
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center">
                            <span className="inline-flex items-center justify-center bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs font-bold border border-red-100">
                              {item.totalPending}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => viewHistoryItem(item)}
                                className="h-8 text-[10px] font-bold uppercase tracking-tighter"
                              >
                                Ver Detalhes
                              </Button>
                              <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 onClick={() => setItemToDelete(item.id)}
                                 className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-16 text-center flex flex-col items-center justify-center">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <History className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-slate-600 font-medium text-base">Nenhum histórico encontrado</h3>
                  <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                    Realize um upload de CSV para começar a registrar o histórico de análises.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </main>

      {/* Modal de Confirmação Moderno */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-none animate-in zoom-in-95 duration-200">
            <CardHeader className="text-center pt-8">
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-800">Confirmar Exclusão</CardTitle>
              <CardDescription className="text-slate-500 mt-2">
                Tem certeza que deseja remover este registro? Esta ação é permanente e não poderá ser desfeita.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 pt-2 pb-8 px-8">
              <Button 
                variant="outline" 
                className="flex-1 h-11 font-bold uppercase text-xs tracking-wider"
                onClick={() => setItemToDelete(null)}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 h-11 font-bold uppercase text-xs tracking-wider bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20"
                onClick={() => deleteHistoryItem(itemToDelete)}
              >
                Excluir Agora
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

