import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DatabaseConnector } from '@/components/setup/DatabaseConnector';
import { 
  Database, 
  User, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Brain,
  Building,
  Server
} from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

interface AdminData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

interface AIConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  endpoint: string;
}

export function Setup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [adminData, setAdminData] = useState<AdminData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: ''
  });
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4',
    endpoint: 'https://api.openai.com/v1'
  });

  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'database',
      title: 'Подключение к базе данных',
      description: 'Проверка соединения с Supabase',
      completed: false,
      required: true
    },
    {
      id: 'database-management',
      title: 'Управление базой данных',
      description: 'Настройка подключения и создание таблиц',
      completed: false,
      required: false
    },
    {
      id: 'admin',
      title: 'Создание администратора',
      description: 'Настройка учетной записи администратора',
      completed: false,
      required: true
    },
    {
      id: 'ai',
      title: 'Настройка ИИ',
      description: 'Подключение к сервисам анализа звонков',
      completed: false,
      required: true
    },
    {
      id: 'company',
      title: 'Настройка компании',
      description: 'Основные параметры организации',
      completed: false,
      required: false
    }
  ]);

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      console.log('Testing database connection...');
      const { data, error } = await supabase
        .from('companies')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database connection error:', error);
        throw error;
      }

      console.log('Database connection successful:', data);
      setDbConnected(true);
      updateStepStatus('database', true);
      toast({
        title: 'Успешно',
        description: 'Соединение с базой данных установлено',
      });
    } catch (error) {
      console.error('Database test failed:', error);
      setDbConnected(false);
      toast({
        title: 'Ошибка подключения',
        description: 'Не удалось подключиться к базе данных',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStepStatus = (stepId: string, completed: boolean) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed } : step
    ));
  };

  const createAdmin = async () => {
    if (!adminData.email || !adminData.password || !adminData.firstName || !adminData.lastName) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating admin user...');
      
      // Создаем пользователя через Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password,
        options: {
          data: {
            first_name: adminData.firstName,
            last_name: adminData.lastName,
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      console.log('Admin user created:', authData);

      // Создаем компанию
      let companyId = 'a0000000-0000-0000-0000-000000000001';
      if (adminData.companyName) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: adminData.companyName,
            description: 'Основная компания администратора'
          })
          .select()
          .single();

        if (companyError) {
          console.error('Company creation error:', companyError);
        } else {
          companyId = companyData.id;
          console.log('Company created:', companyData);
        }
      }

      // Обновляем профиль пользователя
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            company_id: companyId,
            role: 'platform_admin',
            first_name: adminData.firstName,
            last_name: adminData.lastName,
            email: adminData.email,
            is_active: true
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        } else {
          console.log('Profile updated successfully');
        }
      }

      updateStepStatus('admin', true);
      toast({
        title: 'Успешно',
        description: 'Администратор создан успешно',
      });
      
      setCurrentStep(3); // Переход к настройке ИИ
    } catch (error: any) {
      console.error('Admin creation failed:', error);
      toast({
        title: 'Ошибка создания администратора',
        description: error.message || 'Неизвестная ошибка',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAIConfig = async () => {
    if (!aiConfig.apiKey) {
      toast({
        title: 'Ошибка',
        description: 'Введите API ключ',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Saving AI configuration...');
      
      // Проверяем API ключ
      const testResponse = await fetch(`${aiConfig.endpoint}/models`, {
        headers: {
          'Authorization': `Bearer ${aiConfig.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!testResponse.ok) {
        throw new Error('Неверный API ключ или endpoint');
      }

      // Сохраняем конфигурацию в базе данных
      const { error } = await supabase
        .from('companies')
        .update({
          settings: {
            ai_provider: aiConfig.provider,
            ai_model: aiConfig.model,
            ai_endpoint: aiConfig.endpoint,
            ai_configured: true
          }
        })
        .eq('id', 'a0000000-0000-0000-0000-000000000001');

      if (error) {
        console.error('AI config save error:', error);
        throw error;
      }

      console.log('AI configuration saved successfully');
      updateStepStatus('ai', true);
      toast({
        title: 'Успешно',
        description: 'Настройки ИИ сохранены',
      });
      
      setCurrentStep(4); // Переход к настройке компании
    } catch (error: any) {
      console.error('AI config save failed:', error);
      toast({
        title: 'Ошибка настройки ИИ',
        description: error.message || 'Не удалось подключиться к API',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = async () => {
    setLoading(true);
    try {
      console.log('Completing setup...');
      
      updateStepStatus('company', true);
      
      // Отмечаем, что настройка завершена
      const { error } = await supabase
        .from('companies')
        .update({
          settings: {
            setup_completed: true,
            setup_date: new Date().toISOString()
          }
        })
        .eq('id', 'a0000000-0000-0000-0000-000000000001');

      if (error) {
        console.error('Setup completion error:', error);
      }

      console.log('Setup completed successfully');
      toast({
        title: 'Настройка завершена!',
        description: 'Система готова к использованию',
      });

      // Перенаправляем на главную страницу
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error) {
      console.error('Setup completion failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Database Connection
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Подключение к базе данных
              </CardTitle>
              <CardDescription>
                Проверка соединения с Supabase и настройка базы данных
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Статус подключения</p>
                  <p className="text-sm text-gray-600">Supabase Database</p>
                </div>
                <div className="flex items-center">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  ) : dbConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="ml-2">
                    {loading ? 'Проверка...' : dbConnected ? 'Подключено' : 'Ошибка'}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={testDatabaseConnection}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Повторить тест
                </Button>
                <Button
                  onClick={() => setCurrentStep(1)}
                  disabled={!dbConnected}
                >
                  Далее
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 1: // Database Management
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="mr-2 h-5 w-5" />
                Управление базой данных
              </CardTitle>
              <CardDescription>
                Настройка подключения к Supabase и создание таблиц
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DatabaseConnector />
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(0)}>
                  Назад
                </Button>
                <Button onClick={() => {
                  updateStepStatus('database-management', true);
                  setCurrentStep(2);
                }}>
                  Далее
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 2: // Admin Creation
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Создание администратора
              </CardTitle>
              <CardDescription>
                Создание учетной записи главного администратора системы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя *</Label>
                  <Input
                    id="firstName"
                    value={adminData.firstName}
                    onChange={(e) => setAdminData({...adminData, firstName: e.target.value})}
                    placeholder="Введите имя"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия *</Label>
                  <Input
                    id="lastName"
                    value={adminData.lastName}
                    onChange={(e) => setAdminData({...adminData, lastName: e.target.value})}
                    placeholder="Введите фамилию"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                  placeholder="admin@company.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Пароль *</Label>
                <Input
                  id="password"
                  type="password"
                  value={adminData.password}
                  onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                  placeholder="Минимум 6 символов"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">Название компании</Label>
                <Input
                  id="companyName"
                  value={adminData.companyName}
                  onChange={(e) => setAdminData({...adminData, companyName: e.target.value})}
                  placeholder="ООО Название компании"
                />
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Назад
                </Button>
                <Button onClick={createAdmin} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Создать администратора
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3: // AI Configuration
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5" />
                Настройка ИИ для анализа звонков
              </CardTitle>
              <CardDescription>
                Подключение к сервисам искусственного интеллекта для анализа и оценки звонков
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Провайдер ИИ</Label>
                <select
                  id="provider"
                  value={aiConfig.provider}
                  onChange={(e) => setAiConfig({...aiConfig, provider: e.target.value as 'openai' | 'anthropic'})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="openai">OpenAI (GPT-4)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Ключ *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={aiConfig.apiKey}
                  onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
                  placeholder={aiConfig.provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Модель</Label>
                <Input
                  id="model"
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
                  placeholder="gpt-4"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endpoint">API Endpoint</Label>
                <Input
                  id="endpoint"
                  value={aiConfig.endpoint}
                  onChange={(e) => setAiConfig({...aiConfig, endpoint: e.target.value})}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Назад
                </Button>
                <Button onClick={saveAIConfig} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Сохранить настройки
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4: // Company Settings
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Завершение настройки
              </CardTitle>
              <CardDescription>
                Финальная настройка системы и проверка готовности
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{step.title}</p>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                    <div className="flex items-center">
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <Badge variant={step.completed ? "default" : "secondary"} className="ml-2">
                        {step.completed ? 'Готово' : 'Ожидание'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">Система готова!</h3>
                <p className="text-sm text-green-700">
                  Все необходимые компоненты настроены. Теперь вы можете начать использовать систему анализа звонков.
                </p>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Назад
                </Button>
                <Button onClick={completeSetup} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Завершить настройку
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Мастер настройки системы
          </h1>
          <p className="text-gray-600">
            Добро пожаловать в AI Quality Manager. Давайте настроим систему для работы.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                  ${step.completed ? 'bg-green-600' : ''}
                `}>
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    h-1 w-16 mx-2
                    ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.id} className="text-xs text-center max-w-20">
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </div>
  );
}
