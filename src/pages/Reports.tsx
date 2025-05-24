
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, FileText } from 'lucide-react';

export function Reports() {
  const [reportData, setReportData] = useState({
    agentPerformance: [],
    ruleBreakdown: [],
    timelineData: [],
    summary: {
      totalCalls: 0,
      averageScore: 0,
      improvementRate: 0,
      criticalIssues: 0,
    },
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedAgent, setSelectedAgent] = useState('all');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod, selectedAgent]);

  const fetchReportData = async () => {
    try {
      // Получаем базовую статистику
      const { data: callsData } = await supabase
        .from('calls')
        .select(`
          *,
          call_scores(total_score, critical_fails),
          agent:profiles(first_name, last_name)
        `);

      const { data: rulesData } = await supabase
        .from('evaluation_rules')
        .select('name, rule_type');

      // Обрабатываем данные для графиков
      const agentStats = {};
      let totalScore = 0;
      let totalCalls = 0;
      let totalCriticalFails = 0;

      callsData?.forEach(call => {
        if (call.call_scores?.length > 0) {
          const score = call.call_scores[0];
          totalScore += score.total_score;
          totalCalls++;
          totalCriticalFails += score.critical_fails || 0;

          const agentName = call.agent 
            ? `${call.agent.first_name} ${call.agent.last_name}`
            : 'Неизвестный агент';

          if (!agentStats[agentName]) {
            agentStats[agentName] = {
              name: agentName,
              totalScore: 0,
              callCount: 0,
              criticalFails: 0,
            };
          }

          agentStats[agentName].totalScore += score.total_score;
          agentStats[agentName].callCount++;
          agentStats[agentName].criticalFails += score.critical_fails || 0;
        }
      });

      const agentPerformance = Object.values(agentStats).map((agent: any) => ({
        ...agent,
        averageScore: Math.round(agent.totalScore / agent.callCount),
      }));

      // Данные для pie chart правил
      const ruleBreakdown = rulesData?.map(rule => ({
        name: rule.name,
        value: Math.floor(Math.random() * 100) + 50, // Временные данные
        type: rule.rule_type,
      })) || [];

      // Временные данные для timeline
      const timelineData = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        score: Math.floor(Math.random() * 30) + 70,
        calls: Math.floor(Math.random() * 20) + 10,
      }));

      setReportData({
        agentPerformance,
        ruleBreakdown,
        timelineData,
        summary: {
          totalCalls,
          averageScore: totalCalls > 0 ? Math.round(totalScore / totalCalls) : 0,
          improvementRate: 12, // Временное значение
          criticalIssues: totalCriticalFails,
        },
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Отчеты и аналитика</h1>
          <p className="text-gray-600 mt-1">Анализ эффективности работы колл-центра</p>
        </div>
        
        <div className="flex space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Последние 7 дней</SelectItem>
              <SelectItem value="30d">Последние 30 дней</SelectItem>
              <SelectItem value="90d">Последние 3 месяца</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Экспорт отчета
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего звонков</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary.totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% от прошлого периода
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя оценка</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              +2.5% от прошлого периода
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Улучшение качества</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{reportData.summary.improvementRate}%</div>
            <p className="text-xs text-muted-foreground">
              За выбранный период
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Критические ошибки</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary.criticalIssues}</div>
            <p className="text-xs text-muted-foreground">
              -15% от прошлого периода
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Производительность агентов</CardTitle>
            <CardDescription>Средние оценки по сотрудникам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.agentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="averageScore" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rule Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение по правилам</CardTitle>
            <CardDescription>Соблюдение различных критериев</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.ruleBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.ruleBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Динамика качества</CardTitle>
          <CardDescription>Изменение среднего балла во времени</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Основные проблемы</CardTitle>
          <CardDescription>Наиболее частые нарушения</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { issue: 'Отсутствие приветствия', count: 15, severity: 'high' },
              { issue: 'Неточная информация о продукте', count: 12, severity: 'medium' },
              { issue: 'Прерывание клиента', count: 8, severity: 'low' },
              { issue: 'Отсутствие заключительной фразы', count: 6, severity: 'medium' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.issue}</p>
                  <p className="text-sm text-gray-600">{item.count} случаев</p>
                </div>
                <Badge variant={
                  item.severity === 'high' ? 'destructive' : 
                  item.severity === 'medium' ? 'default' : 'secondary'
                }>
                  {item.severity === 'high' ? 'Высокая' : 
                   item.severity === 'medium' ? 'Средняя' : 'Низкая'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
