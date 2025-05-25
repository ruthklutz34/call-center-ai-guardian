
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Plus,
  Settings
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceKey: string;
  connected: boolean;
}

interface TableSchema {
  name: string;
  columns: string;
}

export function DatabaseConnector() {
  const [config, setConfig] = useState<DatabaseConfig>({
    url: '',
    anonKey: '',
    serviceKey: '',
    connected: false
  });
  const [loading, setLoading] = useState(false);
  const [tableSchema, setTableSchema] = useState<TableSchema>({
    name: '',
    columns: ''
  });
  const [creatingTable, setCreatingTable] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  const testConnection = async () => {
    if (!config.url || !config.anonKey) {
      toast({
        title: 'Ошибка',
        description: 'Введите URL и Anon Key',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Testing Supabase connection...');
      
      const client = createClient(config.url, config.anonKey);
      
      // Тестируем подключение
      const { data, error } = await client
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Connection error:', error);
        throw new Error(error.message);
      }

      console.log('Connection successful:', data);
      setSupabaseClient(client);
      setConfig(prev => ({ ...prev, connected: true }));
      
      toast({
        title: 'Успешно',
        description: 'Подключение к Supabase установлено',
      });
    } catch (error: any) {
      console.error('Connection failed:', error);
      setConfig(prev => ({ ...prev, connected: false }));
      toast({
        title: 'Ошибка подключения',
        description: error.message || 'Не удалось подключиться к базе данных',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!tableSchema.name || !tableSchema.columns) {
      toast({
        title: 'Ошибка',
        description: 'Введите название таблицы и колонки',
        variant: 'destructive',
      });
      return;
    }

    if (!supabaseClient) {
      toast({
        title: 'Ошибка',
        description: 'Сначала подключитесь к базе данных',
        variant: 'destructive',
      });
      return;
    }

    setCreatingTable(true);
    try {
      console.log('Creating table:', tableSchema);
      
      // Формируем SQL запрос для создания таблицы
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${tableSchema.name} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ${tableSchema.columns}
        );
      `;

      // Выполняем SQL через rpc функцию (если есть права)
      const { data, error } = await supabaseClient.rpc('execute_sql', {
        sql_query: createTableSQL
      });

      if (error) {
        console.error('Table creation error:', error);
        throw new Error(error.message);
      }

      console.log('Table created successfully:', data);
      
      toast({
        title: 'Успешно',
        description: `Таблица ${tableSchema.name} создана`,
      });
      
      setTableSchema({ name: '', columns: '' });
    } catch (error: any) {
      console.error('Table creation failed:', error);
      toast({
        title: 'Ошибка создания таблицы',
        description: error.message || 'Не удалось создать таблицу. Проверьте права доступа.',
        variant: 'destructive',
      });
    } finally {
      setCreatingTable(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Подключение к Supabase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Подключение к Supabase
          </CardTitle>
          <CardDescription>
            Настройка подключения к базе данных Supabase через API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabaseUrl">URL проекта Supabase</Label>
            <Input
              id="supabaseUrl"
              value={config.url}
              onChange={(e) => setConfig({...config, url: e.target.value})}
              placeholder="https://your-project.supabase.co"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="anonKey">Anon Key</Label>
            <Input
              id="anonKey"
              type="password"
              value={config.anonKey}
              onChange={(e) => setConfig({...config, anonKey: e.target.value})}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="serviceKey">Service Role Key (опционально)</Label>
            <Input
              id="serviceKey"
              type="password"
              value={config.serviceKey}
              onChange={(e) => setConfig({...config, serviceKey: e.target.value})}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Статус подключения</p>
              <p className="text-sm text-gray-600">Supabase Database</p>
            </div>
            <div className="flex items-center">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              ) : config.connected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <Badge variant={config.connected ? "default" : "secondary"} className="ml-2">
                {loading ? 'Проверка...' : config.connected ? 'Подключено' : 'Не подключено'}
              </Badge>
            </div>
          </div>
          
          <Button
            onClick={testConnection}
            disabled={loading || !config.url || !config.anonKey}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Тестировать подключение
          </Button>
        </CardContent>
      </Card>

      {/* Создание таблиц */}
      {config.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Создание таблиц
            </CardTitle>
            <CardDescription>
              Создание новых таблиц в базе данных
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tableName">Название таблицы</Label>
              <Input
                id="tableName"
                value={tableSchema.name}
                onChange={(e) => setTableSchema({...tableSchema, name: e.target.value})}
                placeholder="users, products, orders..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tableColumns">Колонки таблицы</Label>
              <Textarea
                id="tableColumns"
                value={tableSchema.columns}
                onChange={(e) => setTableSchema({...tableSchema, columns: e.target.value})}
                placeholder={`name TEXT NOT NULL,
email TEXT UNIQUE,
age INTEGER,
is_active BOOLEAN DEFAULT true`}
                rows={6}
              />
              <p className="text-sm text-gray-500">
                Введите колонки в формате SQL. Каждая колонка с новой строки.
                id и created_at добавляются автоматически.
              </p>
            </div>
            
            <Button
              onClick={createTable}
              disabled={creatingTable || !tableSchema.name || !tableSchema.columns}
              className="w-full"
            >
              {creatingTable && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Создать таблицу
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Node.js проект подключение */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Подключение через Node.js проект
          </CardTitle>
          <CardDescription>
            Инструкции по подключению к Supabase через Node.js приложение
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Установка зависимостей</h3>
            <code className="block bg-blue-100 p-2 rounded text-sm">
              npm install @supabase/supabase-js
            </code>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">Пример подключения</h3>
            <pre className="bg-green-100 p-2 rounded text-sm overflow-x-auto">
{`import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${config.url || 'YOUR_SUPABASE_URL'}'
const supabaseKey = '${config.anonKey || 'YOUR_SUPABASE_ANON_KEY'}'

const supabase = createClient(supabaseUrl, supabaseKey)

// Пример использования
const { data, error } = await supabase
  .from('your_table')
  .select('*')`}
            </pre>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Переменные окружения</h3>
            <pre className="bg-yellow-100 p-2 rounded text-sm">
{`SUPABASE_URL=${config.url || 'your_project_url'}
SUPABASE_ANON_KEY=${config.anonKey || 'your_anon_key'}
SUPABASE_SERVICE_KEY=${config.serviceKey || 'your_service_key'}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
