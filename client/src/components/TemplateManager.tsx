
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Settings, 
  Edit, 
  Trash2,
  HardDrive,
  Cpu,
  MemoryStick,
  Code
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  ServerTemplate, 
  CreateTemplateInput,
  UpdateTemplateInput 
} from '../../../server/src/schema';

interface TemplateManagerProps {
  templates: ServerTemplate[];
  onTemplatesChange: (templates: ServerTemplate[]) => void;
}

export function TemplateManager({ templates, onTemplatesChange }: TemplateManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const [createForm, setCreateForm] = useState<CreateTemplateInput>({
    name: '',
    description: null,
    language: 'python',
    version: '',
    egg_id: 0,
    docker_image: '',
    startup_command: '',
    environment_variables: null,
    memory: 512,
    disk: 1024,
    cpu: 100
  });
  
  const [editForm, setEditForm] = useState<UpdateTemplateInput>({
    id: 0,
    name: '',
    description: null,
    language: 'python',
    version: '',
    egg_id: 0,
    docker_image: '',
    startup_command: '',
    environment_variables: null,
    memory: 512,
    disk: 1024,
    cpu: 100,
    is_active: true
  });

  const languageOptions = [
    { value: 'python', label: 'Python 🐍', versions: ['3.10', '3.11', '3.12'] },
    { value: 'nodejs', label: 'Node.js 📦', versions: ['18', '19', '20', '21'] }
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const newTemplate = await trpc.createTemplate.mutate(createForm);
      onTemplatesChange([...templates, newTemplate]);
      setCreateForm({
        name: '',
        description: null,
        language: 'python',
        version: '',
        egg_id: 0,
        docker_image: '',
        startup_command: '',
        environment_variables: null,
        memory: 512,
        disk: 1024,
        cpu: 100
      });
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    
    try {
      const updatedTemplate = await trpc.updateTemplate.mutate(editForm);
      onTemplatesChange(templates.map((template: ServerTemplate) => 
        template.id === isEditing ? updatedTemplate : template
      ));
      setIsEditing(null);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const startEdit = (template: ServerTemplate) => {
    setEditForm({
      id: template.id,
      name: template.name,
      description: template.description,
      language: template.language,
      version: template.version,
      egg_id: template.egg_id,
      docker_image: template.docker_image,
      startup_command: template.startup_command,
      environment_variables: template.environment_variables,
      memory: template.memory,
      disk: template.disk,
      cpu: template.cpu,
      is_active: template.is_active
    });
    setIsEditing(template.id);
    setEditDialogOpen(true);
  };

  const getLanguageIcon = (language: ServerTemplate['language']) => {
    return language === 'python' ? '🐍' : '📦';
  };

  const getVersionBadgeColor = (language: ServerTemplate['language']) => {
    return language === 'python' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Settings className="h-6 w-6 text-purple-500" />
            Template Server
          </h2>
          <p className="text-gray-600 mt-1">
            Kelola template untuk berbagai versi bahasa pemrograman
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 hover:bg-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Template Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nama Template</Label>
                  <Input
                    id="name"
                    placeholder="Python 3.11 Development"
                    value={createForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateForm((prev: CreateTemplateInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="language">Bahasa</Label>
                  <Select
                    value={createForm.language}
                    onValueChange={(value: 'python' | 'nodejs') =>
                      setCreateForm((prev: CreateTemplateInput) => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Template untuk development Python dengan dependencies standar..."
                  value={createForm.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateForm((prev: CreateTemplateInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="version">Versi</Label>
                  <Input
                    id="version"
                    placeholder="3.11"
                    value={createForm.version}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateForm((prev: CreateTemplateInput) => ({ ...prev, version: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="egg_id">Egg ID</Label>
                  <Input
                    id="egg_id"
                    type="number"
                    placeholder="1"
                    value={createForm.egg_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateForm((prev: CreateTemplateInput) => ({ 
                        ...prev, 
                        egg_id: parseInt(e.target.value) || 0 
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="docker_image">Docker Image</Label>
                <Input
                  id="docker_image"
                  placeholder="python:3.11-slim"
                  value={createForm.docker_image}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateTemplateInput) => ({ ...prev, docker_image: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="startup_command">Startup Command</Label>
                <Input
                  id="startup_command"
                  placeholder="python main.py"
                  value={createForm.startup_command}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateTemplateInput) => ({ ...prev, startup_command: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="memory">Memory (MB)</Label>
                  <Input
                    id="memory"
                    type="number"
                    value={createForm.memory}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateForm((prev: CreateTemplateInput) => ({ 
                        ...prev, 
                        memory: parseInt(e.target.value) || 512 
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="disk">Disk (MB)</Label>
                  <Input
                    id="disk"
                    type="number"
                    value={createForm.disk}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateForm((prev: CreateTemplateInput) => ({ 
                        ...prev, 
                        disk: parseInt(e.target.value) || 1024 
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cpu">CPU (%)</Label>
                  <Input
                    id="cpu"
                    type="number"
                    value={createForm.cpu}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateForm((prev: CreateTemplateInput) => ({ 
                        ...prev, 
                        cpu: parseInt(e.target.value) || 100 
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? '⏳ Membuat...' : '✅ Buat Template'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Belum ada template
            </h3>
            <p className="text-gray-500 mb-6">
              Buat template pertama untuk memulai membuat server
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template: ServerTemplate) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getLanguageIcon(template.language)}
                      </span>
                      {template.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {template.description || 'Tidak ada deskripsi'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getVersionBadgeColor(template.language)}>
                      {template.language} {template.version}
                    </Badge>
                    {template.is_active ? (
                      <Badge className="bg-green-100 text-green-800">
                        ✅ Aktif
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        ⏸️ Nonaktif
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MemoryStick className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Memory:</span>
                      <span>{template.memory} MB</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <HardDrive className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Disk:</span>
                      <span>{template.disk} MB</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Cpu className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">CPU:</span>
                      <span>{template.cpu}%</span>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium text-gray-600 flex items-center gap-2 mb-1">
                      <Code className="h-4 w-4" />
                      Startup Command:
                    </span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {template.startup_command}
                    </code>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Dibuat:</span> {template.created_at.toLocaleDateString('id-ID')}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startEdit(template)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_name">Nama Template</Label>
                <Input
                  id="edit_name"
                  value={editForm.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdateTemplateInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_language">Bahasa</Label>
                <Select
                  value={editForm.language || ''}
                  onValueChange={(value: 'python' | 'nodejs') =>
                    setEditForm((prev: UpdateTemplateInput) => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bahasa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_description">Deskripsi</Label>
              <Textarea
                id="edit_description"
                value={editForm.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditForm((prev: UpdateTemplateInput) => ({ 
                    ...prev, 
                    description: e.target.value || null 
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_memory">Memory (MB)</Label>
                <Input
                  id="edit_memory"
                  type="number"
                  value={editForm.memory || 512}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdateTemplateInput) => ({ 
                      ...prev, 
                      memory: parseInt(e.target.value) || 512 
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_disk">Disk (MB)</Label>
                <Input
                  id="edit_disk"
                  type="number"
                  value={editForm.disk || 1024}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdateTemplateInput) => ({ 
                      ...prev, 
                      disk: parseInt(e.target.value) || 1024 
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_cpu">CPU (%)</Label>
                <Input
                  id="edit_cpu"
                  type="number"
                  value={editForm.cpu || 100}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm((prev: UpdateTemplateInput) => ({ 
                      ...prev, 
                      cpu: parseInt(e.target.value) || 100 
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={editForm.is_active || false}
                onCheckedChange={(checked: boolean) =>
                  setEditForm((prev: UpdateTemplateInput) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="edit_is_active">Template aktif</Label>
            </div>

            <Button type="submit" className="w-full">
              💾 Simpan Perubahan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
