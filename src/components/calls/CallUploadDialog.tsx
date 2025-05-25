
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, Link as LinkIcon, Loader2, X } from 'lucide-react';

interface CallUploadDialogProps {
  onUploadComplete: () => void;
}

interface CallUrl {
  id: string;
  url: string;
  phoneNumber: string;
  agentName: string;
}

export function CallUploadDialog({ onUploadComplete }: CallUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urlList, setUrlList] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [callUrls, setCallUrls] = useState<CallUrl[]>([]);

  const addUrlToList = () => {
    const urls = urlList.split('\n').filter(url => url.trim());
    const newCallUrls: CallUrl[] = urls.map(url => ({
      id: Math.random().toString(36).substr(2, 9),
      url: url.trim(),
      phoneNumber: '',
      agentName: ''
    }));
    setCallUrls(prev => [...prev, ...newCallUrls]);
    setUrlList('');
  };

  const removeUrl = (id: string) => {
    setCallUrls(prev => prev.filter(call => call.id !== id));
  };

  const updateCallUrl = (id: string, field: 'phoneNumber' | 'agentName', value: string) => {
    setCallUrls(prev => prev.map(call => 
      call.id === id ? { ...call, [field]: value } : call
    ));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const audioFiles = files.filter(file => 
        file.type.startsWith('audio/') || 
        file.name.toLowerCase().endsWith('.mp3') ||
        file.name.toLowerCase().endsWith('.wav') ||
        file.name.toLowerCase().endsWith('.m4a')
      );
      
      if (audioFiles.length !== files.length) {
        toast({
          title: 'Предупреждение',
          description: 'Некоторые файлы не являются аудиофайлами и были исключены',
        });
      }
      
      setSelectedFiles(prev => [...prev, ...audioFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFromUrls = async () => {
    if (callUrls.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Добавьте хотя бы одну ссылку',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      for (const callData of callUrls) {
        console.log('Uploading call from URL:', callData.url);
        
        // Создаем запись звонка
        const { data: call, error: callError } = await supabase
          .from('calls')
          .insert({
            company_id: 'b0000000-0000-0000-0000-000000000001',
            phone_number: callData.phoneNumber || 'Не указан',
            audio_url: callData.url,
            status: 'pending',
            metadata: {
              agent_name: callData.agentName || 'Не указан',
              upload_method: 'url'
            }
          })
          .select()
          .single();

        if (callError) {
          console.error('Error creating call record:', callError);
          throw callError;
        }

        console.log('Call record created:', call);
      }

      toast({
        title: 'Успешно',
        description: `Загружено ${callUrls.length} звонков`,
      });

      setCallUrls([]);
      setIsOpen(false);
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading calls:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить звонки',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFromFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите файлы для загрузки',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      for (const file of selectedFiles) {
        console.log('Uploading file:', file.name);
        
        // Загружаем файл в Supabase Storage
        const fileName = `calls/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('call-recordings')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        // Получаем публичную ссылку
        const { data: urlData } = supabase.storage
          .from('call-recordings')
          .getPublicUrl(fileName);

        // Создаем запись звонка
        const { data: call, error: callError } = await supabase
          .from('calls')
          .insert({
            company_id: 'b0000000-0000-0000-0000-000000000001',
            phone_number: 'Загружен файл',
            audio_url: urlData.publicUrl,
            status: 'pending',
            metadata: {
              original_filename: file.name,
              file_size: file.size,
              upload_method: 'file'
            }
          })
          .select()
          .single();

        if (callError) {
          console.error('Error creating call record:', callError);
          throw callError;
        }

        console.log('Call record created:', call);
      }

      toast({
        title: 'Успешно',
        description: `Загружено ${selectedFiles.length} файлов`,
      });

      setSelectedFiles([]);
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
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Загрузить звонки
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Загрузка звонков</DialogTitle>
          <DialogDescription>
            Загрузите аудиозаписи звонков для анализа системой ИИ
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="urls" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="urls" className="flex items-center">
              <LinkIcon className="mr-2 h-4 w-4" />
              По ссылкам
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center">
              <Upload className="mr-2 h-4 w-4" />
              Локальные файлы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="urls" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="urls">Ссылки на аудиофайлы</Label>
                <Textarea
                  id="urls"
                  placeholder="Вставьте ссылки на аудиофайлы (по одной на строку)
https://example.com/call1.mp3
https://example.com/call2.wav"
                  value={urlList}
                  onChange={(e) => setUrlList(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={addUrlToList} 
                  className="mt-2"
                  disabled={!urlList.trim()}
                >
                  Добавить ссылки
                </Button>
              </div>

              {callUrls.length > 0 && (
                <div className="space-y-2">
                  <Label>Список звонков для загрузки</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                    {callUrls.map((call) => (
                      <div key={call.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{call.url}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUrl(call.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Номер телефона"
                            value={call.phoneNumber}
                            onChange={(e) => updateCallUrl(call.id, 'phoneNumber', e.target.value)}
                          />
                          <Input
                            placeholder="Имя агента"
                            value={call.agentName}
                            onChange={(e) => updateCallUrl(call.id, 'agentName', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={uploadFromUrls} 
                  disabled={loading || callUrls.length === 0}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Загрузить {callUrls.length} звонков
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="files">Выберите аудиофайлы</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept="audio/*,.mp3,.wav,.m4a"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Поддерживаемые форматы: MP3, WAV, M4A
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Выбранные файлы ({selectedFiles.length})</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={uploadFromFiles} 
                  disabled={loading || selectedFiles.length === 0}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Загрузить {selectedFiles.length} файлов
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
