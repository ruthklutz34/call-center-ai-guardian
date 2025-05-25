
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, Link, FileAudio, Plus } from 'lucide-react';

interface CallUploadDialogProps {
  onUploadComplete: () => void;
}

export function CallUploadDialog({ onUploadComplete }: CallUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Форма для ручного ввода
  const [manualForm, setManualForm] = useState({
    agent_name: '',
    phone_number: '',
    duration: '',
    transcript: '',
  });

  // Форма для ссылок
  const [urlForm, setUrlForm] = useState({
    urls: '',
    agent_name: '',
  });

  // Форма для файлов
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileAgent, setFileAgent] = useState('');

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      const callData = {
        agent_id: null,
        phone_number: manualForm.phone_number,
        duration: manualForm.duration ? parseInt(manualForm.duration) : null,
        transcript: manualForm.transcript,
        status: 'completed' as const,
        company_id: 'b0000000-0000-0000-0000-000000000001',
        metadata: { agent_name: manualForm.agent_name },
      };

      const { error } = await supabase
        .from('calls')
        .insert([callData]);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Звонок загружен',
      });

      resetForms();
      setIsOpen(false);
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading call:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить звонок',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      const urls = urlForm.urls.split('\n').filter(url => url.trim());
      const calls = urls.map(url => ({
        agent_id: null,
        phone_number: null,
        audio_url: url.trim(),
        status: 'pending' as const,
        company_id: 'b0000000-0000-0000-0000-000000000001',
        metadata: { 
          agent_name: urlForm.agent_name,
          source: 'url_upload'
        },
      }));

      const { error } = await supabase
        .from('calls')
        .insert(calls);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: `Загружено ${urls.length} звонков по ссылкам`,
      });

      resetForms();
      setIsOpen(false);
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading calls from URLs:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить звонки по ссылкам',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите файлы для загрузки',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Загружаем файл в Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('call-recordings')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Получаем публичный URL
        const { data: { publicUrl } } = supabase.storage
          .from('call-recordings')
          .getPublicUrl(fileName);

        // Создаем запись о звонке
        return {
          agent_id: null,
          phone_number: null,
          audio_url: publicUrl,
          status: 'pending' as const,
          company_id: 'b0000000-0000-0000-0000-000000000001',
          metadata: { 
            agent_name: fileAgent,
            source: 'file_upload',
            original_filename: file.name
          },
        };
      });

      const callsData = await Promise.all(uploadPromises);
      
      const { error } = await supabase
        .from('calls')
        .insert(callsData);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: `Загружено ${files.length} аудиофайлов`,
      });

      resetForms();
      setIsOpen(false);
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить файлы',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForms = () => {
    setManualForm({
      agent_name: '',
      phone_number: '',
      duration: '',
      transcript: '',
    });
    setUrlForm({
      urls: '',
      agent_name: '',
    });
    setFiles(null);
    setFileAgent('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={resetForms}>
          <Plus className="mr-2 h-4 w-4" />
          Загрузить звонки
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Загрузка звонков</DialogTitle>
          <DialogDescription>
            Выберите способ загрузки звонков в систему
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">
              <Upload className="mr-2 h-4 w-4" />
              Ручной ввод
            </TabsTrigger>
            <TabsTrigger value="urls">
              <Link className="mr-2 h-4 w-4" />
              По ссылкам
            </TabsTrigger>
            <TabsTrigger value="files">
              <FileAudio className="mr-2 h-4 w-4" />
              Файлы
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent_name">Имя агента</Label>
                  <Input
                    id="agent_name"
                    value={manualForm.agent_name}
                    onChange={(e) => setManualForm({ ...manualForm, agent_name: e.target.value })}
                    placeholder="Иван Петров"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Номер телефона</Label>
                  <Input
                    id="phone_number"
                    value={manualForm.phone_number}
                    onChange={(e) => setManualForm({ ...manualForm, phone_number: e.target.value })}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Длительность (секунды)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={manualForm.duration}
                  onChange={(e) => setManualForm({ ...manualForm, duration: e.target.value })}
                  placeholder="180"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transcript">Транскрипт разговора</Label>
                <Textarea
                  id="transcript"
                  value={manualForm.transcript}
                  onChange={(e) => setManualForm({ ...manualForm, transcript: e.target.value })}
                  placeholder="Введите текст разговора..."
                  rows={8}
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Загрузка...' : 'Загрузить'}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="urls">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent_name_url">Имя агента (опционально)</Label>
                <Input
                  id="agent_name_url"
                  value={urlForm.agent_name}
                  onChange={(e) => setUrlForm({ ...urlForm, agent_name: e.target.value })}
                  placeholder="Иван Петров"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="urls">Ссылки на аудиофайлы</Label>
                <Textarea
                  id="urls"
                  value={urlForm.urls}
                  onChange={(e) => setUrlForm({ ...urlForm, urls: e.target.value })}
                  placeholder="https://example.com/call1.mp3&#10;https://example.com/call2.wav&#10;https://example.com/call3.m4a"
                  rows={8}
                  required
                />
                <p className="text-sm text-gray-500">
                  Введите по одной ссылке в строке. Поддерживаются форматы: MP3, WAV, M4A
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Загрузка...' : 'Загрузить'}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="files">
            <form onSubmit={handleFileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file_agent">Имя агента (опционально)</Label>
                <Input
                  id="file_agent"
                  value={fileAgent}
                  onChange={(e) => setFileAgent(e.target.value)}
                  placeholder="Иван Петров"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="audio_files">Аудиофайлы</Label>
                <Input
                  id="audio_files"
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={(e) => setFiles(e.target.files)}
                  required
                />
                <p className="text-sm text-gray-500">
                  Выберите один или несколько аудиофайлов. Поддерживаются форматы: MP3, WAV, M4A, OGG
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isUploading || !files}>
                  {isUploading ? 'Загрузка...' : 'Загрузить'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
