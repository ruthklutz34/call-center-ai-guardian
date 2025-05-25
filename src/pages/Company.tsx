
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Save, Settings, Brain, Building } from 'lucide-react';

export function Company() {
  const [companyData, setCompanyData] = useState({
    name: '',
    description: '',
  });

  const [aiSettings, setAiSettings] = useState({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 1000,
    system_prompt: '',
    evaluation_enabled: true,
    auto_scoring: true,
    confidence_threshold: 0.8,
  });

  const [generalSettings, setGeneralSettings] = useState({
    timezone: 'Europe/Moscow',
    language: 'ru',
    currency: 'RUB',
    business_hours_start: '09:00',
    business_hours_end: '18:00',
    notifications_enabled: true,
    email_reports: true,
  });

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', 'b0000000-0000-0000-0000-000000000001')
        .single();

      if (error) throw error;

      if (data) {
        setCompanyData({
          name: data.name,
          description: data.description || '',
        });

        // Загружаем настройки из JSON поля
        const settings = data.settings as any || {};
        
        if (settings.ai) {
          setAiSettings({ ...aiSettings, ...settings.ai });
        }
        
        if (settings.general) {
          setGeneralSettings({ ...generalSettings, ...settings.general });
        }
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные компании',
        variant: 'destructive',
      });
    }
  };

  const saveCompanyData = async () => {
    try {
      const settings = {
        ai: aiSettings,
        general: generalSettings,
      };

      const { error } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          description: companyData.description,
          settings,
        })
        .eq('id', 'b0000000-0000-0000-0000-000000000001');

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Настройки компании сохранены',
      });
    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Настройки компании</h1>
          <p className="text-gray-600 mt-1">Управление настройками организации и ИИ</p>
        </div>
        
        <Button onClick={saveCompanyData}>
          <Save className="mr-2 h-4 w-4" />
          Сохранить настройки
        </Button>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company">
            <Building className="mr-2 h-4 w-4" />
            Компания
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Brain className="mr-2 h-4 w-4" />
            Настройки ИИ
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            Общие
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Информация о компании</CardTitle>
              <CardDescription>
                Основные данные вашей организации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Название компании</Label>
                <Input
                  id="company_name"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_description">Описание</Label>
                <Textarea
                  id="company_description"
                  value={companyData.description}
                  onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Модель ИИ</CardTitle>
                <CardDescription>
                  Настройки нейросети для анализа звонков
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai_model">Модель</Label>
                    <Select
                      value={aiSettings.model}
                      onValueChange={(value) => setAiSettings({ ...aiSettings, model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Быстрая)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (Мощная)</SelectItem>
                        <SelectItem value="gpt-4.5-preview">GPT-4.5 Preview (Экспериментальная)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Температура ({aiSettings.temperature})</Label>
                    <Input
                      id="temperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={aiSettings.temperature}
                      onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_tokens">Максимум токенов</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    value={aiSettings.max_tokens}
                    onChange={(e) => setAiSettings({ ...aiSettings, max_tokens: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="system_prompt">Системный промпт</Label>
                  <Textarea
                    id="system_prompt"
                    value={aiSettings.system_prompt}
                    onChange={(e) => setAiSettings({ ...aiSettings, system_prompt: e.target.value })}
                    placeholder="Ты - ИИ ассистент для анализа качества звонков в колл-центре. Оценивай разговоры согласно установленным правилам..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Настройки оценки</CardTitle>
                <CardDescription>
                  Параметры автоматического анализа
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Автоматическая оценка</Label>
                    <p className="text-sm text-gray-500">Включить автоматический анализ звонков</p>
                  </div>
                  <Switch
                    checked={aiSettings.evaluation_enabled}
                    onCheckedChange={(checked) => setAiSettings({ ...aiSettings, evaluation_enabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Автоматическое выставление оценок</Label>
                    <p className="text-sm text-gray-500">ИИ будет автоматически выставлять баллы</p>
                  </div>
                  <Switch
                    checked={aiSettings.auto_scoring}
                    onCheckedChange={(checked) => setAiSettings({ ...aiSettings, auto_scoring: checked })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confidence_threshold">Порог уверенности ({aiSettings.confidence_threshold})</Label>
                  <Input
                    id="confidence_threshold"
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={aiSettings.confidence_threshold}
                    onChange={(e) => setAiSettings({ ...aiSettings, confidence_threshold: parseFloat(e.target.value) })}
                  />
                  <p className="text-sm text-gray-500">
                    Минимальная уверенность ИИ для автоматической оценки
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Общие настройки</CardTitle>
              <CardDescription>
                Основные параметры работы системы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Часовой пояс</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Moscow">Москва (UTC+3)</SelectItem>
                      <SelectItem value="Europe/London">Лондон (UTC+0)</SelectItem>
                      <SelectItem value="America/New_York">Нью-Йорк (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Язык</Label>
                  <Select
                    value={generalSettings.language}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_start">Начало рабочего дня</Label>
                  <Input
                    id="business_start"
                    type="time"
                    value={generalSettings.business_hours_start}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, business_hours_start: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_end">Конец рабочего дня</Label>
                  <Input
                    id="business_end"
                    type="time"
                    value={generalSettings.business_hours_end}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, business_hours_end: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Уведомления</Label>
                    <p className="text-sm text-gray-500">Получать уведомления в системе</p>
                  </div>
                  <Switch
                    checked={generalSettings.notifications_enabled}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, notifications_enabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email отчеты</Label>
                    <p className="text-sm text-gray-500">Получать еженедельные отчеты по email</p>
                  </div>
                  <Switch
                    checked={generalSettings.email_reports}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, email_reports: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
