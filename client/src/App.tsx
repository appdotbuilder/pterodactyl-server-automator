
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Server, 
  Plus, 
  Database, 
  ExternalLink, 
  Trash2,
  Settings,
  Zap
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  PterodactylConnection, 
  ServerTemplate, 
  CreatedServer 
} from '../../server/src/schema';
import { ConnectionManager } from './components/ConnectionManager';
import { TemplateManager } from './components/TemplateManager';
import { ServerCreator } from './components/ServerCreator';
import './App.css';

function App() {
  const [connections, setConnections] = useState<PterodactylConnection[]>([]);
  const [templates, setTemplates] = useState<ServerTemplate[]>([]);
  const [servers, setServers] = useState<CreatedServer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [connectionsResult, templatesResult, serversResult] = await Promise.all([
        trpc.getConnections.query(),
        trpc.getTemplates.query(),
        trpc.getServers.query()
      ]);
      
      setConnections(connectionsResult);
      setTemplates(templatesResult);
      setServers(serversResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeConnections = connections.filter((conn: PterodactylConnection) => conn.is_active);
  const activeTemplates = templates.filter((template: ServerTemplate) => template.is_active);
  const activeServers = servers.filter((server: CreatedServer) => server.status === 'active');

  const handleServerDeleted = async (serverId: number) => {
    try {
      await trpc.deleteServer.mutate({ id: serverId });
      setServers((prev: CreatedServer[]) => prev.filter(server => server.id !== serverId));
    } catch (error) {
      console.error('Failed to delete server:', error);
    }
  };

  const getStatusBadge = (status: CreatedServer['status']) => {
    const variants = {
      creating: { variant: 'secondary' as const, text: '⏳ Creating', class: 'bg-yellow-100 text-yellow-800' },
      active: { variant: 'default' as const, text: '✅ Active', class: 'bg-green-100 text-green-800' },
      failed: { variant: 'destructive' as const, text: '❌ Failed', class: 'bg-red-100 text-red-800' },
      deleted: { variant: 'outline' as const, text: '🗑️ Deleted', class: 'bg-gray-100 text-gray-800' }
    };
    
    const config = variants[status];
    return (
      <Badge className={config.class}>
        {config.text}
      </Badge>
    );
  };

  const getTemplateIcon = (language: ServerTemplate['language']) => {
    return language === 'python' ? '🐍' : '📦';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Server className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pterodactyl Server Manager
            </h1>
          </div>
          <p className="text-gray-600">
            🚀 Kelola dan buat server Pterodactyl dengan mudah
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Koneksi Aktif
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600">
                {activeConnections.length}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Template Tersedia
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-green-600">
                {activeTemplates.length}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Server Aktif
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-600">
                {activeServers.length}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Total Server
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-orange-600">
                {servers.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Koneksi
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Template
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Buat Server
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat data server...</p>
              </div>
            ) : (
              <>
                {servers.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        Belum ada server yang dibuat
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Mulai dengan membuat koneksi ke panel Pterodactyl dan pilih template server
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button 
                          onClick={() => setActiveTab('connections')}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Setup Koneksi
                        </Button>
                        <Button 
                          onClick={() => setActiveTab('create')} 
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Buat Server Baru
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Server Saya</h2>
                      <Button 
                        onClick={() => setActiveTab('create')}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Server Baru
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {servers.map((server: CreatedServer) => {
                        const connection = connections.find((conn: PterodactylConnection) => 
                          conn.id === server.connection_id
                        );
                        const template = templates.find((tmpl: ServerTemplate) => 
                          tmpl.id === server.template_id
                        );
                        
                        return (
                          <Card key={server.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="flex items-center gap-3">
                                    <span className="text-2xl">
                                      {template ? getTemplateIcon(template.language) : '📦'}
                                    </span>
                                    {server.server_name}
                                  </CardTitle>
                                  <CardDescription className="mt-1">
                                    {template && (
                                      <span className="inline-flex items-center gap-2">
                                        {template.name} • {template.language} {template.version}
                                      </span>
                                    )}
                                  </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(server.status)}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-600">Panel:</span>
                                    <p>{connection?.name || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Dibuat:</span>
                                    <p>{server.created_at.toLocaleDateString('id-ID')}</p>
                                  </div>
                                  {template && (
                                    <>
                                      <div>
                                        <span className="font-medium text-gray-600">Memory:</span>
                                        <p>{template.memory} MB</p>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600">Storage:</span>
                                        <p>{template.disk} MB</p>
                                      </div>
                                    </>
                                  )}
                                </div>
                                
                                {server.status === 'active' && (
                                  <div className="flex gap-2 pt-4 border-t">
                                    <Button 
                                      asChild 
                                      size="sm" 
                                      className="bg-blue-500 hover:bg-blue-600"
                                    >
                                      <a 
                                        href={server.server_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        Buka Panel
                                      </a>
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={() => handleServerDeleted(server.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Hapus
                                    </Button>
                                  </div>
                                )}
                                
                                {server.status === 'failed' && (
                                  <Alert className="border-red-200 bg-red-50">
                                    <AlertDescription className="text-red-700">
                                      ❌ Server gagal dibuat. Silakan coba lagi atau hubungi administrator.
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="connections">
            <ConnectionManager 
              connections={connections}
              onConnectionsChange={setConnections}
            />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateManager 
              templates={templates}
              onTemplatesChange={setTemplates}
            />
          </TabsContent>

          <TabsContent value="create">
            <ServerCreator 
              connections={activeConnections}
              templates={activeTemplates}
              onServerCreated={(newServer: CreatedServer) => {
                setServers((prev: CreatedServer[]) => [...prev, newServer]);
                setActiveTab('dashboard');
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
