
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CallUploadDialog } from '@/components/calls/CallUploadDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Phone, Clock, Calendar, Play, FileText } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Call = Tables<'calls'> & {
  agent: Tables<'profiles'> | null;
  call_scores: Tables<'call_scores'>[];
};

const statusLabels = {
  pending: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800' },
  transcribing: { label: 'Транскрибируется', color: 'bg-blue-100 text-blue-800' },
  analyzing: { label: 'Анализируется', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Завершен', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Ошибка', color: 'bg-red-100 text-red-800' },
};

export function Calls() {
  const [calls, setCalls] = useState<Call[]>([]);

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select(`
          *,
          agent:profiles(*),
          call_scores(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error('Error fetching calls:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить звонки',
        variant: 'destructive',
      });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Неизвестно';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Звонки</h1>
          <p className="text-gray-600 mt-1">Управление и анализ телефонных звонков</p>
        </div>
        
        <CallUploadDialog onUploadComplete={fetchCalls} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {calls.map((call) => {
          const status = statusLabels[call.status || 'pending'];
          const score = call.call_scores?.[0]?.total_score;
          const agentName = call.agent 
            ? `${call.agent.first_name} ${call.agent.last_name}`
            : (call.metadata as any)?.agent_name || 'Агент не указан';
          
          return (
            <Card key={call.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <Phone className="mr-2 h-5 w-5" />
                      {call.phone_number || 'Неизвестный номер'}
                    </CardTitle>
                    <CardDescription>
                      {agentName}
                    </CardDescription>
                  </div>
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="mr-2 h-4 w-4" />
                    {formatDate(call.call_date)}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="mr-2 h-4 w-4" />
                    {formatDuration(call.duration)}
                  </div>
                  
                  {score && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Оценка качества:</span>
                      <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}>
                        {score}%
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    {call.transcript && (
                      <Button variant="outline" size="sm">
                        <FileText className="mr-1 h-4 w-4" />
                        Транскрипт
                      </Button>
                    )}
                    {call.audio_url && (
                      <Button variant="outline" size="sm">
                        <Play className="mr-1 h-4 w-4" />
                        Аудио
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {calls.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Phone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Звонки не найдены</p>
            <p className="text-sm text-gray-400 mt-1">
              Загрузите первый звонок для начала анализа
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
