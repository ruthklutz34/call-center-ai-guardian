
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Phone, Users, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalCalls: 0,
    averageScore: 0,
    activeAgents: 0,
    criticalFails: 0,
  });

  const [chartData, setChartData] = useState([
    { date: '01.01', score: 85 },
    { date: '02.01', score: 87 },
    { date: '03.01', score: 82 },
    { date: '04.01', score: 90 },
    { date: '05.01', score: 88 },
    { date: '06.01', score: 92 },
    { date: '07.01', score: 89 },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Получаем общее количество звонков
        const { count: callsCount, error: callsError } = await supabase
          .from('calls')
          .select('*', { count: 'exact', head: true });

        if (callsError) {
          console.error('Error fetching calls count:', callsError);
        }

        // Получаем средний балл
        const { data: scores, error: scoresError } = await supabase
          .from('call_scores')
          .select('total_score');

        if (scoresError) {
          console.error('Error fetching scores:', scoresError);
        }

        const averageScore = scores && scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + (s.total_score || 0), 0) / scores.length)
          : 0;

        // Получаем количество активных агентов
        const { count: agentsCount, error: agentsError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'agent')
          .eq('is_active', true);

        if (agentsError) {
          console.error('Error fetching agents count:', agentsError);
        }

        // Получаем количество критических ошибок
        const { data: criticalData, error: criticalError } = await supabase
          .from('call_scores')
          .select('critical_fails');

        if (criticalError) {
          console.error('Error fetching critical fails:', criticalError);
        }

        const totalCriticalFails = criticalData?.reduce((sum, c) => sum + (c.critical_fails || 0), 0) || 0;

        setStats({
          totalCalls: callsCount || 0,
          averageScore,
          activeAgents: agentsCount || 0,
          criticalFails: totalCriticalFails,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Всего звонков',
      value: stats.totalCalls,
      icon: Phone,
      description: 'За последний месяц',
      color: 'text-blue-600',
    },
    {
      title: 'Средний балл',
      value: `${stats.averageScore}%`,
      icon: BarChart3,
      description: 'Качество обслуживания',
      color: 'text-green-600',
    },
    {
      title: 'Активные агенты',
      value: stats.activeAgents,
      icon: Users,
      description: 'Сотрудники онлайн',
      color: 'text-purple-600',
    },
    {
      title: 'Критические ошибки',
      value: stats.criticalFails,
      icon: TrendingUp,
      description: 'Требуют внимания',
      color: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-gray-600 mt-1">Обзор работы колл-центра</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Динамика качества</CardTitle>
          <CardDescription>
            Средний балл качества обслуживания за последние 7 дней
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Качество']}
                  labelStyle={{ color: '#374151' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
