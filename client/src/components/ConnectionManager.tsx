
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Database, 
  ExternalLink, 
  Edit, 
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  PterodactylConnection, 
  CreateConnectionInput,
  UpdateConnectionInput 
} from '../../../server/src/schema';

interface ConnectionManagerProps {
  connections: PterodactylConnection[];
  onConnectionsChange: (connections: PterodactylConnection[]) => void;
}

export function ConnectionManager({ connections, onConnectionsChange }: ConnectionManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const [createForm, setCreateForm] = useState<CreateConnectionInput>({
    panel_url: '',
    api_key: '',
    name: ''
  });
  
  const [editForm, setEditForm] = useState<UpdateConnectionInput>({
    id: 0,
    panel_url: '',
    api_key: '',
    name: '',
    is_active: true
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const newConnection = await trpc.createConnection.mutate(createForm);
      onConnectionsChange([...connections, newConnection]);
      setCreateForm({ panel_url: '', api_key: '', name: '' });
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create connection:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    
    try {
      const updatedConnection = await trpc.updateConnection.mutate(editForm);
      onConnectionsChange(connections.map((conn: PterodactylConnection) => 
        conn.id === isEditing ? updatedConnection : conn
      ));
      setIsEditing(null);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update connection:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus koneksi ini?')) return;
    
    try {
      await trpc.deleteConnection.mutate({ id });
      onConnectionsChange(connections.filter((conn: PterodactylConnection) => conn.id !== id));
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  const startEdit = (connection: PterodactylConnection) => {
    setEditForm({
      id: connection.id,
      panel_url: connection.panel_url,
      api_key: connection.api_key,
      name: connection.name,
      is_active: connection.is_active
    });
    setIsEditing(connection.id);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Database className="h-6 w-6 text-blue-500" />
            Koneksi Pterodactyl
          </h2>
          <p className="text-gray-600 mt-1">
            Kelola koneksi ke panel Pterodactyl Anda
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Koneksi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Koneksi Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Koneksi</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Server Production"
                  value={createForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateConnectionInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="panel_url">URL Panel</Label>
                <Input
                  id="panel_url"
                  type="url"
                  placeholder="https://panel.example.com"
                  value={createForm.panel_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateConnectionInput) => ({ ...prev, panel_url: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="ptla_..."
                  value={createForm.api_key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateConnectionInput) => ({ ...prev, api_key: e.target.value }))
                  }
                  required
                />
              </div>
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? '⏳ Membuat...' : '✅ Buat Koneksi'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {connections.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Belum ada koneksi
            </h3>
            <p className="text-gray-500 mb-6">
              Tambahkan koneksi pertama Anda ke panel Pterodactyl
            </p>
            <Alert className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                💡 Anda perlu API key dari panel Pterodactyl dengan permission 'Application API'
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map((connection: PterodactylConnection) => (
            <Card key={connection.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">🔗</span>
                      {connection.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {connection.panel_url}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {connection.is_active ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Nonaktif
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Dibuat:</span>
                      <p>{connection.created_at.toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Terakhir diperbarui:</span>
                      <p>{connection.updated_at.toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button 
                      asChild 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                    >
                      <a 
                        href={connection.panel_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Buka Panel
                      </a>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startEdit(connection)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDelete(connection.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Koneksi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Nama Koneksi</Label>
              <Input
                id="edit_name"
                value={editForm.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateConnectionInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_panel_url">URL Panel</Label>
              <Input
                id="edit_panel_url"
                type="url"
                value={editForm.panel_url || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateConnectionInput) => ({ ...prev, panel_url: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_api_key">API Key</Label>
              <Input
                id="edit_api_key"
                type="password"
                value={editForm.api_key || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateConnectionInput) => ({ ...prev, api_key: e.target.value }))
                }
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={editForm.is_active || false}
                onCheckedChange={(checked: boolean) =>
                  setEditForm((prev: UpdateConnectionInput) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="edit_is_active">Koneksi aktif</Label>
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
