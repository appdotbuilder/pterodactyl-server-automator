
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Server, 
  Database, 
  Settings,
  MemoryStick,
  HardDrive,
  Cpu,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  PterodactylConnection, 
  ServerTemplate, 
  CreatedServer,
  CreateServerInput 
} from '../../../server/src/schema';

interface ServerCreatorProps {
  connections: PterodactylConnection[];
  templates: ServerTemplate[];
  onServerCreated: (server: CreatedServer) => void;
}

export function ServerCreator({ connections, templates, onServerCreated }: ServerCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<CreateServerInput>({
    connection_id: 0,
    template_id: 0,
    server_name: ''
  });

  const selectedConnectionData = connections.find((conn: PterodactylConnection) => 
    conn.id === selectedConnection
  );
  
  const selectedTemplateData = templates.find((template: ServerTemplate) => 
    template.id === selectedTemplate
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnection || !selectedTemplate) return;

    setIsCreating(true);
    try {
      const serverData: CreateServerInput = {
        connection_id: selectedConnection,
        template_id: selectedTemplate,
        server_name: formData.server_name
      };
      
      const newServer = await trpc.createServer.mutate(serverData);
      onServerCreated(newServer);
      
      // Reset form
      setFormData({
        connection_id: 0,
        template_id: 0,
        server_name: ''
      });
      setSelectedConnection(null);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to create server:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getLanguageIcon = (language: ServerTemplate['language']) => {
    return language === 'python' ? '🐍' : '📦';
  };

  const getVersionBadgeColor = (language: ServerTemplate['language']) => {
    return language === 'python' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  if (connections.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Tidak ada koneksi aktif
          </h3>
          <p className="text-gray-500 mb-6">
            Anda perlu menambahkan koneksi ke panel Pterodactyl terlebih dahulu
          </p>
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              💡 Buka tab "Koneksi" untuk menambahkan koneksi baru
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Tidak ada template tersedia
          </h3>
          <p className="text-gray-500 mb-6">
            Anda perlu membuat template server terlebih dahulu
          </p>
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              💡 Buka tab "Template" untuk membuat template baru
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Plus className="h-6 w-6 text-green-500" />
          Buat Server Baru
        </h2>
        <p className="text-gray-600 mt-1">
          Pilih koneksi dan template untuk membuat server Pterodactyl baru
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Konfigurasi Server
            </CardTitle>
            <CardDescription>
              Isi detail server yang akan dibuat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="server_name">Nama Server</Label>
                <Input
                  id="server_name"
                  placeholder="my-awesome-server"
                  value={formData.server_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateServerInput) => ({ ...prev, server_name: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="connection">Pilih Koneksi</Label>
                <Select
                  value={selectedConnection?.toString() || ''}
                  onValueChange={(value: string) => setSelectedConnection(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih koneksi panel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((connection: PterodactylConnection) => (
                      <SelectItem key={connection.id} value={connection.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>🔗</span>
                          <span>{connection.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {new URL(connection.panel_url).hostname}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="template">Pilih Template</Label>
                <Select
                  value={selectedTemplate?.toString() || ''}
                  onValueChange={(value: string) => setSelectedTemplate(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih template server..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template: ServerTemplate) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{getLanguageIcon(template.language)}</span>
                          <span>{template.name}</span>
                          <Badge className={getVersionBadgeColor(template.language)}>
                            {template.language} {template.version}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                disabled={isCreating || !selectedConnection || !selectedTemplate}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Membuat Server...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Server
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <div className="space-y-6">
          {/* Connection Preview */}
          {selectedConnectionData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Database className="h-5 w-5" />
                  Koneksi Terpilih
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedConnectionData.name}</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Aktif
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3" />
                    {selectedConnectionData.panel_url}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Template Preview */}
          {selectedTemplateData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <Settings className="h-5 w-5" />
                  Template Terpilih
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getLanguageIcon(selectedTemplateData.language)}
                  </span>
                  <div>
                    <h4 className="font-semibold">{selectedTemplateData.name}</h4>
                    <p className="text-sm text-gray-600">
                      {selectedTemplateData.description || 'Tidak ada deskripsi'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <MemoryStick className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                    <p className="text-sm font-medium">Memory</p>
                    <p className="text-xs text-gray-600">{selectedTemplateData.memory} MB</p>
                  </div>
                  <div className="text-center">
                    <HardDrive className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-sm font-medium">Disk</p>
                    <p className="text-xs text-gray-600">{selectedTemplateData.disk} MB</p>
                  </div>
                  <div className="text-center">
                    <Cpu className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                    <p className="text-sm font-medium">CPU</p>
                    <p className="text-xs text-gray-600">{selectedTemplateData.cpu}%</p>
                  </div>
                </div>

                <Separator />

                <div className="text-sm">
                  <p className="font-medium text-gray-600 mb-1">Startup Command:</p>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs block">
                    {selectedTemplateData.startup_command}
                  </code>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>💡 Perhatian:</strong> Proses pembuatan server membutuhkan waktu beberapa menit. 
              Server akan muncul di dashboard setelah berhasil dibuat.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
