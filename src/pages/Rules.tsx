
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type EvaluationRule = Tables<'evaluation_rules'>;

const ruleTypeLabels = {
  script_compliance: 'Соблюдение скрипта',
  communication_quality: 'Качество коммуникации',
  information_accuracy: 'Корректность информации',
  business_procedures: 'Бизнес-процедуры',
  emotional_analysis: 'Эмоциональный анализ',
};

export function Rules() {
  const [rules, setRules] = useState<EvaluationRule[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EvaluationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'script_compliance' as keyof typeof ruleTypeLabels,
    weight: 1,
    is_critical: false,
    criteria: '',
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить правила',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const ruleData = {
        ...formData,
        criteria: { description: formData.criteria },
        company_id: '00000000-0000-0000-0000-000000000000', // Временно, пока не реализована система компаний
      };

      if (editingRule) {
        const { error } = await supabase
          .from('evaluation_rules')
          .update(ruleData)
          .eq('id', editingRule.id);
        
        if (error) throw error;
        
        toast({
          title: 'Успешно',
          description: 'Правило обновлено',
        });
      } else {
        const { error } = await supabase
          .from('evaluation_rules')
          .insert([ruleData]);
        
        if (error) throw error;
        
        toast({
          title: 'Успешно',
          description: 'Правило создано',
        });
      }

      setIsDialogOpen(false);
      setEditingRule(null);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить правило',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (rule: EvaluationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      rule_type: rule.rule_type,
      weight: rule.weight,
      is_critical: rule.is_critical || false,
      criteria: (rule.criteria as any)?.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это правило?')) return;

    try {
      const { error } = await supabase
        .from('evaluation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Правило удалено',
      });
      
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить правило',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'script_compliance',
      weight: 1,
      is_critical: false,
      criteria: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Правила оценки</h1>
          <p className="text-gray-600 mt-1">Настройка критериев для анализа звонков</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить правило
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Редактировать правило' : 'Новое правило'}
              </DialogTitle>
              <DialogDescription>
                Создайте или отредактируйте правило для оценки качества звонков
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название правила</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rule_type">Тип правила</Label>
                  <Select
                    value={formData.rule_type}
                    onValueChange={(value) => setFormData({ ...formData, rule_type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ruleTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="criteria">Критерии оценки</Label>
                <Textarea
                  id="criteria"
                  value={formData.criteria}
                  onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                  placeholder="Опишите, как ИИ должен оценивать данный критерий..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Вес (1-10)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="is_critical"
                    checked={formData.is_critical}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_critical: checked })}
                  />
                  <Label htmlFor="is_critical">Критическое правило</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingRule ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {ruleTypeLabels[rule.rule_type]}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Badge variant="secondary">Вес: {rule.weight}</Badge>
                  {rule.is_critical && (
                    <Badge variant="destructive">Критическое</Badge>
                  )}
                </div>
                <Badge variant={rule.is_active ? "default" : "secondary"}>
                  {rule.is_active ? 'Активно' : 'Неактивно'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Правила не созданы</p>
            <p className="text-sm text-gray-400 mt-1">
              Создайте первое правило для начала работы с системой оценки
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
